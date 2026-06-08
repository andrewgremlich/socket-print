import { ceil, cos, pi, sin } from "mathjs";
import {
	Box3,
	BufferAttribute,
	BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Raycaster,
	Vector3,
} from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { getCircularSegments } from "../db/appSettingsDbActions";
import {
	getCupSizeHeight,
	getLayerHeight,
	getNozzleSize,
} from "../db/formValuesDbActions";
import { ensureUV } from "./ensureUV";

Mesh.prototype.raycast = acceleratedRaycast;

export enum SliceWorkerStatus {
	DONE = "done",
	PROGRESS = "progress",
}

export enum SliceMode {
	VASE = "vase",
	JACKET = "jacket",
}

type SliceParams = {
	mesh: Mesh;
	center: Vector3;
	maxHeight: number;
	layerHeight: number;
	segments: number;
	socketHeight: number;
};

function vaseMode({
	mesh,
	center,
	maxHeight,
	layerHeight,
	segments,
	socketHeight,
}: SliceParams): Vector3[][] {
	const angleIncrement = (pi * 2) / segments;
	const pointGatherer: Vector3[][] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;

	const MIN_POINTS_THRESHOLD = 0.95;
	const minPointsRequired = Math.floor(segments * MIN_POINTS_THRESHOLD);
	const MAX_CONSECUTIVE_MISSING = 3;
	const trimTop = 2 * layerHeight;

	for (
		let heightPosition = 0;
		heightPosition < maxHeight - trimTop;
		heightPosition += layerHeight
	) {
		const pointLevel: Vector3[] = [];
		let consecutiveMissing = 0;
		let hasLargeGap = false;

		self.postMessage({
			type: SliceWorkerStatus.PROGRESS,
			data: ceil(heightPosition / maxHeight, 2),
		});

		const startAngle = pi;
		for (
			let angle = startAngle;
			angle < startAngle + pi * 2;
			angle += angleIncrement
		) {
			const height =
				heightPosition + ((angle - startAngle) / (pi * 2)) * layerHeight;

			const xdirection = cos(-angle);
			const zdirection = sin(-angle);

			direction.set(xdirection, 0, zdirection).normalize();
			ray.origin.set(center.x, height, center.z);
			ray.direction.copy(direction);
			const intersects = raycaster.intersectObject(mesh);

			if (intersects.length > 0) {
				const intersection = intersects[intersects.length - 1].point;

				intersection.add(new Vector3(0, socketHeight, 0));
				pointLevel.push(intersection);
				consecutiveMissing = 0;
			} else {
				consecutiveMissing++;
				if (consecutiveMissing > MAX_CONSECUTIVE_MISSING) {
					hasLargeGap = true;
				}
			}
		}

		if (pointLevel.length < minPointsRequired || hasLargeGap) {
			break;
		}

		pointGatherer.push(pointLevel);
	}

	return pointGatherer;
}

function detectOpening(
	mesh: Mesh,
	center: Vector3,
	heightPosition: number,
	segments: number,
	angleIncrement: number,
): { startIdx: number; endIdx: number } | null {
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;
	const hits: boolean[] = new Array(segments);
	const startAngle = pi;

	for (let i = 0; i < segments; i++) {
		const angle = startAngle + i * angleIncrement;
		direction.set(cos(-angle), 0, sin(-angle)).normalize();
		ray.origin.set(center.x, heightPosition, center.z);
		ray.direction.copy(direction);
		hits[i] = raycaster.intersectObject(mesh).length > 0;
	}

	// Find the longest contiguous miss run, treating the array as circular.
	let bestStart = -1;
	let bestLen = 0;
	let i = 0;
	while (i < segments * 2) {
		if (hits[i % segments]) {
			i++;
			continue;
		}
		const runStart = i;
		while (i < segments * 2 && !hits[i % segments]) i++;
		const runLen = i - runStart;
		if (runLen > bestLen) {
			bestLen = runLen;
			bestStart = runStart % segments;
		}
		if (runLen >= segments) break; // Full miss — no opening to detect
	}

	// Only count as an opening if the miss run exceeds the noise tolerance.
	if (bestLen <= 3 || bestLen >= segments) return null;

	return {
		startIdx: bestStart,
		endIdx: (bestStart + bestLen - 1) % segments,
	};
}

