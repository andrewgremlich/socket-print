import type GUI from "lil-gui";
import { Box3, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

import { processGeometry } from "@/utils/processGeometry";
import { AppObject, type AppObjectFunctions } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class MergeGeometries extends AppObject implements AppObjectFunctions {
	#positionFolder: GUI;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();

		if (!stlModel.mesh || !cylinder.mesh) {
			throw new Error("STL Model mesh and cylinder mesh is required");
		}

		const mergeableCylinder = cylinder.toMergeCompatible();

		console.log(mergeableCylinder, stlModel.mesh.geometry);

		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			mergeableCylinder,
			stlModel.mesh.geometry,
		]);
		const material = new MeshPhongMaterial({
			color: 0xffffff,
			wireframe: true,
		});

		this.mesh = new Mesh(mergedGeometry, material);

		this.#positionFolder = this.gui.addFolder("Merged Position");
		this.addGui();

		const boundingBox = new Box3().setFromObject(this.mesh);
		const center = boundingBox.getCenter(new Vector3());

		console.log(this.mesh.geometry);

		const position = this.mesh.geometry.getAttribute("position");
		const normal = this.mesh.geometry.getAttribute("normal");
		const uv = this.mesh.geometry.getAttribute("uv");
		const index = this.mesh.geometry.getIndex();
		const serializedData = {
			position: position ? position : null,
			center: center,
			height: { miny: boundingBox.min.y, maxy: boundingBox.max.y },
		};

		processGeometry(serializedData);
	}
	addGui = () => {
		if (!this.mesh) {
			return;
		}

		this.#positionFolder.add(this.mesh.position, "x", -500, 500, 10).name("X");
		this.#positionFolder.add(this.mesh.position, "y", -500, 500, 10).name("Y");
		this.#positionFolder.add(this.mesh.position, "z", -500, 500, 10).name("Z");
	};

	removeGui = () => {
		this.#positionFolder.destroy();
	};
}
