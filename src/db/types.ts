import type { EntityTable } from "dexie";

export type MaterialProfile = {
	id: number;
	name: string;
	nozzleTemp: number;
	cupTemp: number;
	shrinkFactor: number;
	outputFactor: number;
	gramsPerRevolution: number;
	density: number;
};

export enum PrintObjectType {
	TestCylinder = "TestCylinder",
	Socket = "Socket",
}

export type SavedFile = {
	id: number;
	name: string;
	type: PrintObjectType;
	file: Blob;
};

export type CupSize = {
	innerDiameter: number;
	outerDiameter: number;
	height: number;
	name: string;
};

export type FormValues = {
	ipAddress: string;
	lockPosition: "left" | "right";
	cupSize: CupSize;
	nozzleSize: number;
	layerHeight: number;
	activeMaterialProfile: string;
};

export type ProvelPrintSettings = {
	lockDepth: number;
	circularSegments: number;
	translateX: number;
	translateY: number;
	translateZ: number;
	rotateCoronal: number;
	rotateSagittal: number;
	rotateTransverse: number;
	startingCupLayerHeight: number;
	lineWidthAdjustment: number;
	testCylinderHeight: number;
	testCylinderDiameter: number;
	secondsPerLayer: number;
	ePerRevolution: number;
};

type KeyValueSetting = {
	id: number;
	name: string;
	value: string | number | boolean | CupSize;
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
	string | number | boolean | CupSize
>;
