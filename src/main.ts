import "@/global-style.css";
import "@/utils/store";
import "@/utils/events";

import { Vector3 } from "three";

import { Application } from "@/classes/Application";
import { DebugPoint } from "@/classes/DebugPoint";
import { DistalCup } from "@/classes/DistalCup";
import { EvaluateGeometries } from "@/classes/EvaluateGeometries";
import { Lighting } from "@/classes/Lighting";
import { Socket } from "@/classes/Socket";
import {
	generateGCodeButton,
	loadingScreen,
	mergeMeshes,
	progressBar,
	progressBarDiv,
	progressBarLabel,
	toggleOpenCylinder,
} from "@/utils/htmlElements";
import sliceWorker from "@/utils/sliceWorker?worker";
import { generateGCode } from "./utils/generateGCode";

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
app.addToScene(lighting.ambientLight);

const distalCup = new DistalCup();
if (!distalCup.mesh) {
	throw new Error("Distal Cup mesh not found");
}
app.addToScene(distalCup.mesh);

if (import.meta.env.MODE === "development") {
	const debugPoint = new DebugPoint(new Vector3(38, 15, 2));
	app.addToScene(debugPoint.mesh);
}

const stlModel = new Socket({
	socketCallback: ({ mesh, maxDimension, center }) => {
		if (!distalCup.mesh) {
			throw new Error("Distal Cup mesh not found");
		}

		app.camera.position.set(0, 100, maxDimension * 1.5);
		app.camera.lookAt(new Vector3(center.x, center.y, center.z));
		app.addToScene(mesh);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";
	},
});

let evaluateGeometries: EvaluateGeometries;

mergeMeshes?.addEventListener("click", () => {
	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	loadingScreen.style.display = "flex";

	setTimeout(() => {
		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!distalCup.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		distalCup.updateMatrixWorld();
		stlModel.updateMatrixWorld();

		evaluateGeometries = new EvaluateGeometries(stlModel, distalCup);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		distalCup.mesh.visible = false;
		stlModel.mesh.visible = false;
		app.addToScene(evaluateGeometries.mesh);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		generateGCodeButton.disabled = false;
	}, 1000);
});

generateGCodeButton.addEventListener("click", () => {
	if (!progressBarDiv) {
		throw new Error("Loading screen not found");
	}

	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	generateGCodeButton.disabled = true;
	progressBarDiv.style.display = "flex";

	console.time("generateGCode");

	setTimeout(() => {
		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		if (!window.Worker) {
			throw new Error("Web Worker not supported");
		}

		const worker = new sliceWorker();
		worker.postMessage({
			positions: evaluateGeometries.mesh.geometry.attributes.position.array,
		});

		worker.onmessage = (event) => {
			const { type, data } = event.data;

			if (type === "progress") {
				const progress = Math.ceil(data * 100);
				progressBarLabel.textContent = `${progress}%`;
				progressBar.value = progress;
			} else if (type === "done") {
				const points = data;
				console.log("points", generateGCode(points));
				console.timeEnd("generateGCode");

				if (!loadingScreen) {
					throw new Error("Loading screen not found");
				}

				progressBarDiv.style.display = "none";
				generateGCodeButton.disabled = false;
			}
		};
	}, 1000);
});

toggleOpenCylinder?.addEventListener("click", (event) => {
	if (!distalCup.mesh) {
		throw new Error("Cylinder mesh not found");
	}

	console.log("toggleOpenCylinder", event);
});
