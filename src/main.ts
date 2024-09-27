import "@/global-style.css";

import { Application } from "@/classes/Application";
// import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
// import type { Object3D } from "three";
// import { Cylinder } from "./classes/Cylinder";
// import { downloadGCodeFile, generateGCode } from "./utils/generateGCode";
// import { sliceGeometry } from "./utils/sliceGeometry";

const app = new Application();

// const cylinder = new Cylinder({ radius: 5, height: 20, color: 0xffffff });

new STLLoader({
	stlLoadedCallback: ({ mesh, maxSize, meshMergeCompatible: _m, size }) => {
		// Position the camera a little further from the model
		app.camera.position.set(0, 0, maxSize * 1.5);
		app.camera.lookAt(0, 0, 0);

		app.addToScene(mesh);

		app.gridHelper.position.set(0, -maxSize / 2, 0);
		app.gridHelper.scale.set(size.x / 200, 1, size.z / 200);

		// const sliceCylinder = sliceGeometry(mesh.geometry, 0.2);
		// const gCodeCylinder = generateGCode(sliceCylinder, 2);
		// downloadGCodeFile(gCodeCylinder);

		// const cyl = cylinder.toMergeCompatible();

		// const mergeGeometries = new MergeGeometries({
		// 	geometries: [cyl, meshMergeCompatible],
		// });

		// app.addToScene(mergeGeometries.mesh as Object3D);
	},
});

// MergeGeometries.mergeGeometriesButton();

// app.addToScene(cylinder.mesh);

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});
