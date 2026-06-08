import { Dexie } from "dexie";
import type { Entities } from "./types";

export const db = new Dexie("ProvelPrintDatabase") as Dexie & Entities;

db.version(22).stores({
	formValues: "++id, name, value",
	appSettings: "++id, name, value",
	materialProfiles:
		"++id, name, nozzleTemp, cupTemp, shrinkFactor, outputFactor, secondsPerLayer",
	savedFiles: "++id, name, file, type",
});

// v23: drop the misleading secondsPerLayer index — that field is not part of
// MaterialProfile. Schema is otherwise unchanged.
db.version(23).stores({
	materialProfiles:
		"++id, name, nozzleTemp, cupTemp, shrinkFactor, outputFactor",
});

export const deleteDb = async () => {
	db.close();
	await Dexie.delete("ProvelPrintDatabase");
};
