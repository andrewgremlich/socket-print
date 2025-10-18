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

export const addNewMaterialProfile = async (profile: MaterialProfile) => {
	const db = await getDb();
	// biome-ignore lint/correctness/noUnusedVariables: this is to pull the id out.
	const { id, ...rest } = profile;

	await db.materialProfiles.add({ ...rest });
};

export const deleteActiveMaterialProfile = async () => {
	await (await getActiveProfile()).delete();
};

export const updateMaterialProfile = async (profile: MaterialProfile) => {
	const db = await getDb();
	await db.materialProfiles.update(profile.id, profile);
};

export const getActiveMaterialProfileShrinkFactor = async () => {
	return (await getActiveMaterialProfile()).shrinkFactor;
};

export const getActiveMaterialProfileCupTemp = async () => {
	return (await getActiveMaterialProfile()).cupTemp;
};

export const getActiveMaterialProfileNozzleTemp = async () => {
	return (await getActiveMaterialProfile()).nozzleTemp;
};

export const getActiveMaterialProfileOutputFactor = async () => {
	return (await getActiveMaterialProfile()).outputFactor;
};

export const getActiveMaterialProfileName = async () => {
	return (await getActiveMaterialProfile()).name;
};

export const getActiveMaterialProfileGramsPerRevolution = async () => {
	return (await getActiveMaterialProfile()).gramsPerRevolution;
};

export const getActiveMaterialProfileDensity = async () => {
	return (await getActiveMaterialProfile()).density;
};
