import "@/global-style.css";
import "@/app-style.css";

import "@/db/store";
import "@/web-components";
import "@/utils/events";
import "@/utils/updater";

import { ceil } from "mathjs";
import { type Mesh, Vector3 } from "three";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import { Application } from "@/classes/Application";
import { MergeCylinder } from "@/classes/MergeCylinder";
import { PrintObject } from "@/classes/PrintObject";
import {
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
import { Tube } from "./classes/Tube";
import { deleteAllFiles } from "./db/file";
import { PrintObjectType } from "./db/types";

if (!window.Worker) {
	throw new Error("Web Worker not supported");
}

const app = new Application();
const tube = await Tube.create();
const mergeCylinder = await MergeCylinder.create();

// app.addToScene(ring.mesh);
app.addToScene(tube.mesh);

// TODO: pass in Ring position and let PrintObject determine intersection.
const printObject = new PrintObject({
	tube,
	callback: ({ size: { y } }) => {
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

// ring is added in async init above

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
	printObject.updateMatrixWorld();

	if (printObject.currentType === PrintObjectType.Socket) {
		mergeCylinder.setHeight(printObject.boundingBox.max.y / 2);
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
			const vectors: Vector3[][] = [];
			for (const level of data) {
				const levelVectors: Vector3[] = [];
				for (const point of level) {
					levelVectors.push(new Vector3(point.x, point.y, point.z));
				}
				vectors.push(levelVectors);
			}

			const blended = blendHardEdges(vectors, 1);
			const feedratePerLevel = await calculateFeedratePerLevel(blended);
			const printTime = await calculatePrintTime(blended, feedratePerLevel);

			estimatedPrintTime.textContent = printTime;

			const gcode = await generateGCode(blended, feedratePerLevel, "y", {
				estimatedTime: printTime,
			});
			const filePathName = `${printObject.mesh?.name}.gcode`;

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
