import Clipper2Z from "clipper2z"; //"clipper2-wasm"
import { atan2, cos, sin, sqrt } from "mathjs";
import { Vector3 } from "three";

import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";

type RawPoint = { x: number; y: number; z: number };

// example https://eriksom.github.io/Clipper2-WASM/clipper2-wasm/examples/es/offset.html
export async function clipper2Offset() {
	const { MakePath64, Paths64, InflatePaths64, JoinType, EndType } =
		await Clipper2Z();

	const subject = new Paths64();

	subject.push_back(MakePath64([150, 100, 60, 129, 115, 52, 115, 148, 60, 71]));

	console.log("SUBJECT", subject);

	const inflated = InflatePaths64(
		subject,
		10,
		JoinType.Square,
		EndType.Polygon,
		2,
		0,
	);

	console.log("INFLATED", inflated);

	const size = inflated.size();

	for (let i = 0; i < size; i++) {
		const point = inflated.get(i);

		const x = Number(point.x);
		const y = Number(point.y);

		console.log(`POINT ${i}`, x, y);
	}
}

export async function adjustForShrinkAndOffset(
	points: RawPoint[][],
	center: Vector3,
): Promise<Vector3[][]> {
	const shrinkAllowance = await getActiveMaterialProfileShrinkFactor();
	const nozzleSize = await getNozzleSize();

	if (shrinkAllowance === 0) {
		return points.map((layer) =>
			layer.map((pt) => new Vector3(pt.x, pt.y, pt.z)),
		);
	}

	const adjustedPoints: Vector3[][] = [];

	for (const layer of points) {
		const adjustedLayer: Vector3[] = [];

		for (const pt of layer) {
			const dx = pt.x - center.x;
			const dz = pt.z - center.z;
			const distance = sqrt(dx * dx + dz * dz) as number;
			const theta = atan2(dz, dx);
			const newRadius =
				(distance + nozzleSize / 2) * (1 + shrinkAllowance / 100); // this math is probably right.

			// Create new adjusted point and shift it back to the original coordinate system
			adjustedLayer.push(
				new Vector3(
					center.x + newRadius * cos(theta),
					pt.y,
					center.z + newRadius * sin(theta),
				),
			);
		}
		adjustedPoints.push(adjustedLayer);
	}

	return adjustedPoints;
}
