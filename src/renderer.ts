import "@/global-style.css";
import "@/db/store";
import "@/utils/events";
import "@/utils/pwa";

import { Application } from "@/classes/Application";
import { DistalCup } from "@/classes/DistalCup";
import { EvaluateGeometries } from "@/classes/EvaluateGeometries";
import { Lighting } from "@/classes/Lighting";
import { Socket } from "@/classes/Socket";

import { blendMerge } from "@/3d/blendMerge";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { downloadGCodeFile, generateGCode } from "@/3d/generateGCode";
import sliceWorker from "@/3d/sliceWorker?worker";
import { getLayerHeight } from "@/db/appSettings";
import {
	clearModelButton,
	estimatedPrintTime,
	generateGCodeButton,
	loadingScreen,
	mergeMeshes,
	progressBar,
	progressBarDiv,
	progressBarLabel,
} from "@/utils/htmlElements";

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
app.addToScene(lighting.ambientLight);

const distalCup = new DistalCup();
if (!distalCup.mesh) {
	throw new Error("Distal Cup mesh not found");
}
app.addToScene(distalCup.mesh);

const socket = new Socket({
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

clearModelButton.addEventListener("click", () => {
	app.removeMeshFromScene(socket.mesh);
	socket.clearData();
});

let evaluateGeometries: EvaluateGeometries;

mergeMeshes?.addEventListener("click", () => {
	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	loadingScreen.style.display = "flex";

	setTimeout(() => {
		if (!socket.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!distalCup.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		distalCup.updateMatrixWorld();
		socket.updateMatrixWorld();

		evaluateGeometries = new EvaluateGeometries(socket, distalCup);

		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		distalCup.mesh.visible = false;
		socket.mesh.visible = false;
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

	setTimeout(async () => {
		// TODO: I don't know of setTimeout supports this.
		if (!evaluateGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		if (!window.Worker) {
			throw new Error("Web Worker not supported");
		}

		const worker = new sliceWorker();
		const layerHeight = await getLayerHeight();

		worker.postMessage({
			positions: evaluateGeometries.mesh.geometry.attributes.position.array,
			verticalAxis: "y",
			layerHeight: layerHeight,
			segments: 100,
			incrementHeight: true,
		});

		worker.onmessage = async (event) => {
			const { type, data } = event.data;

			if (type === "progress") {
				const progress = Math.ceil(data * 100);

				progressBarLabel.textContent = `${progress}%`;
				progressBar.value = progress;
			} else if (type === "done") {
				const { center } = evaluateGeometries;
				const blendedMerge = blendMerge(data, center, 1);
				const printTime = calculatePrintTime(blendedMerge);

				estimatedPrintTime.textContent = printTime;

				const gcode = await generateGCode(blendedMerge, "y", {
					estimatedTime: printTime,
				});

				downloadGCodeFile(gcode, `${socket.mesh?.name}.gcode`);

				progressBarDiv.style.display = "none";
				generateGCodeButton.disabled = false;
			}
		};
	}, 1000);
});
