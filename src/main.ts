import "@/global-style.css";

import { Application } from "@/classes/Application";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
import { BufferAttribute, type Object3D } from "three";
import { Cylinder } from "./classes/Cylinder";

const app = new Application();

const cylinder = new Cylinder({ radius: 5, height: 20, color: 0xffffff });

new STLLoader({
	stlLoadedCallback: ({ mesh, maxSize }) => {
		// Position the camera a little further from the model
		app.camera.position.set(0, 0, maxSize * 1.5);
		app.camera.lookAt(0, 0, 0);

		app.addToScene(mesh);

		const nonIndexCylinder = cylinder.mesh.geometry.toNonIndexed();
		const stlMeshGeo = mesh.geometry;

		if (!nonIndexCylinder.attributes.normal) {
			nonIndexCylinder.computeVertexNormals();
		}
		if (!nonIndexCylinder.attributes.uv) {
			const uvSphere = new Float32Array(
				nonIndexCylinder.attributes.position.count * 2,
			);
			nonIndexCylinder.setAttribute("uv", new BufferAttribute(uvSphere, 2));
		}

		if (!stlMeshGeo.attributes.normal) {
			stlMeshGeo.computeVertexNormals();
		}
		if (!stlMeshGeo.attributes.uv) {
			const uvBox = new Float32Array(stlMeshGeo.attributes.position.count * 2);
			stlMeshGeo.setAttribute("uv", new BufferAttribute(uvBox, 2));
		}

		const mergeGeometries = new MergeGeometries({
			geometries: [cylinder.mesh.geometry.toNonIndexed(), mesh.geometry],
		});

		app.addToScene(mergeGeometries.mesh as Object3D);
	},
});

app.addToScene(cylinder.mesh);

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});
