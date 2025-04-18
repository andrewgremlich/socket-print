import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	updateMaterialProfile,
} from "@/db/materialProfiles";
import type { MaterialProfile } from "@/db/types";
import { MaterialProfileForm } from "@/web-components/MaterialProfileForm";

// Mock Dexie
vi.mock("dexie", () => {
	const Dexie = vi.fn(() => ({
		version: vi.fn().mockReturnThis(),
		stores: vi.fn().mockReturnThis(),
		table: vi.fn().mockReturnValue({
			get: vi.fn(),
			add: vi.fn(),
			update: vi.fn(),
			toArray: vi.fn(),
			bulkAdd: vi.fn(),
			bulkPut: vi.fn(),
			where: vi.fn().mockReturnThis(),
			equals: vi.fn().mockReturnThis(),
			first: vi.fn(),
			delete: vi.fn(),
		}),
		open: vi.fn(),
		close: vi.fn(),
	}));

	return { Dexie };
});

// Mock dependencies
vi.mock("@/db/materialProfiles", () => ({
	getActiveMaterialProfile: vi.fn(),
	addNewMaterialProfile: vi.fn(),
	updateMaterialProfile: vi.fn(),
}));

vi.mock("@/db/appendMaterialProfiles", () => ({
	appendMaterialProfiles: vi.fn(),
}));

vi.mock("@/db/loadMainDataForm", () => ({
	loadActiveMaterialProfile: vi.fn(),
}));

