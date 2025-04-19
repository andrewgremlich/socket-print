import { round, sqrt } from "mathjs";
import pkg from "pkg";

import {
	getActiveMaterialProfile,
	getCupSize,
	getCupSizeHeight,
	getNozzleSize,
} from "@/db/appSettings";
import {
	getActiveMaterialProfileFeedrate,
	getActiveMaterialProfileNozzleTemp,
	getActiveMaterialProfileOutputFactor,
} from "@/db/materialProfiles";

import type { RawPoint } from "./blendHardEdges";

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

/**
 * Generates G-code from a single level array of points.
 */
export async function generateGCode(
	pointGatherer: RawPoint[][],
	verticalAxis: "y" | "z" = "y",
	options: GCodeOptions = {},
): Promise<string> {
	const { estimatedTime = "0h 0m 0s" } = options;
	const activeMaterialProfile = await getActiveMaterialProfile();
	const extrusionFactor = await getActiveMaterialProfileOutputFactor();
	const feedrate = await getActiveMaterialProfileFeedrate();
	const nozzleSize = await getNozzleSize();
	const cupSize = await getCupSize();
	const nozzleTemp = (await getActiveMaterialProfileNozzleTemp()) ?? "195";
	const socketHeight = (await getCupSizeHeight()) + 5;
	const gcode = [
		`;generated by ProvelPrint ${pkg.version} on ${new Date().toUTCString()}`,
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

		";## move to prime position/ pickup cup heater start position ##",
		"G1 Y0 Z48 F6000 ;Z down to cup height + 10 , Y moves back to cup center",
		"G1 X-95 ; only once at correct Z height move in to register with cup heater for pickup",
		"M116 S10 ; wait for temperatures to be reached +/-10C (including cup heater)",

		";##cup heater removal sequence##",
		"M140 P1 S0 ;cup heater off",
		"G1 Z70 F1500; Z moves up to pick up cup heater",
		"G1 X120 F2000; X right to park cup heater",
		"G1 Z17 F2000; Z down to place cup heater on bed",
		"G1 X90 F2000; X left to disengage cup heater",
		"set global.pelletFeedOn = true  ; enable pellet feed",
		'M98 P"0:/sys/provel/prime.g"   ;prime extruder',
		"G4 S2 ; pause for 2 seconds for prime to finish",
		`G1 Z${socketHeight} F2000; Z up to CH + 5 for groove fill`,

		";##Groove fill",
		"G1 X50 Y0 F1500 ; Move to start of pre groove fill extrusion",
		"G1 E15 E300 ; extrude a bit to make up for any ooze",
		"G1 X39 Y0 E10 F1500 ; Move to start of circle at the edge, continue slight extrusion",
		"G1 E20 E300 ;extruder a bit to prevent a small gap at the start/end.",
		" ;Extrude in a circle A",
		"G3 X39 Y0 I-39 J0 E1030 F600 ; Clockwise circle around (0,0) with radius 39mm (1030 tested in practice complete groove fill).",

		";#End of start gcode sequence for cup print#",
		";##Spiral vase mode socket print to start immediately following this.",

		";--------print file in here--------",
	];

	let previousPoint: RawPoint = { x: 39, y: 0, z: socketHeight }; // hardcoded start point... see from gcode

	gcode.push(
		`G1 X${previousPoint.x.toFixed(2)} Y${previousPoint.y.toFixed(
			2,
		)} Z${previousPoint.z.toFixed(2)} F${feedrate}`,
	);

	for (let i = 0; i < pointGatherer.length; i++) {
		const pointLevel = pointGatherer[i];

		gcode.push(";START NEW LEVEL");

		if (i === 0) {
			gcode.push("M106 P2 S0 ; set fan speed");
		}

		if (i === 1) {
			gcode.push("M106 P2 S0.5 ; set fan speed");
		}

		// if (i === 2) {
		// 	gcode.push("M106 P2 S1 ; set fan speed");
		// }

		for (let j = 0; j < pointLevel.length; j++) {
			let extrusion = 0;

			const point = pointLevel[j];
			const dx = point.x - previousPoint.x;
			const dy = point.y - previousPoint.y;
			const dz = point.z - previousPoint.z;
			const extrusionMultiplier =
				j === 0 ? extrusionFactor : extrusionFactor * 0.77;
			extrusion =
				(sqrt(dx * dx + dy * dy + dz * dz) as number) * extrusionMultiplier;

			if (i === 0) {
				extrusion = extrusion * ((j + 1) / pointLevel.length);
			}

			previousPoint = point;
			const flipHeight = flipVerticalAxis(verticalAxis);
			gcode.push(
				`G1 X${round(point.x, 2)} Y${round(point[flipHeight], 2)} Z${round(point[verticalAxis], 2)} E${round(extrusion, 4)} F${feedrate}`,
			);
		}
	}

	gcode.push(";# END GCODE SEQUENCE FOR CUP PRINT#;");
	gcode.push("M107");
	gcode.push("set global.pelletFeedOn = false");
	gcode.push("G4 S1 ; pause for 1 second to stop extrudate");
	gcode.push('M98 P"0:/sys/provel/purge.g"');
	gcode.push("M106 S0; turn the blowers and fan off");
	gcode.push("M140 S0 ; set bed temperature");
	gcode.push('M98 P"0:/sys/provel/end.g"');

	return gcode.join("\n");
}

export async function writeGCodeFile(
	gcodeString: string,
	fileName = "file.gcode",
) {
	if (window.isTauri) {
		const dialog = await import("@tauri-apps/plugin-dialog");
		const fs = await import("@tauri-apps/plugin-fs");
		const path = await dialog.save({
			title: "Save GCode file",
			defaultPath: fileName,
			filters: [
				{
					name: "GCode",
					extensions: ["gcode"],
				},
			],
		});

		await fs.writeFile(`${path}`, new TextEncoder().encode(gcodeString));
	} else {
		const blob = new Blob([gcodeString], { type: "text/plain" });
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);
		link.download = fileName;

		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);
	}
}
