import { db } from "./db";
import type { SavedFile } from "./types";

export async function getAllFiles(): Promise<SavedFile[]> {
	return await db.savedFiles.toArray();
}

export async function getFileByName(
	name: string,
): Promise<SavedFile | undefined> {
	return await db.savedFiles.where("name").equals(name).first();
}

export async function deleteFileByName(name: string): Promise<void> {
	const file = await getFileByName(name);

	if (file) {
		await db.savedFiles.delete(file.id);
	}
}

export async function deleteAllFiles(): Promise<void> {
	await db.savedFiles.clear();
}

export async function setFileByName(
	name: string,
	file: Omit<SavedFile, "id">,
): Promise<void> {
	await deleteAllFiles();

	const existingFile = await getFileByName(name);

	if (existingFile) {
		await db.savedFiles.update(existingFile.id, file);
	} else {
		await db.savedFiles.add({ ...file, name });
	}
}
