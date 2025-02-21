import "@/global-style.css";
import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/pwa";

import { Application } from "@/classes/Application";
import { Lighting } from "@/classes/Lighting";
import { MergeCup } from "@/classes/MergeCup";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { Ring } from "@/classes/Ring";
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
	printerFileInput,
	progressBar,
	progressBarDiv,
	progressBarLabel,
} from "@/utils/htmlElements";
import { sendGCodeFile } from "./3d/sendGCodeFile";
import { CIRCULUAR_SEGMENTS } from "./utils/constants";

const app = new Application();

const lighting = new Lighting();
app.addToScene(lighting.directionalLight);
app.addToScene(lighting.ambientLight);

const ring = new Ring();
app.addToScene(ring.mesh);

const socket = new Socket({
	socketCallback: ({ mesh, maxDimension }) => {
		app.camera.position.set(0, 200, maxDimension);
		app.controls.target.set(0, 100, 0);
		app.addToScene(mesh);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";
	},
});

let mergeGeometries: MergeGeometries;

clearModelButton.addEventListener("click", () => {
	if (mergeGeometries) {
		app.removeMeshFromScene(mergeGeometries.mesh);
		mergeGeometries = null;
	} else {
		app.removeMeshFromScene(socket.mesh);
	}

	socket.clearData();
});

mergeMeshes?.addEventListener("click", () => {
	const mergeCup = new MergeCup();

	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	loadingScreen.style.display = "flex";

	setTimeout(() => {
		if (!socket.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!mergeCup.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		mergeGeometries = new MergeGeometries(socket, mergeCup);

		if (!mergeGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		mergeCup.mesh.visible = false;
		socket.mesh.visible = false;

		app.addToScene(mergeGeometries.mesh);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";

		generateGCodeButton.disabled = false;
		printerFileInput.disabled = false;
	}, 1000);
});

export async function slicingAction(sendToFile: boolean) {
	if (!progressBarDiv) {
		throw new Error("Loading screen not found");
	}

	if (!loadingScreen) {
		throw new Error("Loading screen not found");
	}

	mergeGeometries.updateMatrixWorld();
	generateGCodeButton.disabled = true;
	printerFileInput.disabled = true;
	progressBarDiv.style.display = "flex";

	setTimeout(async () => {
		if (!mergeGeometries.mesh) {
			throw new Error("Geometry not found");
		}

		if (!window.Worker) {
			throw new Error("Web Worker not supported");
		}

		const worker = new sliceWorker();
		const layerHeight = await getLayerHeight();

		worker.postMessage({
			positions: mergeGeometries.mesh.geometry.attributes.position.array,
			verticalAxis: "y",
			layerHeight,
			segments: CIRCULUAR_SEGMENTS,
			incrementHeight: true,
		});

		worker.onmessage = async (event) => {
			const { type, data } = event.data;

			if (type === "progress") {
				const progress = Math.ceil(data * 100);

				progressBarLabel.textContent = `${progress}%`;
				progressBar.value = progress;
			} else if (type === "done") {
				const blendedMerge = blendMerge(data, mergeGeometries.center, 1);
				const printTime = calculatePrintTime(blendedMerge);

				estimatedPrintTime.textContent = printTime;

				const gcode = await generateGCode(blendedMerge, "y", {
					estimatedTime: printTime,
				});

				if (sendToFile) {
					downloadGCodeFile(gcode, `${socket.mesh?.name}.gcode`);
				} else {
					await sendGCodeFile(new Blob([gcode]), `${socket.mesh?.name}.gcode`);
				}

				progressBarDiv.style.display = "none";
				generateGCodeButton.disabled = false;
			}
		};
	}, 1000);

	return "";
}

generateGCodeButton.addEventListener("click", async () => {
	await slicingAction(true);
});
printerFileInput.addEventListener("click", async () => {
	await slicingAction(false);
});
