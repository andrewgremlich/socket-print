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
import {
	downloadGCodeFile,
	generateGCodeFromSlices,
} from "@/utils/generateGCode";
import {
	loadingScreen,
	mergeGeosButton,
	toggleOpenCylinder,
} from "@/utils/htmlElements";
import { sliceGeometry } from "@/utils/sliceGeometry";

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

		app.camera.position.set(0, 100, maxDimension * 1.5);
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

		cylinder.mesh.visible = false;
		stlModel.mesh.visible = false;

		const evaluateGeometries = new EvaluateGeometries(stlModel, cylinder);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		app.addToScene(evaluateGeometries.unrotatedMesh);

		const slicedGeometry = sliceGeometry(evaluateGeometries.mesh.geometry, {
			maxZ: evaluateGeometries.boundingBox.max.z,
		});
		const gcode = generateGCodeFromSlices(slicedGeometry, {
			feedrate: 1200,
			extrusionFactor: 0.04,
			estimatedTime: "2h 15m 30s",
		});

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		downloadGCodeFile(gcode);
	}, 1000);
});

toggleOpenCylinder?.addEventListener("click", (event) => {
	if (!cylinder.mesh) {
		throw new Error("Cylinder mesh not found");
	}

	console.log("toggleOpenCylinder", event);
});
