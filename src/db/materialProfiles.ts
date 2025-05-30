import { getDb } from "./getDb";
import type { MaterialProfile } from "./types";

export const getMaterialProfiles = async () => {
	const db = await getDb();
	const profiles = await db.materialProfiles.toArray();
	return profiles;
};

const getActiveProfile = async () => {
	const db = await getDb();
	const activeMaterialProfile = (await db.formValues
		.where("name")
		.equals("activeMaterialProfile")
		.first()) as unknown as { value: string };

	const activeProfile = await db.materialProfiles
		.where("name")
		.equals(activeMaterialProfile.value);

	return activeProfile;
};

export const getActiveMaterialProfile = async () => {
	const activeProfile = await (await getActiveProfile()).first();
	return activeProfile;
};

export const addNewMaterialProfile = async (
	profile: Omit<MaterialProfile, "id">,
) => {
	const db = await getDb();
	await db.materialProfiles.add(profile);
};

export const deleteActiveMaterialProfile = async () => {
	await (await getActiveProfile()).delete();
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

export const getActiveMaterialProfileShrinkFactor = async () => {
	return (await getActiveMaterialProfile()).shrinkFactor;
};

export const getActiveMaterialProfileNozzleTemp = async () => {
	return (await getActiveMaterialProfile()).nozzleTemp;
};

export const getActiveMaterialProfileOutputFactor = async () => {
	return (await getActiveMaterialProfile()).outputFactor;
};

export const getActiveMaterialProfileFeedrate = async () => {
	return (await getActiveMaterialProfile()).feedrate;
};
