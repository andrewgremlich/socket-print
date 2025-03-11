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
	getCircularSegments,
	getCupSizeHeight,
	getLayerHeight,
} from "../db/appSettings";
import { ensureUV } from "./ensureUV";

type SliceWorker = {
	positions: number[];
	verticalAxis: "y" | "z";
	incrementHeight: boolean;
};

self.onmessage = async (event: MessageEvent<SliceWorker>) => {
	const { positions, verticalAxis, incrementHeight } = event.data;
	const layerHeight = await getLayerHeight();
	const segments = await getCircularSegments();

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
	const renderer = new WebGLRenderer({ canvas: new OffscreenCanvas(100, 100) });
	const rawgeometry = new BufferGeometry();

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
	const boundingBox = new Box3().setFromObject(mesh);
	const center = boundingBox.getCenter(new Vector3());
	const maxHeight = boundingBox.max[verticalAxis];
	const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
	camera.position.set(0, 0, 10);
	camera.lookAt(center);
	renderer.render(scene, camera);

	scene.add(mesh);
	mesh.updateMatrixWorld(true);

	const angleIncrement = (Math.PI * 2) / segments;
	const pointGatherer: Vector3[] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;

	ray.direction.set(0, 0, -1).normalize();

	const socketHeight = (await getCupSizeHeight()) + 5;

	for (
		let heightPosition = 0;
		heightPosition < maxHeight;
		heightPosition += layerHeight
	) {
		self.postMessage({
			type: "progress",
			data: heightPosition / maxHeight,
		});

		for (let angle = 0; angle < Math.PI * 2; angle += angleIncrement) {
			const height = incrementHeight
				? heightPosition + (angle / (Math.PI * 2)) * layerHeight
				: heightPosition;
			const xdirection = Math.cos(angle);
			const zdirection = Math.sin(angle);

			direction.set(xdirection, 0, zdirection);
			raycaster.set(new Vector3(center.x, height, center.z), direction);

			const intersects = raycaster.intersectObject(mesh);

			if (intersects.length > 0) {
				const intersection = intersects[intersects.length - 1].point;
				intersection.add(new Vector3(0, socketHeight, 0));
				pointGatherer.push(intersection);
			} else {
				console.error("No intersection found for this ray.");
			}
		}
	}

	self.postMessage({
		type: "done",
		data: pointGatherer,
	});
};
