import "@/global-style.css";
import "@/app-style.css";

import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/updater";

import { ceil } from "mathjs";
import type { Mesh } from "three";
import { VertexNormalsHelper } from "three/examples/jsm/Addons.js";
import { adjustForShrinkAndOffset } from "@/3d/adjustForShrinkAndOffset";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import { Application } from "@/classes/Application";
import { MergeCylinder } from "@/classes/MergeCylinder";
import { PrintObject } from "@/classes/PrintObject";
import { Ring } from "@/classes/Ring";
import {
	getIsTestSTLCylinder,
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";
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
const mergeCylinder = new MergeCylinder();
const printObject = new PrintObject({
	callback: ({ size: { y } }) => {
		if (import.meta.env.MODE === "development") {
			// const helper = new VertexNormalsHelper(printObject.mesh, 5, 0x00ff00);
			// helper.visible = true;
			// printObject.mesh.add(helper);
		}

		app.camera.position.set(0, y + 50, -200);
		app.controls.target.set(0, y * 0.5, 0); // look at the center of the object

		const existingMeshes = app.scene.children.filter((child) => {
			return child.type === "Mesh" && child.userData.isSocket;
		});

		if (existingMeshes.length > 0) {
			existingMeshes.forEach((child) => {
				app.removeMeshFromScene(child as Mesh);
			});
		}

		app.addToScene(printObject.mesh);

		loadingScreen.style.display = "none";
	},
});

app.addToScene(ring.mesh);

const removeMeshes = async (meshes: Mesh[]) => {
	meshes.forEach((mesh) => {
		app.removeMeshFromScene(mesh);
	});

	horizontalTranslate.value = "0";
	depthTranslate.value = "0";
	verticalTranslate.value = "0";
	activeFileName.textContent = "";

	estimatedPrintTime.textContent = "0m 0s";

	// Zero out rotate and translate values in IndexedDB
	await updateRotateValues(0, 0, 0);
	await updateTranslateValues(0, printObject.offsetYPosition ?? 0, 0);

	printObject.clearData();
	app.resetCameraPosition();
};

clearModelButton.addEventListener("click", async () => {
	await removeMeshes([printObject.mesh, mergeCylinder.mesh]);
	await deleteAllFiles();
});

export async function slicingAction(sendToFile: boolean) {
	const isTestSTLCylinder = await getIsTestSTLCylinder();

	printObject.updateMatrixWorld();

	if (!isTestSTLCylinder) {
		mergeCylinder.setHeight(printObject.boundingBox.max.y);
		app.addToScene(mergeCylinder.mesh);
	}

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
			const adjustedDim = await adjustForShrinkAndOffset(
				data,
				printObject.center,
			);
			const blended = await blendHardEdges(adjustedDim, 1);
			const feedratePerLevel = await calculateFeedratePerLevel(blended);
			const printTime = await calculatePrintTime(blended, feedratePerLevel);

			estimatedPrintTime.textContent = printTime;

			const gcode = await generateGCode(blended, feedratePerLevel, "y", {
				estimatedTime: printTime,
			});
			const filePathName = `${printObject.mesh?.name}.gcode`;

			console.log(filePathName);

			if (sendToFile) {
				await writeGCodeFile(gcode, filePathName);
			} else {
				await sendGCodeFile(new Blob([gcode]), filePathName);
			}

			progressBar.value = 0;
			progressBarDiv.style.display = "none";
		}
	};

	app.removeMeshFromScene(mergeCylinder.mesh);
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
