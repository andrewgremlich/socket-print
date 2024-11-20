import type GUI from "lil-gui";
import { CSG } from "three-csg-ts";

import { getGui } from "@/utils/gui";

import { AppObject, type AppObjectFunctions } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class EvaluateGeometries
	extends AppObject
	implements AppObjectFunctions
{
	#gui: GUI;
	#mergedMeshGui: GUI;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		stlModel.updateMatrixWorld();
		cylinder.updateMatrixWorld();

		const subtraction = CSG.union(stlModel.mesh, cylinder.mesh);

		this.mesh = subtraction;

		this.updateMatrixWorld();

		this.#gui = getGui();
		this.#mergedMeshGui = this.#gui.addFolder("Merged Mesh Position");
		this.addGui();
	}

	addGui() {
		if (!this.mesh) {
			throw new Error("Merged Mesh is missing");
		}

		this.#mergedMeshGui.add(this.mesh.position, "x", -500, 500, 1).name("X");
		this.#mergedMeshGui.add(this.mesh.position, "y", -500, 500, 1).name("Y");
		this.#mergedMeshGui.add(this.mesh.position, "z", -500, 500, 1).name("Z");
	}

	removeGui() {
		this.#mergedMeshGui.destroy();
	}
}
