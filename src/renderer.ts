import "@/global-style.css";
import "@/app-style.css";

import { initializeTheme } from "@/web-components/Settings";

// Initialize theme before any components render to prevent flash
initializeTheme();

import "@/db/store";
import "@/web-components";
import "@/utils/globalEvents";
import "@/utils/updater";

import {
	Check,
	createIcons,
	File,
	Loader,
	Move3d,
	Printer,
	PrinterCheck,
	Rotate3d,
	RotateCw,
	Settings,
} from "lucide";
import { ceil } from "mathjs";
import { type Mesh, Vector3 } from "three";
import { blendHardEdges } from "@/3d/blendHardEdges";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";
import { calculatePrintTime } from "@/3d/calculatePrintTime";
import { generateGCode, writeGCodeFile } from "@/3d/generateGCode";
import { sendGCodeFile } from "@/3d/sendGCodeFile";
import sliceWorker from "@/3d/sliceWorker?worker";
import { Application } from "@/classes/Application";
import { PrintObject } from "@/classes/PrintObject";
import {
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";
import {
	activeFileName,
	clearModelButton,
	estimatedPrintTime,
	generateGCodeButton,
	loadingScreen,
	printerFileInput,
	progressBar,
	progressBarDiv,
	progressBarLabel,
	translateRotationControlsButton,
	xTranslate,
	yTranslate,
	zTranslate,
} from "@/utils/htmlElements";
import { saveRotationToDatabase } from "@/utils/meshTransforms";
import { SliceWorkerStatus } from "./3d/sliceWorker";
import { SocketCup } from "./classes/SocketCup";
import { deleteAllFiles } from "./db/file";

createIcons({
	icons: {
		Settings,
		Loader,
		PrinterCheck,
		Printer,
		Check,
		File,
		Move3d,
		Rotate3d,
		RotateCw,
	},
});

if (!window.Worker) {
	throw new Error("Web Worker not supported");
}

const app = new Application();

// Clean up WebGL context on HMR to prevent "Too many active WebGL contexts" warning
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		app.dispose();
	});
}

// Clean up WebGL context when page is unloaded (navigation, refresh, tab close)
window.addEventListener("beforeunload", () => {
	app.dispose();
});

const socketCup = await SocketCup.create();

app.addToScene(socketCup.mesh);

let initialCameraSet = false;

const printObject = new PrintObject({
	socketCup: socketCup,
	scene: app.scene,
	callback: ({ size: { y } }) => {
		if (!initialCameraSet) {
			app.camera.position.set(0, y + 50, -200);
			app.controls.target.set(0, y * 0.5, 0); // look at the center of the object
			initialCameraSet = true;
		}

		const existingMeshes = app.scene.children.filter((child) => {
			return child.type === "Mesh" && child.userData.isPrintObject;
		});

		if (existingMeshes.length > 0) {
			existingMeshes.forEach((child) => {
				app.removeMeshFromScene(child as Mesh);
			});
		}

		app.addToScene(printObject.mesh);

		app.attachTransformControls(printObject.mesh, {
			onChange: async () => {
				// Save the rotation values to IndexedDB
				await saveRotationToDatabase(printObject.mesh);
				// Update collision detection and cup-to-socket transition
				await printObject.isIntersectingWithSocketCup();
			},
		});

		loadingScreen.style.display = "none";
	},
});

const removeMeshes = async (meshes: Mesh[]) => {
	meshes.forEach((mesh) => {
		app.removeMeshFromScene(mesh);
	});

	translateRotationControlsButton.setAttribute("aria-pressed", "false");

	xTranslate.value = "0";
	yTranslate.value = "0";
	zTranslate.value = "0";
	activeFileName.textContent = "";

	estimatedPrintTime.textContent = "0m 0s";

	// Zero out rotate and translate values in IndexedDB
	await updateRotateValues(0, 0, 0);
	await updateTranslateValues(0, printObject.offsetYPosition ?? 0, 0);

	printObject.clearData();
	app.resetCameraPosition();
	initialCameraSet = false;
};

clearModelButton.addEventListener("click", async () => {
	await removeMeshes([printObject.mesh]);
	await deleteAllFiles();
});

export async function slicingAction(sendToFile: boolean) {
	printObject.updateMatrixWorld();

	// Transition geometry is now managed by PrintObject and already in scene

	const allGeometries = app.collectAllPrintableGeometries();

	progressBarDiv.style.display = "flex";

	const worker = new sliceWorker();

	worker.postMessage({
		positions: allGeometries.attributes.position.array,
	});

	worker.onmessage = async (
		event: MessageEvent<{
			type: SliceWorkerStatus;
			data: number | Vector3[][];
		}>,
	) => {
		const { type, data } = event.data;

		if (type === SliceWorkerStatus.PROGRESS && typeof data === "number") {
			const progress = ceil(data * 100);

			progressBarLabel.textContent = `${progress}%`;
			progressBar.value = progress;
		} else if (type === SliceWorkerStatus.DONE && Array.isArray(data)) {
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
			worker.terminate();
		}
	};

	worker.onerror = (error) => {
		console.error("Worker error:", error);
		progressBar.value = 0;
		progressBarDiv.style.display = "none";
		worker.terminate();
	};
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

translateRotationControlsButton.addEventListener("click", () => {
	const isVisible = app.translateRotationControls();
	translateRotationControlsButton.setAttribute(
		"aria-pressed",
		isVisible.toString(),
	);
});
