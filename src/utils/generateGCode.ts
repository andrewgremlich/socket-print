import type { BufferGeometry, Vector3 } from "three";

// INFO: use this to troubleshoot the geometry
export function geometryToGCode(geometry: BufferGeometry): string {
	let gcode = "";

	console.log(geometry);

	for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
		gcode += `G1 X${geometry.attributes.position.array[i].toFixed(2)} Y${geometry.attributes.position.array[i + 1].toFixed(2)} Z${geometry.attributes.position.array[i + 2].toFixed(2)}\n`;
	}

	return gcode;
}

// Function to generate G-code from the slices
export function generateGCode(
	slices: Vector3[][][],
	layerHeight: number,
	feedrate = 1500,
): string {
	//https://docs.duet3d.com/en/User_manual/Reference/Gcodes
	let gcode = `;customInfo currentMaterial="PolyProp"
;customInfo currentNozzleSize = "5mm"
;customInfo currentCup = "93x38"
;customInfo currentTemp = "200C"
; estimated printing time (normal mode) = Xh YYm ZZs
G10 P0 S195 R175
T0
`;

	// TODO: provide estimated print time above.

	gcode += 'M98 P"0:/sys/provel/start.g"\n';
	gcode += "G21 ; Set units to millimeters\n";
	gcode += "G90 ; Use absolute positioning\n";
	gcode += "G28 ; Home all axes\n";
	gcode += "G1 Z0.3 F5000 ; Lift\n";

	slices.forEach((slice, layerIndex) => {
		gcode += `; Layer ${layerIndex}\n`;
		const y = layerIndex * layerHeight;

		for (const contour of slice) {
			if (contour.length > 0) {
				const startPoint = contour[0];
				gcode += `G0 X${startPoint.x.toFixed(2)} Y${y.toFixed(2)} Z${startPoint.z.toFixed(2)} F${feedrate}\n`;
				gcode += "G1 F1500 ; Start extrusion\n";

				contour.forEach((point, pointIndex) => {
					if (pointIndex > 0) {
						gcode += `G1 X${point.x.toFixed(2)} Y${y.toFixed(2)} Z${point.z.toFixed(2)} E1 ; Extrude\n`;
					}
				});

				gcode += "G0 F3000 ; Stop extrusion\n";
			}
		}
	});

	gcode += "G28 ; Home all axes\n";
	gcode += "M84 ; Disable motors\n";
	gcode += 'M98 P"0:/sys/provel/end.g"\n';

	return gcode;
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
