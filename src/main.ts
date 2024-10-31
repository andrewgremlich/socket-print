import "@/global-style.css";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { Lighting } from "@/classes/Lighting";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { STLLoader } from "@/classes/STLLoader";
import { findCentroid } from "@/utils/findCentroid";
import { generateGCode } from "@/utils/generateGCode";
// import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import { sliceGeometry } from "@/utils/sliceGeometry";

const loadingScreen = document.getElementById("loading");

if (!loadingScreen) {
	throw new Error("Loading screen not found");
}

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
if (import.meta.env.MODE === "development" && lighting.directionalLightHelper) {
	app.addToScene(lighting.directionalLightHelper);
}
app.addToScene(lighting.ambientLight);

const cylinder = new Cylinder("large");
app.addToScene(cylinder.mesh);

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
		const centroid = findCentroid(mesh, 40);

		// TODO: place the centroid at the top of the cylinder
		cylinder.mesh.position.set(
			centroid.x,
			centroid.y - cylinder.height / 2,
			centroid.z,
		);

		app.camera.position.set(0, 0, maxSize * 1.5);
		app.camera.lookAt(center);
		app.addToScene(mesh);

		loadingScreen.style.display = "none";
	},
});

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

		mergedGeos.geometry.rotateX(Math.PI * 0.5);

		const slicedGeometry = sliceGeometry(mergedGeos.geometry, 0.1);

		const gCode = generateGCode(slicedGeometry, 0.1);

		loadingScreen.style.display = "none";

		console.log(gCode);

		// downloadGCodeFile(gCode);
	}, 1000);
});
