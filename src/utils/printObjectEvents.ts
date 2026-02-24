import {
	addTestCylinderButton,
	addTestStlButton,
	stlFileInput,
	xRotate,
	xTranslate,
	yRotate,
	yTranslate,
	zRotate,
	zTranslate,
} from "@/utils/htmlElements";

export type PrintObjectEventHandlers = {
	testStlClick: () => Promise<void>;
	testCylinderClick: () => Promise<void>;
	stlFileChange: (evt: Event) => Promise<void>;
	xRotate: () => void;
	yRotate: () => void;
	zRotate: () => void;
	xInput: (evt: Event) => void;
	yInput: (evt: Event) => void;
	zInput: (evt: Event) => void;
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
	xTranslate?.addEventListener("input", handlers.xInput);
	yTranslate?.addEventListener("input", handlers.yInput);
	zTranslate?.addEventListener("input", handlers.zInput);
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
	xTranslate?.removeEventListener("input", handlers.xInput);
	yTranslate?.removeEventListener("input", handlers.yInput);
	zTranslate?.removeEventListener("input", handlers.zInput);
};

/**
 * Toggles the disabled state of all transform input controls.
 */
export const toggleTransformInputs = (isDisabled: boolean): void => {
	xRotate.disabled = isDisabled;
	yRotate.disabled = isDisabled;
	zRotate.disabled = isDisabled;
	xTranslate.disabled = isDisabled;
	yTranslate.disabled = isDisabled;
	zTranslate.disabled = isDisabled;
};
