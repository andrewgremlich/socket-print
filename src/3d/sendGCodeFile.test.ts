import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
	connectToPrinter,
	getModelInformation,
	sendGCodeFile,
} from "./sendGCodeFile";

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

describe("getModelInformation", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("returns model data on success", async () => {
		const modelData = { key: "boards[0]", flags: 0, result: 1 };
		globalThis.fetch = mockFetchResponse(modelData);

		const result = await getModelInformation("192.168.1.100");

		expect(result).toEqual(modelData);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://192.168.1.100/rr_model?key=boards[0]",
		);
	});

	test("throws on non-ok response", async () => {
		globalThis.fetch = mockFetchResponse({}, false);

		await expect(getModelInformation("192.168.1.100")).rejects.toThrow(
			"Network response was not ok",
		);
	});

	test("throws on network failure", async () => {
		globalThis.fetch = vi
			.fn()
			.mockRejectedValue(new Error("Connection refused"));

		await expect(getModelInformation("192.168.1.100")).rejects.toThrow(
			"fetch operation",
		);
	});
});

describe("sendGCodeFile", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// TODO: FileReader is not defined in the Node environment, so we need to mock it
	test.skip("uploads file with correct CRC32 and encoded filename", async () => {
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

	test("does not throw on upload failure (logs error)", async () => {
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
		// sendGCodeFile catches errors internally, so it should not throw
		await expect(sendGCodeFile(blob, "test.gcode")).resolves.toBeUndefined();
	});
});
