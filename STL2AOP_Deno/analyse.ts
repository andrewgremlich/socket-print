import { readFileStr } from "https://deno.land/std/fs/mod.ts";
import * as math from "https://deno.land/x/math@1.1.0/mod.ts";
import { plot } from "https://deno.land/x/matplotlib/mod.ts"; // You can replace this with a suitable Deno plotting package
import { Matrix } from "https://deno.land/x/math/matrix.ts"; // For matrix handling

// Helper function to read STL file, similar to os.path in Python
const filename = `${Deno.cwd()}/tests/stl_file.stl`;

// Function to calculate volume for closed shapes
async function calcVolumeClosed(
	amp: any,
	returnClosed: boolean = false,
): Promise<number | [number, any]> {
	amp = amp.close();
	const v01 = math.subtract(
		amp.vert[amp.faces.map((face: any) => face[1])],
		amp.vert[amp.faces.map((face: any) => face[0])],
	);
	const v02 = math.subtract(
		amp.vert[amp.faces.map((face: any) => face[2])],
		amp.vert[amp.faces.map((face: any) => face[0])],
	);
	const cp = math.square(math.cross(v01, v02));
	const area = 0.5 * Math.sqrt(math.sum(cp, 1));
	const sVC = math.multiply(
		area,
		math.mean(amp.vert[amp.faces.map((face: any) => face[2])], 1) *
			amp.norm.map((norm: any) => norm[2]),
	);

	if (returnClosed) {
		return [math.sum(sVC), amp];
	}
	return math.sum(sVC);
}

// Function to create slices based on given axis and interval types
function createSlices(
	amp: any,
	args: any[],
	typ = "slices",
	axis = 2,
	order = true,
) {
	let slices;
	if (typ === "slices") {
		slices = new Float64Array(args[0]);
	} else if (typ === "real_intervals") {
		const lim = new Float64Array(args[0]);
		const intervals = parseFloat(args[1]);
		slices = new Float64Array(
			[...Array(Math.ceil((lim[1] - lim[0]) / intervals) + 1)].map(
				(_, i) => lim[0] + i * intervals,
			),
		);
		slices[slices.length - 1] = lim[1];
	} else if (typ === "norm_intervals") {
		const limbMin = Math.min(...amp.vert.map((v: any) => v[axis]));
		const limbMax = Math.max(...amp.vert.map((v: any) => v[axis]));
		const limbLen = limbMax - limbMin;
		const lim = new Float64Array(args[0]);
		const intervals = parseFloat(args[1]);
		slices = new Float64Array(
			[...Array(Math.ceil((lim[1] - lim[0]) / intervals) + 1)].map(
				(_, i) => lim[0] + i * intervals,
			),
		);
		slices[slices.length - 1] = lim[1];
		slices = new Float64Array(slices.map((s) => limbMin + s * limbLen));
	} else {
		return [];
	}
	const vE = amp.vert
		.map((v: any) => v[axis])
		[amp.edges].map((v: any) => new Float64Array(v));
	const polys: any[] = [];

	slices.forEach((plane: number) => {
		try {
			const ind = vE.map((v) => v <= plane);
			const validEdgeInd = ind
				.map((row, i) => (row.some(Boolean) ? i : -1))
				.filter((i) => i >= 0);
			const validfE = amp.faceEdges
				.map((edge: any) => new Int32Array(edge))
				.filter((_, i) => validEdgeInd.includes(i));
			const faceOrder = logEuPath(validfE);
			const validEdges = amp.edgesFace
				.map((edge: any) => new Int32Array(edge))
				.filter((_, i) => faceOrder.includes(i));
			const edges = validEdges
				.flat()
				.filter((_, i, self) => self.indexOf(_) === i);
			const polyEdge = edges
				.map((e) => amp.edges[e])
				.map((e) => new Int32Array(e));
			const edgePoints = polyEdge.flatMap((edge) => [
				...amp.vert[edge[0]],
				...amp.vert[edge[1]],
			]);
			polys.push(planeEdgeIntersect(new Float64Array(edgePoints), plane, axis));
		} catch {
			return;
		}
	});

	return polys;
}

// Utility functions (e.g., logEuPath, planeEdgeIntersect) should also be ported from Python similarly

// Visualization
async function visualiseSlices(amp: any) {
	const fig = plot.figure({ size: [8, 8] });
	const ax = plot.axes3D(fig);

	const X = new Float64Array(amp.vert.map((v: any) => v[0]));
	const Y = new Float64Array(amp.vert.map((v: any) => v[1]));
	const Z = new Float64Array(amp.vert.map((v: any) => v[2]));

	ax.viewInit(0, -90);
	ax.axis("off");
	ax.setProjType("ortho");
	ax.setAspect("equal");

	ax.plotTrisurf(X, Y, Z, amp.faces, { color: [1.0, 1.0, 1.0], shade: false });

	await plot.savefig(fig, "test1.png", { dpi: 600 });
	plot.close(fig);
}

// More functions like `calcPerimeter`, `calcWidths`, `calcCsa`, `estVolume`, etc., would follow similarly with appropriate JS handling of arrays

// Example usage
async function main() {
	const ampObject = {}; // Amp object would be structured here based on your amp class/structure

	const volume = await calcVolumeClosed(ampObject);
	console.log("Volume:", volume);

	const slices = createSlices(ampObject, [0, 1], "slices");
	await visualiseSlices(ampObject);
}

main().catch(console.error);
