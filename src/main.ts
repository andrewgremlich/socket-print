import "@/global-style.css";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { Lighting } from "@/classes/Lighting";
import { STLLoader } from "@/classes/STLLoader";
// import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
// import { sliceGeometry } from "@/utils/sliceGeometry";
import { Vector3 } from "three";
import { DebugPoint } from "./classes/DebugPoint";
import { EvaluateGeometries } from "./classes/EvaluateGeometries";
import { mergeGeosButton } from "./utils/htmlElements";

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
if (!cylinder.mesh) {
	throw new Error("Cylinder mesh not found");
}
app.addToScene(cylinder.mesh);

const debugPoint = new DebugPoint(new Vector3(0.7309, 0, 2.847));
app.addToScene(debugPoint.mesh);

const stlModel = new STLLoader({
	stlLoadedCallback: ({ mesh, maxDimension, center }) => {
		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}
		cylinder.mesh.position.set(
			center.x,
			center.y - (cylinder.height - 40 / 2),
			center.z,
		);

		app.camera.position.set(0, 0, maxDimension * 1.5);
		//TODO: adjust this center...
		app.camera.lookAt(center);
		app.addToScene(mesh);

		loadingScreen.style.display = "none";
	},
});

if (!mergeGeosButton) {
	throw new Error("Merged Geometries Button not found");
}

mergeGeosButton.addEventListener("click", () => {
	loadingScreen.style.display = "flex";

	setTimeout(() => {
		cylinder.updateMatrixWorld();
		stlModel.updateMatrixWorld();

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		const evaluateGeometries = new EvaluateGeometries(stlModel, cylinder);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		app.addToScene(evaluateGeometries.mesh);

		mergeGeosButton.disabled = true;

		// const slicedGeometry = sliceGeometry(evaluateGeometries.mesh.geometry, 0.1);
		// const gCode = generateGCode(slicedGeometry, 0.1);

		loadingScreen.style.display = "none";

		// console.log(gCode);

		// downloadGCodeFile(gCode);
	}, 1000);
});
