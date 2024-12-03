import type { Mesh } from "three";

export class AppObject {
	mesh: Mesh | null = null;

	cloneMesh = () => {
		if (this.mesh) {
			return this.mesh.clone();
		}
	};

	updateMatrixWorld = () => {
		if (this.mesh) {
			this.mesh.updateMatrixWorld(true);

			this.mesh.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);

			this.mesh.geometry.computeVertexNormals();
			this.mesh.geometry.computeBoundingBox();
		}
	};
}
