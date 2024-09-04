import "@/global-style.css";

import { Plane, Vector3 } from "three";

import { readSTLFile } from "@/utils/readSTLFile";
import { sliceGeometryWithPlane } from "@/utils/sliceGeometryWithPlane";

const mainApp = document.querySelector("#app") as HTMLDivElement;

function createSTLInput(): HTMLInputElement {
	const input = document.createElement("input");

	input.type = "file";
	input.accept = ".stl";

	input.addEventListener("change", async (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];

		if (file) {
			const stlData = await readSTLFile(file);

			console.log("vertices", stlData.attributes.position.array);
			console.log("normals", stlData.attributes.normal.array);
			console.log("stlData", stlData);

			// https://chatgpt.com/share/12754f6c-cb3d-4688-90e0-555579bb5948
			// https://stackoverflow.com/questions/48536836/3d-slicing-web-app-javascript-and-three-js
			// https://crates.io/crates/nom_stl
			// https://crates.io/crates/stl_io
			const plane = new Plane(new Vector3(0, 1, 0), 0);
			const slicedGeometry = sliceGeometryWithPlane(stlData, plane);

			console.log("slicedGeometry", slicedGeometry);

			// const sliceMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
			//       const sliceMesh = new THREE.LineSegments(sliceGeometry, sliceMaterial);
			//       scene.add(sliceMesh);

			//       animate();
		}
	});

	return input;
}

const stlInput = createSTLInput();

mainApp.appendChild(stlInput);
