import { round } from "mathjs";

interface CalibrationPoint {
	f: number; // E-axis feedrate (mm/min)
	gramsPerRev: number; // measured output at that feedrate
}

const CALIBRATION: CalibrationPoint[] = [
	{ f: 1253, gramsPerRev: 0.19 },
	{ f: 1567, gramsPerRev: 0.13 },
	{ f: 1880, gramsPerRev: 0.11 },
	{ f: 2193, gramsPerRev: 0.09 },
	{ f: 2506, gramsPerRev: 0.09 },
	{ f: 2820, gramsPerRev: 0.08 },
].sort((a, b) => a.f - b.f);

export const isWithinCalibratedRange = (f: number): boolean =>
	f >= CALIBRATION[0].f && f <= CALIBRATION[CALIBRATION.length - 1].f;

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

export const getOutputFactor = (f: number, referenceF = 1567): number =>
	gramsPerRevAtF(referenceF) / gramsPerRevAtF(f);

export const correctFeedratesForOutput = (
	feedrates: number[],
	referenceF = 1567,
): number[] => feedrates.map((f) => round(f * getOutputFactor(f, referenceF)));
