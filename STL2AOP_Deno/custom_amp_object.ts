import { mat4, vec3 } from "npm:gl-matrix";

export class CustomAmpObject {
	filepath: string;
	unify: boolean;
	struc: boolean;
	stype: string;

	vert: vec3[];
	norm: vec3[];
	faces: vec3[];
	edges: vec3[];

	landmarks: Record<string, unknown>;
	values: number[];

	constructor(filepath: string, stype = "limb", unify = true, struc = true) {
		this.filepath = filepath;
		this.unify = unify;
		this.struc = struc;
		this.stype = stype;
		this.landmarks = {};
		this.faces = [];
		this.edges = [];
		this.vert = [];
		this.norm = [];
		this.values = [];
	}

	async read_stl() {
		try {
			const HEADER_SIZE = 80;
			const COUNT_SIZE = 4;
			const file = await Deno.readFile(this.filepath);
			const _header = new TextDecoder().decode(file.slice(0, HEADER_SIZE));
			const NFaces = new DataView(file.buffer).getUint32(HEADER_SIZE, true);

			// Parse faces and vertices from the buffer
			const vertices: vec3[] = [];
			const faces: vec3[] = [];
			const normals: number[][] = [];

			let offset = HEADER_SIZE + COUNT_SIZE;

			for (let i = 0; i < NFaces; i++) {
				const normal = Array.from(
					new Float32Array(file.buffer.slice(offset, offset + 12)),
				);
				const vertexData = new Float32Array(
					file.buffer.slice(offset + 12, offset + 48),
				);
				const vertex = [
					vec3.fromValues(vertexData[0], vertexData[1], vertexData[2]),
					vec3.fromValues(vertexData[3], vertexData[4], vertexData[5]),
					vec3.fromValues(vertexData[6], vertexData[7], vertexData[8]),
				];

				faces.push(vec3.fromValues(i * 3, i * 3 + 1, i * 3 + 2));
				normals.push(normal);
				vertices.push(...vertex);

				offset += 50;
			}

			this.faces = faces;
			this.vert = vertices;
			this.norm = [];

			if (this.unify) this.unifyVert();
			if (this.struc) this.calcStruct();

			this.values = Array(this.vert.length).fill(0);

			// Additional check for zero height
			if (this.vert.every((v) => v[2] === 0)) {
				throw new Error(
					"Mesh height is zero. Possible invalid STL file. Ensure units are in millimeters.",
				);
			}
		} catch (error) {
			throw new Error(
				`Error reading STL file '${this.filepath}': ${error.message}`,
			);
		}
	}

	unifyVert() {
		const uniqueVertices = Array.from(
			new Set(this.vert.map((v) => JSON.stringify(v))),
		).map((v) => JSON.parse(v));

		console.log(uniqueVertices[uniqueVertices.length - 1]);

		this.faces = this.faces.map((face) =>
			face.map((v) =>
				Object.values(uniqueVertices)
					.map((v) => Math.floor(v))
					.indexOf(this.vert[v]),
			),
		);

		this.vert = uniqueVertices;
	}

	calcStruct() {
		// Placeholder for structural calculations (e.g., calculating edges, normals, etc.)
	}

	async read_bytes(data: Uint8Array, unify = true, struc = true) {
		// Similar to read_stl, but reading from byte array
		// This method would be similar to reading from file but operates directly on bytes
	}

	rotate(R: vec3, norms = true) {
		// Matrix-based rotation logic using gl-matrix or manual matrix transformations
		// Example: this.vert = this.vert.map(v => vec3.transformMat4([], v, R));
		if (norms) {
			console.log(this.norm);
			this.norm = this.norm.map((n) => vec3.transformMat4(vec3.create(), n, R));
		}
	}

	translate(trans: [number, number, number]) {
		if (trans.length === 3) {
			this.vert = this.vert.map((v) => vec3.add(vec3.create(), v, trans));
		} else {
			throw new Error("Translation must be a 3-element array");
		}
	}

	rotateAng(
		rot: [number, number, number],
		ang: "rad" | "deg" = "rad",
		norms = true,
	) {
		const R = this.rotMatrix(rot, ang);
		this.rotate(R, norms);
	}

	rotMatrix(rot: [number, number, number], ang: "rad" | "deg" = "rad") {
		if (ang === "deg") {
			rot = rot.map((r) => (r * Math.PI) / 180);
		}

		const [angx, angy, angz] = rot;
		const Rx = mat4.fromXRotation(mat4.create(), angx);
		const Ry = mat4.fromYRotation(mat4.create(), angy);
		const Rz = mat4.fromZRotation(mat4.create(), angz);
		const R = mat4.mul(mat4.create(), mat4.mul(mat4.create(), Rz, Ry), Rx);
		return R;
	}

	calcEdges(): void {
		// Reshape the faces array to extract edges
		const reshapedEdges: number[][] = this.faces.flatMap((face) => [
			[face[0], face[1]],
			[face[0], face[2]],
			[face[1], face[2]],
		]);

		// Sort each edge (smallest index first)
		const sortedEdges: number[][] = reshapedEdges.map((edge) =>
			edge.sort((a, b) => a - b),
		);

		// Remove duplicates using a unique function
		const uniqueEdges: number[][] = Array.from(
			new Set(sortedEdges.map((edge) => JSON.stringify(edge))),
		).map((strEdge) => JSON.parse(strEdge));

		this.edges = uniqueEdges;
	}
}
