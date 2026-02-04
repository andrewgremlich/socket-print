import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Scene } from "three";
import { beforeEach, describe, expect, test } from "vitest";

// Test the collectAllGeometries logic by recreating it in isolation
// This avoids needing to mock WebGL, DOM, and Three.js addons
describe("Application.collectAllGeometries", () => {
	let scene: Scene;
	let transformHelper: Object3D | null;

	// Recreate the collectAllGeometries filtering logic for testing
	const collectAllGeometries = () => {
		const geometries: BoxGeometry[] = [];

		scene.traverse((object) => {
			// Skip TransformControls helper meshes (same logic as Application.ts)
			if (transformHelper) {
				let parent = object.parent;
				while (parent) {
					if (parent === transformHelper) return;
					parent = parent.parent;
				}
			}

			if (object instanceof Mesh) {
				geometries.push(object.geometry);
			}
		});

		return geometries;
	};

	beforeEach(() => {
		scene = new Scene();
		transformHelper = null;
	});

	test("collects regular meshes from scene", () => {
		const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		const mesh2 = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial());

		scene.add(mesh1);
		scene.add(mesh2);

		const geometries = collectAllGeometries();

		expect(geometries).toHaveLength(2);
	});

	test("excludes meshes that are children of transformHelper", () => {
		// Add a regular mesh that should be collected
		const printMesh = new Mesh(
			new BoxGeometry(100, 200, 100),
			new MeshBasicMaterial(),
		);
		printMesh.name = "test_model.stl";
		scene.add(printMesh);

		// Create a mock transformHelper with child meshes (simulating TransformControls)
		transformHelper = new Object3D();
		transformHelper.name = "TransformControlsHelper";

		// Add mock gizmo meshes as children (like X, Y, Z handles)
		const gizmoX = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		gizmoX.name = "X";
		gizmoX.scale.set(92, 92, 92); // Large scale like real TransformControls

		const gizmoY = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		gizmoY.name = "Y";
		gizmoY.scale.set(92, 92, 92);

		const gizmoZ = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		gizmoZ.name = "Z";
		gizmoZ.scale.set(92, 92, 92);

		// Nest gizmos under transformHelper
		transformHelper.add(gizmoX);
		transformHelper.add(gizmoY);
		transformHelper.add(gizmoZ);
		scene.add(transformHelper);

		// Count total meshes in scene
		let totalMeshCount = 0;
		scene.traverse((obj) => {
			if (obj instanceof Mesh) totalMeshCount++;
		});
		expect(totalMeshCount).toBe(4); // printMesh + 3 gizmos

		// collectAllGeometries should only return the print mesh
		const geometries = collectAllGeometries();

		expect(geometries).toHaveLength(1);
		expect(geometries[0]).toBe(printMesh.geometry);
	});

	test("excludes deeply nested children of transformHelper", () => {
		const printMesh = new Mesh(
			new BoxGeometry(100, 200, 100),
			new MeshBasicMaterial(),
		);
		scene.add(printMesh);

		// Create nested hierarchy under transformHelper
		transformHelper = new Object3D();
		const level1 = new Object3D();
		const level2 = new Object3D();
		const deeplyNestedMesh = new Mesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial(),
		);

		level2.add(deeplyNestedMesh);
		level1.add(level2);
		transformHelper.add(level1);
		scene.add(transformHelper);

		const geometries = collectAllGeometries();

		expect(geometries).toHaveLength(1);
		expect(geometries[0]).toBe(printMesh.geometry);
	});

	test("collects all meshes when no transformHelper is set", () => {
		const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
		const mesh2 = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial());
		const mesh3 = new Mesh(new BoxGeometry(3, 3, 3), new MeshBasicMaterial());

		scene.add(mesh1);
		scene.add(mesh2);
		scene.add(mesh3);

		transformHelper = null;

		const geometries = collectAllGeometries();

		expect(geometries).toHaveLength(3);
	});

	test("handles nested mesh hierarchies correctly (non-helper)", () => {
		const parentMesh = new Mesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial(),
		);
		const childMesh = new Mesh(
			new BoxGeometry(0.5, 0.5, 0.5),
			new MeshBasicMaterial(),
		);

		parentMesh.add(childMesh);
		scene.add(parentMesh);

		const geometries = collectAllGeometries();

		expect(geometries).toHaveLength(2);
	});

	test("correctly filters when transformHelper has scaled meshes", () => {
		// This documents the bug that was fixed:
		// TransformControls helper meshes had ~92x scale which corrupted geometry

		const printMesh = new Mesh(
			new BoxGeometry(100, 200, 100),
			new MeshBasicMaterial(),
		);
		printMesh.name = "socket.stl";
		scene.add(printMesh);

		transformHelper = new Object3D();

		// Simulate the problematic scaled meshes from TransformControls
		const scaledGizmo = new Mesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial(),
		);
		scaledGizmo.name = "XYZE";
		scaledGizmo.scale.set(91.98, 91.98, 91.98); // The actual scale seen in the bug

		transformHelper.add(scaledGizmo);
		scene.add(transformHelper);

		const geometries = collectAllGeometries();

		// Should only get the print mesh, not the scaled gizmo
		expect(geometries).toHaveLength(1);
		expect(geometries[0]).toBe(printMesh.geometry);

		// Verify the scaled mesh would have caused issues if included
		expect(scaledGizmo.scale.x).toBeCloseTo(91.98);
	});
});
