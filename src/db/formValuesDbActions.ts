import { db } from "./db";
import type { DefaultKeyValueCollectionValues, FormValues } from "./types";

export const getFormKeyValues = async () => {
	return await db.formValues.toArray();
};

export const setFormValues = async (
	settings: DefaultKeyValueCollectionValues,
) => {
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
	const ipAddress = await db.formValues
		.where("name")
		.equals("ipAddress")
		.first();
	const ipAddressValue = (ipAddress?.value as string) ?? "";

	return ipAddressValue;
};

export const saveIpAddress = async (ipAddress: string) => {
	return await db.formValues
		.where("name")
		.equals("ipAddress")
		.modify({ value: ipAddress });
};

export const getLockPosition = async () => {
	const lockPosition = await db.formValues
		.where("name")
		.equals("lockPosition")
		.first();

	return lockPosition?.value as FormValues["lockPosition"];
};

export const saveLockPosition = async (
	lockPosition: FormValues["lockPosition"],
) => {
	return await db.formValues
		.where("name")
		.equals("lockPosition")
		.modify({ value: lockPosition });
};

export const getCupSize = async () => {
	const cupSize = await db.formValues.where("name").equals("cupSize").first();
	return cupSize.value as string;
};

export const getCupSizeHeight = async () => {
	const cupSize = await getCupSize();
	const splitWidthAndHeight = (cupSize as string).split("x");

	return Number(splitWidthAndHeight[1]);
};

export const saveCupSize = async (cupSize: string) => {
	return await db.formValues
		.where("name")
		.equals("cupSize")
		.modify({ value: cupSize });
};

export const getNozzleSize = async () => {
	const nozzleSize = await db.formValues
		.where("name")
		.equals("nozzleSize")
		.first();
	return Number(nozzleSize.value);
};

export const saveNozzleSize = async (nozzleSize: number) => {
	return await db.formValues
		.where("name")
		.equals("nozzleSize")
		.modify({ value: nozzleSize });
};

export const getLayerHeight = async () => {
	const layerHeight = await db.formValues
		.where("name")
		.equals("layerHeight")
		.first();

	return Number(layerHeight.value);
};

export const saveLayerHeight = async (layerHeight: number) => {
	return await db.formValues
		.where("name")
		.equals("layerHeight")
		.modify({ value: layerHeight });
};

export const getActiveMaterialProfile = async () => {
	const activeMaterialProfile = await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.first();
	return activeMaterialProfile.value as string;
};

export const saveActiveMaterialProfile = async (
	activeMaterialProfile: string,
) => {
	return await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.modify({ value: activeMaterialProfile });
};
