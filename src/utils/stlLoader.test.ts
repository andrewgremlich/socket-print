import { BoxGeometry, BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PrintObjectType } from "@/db/types";
import { exportMeshToDatabase, readSTLFile } from "./stlLoader";

vi.mock("@/db/file", () => ({
	setFileByName: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("three/examples/jsm/loaders/STLLoader.js", () => ({
	STLLoader: class MockSTLLoader {
		parse() {
			return new BufferGeometry();
		}
	},
}));

vi.mock("three/examples/jsm/Addons.js", () => ({
	STLExporter: class MockSTLExporter {
		parse() {
			return "solid test\nendsolid test";
		}
	},
}));

let mockFileReaderShouldError = false;

class MockFileReader {
	onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
	onerror: (() => void) | null = null;
	result: ArrayBuffer | null = null;

	readAsArrayBuffer(_file: Blob) {
		if (mockFileReaderShouldError) {
			if (this.onerror) {
				this.onerror();
			}
			return;
		}
		this.result = new ArrayBuffer(8);
		if (this.onload) {
			this.onload({
				target: { result: this.result },
			} as ProgressEvent<FileReader>);
		}
	}
}

vi.stubGlobal("FileReader", MockFileReader);

describe("readSTLFile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFileReaderShouldError = false;
	});

	test("resolves with BufferGeometry when file is read successfully", async () => {
		const mockArrayBuffer = new ArrayBuffer(8);
		const mockFile = new File([mockArrayBuffer], "test.stl", {
			type: "model/stl",
		});

		const result = await readSTLFile(mockFile);

		expect(result).toBeInstanceOf(BufferGeometry);
	});

	test("rejects when FileReader encounters an error", async () => {
		mockFileReaderShouldError = true;
		const mockFile = new File([], "test.stl", { type: "model/stl" });

		await expect(readSTLFile(mockFile)).rejects.toThrow(
			"Failed to read STL file",
		);
	});

	test("uses FileReader to read file as ArrayBuffer", async () => {
		const readAsArrayBufferSpy = vi.spyOn(
			MockFileReader.prototype,
			"readAsArrayBuffer",
		);
		const mockFile = new File([new ArrayBuffer(8)], "test.stl", {
			type: "model/stl",
		});

		await readSTLFile(mockFile);

		expect(readAsArrayBufferSpy).toHaveBeenCalledWith(mockFile);
		readAsArrayBufferSpy.mockRestore();
	});
});

describe("exportMeshToDatabase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("computes bounding box before exporting", async () => {
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial();
		const mesh = new Mesh(geometry, material);

		const computeBoundingBoxSpy = vi.spyOn(mesh.geometry, "computeBoundingBox");

		await exportMeshToDatabase(mesh, "test.stl", PrintObjectType.Socket);

		expect(computeBoundingBoxSpy).toHaveBeenCalled();
	});

	test("calls setFileByName with correct parameters", async () => {
		const { setFileByName } = await import("@/db/file");
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial();
		const mesh = new Mesh(geometry, material);

		await exportMeshToDatabase(mesh, "socket.stl", PrintObjectType.Socket);

		expect(setFileByName).toHaveBeenCalledWith("socket.stl", {
			name: "socket.stl",
			type: PrintObjectType.Socket,
			file: expect.any(File),
		});
	});

	test("creates file with correct MIME type", async () => {
		const { setFileByName } = await import("@/db/file");
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial();
		const mesh = new Mesh(geometry, material);

		await exportMeshToDatabase(
			mesh,
			"cylinder.stl",
			PrintObjectType.TestCylinder,
		);

		const call = vi.mocked(setFileByName).mock.calls[0];
		const fileArg = call[1].file as File;
		expect(fileArg.type).toBe("model/stl");
	});

	test("exports TestCylinder type correctly", async () => {
		const { setFileByName } = await import("@/db/file");
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial();
		const mesh = new Mesh(geometry, material);

		await exportMeshToDatabase(
			mesh,
			"cylinder.stl",
			PrintObjectType.TestCylinder,
		);

		expect(setFileByName).toHaveBeenCalledWith(
			"cylinder.stl",
			expect.objectContaining({
				type: PrintObjectType.TestCylinder,
			}),
		);
	});
});
