import { Plane, Vector3 } from "three";

export const getPlaneAtHeight = (height: number): Plane => {
	const normal = new Vector3(0, 0, 1);
	const constant = -height;
	return new Plane(normal, constant);
};
