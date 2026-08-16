import { afterEach, describe, expect, test, vi } from "vitest";
import {
	type BoardFilesManifest,
	checkBoardFileVersions,
	installBoardFiles,
} from "./boardFiles";

vi.mock("@/db/formValuesDbActions", () => ({
	getIpAddress: vi.fn().mockResolvedValue("192.168.1.100"),
}));

const manifest: BoardFilesManifest = {
	generatedAt: "2026-08-10T00:00:00.000Z",
	groups: {
		system: {
			version: "1.1.0",
			target: "0:/sys",
			kind: "macros",
			files: ["config.g", "daemon.g", "package.json"],
		},
		provel: {
			version: "1.1.0",
			target: "0:/sys/provel",
			kind: "macros",
			files: ["prime.g", "package.json"],
		},
		screen: {
			version: "0.0.0",
			target: "0:/firmware",
			kind: "screen-firmware",
			files: [],
		},
	},
};

type Route = {
	status?: number;
	body?: unknown;
	/** Raw text, used for rr_download and bundled asset reads. */
	text?: string;
};

type Call = { url: string; init?: RequestInit };

/**
 * Stubs fetch for both the app's own static assets and the printer endpoints.
 * `resolve` returns the route for a URL, or undefined for a generic `err: 0`.
 */
function stubFetch(resolve: (url: string) => Route | undefined) {
	const calls: Call[] = [];

	globalThis.fetch = vi.fn().mockImplementation((url: string, init) => {
		calls.push({ url, init });

		const route = resolve(url) ?? { body: { err: 0 } };
		const status = route.status ?? 200;
		const text = route.text ?? JSON.stringify(route.body ?? {});

		return Promise.resolve({
			ok: status >= 200 && status < 300,
			status,
			json: () => Promise.resolve(route.body ?? JSON.parse(text)),
			text: () => Promise.resolve(text),
			blob: () => Promise.resolve(new Blob([text])),
		});
	});

	return calls;
}

/** Routes shared by every test: the manifest, rr_connect, and bundled files. */
function baseRoutes(url: string): Route | undefined {
	if (url.includes("/board-files/manifest.json")) {
		return { body: manifest };
	}

	if (url.startsWith("/board-files/")) {
		return { text: `; contents of ${url}\n` };
	}

	if (url.includes("rr_connect")) {
		return {
			body: { err: 0, sessionTimeout: 8000, boardType: "Duet3", sessionKey: 7 },
		};
	}

	return undefined;
}

function downloadedName(url: string): string {
	return decodeURIComponent(new URL(url).searchParams.get("name") ?? "");
}

describe("checkBoardFileVersions", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("reports a 404 package.json as never installed", async () => {
		stubFetch((url) => {
			if (url.includes("rr_download")) return { status: 404, text: "" };
			return baseRoutes(url);
		});

		const statuses = await checkBoardFileVersions();

		expect(statuses.map((status) => status.group)).toEqual([
			"system",
			"provel",
		]);
		for (const status of statuses) {
			expect(status.installedVersion).toBeNull();
			expect(status.needsUpdate).toBe(true);
		}
	});

	test("reports matching versions as up to date", async () => {
		stubFetch((url) => {
			if (url.includes("rr_download")) {
				return { text: '{"version":"1.1.0"}' };
			}
			return baseRoutes(url);
		});

		const statuses = await checkBoardFileVersions();

		expect(statuses.every((status) => status.needsUpdate)).toBe(false);
		expect(statuses[0].installedVersion).toBe("1.1.0");
	});

	test("reports an older installed version as needing an update", async () => {
		stubFetch((url) => {
			if (url.includes("rr_download")) {
				return { text: '{"version":"1.0.0"}' };
			}
			return baseRoutes(url);
		});

		const statuses = await checkBoardFileVersions();

		expect(statuses.every((status) => status.needsUpdate)).toBe(true);
		expect(statuses[0].installedVersion).toBe("1.0.0");
	});

	test("reads each group's package.json from its own board directory", async () => {
		const calls = stubFetch((url) => {
			if (url.includes("rr_download")) return { status: 404, text: "" };
			return baseRoutes(url);
		});

		await checkBoardFileVersions();

		const downloaded = calls
			.filter((call) => call.url.includes("rr_download"))
			.map((call) => downloadedName(call.url));

		expect(downloaded).toEqual([
			"0:/sys/package.json",
			"0:/sys/provel/package.json",
		]);
	});

	test("treats an unparseable package.json as not installed", async () => {
		stubFetch((url) => {
			if (url.includes("rr_download")) return { text: "not json at all" };
			return baseRoutes(url);
		});

		const statuses = await checkBoardFileVersions();

		expect(statuses[0].installedVersion).toBeNull();
		expect(statuses[0].needsUpdate).toBe(true);
	});

	test("skips groups with no bundled files", async () => {
		stubFetch((url) => {
			if (url.includes("rr_download")) return { status: 404, text: "" };
			return baseRoutes(url);
		});

		const statuses = await checkBoardFileVersions();

		expect(statuses.some((status) => status.group === "screen")).toBe(false);
	});
});

