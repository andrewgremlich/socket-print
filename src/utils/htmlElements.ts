import type { Info } from "@/web-components/Info";
import type { MaterialProfileForm } from "@/web-components/MaterialProfileForm";
// Runtime import ensures MenuBar is registered before we query its shadow DOM elements
import type { MenuBar } from "@/web-components/MenuBar";
import "@/web-components/MenuBar";
import type { Settings } from "@/web-components/Settings";

export const loadingScreen = document.getElementById("loading");

export const menuBarComponent = document.querySelector("menu-bar") as MenuBar;

export const stlFileInput = menuBarComponent.fileInput;
export const clearModelButton = menuBarComponent.clearModelButton;
export const addTestStlButton = menuBarComponent.addTestStlButton;
export const addTestCylinderButton = menuBarComponent.addTestCylinderButton;

export const generateGCodeButton = document.getElementById(
	"generateGCodeButton",
) as HTMLInputElement;
export const xRotate = document.getElementById("xRotate") as HTMLInputElement;
export const yRotate = document.getElementById("yRotate") as HTMLInputElement;
export const zRotate = document.getElementById("zRotate") as HTMLInputElement;
export const xTranslate = document.getElementById(
	"xTranslate",
) as HTMLInputElement;
export const yTranslate = document.getElementById(
	"yTranslate",
) as HTMLInputElement;
export const zTranslate = document.getElementById(
	"zTranslate",
) as HTMLInputElement;
export const printerFileInput = document.getElementById(
	"printerFileInput",
) as HTMLInputElement;
export const ipAddressInput = document.getElementById(
	"ipAddressInput",
) as HTMLInputElement;
export const leftRadio = document.getElementById(
	"lockPositionLeft",
) as HTMLInputElement | null;
export const rightRadio = document.getElementById(
	"lockPositionRight",
) as HTMLInputElement | null;

export const activeMaterialProfileSelect = document.getElementById(
	"activeMaterialProfile",
) as HTMLSelectElement;

export const progressBar = document.getElementById(
	"progressBar",
) as HTMLProgressElement;
export const progressBarLabel = document.getElementById(
	"progressBarLabel",
) as HTMLLabelElement;
export const threeDViewer = document.getElementById(
	"modelViewer",
) as HTMLCanvasElement;
export const activeFileName = document.getElementById(
	"activeFileName",
) as HTMLSpanElement;
export const collisionWarning = document.getElementById(
	"collisionWarning",
) as HTMLSpanElement;
export const toggleTransformControlsButton = document.getElementById(
	"toggleTransformControlsButton",
) as HTMLButtonElement;

export const progressBarDiv = document.getElementById(
	"progressBarDiv",
) as HTMLDivElement;
export const estimatedPrintTime = document.getElementById(
	"estimatedPrintTime",
) as HTMLParagraphElement;
export const ipAddressFailure = document.getElementById(
	"ipAddressFailure",
) as HTMLParagraphElement;
export const ipAddressSuccess = document.getElementById(
	"ipAddressSuccess",
) as HTMLParagraphElement;

export const appForm = document.getElementById("appForm") as HTMLFormElement;

export const materialProfileForm = document.querySelector(
	"material-profile-form",
) as MaterialProfileForm;
export const settingsDialog = document.querySelector(
	"app-settings",
) as Settings;
export const infoDialog = document.querySelector("app-info") as Info;
