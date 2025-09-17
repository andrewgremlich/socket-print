import {
	BufferAttribute,
	BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { ensureUV } from "./ensureUV";

interface Facet {
	face: number; // index of the facet (triangle)
	normal: Vector3; // face normal
	vertices: Vector3[]; // length 3
}

interface VertexUsageInfo {
	facetIndex: number; // which facet uses this vertex
	normal: Vector3; // source face normal
	vertexPositionInTheObject: number; // 0..2 within the triangle
}

type FacetCollection = Facet[];

function vertexKey(v: Vector3): string {
	return `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
}

function buildVertexUsageMap(
	facets: FacetCollection,
): Map<string, VertexUsageInfo[]> {
	const map = new Map<string, VertexUsageInfo[]>();
	facets.forEach((facet, facetIndex) => {
		facet.vertices.forEach((v, idx) => {
			const key = vertexKey(v);
			const entry = map.get(key);
			const info: VertexUsageInfo = {
				facetIndex,
				normal: facet.normal,
				vertexPositionInTheObject: idx,
			};
			if (entry) entry.push(info);
			else map.set(key, [info]);
		});
	});
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

function extractFacetsFromGeometry(geometry: BufferGeometry): FacetCollection {
	const positionAttr = geometry.getAttribute("position") as BufferAttribute;
	if (!positionAttr) return [];
	const positions = positionAttr.array as Float32Array;
	const facets: FacetCollection = [];
	const triCount = positions.length / 9; // 3 verts * 3 comps
	for (let t = 0; t < triCount; t++) {
		const base = t * 9;
		const a = new Vector3(
			positions[base],
			positions[base + 1],
			positions[base + 2],
		);
		const b = new Vector3(
			positions[base + 3],
			positions[base + 4],
			positions[base + 5],
		);
		const c = new Vector3(
			positions[base + 6],
			positions[base + 7],
			positions[base + 8],
		);
		const n = faceNormal(a, b, c);
		facets.push({ face: t, normal: n, vertices: [a, b, c] });
	}
	return facets;
}

function buildOffsetFacetSet(
	facets: FacetCollection,
	offset: number,
): FacetCollection {
	const usageMap = buildVertexUsageMap(facets);
	const updated: FacetCollection = facets.map((_, idx) => ({
		face: idx,
		normal: new Vector3(),
		vertices: [] as Vector3[],
	}));

	usageMap.forEach((usages) => {
		const summed = calcNormalsSum(usages).normalize();
		for (const u of usages) {
			const sourceFacet = facets[u.facetIndex];
			if (!sourceFacet) continue;
			const originalVertex = sourceFacet.vertices[u.vertexPositionInTheObject];
			const newPos = offsetPosition(offset, summed, originalVertex);
			const target = updated[u.facetIndex];
			target.vertices[u.vertexPositionInTheObject] = newPos;
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

function createOffsetFacetsFromGeometry(
	geometry: BufferGeometry,
	offset: number,
): FacetCollection {
	// Ensure we have a non-indexed (triangle soup) geometry so that shared vertices are duplicated;
	// we'll still merge via spatial key for smooth-ish offset where coordinates match.
	const working = geometry.index ? geometry.toNonIndexed() : geometry;
	const facets = extractFacetsFromGeometry(working);
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

	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	geometry.computeVertexNormals(); // optional smoothing; we still keep flat normals array

	ensureUV(geometry);

	const mesh = new Mesh(geometry, material);
	return mesh;
}

export async function applyOffset(
	meshToOffset: Mesh,
	offset: number,
): Promise<Mesh> {
	const baseGeometry = meshToOffset.geometry as BufferGeometry;
	const offsetFacets = createOffsetFacetsFromGeometry(baseGeometry, offset);
	const meshOffset = await createMeshFromObject(offsetFacets);
	meshOffset.name = "offset";
	return meshOffset;
}
