import "@/global-style.css";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { Lighting } from "@/classes/Lighting";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import { sliceGeometry } from "@/utils/sliceGeometry";

const app = new Application();
const lighting = new Lighting();
const cylinder = new Cylinder();
const stlModel = new STLLoader({
	stlLoadedCallback: ({
		mesh,
		maxSize,
		meshMergeCompatible: _m,
		size,
		center,
	}) => {
		const lightDistance = Math.max(size.x, size.y, size.z) * 2; // Distance based on the size of the model
		lighting.directionalLight.position.set(
			center.x + lightDistance,
			center.y + lightDistance,
			center.z + lightDistance,
		);

		app.camera.position.set(0, 0, maxSize * 1.5);
		app.camera.lookAt(center);

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

app.addToScene(cylinder.mesh);
app.addToScene(lighting.directionalLight);
if (import.meta.env.MODE === "development" && lighting.directionalLightHelper) {
	app.addToScene(lighting.directionalLightHelper);
}
app.addToScene(lighting.ambientLight);

const mergeGeos = new MergeGeometries(stlModel, cylinder);

const button = document.createElement("button");

button.textContent = "Merge Geometries";

button.addEventListener("click", () => {
	const mergedGeos = mergeGeos.getGeometry();
	const slicedGeometry = sliceGeometry(mergedGeos.geometry, 0.1);
	const gCode = generateGCode(slicedGeometry, 0.1);

	downloadGCodeFile(gCode);
});

document.querySelector("body")?.appendChild(button);

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});
