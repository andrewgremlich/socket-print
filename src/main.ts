import "@/global-style.css";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { DebugPoint } from "@/classes/DebugPoint";
import { Lighting } from "@/classes/Lighting";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
import { generateGCode, geometryToGCode } from "@/utils/generateGCode";
// import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import { sliceGeometry } from "@/utils/sliceGeometry";
import { STLExporter } from "three/examples/jsm/Addons.js";

const loadingScreen = document.getElementById("loading");

if (!loadingScreen) {
	throw new Error("Loading screen not found");
}

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

		loadingScreen.style.display = "none";
	},
});

app.addToScene(cylinder.mesh);
app.addToScene(lighting.directionalLight);
if (import.meta.env.MODE === "development" && lighting.directionalLightHelper) {
	app.addToScene(lighting.directionalLightHelper);
}
app.addToScene(lighting.ambientLight);

const mergeGeos = new MergeGeometries(stlModel, cylinder);

const mergeGeosButton = document.getElementById("mergeGeometries");

if (!mergeGeosButton) {
	throw new Error("Merged Geometries Button not found");
}

mergeGeosButton.addEventListener("click", () => {
	loadingScreen.style.display = "flex";

	setTimeout(() => {
		cylinder.updateMatrixWorld();
		stlModel.updateMatrixWorld();

		const mergedGeos = mergeGeos.getGeometry();
		const slicedGeometry = sliceGeometry(mergedGeos.geometry, 0.1);

		console.log(slicedGeometry);

		const debugPoint1 = new DebugPoint(slicedGeometry[0][0][0]);
		const debugPoint2 = new DebugPoint(slicedGeometry[0][0][1]);
		const debugPoint3 = new DebugPoint(slicedGeometry[0][1][0]);

		app.addToScene(debugPoint1.mesh);
		app.addToScene(debugPoint2.mesh);
		app.addToScene(debugPoint3.mesh);

		const gCode = generateGCode(slicedGeometry, 0.1);

		loadingScreen.style.display = "none";

		console.log(gCode);

		// downloadGCodeFile(gCode);
	}, 1000);
});

window.addEventListener("resize", () => {
	app.camera.aspect = window.innerWidth / window.innerHeight;
	app.camera.updateProjectionMatrix();
	app.renderer.setSize(window.innerWidth, window.innerHeight);
});
