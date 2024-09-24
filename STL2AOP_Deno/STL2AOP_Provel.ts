import * as math from "https://deno.land/x/math@v1.1.0/mod.ts";
import { mat4, vec3 } from "npm:gl-matrix";

import { isBinarySTL } from "./utils.ts";
import { CustomAmpObject } from "./custom_amp_object.ts";

// User Configurable Parameters
const stlFilePath = "./test_stl_file.stl";
const sliceHeight = 1.0; // Slice pitch in mm
const spokes = 120; // Number of points per slice
const adaptiveSlicing = false; // Enable adaptive slicing
const saveAopFlag = false; // Set to false to keep AOP data in memory

async function convertAsciiToBinary(
	inputFile: string,
	outputFile: string,
): Promise<boolean> {
	try {
		const asciiContent = await Deno.readTextFile(inputFile);
		const binaryFile = await Deno.open(outputFile, {
			write: true,
			create: true,
		});

		const header = new TextEncoder().encode("Converted from ASCII to binary");
		const headerWithPadding = new Uint8Array(80).fill(0);
		headerWithPadding.set(header);
		await binaryFile.write(headerWithPadding);

		const vertices: number[][] = [];
		const lines = asciiContent.split("\n");
		lines.forEach((line) => {
			if (line.trim().startsWith("vertex")) {
				const vertex = line.trim().split(/\s+/).slice(1).map(Number);
				vertices.push(vertex);
			}
		});

		if (vertices.length % 3 !== 0) {
			console.error(
				"Error: STL file does not have a valid number of vertices (must be a multiple of 3).",
			);
			return false;
		}

		const numTriangles = vertices.length / 3;
		const numTrianglesBuffer = new Uint8Array(
			new Uint32Array([numTriangles]).buffer,
		);
		await binaryFile.write(numTrianglesBuffer);

		for (let i = 0; i < numTriangles; i++) {
			const normal = [0.0, 0.0, 0.0];
			const v1 = vertices[i * 3];
			const v2 = vertices[i * 3 + 1];
			const v3 = vertices[i * 3 + 2];

			const normalBuffer = new Float32Array(normal);
			const verticesBuffer = new Float32Array([...v1, ...v2, ...v3]);
			const attrByteCount = new Uint16Array([0]);

			await binaryFile.write(new Uint8Array(normalBuffer.buffer));
			await binaryFile.write(new Uint8Array(verticesBuffer.buffer));
			await binaryFile.write(new Uint8Array(attrByteCount.buffer));
		}

		console.info("ASCII STL file converted to binary format.");
		binaryFile.close();
		return true;
	} catch (e) {
		console.error(`Error converting STL file: ${e}`);
		return false;
	}
}

function calcPerimeter(polys: number[][][]): number[] {
	return polys.map((p) => {
		if (p.length === 0) return 0;
		const d = p.slice(1).map((point, i) => {
			const diff = [point[0] - p[i][0], point[1] - p[i][1]];
			return math.norm(diff);
		});
		const loopDist = math.norm([
			p[0][0] - p[p.length - 1][0],
			p[0][1] - p[p.length - 1][1],
		]);
		return d.reduce((sum, dist) => sum + dist, 0) + loopDist;
	});
}

function alignDistalCentroid(base: CustomAmpObject) {
	const vertices = base.vert;
	const minZ = Math.min(...vertices.map((v) => v[2]));
	const maxZ = Math.max(...vertices.map((v) => v[2]));
	const totZ = maxZ - minZ;

	const distVLog = vertices.filter((v) => v[2] < minZ + totZ * 0.05);
	const xShift =
		distVLog.length > 0
			? distVLog.reduce((sum, v) => sum + v[0], 0) / distVLog.length
			: 0;
	const yShift =
		distVLog.length > 0
			? distVLog.reduce((sum, v) => sum + v[1], 0) / distVLog.length
			: 0;

	base.translate([-xShift, -yShift, -minZ]);
}

