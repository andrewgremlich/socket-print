import { Vector3 } from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getCirclePoints, getTransitionLayer } from "./cupTransitionLayer";

vi.mock("@/db/appSettingsDbActions", () => ({
	getStartingCupLayerHeight: vi.fn().mockResolvedValue(0.2),
	getLineWidthAdjustment: vi.fn().mockResolvedValue(1.2),
}));

vi.mock("@/3d/calculateDistancePerLevel", () => ({
	calculateFeedratePerLevel: vi.fn().mockResolvedValue(1000),
}));

vi.mock("./getExtrusionCalculation", () => ({
	getExtrusionCalculation: vi.fn().mockReturnValue(5.0),
}));

describe("getCirclePoints", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns correct number of points based on segments", async () => {
		const startingPoint = new Vector3(10, 0, 0);
		const center = new Vector3(0, 0, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 8,
			center,
			layerHeight: 0.3,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		expect(result).toHaveLength(8);
	});

	test("each point has a Vector3 and calculatedLayerHeight", async () => {
		const startingPoint = new Vector3(5, 0, 0);
		const center = new Vector3(0, 0, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 4,
			center,
			layerHeight: 0.2,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		for (const item of result) {
			expect(item.point).toBeInstanceOf(Vector3);
			expect(typeof item.calculatedLayerHeight).toBe("number");
		}
	});

	test("first point starts at the starting point position", async () => {
		const startingPoint = new Vector3(10, 0, 0);
		const center = new Vector3(0, 0, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 4,
			center,
			layerHeight: 0.2,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		expect(result[0].point.x).toBeCloseTo(10, 5);
		expect(result[0].point.y).toBeCloseTo(0, 5);
	});

	test("points maintain constant radius from center", async () => {
		const startingPoint = new Vector3(10, 0, 0);
		const center = new Vector3(0, 0, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 8,
			center,
			layerHeight: 0.2,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		const expectedRadius = 10;
		for (const item of result) {
			const dx = item.point.x - center.x;
			const dy = item.point.y - center.y;
			const radius = Math.sqrt(dx * dx + dy * dy);
			expect(radius).toBeCloseTo(expectedRadius, 5);
		}
	});

	test("layer height increases progressively with shrinkScale", async () => {
		const startingPoint = new Vector3(10, 0, 0);
		const center = new Vector3(0, 0, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 4,
			center,
			layerHeight: 0.4,
			shrinkScale: 0.5,
			nozzleSizeOffset: 0,
		});

		for (let i = 1; i < result.length; i++) {
			expect(result[i].calculatedLayerHeight).toBeGreaterThan(
				result[i - 1].calculatedLayerHeight,
			);
		}
	});

	test("z coordinate increases across points", async () => {
		const startingPoint = new Vector3(10, 0, 5);
		const center = new Vector3(0, 0, 5);

		const result = await getCirclePoints(startingPoint, {
			segments: 4,
			center,
			layerHeight: 0.4,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		for (let i = 1; i < result.length; i++) {
			expect(result[i].point.z).toBeGreaterThan(result[i - 1].point.z);
		}
	});

	test("works with offset center", async () => {
		const center = new Vector3(5, 5, 0);
		const startingPoint = new Vector3(15, 5, 0);

		const result = await getCirclePoints(startingPoint, {
			segments: 4,
			center,
			layerHeight: 0.2,
			shrinkScale: 1,
			nozzleSizeOffset: 0,
		});

		expect(result).toHaveLength(4);
		const expectedRadius = 10;
		for (const item of result) {
			const dx = item.point.x - center.x;
			const dy = item.point.y - center.y;
			const radius = Math.sqrt(dx * dx + dy * dy);
			expect(radius).toBeCloseTo(expectedRadius, 5);
		}
	});
});

describe("getTransitionLayer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const baseOptions = {
		nozzleSize: 0.4,
		outputFactor: 1,
		offsetHeight: 0,
		gramsPerRevolution: 0.05,
		density: 1.24,
		ePerRevolution: 1,
	};

	test("returns G-code string", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 0, 0), calculatedLayerHeight: 0.25 },
			{ point: new Vector3(10, 10, 0), calculatedLayerHeight: 0.3 },
		];

		const result = await getTransitionLayer(points, baseOptions);

		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("generates correct number of G1 commands (one less than points)", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 0, 0), calculatedLayerHeight: 0.25 },
			{ point: new Vector3(10, 10, 0), calculatedLayerHeight: 0.3 },
			{ point: new Vector3(0, 10, 0), calculatedLayerHeight: 0.35 },
		];

		const result = await getTransitionLayer(points, baseOptions);
		const lines = result.split("\n");

		expect(lines).toHaveLength(3);
	});

	test("each line starts with G1", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 0, 0), calculatedLayerHeight: 0.25 },
			{ point: new Vector3(10, 10, 0), calculatedLayerHeight: 0.3 },
		];

		const result = await getTransitionLayer(points, baseOptions);
		const lines = result.split("\n");

		for (const line of lines) {
			expect(line).toMatch(/^G1 /);
		}
	});

	test("G-code contains X, Y, Z, E, and F values", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 5, 2), calculatedLayerHeight: 0.25 },
		];

		const result = await getTransitionLayer(points, baseOptions);

		expect(result).toMatch(/X-?\d+\.?\d*/);
		expect(result).toMatch(/Y-?\d+\.?\d*/);
		expect(result).toMatch(/Z-?\d+\.?\d*/);
		expect(result).toMatch(/E-?\d+\.?\d*/);
		expect(result).toMatch(/F\d+/);
	});

	test("applies offsetHeight to Z values", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 0, 0), calculatedLayerHeight: 0.25 },
		];

		const result = await getTransitionLayer(points, {
			...baseOptions,
			offsetHeight: 5,
		});

		expect(result).toMatch(/Z5/);
	});

	test("returns empty string when only one point provided", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
		];

		const result = await getTransitionLayer(points, baseOptions);

		expect(result).toBe("");
	});

	test("returns empty string when no points provided", async () => {
		const points: { point: Vector3; calculatedLayerHeight: number }[] = [];

		const result = await getTransitionLayer(points, baseOptions);

		expect(result).toBe("");
	});

	test("X values are negated in output", async () => {
		const points = [
			{ point: new Vector3(0, 0, 0), calculatedLayerHeight: 0.2 },
			{ point: new Vector3(10, 0, 0), calculatedLayerHeight: 0.25 },
		];

		const result = await getTransitionLayer(points, baseOptions);

		expect(result).toMatch(/X-10/);
	});
});
