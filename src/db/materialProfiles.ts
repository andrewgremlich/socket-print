import { getDb } from "./getDb";
import type { MaterialProfile } from "./types";

export const getMaterialProfiles = async () => {
	const db = await getDb();
	const profiles = await db.materialProfiles.toArray();
	return profiles;
};

export const addNewMaterialProfile = async (
	profile: Omit<MaterialProfile, "id">,
) => {
	const db = await getDb();
	await db.materialProfiles.add(profile);
};

export const deleteActiveMaterialProfile = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.delete();
};

export const updateMaterialProfile = async (profile: {
	id: number;
	name: string;
	nozzleTemp: number;
	cupTemp: number;
	shrinkFactor: number;
	outputFactor: number;
}) => {
	const db = await getDb();
	await db.materialProfiles.update(profile.id, profile);
};

export const getActiveMaterialProfile = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile;
};

export const getActiveMaterialProfileShrinkFactor = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.shrinkFactor;
};

export const getActiveMaterialProfileNozzleTemp = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.nozzleTemp;
};

export const getActiveMaterialProfileOutputFactor = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.outputFactor;
};

export const getActiveMaterialProfileFeedrate = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.appSettings
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value)
		.first();

	return activeProfile.feedrate;
};
