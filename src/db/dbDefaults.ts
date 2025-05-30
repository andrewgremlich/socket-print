import { getDb } from "./getDb";
import type {
	DefaultKeyValueCollectionNames,
	DefaultKeyValueCollectionValues,
	Entities,
	MaterialProfile,
} from "./types";

const materialProfileDefaults: Omit<MaterialProfile, "id"> = {
	name: "cp1",
	nozzleTemp: 200,
	cupTemp: 130,
	shrinkFactor: 2.6,
	outputFactor: 1.0,
	feedrate: 2250,
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
) {
	const db = await getDb();
	const dbCollection = await db[collection].toArray();

	const missingKeys = Object.keys(defaultValues).filter(
		(key) => !dbCollection.some((item) => item.name === key),
	);

	if (missingKeys.length) {
		await Promise.all(
			missingKeys.map((name) =>
				db[collection].add({
					name,
					value: defaultValues[name],
				}),
			),
		);
	}
}
