import "@/global-style.css";

import { Vector3 } from "three";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { DebugPoint } from "@/classes/DebugPoint";
import { EllipsoidFiller } from "@/classes/EllipsoidFiller";
import { EvaluateGeometries } from "@/classes/EvaluateGeometries";
import { Lighting } from "@/classes/Lighting";
import { STLLoader } from "@/classes/STLLoader";
import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import {
	addFillerEllipsoid,
	changeDistalCupSize,
	loadingScreen,
	mergeGeosButton,
} from "@/utils/htmlElements";
import { sliceGeometry } from "@/utils/sliceGeometry";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { MergeGeometries } from "./classes/MergeGeometries";

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

		app.camera.position.set(0, 0, maxDimension * 1.5);
		app.camera.lookAt(center);
		app.addToScene(mesh);

		mergeGeosButton.disabled = false;

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";
	},
});

if (!mergeGeosButton) {
	throw new Error("Merged Geometries Button not found");
}

mergeGeosButton.addEventListener("click", () => {
	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

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

		console.log("CYLINDER", cylinder.mesh.geometry);
		console.log("STL", stlModel.mesh.geometry);

		const mergedGeos = new MergeGeometries(stlModel, cylinder);

		app.removeAllMeshesFromScene();
		cylinder.removeGui();
		stlModel.removeGui();

		if (!mergedGeos.mesh) {
			throw new Error("Merged geometry not found");
		}

		app.addToScene(mergedGeos.mesh);

		// const evaluateGeometries = new EvaluateGeometries(stlModel, cylinder);

		// if (!evaluateGeometries.mesh) {
		// 	throw new Error("Geometry not found");
		// }

		// app.addToScene(evaluateGeometries.mesh);

		// mergeGeosButton.disabled = true;
		// changeDistalCupSize.disabled = true;

		// const slicedGeometry = sliceGeometry(evaluateGeometries.mesh.geometry, 0.1);
		// const gCode = generateGCode(slicedGeometry, 0.1);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		// console.log(gCode);

		// downloadGCodeFile(gCode);
	}, 1000);
});

addFillerEllipsoid?.addEventListener("click", () => {
	const ellipsoidFiller = new EllipsoidFiller();
	if (!ellipsoidFiller.mesh) {
		throw new Error("Ellipsoid mesh not found");
	}
	app.addToScene(ellipsoidFiller.mesh);
});
