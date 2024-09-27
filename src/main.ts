import "@/global-style.css";

import { Application } from "@/classes/Application";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
import type { Object3D } from "three";
import { Cylinder } from "./classes/Cylinder";

const app = new Application();

const cylinder = new Cylinder({ radius: 5, height: 20, color: 0xffffff });

new STLLoader({
	stlLoadedCallback: ({ mesh, maxSize, meshMergeCompatible }) => {
		// Position the camera a little further from the model
		app.camera.position.set(0, 0, maxSize * 1.5);
		app.camera.lookAt(0, 0, 0);

		app.addToScene(mesh);

		const cyl = cylinder.toMergeCompatible();

		const mergeGeometries = new MergeGeometries({
			geometries: [cyl, meshMergeCompatible],
		});

		app.addToScene(mergeGeometries.mesh as Object3D);
	},
});

MergeGeometries.mergeGeometriesButton();

app.addToScene(cylinder.mesh);

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});
