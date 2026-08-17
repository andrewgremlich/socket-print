/** Endpoints that read or mutate the virtual SD card. */

import { corsHeaders, json, paginate, type RouteHandler, text } from "../http.ts";
import {
	crc32,
	deleteFile,
	deleteTree,
	directoryExists,
	ensureDirectory,
	formatDate,
	listDirectory,
	normalizePath,
	readFile,
	writeFile,
} from "../vfs.ts";

export const fileRoutes: Record<string, RouteHandler> = {
	"/rr_upload": async (req, url) => {
		if (req.method !== "POST") return json({ err: 0 });

		const name = url.searchParams.get("name");
		if (!name) {
			console.log("[UPLOAD] Rejected — missing name");
			return json({ err: 1 }, 400);
		}

		const body = new Uint8Array(await req.arrayBuffer());
		const expectedCrc = url.searchParams.get("crc32");

		if (expectedCrc) {
			const actual = crc32(body).toString(16).toUpperCase();
			if (actual !== expectedCrc.toUpperCase()) {
				console.log(
					`[UPLOAD] CRC mismatch for ${name}: expected ${expectedCrc}, computed ${actual}`,
				);
				return json({ err: 1 });
			}
		}

		writeFile(name, body);
		console.log(
			`[UPLOAD] ${normalizePath(name)} — ${body.length} B${expectedCrc ? " (crc ok)" : ""}`,
		);
		return json({ err: 0 });
	},

	"/rr_download": (_req, url) => {
		const name = url.searchParams.get("name");
		if (!name) return text("Bad Request", 400);

		const file = readFile(name);
		if (!file) {
			console.log(`[DOWNLOAD] 404 ${normalizePath(name)}`);
			return text("Not Found", 404);
		}

		console.log(`[DOWNLOAD] ${normalizePath(name)} — ${file.data.length} B`);
		return new Response(new Blob([file.data]), {
			status: 200,
			headers: {
				"Content-Type": "application/octet-stream",
				...corsHeaders,
			},
		});
	},

	"/rr_delete": (_req, url) => {
		const name = url.searchParams.get("name");
		if (!name) return json({ err: 1 });

		const normalized = normalizePath(name);
		const recursive = url.searchParams.get("recursive") === "yes";

		if (deleteFile(normalized)) {
			console.log(`[DELETE] ${normalized}`);
			return json({ err: 0 });
		}

		if (directoryExists(normalized)) {
			const children = listDirectory(normalized);
			if (children.length > 0 && !recursive) {
				console.log(`[DELETE] ${normalized} not empty`);
				return json({ err: 1 });
			}
			deleteTree(normalized);
			console.log(`[DELETE] ${normalized} (directory)`);
			return json({ err: 0 });
		}

		return json({ err: 1 });
	},

	"/rr_filelist": (_req, url) => {
		const dir = url.searchParams.get("dir");
		if (!dir) return json({ err: 1 });

		const normalized = normalizePath(dir);
		if (!directoryExists(normalized)) {
			console.log(`[FILELIST] ${normalized} does not exist`);
			return json({ dir: normalized, first: 0, files: [], next: 0, err: 1 });
		}

		const { slice, first, next } = paginate(listDirectory(normalized), url);
		console.log(`[FILELIST] ${normalized} — ${slice.length} entries`);
		return json({ dir: normalized, first, files: slice, next, err: 0 });
	},

	"/rr_files": (_req, url) => {
		const dir = url.searchParams.get("dir");
		if (!dir) return json({ err: 1 });

		const normalized = normalizePath(dir);
		if (!directoryExists(normalized)) {
			return json({ dir: normalized, first: 0, files: [], next: 0, err: 1 });
		}

		const flagDirs = url.searchParams.get("flagDirs") === "1";
		const entries = listDirectory(normalized).map((entry) =>
			flagDirs && entry.type === "d" ? `*${entry.name}` : entry.name,
		);
		const { slice, first, next } = paginate(entries, url);
		return json({ dir: normalized, first, files: slice, next, err: 0 });
	},

	"/rr_move": (_req, url) => {
		const from = url.searchParams.get("old");
		const to = url.searchParams.get("new");
		if (!from || !to) return json({ err: 1 });

		const source = normalizePath(from);
		const destination = normalizePath(to);
		const file = readFile(source);
		if (!file) return json({ err: 1 });

		if (
			readFile(destination) &&
			url.searchParams.get("deleteexisting") !== "yes"
		) {
			return json({ err: 1 });
		}

		deleteFile(source);
		writeFile(destination, file.data);
		console.log(`[MOVE] ${source} -> ${destination}`);
		return json({ err: 0 });
	},

	"/rr_mkdir": (_req, url) => {
		const dir = url.searchParams.get("dir");
		if (!dir) return json({ err: 1 });

		const normalized = normalizePath(dir);
		if (directoryExists(normalized)) {
			console.log(`[MKDIR] ${normalized} already exists`);
			return json({ err: 1 });
		}

		ensureDirectory(normalized);
		console.log(`[MKDIR] ${normalized}`);
		return json({ err: 0 });
	},

	"/rr_fileinfo": (_req, url) => {
		const name = url.searchParams.get("name");
		// No name means "info about the job currently being printed".
		if (!name) return json({ err: 1 });

		const normalized = normalizePath(name);
		const file = readFile(normalized);
		if (!file) return json({ err: 1 });

		return json({
			err: 0,
			size: file.data.length,
			lastModified: formatDate(file.modified),
			fileName: normalized,
			generatedBy: "Provel Print",
		});
	},

	// No thumbnail support in the mock.
	"/rr_thumbnail": () => json({ err: 1 }),
};
