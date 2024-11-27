import { getGui } from "@/utils/gui";
import type GUI from "lil-gui";
import type { Mesh } from "three";

export interface AppObjectFunctions {
	addGui: () => void;
	removeGui: () => void;
}

export class AppObject {
	gui!: GUI;
	mesh: Mesh | null = null;

	constructor() {
		if (import.meta.env.MODE === "development") {
			this.gui = getGui();
		}
	}

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
