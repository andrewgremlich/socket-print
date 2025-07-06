import { getDb } from "./getDb";
import type {
	DefaultKeyValueCollectionNames,
	DefaultKeyValueCollectionValues,
	FormValues,
} from "./types";

export const getFormKeyValues = async () => {
	const db = await getDb();
	return await db.formValues.toArray();
};

export const resetAllDefaultKeyValues = async (
	collection: DefaultKeyValueCollectionNames,
	settings: DefaultKeyValueCollectionValues,
) => {
	const db = await getDb();

	const settingsArray = Object.entries(settings).map(([name, value]) => ({
		name,
		value,
	}));

	for (const setting of settingsArray) {
		await db[collection]
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
