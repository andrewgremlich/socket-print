import type { MaterialProfileForm } from "@/web-components/MaterialProfileForm";

export const loadingScreen = document.getElementById("loading");

export const stlFileInput = document.getElementById(
	"stlFileInput",
) as HTMLInputElement;
export const generateGCodeButton = document.getElementById(
	"generateGCodeButton",
) as HTMLInputElement;
export const transversalRotate = document.getElementById(
	"transversalRotate",
) as HTMLInputElement;
export const sagittalRotate = document.getElementById(
	"sagittalRotate",
) as HTMLInputElement;
export const coronalRotate = document.getElementById(
	"coronalRotate",
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
export const mergeMeshes = document.getElementById(
	"mergeMeshes",
) as HTMLInputElement;
export const printerFileInput = document.getElementById(
	"printerFileInput",
) as HTMLInputElement;
export const ipAddressInput = document.getElementById(
	"ipAddressInput",
) as HTMLInputElement;

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
	"3dViewer",
) as HTMLCanvasElement;

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
export const newMaterialProfile = document.getElementById(
	"makeNewMaterialProfile",
) as HTMLDivElement;
export const estimatedPrintTime = document.getElementById(
	"estimatedPrintTime",
) as HTMLParagraphElement;
export const ipAddressFailure = document.getElementById(
	"ipAddressFailure",
) as IconElement;
export const ipAddressSuccess = document.getElementById(
	"ipAddressSuccess",
) as IconElement;

export const editActiveMaterialProfile = document.getElementById(
	"editActiveMaterialProfile",
) as HTMLDivElement;
export const cancelMaterialProfileButton = document.getElementById(
	"cancelMaterialProfile",
) as HTMLButtonElement;
export const deleteMaterialProfileButton = document.getElementById(
	"deleteMaterialProfile",
) as HTMLButtonElement;
export const restoreDefaultsButton = document.getElementById(
	"restoreDefaultsButton",
) as HTMLButtonElement;
export const clearModelButton = document.getElementById(
	"clearModelButton",
) as HTMLButtonElement;

export const appForm = document.getElementById(
	"customizations",
) as HTMLFormElement;

export const materialProfileForm = document.querySelector(
	"material-profile-form",
) as MaterialProfileForm;
