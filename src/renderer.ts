import "@/global-style.css";
import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/updater";

import { ceil } from "mathjs";

import { adjustForShrinkAndOffset } from "@/3d/adjustForShrinkAndOffset";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import { Application } from "@/classes/Application";
import { MergeCup } from "@/classes/MergeCup";
import { Ring } from "@/classes/Ring";
import { Socket } from "@/classes/Socket";
import {
	activeFileName,
	clearModelButton,
	depthTranslate,
	estimatedPrintTime,
	generateGCodeButton,
	horizontalTranslate,
	loadingScreen,
	printerFileInput,
	progressBar,
	progressBarDiv,
	progressBarLabel,
	verticalTranslate,
} from "@/utils/htmlElements";

if (!window.Worker) {
	throw new Error("Web Worker not supported");
}

const app = new Application();
const ring = new Ring();

app.addToScene(ring.mesh);

const socket = new Socket({
	socketCallback: ({ mesh, maxDimension }) => {
		app.camera.position.set(0, 200, -maxDimension);
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

	horizontalTranslate.value = "0";
	depthTranslate.value = "0";
	verticalTranslate.value = "0";
	activeFileName.textContent = "";

	socket.clearData();
	app.resetCameraPosition();
});

export async function slicingAction(sendToFile: boolean) {
	const mergeCup = new MergeCup({
		height: socket.boundingBox.max.y,
	});

	app.addToScene(mergeCup.mesh);

	socket.updateMatrixWorld();

	const allGeometries = app.collectAllGeometries();

	progressBarDiv.style.display = "flex";

	const worker = new sliceWorker();

	worker.postMessage({
		positions: allGeometries.attributes.position.array,
	});

	worker.onmessage = async (event) => {
		const { type, data } = event.data;

		if (type === "progress") {
			const progress = ceil(data * 100);

			progressBarLabel.textContent = `${progress}%`;
			progressBar.value = progress;
		} else if (type === "done") {
			const adjustedDim = await adjustForShrinkAndOffset(data, socket.center);
			const blended = await blendHardEdges(adjustedDim, 1);
			const printTime = await calculatePrintTime(blended);

			estimatedPrintTime.textContent = printTime;

			const gcode = await generateGCode(blended, "y", {
				estimatedTime: printTime,
			});
			const filePathName = `${socket.mesh?.name}.gcode`;

			if (sendToFile) {
				await writeGCodeFile(gcode, filePathName);
			} else {
				await sendGCodeFile(new Blob([gcode]), filePathName);
			}

			progressBarDiv.style.display = "none";
		}
	};

	return "";
}

generateGCodeButton.addEventListener("click", async () => {
	try {
		await slicingAction(true);
	} catch (error) {
		console.error("Error invoking slicing function:", error);
	}
});

printerFileInput.addEventListener("click", async () => {
	try {
		await slicingAction(false);
	} catch (error) {
		console.error("Error invoking slicing action:", error);
	}
});
