import type { Vector3 } from "three";
import type { RawPoint } from "./blendMerge";

export function flipVerticalAxis(currentAxis: "y" | "z"): "y" | "z" {
	return currentAxis === "y" ? "z" : "y";
}

/**
 * Options for G-code generation.
 */
interface GCodeOptions {
	feedrate?: number; // Feedrate in mm/min
	extrusionFactor?: number; // Factor for extrusion
	layerHeight?: number; // Layer height in mm
	estimatedTime?: string; // Estimated printing time
}

export function generateGCode(
	pointGatherer: RawPoint[][],
	verticalAxis: "y" | "z" = "y",
): string {
	let gcode = "G21 ; Set units to millimeters\n";
	gcode += "G90 ; Use absolute positioning\n";
	gcode += "G1 Z5 F5000 ; Lift\n";

	for (const pointLevel of pointGatherer) {
		for (const point of pointLevel) {
			const flipHeight = flipVerticalAxis(verticalAxis);
			gcode += `G1 X${point.x.toFixed(2)} Y${point[flipHeight].toFixed(
				2,
			)} Z${point[verticalAxis].toFixed(2)} F1500\n`;
		}
	}

	gcode += "G1 Z5 F5000 ; Lift\n";
	gcode += "M30 ; End of program\n";

	return gcode;
}

/**
 * Generate G-code from slices with custom headers.
 *
 * @param slices - The array of slices (output of `sliceGeometry`)
 * @param options - Object containing printing parameters (e.g., feedrate, extrusion factor)
 * @returns A string containing the G-code
 */
export function generateGCodeFromSlices(
	slices: Vector3[][][],
	options: GCodeOptions = {},
): string {
	const {
		feedrate = 1500, // Default feedrate in mm/min
		extrusionFactor = 0.05, // Factor for extrusion
		layerHeight = window.provelPrintStore.layerHeight as number, // Layer height in mm
		estimatedTime = "0h 0m 0s", // Default estimated time
	} = options;

	const {
		activeMaterialProfile = "Unknown",
		nozzleSize = "0.4",
		cupSize = "Unknown",
	} = window.provelPrintStore;
	const nozzleTemp =
		window.materialProfiles[activeMaterialProfile].nozzleTemp ?? "195";

	const gcode: string[] = [];
	let e = 0; // Track extrusion distance
	let currentZ = 0; // Track current Z height

	// Add custom headers
	gcode.push(`;customInfo material="${activeMaterialProfile}"`);
	gcode.push(`;customInfo nozzleSize="${nozzleSize}mm"`);
	gcode.push(`;customInfo cupSize="${cupSize}"`);
	gcode.push(`;customInfo nozzleTemp="${nozzleTemp}C"`);
	gcode.push(`;estimated printing time (normal mode)=${estimatedTime}`);
	gcode.push("G10 P0 S195 R175");
	gcode.push("T0");
	gcode.push('M98 P"0:/sys/provel/start.g"');
	gcode.push("G21 ; Set units to millimeters");
	gcode.push("G90 ; Use absolute positioning");
	gcode.push("G28 ; Home all axes");
	gcode.push("G1 X0.3 F5000 ; Lift");

	// Iterate through each slice
	for (const contours of slices) {
		currentZ += layerHeight;

		gcode.push(`; Layer at Z=${currentZ.toFixed(2)}`);
		gcode.push(`G1 Z${currentZ.toFixed(2)} F300 ; Move to layer height`);

		// Iterate through each contour in the slice
		for (const contour of contours) {
			if (contour.length === 0) continue;

			// Move to the starting point of the contour without extruding
			const start = contour[0];
			gcode.push(
				`G0 X${start.x.toFixed(2)} Y${start.y.toFixed(
					2,
				)} F${feedrate} ; Move to start of contour`,
			);

			// Extrude along the rest of the points in the contour
			for (let i = 1; i < contour.length; i++) {
				const point = contour[i];
				const distance = start.distanceTo(point); // Distance to the next point
				e += distance * extrusionFactor; // Calculate extrusion amount
				gcode.push(
					`G1 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} E${e.toFixed(
						5,
					)} F${feedrate}`,
				);
			}
		}
	}

	// Finish G-code
	gcode.push("M104 S0 ; Turn off extruder");
	gcode.push("M140 S0 ; Turn off bed");
	gcode.push("G28 X0 Y0 ; Home X and Y axes");
	gcode.push("M84 ; Disable motors");
	gcode.push('M98 P"0:/sys/provel/end.g"');

	return gcode.join("\n");
}

export function downloadGCodeFile(
	gcodeString: string,
	fileName = "file.gcode",
) {
	const blob = new Blob([gcodeString], { type: "text/plain" });
	const link = document.createElement("a");

	link.href = URL.createObjectURL(blob);
	link.download = fileName;

	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);
}
