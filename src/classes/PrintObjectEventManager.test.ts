/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PrintObjectType } from "@/db/types";
import {
	type EventManagerCallbacks,
	PrintObjectEventManager,
} from "./PrintObjectEventManager";

// Mock dependencies
vi.mock("@/utils/printObject", () => ({
	fetchStlFile: vi.fn().mockReturnValue(() => Promise.resolve()),
}));

vi.mock("@/utils/printObjectEvents", () => ({
	attachPrintObjectEventListeners: vi.fn(),
	detachPrintObjectEventListeners: vi.fn(),
	toggleTransformInputs: vi.fn(),
}));

function createMockCallbacks(): EventManagerCallbacks {
	return {
		onClearData: vi.fn().mockResolvedValue(undefined),
		onTestCylinder: vi.fn().mockResolvedValue(undefined),
		onStlFileChange: vi.fn().mockResolvedValue(undefined),
		onXRotate: vi.fn(),
		onYRotate: vi.fn(),
		onZRotate: vi.fn(),
		onXChange: vi.fn(),
		onYChange: vi.fn(),
		onZChange: vi.fn(),
		onError: vi.fn(),
		setCurrentType: vi.fn(),
	};
}

describe("PrintObjectEventManager", () => {
	let eventManager: PrintObjectEventManager;
	let mockCallbacks: EventManagerCallbacks;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCallbacks = createMockCallbacks();
		eventManager = new PrintObjectEventManager(mockCallbacks);
	});

	describe("attach", () => {
		test("attaches event listeners", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			expect(attachPrintObjectEventListeners).toHaveBeenCalled();
		});

		test("creates handlers for all events", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			expect(handlers).toHaveProperty("testStlClick");
			expect(handlers).toHaveProperty("testCylinderClick");
			expect(handlers).toHaveProperty("stlFileChange");
			expect(handlers).toHaveProperty("xRotate");
			expect(handlers).toHaveProperty("yRotate");
			expect(handlers).toHaveProperty("zRotate");
			expect(handlers).toHaveProperty("xInput");
			expect(handlers).toHaveProperty("yInput");
			expect(handlers).toHaveProperty("zInput");
		});
	});

	describe("detach", () => {
		test("detaches event listeners after attach", async () => {
			const { detachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();
			eventManager.detach();

			expect(detachPrintObjectEventListeners).toHaveBeenCalled();
		});

		test("does nothing when not attached", async () => {
			const { detachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.detach();

			expect(detachPrintObjectEventListeners).not.toHaveBeenCalled();
		});
	});

	describe("toggleInputs", () => {
		test("calls toggleTransformInputs with disabled=true", async () => {
			const { toggleTransformInputs } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.toggleInputs(true);

			expect(toggleTransformInputs).toHaveBeenCalledWith(true);
		});

		test("calls toggleTransformInputs with disabled=false", async () => {
			const { toggleTransformInputs } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.toggleInputs(false);

			expect(toggleTransformInputs).toHaveBeenCalledWith(false);
		});
	});

	describe("event handlers", () => {
		test("testStlClick clears data and sets type to Socket", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			await handlers.testStlClick();

			expect(mockCallbacks.onClearData).toHaveBeenCalled();
			expect(mockCallbacks.setCurrentType).toHaveBeenCalledWith(
				PrintObjectType.Socket,
			);
		});

		test("testCylinderClick clears data, sets type, and calls onTestCylinder", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			await handlers.testCylinderClick();

			expect(mockCallbacks.onClearData).toHaveBeenCalled();
			expect(mockCallbacks.setCurrentType).toHaveBeenCalledWith(
				PrintObjectType.TestCylinder,
			);
			expect(mockCallbacks.onTestCylinder).toHaveBeenCalled();
		});

		test("stlFileChange clears data for trusted events", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			const trustedEvent = { isTrusted: true } as Event;
			await handlers.stlFileChange(trustedEvent);

			expect(mockCallbacks.onClearData).toHaveBeenCalled();
			expect(mockCallbacks.setCurrentType).toHaveBeenCalledWith(
				PrintObjectType.Socket,
			);
			expect(mockCallbacks.onStlFileChange).toHaveBeenCalledWith(trustedEvent);
		});

		test("stlFileChange does not clear data for non-trusted events", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			const nonTrustedEvent = { isTrusted: false } as Event;
			await handlers.stlFileChange(nonTrustedEvent);

			expect(mockCallbacks.onClearData).not.toHaveBeenCalled();
			expect(mockCallbacks.onStlFileChange).toHaveBeenCalledWith(
				nonTrustedEvent,
			);
		});

		test("rotation handlers call appropriate callbacks", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];

			handlers.xRotate();
			expect(mockCallbacks.onXRotate).toHaveBeenCalled();

			handlers.yRotate();
			expect(mockCallbacks.onYRotate).toHaveBeenCalled();

			handlers.zRotate();
			expect(mockCallbacks.onZRotate).toHaveBeenCalled();
		});

		test("translation handlers call appropriate callbacks", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);

			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			const mockEvent = {} as Event;

			handlers.xInput(mockEvent);
			expect(mockCallbacks.onXChange).toHaveBeenCalledWith(mockEvent);

			handlers.yInput(mockEvent);
			expect(mockCallbacks.onYChange).toHaveBeenCalledWith(mockEvent);

			handlers.zInput(mockEvent);
			expect(mockCallbacks.onZChange).toHaveBeenCalledWith(mockEvent);
		});
	});

	describe("error handling", () => {
		test("calls onError when testStlClick fails", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);
			const error = new Error("Test error");
			mockCallbacks.onClearData = vi.fn().mockRejectedValue(error);

			eventManager = new PrintObjectEventManager(mockCallbacks);
			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			await handlers.testStlClick();

			expect(mockCallbacks.onError).toHaveBeenCalledWith(
				error,
				"Failed to load test STL file",
			);
		});

		test("calls onError when testCylinderClick fails", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);
			const error = new Error("Test error");
			mockCallbacks.onTestCylinder = vi.fn().mockRejectedValue(error);

			eventManager = new PrintObjectEventManager(mockCallbacks);
			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			await handlers.testCylinderClick();

			expect(mockCallbacks.onError).toHaveBeenCalledWith(
				error,
				"Failed to create test cylinder",
			);
		});

		test("calls onError when stlFileChange fails", async () => {
			const { attachPrintObjectEventListeners } = await import(
				"@/utils/printObjectEvents"
			);
			const error = new Error("Test error");
			mockCallbacks.onStlFileChange = vi.fn().mockRejectedValue(error);

			eventManager = new PrintObjectEventManager(mockCallbacks);
			eventManager.attach();

			const handlers = vi.mocked(attachPrintObjectEventListeners).mock
				.calls[0][0];
			await handlers.stlFileChange({ isTrusted: false } as Event);

			expect(mockCallbacks.onError).toHaveBeenCalledWith(
				error,
				"Failed to process STL file",
			);
		});
	});
});
