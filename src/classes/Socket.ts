import GUI from "lil-gui";
import {
	BufferAttribute,
	BufferGeometry,
	Mesh,
	MeshPhongMaterial,
	MeshStandardMaterial,
} from "three";

export class Socket {
	#gui: GUI;

	mesh: Mesh;

	constructor() {
		this.#gui = new GUI();

		const geometry = new BufferGeometry();

		// Define the vertices (position attributes)
		const vertices = new Float32Array([
			0,
			1,
			0, // Top vertex
			-1,
			-1,
			1, // Front-left vertex
			1,
			-1,
			1, // Front-right vertex
			1,
			-1,
			-1, // Back-right vertex
			-1,
			-1,
			-1, // Back-left vertex
		]);

		// Define the faces (triangles) by specifying vertex indices
		const indices = [
			0,
			1,
			2, // Front face
			0,
			2,
			3, // Right face
			0,
			3,
			4, // Back face
			0,
			4,
			1, // Left face
			1,
			4,
			3, // Bottom face (optional, if you want a closed shape)
			1,
			3,
			2, // Bottom face
		];

		// Assign the vertices to the geometry
		geometry.setAttribute("position", new BufferAttribute(vertices, 3));

		// Assign the indices to the geometry
		geometry.setIndex(indices);

		// Compute the normals (necessary for correct lighting)
		geometry.computeVertexNormals();

		// Create a material (you can customize this)
		const material = new MeshPhongMaterial({
			color: 0xff0000,
		});

		// Create the mesh
		const mesh = new Mesh(geometry, material);

		this.mesh = mesh;
	}

	#addSocketGui = () => {
		const folder = this.#gui.addFolder("Socket");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);
	};
}
