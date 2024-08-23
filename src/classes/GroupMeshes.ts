import type GUI from "lil-gui";
import { Group, type Mesh } from "three";

import { getGui } from "@/utils/gui";

export class GroupMeshes {
	#group: Group;
	#gui: GUI;

	constructor(children: Mesh[]) {
		this.#gui = getGui();
		this.#group = new Group();
		this.#group.add(...children);

		this.#addGroupGui();
	}

	#addGroupGui = () => {
		const folder = this.#gui.addFolder("Group");

		folder.add(this.#group.position, "x", -5, 5, 0.01);
		folder.add(this.#group.position, "y", -5, 5, 0.01);
		folder.add(this.#group.position, "z", -5, 5, 0.01);

		folder.add(this.#group.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.#group.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.#group.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.add(this.#group.scale, "x", 0.1, 2, 0.01);
		folder.add(this.#group.scale, "y", 0.1, 2, 0.01);
		folder.add(this.#group.scale, "z", 0.1, 2, 0.01);
	};

	get group() {
		return this.#group;
	}
}
