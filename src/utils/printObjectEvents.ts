import {
	addTestCylinderButton,
	addTestStlButton,
	coronalRotater,
	depthTranslate,
	horizontalTranslate,
	sagittalRotate,
	stlFileInput,
	transversalRotater,
	verticalTranslate,
} from "@/utils/htmlElements";

export type PrintObjectEventHandlers = {
	testStlClick: () => Promise<void>;
	testCylinderClick: () => Promise<void>;
	stlFileChange: (evt: Event) => Promise<void>;
	coronalRotate: () => void;
	sagittalRotate: () => void;
	transversalRotate: () => void;
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
	coronalRotater?.addEventListener("click", handlers.coronalRotate);
	sagittalRotate?.addEventListener("click", handlers.sagittalRotate);
	transversalRotater?.addEventListener("click", handlers.transversalRotate);
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
	coronalRotater?.removeEventListener("click", handlers.coronalRotate);
	sagittalRotate?.removeEventListener("click", handlers.sagittalRotate);
	transversalRotater?.removeEventListener("click", handlers.transversalRotate);
	verticalTranslate?.removeEventListener("input", handlers.verticalInput);
	horizontalTranslate?.removeEventListener("input", handlers.horizontalInput);
	depthTranslate?.removeEventListener("input", handlers.depthInput);
};

/**
 * Toggles the disabled state of all transform input controls.
 */
export const toggleTransformInputs = (isDisabled: boolean): void => {
	coronalRotater.disabled = isDisabled;
	sagittalRotate.disabled = isDisabled;
	transversalRotater.disabled = isDisabled;
	verticalTranslate.disabled = isDisabled;
	horizontalTranslate.disabled = isDisabled;
	depthTranslate.disabled = isDisabled;
};
