import { afterEach, describe, expect, test, vi } from "vitest";

const mockFirst = vi.fn();
const mockModify = vi.fn();
const mockEquals = vi.fn(() => ({ first: mockFirst, modify: mockModify }));
const mockWhere = vi.fn(() => ({ equals: mockEquals }));

vi.mock("./db", () => ({
	db: {
		appSettings: {
			where: mockWhere,
		},
	},
}));

const {
	getLockDepth,
	getCircularSegments,
	setCircularSegments,
	updateTranslateValues,
	getTranslateValues,
	updateRotateValues,
	getRotateValues,
	getStartingCupLayerHeight,
	getLineWidthAdjustment,
	setStartingCupLayerHeight,
	setLineWidthAdjustment,
	getTestCylinderHeight,
	setTestCylinderHeight,
	getTestCylinderInnerDiameter,
	setTestCylinderInnerDiameter,
	getSecondsPerLayer,
	setSecondsPerLayer,
	getEPerRevolution,
	setEPerRevolution,
} = await import("./appSettingsDbActions");

afterEach(() => {
	vi.clearAllMocks();
});

describe("getLockDepth", () => {
	test("returns lock depth as a number", async () => {
		mockFirst.mockResolvedValue({ name: "lockDepth", value: 15 });

		const result = await getLockDepth();

		expect(result).toBe(15);
		expect(mockEquals).toHaveBeenCalledWith("lockDepth");
	});

	test("converts string value to number", async () => {
		mockFirst.mockResolvedValue({ name: "lockDepth", value: "20" });

		const result = await getLockDepth();

		expect(result).toBe(20);
	});
});

describe("getCircularSegments", () => {
	test("returns circular segments as a number", async () => {
		mockFirst.mockResolvedValue({ name: "circularSegments", value: 64 });

		const result = await getCircularSegments();

		expect(result).toBe(64);
		expect(mockEquals).toHaveBeenCalledWith("circularSegments");
	});
});

describe("setCircularSegments", () => {
	test("modifies circular segments value", async () => {
		mockModify.mockResolvedValue(1);

		await setCircularSegments(128);

		expect(mockEquals).toHaveBeenCalledWith("circularSegments");
		expect(mockModify).toHaveBeenCalledWith({ value: 128 });
	});
});

describe("updateTranslateValues", () => {
	test("modifies all three translate axes in parallel", async () => {
		mockModify.mockResolvedValue(1);

		await updateTranslateValues(1.5, 2.5, 3.5);

		expect(mockEquals).toHaveBeenCalledWith("translateX");
		expect(mockEquals).toHaveBeenCalledWith("translateY");
		expect(mockEquals).toHaveBeenCalledWith("translateZ");
		expect(mockModify).toHaveBeenCalledWith({ value: 1.5 });
		expect(mockModify).toHaveBeenCalledWith({ value: 2.5 });
		expect(mockModify).toHaveBeenCalledWith({ value: 3.5 });
	});
});

describe("getTranslateValues", () => {
	test("returns translate values as x, y, z object", async () => {
		mockFirst
			.mockResolvedValueOnce({ name: "translateX", value: 10 })
			.mockResolvedValueOnce({ name: "translateY", value: 20 })
			.mockResolvedValueOnce({ name: "translateZ", value: 30 });

		const result = await getTranslateValues();

		expect(result).toEqual({ x: 10, y: 20, z: 30 });
	});

	test("converts string values to numbers", async () => {
		mockFirst
			.mockResolvedValueOnce({ name: "translateX", value: "5" })
			.mockResolvedValueOnce({ name: "translateY", value: "10" })
			.mockResolvedValueOnce({ name: "translateZ", value: "15" });

		const result = await getTranslateValues();

		expect(result).toEqual({ x: 5, y: 10, z: 15 });
	});
});

describe("updateRotateValues", () => {
	test("modifies all three rotation axes in parallel", async () => {
		mockModify.mockResolvedValue(1);

		await updateRotateValues(0.1, 0.2, 0.3);

		expect(mockEquals).toHaveBeenCalledWith("rotateX");
		expect(mockEquals).toHaveBeenCalledWith("rotateY");
		expect(mockEquals).toHaveBeenCalledWith("rotateZ");
		expect(mockModify).toHaveBeenCalledWith({ value: 0.1 });
		expect(mockModify).toHaveBeenCalledWith({ value: 0.2 });
		expect(mockModify).toHaveBeenCalledWith({ value: 0.3 });
	});
});

