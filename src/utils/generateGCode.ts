import type { Vector3 } from "three";

// Function to generate G-code from the slices
export function generateGCode(
	slices: Vector3[][][],
	layerHeight: number,
	feedrate = 1500,
): string {
	//https://docs.duet3d.com/en/User_manual/Reference/Gcodes
	let gcode = "G10 P0 S195 R175\nT0\n";

	gcode += "G21 ; Set units to millimeters\n";
	gcode += "G90 ; Use absolute positioning\n";
	gcode += "G28 ; Home all axes\n";
	gcode += "G1 Z0.3 F5000 ; Lift\n";

	slices.forEach((slice, layerIndex) => {
		gcode += `; Layer ${layerIndex}\n`;
		const z = (layerIndex + 1) * layerHeight;

		for (const contour of slice) {
			if (contour.length > 0) {
				const startPoint = contour[0];
				gcode += `G0 X${startPoint.x.toFixed(2)} Y${startPoint.y.toFixed(2)} Z${z.toFixed(2)} F${feedrate}\n`;
				gcode += "G1 F1500 ; Start extrusion\n";

				contour.forEach((point, pointIndex) => {
					if (pointIndex > 0) {
						gcode += `G1 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} E1 ; Extrude\n`;
					}
				});

				gcode += "G0 F3000 ; Stop extrusion\n";
			}
		}
	});

	gcode += "G28 ; Home all axes\n";
	gcode += "M84 ; Disable motors\n";

	return gcode;
}
