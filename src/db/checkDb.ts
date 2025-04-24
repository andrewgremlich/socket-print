import { getDb } from "./getDb";
import type { MaterialProfile, ProvelPrintSettings } from "./types";

export async function settingsDefaults(
	defaultSettingNames: ProvelPrintSettings,
) {
	const db = await getDb();
	const settings = await db.appSettings.toArray();

	const missingSettings = Object.keys(defaultSettingNames).filter(
		(defaultSettingName) =>
			!settings.some((setting) => setting.name === defaultSettingName),
	);

	if (missingSettings.length) {
		await Promise.all(
			missingSettings.map((name) =>
				db.appSettings.add({
					name,
					value: defaultSettingNames[name as keyof ProvelPrintSettings],
				}),
			),
		);
	}
}

export async function makeMaterialProfileDefaults(
	materialProfileDefaults: Omit<MaterialProfile, "id">,
) {
	const db = await getDb();
	const defaultProfile = await db.materialProfiles
		.where("name")
		.equals("cp1")
		.first();

	if (defaultProfile) {
		const missingKeys = Object.keys(materialProfileDefaults).filter(
			(key) => !Object.keys(defaultProfile).includes(key),
		);
		await Promise.all(
			missingKeys.map((key) =>
				db.materialProfiles.update(defaultProfile.id, {
					[key as keyof typeof materialProfileDefaults]:
						materialProfileDefaults[
							key as keyof typeof materialProfileDefaults
						],
				}),
			),
		);
	}

	if (!defaultProfile) {
		await db.materialProfiles.add(materialProfileDefaults);
	}
}