describe("installBoardFiles", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function uploadedNames(calls: Call[]): string[] {
		return calls
			.filter((call) => call.url.includes("rr_upload"))
			.map((call) => downloadedName(call.url));
	}

	/**
	 * Directory listings keyed by the directory being listed, so
	 * `directoryExists` sees a realistic board: `0:/` always contains `sys`,
	 * and `0:/sys` contains `provel` only when `hasProvel` is set.
	 */
	function fileListRoutes(hasProvel: boolean) {
		return (url: string): Route | undefined => {
			if (!url.includes("rr_filelist")) return baseRoutes(url);

			const dir = decodeURIComponent(
				new URL(url).searchParams.get("dir") ?? "",
			);

			const files =
				dir === "0:/"
					? [{ type: "d", name: "sys", size: 0 }]
					: [
							{ type: "f", name: "config.g", size: 10 },
							...(hasProvel ? [{ type: "d", name: "provel", size: 0 }] : []),
						];

			return { body: { dir, first: 0, files, next: 0, err: 0 } };
		};
	}

	function mkdirTargets(calls: Call[]): string[] {
		return calls
			.filter((call) => call.url.includes("rr_mkdir"))
			.map((call) =>
				decodeURIComponent(new URL(call.url).searchParams.get("dir") ?? ""),
			);
	}

	test("creates 0:/sys/provel only when it is absent", async () => {
		const calls = stubFetch(fileListRoutes(false));

		await installBoardFiles(["system", "provel"], () => {});

		expect(mkdirTargets(calls)).toEqual(["0:/sys/provel"]);
	});

	test("does not create 0:/sys/provel when it already exists", async () => {
		const calls = stubFetch(fileListRoutes(true));

		await installBoardFiles(["system", "provel"], () => {});

		expect(mkdirTargets(calls)).toEqual([]);
	});

	test("uploads package.json last within each group", async () => {
		const calls = stubFetch(baseRoutes);

		await installBoardFiles(["system", "provel"], () => {});

		expect(uploadedNames(calls)).toEqual([
			"0:/sys/config.g",
			"0:/sys/daemon.g",
			"0:/sys/package.json",
			"0:/sys/provel/prime.g",
			"0:/sys/provel/package.json",
		]);
	});

	test("continues past a failed file and reports it in the summary", async () => {
		stubFetch((url) => {
			if (url.includes("rr_upload") && url.includes("daemon.g")) {
				return { body: { err: 1 } };
			}
			return baseRoutes(url);
		});

		const progress: string[] = [];
		const summary = await installBoardFiles(["system"], (result) => {
			progress.push(`${result.file}:${result.ok}`);
		});

		// All three files were still attempted.
		expect(progress).toEqual([
			"config.g:true",
			"daemon.g:false",
			"package.json:true",
		]);
		expect(summary.uploaded).toBe(2);
		expect(summary.failed).toBe(1);
		expect(summary.results[1].error).toContain("err 1");
	});

	test("flags a restart as required only when 0:/sys fully succeeds", async () => {
		stubFetch(baseRoutes);
		const clean = await installBoardFiles(["system"], () => {});
		expect(clean.restartRequired).toBe(true);

		stubFetch((url) => {
			if (url.includes("rr_upload") && url.includes("config.g")) {
				return { body: { err: 1 } };
			}
			return baseRoutes(url);
		});
		const broken = await installBoardFiles(["system"], () => {});
		expect(broken.restartRequired).toBe(false);
	});

	test("skips the screen group when no firmware binary is bundled", async () => {
		const calls = stubFetch(baseRoutes);

		await installBoardFiles(["screen"], () => {});

		expect(calls.some((call) => call.url.includes("rr_upload"))).toBe(false);
		expect(calls.some((call) => call.url.includes("M997"))).toBe(false);
	});
});
