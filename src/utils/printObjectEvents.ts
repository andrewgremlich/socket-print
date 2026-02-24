import {
	addTestCylinderButton,
	addTestStlButton,
	depthTranslate,
	horizontalTranslate,
	stlFileInput,
	verticalTranslate,
	xRotate,
	yRotate,
	zRotate,
} from "@/utils/htmlElements";

export type PrintObjectEventHandlers = {
	testStlClick: () => Promise<void>;
	testCylinderClick: () => Promise<void>;
	stlFileChange: (evt: Event) => Promise<void>;
	xRotate: () => void;
	yRotate: () => void;
	zRotate: () => void;
	verticalInput: (evt: Event) => void;
	horizontalInput: (evt: Event) => void;
	depthInput: (evt: Event) => void;
};

/**
 * Attaches all event listeners for PrintObject UI interactions.
 * Returns references to the handlers for later cleanup.
 */
export const attachPrintObjectEventListeners = (
	handlers: PrintObjectEventHandlers,
): void => {
	addTestStlButton?.addEventListener("click", handlers.testStlClick);
	addTestCylinderButton?.addEventListener("click", handlers.testCylinderClick);
	stlFileInput?.addEventListener("change", handlers.stlFileChange);
	xRotate?.addEventListener("click", handlers.xRotate);
	yRotate?.addEventListener("click", handlers.yRotate);
	zRotate?.addEventListener("click", handlers.zRotate);
	verticalTranslate?.addEventListener("input", handlers.verticalInput);
	horizontalTranslate?.addEventListener("input", handlers.horizontalInput);
	depthTranslate?.addEventListener("input", handlers.depthInput);
};

/**
 * Removes all event listeners for PrintObject UI interactions.
 */
export const detachPrintObjectEventListeners = (
	handlers: PrintObjectEventHandlers,
): void => {
	addTestStlButton?.removeEventListener("click", handlers.testStlClick);
	addTestCylinderButton?.removeEventListener(
		"click",
		handlers.testCylinderClick,
	);
	stlFileInput?.removeEventListener("change", handlers.stlFileChange);
	xRotate?.removeEventListener("click", handlers.xRotate);
	yRotate?.removeEventListener("click", handlers.yRotate);
	zRotate?.removeEventListener("click", handlers.zRotate);
	verticalTranslate?.removeEventListener("input", handlers.verticalInput);
	horizontalTranslate?.removeEventListener("input", handlers.horizontalInput);
	depthTranslate?.removeEventListener("input", handlers.depthInput);
};

/**
 * Toggles the disabled state of all transform input controls.
 */
export const toggleTransformInputs = (isDisabled: boolean): void => {
	xRotate.disabled = isDisabled;
	yRotate.disabled = isDisabled;
	zRotate.disabled = isDisabled;
	verticalTranslate.disabled = isDisabled;
	horizontalTranslate.disabled = isDisabled;
	depthTranslate.disabled = isDisabled;
};
