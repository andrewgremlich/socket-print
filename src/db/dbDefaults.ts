import { db } from "./db";
import {
	type DefaultKeyValueCollectionNames,
	type DefaultKeyValueCollectionValues,
	type MaterialProfile,
	PrintObjectType,
} from "./types";

const materialProfileDefaults: Omit<MaterialProfile, "id"> = {
	name: "cp1",
	nozzleTemp: 200,
	cupTemp: 190,
	shrinkFactor: 2.6,
	outputFactor: 1,
	gramsPerRevolution: 0.2,
	density: 0.0009,
};

export async function makeMaterialProfileDefaults() {
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
	const dbCollection = await db[collection].toArray();

	const missingKeys = Object.keys(defaultValues).filter(
		(key) => !dbCollection.some((item) => item.name === key),
	);

	if (missingKeys.length) {
		await Promise.all(
			missingKeys.map((name) => {
				if (collection === "savedFiles") {
					return db[collection].add({
						name,
						type: PrintObjectType.Socket,
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
