type DragDirection = "horizontal" | "vertical" | "none";

export class DragHandler {
	#startX = 0;
	#startY = 0;
	#dragging = false;
	#draggableElement: HTMLElement;

	constructor(element: HTMLElement) {
		this.#draggableElement = element;
		this.#attachListeners();
	}

	#attachListeners() {
		this.#draggableElement.addEventListener("mousedown", this.#onMouseDown);
		this.#draggableElement.addEventListener("mousemove", this.#onMouseMove);
		this.#draggableElement.addEventListener("mouseup", this.#onMouseUp);
	}

	#onMouseDown = (event: MouseEvent) => {
		this.#startX = event.clientX;
		this.#startY = event.clientY;
		this.#dragging = true;
	};

	#onMouseMove = (event: MouseEvent) => {
		if (!this.#dragging) return;

		const currentX = event.clientX;
		const currentY = event.clientY;

		const deltaX = currentX - this.#startX;
		const deltaY = currentY - this.#startY;

		const dragDirection: DragDirection =
			Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";

		// You can handle the drag direction here
		console.log(`Dragging ${dragDirection}`);
	};

	#onMouseUp = () => {
		this.#dragging = false;
	};
}

// Dragging the cube
// TODO: perhaps make it a shift and click or right click to augment the 3d object
// const dragHandler = new DragHandler(renderer.domElement);
