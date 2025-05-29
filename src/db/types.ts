import type { EntityTable } from "dexie";

export type AppSettings = {
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
	feedrate: number;
};

export type Entities = {
	appSettings: EntityTable<AppSettings, "id">;
	materialProfiles: EntityTable<MaterialProfile, "id">;
};

export interface ProvelPrintSettings {
	ipAddress: string;
	lockPosition: "left" | "right";
	cupSize: string;
	nozzleSize: number;
	lockDepth: number;
	layerHeight: number;
	activeMaterialProfile: string;
	circularSegments: number;
}
