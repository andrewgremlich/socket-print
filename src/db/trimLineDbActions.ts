import type { Vector3 } from "three";
import { db } from "./db";

export type TrimLinePoint = {
	x: number;
	y: number;
	z: number;
};

export const getTrimLinePoints = async (): Promise<TrimLinePoint[]> => {
	const trimLinePoints = await db.appSettings
		.where("name")
		.equals("trimLinePoints")
		.first();

	if (!trimLinePoints?.value) {
		return [];
	}

	return JSON.parse(trimLinePoints.value as string);
};

export const setTrimLinePoints = async (points: Vector3[]): Promise<void> => {
	const serialized = JSON.stringify(
		points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
	);

	await db.appSettings
		.where("name")
		.equals("trimLinePoints")
		.modify({ value: serialized });
};

export const getTrimLineEnabled = async (): Promise<boolean> => {
	const trimLineEnabled = await db.appSettings
		.where("name")
		.equals("trimLineEnabled")
		.first();

	return trimLineEnabled?.value === true;
};

export const setTrimLineEnabled = async (enabled: boolean): Promise<void> => {
	await db.appSettings
		.where("name")
		.equals("trimLineEnabled")
		.modify({ value: enabled });
};

export const clearTrimLineData = async (): Promise<void> => {
	await Promise.all([
		db.appSettings
			.where("name")
			.equals("trimLinePoints")
			.modify({ value: "[]" }),
		db.appSettings
			.where("name")
			.equals("trimLineEnabled")
			.modify({ value: false }),
	]);
};
