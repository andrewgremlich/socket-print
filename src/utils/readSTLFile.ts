import type { BufferGeometry } from "three";

import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export function readSTLFile(file: File): Promise<BufferGeometry> {
	return new Promise((resolve, _reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const buffer = e.target?.result as ArrayBuffer;
			const loader = new STLLoader();
			const geometry = loader.parse(buffer);

			resolve(geometry);
		};

		reader.readAsArrayBuffer(file);
	});
}
