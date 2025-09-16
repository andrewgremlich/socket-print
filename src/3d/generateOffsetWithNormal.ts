import {
	BufferAttribute,
	BufferGeometry,
	DoubleSide,
	DynamicDrawUsage,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Vec3 = [number, number, number];

interface Facet {
	face: number;
	normal: number[]; // flattened normal components (length 3)
	vertices: Vec3[]; // three vertices
}

interface VertexUsageInfo {
	face: number;
	normal: number[]; // source face normal (length 3)
	vertexPositionInTheObject: number; // 0..2
}

type FacetCollection = Facet[];

function parseASCII(data: string): FacetCollection {
	const patternSolid = /solid([\s\S]*?)endsolid/g;
	const patternFace = /facet([\s\S]*?)endfacet/g;
	const patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source;
	const patternVertex = new RegExp(
		"vertex" + patternFloat + patternFloat + patternFloat,
		"g",
	);
	const patternNormal = new RegExp(
		"normal" + patternFloat + patternFloat + patternFloat,
		"g",
	);

	const facets: FacetCollection = [];
	let m: RegExpExecArray | null;

	// iterate solids
	m = patternSolid.exec(data);
	while (m !== null) {
		const solid = m[0];
		let faceNumber = 0;
		let faceMatch: RegExpExecArray | null = patternFace.exec(solid);
		while (faceMatch !== null) {
			const text = faceMatch[0];
			faceNumber++;
			const normalValues: number[] = [];
			const vertices: Vec3[] = [];

			let nm: RegExpExecArray | null = patternNormal.exec(text);
			while (nm !== null) {
				normalValues.push(
					parseFloat(nm[1]),
					parseFloat(nm[2]),
					parseFloat(nm[3]),
				);
				nm = patternNormal.exec(text);
			}
			let vm: RegExpExecArray | null = patternVertex.exec(text);
			while (vm !== null) {
				vertices.push([
					parseFloat(vm[1]),
					parseFloat(vm[2]),
					parseFloat(vm[3]),
				]);
				vm = patternVertex.exec(text);
			}
			facets.push({ face: faceNumber, normal: normalValues, vertices });
			faceMatch = patternFace.exec(solid);
		}
		m = patternSolid.exec(data);
	}
	return facets;
}

function vertexKey(v: Vec3): string {
	return `${v[0].toFixed(6)},${v[1].toFixed(6)},${v[2].toFixed(6)}`;
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

function calcNormalsSum(list: VertexUsageInfo[]): Vec3 {
	let sx = 0,
		sy = 0,
		sz = 0;
	for (const item of list) {
		sx += item.normal[0];
		sy += item.normal[1];
		sz += item.normal[2];
	}
	return [sx, sy, sz];
}

function normalize(v: Vec3): Vec3 {
	const len = Math.hypot(v[0], v[1], v[2]) || 1;
	return [v[0] / len, v[1] / len, v[2] / len];
}

function offsetPosition(offset: number, n: Vec3, v: Vec3): Vec3 {
	return [v[0] + offset * n[0], v[1] + offset * n[1], v[2] + offset * n[2]];
}

function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
	const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
	const ny = -((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]));
	const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
	return normalize([nx, ny, nz]);
}

function buildOffsetFacetSet(
	facets: FacetCollection,
	offset: number,
): FacetCollection {
	const usageMap = buildVertexUsageMap(facets);
	const updated: FacetCollection = facets.map((f) => ({
		face: f.face,
		normal: [] as number[],
		vertices: [] as Vec3[],
	}));

	usageMap.forEach((usages, key) => {
		const summed = normalize(calcNormalsSum(usages));
		const originalVertex = key.split(",").map(Number) as Vec3;
		const newPos = offsetPosition(offset, summed, originalVertex);
		for (const u of usages) {
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
		facet.normal = [n[0], n[1], n[2]];
	}
	return updated;
}

export function createOffsetMesh(
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
		color: 0x0000ff,
		opacity: 0.2,
		transparent: true,
		side: DoubleSide,
		vertexColors: true,
		wireframe: true,
	});

	const normals: number[] = [];
	const vertices: number[] = [];
	for (const facet of object) {
		for (const v of facet.vertices) {
			normals.push(facet.normal[0], facet.normal[1], facet.normal[2]);
			vertices.push(v[0], v[1], v[2]);
		}
	}

	const normalsPosition = new Float32Array(object.length * 3 * 3);
	const verticesPosition = new Float32Array(object.length * 3 * 3);
	for (let i = 0; i < normals.length; i += 3) {
		normalsPosition[i] = normals[i];
		normalsPosition[i + 1] = normals[i + 1];
		normalsPosition[i + 2] = normals[i + 2];
		verticesPosition[i] = vertices[i];
		verticesPosition[i + 1] = vertices[i + 1];
		verticesPosition[i + 2] = vertices[i + 2];
	}

	geometry.setAttribute("position", new BufferAttribute(verticesPosition, 3));
	geometry.setAttribute("normal", new BufferAttribute(normalsPosition, 3));

	const newGeometry = mergeVertices(geometry);
	newGeometry.computeVertexNormals();

	const colorArray = new Uint8Array(newGeometry.attributes.position.count * 3);
	colorArray.fill(255);
	const colorAttr = new BufferAttribute(colorArray, 3, true);
	colorAttr.setUsage(DynamicDrawUsage);
	newGeometry.setAttribute("color", colorAttr);

	const mesh = new Mesh(newGeometry, material);
	return mesh;
}

export async function applyOffset(
	meshToOffset: Mesh,
	offset: number,
): Promise<Mesh> {
	const exporter = new STLExporter();
	const stlAscii = exporter.parse(meshToOffset, { binary: false }) as string;
	const offsetFacets = createOffsetMesh(stlAscii, offset);
	const meshOffset = await createMeshFromObject(offsetFacets);
	meshOffset.name = "offset";
	return meshOffset;
}
