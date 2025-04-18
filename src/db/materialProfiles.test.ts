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
import { getDb } from "../db/getDb";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	getMaterialProfiles,
	updateMaterialProfile,
} from "../db/materialProfiles";
import type { Entities } from "../db/types";

// Mock the database implementation
vi.mock("../db/getDb", () => ({
	getDb: vi.fn(),
}));

describe("Material Profiles", () => {
	const mockDb = {
		materialProfiles: {
			add: vi.fn(),
			toArray: vi.fn(),
			where: vi.fn(),
			update: vi.fn(),
		},
		appSettings: {
			where: vi.fn(),
		},
	};

	const mockWhere = {
		equals: vi.fn(),
	};

	const mockFirst = {
		first: vi.fn(),
	};

	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Setup the mocked database
		(getDb as MockedFunction<typeof getDb>).mockResolvedValue(
			mockDb as unknown as Dexie & Entities,
		);
		mockDb.materialProfiles.where.mockReturnValue(mockWhere);
		mockDb.appSettings.where.mockReturnValue(mockWhere);
		mockWhere.equals.mockReturnValue(mockFirst);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should get all material profiles", async () => {
		const mockProfiles = [
			{
				id: 1,
				name: "cp1",
				nozzleTemp: 200,
				cupTemp: 130,
				shrinkFactor: 2.6,
				outputFactor: 1.0,
				feedrate: 2250,
			},
			{
				id: 2,
				name: "cp2",
				nozzleTemp: 210,
				cupTemp: 140,
				shrinkFactor: 2.7,
				outputFactor: 1.1,
				feedrate: 2300,
			},
		];

		mockDb.materialProfiles.toArray.mockResolvedValue(mockProfiles);

		const profiles = await getMaterialProfiles();

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.materialProfiles.toArray).toHaveBeenCalledTimes(1);
		expect(profiles).toEqual(mockProfiles);
	});

	it("should add a new material profile", async () => {
		const newProfile = {
			name: "cp3",
			nozzleTemp: 220,
			cupTemp: 150,
			shrinkFactor: 2.8,
			outputFactor: 1.2,
			feedrate: 2350,
		};

		mockDb.materialProfiles.add.mockResolvedValue(3); // Return a mock ID

		await addNewMaterialProfile(newProfile);

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.materialProfiles.add).toHaveBeenCalledTimes(1);
		expect(mockDb.materialProfiles.add).toHaveBeenCalledWith(newProfile);
	});

	it("should get the active material profile", async () => {
		const mockActiveProfile = {
			id: 1,
			name: "cp1",
			nozzleTemp: 200,
			cupTemp: 130,
			shrinkFactor: 2.6,
			outputFactor: 1.0,
			feedrate: 2250,
		};

		// Mock active profile setting
		mockFirst.first.mockResolvedValueOnce({ value: "cp1" });

		// Mock material profile retrieval
		mockFirst.first.mockResolvedValueOnce(mockActiveProfile);

		const activeProfile = await getActiveMaterialProfile();

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.appSettings.where).toHaveBeenCalledWith("name");
		expect(mockWhere.equals).toHaveBeenCalledWith("activeMaterialProfile");
		expect(mockFirst.first).toHaveBeenCalledTimes(2);
		expect(activeProfile).toEqual(mockActiveProfile);
	});

	it("should update a material profile", async () => {
		const updatedProfile = {
			id: 1,
			name: "cp1",
			nozzleTemp: 205,
			cupTemp: 135,
			shrinkFactor: 2.65,
			outputFactor: 1.05,
			feedrate: 2275,
		};

		mockDb.materialProfiles.update.mockResolvedValue(1); // Number of records updated

		await updateMaterialProfile(updatedProfile);

		expect(getDb).toHaveBeenCalledTimes(1);
		expect(mockDb.materialProfiles.update).toHaveBeenCalledTimes(1);
		expect(mockDb.materialProfiles.update).toHaveBeenCalledWith(
			updatedProfile.id,
			updatedProfile,
		);
	});
});
