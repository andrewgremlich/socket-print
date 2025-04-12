import { Vector3 } from "three";
import { beforeEach, describe, expect, it } from "vitest";
import { DebugPoint } from "../classes/DebugPoint";

describe("DebugPoint", () => {
	let debugPoint: DebugPoint;
	let testPoint: Vector3;

	beforeEach(() => {
		testPoint = new Vector3(1, 2, 3);
		debugPoint = new DebugPoint(testPoint);
	});

	it("should create a mesh at the specified position", () => {
		expect(debugPoint.mesh.position.x).toBe(1);
		expect(debugPoint.mesh.position.y).toBe(2);
		expect(debugPoint.mesh.position.z).toBe(3);
	});

	it("should use a red material", () => {
		expect(debugPoint.material.color.getHex()).toBe(0xff0000);
	});

	it("should create a sphere geometry", () => {
		expect(debugPoint.geometry.type).toBe("SphereGeometry");
		expect(debugPoint.geometry.parameters.radius).toBe(1);
		expect(debugPoint.geometry.parameters.widthSegments).toBe(16);
		expect(debugPoint.geometry.parameters.heightSegments).toBe(16);
	});

	it("should have correct mesh properties", () => {
		expect(debugPoint.mesh.geometry).toBe(debugPoint.geometry);
		expect(debugPoint.mesh.material).toBe(debugPoint.material);
	});
});
