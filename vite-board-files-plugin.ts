import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

export type BoardFileGroupKind = "macros" | "screen-firmware";

export interface BoardFileGroupManifest {
	version: string;
	target: string;
	kind: BoardFileGroupKind;
	files: string[];
}

export interface BoardFilesManifest {
	generatedAt: string;
	groups: Record<string, BoardFileGroupManifest>;
}

interface BoardFilesPluginOptions {
	/** Directory holding the per-group subdirectories, relative to the repo root. */
	sourceDir: string;
	/** Where the manifest is served/emitted from, relative to the site root. */
	manifestPath: string;
	/** Target directory on the printer SD card, keyed by group name. */
	groups: Record<string, { target: string; kind: BoardFileGroupKind }>;
}

// Files that live in the repo for reference but must never reach the board.
// `null` is a stray 0-byte artifact of a shell redirect; `.bak`/`.part` are
// Duet Web Control upload leftovers; `.md` is documentation for maintainers.
function isIgnored(fileName: string): boolean {
	return (
		fileName === "null" ||
		fileName.startsWith(".") ||
		fileName.endsWith(".bak") ||
		fileName.endsWith(".part") ||
		fileName.endsWith(".md")
	);
}

function readGroup(
	groupDir: string,
	target: string,
	kind: BoardFileGroupKind,
): BoardFileGroupManifest {
	let entries: string[];

	try {
		entries = readdirSync(groupDir);
	} catch {
		// Group directory absent (e.g. the screen firmware slot before a
		// binary has been dropped in). Report it as empty rather than failing
		// the build.
		return { version: "0.0.0", target, kind, files: [] };
	}

	const files = entries
		.filter((name) => !isIgnored(name))
		.filter((name) => statSync(resolve(groupDir, name)).isFile())
		.sort();

	let version = "0.0.0";
	if (files.includes("package.json")) {
		try {
			const parsed = JSON.parse(
				readFileSync(resolve(groupDir, "package.json"), "utf-8"),
			);
			if (typeof parsed.version === "string") {
				version = parsed.version;
			}
		} catch {
			// Leave the default; the app treats 0.0.0 as "nothing to install".
		}
	}

	// A firmware group holding only its version marker is an empty scaffold —
	// report no files so the app hides the group instead of uploading a
	// package.json that advertises firmware which isn't there.
	if (kind === "screen-firmware" && !files.some((name) => name.endsWith(".bin"))) {
		return { version, target, kind, files: [] };
	}

	// package.json is the version marker deposited on the board. It must upload
	// last so a partially applied batch never advertises a version it doesn't
	// fully have, so it is sorted to the end of the list here.
	const ordered = [
		...files.filter((name) => name !== "package.json"),
		...files.filter((name) => name === "package.json"),
	];

	return { version, target, kind, files: ordered };
}

function buildManifest(
	root: string,
	options: BoardFilesPluginOptions,
): BoardFilesManifest {
	const groups: Record<string, BoardFileGroupManifest> = {};

	for (const [name, { target, kind }] of Object.entries(options.groups)) {
		groups[name] = readGroup(
			resolve(root, options.sourceDir, name),
			target,
			kind,
		);
	}

	return { generatedAt: new Date().toISOString(), groups };
}

export function boardFilesPlugin(options: BoardFilesPluginOptions): Plugin {
	const servedPath = options.manifestPath.startsWith("/")
		? options.manifestPath
		: `/${options.manifestPath}`;
	let root = process.cwd();

	return {
		name: "board-files-plugin",

		configResolved(config) {
			root = config.root;
		},

		// Dev: regenerate on every request so adding a file to public/board-files
		// only needs a page reload, not a server restart.
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!req.url || req.url.split("?")[0] !== servedPath) {
					return next();
				}

				const manifest = buildManifest(root, options);
				res.setHeader("Content-Type", "application/json");
				res.setHeader("Cache-Control", "no-store");
				res.end(JSON.stringify(manifest, null, 2));
			});
		},

		// Written after the bundle so it lands next to the public/ assets Vite
		// has already copied into dist. Matches the writeBundle approach in
		// vite-sw-plugin.ts.
		writeBundle(outputOptions) {
			const outputDir = outputOptions.dir;
			if (!outputDir) return;

			const manifest = buildManifest(root, options);
			const destination = resolve(outputDir, servedPath.replace(/^\//, ""));
			const total = Object.values(manifest.groups).reduce(
				(sum, group) => sum + group.files.length,
				0,
			);

			mkdirSync(dirname(destination), { recursive: true });
			writeFileSync(destination, JSON.stringify(manifest, null, 2));

			console.log(
				`✓ Generated board-files manifest with ${total} files across ${Object.keys(manifest.groups).length} groups`,
			);
		},
	};
}
