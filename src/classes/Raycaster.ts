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

		// this.#renderer.domElement.addEventListener(
		// 	"pointermove",
		// 	this.#onPointerMove.bind(this),
		// );
	}

	addObjectsToIntersect = (objects: Object3D[]) => {
		this.#objectsToIntersect.push(...objects);
	};
	//TODO: these ones don't seem to work
	// setFromCamera = (x: number, y: number, camera: PerspectiveCamera) => {
	// 	this.#mouse.x = (x / window.innerWidth) * 2 - 1;
	// 	this.#mouse.y = -(y / window.innerHeight) * 2 + 1;

	// 	this.#raycaster.setFromCamera(this.#mouse, camera);
	// };

	// getIntersects = (camera: PerspectiveCamera) => {
	// 	this.setFromCamera(this.#mouse.x, this.#mouse.y, camera);

	// 	return this.#raycaster.intersectObjects(this.#objectsToIntersect, true);
	// };

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

			if (intersects.length > 0) {
				this.touchedObject = intersects[0].object;
			}
		};
}
