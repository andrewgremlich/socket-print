import { PrintObjectType } from "@/db/types";
import { fetchStlFile } from "@/utils/printObject";
import {
	attachPrintObjectEventListeners,
	detachPrintObjectEventListeners,
	type PrintObjectEventHandlers,
	toggleTransformInputs,
} from "@/utils/printObjectEvents";
import type { IEventManager } from "./types";

export type EventManagerCallbacks = {
	onClearData: () => Promise<void>;
	onTestCylinder: () => Promise<void>;
	onStlFileChange: (evt: Event) => Promise<void>;
	onXRotate: () => void;
	onYRotate: () => void;
	onZRotate: () => void;
	onVerticalChange: (evt: Event) => void;
	onHorizontalChange: (evt: Event) => void;
	onDepthChange: (evt: Event) => void;
	onError: (error: unknown, message: string) => void;
	setCurrentType: (type: PrintObjectType) => void;
};

/**
 * Manages DOM event binding for the PrintObject UI controls.
 * Encapsulates all event listener setup and teardown.
 */
export class PrintObjectEventManager implements IEventManager {
	#eventHandlers: PrintObjectEventHandlers | null = null;
	#callbacks: EventManagerCallbacks;

	constructor(callbacks: EventManagerCallbacks) {
		this.#callbacks = callbacks;
	}

	/**
	 * Wraps an async handler with error handling.
	 */
	#wrapAsync<T extends unknown[]>(
		handler: (...args: T) => Promise<void>,
		errorMessage: string,
	): (...args: T) => Promise<void> {
		return async (...args: T) => {
			try {
				await handler(...args);
			} catch (error) {
				this.#callbacks.onError(error, errorMessage);
			}
		};
	}

	/**
	 * Attaches all event listeners for the PrintObject UI.
	 */
	attach(): void {
		this.#eventHandlers = {
			testStlClick: this.#wrapAsync(async () => {
				await this.#callbacks.onClearData();
				this.#callbacks.setCurrentType(PrintObjectType.Socket);
				await fetchStlFile("test_stl_file.stl")();
			}, "Failed to load test STL file"),

			testCylinderClick: this.#wrapAsync(async () => {
				await this.#callbacks.onClearData();
				this.#callbacks.setCurrentType(PrintObjectType.TestCylinder);
				await this.#callbacks.onTestCylinder();
			}, "Failed to create test cylinder"),

			stlFileChange: this.#wrapAsync(async (evt: Event) => {
				if (evt.isTrusted) {
					await this.#callbacks.onClearData();
					this.#callbacks.setCurrentType(PrintObjectType.Socket);
				}
				await this.#callbacks.onStlFileChange(evt);
			}, "Failed to process STL file"),

			xRotate: this.#callbacks.onXRotate,
			yRotate: this.#callbacks.onYRotate,
			zRotate: this.#callbacks.onZRotate,
			verticalInput: this.#callbacks.onVerticalChange,
			horizontalInput: this.#callbacks.onHorizontalChange,
			depthInput: this.#callbacks.onDepthChange,
		};

		attachPrintObjectEventListeners(this.#eventHandlers);
	}

	/**
	 * Detaches all event listeners.
	 */
	detach(): void {
		if (this.#eventHandlers) {
			detachPrintObjectEventListeners(this.#eventHandlers);
			this.#eventHandlers = null;
		}
	}

	/**
	 * Enables or disables transform input controls.
	 */
	toggleInputs(disabled: boolean): void {
		toggleTransformInputs(disabled);
	}
}
