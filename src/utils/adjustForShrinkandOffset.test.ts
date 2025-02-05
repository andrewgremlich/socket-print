import { beforeEach, describe, expect, test, vi } from "vitest";
import { adjustForShrinkAndOffset } from "./adjustForShrinkandOffset";
import type { RawPoint } from "./blendMerge";

const offset = { x: 0, y: 1, z: 0 };

describe("adjustForShrinkAndOffset", () => {
	beforeEach(() => {
		vi.stubGlobal("window", {});

		global.window.provelPrintStore = {
			nozzleSize: 0.4,
			activeMaterialProfile: "PLA",
			ipAddress: "",
			lockPosition: "left",
			cupSize: "0",
			layerHeight: 0,
		};

		global.window.materialProfiles = {
			PLA: {
				shrinkFactor: 1.5,
				nozzleTemp: 210,
				cupTemp: 60,
				outputFactor: 1.0,
			},
		};
	});

	test("adjusts points correctly with given nozzle size and shrink factor", () => {
		const pointLayers: RawPoint[][] = [
			[
				{ x: 1, y: 1, z: 1 },
				{ x: 2, y: 2, z: 2 },
			],
		];
		const result = adjustForShrinkAndOffset(pointLayers, offset);
		expect(result).toEqual([
			[
				{ x: 1.2636000717875, y: 1, z: 1.2636000717874998 },
				{ x: 2.2486000717875, y: 2, z: 2.2486000717874997 },
			],
		]);
	});

	test("returns the same points if nozzle size and shrink factor are zero", () => {
		window.provelPrintStore.nozzleSize = 0;
		window.materialProfiles.PLA.shrinkFactor = 0;

		const pointLayers: RawPoint[][] = [
			[
				{ x: 1, y: 1, z: 1 },
				{ x: 2, y: 2, z: 2 },
			],
		];
		const result = adjustForShrinkAndOffset(pointLayers, offset);
		expect(result).toEqual(pointLayers);
	});

	test("handles empty point layers", () => {
		const pointLayers: RawPoint[][] = [];
		const result = adjustForShrinkAndOffset(pointLayers, offset);
		expect(result).toEqual([]);
	});

	test("handles single point layer with one point", () => {
		const pointLayers: RawPoint[][] = [[{ x: 1, y: 1, z: 1 }]];
		const result = adjustForShrinkAndOffset(pointLayers, offset);
		expect(result).toEqual([
			[{ x: 1.2636000717875, y: 1, z: 1.2636000717874998 }],
		]);
	});

	test("handles multiple layers of points", () => {
		const pointLayers: RawPoint[][] = [
			[
				{ x: 1, y: 1, z: 1 },
				{ x: 2, y: 2, z: 2 },
			],
			[
				{ x: 3, y: 3, z: 3 },
				{ x: 4, y: 4, z: 4 },
			],
		];
		const result = adjustForShrinkAndOffset(pointLayers, offset);
		expect(result).toEqual([
			[
				{ x: 1.2636000717875, y: 1, z: 1.2636000717874998 },
				{ x: 2.2486000717875, y: 2, z: 2.2486000717874997 },
			],
			[
				{ x: 3.2336000717874995, y: 3, z: 3.233600071787499 },
				{ x: 4.218600071787501, y: 4, z: 4.2186000717875 },
			],
		]);
	});
});
