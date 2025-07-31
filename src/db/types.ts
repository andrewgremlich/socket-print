import type { EntityTable } from "dexie";

type KeyValueSetting = {
	id: number;
	name: string;
	value: string | number | boolean;
};

export type MaterialProfile = {
	id: number;
	name: string;
	nozzleTemp: number;
	cupTemp: number;
	shrinkFactor: number;
	outputFactor: number;
	secondsPerLayer: number;
};

export type SavedFile = { id: number; name: string; file: Blob };

export type FormValues = {
	ipAddress: string;
	lockPosition: "left" | "right";
	cupSize: string;
	nozzleSize: number;
	layerHeight: number;
	activeMaterialProfile: string;
};

export type ProvelPrintSettings = {
	lockDepth: number;
	circularSegments: number;
};

export type Entities = {
	formValues: EntityTable<KeyValueSetting, "id">;
	appSettings: EntityTable<KeyValueSetting, "id">;
	materialProfiles: EntityTable<MaterialProfile, "id">;
	savedFiles: EntityTable<SavedFile, "id">;
};

// Create an enum from the keys
export enum EntityEnum {
	formValues = "formValues",
	appSettings = "appSettings",
	materialProfiles = "materialProfiles",
	savedFiles = "savedFiles",
}

export type DefaultKeyValueCollectionNames = Exclude<
	keyof Entities,
	"materialProfiles"
>;

export type DefaultKeyValueCollectionValues = Record<
	string,
	string | number | boolean
>;
