import { Dexie } from "dexie";
import type { Entities } from "./types";

let db: Dexie & Entities;

export const getDb = async () => {
	if (!db) {
		db = new Dexie("ProvelPrintDatabase") as Dexie & Entities;
		db.version(1).stores({
			appSettings: "++id, name, value",
			materialProfiles:
				"++id, name, nozzleTemp, cupTemp, shrinkFactor, outputFactor",
		});
	}

	return db;
};
