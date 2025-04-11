import { Box3, type Mesh, Vector3 } from "three";

export class AppObject {
	mesh: Mesh | null = null;
	boundingBox: Box3 | null = null;
	size: Vector3 | null = null;
	center: Vector3 | null = null;

	updateMatrixWorld = () => {
		if (this.mesh) {
			this.mesh.updateMatrix();
			this.mesh.updateMatrixWorld(true);
			this.mesh.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);

			this.mesh.geometry.computeVertexNormals();
			this.computeBoundingBox();
		}
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
