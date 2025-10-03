/**
 * Calculates the G-code E value (in servo revolutions) required to extrude the
 * correct volume for a linear move of the provided distance, using the new
 * volumetric model provided in the calibration feedback.
 *
 * Given (from calibration):
 *  - 0.2 g per screw revolution
 *  - 1 g = 1115 mm^3 (cubic millimeters)
 *  - Therefore: Cmm (cubic mm per screw rev) = 0.2 * 1115 = 223 mm^3
 *  - Extrudate length per screw revolution (El_screw):
 *        El_screw = Cmm / (Na / Nd / Lh)
 *        where Na = nozzle area = π * (Nd/2)^2
 *  - Gear / drive ratio: 3.875 : 1 (servo revs : screw rev) ⇒
 *        servo revs per screw rev = 3.875
 *
 * From this we derive:
 *   El_screw = Cmm / (NozzleArea / NozzleDiameter / LayerHeight)
 *   El_servo = El_screw / SERVO_PER_SCREW_REV
 *   servo revs per mm extrudate = 1 / El_servo
 *   E (servo revs for a linear move) = distance * (1 / El_servo)
 *
 * We return E so that firmware configured with steps-per-servo-rev will drive
 * the correct amount of material.
 */
export function getExtrusionCalculation({
	distance,
	nozzleSize,
	layerHeight,
}: {
	distance: number;
	nozzleSize: number;
	layerHeight: number;
}) {
	if (distance <= 0 || nozzleSize <= 0 || layerHeight <= 0) return 0;

	// Calibration / physical constants
	const GRAMS_PER_SCREW_REV = 0.2; // g / screw revolution
	const CUBIC_MM_PER_GRAM = 1115; // mm^3 / g (material density derived)
	const CMM_PER_SCREW_REV = GRAMS_PER_SCREW_REV * CUBIC_MM_PER_GRAM; // 223 mm^3 / screw rev
	const SERVO_PER_SCREW_REV = 3.875; // servo revs per screw revolution

	// Geometry
	const nozzleArea = Math.PI * (nozzleSize / 2) ** 2; // mm^2

	// Extrudate length per screw revolution (mm of laid down path per screw rev)
	const extrudateLengthPerScrewRev =
		CMM_PER_SCREW_REV / (nozzleArea / nozzleSize / layerHeight);

	// Convert to servo revolution domain
	const extrudateLengthPerServoRev =
		extrudateLengthPerScrewRev / SERVO_PER_SCREW_REV;

	const servoRevsPerMM = 1 / extrudateLengthPerServoRev;

	const E = distance * servoRevsPerMM * 7.7;

	// Debug info (kept for now; can be silenced later or gated behind env flag)
	console.log(
		"[extrusion]",
		JSON.stringify(
			{
				distance,
				nozzleSize,
				layerHeight,
				nozzleArea,
				CMM_PER_SCREW_REV,
				extrudateLengthPerScrewRev: Number(
					extrudateLengthPerScrewRev.toFixed(4),
				),
				extrudateLengthPerServoRev: Number(
					extrudateLengthPerServoRev.toFixed(4),
				),
				servoRevsPerMM: Number(servoRevsPerMM.toFixed(6)),
				E: Number(E.toFixed(4)),
			},
			null,
			2,
		),
	);

	return E;
}
