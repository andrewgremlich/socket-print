import "@/global-style.css";
import "@/app-style.css";
import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/updater";

import { ceil } from "mathjs";
import type { Mesh } from "three";

import { adjustForShrinkAndOffset } from "@/3d/adjustForShrinkAndOffset";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import { Application } from "@/classes/Application";
import { MergeCup } from "@/classes/MergeCup";
import { Ring } from "@/classes/Ring";
import { Socket } from "@/classes/Socket";
import {
	updateRotateValues,
	updateTranslateValues,
} from "@/db/keyValueSettings";
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
import { deleteAllFiles } from "./db/file";

if (!window.Worker) {
	throw new Error("Web Worker not supported");
}

const app = new Application();
const ring = new Ring();
const mergeCup = new MergeCup();
const socket = new Socket({
	socketCallback: ({ maxDimension }) => {
		app.camera.position.set(0, 200, -maxDimension);
		app.controls.target.set(0, 100, 0);

		const existingSockets = app.scene.children.filter(
			(child) => child.type === "Mesh" && child.userData.isSocket,
		);

		if (existingSockets.length > 0) {
			existingSockets.forEach((child) => {
				app.removeMeshFromScene(child as Mesh);
			});
		}

		app.addToScene(socket.mesh);

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		loadingScreen.style.display = "none";
	},
});

app.addToScene(ring.mesh);

const removeMeshes = async (socketMeshes: Mesh[]) => {
	socketMeshes.forEach((mesh) => {
		app.removeMeshFromScene(mesh);
	});

	horizontalTranslate.value = "0";
	depthTranslate.value = "0";
	verticalTranslate.value = "0";
	activeFileName.textContent = "";

	estimatedPrintTime.textContent = "0m 0s";

	// Zero out rotate and translate values in IndexedDB
	await updateRotateValues(0, 0, 0);
	await updateTranslateValues(0, socket.offsetYPosition ?? 0, 0);

	socket.clearData();
	app.resetCameraPosition();
};

clearModelButton.addEventListener("click", async () => {
	await removeMeshes([socket.mesh, mergeCup.mesh]);
	await deleteAllFiles();
});

export async function slicingAction(sendToFile: boolean) {
	mergeCup.setHeight(socket.boundingBox.max.y);

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
			const feedratePerLevel = await calculateFeedratePerLevel(blended);
			const printTime = await calculatePrintTime(blended, feedratePerLevel);

			estimatedPrintTime.textContent = printTime;

			const gcode = await generateGCode(adjustedDim, feedratePerLevel, "y", {
				estimatedTime: printTime,
			});
			const filePathName = `${socket.mesh?.name}.gcode`;

			if (sendToFile) {
				await writeGCodeFile(gcode, filePathName);
			} else {
				await sendGCodeFile(new Blob([gcode]), filePathName);
			}

			progressBar.value = 0;
			progressBarDiv.style.display = "none";
		}
	};

	app.removeMeshFromScene(mergeCup.mesh);
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
