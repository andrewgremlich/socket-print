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

self.onmessage = (event) => {
	const { positions } = event.data;
	const scene = new Scene();
	const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
	const renderer = new WebGLRenderer({ canvas: new OffscreenCanvas(500, 500) });

	renderer.render(scene, camera);

	const rawgeometry = new BufferGeometry();
	const positionAttr = new Float32Array(positions);
	rawgeometry.setAttribute("position", new BufferAttribute(positionAttr, 3));

	rawgeometry.computeBoundingBox();
	rawgeometry.computeBoundingSphere();
	rawgeometry.computeVertexNormals();
	ensureUV(rawgeometry);

	const geometry = BufferGeometryUtils.mergeVertices(rawgeometry);
	const mesh = new Mesh(
		geometry,
		new MeshStandardMaterial({
			color: 0x00ff00,
			side: DoubleSide,
		}),
	);

	scene.add(mesh);

	const verticalAxis = "y";
	const layerHeight = 1; //TODO: these might need to be customizable.
	const segments = 50;
	const incrementHeight = true;

	if (layerHeight <= 0) {
		throw new Error("Layer height must be greater than 0.");
	}

	if (segments <= 0) {
		throw new Error("Segments must be greater than 0.");
	}

	if (verticalAxis !== "y" && verticalAxis !== "z") {
		throw new Error("Vertical axis must be either 'y' or 'z'.");
	}

	const angleIncrement = (Math.PI * 2) / segments;
	const pointGatherer: Vector3[][] = [];

	const raycaster = new Raycaster();
	const ray = raycaster.ray;

	const boundingBox = new Box3().setFromObject(mesh);
	const center = boundingBox.getCenter(new Vector3());
	const minHeight = boundingBox.min[verticalAxis];
	const maxHeight = boundingBox.max[verticalAxis];
	const centerX = center.x;
	const centerZ = center.z;

	ray.direction.set(0, 0, -1);

	for (
		let heightPosition = minHeight;
		heightPosition < maxHeight;
		heightPosition += layerHeight
	) {
		const pointLevel: Vector3[] = [];

		self.postMessage({
			type: "progress",
			data: heightPosition / maxHeight,
		});

		for (let angle = 0; angle < Math.PI * 2; angle += angleIncrement) {
			const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
			const adjustedHeight = incrementHeight
				? heightPosition + (angle / (Math.PI * 2)) * layerHeight
				: heightPosition;

			ray.origin.set(centerX, adjustedHeight, centerZ);
			ray.direction.copy(direction);

			const intersects = raycaster.intersectObject(mesh);

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
