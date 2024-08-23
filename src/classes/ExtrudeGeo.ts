import type GUI from "lil-gui";
import { ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape } from "three";

import { getGui } from "@/utils/gui";

export class ExtrudeGeo {
	#gui: GUI;
	#originCoordinates: { x: number; y: number; z: number };

	mesh: Mesh;

	constructor() {
		this.#originCoordinates = { x: 0, y: 0, z: 0 };

		const shape = new Shape();

		// Start drawing the profile
		shape.moveTo(this.#originCoordinates.x, this.#originCoordinates.y); // Bottom narrow part
		shape.quadraticCurveTo(2, 0, 2, 2); // Curve outward
		shape.quadraticCurveTo(2, 4, 0, 4); // Curve inward
		shape.quadraticCurveTo(-2, 4, -2, 2); // Curve inward
		shape.quadraticCurveTo(
			-2,
			0,
			this.#originCoordinates.x,
			this.#originCoordinates.y,
		); // Back to bottom

		// Define the extrusion settings
		const extrudeSettings = {
			steps: 10, // Number of segments along the depth
			depth: 2, // Depth of the extrusion (height of the socket)
			bevelEnabled: true, // Bevel the edges for smoother appearance
			bevelThickness: 0.1,
			bevelSize: 0.1,
			bevelSegments: 5,
		};

		// Create the geometry by extruding the shape
		const geometry = new ExtrudeGeometry(shape, extrudeSettings);

		// Create a material and mesh
		const material = new MeshStandardMaterial({ color: 0x808080 });

		this.#gui = getGui();
		this.mesh = new Mesh(geometry, material);

		this.mesh.rotateX(-(Math.PI / 2));
		// this.mesh.rotateY(Math.PI / 2);
		// this.mesh.rotateZ(Math.PI / 2);

		this.#addSocketGui();
	}

	#addSocketGui = () => {
		const folder = this.#gui.addFolder("Socket");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.open();
	};
}
