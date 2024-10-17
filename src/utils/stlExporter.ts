import type { Mesh } from "three";
import { STLExporter } from "three/examples/jsm/Addons.js";

export const stlExporter = (mesh: Mesh) => {
	const exporter = new STLExporter();
	const stlString = exporter.parse(mesh);
	const blob = new Blob([stlString], { type: "text/plain" });

	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "model.stl";
	link.click();
};
