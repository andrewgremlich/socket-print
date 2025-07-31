import { getDb } from "./getDb";
import type { SavedFile } from "./types";

export async function getAllFiles(): Promise<SavedFile[]> {
	const db = await getDb();
	return await db.savedFiles.toArray();
}

export async function getFileByName(
	name: string,
): Promise<SavedFile | undefined> {
	const db = await getDb();
	return await db.savedFiles.where("name").equals(name).first();
}

export async function setFileByName(
	name: string,
	file: Omit<SavedFile, "id">,
): Promise<void> {
	const db = await getDb();
	const existingFile = await getFileByName(name);

	if (existingFile) {
		await db.savedFiles.update(existingFile.id, file);
	} else {
		await db.savedFiles.add({ ...file, name });
	}
}

export async function deleteFileByName(name: string): Promise<void> {
	const db = await getDb();
	const file = await getFileByName(name);

	if (file) {
		await db.savedFiles.delete(file.id);
	}
}

export async function deleteAllFiles(): Promise<void> {
	const db = await getDb();
	await db.savedFiles.clear();
}
