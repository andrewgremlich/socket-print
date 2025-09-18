import { Box3, type Mesh, Vector3 } from "three";

export class AppObject {
	mesh: Mesh | null = null;
	boundingBox: Box3 | null = null;
	size: Vector3 | null = null;
	center: Vector3 | null = null;

	updateMatrixWorld = () => {
		if (!this.mesh) return;
		// Non-destructive: just ensure matrices & bounding info are current.
		this.mesh.updateMatrix();
		this.mesh.updateMatrixWorld(true);
		this.computeBoundingBox();
	};

	computeBoundingBox = () => {
		if (!this.mesh) {
			throw new Error("Mesh not found");
		}

		const boundingBox = new Box3().setFromObject(this.mesh);

		this.boundingBox = boundingBox;
		this.size = boundingBox.getSize(new Vector3());
		this.center = boundingBox.getCenter(new Vector3());
	};
}
