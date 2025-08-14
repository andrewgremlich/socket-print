import { getDb } from "./getDb";
import type { DefaultKeyValueCollectionValues, FormValues } from "./types";

export const getFormKeyValues = async () => {
	const db = await getDb();
	return await db.formValues.toArray();
};

export const setFormValues = async (
	settings: DefaultKeyValueCollectionValues,
) => {
	const db = await getDb();

	const settingsArray = Object.entries(settings).map(([name, value]) => ({
		name,
		value,
	}));

	for (const setting of settingsArray) {
		await db.formValues
			.where("name")
			.equals(setting.name)
			.modify({ value: setting.value });
	}
};

export const getIpAddress = async () => {
	const db = await getDb();
	const ipAddress = await db.formValues
		.where("name")
		.equals("ipAddress")
		.first();
	const ipAddressValue = (ipAddress?.value as string) ?? "";

	return ipAddressValue;
};

export const saveIpAddress = async (ipAddress: string) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("ipAddress")
		.modify({ value: ipAddress });
};

export const getLockPosition = async () => {
	const db = await getDb();
	const lockPosition = await db.formValues
		.where("name")
		.equals("lockPosition")
		.first();

	return lockPosition?.value as FormValues["lockPosition"];
};

export const saveLockPosition = async (
	lockPosition: FormValues["lockPosition"],
) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("lockPosition")
		.modify({ value: lockPosition });
};

export const getCupSize = async () => {
	const db = await getDb();
	const cupSize = await db.formValues.where("name").equals("cupSize").first();
	return cupSize.value as string;
};

export const getCupSizeHeight = async () => {
	const cupSize = await getCupSize();
	const splitWidthAndHeight = (cupSize as string).split("x");

	return Number(splitWidthAndHeight[1]);
};

export const saveCupSize = async (cupSize: string) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("cupSize")
		.modify({ value: cupSize });
};

export const getNozzleSize = async () => {
	const db = await getDb();
	const nozzleSize = await db.formValues
		.where("name")
		.equals("nozzleSize")
		.first();
	return Number(nozzleSize.value);
};

export const saveNozzleSize = async (nozzleSize: number) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("nozzleSize")
		.modify({ value: nozzleSize });
};

export const getLayerHeight = async () => {
	const db = await getDb();
	const layerHeight = await db.formValues
		.where("name")
		.equals("layerHeight")
		.first();

	return Number(layerHeight.value);
};

export const saveLayerHeight = async (layerHeight: number) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("layerHeight")
		.modify({ value: layerHeight });
};

export const getActiveMaterialProfile = async () => {
	const db = await getDb();
	const activeMaterialProfile = await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.first();
	return activeMaterialProfile.value as string;
};

export const saveActiveMaterialProfile = async (
	activeMaterialProfile: string,
) => {
	const db = await getDb();

	return await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.modify({ value: activeMaterialProfile });
};

export const getLockDepth = async () => {
	const db = await getDb();
	const lockDepth = await db.appSettings
		.where("name")
		.equals("lockDepth")
		.first();
	return Number(lockDepth.value);
};

export const getCircularSegments = async () => {
	const db = await getDb();
	const circularSegments = await db.appSettings
		.where("name")
		.equals("circularSegments")
		.first();

	return Number(circularSegments.value);
};

export const updateTranslateValues = async (
	translateX: number,
	translateY: number,
	translateZ: number,
) => {
	const db = await getDb();

	await Promise.all([
		db.appSettings
			.where("name")
			.equals("translateX")
			.modify({ value: translateX }),
		db.appSettings
			.where("name")
			.equals("translateY")
			.modify({ value: translateY }),
		db.appSettings
			.where("name")
			.equals("translateZ")
			.modify({ value: translateZ }),
	]);
};

export const getTranslateValues = async () => {
	const db = await getDb();
	const translateX = await db.appSettings
		.where("name")
		.equals("translateX")
		.first();
	const translateY = await db.appSettings
		.where("name")
		.equals("translateY")
		.first();
	const translateZ = await db.appSettings
		.where("name")
		.equals("translateZ")
		.first();

	return {
		x: Number(translateX.value),
		y: Number(translateY.value),
		z: Number(translateZ.value),
	};
};

export const updateRotateValues = async (
	rotateCoronal: number,
	rotateSagittal: number,
	rotateTransverse: number,
) => {
	const db = await getDb();

	await Promise.all([
		db.appSettings
			.where("name")
			.equals("rotateCoronal")
			.modify({ value: rotateCoronal }),
		db.appSettings
			.where("name")
			.equals("rotateSagittal")
			.modify({ value: rotateSagittal }),
		db.appSettings
			.where("name")
			.equals("rotateTransverse")
			.modify({ value: rotateTransverse }),
	]);
};

export const getRotateValues = async () => {
	const db = await getDb();
	const rotateCoronal = await db.appSettings
		.where("name")
		.equals("rotateCoronal")
		.first();
	const rotateSagittal = await db.appSettings
		.where("name")
		.equals("rotateSagittal")
		.first();
	const rotateTransverse = await db.appSettings
		.where("name")
		.equals("rotateTransverse")
		.first();

	return {
		coronal: Number(rotateCoronal.value),
		sagittal: Number(rotateSagittal.value),
		transverse: Number(rotateTransverse.value),
	};
};
