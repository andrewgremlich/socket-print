import "@/global-style.css";
import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/updater";

import { Application } from "@/classes/Application";
import { MergeCup } from "@/classes/MergeCup";
import { MergeGeometries } from "@/classes/MergeGeometries";
import { Socket } from "@/classes/Socket";
import { ceil } from "mathjs";

import { adjustForShrinkAndOffset } from "@/3d/adjustForShrinkAndOffset";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import {
	activeFileName,
	clearModelButton,
	depthTranslate,
	estimatedPrintTime,
	generateGCodeButton,
	horizontalTranslate,
	loadingScreen,
	mergeMeshes,
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
const mergeCup = new MergeCup();
app.addToScene(mergeCup.mesh);

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

let mergeGeometries: MergeGeometries;

clearModelButton.addEventListener("click", () => {
	if (mergeGeometries) {
		app.removeMeshFromScene(mergeGeometries.mesh);
		mergeGeometries = null;

		mergeCup.mesh.visible = true;
	} else {
		app.removeMeshFromScene(socket.mesh);
	}

	horizontalTranslate.value = "0";
	depthTranslate.value = "0";
	verticalTranslate.value = "0";
	activeFileName.textContent = "";
	socket.clearData();

	app.resetCameraPosition();
});

mergeMeshes?.addEventListener("click", async () => {
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
		mergeGeometries.updateMatrixWorld();

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
	}, 500);
});

export async function slicingAction(sendToFile: boolean) {
	generateGCodeButton.disabled = true;
	printerFileInput.disabled = true;
	progressBarDiv.style.display = "flex";

	const worker = new sliceWorker();

	worker.postMessage({
		positions: mergeGeometries.mesh.geometry.attributes.position.array,
		verticalAxis: "y",
		incrementHeight: true,
	});

	worker.onmessage = async (event) => {
		const { type, data } = event.data;

		if (type === "progress") {
			const progress = ceil(data * 100);

			progressBarLabel.textContent = `${progress}%`;
			progressBar.value = progress;
		} else if (type === "done") {
			// const adjustedDim = await adjustForShrinkAndOffset(
			// 	data,
			// 	mergeGeometries.center,
			// );
			// const blended = await blendHardEdges(adjustedDim, 1);
			// const printTime = await calculatePrintTime(blended);

			// estimatedPrintTime.textContent = printTime;

			const gcode = await generateGCode(data, "y", {
				// estimatedTime: printTime,
			});
			const filePathName = `${socket.mesh?.name}.gcode`;

			if (sendToFile) {
				await writeGCodeFile(gcode, filePathName);
			} else {
				await sendGCodeFile(new Blob([gcode]), filePathName);
			}

			progressBarDiv.style.display = "none";
			generateGCodeButton.disabled = false;
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
