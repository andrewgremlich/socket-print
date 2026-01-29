import type { Vector3 } from "three";
import type { TrimLine } from "@/classes/TrimLine";

/**
 * Filters sliced layer points, removing points that are above the trim line.
 * Points above the trim line will not be printed.
 *
 * @param vectors - 2D array of Vector3 points, organized by layer
 * @param trimLine - TrimLine instance with the trim line data
 * @returns Filtered 2D array with points above trim line removed
 */
export function filterPointsByTrimLine(
	vectors: Vector3[][],
	trimLine: TrimLine,
): Vector3[][] {
	const trimPoints = trimLine.getPoints();

	// If no trim line or only one point, return original vectors
	if (trimPoints.length < 2) {
		return vectors;
	}

	return vectors
		.map((layer) =>
			layer.filter((point) => !trimLine.isPointAboveTrimLine(point)),
		)
		.filter((layer) => layer.length > 0); // Remove empty layers
}

/**
 * Standalone function to check if a point is above a trim line.
 * Uses angle-based interpolation around the circumference.
 *
 * @param point - The 3D point to check
 * @param trimLinePoints - Array of Vector3 points defining the trim line
 * @returns true if the point is above the trim line
 */
export function isPointAboveTrimLine(
	point: Vector3,
	trimLinePoints: Vector3[],
): boolean {
	if (trimLinePoints.length < 2) return false;

	const pointAngle = Math.atan2(point.z, point.x);
	const trimHeight = interpolateHeightAtAngle(pointAngle, trimLinePoints);

	return point.y > trimHeight;
}

/**
 * Interpolates the trim line height at a given angle.
 *
 * @param targetAngle - The angle in radians (from atan2)
 * @param trimLinePoints - Array of Vector3 points defining the trim line
 * @returns The interpolated Y height at the given angle
 */
export function interpolateHeightAtAngle(
	targetAngle: number,
	trimLinePoints: Vector3[],
): number {
	if (trimLinePoints.length === 0) return Number.POSITIVE_INFINITY;
	if (trimLinePoints.length === 1) return trimLinePoints[0].y;

	// Convert all trim points to angle/height pairs
	const angleHeightPairs = trimLinePoints.map((p) => ({
		angle: Math.atan2(p.z, p.x),
		height: p.y,
	}));

	// Sort by angle
	angleHeightPairs.sort((a, b) => a.angle - b.angle);

	// Normalize target angle to [-PI, PI]
	let normalizedTarget = targetAngle;
	while (normalizedTarget > Math.PI) normalizedTarget -= 2 * Math.PI;
	while (normalizedTarget < -Math.PI) normalizedTarget += 2 * Math.PI;

	// Find the two adjacent points for interpolation
	let lowerIdx = -1;
	let upperIdx = -1;

	for (let i = 0; i < angleHeightPairs.length; i++) {
		if (angleHeightPairs[i].angle <= normalizedTarget) {
			lowerIdx = i;
		}
		if (angleHeightPairs[i].angle >= normalizedTarget && upperIdx === -1) {
			upperIdx = i;
		}
	}

	// Handle edge cases (wrap around)
	if (lowerIdx === -1) lowerIdx = angleHeightPairs.length - 1;
	if (upperIdx === -1) upperIdx = 0;

	const lower = angleHeightPairs[lowerIdx];
	const upper = angleHeightPairs[upperIdx];

	// If same point or same angle, return that height
	if (lowerIdx === upperIdx || lower.angle === upper.angle) {
		return lower.height;
	}

	// Linear interpolation
	let angleDiff = upper.angle - lower.angle;
	let angleOffset = normalizedTarget - lower.angle;

	// Handle wrap-around
	if (angleDiff < 0) angleDiff += 2 * Math.PI;
	if (angleOffset < 0) angleOffset += 2 * Math.PI;

	const t = angleDiff !== 0 ? angleOffset / angleDiff : 0;
	return lower.height + t * (upper.height - lower.height);
}
