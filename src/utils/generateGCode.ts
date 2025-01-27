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
	options: GCodeOptions = {},
): string {
	const {
		feedrate = 1500, // Default feedrate in mm/min
		// extrusionFactor = 0.05, // Factor for extrusion
		// layerHeight = window.provelPrintStore.layerHeight as number, // Layer height in mm
		estimatedTime = "0h 0m 0s", // Default estimated time
	} = options;
	const {
		activeMaterialProfile = "Unknown",
		nozzleSize = "0.4",
		cupSize = "Unknown",
	} = window.provelPrintStore;
	const nozzleTemp =
		window.materialProfiles[activeMaterialProfile].nozzleTemp ?? "195";

	const gcode = [
		"G21 ; Set units to millimeters",
		"G90 ; Use absolute positioning",
		"G1 Z5 F5000 ; Lift",
		`;customInfo material="${activeMaterialProfile}"`,
		`;customInfo nozzleSize="${nozzleSize}mm"`,
		`;customInfo cupSize="${cupSize}"`,
		`;customInfo nozzleTemp="${nozzleTemp}C"`,
		`;estimated printing time (normal mode)=${estimatedTime}`,
		"G10 P0 S195 R175",
		"T0",
		'M98 P"0:/sys/provel/start.g"',
		"G21 ; Set units to millimeters",
		"G90 ; Use absolute positioning",
		"G28 ; Home all axes",
		"G1 X0.3 F5000 ; Lift",
	];

	for (const pointLevel of pointGatherer) {
		for (const point of pointLevel) {
			const flipHeight = flipVerticalAxis(verticalAxis);
			gcode.push(
				`G1 X${point.x.toFixed(2)} Y${point[flipHeight].toFixed(
					2,
				)} Z${point[verticalAxis].toFixed(2)} F${feedrate}`,
			);
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
