import { afterEach, describe, expect, test, vi } from "vitest";

const mockToArray = vi.fn();
const mockFirst = vi.fn();
const mockModify = vi.fn();
const mockEquals = vi.fn(() => ({ first: mockFirst, modify: mockModify }));
const mockWhere = vi.fn(() => ({ equals: mockEquals }));

vi.mock("./db", () => ({
	db: {
		formValues: {
			toArray: mockToArray,
			where: mockWhere,
		},
	},
}));

const {
	getFormKeyValues,
	setFormValues,
	getIpAddress,
	getLockPosition,
	getCupSize,
	getCupSizeHeight,
	getNozzleSize,
	getLayerHeight,
	saveActiveMaterialProfile,
} = await import("./formValuesDbActions");

afterEach(() => {
	vi.clearAllMocks();
});

describe("getFormKeyValues", () => {
	test("returns all form values", async () => {
		const values = [
			{ id: 1, name: "ipAddress", value: "192.168.1.1" },
			{ id: 2, name: "nozzleSize", value: 1.2 },
		];
		mockToArray.mockResolvedValue(values);

		const result = await getFormKeyValues();

		expect(result).toEqual(values);
		expect(mockToArray).toHaveBeenCalledOnce();
	});
});

describe("setFormValues", () => {
	test("modifies each setting by name", async () => {
		mockModify.mockResolvedValue(1);

		await setFormValues({ ipAddress: "10.0.0.1", nozzleSize: 0.8 });

		expect(mockWhere).toHaveBeenCalledTimes(2);
		expect(mockEquals).toHaveBeenCalledWith("ipAddress");
		expect(mockEquals).toHaveBeenCalledWith("nozzleSize");
		expect(mockModify).toHaveBeenCalledWith({ value: "10.0.0.1" });
		expect(mockModify).toHaveBeenCalledWith({ value: 0.8 });
	});

	test("handles empty settings object", async () => {
		await setFormValues({});

		expect(mockWhere).not.toHaveBeenCalled();
	});
});

describe("getIpAddress", () => {
	test("returns IP address string", async () => {
		mockFirst.mockResolvedValue({
			id: 1,
			name: "ipAddress",
			value: "192.168.1.100",
		});

		const result = await getIpAddress();

		expect(result).toBe("192.168.1.100");
		expect(mockEquals).toHaveBeenCalledWith("ipAddress");
	});

	test("returns empty string when no IP address found", async () => {
		mockFirst.mockResolvedValue(undefined);

		const result = await getIpAddress();

		expect(result).toBe("");
	});
});

describe("getLockPosition", () => {
	test("returns lock position value", async () => {
		mockFirst.mockResolvedValue({ id: 1, name: "lockPosition", value: "left" });

		const result = await getLockPosition();

		expect(result).toBe("left");
		expect(mockEquals).toHaveBeenCalledWith("lockPosition");
	});

	test("returns right lock position", async () => {
		mockFirst.mockResolvedValue({
			id: 1,
			name: "lockPosition",
			value: "right",
		});

		const result = await getLockPosition();

		expect(result).toBe("right");
	});

	test("returns undefined when not found", async () => {
		mockFirst.mockResolvedValue(undefined);

		const result = await getLockPosition();

		expect(result).toBeUndefined();
	});
});

describe("getCupSize", () => {
	test("returns cup size object", async () => {
		const cupSize = {
			innerDiameter: 50,
			outerDiameter: 60,
			height: 80,
			name: "Medium",
		};
		mockFirst.mockResolvedValue({ id: 1, name: "cupSize", value: cupSize });

		const result = await getCupSize();

		expect(result).toEqual(cupSize);
		expect(mockEquals).toHaveBeenCalledWith("cupSize");
	});
});

describe("getCupSizeHeight", () => {
	test("returns only the height from cup size", async () => {
		const cupSize = {
			innerDiameter: 50,
			outerDiameter: 60,
			height: 80,
			name: "Medium",
		};
		mockFirst.mockResolvedValue({ id: 1, name: "cupSize", value: cupSize });

		const result = await getCupSizeHeight();

		expect(result).toBe(80);
	});
});

describe("getNozzleSize", () => {
	test("returns nozzle size as a number", async () => {
		mockFirst.mockResolvedValue({ id: 1, name: "nozzleSize", value: 1.2 });

		const result = await getNozzleSize();

		expect(result).toBe(1.2);
		expect(mockEquals).toHaveBeenCalledWith("nozzleSize");
	});

	test("converts string value to number", async () => {
		mockFirst.mockResolvedValue({ id: 1, name: "nozzleSize", value: "0.8" });

		const result = await getNozzleSize();

		expect(result).toBe(0.8);
	});
});

describe("getLayerHeight", () => {
	test("returns layer height as a number", async () => {
		mockFirst.mockResolvedValue({ id: 1, name: "layerHeight", value: 0.5 });

		const result = await getLayerHeight();

		expect(result).toBe(0.5);
		expect(mockEquals).toHaveBeenCalledWith("layerHeight");
	});

	test("converts string value to number", async () => {
		mockFirst.mockResolvedValue({ id: 1, name: "layerHeight", value: "1.0" });

		const result = await getLayerHeight();

		expect(result).toBe(1.0);
	});
});

describe("saveActiveMaterialProfile", () => {
	test("modifies the active material profile by name", async () => {
		mockModify.mockResolvedValue(1);

		await saveActiveMaterialProfile("PLA-Pro");

		expect(mockEquals).toHaveBeenCalledWith("activeMaterialProfile");
		expect(mockModify).toHaveBeenCalledWith({ value: "PLA-Pro" });
	});
});
