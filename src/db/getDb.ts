import { Dexie } from "dexie";
import type { Entities } from "./types";

let db: Dexie & Entities;

export const getDb = async () => {
	if (!db) {
		db = new Dexie("ProvelPrintDatabase") as Dexie & Entities;
		db.version(21).stores({
			formValues: "++id, name, value",
			appSettings: "++id, name, value",
			materialProfiles:
				"++id, name, nozzleTemp, cupTemp, shrinkFactor, outputFactor, secondsPerLayer",
			savedFiles: "++id, name, file, type",
		});
	}

	return db;
};

export const deleteDb = async () => {
	if (db) {
		db.close();
	}
	await Dexie.delete("ProvelPrintDatabase");
	db = null;
};
