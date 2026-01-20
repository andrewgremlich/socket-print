import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRadialSegments } from "./getRadialSegments";

const mockGetCircularSegments = vi.fn();

vi.mock("@/db/appSettingsDbActions", () => ({
	getCircularSegments: () => mockGetCircularSegments(),
}));

describe("getRadialSegments", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns circular segments when within valid range", async () => {
		mockGetCircularSegments.mockResolvedValue(64);

		const result = await getRadialSegments();

		expect(result).toBe(64);
	});

	test("returns floored value for decimal input", async () => {
		mockGetCircularSegments.mockResolvedValue(64.9);

		const result = await getRadialSegments();

		expect(result).toBe(64);
	});

	test("clamps to minimum of 3", async () => {
		mockGetCircularSegments.mockResolvedValue(3);

		const result = await getRadialSegments();

		expect(result).toBe(3);
	});

	test("clamps to maximum of 512", async () => {
		mockGetCircularSegments.mockResolvedValue(1000);

		const result = await getRadialSegments();

		expect(result).toBe(512);
	});

	test("returns fallback 128 for value less than 3", async () => {
		mockGetCircularSegments.mockResolvedValue(2);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("returns fallback 128 for zero", async () => {
		mockGetCircularSegments.mockResolvedValue(0);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("returns fallback 128 for negative value", async () => {
		mockGetCircularSegments.mockResolvedValue(-10);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("returns fallback 128 for NaN", async () => {
		mockGetCircularSegments.mockResolvedValue(NaN);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("returns fallback 128 for Infinity", async () => {
		mockGetCircularSegments.mockResolvedValue(Infinity);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("returns fallback 128 for negative Infinity", async () => {
		mockGetCircularSegments.mockResolvedValue(-Infinity);

		const result = await getRadialSegments();

		expect(result).toBe(128);
	});

	test("handles edge case at minimum boundary (exactly 3)", async () => {
		mockGetCircularSegments.mockResolvedValue(3);

		const result = await getRadialSegments();

		expect(result).toBeGreaterThanOrEqual(3);
		expect(result).toBeLessThanOrEqual(512);
	});

	test("handles edge case at maximum boundary (exactly 512)", async () => {
		mockGetCircularSegments.mockResolvedValue(512);

		const result = await getRadialSegments();

		expect(result).toBe(512);
	});

	test("returns integer value", async () => {
		mockGetCircularSegments.mockResolvedValue(100.7);

		const result = await getRadialSegments();

		expect(Number.isInteger(result)).toBe(true);
	});
});
