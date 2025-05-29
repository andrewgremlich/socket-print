import type { Dexie } from "dexie";
import {
	type MockedFunction,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	getAppSettings,
	getCupSize,
	getLockPosition,
	saveCupSize,
	saveLockPosition,
} from "../db/appSettings";
import { getDb } from "../db/getDb";
import type { Entities } from "../db/types";

// Mock the database implementation
vi.mock("../db/getDb", () => ({
	getDb: vi.fn(),
}));

describe("App Settings", () => {
	const mockDb = {
		appSettings: {
			toArray: vi.fn(),
			where: vi.fn(),
			update: vi.fn(),
			modify: vi.fn(),
		},
	};

	const mockWhere = {
		equals: vi.fn(),
	};

	const mockFirst = {
		first: vi.fn(),
		modify: vi.fn(),
	};

	const mockModify = {
		modify: vi.fn(),
	};

	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Setup the mocked database
		(getDb as MockedFunction<typeof getDb>).mockResolvedValue(
			mockDb as unknown as Dexie & Entities,
		);
		mockDb.appSettings.where.mockReturnValue(mockWhere);
		mockWhere.equals.mockReturnValue(mockFirst);
		mockFirst.modify = mockModify.modify;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should get all app settings", async () => {
		const mockSettings = [
			{ id: 1, name: "ipAddress", value: "192.168.1.100" },
			{ id: 2, name: "lockPosition", value: "right" },
			{ id: 3, name: "cupSize", value: "93x25" },
		];

		mockDb.appSettings.toArray.mockResolvedValue(mockSettings);

		const settings = await getAppSettings();

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.toArray).toHaveBeenCalledTimes(1);
		expect(settings).toEqual(mockSettings);
	});

	it("should get the lock position setting", async () => {
		const mockLockPosition = { id: 2, name: "lockPosition", value: "right" };

		mockFirst.first.mockResolvedValue(mockLockPosition);

		const lockPosition = await getLockPosition();

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.where).toHaveBeenCalledWith("name");
		expect(mockWhere.equals).toHaveBeenCalledWith("lockPosition");
		expect(mockFirst.first).toHaveBeenCalledTimes(1);
		expect(lockPosition).toEqual(mockLockPosition);
	});

	it("should save the lock position setting", async () => {
		const newLockPosition = "left";

		mockModify.modify.mockResolvedValue(1); // Number of records modified

		await saveLockPosition(newLockPosition);

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.where).toHaveBeenCalledWith("name");
		expect(mockWhere.equals).toHaveBeenCalledWith("lockPosition");
		expect(mockModify.modify).toHaveBeenCalledWith({ value: newLockPosition });
	});

	it("should get the cup size setting", async () => {
		const mockCupSize = { id: 3, name: "cupSize", value: "93x25" };

		mockFirst.first.mockResolvedValue(mockCupSize);

		const cupSize = await getCupSize();

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.where).toHaveBeenCalledWith("name");
		expect(mockWhere.equals).toHaveBeenCalledWith("cupSize");
		expect(mockFirst.first).toHaveBeenCalledTimes(1);
		expect(cupSize).toEqual("93x25");
	});

	it("should save the cup size setting", async () => {
		const newCupSize = "93x38";

		mockModify.modify.mockResolvedValue(1); // Number of records modified

		await saveCupSize(newCupSize);

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.where).toHaveBeenCalledWith("name");
		expect(mockWhere.equals).toHaveBeenCalledWith("cupSize");
		expect(mockModify.modify).toHaveBeenCalledWith({ value: newCupSize });
	});
});
