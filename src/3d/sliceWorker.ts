import { ceil, cos, pi, sin } from "mathjs";
import {
	Box3,
	BufferAttribute,
	BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	PerspectiveCamera,
	Raycaster,
	Scene,
	Vector3,
	WebGLRenderer,
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

self.onmessage = async (
	event: MessageEvent<{
		positions: number[];
	}>,
) => {
	const { positions } = event.data;
	const layerHeight = await getLayerHeight();
	const segments = await getCircularSegments();
	const nozzleSize = await getNozzleSize();
	const socketHeight = (await getCupSizeHeight()) + nozzleSize;
	const angleIncrement = (pi * 2) / segments;
	const scene = new Scene();
	const renderer = new WebGLRenderer({ canvas: new OffscreenCanvas(100, 100) });
	const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
	const rawgeometry = new BufferGeometry();

	camera.position.set(0, 0, 10);
	renderer.render(scene, camera);

	rawgeometry.setAttribute(
		"position",
		new BufferAttribute(new Float32Array(positions), 3),
	);
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

	camera.lookAt(center);
	scene.add(mesh);
	mesh.geometry.computeBoundsTree = computeBoundsTree;
	mesh.geometry.disposeBoundsTree = disposeBoundsTree;
	mesh.geometry.boundsTree = bvh;
	mesh.updateMatrixWorld(true);

	const pointGatherer: Vector3[][] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;

	// Threshold for minimum points required per layer (percentage of segments)
	const MIN_POINTS_THRESHOLD = 0.95;
	const minPointsRequired = Math.floor(segments * MIN_POINTS_THRESHOLD);

	// Maximum allowed gap in consecutive points (in terms of angle indices)
	const MAX_CONSECUTIVE_MISSING = 3;

	for (
		let heightPosition = 0;
		heightPosition < maxHeight;
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
				// Detect if we have too many consecutive missing points
				if (consecutiveMissing > MAX_CONSECUTIVE_MISSING) {
					hasLargeGap = true;
				}
			}
		}

		// Stop collecting layers if we don't have enough points OR if there's a large gap
		if (pointLevel.length < minPointsRequired || hasLargeGap) {
			break;
		}

		pointGatherer.push(pointLevel);
	}

	self.postMessage({
		type: SliceWorkerStatus.DONE,
		data: pointGatherer,
	});
};
