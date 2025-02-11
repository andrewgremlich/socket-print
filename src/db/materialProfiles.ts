import { getDb } from "./getDb";

export const getMaterialProfiles = async () => {
	const db = await getDb();
	const profiles = await db.materialProfiles.toArray();
	return profiles;
};

export const addNewMaterialProfile = async (profile: {
	name: string;
	nozzleTemp: number;
	cupTemp: number;
	shrinkFactor: number;
	outputFactor: number;
}) => {
	const db = await getDb();
	await db.materialProfiles.add(profile);
};

export const getActiveMaterialProfile = async () => {
	const db = await getDb();
	const activeMaterialProfile = await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first();
	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile;
};

export const getActiveMaterialProfileShrinkFactor = async () => {
	const db = await getDb();
	const activeMaterialProfile = await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first();

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.shrinkFactor;
};

export const getActiveMaterialProfileNozzleTemp = async () => {
	const db = await getDb();
	const activeMaterialProfile = await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first();

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.nozzleTemp;
};
