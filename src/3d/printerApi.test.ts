import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	connectToPrinter,
	directoryExists,
	getBoardInfo,
	listFiles,
	sendGCodeFile,
	uploadFile,
	withPrinterSession,
} from "./printerApi";

vi.mock("@/db/formValuesDbActions", () => ({
	getIpAddress: vi.fn().mockResolvedValue("192.168.1.100"),
}));

function mockFetchResponse(body: unknown, ok = true) {
	return vi.fn().mockResolvedValue({
		ok,
		json: () => Promise.resolve(body),
	});
}

describe("connectToPrinter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	test("returns data on successful connection", async () => {
		const responseData = {
			err: 0,
			sessionTimeout: 8000,
			boardType: "Duet3",
			sessionKey: 123,
		};
		globalThis.fetch = mockFetchResponse(responseData);

		const result = await connectToPrinter("192.168.1.100");

		expect(result).toEqual(responseData);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://192.168.1.100/rr_connect?password=",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	test("throws on incorrect password (err: 1)", async () => {
		globalThis.fetch = mockFetchResponse({ err: 1 });

		await expect(connectToPrinter("192.168.1.100")).rejects.toThrow(
			"Password incorrect",
		);
	});

	test("throws on too many sessions (err: 2)", async () => {
		globalThis.fetch = mockFetchResponse({ err: 2 });

		await expect(connectToPrinter("192.168.1.100")).rejects.toThrow(
			"Too many user sessions",
		);
	});

	test("throws on non-ok response", async () => {
		globalThis.fetch = mockFetchResponse({}, false);

		await expect(connectToPrinter("192.168.1.100")).rejects.toThrow(
			"Network response was not ok",
		);
	});

	test("throws on network failure", async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

		await expect(connectToPrinter("192.168.1.100")).rejects.toThrow(
			"fetch operation",
		);
	});
});

describe("getBoardInfo", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("connects first, then returns the boards[0] result", async () => {
		const boardInfo = {
			firmwareVersion: "3.5.4",
			name: "Duet 3 Mainboard 6XD",
			shortName: "MB6XD",
		};
		const calls: string[] = [];

		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			calls.push(url);
			return Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve(
						url.includes("rr_connect")
							? { err: 0, sessionTimeout: 8000, boardType: "Duet3" }
							: { key: "boards[0]", flags: 0, result: boardInfo },
					),
			});
		});

		const result = await getBoardInfo();

		expect(result).toEqual(boardInfo);
		expect(calls[0]).toContain("rr_connect");
		expect(calls[1]).toBe("http://192.168.1.100/rr_model?key=boards[0]");
	});

	test("throws on non-ok response", async () => {
		globalThis.fetch = mockFetchResponse({}, false);

		await expect(getBoardInfo()).rejects.toThrow("Could not fetch board info");
	});
});

/**
 * Builds a fetch stub that routes by endpoint. `handlers` is keyed by the
 * endpoint substring, e.g. "rr_filelist".
 */
function routedFetch(
	handlers: Record<string, (url: string, init?: RequestInit) => unknown>,
) {
	const calls: { url: string; init?: RequestInit }[] = [];

	const fetchStub = vi.fn().mockImplementation((url: string, init) => {
		calls.push({ url, init });

		for (const [fragment, handler] of Object.entries(handlers)) {
			if (!url.includes(fragment)) continue;
			const body = handler(url, init);
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve(body),
				text: () => Promise.resolve(String(body)),
			});
		}

		return Promise.resolve({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ err: 0 }),
			text: () => Promise.resolve(""),
		});
	});

	globalThis.fetch = fetchStub;
	return calls;
}

const connectWithKey = () => ({
	err: 0,
	sessionTimeout: 8000,
	boardType: "Duet3",
	sessionKey: 42,
});

describe("withPrinterSession", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("connects once, attaches X-Session-Key, and disconnects", async () => {
		const calls = routedFetch({
			rr_connect: connectWithKey,
			rr_mkdir: () => ({ err: 0 }),
		});

		await withPrinterSession(async (session) => {
			await session.request("/rr_mkdir?dir=0:/sys/provel");
		});

		const connects = calls.filter((call) => call.url.includes("rr_connect"));
		expect(connects).toHaveLength(1);
		expect(connects[0].url).toContain("sessionKey=yes");

		const mkdir = calls.find((call) => call.url.includes("rr_mkdir"));
		expect(new Headers(mkdir?.init?.headers).get("X-Session-Key")).toBe("42");

		expect(calls.some((call) => call.url.includes("rr_disconnect"))).toBe(true);
	});

	test("disconnects even when the callback throws", async () => {
		const calls = routedFetch({ rr_connect: connectWithKey });

		await expect(
			withPrinterSession(async () => {
				throw new Error("boom");
			}),
		).rejects.toThrow("boom");

		expect(calls.some((call) => call.url.includes("rr_disconnect"))).toBe(true);
	});

	test("omits the session key header on pre-3.5 firmware", async () => {
		const calls = routedFetch({
			rr_connect: () => ({ err: 0, sessionTimeout: 8000, boardType: "Duet2" }),
		});

		await withPrinterSession(async (session) => {
			await session.request("/rr_filelist?dir=0:/sys");
		});

		const filelist = calls.find((call) => call.url.includes("rr_filelist"));
		expect(new Headers(filelist?.init?.headers).has("X-Session-Key")).toBe(
			false,
		);
	});
});

