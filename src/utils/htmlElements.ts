export const userInterface = document.getElementById("userInterface");
export const loadingScreen = document.getElementById("loading");

export const stlFileInput = document.getElementById(
	"stlFileInput",
) as HTMLInputElement;
export const generateGCodeButton = document.getElementById(
	"generateGCodeButton",
) as HTMLInputElement;
export const changeDistalCupSize = document.getElementById(
	"changeDistalCupSize",
) as HTMLInputElement;
export const addFillerEllipsoid = document.getElementById(
	"addFillerEllipsoid",
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
export const elevateVertical = document.getElementById(
	"elecateVertical",
) as HTMLInputElement;
export const lowerVertical = document.getElementById(
	"lowerVertical",
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
export const menuBarButtonContainers = document.querySelectorAll(
	".menuBarButtonContainer",
) as unknown as HTMLDivElement[];
export const menuBarDropdowns = document.querySelectorAll(
	".menuBarDropdown",
) as unknown as HTMLDivElement[];
export const ipAddressSuccess = document.getElementById(
	"ipAddressSuccess",
) as HTMLDivElement;
export const ipAddressFailure = document.getElementById(
	"ipAddressFailure",
) as HTMLDivElement;
export const progressBarDiv = document.getElementById(
	"progressBarDiv",
) as HTMLDivElement;
export const editMaterialProfiles = document.getElementById(
	"editMaterialProfiles",
) as HTMLDivElement;
export const newMaterialProfile = document.getElementById(
	"makeNewMaterialProfile",
) as HTMLDivElement;

export const saveMaterialProfileButton = document.getElementById(
	"saveMaterialProfile",
) as HTMLButtonElement;
export const cancelMaterialProfileButton = document.getElementById(
	"cancelMaterialProfile",
) as HTMLButtonElement;
export const updateAppButton = document.getElementById(
	"updateAppButton",
) as HTMLButtonElement;
export const restoreDefaultsButton = document.getElementById(
	"restoreDefaultsButton",
) as HTMLButtonElement;

export const appForm = document.getElementById(
	"customizations",
) as HTMLFormElement;
export const newMaterialProfileForm = newMaterialProfile.querySelector(
	"form",
) as HTMLFormElement;
export const materialProfileForm = document.getElementById(
	"materialProfileForm",
) as HTMLFormElement;
