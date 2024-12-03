import "@/global-style.css";
import "@/utils/store";
import "@/utils/events";

import { Vector3 } from "three";

import { Application } from "@/classes/Application";
import { Cylinder } from "@/classes/Cylinder";
import { DebugPoint } from "@/classes/DebugPoint";
import { EvaluateGeometries } from "@/classes/EvaluateGeometries";
import { Lighting } from "@/classes/Lighting";
import { STLLoader } from "@/classes/STLLoader";
import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import {
	loadingScreen,
	mergeGeosButton,
	toggleOpenCylinder,
} from "@/utils/htmlElements";
import { sliceGeometry } from "@/utils/sliceGeometry";
import { prepForSlicing } from "./utils/prepForSlicing";

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
app.addToScene(lighting.ambientLight);

const cylinder = new Cylinder();
if (!cylinder.mesh) {
	throw new Error("Cylinder mesh not found");
}
app.addToScene(cylinder.mesh);

if (import.meta.env.MODE === "development") {
	const debugPoint = new DebugPoint(new Vector3(0.7309, 200, 2.847));
	app.addToScene(debugPoint.mesh);
}

const stlModel = new STLLoader({
	stlLoadedCallback: ({ mesh, maxDimension, center, boxHelper }) => {
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

		if (import.meta.env.MODE === "development") {
			app.addToScene(boxHelper);
		}

		loadingScreen.style.display = "none";
	},
});

mergeGeosButton.addEventListener("click", () => {
	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	loadingScreen.style.display = "flex";

	setTimeout(() => {
		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		cylinder.updateMatrixWorld();
		stlModel.updateMatrixWorld();

		app.removeAllMeshesFromScene();

		const evaluateGeometries = new EvaluateGeometries(stlModel, cylinder);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		app.addToScene(evaluateGeometries.mesh);

		const preppedMesh = prepForSlicing(evaluateGeometries.mesh);
		const slicedGeometry = sliceGeometry(preppedMesh.geometry, {
			minY: evaluateGeometries.boundingBox.min.y,
			maxY: evaluateGeometries.boundingBox.max.y,
		});
		const gCode = generateGCode(slicedGeometry);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		downloadGCodeFile(gCode);
	}, 1000);
});

toggleOpenCylinder?.addEventListener("click", (event) => {
	if (!cylinder.mesh) {
		throw new Error("Cylinder mesh not found");
	}

	console.log("toggleOpenCylinder", event);
});
