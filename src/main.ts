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
import { downloadGCodeFile, generateGCode } from "@/utils/generateGCode";
import {
	generateGCodeButton,
	loadingScreen,
	mergeMeshes,
	progressBar,
	progressBarDiv,
	progressBarLabel,
} from "@/utils/htmlElements";
import sliceWorker from "@/utils/sliceWorker?worker";
import { blendMerge } from "./utils/blendMerge";
import { calculatePrintTime } from "./utils/calculatePrintTime";

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
	socketCallback: ({ mesh, maxDimension }) => {
		if (!distalCup.mesh) {
			throw new Error("Distal Cup mesh not found");
		}

		app.camera.position.set(0, 200, maxDimension * 1.5);
		app.controls.target.set(0, 100, 0);
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
			verticalAxis: "y",
			layerHeight: Number(window.provelPrintStore.layerHeight),
			segments: 100,
			incrementHeight: true,
		});

		worker.onmessage = (event) => {
			const { type, data } = event.data;

			if (type === "progress") {
				const progress = Math.ceil(data * 100);

				progressBarLabel.textContent = `${progress}%`;
				progressBar.value = progress;
			} else if (type === "done") {
				const blendedMerge = blendMerge(
					data,
					evaluateGeometries.center,
					app,
					1,
				);
				const printTime = calculatePrintTime(blendedMerge);
				const gcode = generateGCode(blendedMerge, "y", {
					estimatedTime: printTime,
				});

				downloadGCodeFile(gcode, "file.gcode");

				progressBarDiv.style.display = "none";
				generateGCodeButton.disabled = false;
			}
		};
	}, 1000);
});
