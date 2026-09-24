import { round } from "mathjs";

// Compensates E-axis feedrate (F) for the extruder's nonlinear output.
// Measured grams/screw-rev falls as F rises; this scales F up to compensate,
// so mass flow stays consistent from the bottom to the top of a part.

interface CalibrationPoint {
	f: number; // E-axis feedrate (mm/min)
	gramsPerRev: number; // measured output at that feedrate
}

// From bench testing (RPM 40-90 / F 1253-2820).
// NOTE: F=2193 and F=2506 both show 0.09 g/rev, and the 70 RPM row's
// reported "increase factor" (1.30) doesn't match 0.13/0.09 (=1.44) the way
// every other row does. Verify this row before trusting it.
const CALIBRATION: CalibrationPoint[] = [
	{ f: 1253, gramsPerRev: 0.19 },
	{ f: 1567, gramsPerRev: 0.13 },
	{ f: 1880, gramsPerRev: 0.11 },
	{ f: 2193, gramsPerRev: 0.09 },
	{ f: 2506, gramsPerRev: 0.09 },
	{ f: 2820, gramsPerRev: 0.08 },
].sort((a, b) => a.f - b.f);

// True if f falls within the range this table was actually measured over.
// A different model can reuse this same table (it's a hardware property,
// not a geometry property) as long as its required F stays in range.
export const isWithinCalibratedRange = (f: number): boolean =>
	f >= CALIBRATION[0].f && f <= CALIBRATION[CALIBRATION.length - 1].f;

// Piecewise-linear interpolation of measured output at a given F.
// Out-of-range F is clamped to the nearest calibration endpoint, with a
// warning — treat that as a sign the table needs new calibration points
// for this model's range, not as a trustworthy correction.
// Swap this function's body for the client's fitted equation/table when
// it's ready — nothing downstream needs to change.
const gramsPerRevAtF = (f: number): number => {
	if (!isWithinCalibratedRange(f)) {
		console.warn(
			`F=${f} is outside the calibrated range (${CALIBRATION[0].f}-${
				CALIBRATION[CALIBRATION.length - 1].f
			}). Clamping to nearest endpoint — recalibrate for this range.`,
		);
	}
	if (f <= CALIBRATION[0].f) return CALIBRATION[0].gramsPerRev;
	const last = CALIBRATION[CALIBRATION.length - 1];
	if (f >= last.f) return last.gramsPerRev;

	for (let i = 0; i < CALIBRATION.length - 1; i++) {
		const a = CALIBRATION[i];
		const b = CALIBRATION[i + 1];
		if (f >= a.f && f <= b.f) {
			const t = (f - a.f) / (b.f - a.f);
			return a.gramsPerRev + t * (b.gramsPerRev - a.gramsPerRev);
		}
	}
	throw new Error(`Unreachable: f=${f}`);
};

// Multiplier to apply to a commanded F so actual output matches the
// reference point's output. Defaults to F=1567 (the 50 RPM baseline in
// the email); pass 1253 to shift the zero-point to 40 RPM instead.
export const getOutputFactor = (f: number, referenceF = 1567): number =>
	gramsPerRevAtF(referenceF) / gramsPerRevAtF(f);

// Apply the correction to a level-by-level feedrate array — e.g. the
// output of calculateFeedratePerLevel.
export const correctFeedratesForOutput = (
	feedrates: number[],
	referenceF = 1567,
): number[] => feedrates.map((f) => round(f * getOutputFactor(f, referenceF)));