describe("getRotateValues", () => {
	test("returns rotate values as x, y, z object", async () => {
		mockFirst
			.mockResolvedValueOnce({ name: "rotateX", value: 0.5 })
			.mockResolvedValueOnce({ name: "rotateY", value: 1.0 })
			.mockResolvedValueOnce({ name: "rotateZ", value: 1.5 });

		const result = await getRotateValues();

		expect(result).toEqual({ x: 0.5, y: 1.0, z: 1.5 });
	});
});

describe("getStartingCupLayerHeight", () => {
	test("returns starting cup layer height as a number", async () => {
		mockFirst.mockResolvedValue({ name: "startingCupLayerHeight", value: 5 });

		const result = await getStartingCupLayerHeight();

		expect(result).toBe(5);
		expect(mockEquals).toHaveBeenCalledWith("startingCupLayerHeight");
	});
});

describe("setStartingCupLayerHeight", () => {
	test("modifies starting cup layer height", async () => {
		mockModify.mockResolvedValue(1);

		await setStartingCupLayerHeight(8);

		expect(mockEquals).toHaveBeenCalledWith("startingCupLayerHeight");
		expect(mockModify).toHaveBeenCalledWith({ value: 8 });
	});
});

describe("getLineWidthAdjustment", () => {
	test("returns line width adjustment as a number", async () => {
		mockFirst.mockResolvedValue({ name: "lineWidthAdjustment", value: 0.4 });

		const result = await getLineWidthAdjustment();

		expect(result).toBe(0.4);
		expect(mockEquals).toHaveBeenCalledWith("lineWidthAdjustment");
	});
});

describe("setLineWidthAdjustment", () => {
	test("modifies line width adjustment", async () => {
		mockModify.mockResolvedValue(1);

		await setLineWidthAdjustment(0.6);

		expect(mockEquals).toHaveBeenCalledWith("lineWidthAdjustment");
		expect(mockModify).toHaveBeenCalledWith({ value: 0.6 });
	});
});

describe("getTestCylinderHeight", () => {
	test("returns test cylinder height as a number", async () => {
		mockFirst.mockResolvedValue({ name: "testCylinderHeight", value: 50 });

		const result = await getTestCylinderHeight();

		expect(result).toBe(50);
		expect(mockEquals).toHaveBeenCalledWith("testCylinderHeight");
	});
});

describe("setTestCylinderHeight", () => {
	test("modifies test cylinder height", async () => {
		mockModify.mockResolvedValue(1);

		await setTestCylinderHeight(75);

		expect(mockEquals).toHaveBeenCalledWith("testCylinderHeight");
		expect(mockModify).toHaveBeenCalledWith({ value: 75 });
	});
});

describe("getTestCylinderInnerDiameter", () => {
	test("returns test cylinder inner diameter as a number", async () => {
		mockFirst.mockResolvedValue({
			name: "testCylinderInnerDiameter",
			value: 25,
		});

		const result = await getTestCylinderInnerDiameter();

		expect(result).toBe(25);
		expect(mockEquals).toHaveBeenCalledWith("testCylinderInnerDiameter");
	});
});

describe("setTestCylinderInnerDiameter", () => {
	test("modifies test cylinder inner diameter", async () => {
		mockModify.mockResolvedValue(1);

		await setTestCylinderInnerDiameter(30);

		expect(mockEquals).toHaveBeenCalledWith("testCylinderInnerDiameter");
		expect(mockModify).toHaveBeenCalledWith({ value: 30 });
	});
});

describe("getSecondsPerLayer", () => {
	test("returns seconds per layer as a number", async () => {
		mockFirst.mockResolvedValue({ name: "secondsPerLayer", value: 12 });

		const result = await getSecondsPerLayer();

		expect(result).toBe(12);
		expect(mockEquals).toHaveBeenCalledWith("secondsPerLayer");
	});
});

describe("setSecondsPerLayer", () => {
	test("modifies seconds per layer", async () => {
		mockModify.mockResolvedValue(1);

		await setSecondsPerLayer(15);

		expect(mockEquals).toHaveBeenCalledWith("secondsPerLayer");
		expect(mockModify).toHaveBeenCalledWith({ value: 15 });
	});
});

describe("getEPerRevolution", () => {
	test("returns E per revolution as a number", async () => {
		mockFirst.mockResolvedValue({ name: "ePerRevolution", value: 3.14 });

		const result = await getEPerRevolution();

		expect(result).toBe(3.14);
		expect(mockEquals).toHaveBeenCalledWith("ePerRevolution");
	});
});

describe("setEPerRevolution", () => {
	test("modifies E per revolution", async () => {
		mockModify.mockResolvedValue(1);

		await setEPerRevolution(2.5);

		expect(mockEquals).toHaveBeenCalledWith("ePerRevolution");
		expect(mockModify).toHaveBeenCalledWith({ value: 2.5 });
	});
});
