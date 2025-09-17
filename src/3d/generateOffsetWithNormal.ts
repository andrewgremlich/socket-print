import {
	BufferAttribute,
	BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ensureUV } from "./ensureUV";

interface Facet {
	face: number;
	normal: Vector3;
	vertices: Vector3[]; // length 3
}

interface VertexUsageInfo {
	face: number;
	normal: Vector3; // source face normal
	vertexPositionInTheObject: number; // 0..2
}

type FacetCollection = Facet[];

function parseASCII(data: string): FacetCollection {
	const patternSolid = /solid([\s\S]*?)endsolid/g;
	const patternFace = /facet([\s\S]*?)endfacet/g;
	const patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source;
	const patternVertex = new RegExp(
		`vertex${patternFloat}${patternFloat}${patternFloat}`,
		"g",
	);
	const patternNormal = new RegExp(
		`normal${patternFloat}${patternFloat}${patternFloat}`,
		"g",
	);

	const facets: FacetCollection = [];
	let m: RegExpExecArray | null = patternSolid.exec(data);
	while (m !== null) {
		const solid = m[0];
		let faceNumber = 0;
		let faceMatch: RegExpExecArray | null = patternFace.exec(solid);
		while (faceMatch !== null) {
			const text = faceMatch[0];
			faceNumber++;
			const normalsFound: Vector3[] = [];
			const vertices: Vector3[] = [];
			let nm: RegExpExecArray | null = patternNormal.exec(text);
			while (nm !== null) {
				normalsFound.push(
					new Vector3(parseFloat(nm[1]), parseFloat(nm[2]), parseFloat(nm[3])),
				);
				nm = patternNormal.exec(text);
			}
			let vm: RegExpExecArray | null = patternVertex.exec(text);
			while (vm !== null) {
				vertices.push(
					new Vector3(parseFloat(vm[1]), parseFloat(vm[2]), parseFloat(vm[3])),
				);
				vm = patternVertex.exec(text);
			}
			const faceNormalVec = normalsFound[0] ?? new Vector3();
			facets.push({ face: faceNumber, normal: faceNormalVec, vertices });
			faceMatch = patternFace.exec(solid);
		}
		m = patternSolid.exec(data);
	}
	return facets;
}

function vertexKey(v: Vector3): string {
	return `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
}

function buildVertexUsageMap(
	facets: FacetCollection,
): Map<string, VertexUsageInfo[]> {
	const map = new Map<string, VertexUsageInfo[]>();
	for (const facet of facets) {
		facet.vertices.forEach((v, idx) => {
			const key = vertexKey(v);
			const entry = map.get(key);
			const info: VertexUsageInfo = {
				face: facet.face,
				normal: facet.normal,
				vertexPositionInTheObject: idx,
			};
			if (entry) entry.push(info);
			else map.set(key, [info]);
		});
	}
	return map;
}

function calcNormalsSum(list: VertexUsageInfo[]): Vector3 {
	const sum = new Vector3();
	for (const item of list) sum.add(item.normal);
	return sum;
}

function offsetPosition(offset: number, n: Vector3, v: Vector3): Vector3 {
	return new Vector3(
		v.x + offset * n.x,
		v.y + offset * n.y,
		v.z + offset * n.z,
	);
}

const _ab = new Vector3();
const _ac = new Vector3();
function faceNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
	_ab.subVectors(b, a);
	_ac.subVectors(c, a);
	const normal = new Vector3().crossVectors(_ab, _ac).normalize();
	return normal;
}

function buildOffsetFacetSet(
	facets: FacetCollection,
	offset: number,
): FacetCollection {
	const usageMap = buildVertexUsageMap(facets);
	const updated: FacetCollection = facets.map((f) => ({
		face: f.face,
		normal: new Vector3(),
		vertices: [] as Vector3[],
	}));

	usageMap.forEach((usages) => {
		const summed = calcNormalsSum(usages).normalize();
		for (const u of usages) {
			const sourceFacet = facets.find((f) => f.face === u.face);
			if (!sourceFacet) continue;
			const originalVertex = sourceFacet.vertices[u.vertexPositionInTheObject];
			const newPos = offsetPosition(offset, summed, originalVertex);
			const target = updated.find((f) => f.face === u.face);
			if (target) target.vertices[u.vertexPositionInTheObject] = newPos;
		}
	});

	for (const facet of updated) {
		const n = faceNormal(
			facet.vertices[0],
			facet.vertices[1],
			facet.vertices[2],
		);
		facet.normal.copy(n);
	}
	return updated;
}

export function createOffsetFacets(
	stlAscii: string,
	offset: number,
): FacetCollection {
	const facets = parseASCII(stlAscii);
	return buildOffsetFacetSet(facets, offset);
}

export async function createMeshFromObject(
	object: FacetCollection,
): Promise<Mesh> {
	const geometry = new BufferGeometry();
	const material = new MeshStandardMaterial({
		color: 0xffffff,
		opacity: 1,
		transparent: false,
		side: DoubleSide,
		vertexColors: false,
		wireframe: false,
	});

	const faceCount = object.length;
	const verticesPosition = new Float32Array(faceCount * 9); // 3 verts * 3 comps
	const normalsPosition = new Float32Array(faceCount * 9);
	let ptr = 0;
	for (const facet of object) {
		for (let i = 0; i < 3; i++) {
			const v = facet.vertices[i];
			const n = facet.normal; // flat shading per face
			verticesPosition[ptr] = v.x;
			verticesPosition[ptr + 1] = v.y;
			verticesPosition[ptr + 2] = v.z;
			normalsPosition[ptr] = n.x;
			normalsPosition[ptr + 1] = n.y;
			normalsPosition[ptr + 2] = n.z;
			ptr += 3;
		}
	}

	geometry.setAttribute("position", new BufferAttribute(verticesPosition, 3));
	geometry.setAttribute("normal", new BufferAttribute(normalsPosition, 3));

	const newGeometry = mergeVertices(geometry);
	newGeometry.computeVertexNormals();

	ensureUV(newGeometry);

	const mesh = new Mesh(newGeometry, material);
	return mesh;
}

export async function applyOffset(
	meshToOffset: Mesh,
	offset: number,
): Promise<Mesh> {
	const exporter = new STLExporter();
	const stlAscii = exporter.parse(meshToOffset, { binary: false }) as string;
	const offsetFacets = createOffsetFacets(stlAscii, offset);
	const meshOffset = await createMeshFromObject(offsetFacets);
	meshOffset.name = "offset";
	return meshOffset;
}