function jacketMode({
	mesh,
	center,
	maxHeight,
	layerHeight,
	segments,
	socketHeight,
}: SliceParams): Vector3[][] {
	const angleIncrement = (pi * 2) / segments;
	const pointGatherer: Vector3[][] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;
	const startAngle = pi;
	const trimTop = 2 * layerHeight;

	const opening = detectOpening(
		mesh,
		center,
		layerHeight,
		segments,
		angleIncrement,
	);

	if (!opening) {
		throw new Error(
			"No opening detected — jacket mode requires a mesh with a lace opening.",
		);
	}

	// Build the ordered list of solid-arc angle indices: from just-after openingEnd
	// to just-before openingStart, wrapping around the circle.
	const arcIndices: number[] = [];
	let idx = (opening.endIdx + 1) % segments;
	while (idx !== opening.startIdx) {
		arcIndices.push(idx);
		idx = (idx + 1) % segments;
	}

	let layerIndex = 0;
	for (
		let heightPosition = 0;
		heightPosition < maxHeight - trimTop;
		heightPosition += layerHeight
	) {
		self.postMessage({
			type: SliceWorkerStatus.PROGRESS,
			data: ceil(heightPosition / maxHeight, 2),
		});

		const sweep = layerIndex % 2 === 0 ? arcIndices : [...arcIndices].reverse();
		const pointLevel: Vector3[] = [];

		for (const i of sweep) {
			const angle = startAngle + i * angleIncrement;
			direction.set(cos(-angle), 0, sin(-angle)).normalize();
			ray.origin.set(center.x, heightPosition, center.z);
			ray.direction.copy(direction);
			const intersects = raycaster.intersectObject(mesh);

			if (intersects.length > 0) {
				const intersection = intersects[intersects.length - 1].point;
				intersection.add(new Vector3(0, socketHeight, 0));
				pointLevel.push(intersection);
			}
		}

		if (pointLevel.length === 0) break;

		pointGatherer.push(pointLevel);
		layerIndex++;
	}

	return pointGatherer;
}

self.onmessage = async (
	event: MessageEvent<{
		positions: Float32Array;
		mode?: SliceMode;
	}>,
) => {
	const { positions, mode = SliceMode.VASE } = event.data;
	const layerHeight = await getLayerHeight();
	const segments = await getCircularSegments();
	const nozzleSize = await getNozzleSize();
	const socketHeight = (await getCupSizeHeight()) + nozzleSize;
	const rawgeometry = new BufferGeometry();

	rawgeometry.setAttribute("position", new BufferAttribute(positions, 3));
	rawgeometry.computeBoundingBox();
	rawgeometry.computeBoundingSphere();
	rawgeometry.computeVertexNormals();
	rawgeometry.setIndex([
		...Array(rawgeometry.attributes.position.count).keys(),
	]);
	ensureUV(rawgeometry);

	const mesh = new Mesh(
		BufferGeometryUtils.mergeVertices(rawgeometry, 1e-5),
		new MeshStandardMaterial({
			color: 0x00ff00,
			side: DoubleSide,
		}),
	);

	const bvh = new MeshBVH(mesh.geometry);

	const boundingBox = new Box3().setFromObject(mesh);
	const center = boundingBox.getCenter(new Vector3());
	const maxHeight = boundingBox.max.y;

	mesh.geometry.computeBoundsTree = computeBoundsTree;
	mesh.geometry.disposeBoundsTree = disposeBoundsTree;
	mesh.geometry.boundsTree = bvh;
	mesh.updateMatrixWorld(true);

	const params: SliceParams = {
		mesh,
		center,
		maxHeight,
		layerHeight,
		segments,
		socketHeight,
	};

	const pointGatherer =
		mode === SliceMode.JACKET ? jacketMode(params) : vaseMode(params);

	self.postMessage({
		type: SliceWorkerStatus.DONE,
		data: pointGatherer,
	});
};
