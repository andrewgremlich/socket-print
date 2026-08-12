/** In-memory stand-in for the board's SD card. */

import crc32lib from "crc-32";

import { DEBUG } from "./config.ts";

export type Bytes = Uint8Array<ArrayBuffer>;

type VirtualFile = { data: Bytes; modified: Date };

export type ListEntry = {
	type: "d" | "f";
	name: string;
	size: number;
	date: string;
};

/** Files keyed by normalized absolute path, e.g. "0:/sys/config.g". */
const files = new Map<string, VirtualFile>();
/** Explicitly created directories, so an empty dir still lists. */
const directories = new Set<string>(["0:/"]);

/** Matches the `crc-32` npm package the app uses for upload checksums. */
export function crc32(bytes: Bytes): number {
	return crc32lib.buf(bytes, 0) >>> 0;
}

/**
 * RRF accepts "0:/sys/x.g", "/sys/x.g" and "sys/x.g" interchangeably.
 * Everything is stored under the "0:/" form.
 */
export function normalizePath(input: string): string {
	let path = input.trim().replace(/\\/g, "/");
	path = path.replace(/^\d+:/, "");
	if (!path.startsWith("/")) path = `/${path}`;
	path = path.replace(/\/{2,}/g, "/");
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
	return `0:${path}`;
}

function parentOf(path: string): string {
	const normalized = normalizePath(path);
	const index = normalized.lastIndexOf("/");
	return index <= 2 ? "0:/" : normalized.slice(0, index);
}

export function ensureDirectory(path: string): void {
	let current = normalizePath(path);
	while (current !== "0:/" && !directories.has(current)) {
		directories.add(current);
		current = parentOf(current);
	}
}

export function directoryExists(path: string): boolean {
	const normalized = normalizePath(path);
	if (directories.has(normalized)) return true;
	// A directory also exists implicitly if any file lives beneath it.
	const prefix = `${normalized}/`;
	for (const key of files.keys()) {
		if (key.startsWith(prefix)) return true;
	}
	return false;
}

export function readFile(path: string): VirtualFile | undefined {
	return files.get(normalizePath(path));
}

export function fileExists(path: string): boolean {
	return files.has(normalizePath(path));
}

export function writeFile(path: string, data: Bytes): void {
	const normalized = normalizePath(path);
	ensureDirectory(parentOf(normalized));
	files.set(normalized, { data, modified: new Date() });
	if (DEBUG) dumpTree();
}

export function deleteFile(path: string): boolean {
	return files.delete(normalizePath(path));
}

/** Removes a directory and everything beneath it. */
export function deleteTree(path: string): void {
	const normalized = normalizePath(path);
	for (const key of [...files.keys()]) {
		if (key.startsWith(`${normalized}/`)) files.delete(key);
	}
	for (const dir of [...directories]) {
		if (dir === normalized || dir.startsWith(`${normalized}/`)) {
			directories.delete(dir);
		}
	}
}

export function listDirectory(path: string): ListEntry[] {
	const normalized = normalizePath(path);
	const prefix = normalized === "0:/" ? "0:/" : `${normalized}/`;
	const entries = new Map<string, ListEntry>();

	for (const [key, file] of files) {
		if (!key.startsWith(prefix)) continue;
		const rest = key.slice(prefix.length);
		if (rest.includes("/")) continue;
		entries.set(rest, {
			type: "f",
			name: rest,
			size: file.data.length,
			date: formatDate(file.modified),
		});
	}

	for (const dir of directories) {
		if (dir === normalized || !dir.startsWith(prefix)) continue;
		const rest = dir.slice(prefix.length);
		if (rest.includes("/")) continue;
		entries.set(rest, {
			type: "d",
			name: rest,
			size: 0,
			date: formatDate(new Date()),
		});
	}

	return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** RRF emits local time without a timezone suffix. */
export function formatDate(date: Date): string {
	return date.toISOString().replace(/\.\d+Z$/, "");
}

function dumpTree(): void {
	const paths = [...files.keys()].sort();
	console.log(`[VFS] ${paths.length} files`);
	for (const path of paths) {
		console.log(`[VFS]   ${path} (${files.get(path)?.data.length} B)`);
	}
}

/** Preseeds 0:/sys and 0:/sys/provel at version 0.9.0 (MOCK_SEED=1). */
export function seedFilesystem(): void {
	const encoder = new TextEncoder();
	ensureDirectory("0:/sys/provel");
	ensureDirectory("0:/firmware");
	writeFile("0:/sys/config.g", encoder.encode("; seeded config\n"));
	writeFile("0:/sys/package.json", encoder.encode('{"version":"0.9.0"}\n'));
	writeFile("0:/sys/provel/prime.g", encoder.encode("; seeded prime\n"));
	writeFile(
		"0:/sys/provel/package.json",
		encoder.encode('{"version":"0.9.0"}\n'),
	);
	console.log("[SEED] Preseeded 0:/sys and 0:/sys/provel at version 0.9.0");
}