describe("listFiles", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("follows pagination until next is 0", async () => {
		routedFetch({
			rr_connect: connectWithKey,
			rr_filelist: (url) =>
				url.includes("first=2")
					? {
							dir: "0:/sys",
							first: 2,
							files: [{ type: "f", name: "c.g", size: 3 }],
							next: 0,
							err: 0,
						}
					: {
							dir: "0:/sys",
							first: 0,
							files: [
								{ type: "f", name: "a.g", size: 1 },
								{ type: "f", name: "b.g", size: 2 },
							],
							next: 2,
							err: 0,
						},
		});

		const entries = await withPrinterSession((session) =>
			listFiles(session, "0:/sys"),
		);

		expect(entries.map((entry) => entry.name)).toEqual(["a.g", "b.g", "c.g"]);
	});

	test("returns an empty list when the directory does not exist", async () => {
		routedFetch({
			rr_connect: connectWithKey,
			rr_filelist: () => ({
				dir: "0:/nope",
				first: 0,
				files: [],
				next: 0,
				err: 1,
			}),
		});

		const entries = await withPrinterSession((session) =>
			listFiles(session, "0:/nope"),
		);

		expect(entries).toEqual([]);
	});
});

describe("directoryExists", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("finds a directory entry in the parent listing", async () => {
		const calls = routedFetch({
			rr_connect: connectWithKey,
			rr_filelist: () => ({
				dir: "0:/sys",
				first: 0,
				files: [
					{ type: "f", name: "config.g", size: 10 },
					{ type: "d", name: "provel", size: 0 },
				],
				next: 0,
				err: 0,
			}),
		});

		const exists = await withPrinterSession((session) =>
			directoryExists(session, "0:/sys/provel"),
		);

		expect(exists).toBe(true);
		// The parent, not the directory itself, is what gets listed.
		expect(
			calls.some((call) => call.url.includes(encodeURIComponent("0:/sys"))),
		).toBe(true);
	});

	test("returns false when only a file of that name exists", async () => {
		routedFetch({
			rr_connect: connectWithKey,
			rr_filelist: () => ({
				dir: "0:/sys",
				first: 0,
				files: [{ type: "f", name: "provel", size: 10 }],
				next: 0,
				err: 0,
			}),
		});

		const exists = await withPrinterSession((session) =>
			directoryExists(session, "0:/sys/provel"),
		);

		expect(exists).toBe(false);
	});
});

describe("uploadFile", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("POSTs to the encoded board path with a CRC32", async () => {
		const calls = routedFetch({
			rr_connect: connectWithKey,
			rr_upload: () => ({ err: 0 }),
		});

		await withPrinterSession((session) =>
			uploadFile(session, "0:/sys/provel/prime.g", new Blob(["G1 X1\n"])),
		);

		const upload = calls.find((call) => call.url.includes("rr_upload"));
		expect(upload?.init?.method).toBe("POST");
		expect(upload?.url).toContain(
			`name=${encodeURIComponent("0:/sys/provel/prime.g")}`,
		);
		expect(upload?.url).toMatch(/crc32=[0-9A-F]+/);
	});

	test("throws when the board reports an error code", async () => {
		routedFetch({
			rr_connect: connectWithKey,
			rr_upload: () => ({ err: 1 }),
		});

		await expect(
			withPrinterSession((session) =>
				uploadFile(session, "0:/sys/config.g", new Blob(["x"])),
			),
		).rejects.toThrow("board returned err 1");
	});
});

describe("sendGCodeFile", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("uploads file with correct CRC32 and encoded filename", async () => {
		const calls: string[] = [];

		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			calls.push(url);

			if (url.includes("rr_connect")) {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							err: 0,
							sessionTimeout: 8000,
							boardType: "Duet3",
							sessionKey: 1,
						}),
				});
			}

			if (url.includes("rr_upload")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ err: 0 }),
				});
			}

			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});

		const blob = new Blob(["G28\nG1 X10 Y10\n"], {
			type: "application/octet-stream",
		});
		await sendGCodeFile(blob, "test file.gcode");

		expect(calls.some((url) => url.includes("rr_connect"))).toBe(true);

		const uploadCall = calls.find((url) => url.includes("rr_upload"));
		expect(uploadCall).toBeDefined();
		expect(uploadCall).toContain("test%20file.gcode");
		expect(uploadCall).toContain("crc32=");
	});

	test("throws on upload failure", async () => {
		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			if (url.includes("rr_connect")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ err: 0 }),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ err: 1 }),
			});
		});

		const blob = new Blob(["G28\n"]);
		await expect(sendGCodeFile(blob, "test.gcode")).rejects.toThrow(
			"Upload failed",
		);
	});
});
