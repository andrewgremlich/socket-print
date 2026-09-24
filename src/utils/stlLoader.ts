import type { BufferGeometry, Mesh } from "three";
import { STLExporter } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { setFileByName } from "@/db/file";
import type { PrintObjectType } from "@/db/types";

/**
 * Reads an STL file and returns the parsed geometry.
 */
export const readSTLFile = (file: File): Promise<BufferGeometry> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const buffer = e.target?.result as ArrayBuffer;
			const loader = new ThreeSTLLoader();
			const geometry = loader.parse(buffer);
			resolve(geometry);
		};

		reader.onerror = () => reject(new Error("Failed to read STL file"));

		reader.readAsArrayBuffer(file);
	});
};

/**
 * Exports a mesh to STL format and saves it to the database.
 */
export const exportMeshToDatabase = async (
	mesh: Mesh,
	fileName: string,
	objectType: PrintObjectType,
): Promise<void> => {
	mesh.geometry.computeBoundingBox();

	const stlExporter = new STLExporter();
	const stlString = stlExporter.parse(mesh);
	const stlArrayBuffer = new TextEncoder().encode(stlString).buffer;

	const stlFile = new File([stlArrayBuffer], fileName, {
		type: "model/stl",
	});

	await setFileByName(stlFile.name, {
		name: stlFile.name,
		type: objectType,
		file: stlFile,
	});
};