describe("MaterialProfileForm", () => {
	let materialProfileForm: MaterialProfileForm;
	let formElement: HTMLFormElement;
	let titleElement: HTMLElement;
	let cancelButton: HTMLElement;
	let saveEvent: Event;

	// Mock profile data
	const mockProfile: MaterialProfile = {
		id: 1,
		name: "cp1",
		nozzleTemp: 200,
		cupTemp: 130,
		shrinkFactor: 2.6,
		outputFactor: 1.0,
		feedrate: 2250,
	};

	beforeEach(() => {
		// Create a new instance of the component
		materialProfileForm = new MaterialProfileForm();
		document.body.appendChild(materialProfileForm);

		// Access shadow DOM elements
		formElement = materialProfileForm.shadowRoot.getElementById(
			"materialForm",
		) as HTMLFormElement;
		titleElement = materialProfileForm.shadowRoot.getElementById(
			"formTitle",
		) as HTMLElement;
		cancelButton = materialProfileForm.shadowRoot.getElementById(
			"cancelMaterialProfile",
		) as HTMLElement;

		// Reset mocks
		vi.resetAllMocks();

		// Mock form submission event
		saveEvent = new Event("submit");
		saveEvent.preventDefault = vi.fn();

		// Mock FormData
		global.FormData = vi.fn().mockImplementation(() => ({
			entries: () => {
				return {
					*[Symbol.iterator]() {
						yield ["materialProfileName", "cp1"];
						yield ["nozzleTemp", "200"];
						yield ["cupTemp", "130"];
						yield ["shrinkFactor", "2.6"];
						yield ["outputFactor", "1.0"];
						yield ["feedrate", "2250"];
					},
				};
			},
		}));
	});

	afterEach(() => {
		document.body.removeChild(materialProfileForm);
		vi.clearAllMocks();
	});

	it("should initialize with hidden form", () => {
		expect(materialProfileForm.shadowRoot.host.classList.contains("hide")).toBe(
			true,
		);
	});

	it("should show form with correct title for new profile", async () => {
		await materialProfileForm.showForm("new");

		expect(titleElement.textContent).toBe("Add Material Profile");
		expect(materialProfileForm.shadowRoot.host.classList.contains("hide")).toBe(
			false,
		);
		expect(getActiveMaterialProfile).not.toHaveBeenCalled();
	});

	it("should show form with correct title and populate fields for edit profile", async () => {
		(getActiveMaterialProfile as Mock).mockResolvedValue(mockProfile);

		// Create mock inputs
		const materialNameInput = document.createElement("input");
		materialNameInput.name = "materialProfileName";
		const nozzleTempInput = document.createElement("input");
		nozzleTempInput.name = "nozzleTemp";
		const cupTempInput = document.createElement("input");
		cupTempInput.name = "cupTemp";
		const shrinkFactorInput = document.createElement("input");
		shrinkFactorInput.name = "shrinkFactor";
		const outputFactorInput = document.createElement("input");
		outputFactorInput.name = "outputFactor";
		const feedrateInput = document.createElement("input");
		feedrateInput.name = "feedrate";

		// Add inputs to the form
		formElement.appendChild(materialNameInput);
		formElement.appendChild(nozzleTempInput);
		formElement.appendChild(cupTempInput);
		formElement.appendChild(shrinkFactorInput);
		formElement.appendChild(outputFactorInput);
		formElement.appendChild(feedrateInput);

		// Mock the getElementById to return our inputs
		const originalGetElementById =
			materialProfileForm.shadowRoot.getElementById;
		materialProfileForm.shadowRoot.getElementById = (id: string) => {
			if (id === "materialForm") return formElement;
			if (id === "formTitle") return titleElement;
			if (id === "cancelMaterialProfile") return cancelButton;
			if (id === "materialProfileName") return materialNameInput;
			if (id === "nozzleTemp") return nozzleTempInput;
			if (id === "cupTemp") return cupTempInput;
			if (id === "shrinkFactor") return shrinkFactorInput;
			if (id === "outputFactor") return outputFactorInput;
			if (id === "feedrate") return feedrateInput;
			return originalGetElementById.call(materialProfileForm.shadowRoot, id);
		};

		await materialProfileForm.showForm("edit");

		expect(titleElement.textContent).toBe("Edit Material Profile");
		expect(materialProfileForm.shadowRoot.host.classList.contains("hide")).toBe(
			false,
		);
		expect(getActiveMaterialProfile).toHaveBeenCalledTimes(1);
		expect(materialProfileForm.editMaterialProfile).toEqual(mockProfile);

		// Restore original getElementById
		materialProfileForm.shadowRoot.getElementById = originalGetElementById;
	});

	it("should hide form when cancel button is clicked", () => {
		materialProfileForm.shadowRoot.host.classList.remove("hide");

		cancelButton.click();

		expect(materialProfileForm.shadowRoot.host.classList.contains("hide")).toBe(
			true,
		);
	});

	it("should add new material profile when form is submitted", async () => {
		// Setup
		materialProfileForm.editMaterialProfile = null;

		// Act
		await materialProfileForm.saveProfile(saveEvent);

		// Assert
		expect(saveEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(addNewMaterialProfile).toHaveBeenCalledTimes(1);
		expect(addNewMaterialProfile).toHaveBeenCalledWith({
			name: "cp1",
			nozzleTemp: 200,
			cupTemp: 130,
			shrinkFactor: 2.6,
			outputFactor: 1.0,
			feedrate: 2250,
		});
		expect(updateMaterialProfile).not.toHaveBeenCalled();
		expect(appendMaterialProfiles).toHaveBeenCalledTimes(1);
		expect(loadActiveMaterialProfile).toHaveBeenCalledTimes(1);
	});

	it("should update existing profile when form is submitted in edit mode", async () => {
		// Setup
		materialProfileForm.editMaterialProfile = mockProfile;

		// Act
		await materialProfileForm.saveProfile(saveEvent);

		// Assert
		expect(saveEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(updateMaterialProfile).toHaveBeenCalledTimes(1);
		expect(updateMaterialProfile).toHaveBeenCalledWith({
			...mockProfile,
			name: "cp1",
			nozzleTemp: 200,
			cupTemp: 130,
			shrinkFactor: 2.6,
			outputFactor: 1.0,
			feedrate: 2250,
		});
		expect(addNewMaterialProfile).not.toHaveBeenCalled();
		expect(appendMaterialProfiles).toHaveBeenCalledTimes(1);
		expect(loadActiveMaterialProfile).toHaveBeenCalledTimes(1);
	});
});
