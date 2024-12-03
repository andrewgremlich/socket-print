import type { Mesh } from "three";

export const prepForSlicing = (mesh: Mesh) => {
	const clonedMesh = mesh.clone();

	clonedMesh.rotation.x = Math.PI / 2;

	clonedMesh.position.set(0, 0, 0);

	clonedMesh.updateMatrixWorld();

	clonedMesh.geometry.applyMatrix4(clonedMesh.matrixWorld);
	clonedMesh.geometry.computeVertexNormals();
	clonedMesh.geometry.computeBoundingBox();

	return clonedMesh;
};
