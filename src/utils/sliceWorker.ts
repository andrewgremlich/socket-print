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

import { ensureUV } from "./ensureUV";

type SliceWorker = {
	positions: number[];
	verticalAxis: "y" | "z";
	layerHeight: number;
	segments: number;
	incrementHeight: boolean;
};

// TODO: this does from bottom to top. perhaps look at doing it from top to bottom?
self.onmessage = (event: MessageEvent<SliceWorker>) => {
	const { positions, verticalAxis, layerHeight, segments, incrementHeight } =
		event.data;

	if (layerHeight <= 0) {
		throw new Error("Layer height must be greater than 0.");
	}

	if (segments <= 0) {
		throw new Error("Segments must be greater than 0.");
	}

	if (verticalAxis !== "y" && verticalAxis !== "z") {
		throw new Error("Vertical axis must be either 'y' or 'z'.");
	}

	const scene = new Scene();
	const renderer = new WebGLRenderer({ canvas: new OffscreenCanvas(500, 500) });
	const rawgeometry = new BufferGeometry();

	renderer.render(scene, new PerspectiveCamera(75, 1, 0.1, 1000));

	rawgeometry.setAttribute(
		"position",
		new BufferAttribute(new Float32Array(positions), 3),
	);
	rawgeometry.computeBoundingBox();
	rawgeometry.computeBoundingSphere();
	rawgeometry.computeVertexNormals();
	ensureUV(rawgeometry);

	const mesh = new Mesh(
		BufferGeometryUtils.mergeVertices(rawgeometry),
		new MeshStandardMaterial({
			color: 0x00ff00,
			side: DoubleSide,
		}),
	);
	const boundingBox = new Box3().setFromObject(mesh);
	const center = boundingBox.getCenter(new Vector3());
	const maxHeight = boundingBox.max[verticalAxis];

	scene.add(mesh);

	const angleIncrement = (Math.PI * 2) / segments;
	const pointGatherer: Vector3[][] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;

	ray.direction.set(0, 0, -1);

	for (
		let heightPosition = boundingBox.min[verticalAxis];
		heightPosition < maxHeight;
		heightPosition += layerHeight
	) {
		const pointLevel: Vector3[] = [];

		self.postMessage({
			type: "progress",
			data: heightPosition / maxHeight,
		});

		for (let angle = 0; angle < Math.PI * 2; angle += angleIncrement) {
			direction.set(Math.cos(angle), 0, Math.sin(angle));

			ray.origin.set(
				center.x,
				incrementHeight
					? heightPosition + (angle / (Math.PI * 2)) * layerHeight
					: heightPosition,
				center.z,
			);
			ray.direction.copy(direction);

			const intersects = raycaster.intersectObject(mesh);

			//TODO: I'll need to augment the intersection to accomodate for shrink.

			if (intersects.length > 0) {
				const intersection = intersects[intersects.length - 1].point;

				pointLevel.push(intersection);
			} else {
				console.error("No intersection found for this ray.");
			}
		}

		pointGatherer.push(pointLevel);
	}

	self.postMessage({
		type: "done",
		data: pointGatherer,
	});
};
