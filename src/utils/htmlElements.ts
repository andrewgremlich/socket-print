import type { Info } from "@/web-components/Info";
import type { MaterialProfileForm } from "@/web-components/MaterialProfileForm";
import type { Settings } from "@/web-components/Settings";

export const loadingScreen = document.getElementById("loading");

export const addTestStlButton = document.getElementById(
	"addTestStlButton",
) as HTMLButtonElement;
export const addTestCylinderButton = document.getElementById(
	"addTestCylinderButton",
) as HTMLButtonElement;
export const stlFileInput = document.getElementById(
	"stlFileInput",
) as HTMLInputElement;
export const generateGCodeButton = document.getElementById(
	"generateGCodeButton",
) as HTMLInputElement;
export const coronalRotater = document.getElementById(
	"coronalRotater",
) as HTMLInputElement;
export const sagittalRotate = document.getElementById(
	"sagittalRotate",
) as HTMLInputElement;
export const transversalRotater = document.getElementById(
	"transversalRotater",
) as HTMLInputElement;
export const horizontalTranslate = document.getElementById(
	"horizontalTranslate",
) as HTMLInputElement;
export const depthTranslate = document.getElementById(
	"depthTranslate",
) as HTMLInputElement;
export const verticalTranslate = document.getElementById(
	"verticalTranslate",
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
export const toggleZRotateTransformControlsButton = document.getElementById(
	"toggleZRotateTransformControls",
) as HTMLButtonElement;

export const menuBar = document.getElementById("menuBar") as HTMLDivElement;
export const menuBarDropdowns = document.querySelectorAll(
	".menuBarDropdown",
) as unknown as HTMLDivElement[];
export const progressBarDiv = document.getElementById(
	"progressBarDiv",
) as HTMLDivElement;
export const addMaterialProfile = document.getElementById(
	"addMaterialProfile",
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

export const editActiveMaterialProfile = document.getElementById(
	"editActiveMaterialProfile",
) as HTMLDivElement;
export const deleteMaterialProfileButton = document.getElementById(
	"deleteMaterialProfile",
) as HTMLButtonElement;
export const clearModelButton = document.getElementById(
	"clearModelButton",
) as HTMLButtonElement;
export const helpButton = document.getElementById(
	"helpButton",
) as HTMLButtonElement;

export const appForm = document.getElementById("appForm") as HTMLFormElement;

export const materialProfileForm = document.querySelector(
	"material-profile-form",
) as MaterialProfileForm;
export const activateSettingsDialog = document.getElementById(
	"activateSettingsDialog",
) as HTMLInputElement;
export const activateInfoDialog = document.getElementById(
	"activateInfoDialog",
) as HTMLInputElement;
export const settingsDialog = document.querySelector(
	"app-settings",
) as Settings;
export const infoDialog = document.querySelector("app-info") as Info;

// Trim line controls
export const drawTrimLineBtn = document.getElementById(
	"drawTrimLineBtn",
) as HTMLButtonElement;
export const clearTrimLineBtn = document.getElementById(
	"clearTrimLineBtn",
) as HTMLButtonElement;
export const applyTrimLineCheckbox = document.getElementById(
	"applyTrimLineCheckbox",
) as HTMLInputElement;
export const trimLineStatus = document.getElementById(
	"trimLineStatus",
) as HTMLParagraphElement;
