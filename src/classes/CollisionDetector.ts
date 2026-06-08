import type { Mesh, Scene } from "three";
import { Matrix4 } from "three";
import type { MeshBVH } from "three-mesh-bvh";
import { PrintObjectType } from "@/db/types";
import { CupToSocketTransition } from "./CupToSocketTransition";
import type { SocketCup } from "./SocketCup";
import type { CollisionState, ICollisionDetector } from "./types";

/**
 * Handles collision detection between the print object and socket cup,
 * as well as managing the cup-to-socket transition validation.
 *
 * This class is UI-agnostic and returns collision state for the caller to handle.
 */
export class CollisionDetector implements ICollisionDetector {
	#socketCup: SocketCup;
	#scene: Scene;
	#transitionInstance: CupToSocketTransition | null = null;
	#transitionCreating: Promise<CupToSocketTransition> | null = null;
	#computeId = 0;
	#onTransitionRecompute: (() => void) | null = null;

	constructor(socketCup: SocketCup, scene: Scene) {
		this.#socketCup = socketCup;
		this.#scene = scene;
	}

	setRecomputeCallback(cb: () => void): void {
		this.#onTransitionRecompute = cb;
		this.#transitionInstance?.setRecomputeCallback(cb);
	}

	/**
	 * Checks for intersection between the mesh and socket cup,
	 * and validates the cup-to-socket transition for sockets.
	 *
	 * @returns CollisionState - the result of the collision check (caller handles UI)
	 */
	async checkCollision(
		mesh: Mesh | undefined,
		currentType: PrintObjectType | undefined,
	): Promise<CollisionState> {
		if (!mesh || !this.#socketCup?.mesh) {
			this.#clearTransition();
			return { hasCollision: false, hasInvalidFit: false, message: null };
		}

		mesh.updateMatrixWorld();
		this.#socketCup.mesh.updateMatrixWorld();

		const transformMatrix = new Matrix4()
			.copy(this.#socketCup.mesh.matrixWorld)
			.invert()
			.multiply(mesh.matrixWorld);

		const hit = (
			this.#socketCup.mesh.geometry.boundsTree as MeshBVH
		).intersectsGeometry(mesh.geometry, transformMatrix);

		if (hit) {
			this.#clearTransition();
			return {
				hasCollision: true,
				hasInvalidFit: false,
				message: "Interference!",
			};
		}

		// Check transition validity for sockets
		if (currentType === PrintObjectType.Socket) {
			const transitionResult = await this.#computeTransition(mesh);

			if (!transitionResult.isValid) {
				return {
					hasCollision: false,
					hasInvalidFit: true,
					message:
						"Imperfect fit — check alignment and dimensions over the socket cup.",
				};
			}
		} else {
			this.#clearTransition();
		}

		// No collision and valid transition
		return { hasCollision: false, hasInvalidFit: false, message: null };
	}

	#clearTransition(): void {
		this.#computeId++;
		this.#transitionInstance?.dispose();
		this.#transitionInstance = null;
		this.#transitionCreating = null;
	}

	/**
	 * Computes the cup-to-socket transition and validates the fit.
	 */
	async #computeTransition(mesh: Mesh): Promise<{ isValid: boolean }> {
		const id = ++this.#computeId;

		mesh.updateMatrixWorld(true);

		if (!this.#transitionInstance) {
			if (!this.#transitionCreating) {
				this.#transitionCreating = CupToSocketTransition.create(
					this.#socketCup,
					mesh,
					this.#scene,
				);
			}
			this.#transitionInstance = await this.#transitionCreating;
			this.#transitionCreating = null;
			if (this.#onTransitionRecompute) {
				this.#transitionInstance.setRecomputeCallback(
					this.#onTransitionRecompute,
				);
			}
		}

		if (id !== this.#computeId) return { isValid: false };

		const result = await this.#transitionInstance.computeTransition();

		if (id !== this.#computeId) return { isValid: false };

		return result;
	}

	/**
	 * Gets the current transition instance.
	 */
	getTransitionInstance(): CupToSocketTransition | null {
		return this.#transitionInstance;
	}

	/**
	 * Checks if the current transition has a valid fit.
	 */
	isValidFit(): boolean {
		return this.#transitionInstance?.isValidFit() ?? true;
	}

	/**
	 * Disposes the collision detector and its resources.
	 */
	dispose(): void {
		this.#clearTransition();
	}
}
