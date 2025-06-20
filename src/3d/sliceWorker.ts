import { cos, pi, sin } from "mathjs";
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
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import {
	getCircularSegments,
	getCupSizeHeight,
	getLayerHeight,
} from "../db/keyValueSettings";
import { ensureUV } from "./ensureUV";

Mesh.prototype.raycast = acceleratedRaycast;

type SliceWorker = {
	positions: number[];
};

self.onmessage = async (event: MessageEvent<SliceWorker>) => {
	const { positions } = event.data;
	const layerHeight = await getLayerHeight();
	const segments = await getCircularSegments();
	const socketHeight = (await getCupSizeHeight()) + 5;
	const angleIncrement = (pi * 2) / segments;
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

	const bvh = new MeshBVH(mesh.geometry);

	const boundingBox = new Box3().setFromObject(mesh);
	const center = boundingBox.getCenter(new Vector3());
	const maxHeight = boundingBox.max.y;
	const camera = new PerspectiveCamera(75, 1, 0.1, 1000);

	camera.position.set(0, 0, 10);
	camera.lookAt(center);
	renderer.render(scene, camera);
	scene.add(mesh);
	mesh.geometry.boundsTree = bvh;
	mesh.updateMatrixWorld(true);

	const pointGatherer: Vector3[][] = [];
	const raycaster = new Raycaster();
	const direction = new Vector3();
	const ray = raycaster.ray;

	for (
		let heightPosition = 0;
		heightPosition < maxHeight;
		heightPosition += layerHeight
	) {
		const pointLevel: Vector3[] = [];

		self.postMessage({
			type: "progress",
			data: heightPosition / maxHeight,
		});

		for (let angle = angleIncrement; angle < pi * 2; angle += angleIncrement) {
			const xdirection = cos(-angle);
			const zdirection = sin(-angle);

			direction.set(xdirection, 0, zdirection).normalize();
			ray.origin.set(center.x, heightPosition, center.z);
			ray.direction.copy(direction);
			const intersects = raycaster.intersectObject(mesh);

			if (intersects.length > 0) {
				const intersection = intersects[intersects.length - 1].point;
				intersection.add(new Vector3(0, socketHeight, 0));
				pointLevel.push(intersection);
			} else {
				console.warn("No intersection found for this ray.");
			}
		}

		pointGatherer.push(pointLevel);
	}

	self.postMessage({
		type: "done",
		data: pointGatherer,
	});
};
