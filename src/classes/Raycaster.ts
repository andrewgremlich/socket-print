import {
	type Object3D,
	type PerspectiveCamera,
	Raycaster,
	Vector2,
} from "three";

export class RayCaster {
	#raycaster: Raycaster;
	#mouse: Vector2;
	#objectsToIntersect: Object3D[];

	touchedObject: Object3D | null = null;

	constructor() {
		this.#raycaster = new Raycaster();
		this.#mouse = new Vector2();
		this.#objectsToIntersect = [];
	}

	addObjectsToIntersect = (objects: Object3D[]) => {
		this.#objectsToIntersect.push(...objects);
	};

	onPointerMove =
		(camera: PerspectiveCamera) =>
		(event: PointerEvent): void => {
			// Convert mouse position to normalized device coordinates (-1 to +1).
			this.#mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.#mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			// Update the raycaster with the camera and the mouse position.
			this.#raycaster.setFromCamera(this.#mouse, camera);

			// Calculate objects intersecting the ray, excluding the grid helper.
			const intersects = this.#raycaster.intersectObjects(
				this.#objectsToIntersect,
				true,
			);

			// NOTE: to see the intersection in the console.
			// console.log(intersects);

			if (intersects.length > 0) {
				this.touchedObject = intersects[0].object;
			}
		};
}
