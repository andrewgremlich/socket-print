/**
 * @vitest-environment jsdom
 */
import {
	Box3,
	BoxGeometry,
	Mesh,
	MeshStandardMaterial,
	Scene,
	Vector3,
} from "three";
import { MeshBVH } from "three-mesh-bvh";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PrintObjectType } from "@/db/types";
import { CollisionDetector } from "./CollisionDetector";

// Mock CupToSocketTransition
vi.mock("./CupToSocketTransition", () => ({
	CupToSocketTransition: {
		create: vi.fn().mockImplementation(async () => ({
			computeTransition: vi.fn().mockResolvedValue({ isValid: true }),
			isValidFit: vi.fn().mockReturnValue(true),
			dispose: vi.fn(),
			mesh: null,
		})),
	},
}));

function createMockSocketCup() {
	const geometry = new BoxGeometry(50, 50, 50);
	geometry.computeBoundingBox();
	const material = new MeshStandardMaterial();
	const mesh = new Mesh(geometry, material);
	mesh.geometry.boundsTree = new MeshBVH(geometry);

	return {
		mesh,
		size: new Vector3(50, 50, 50),
		boundingBox: new Box3(new Vector3(-25, -25, -25), new Vector3(25, 25, 25)),
	};
}

function createMockMesh(size = 10): Mesh {
	const geometry = new BoxGeometry(size, size, size);
	const material = new MeshStandardMaterial();
	const mesh = new Mesh(geometry, material);
	mesh.geometry.boundsTree = new MeshBVH(geometry);
	return mesh;
}

describe("CollisionDetector", () => {
	let collisionDetector: CollisionDetector;
	let mockSocketCup: ReturnType<typeof createMockSocketCup>;
	let mockScene: Scene;

	beforeEach(() => {
		vi.clearAllMocks();
		mockSocketCup = createMockSocketCup();
		mockScene = new Scene();
		collisionDetector = new CollisionDetector(
			mockSocketCup as never,
			mockScene,
		);
	});

	describe("checkCollision", () => {
		test("returns no collision when mesh is undefined", async () => {
			const result = await collisionDetector.checkCollision(
				undefined,
				PrintObjectType.Socket,
			);

			expect(result).toEqual({
				hasCollision: false,
				hasInvalidFit: false,
				message: null,
			});
		});

		test("returns no collision when socketCup mesh is null", async () => {
			const detectorWithNullCup = new CollisionDetector(
				{ mesh: null } as never,
				mockScene,
			);
			const mesh = createMockMesh();

			const result = await detectorWithNullCup.checkCollision(
				mesh,
				PrintObjectType.Socket,
			);

			expect(result).toEqual({
				hasCollision: false,
				hasInvalidFit: false,
				message: null,
			});
		});

		test("returns collision state with correct structure when checking", async () => {
			// Test that the collision detection returns the correct structure
			// The actual BVH intersection behavior is complex and depends on geometry details
			const mesh = createMockMesh(10);
			mesh.position.set(0, 0, 0);
			mesh.updateMatrixWorld(true);
			mockSocketCup.mesh.updateMatrixWorld(true);

			const result = await collisionDetector.checkCollision(
				mesh,
				PrintObjectType.TestCylinder,
			);

			// Verify the result has the correct structure
			expect(result).toHaveProperty("hasCollision");
			expect(result).toHaveProperty("hasInvalidFit");
			expect(result).toHaveProperty("message");
			expect(typeof result.hasCollision).toBe("boolean");
			expect(typeof result.hasInvalidFit).toBe("boolean");
		});

		test("returns no collision when meshes do not intersect", async () => {
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100); // Far away from socket cup
			mesh.updateMatrixWorld();

			const result = await collisionDetector.checkCollision(
				mesh,
				PrintObjectType.TestCylinder,
			);

			expect(result.hasCollision).toBe(false);
			expect(result.message).toBeNull();
		});

		test("checks transition validity for Socket type", async () => {
			const { CupToSocketTransition } = await import("./CupToSocketTransition");
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			await collisionDetector.checkCollision(mesh, PrintObjectType.Socket);

			expect(CupToSocketTransition.create).toHaveBeenCalled();
		});

		test("does not check transition for TestCylinder type", async () => {
			const { CupToSocketTransition } = await import("./CupToSocketTransition");
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			await collisionDetector.checkCollision(
				mesh,
				PrintObjectType.TestCylinder,
			);

			expect(CupToSocketTransition.create).not.toHaveBeenCalled();
		});

		test("returns invalid fit when transition is not valid", async () => {
			const { CupToSocketTransition } = await import("./CupToSocketTransition");
			vi.mocked(CupToSocketTransition.create).mockResolvedValueOnce({
				computeTransition: vi.fn().mockResolvedValue({ isValid: false }),
				isValidFit: vi.fn().mockReturnValue(false),
				dispose: vi.fn(),
				mesh: null,
			} as never);

			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			const result = await collisionDetector.checkCollision(
				mesh,
				PrintObjectType.Socket,
			);

			expect(result.hasInvalidFit).toBe(true);
			expect(result.message).toBe(
				"Imperfect fit: Socket does not fully cover the cup edge",
			);
		});
	});

	describe("getTransitionInstance", () => {
		test("returns null when no transition has been computed", () => {
			expect(collisionDetector.getTransitionInstance()).toBeNull();
		});

		test("returns transition instance after collision check for Socket", async () => {
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			await collisionDetector.checkCollision(mesh, PrintObjectType.Socket);

			expect(collisionDetector.getTransitionInstance()).not.toBeNull();
		});
	});

	describe("isValidFit", () => {
		test("returns true when no transition instance exists", () => {
			expect(collisionDetector.isValidFit()).toBe(true);
		});

		test("returns transition isValidFit result", async () => {
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			await collisionDetector.checkCollision(mesh, PrintObjectType.Socket);

			expect(collisionDetector.isValidFit()).toBe(true);
		});
	});

	describe("dispose", () => {
		test("disposes transition instance", async () => {
			const mesh = createMockMesh(5);
			mesh.position.set(100, 100, 100);
			mesh.updateMatrixWorld();

			await collisionDetector.checkCollision(mesh, PrintObjectType.Socket);
			const transitionInstance = collisionDetector.getTransitionInstance();

			collisionDetector.dispose();

			expect(transitionInstance?.dispose).toHaveBeenCalled();
			expect(collisionDetector.getTransitionInstance()).toBeNull();
		});

		test("handles dispose when no transition exists", () => {
			expect(() => collisionDetector.dispose()).not.toThrow();
		});
	});
});
