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
		activeMaterialProfile = "cp1",
		nozzleSize = "0.4",
		cupSize = "Unknown",
	} = window.provelPrintStore;
	const nozzleTemp =
		window.materialProfiles[activeMaterialProfile].nozzleTemp ?? "195";

	const gcode = [
		";TYPE:Custom",
		";metadata",
		`;estimated printing time (normal mode)=${estimatedTime}`,
		`;customInfo material="${activeMaterialProfile}"`,
		`;customInfo nozzleSize="${nozzleSize}mm"`,
		`;customInfo cupSize="${cupSize}"`,
		`;customInfo nozzleTemp="${nozzleTemp}C"`,
		";# START GCODE SEQUENCE FOR CUP PRINT#;",

		"G21 ; Set units to millimeters",
		"G90 ; Use absolute positioning",
		"M83 ; use relative distances for extrusion",

		";## Set temperatures ##",
		"M568 P0 S200 ; set temperature for barrel to 200;",
		"M140 P1 S160  ; set cup heater temperature to 160 and continue",

		";## Home ##",
		";G28",

		"## move to prime position/ pickup cup heater start position ##",
		"G1 Y0 Z48 F6000 ;Z down to cup height + 10 , Y moves back to cup center",
		"G1 X-95 ; only once at correct Z height move in to register with cup heater for pickup",
		"M116 S10 ; wait for temperatures to be reached +/-10C (including cup heater)",
		"set global.pelletFeedOn = true  ; enable pellet feed",
		'M98 P"0:/sys/provel/prime.g"   ;prime extruder',
		
		"##cup heater removal sequence##",
		"M140 P1 S0 ;cup heater off",
		"G1 Z70 F1500; Z moves up to pick up cup heater",
		"G1 X120 F1500; X right to park cup heater",
		"G1 Z17 F1500; Z down to place cup heater on bed",
		"G1 X90 F1500; X left to disengage cup heater",
		"G1 Z43 F1500; Z up to CH + 5 for groove fill",
		
		"##Groove fill",
		"G1 X50 Y0 F1500 ; Move to start of pre groove fill extrusion",
		"G1 E15 E300 ; extrude a bit to make up for any ooze",
		"G1 X39 Y0 E10 F1500 ; Move to start of circle at the edge, continue slight extrusion",
		"G1 E20 E300 ;extruder a bit to prevent a small gap at the start/end.",
		" ;Extrude in a circle A",
		"G3 X39 Y0 I-39 J0 E1030 F600 ; Clockwise circle around (0,0) with radius 39mm (1030 tested in practice complete groove fill).",
		
		"#End of start gcode sequence for cup print#",
		"##Spiral vase mode socket print to start immediately following this.",
		
		"--------print file in here--------"
		
		"G1 Z5 F5000 ; Lift",
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

	gcode.push(";# END GCODE SEQUENCE FOR CUP PRINT#;");
	gcode.push("M107");
	gcode.push("set global.pelletFeedOn = false");
	gcode.push('M98 P"0:/sys/provel/purge.g');
	gcode.push("M106 S0; turn the blowers and fan off");
	gcode.push("M140 S0 ; set bed temperature");
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