function range(start: number, stop: number, step: number = 1): number[] {
	const result = [];
	for (let i = start; i < stop; i += step) {
		result.push(i);
	}
	return result;
}

function planeEdgeIntersect(
	edges: number[][],
	plane: number,
	axis: number = 2,
): number[][] {
	// Create an array to store the intersection points
	const intersectPoints = edges.map(() => [0, 0, 0]);

	// Set the intersection plane value along the specified axis
	intersectPoints.forEach((point) => {
		point[axis] = plane;
	});

	// Define the axes that are not the 'axis' argument
	const axesInd = [0, 1, 2].filter((i) => i !== axis);

	// Calculate the intersection points for the other axes
	for (const i of axesInd) {
		intersectPoints.forEach((point, idx) => {
			const edge = edges[idx];
			point[i] =
				edge[i] +
				((plane - edge[axis]) * (edge[i + 3] - edge[i])) /
					(edge[axis + 3] - edge[axis]);
		});
	}

	return intersectPoints;
}

function logEuPath(arr: number[][]): number[] {
	// Maximum number of rows (faces)
	const vmax = arr.length;

	// Initialize row indices and order of faces
	let rows = Array.from({ length: vmax }, (_, i) => i);
	const order: number[] = [];

	// Start with the first row
	let i = 0;
	let val = arr[i][0];
	const nmax = vmax - 1;

	// Loop through the rows to determine the correct face order
	for (let n = 0; n < nmax; n++) {
		// Remove the current row index
		rows.splice(i, 1);

		// Add the value to the order
		order.push(val);

		// Reset the index
		i = 0;

		// Find the next row where the edge matches
		for (const x of rows) {
			if (arr[x][0] === val) {
				val = arr[x][1];
				break;
			}
			if (arr[x][1] === val) {
				val = arr[x][0];
				break;
			}
			i++;
		}
	}

	// Append the last value to the order
	order.push(val);

	return order;
}

type SliceType = "slices" | "real_intervals" | "norm_intervals";

function createSlices(
	amp: CustomAmpObject,
	args: number[],
	axis = 2,
	order = true,
): any[] {
	let slices: number[] = args[0];

	const vE = amp.vert.map((v: vec3) => v[axis]).map((v, i) => amp.edges[i]);
	// const polys: any[] = [];

	// Iterate over slices and create polygons
	// for (const plane of slices) {
	// 	try {
	// 		if (vE.length === 0) continue;

	// 		const ind = vE.map((ve) => ve <= plane);
	// 		const validEdgeInd = ind
	// 			.map((i, idx) => (i[0] !== i[1] ? idx : null))
	// 			.filter((i) => i !== null) as number[];

	// 		if (validEdgeInd.length === 0) continue;

	// 		const validfE = validEdgeInd.map((idx) =>
	// 			amp.faceEdges[idx].map((f: any) => Number.parseInt(f, 10)),
	// 		);
	// 		const faceOrder = logEuPath(validfE); // Assuming logEuPath is a function you have
	// 		const validEdges = faceOrder.map((fo: any) => amp.edgesFace[fo]);
	// 		const edges = validEdges
	// 			.flat()
	// 			.filter((edge: any) => validEdgeInd.includes(edge))
	// 			.flat();
	// 		const e = edges.flat();
	// 		const sortE: number[] = [];

	// 		for (const ed of e) {
	// 			if (!sortE.includes(ed)) {
	// 				sortE.push(ed);
	// 			}
	// 		}
	// 		sortE.push(sortE[0]);
	// 		const polyEdge = sortE.map((se) => amp.edges[se]);

	// 		const edgePoints = polyEdge.map(([start, end]: [number, number]) => {
	// 			return [...amp.vert[start], ...amp.vert[end]];
	// 		});

	// 		polys.push(planeEdgeIntersect(edgePoints, plane, axis)); // Assuming planeEdgeintersect is a function
	// 	} catch (err) {
	// 		console.error(`Error creating slices: ${err}`);
	// 	}
	// }

	// return polys;
}

