import { db } from "./db";
import type {
	CupSize,
	DefaultKeyValueCollectionValues,
	FormValues,
} from "./types";

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

export const getLockPosition = async () => {
	const lockPosition = await db.formValues
		.where("name")
		.equals("lockPosition")
		.first();

	return lockPosition?.value as FormValues["lockPosition"];
};

export const getCupSize = async () => {
	const cupSize = await db.formValues.where("name").equals("cupSize").first();
	return cupSize.value as CupSize;
};

export const getCupSizeHeight = async () => {
	const cupSize = await getCupSize();
	return cupSize.height;
};

export const getNozzleSize = async () => {
	const nozzleSize = await db.formValues
		.where("name")
		.equals("nozzleSize")
		.first();
	return Number(nozzleSize.value);
};

export const getLayerHeight = async () => {
	const layerHeight = await db.formValues
		.where("name")
		.equals("layerHeight")
		.first();

	return Number(layerHeight.value);
};

export const saveActiveMaterialProfile = async (
	activeMaterialProfile: string,
) => {
	return await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.modify({ value: activeMaterialProfile });
};
