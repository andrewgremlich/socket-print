import { afterEach, describe, expect, test, vi } from "vitest";
import { PrintObjectType } from "./types";

const mockToArray = vi.fn();
const mockClear = vi.fn();
const mockFirst = vi.fn();
const mockEquals = vi.fn(() => ({ first: mockFirst }));
const mockWhere = vi.fn(() => ({ equals: mockEquals }));
const mockUpdate = vi.fn();
const mockAdd = vi.fn();

vi.mock("./db", () => ({
	db: {
		savedFiles: {
			toArray: mockToArray,
			clear: mockClear,
			where: mockWhere,
			update: mockUpdate,
			add: mockAdd,
		},
	},
}));

// Import after mock setup
const { getAllFiles, deleteAllFiles, setFileByName } = await import("./file");

describe("getAllFiles", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("returns all saved files", async () => {
		const files = [
			{
				id: 1,
				name: "socket.stl",
				type: PrintObjectType.Socket,
				file: new Blob(),
			},
			{
				id: 2,
				name: "cylinder.stl",
				type: PrintObjectType.TestCylinder,
				file: new Blob(),
			},
		];
		mockToArray.mockResolvedValue(files);

		const result = await getAllFiles();

		expect(result).toEqual(files);
		expect(mockToArray).toHaveBeenCalledOnce();
	});

	test("returns empty array when no files exist", async () => {
		mockToArray.mockResolvedValue([]);

		const result = await getAllFiles();

		expect(result).toEqual([]);
	});
});

describe("deleteAllFiles", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("clears the savedFiles table", async () => {
		mockClear.mockResolvedValue(undefined);

		await deleteAllFiles();

		expect(mockClear).toHaveBeenCalledOnce();
	});
});

describe("setFileByName", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("clears all files before saving", async () => {
		mockClear.mockResolvedValue(undefined);
		mockFirst.mockResolvedValue(undefined);
		mockAdd.mockResolvedValue(1);

		const file = {
			name: "socket.stl",
			type: PrintObjectType.Socket,
			file: new Blob(["data"]),
		};
		await setFileByName("socket.stl", file);

		expect(mockClear).toHaveBeenCalledOnce();
	});

	test("adds new file when no existing file with same name", async () => {
		mockClear.mockResolvedValue(undefined);
		mockFirst.mockResolvedValue(undefined);
		mockAdd.mockResolvedValue(1);

		const file = {
			name: "socket.stl",
			type: PrintObjectType.Socket,
			file: new Blob(["data"]),
		};
		await setFileByName("socket.stl", file);

		expect(mockAdd).toHaveBeenCalledWith({
			type: PrintObjectType.Socket,
			file: file.file,
			name: "socket.stl",
		});
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	test("updates existing file when file with same name exists", async () => {
		mockClear.mockResolvedValue(undefined);
		mockFirst.mockResolvedValue({
			id: 5,
			name: "socket.stl",
			type: PrintObjectType.Socket,
			file: new Blob(),
		});
		mockUpdate.mockResolvedValue(1);

		const file = {
			name: "socket.stl",
			type: PrintObjectType.Socket,
			file: new Blob(["new data"]),
		};
		await setFileByName("socket.stl", file);

		expect(mockUpdate).toHaveBeenCalledWith(5, file);
		expect(mockAdd).not.toHaveBeenCalled();
	});

	test("queries by the correct file name", async () => {
		mockClear.mockResolvedValue(undefined);
		mockFirst.mockResolvedValue(undefined);
		mockAdd.mockResolvedValue(1);

		const file = {
			name: "test.stl",
			type: PrintObjectType.TestCylinder,
			file: new Blob(),
		};
		await setFileByName("test.stl", file);

		expect(mockWhere).toHaveBeenCalledWith("name");
		expect(mockEquals).toHaveBeenCalledWith("test.stl");
	});
});