async function processStlFile(
	filePath: string,
	sliceHeight = 1.0,
	spokes = 120,
	adaptiveSlicing = false,
	saveAopFlag = false,
) {
	const isBinary = await isBinarySTL(filePath);

	if (!isBinary) {
		console.error("Error: STL file is not in binary format or it is corrupt.");
		return;
	}

	try {
		const base = new CustomAmpObject(filePath);

		await base.read_stl();

		alignDistalCentroid(base);

		// base.rotate(vec3.fromValues(0, 0, 90)); // Rotate 90 degrees // TODO: later

		const vertices = base.vert;
		const minZ = Math.min(...vertices.map((v) => v[2]));
		const maxZ = Math.max(...vertices.map((v) => v[2]));
		const totalModelHeight = maxZ - minZ;

		if (sliceHeight > totalModelHeight) {
			console.error(
				`Error: Slice height (${sliceHeight} mm) exceeds the model height (${totalModelHeight} mm).`,
			);
			return;
		}

		console.log(base);

		// Further slicing, perimeter calculations, AOP saving can go here

		// Fine slicing check
		// const finerResolution = 0.1; // in mm
		// const fineSlicingHeight = 5.0; // in mm
		// const fineSlices = Array.from(
		// 	{
		// 		length: Math.ceil((minZ + fineSlicingHeight - minZ) / finerResolution),
		// 	},
		// 	(_, i) => minZ + i * finerResolution,
		// );
		// const validFineSlices: number[] = [];
		// let desiredStartHeight = minZ;

		// // Simulating create_slices function
		// const initialSlice = createSlices(base, [minZ], 2);

		// console.log(initialSlice);

		// if (initialSlice.length > 0) {
		// 	validFineSlices.push(minZ);
		// } else {
		// 	for (const z of fineSlices) {
		// 		const slice = createSlices(base, [z], "slices", 2);
		// 		if (slice.length > 0) {
		// 			validFineSlices.push(z);
		// 			desiredStartHeight = z;
		// 			break;
		// 		}
		// 	}
		// 	if (validFineSlices.length === 0) {
		// 		desiredStartHeight = minZ + fineSlicingHeight;
		// 	}
		// }

		// const numSlices = Math.floor((maxZ - desiredStartHeight) / sliceHeight);
		// const regularSlices = Array.from(
		// 	{ length: numSlices + 1 },
		// 	(_, i) => desiredStartHeight + i * sliceHeight,
		// );

		// if (regularSlices[regularSlices.length - 1] > maxZ) {
		// 	regularSlices.pop();
		// }

		// let slices = validFineSlices.concat(regularSlices);

		// // Remove duplicates (similar to numpy's unique)
		// slices = [...new Set(slices)];

		// let validSlices: number[] = [];
		// for (const z of slices) {
		// 	const slice = createSlices(base, [z], "slices", 2);
		// 	if (slice.length > 0) {
		// 		validSlices.push(z);
		// 	}
		// }

		// // Extract base name and output directory
		// const stlFilePath = "/path/to/stl/file.stl"; // Example path
		// const baseName =
		// 	stlFilePath.split("/").pop()?.split(".").shift() ?? "unknown";
		// const outputDir = stlFilePath.substring(0, stlFilePath.lastIndexOf("/"));

		// // Capture the AOP data in memory or save to file based on the flag
		// const aopData = base.saveAop({
		// 	filename: saveAopFlag ? `${outputDir}/${baseName}_CONV.aop` : undefined,
		// 	slices: validSlices,
		// 	spokes: spokes,
		// 	closeEnd: false,
		// 	adaptive: adaptiveSlicing,
		// 	saveAopFlag: saveAopFlag,
		// });

		// if (!saveAopFlag) {
		// 	console.log("AOP data is being handled in memory.");
		// 	// Do something with aopData here if needed
		// }
	} catch (error) {
		console.error(`Unexpected error: ${error}`);
	}
}

// Run the STL processing function
processStlFile(stlFilePath, sliceHeight, spokes, adaptiveSlicing, saveAopFlag);
