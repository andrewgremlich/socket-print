import { getDb } from "./getDb";
import type { ProvelPrintSettings } from "./types";

export const defaultSettingNames: ProvelPrintSettings = {
	ipAddress: "",
	lockPosition: "right",
	cupSize: "93x25",
	nozzleSize: 5,
	layerHeight: 1,
	activeMaterialProfile: "cp1",
	lockDepth: 13,
	circularSegments: 128,
	debug: true,
};

export async function settingsDefaults() {
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

export async function materialProfileDefaults() {
	const db = await getDb();
	const defaultProfile = await db.materialProfiles
		.where("name")
		.equals("cp1")
		.first();

	if (!defaultProfile) {
		await db.materialProfiles.add({
			name: "cp1",
			nozzleTemp: 200,
			cupTemp: 130,
			shrinkFactor: 2.6,
			outputFactor: 1.0,
		});
	}
}
