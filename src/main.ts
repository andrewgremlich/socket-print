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
	appForm,
	loadingScreen,
	mergeGeosButton,
} from "@/utils/htmlElements";
import { sliceGeometry } from "@/utils/sliceGeometry";

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
if (import.meta.env.MODE === "development" && lighting.directionalLightHelper) {
	app.addToScene(lighting.directionalLightHelper);
}
app.addToScene(lighting.ambientLight);

const cylinder = new Cylinder();
if (!cylinder.mesh) {
	throw new Error("Cylinder mesh not found");
}
app.addToScene(cylinder.mesh);

const debugPoint = new DebugPoint(new Vector3(0.7309, 100, 2.847));
app.addToScene(debugPoint.mesh);

const stlModel = new STLLoader({
	stlLoadedCallback: ({ mesh, maxDimension, center }) => {
		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		app.camera.position.set(0, 0, maxDimension * 1.5);
		app.camera.lookAt(new Vector3(center.x, center.y, center.z));
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

		app.removeAllMeshesFromScene();
		cylinder.removeGui();
		stlModel.removeGui();

		const evaluateGeometries = new EvaluateGeometries(stlModel, cylinder);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		app.addToScene(evaluateGeometries.mesh);

		// mergeGeosButton.disabled = true;
		// changeDistalCupSize.disabled = true;

		const slicedGeometry = sliceGeometry(evaluateGeometries.mesh.geometry, 1, {
			minY: evaluateGeometries.boundingBox.min.y,
			maxY: evaluateGeometries.boundingBox.max.y,
		});
		const gCode = generateGCode(slicedGeometry, 1);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		downloadGCodeFile(gCode);
	}, 1000);
});

appForm.addEventListener("change", (event) => {
	event.preventDefault();

	const formData = new FormData(appForm);
	const values = Object.fromEntries(formData.entries());

	console.log(values);
});

addFillerEllipsoid?.addEventListener("click", () => {
	const ellipsoidFiller = new EllipsoidFiller();
	if (!ellipsoidFiller.mesh) {
		throw new Error("Ellipsoid mesh not found");
	}
	app.addToScene(ellipsoidFiller.mesh);
});
