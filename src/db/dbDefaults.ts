import { getDb } from "./getDb";
import type {
	DefaultKeyValueCollectionNames,
	DefaultKeyValueCollectionValues,
	MaterialProfile,
} from "./types";

const materialProfileDefaults: Omit<MaterialProfile, "id"> = {
	name: "cp1",
	nozzleTemp: 200,
	cupTemp: 130,
	shrinkFactor: 2.6,
	outputFactor: 1,
	secondsPerLayer: 8,
};

export async function makeMaterialProfileDefaults() {
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

export async function makeDefaultsKeyValues(
	collection: DefaultKeyValueCollectionNames,
	defaultValues: DefaultKeyValueCollectionValues,
	forceUpdate = false,
) {
	const db = await getDb();
	const dbCollection = await db[collection].toArray();

	const missingKeys = Object.keys(defaultValues).filter(
		(key) => !dbCollection.some((item) => item.name === key),
	);

	if (missingKeys.length || forceUpdate) {
		if (forceUpdate) {
			await db[collection].clear();
		}

		await Promise.all(
			missingKeys.map((name) => {
				if (collection === "savedFiles") {
					// Provide a default Blob for missing files
					return db[collection].add({
						name,
						file: new Blob([], { type: "application/octet-stream" }),
					});
				}
				return db[collection].add({
					name,
					value: defaultValues[name],
				});
			}),
		);
	}
}
