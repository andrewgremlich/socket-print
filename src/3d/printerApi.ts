import crc32 from "crc-32";
import { getIpAddress } from "@/db/formValuesDbActions";

type ConnectResponse = {
	err: 0 | 1 | 2;
	sessionTimeout: number;
	boardType: string;
	sessionKey?: number;
};

type ErrorResponse = { err: number };

type BoardInfo = {
	firmwareVersion: string;
	name: string;
	shortName: string; // "MB6XD"
};

type ModelInformation = {
	key: string;
	flags: number;
	result: BoardInfo;
};

export type FileListEntry = {
	type: "d" | "f";
	name: string;
	size: number;
	date?: string;
};

type FileListResponse = {
	dir: string;
	first: number;
	files: FileListEntry[];
	next: number;
	err: 0 | 1 | 2;
};

// DOCS: https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
export async function connectToPrinter(
	ipAddress: string,
	options: { requestSessionKey?: boolean } = {},
) {
	const password = "";
	const sessionKeyParam = options.requestSessionKey ? "&sessionKey=yes" : "";

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

		const response = await fetch(
			`http://${ipAddress}/rr_connect?password=${password}${sessionKeyParam}`,
			{ signal: controller.signal },
		);

		clearTimeout(timeout);

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data: ConnectResponse = await response.json();

		if (data.err === 1) {
			throw new Error("Password incorrect");
		}

		if (data.err === 2) {
			throw new Error("Too many user sessions");
		}

		return data;
	} catch (error) {
		throw new Error(`There was a problem with the fetch operation:${error}`);
	}
}

export async function getBoardInfo(): Promise<BoardInfo> {
	try {
		const ipAddress = await getIpAddress();
		await connectToPrinter(ipAddress);
		const response = await fetch(`http://${ipAddress}/rr_model?key=boards[0]`);

		if (!response.ok) {
			throw new Error("Could not fetch board info");
		}

		const data: ModelInformation = await response.json();
		return data.result;
	} catch (error) {
		throw new Error(`Could not fetch board info:${error}`);
	}
}

export function isNewerVersion(current: string, latest: string): boolean {
	const normalize = (v: string) => v.replace(/^v/, "").trim();
	const toParts = (v: string) => normalize(v).split(".").map(Number);
	const [cMaj, cMin, cPat] = toParts(current);
	const [lMaj, lMin, lPat] = toParts(latest);
	if (lMaj !== cMaj) return lMaj > cMaj;
	if (lMin !== cMin) return lMin > cMin;
	return lPat > cPat;
}

export async function pollUntilOnline(
	ipAddress: string,
	options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<void> {
	const { intervalMs = 3000, timeoutMs = 120_000 } = options;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		await new Promise((r) => setTimeout(r, intervalMs));
		try {
			await connectToPrinter(ipAddress);
			return;
		} catch {
			// still rebooting, keep polling
		}
	}

	throw new Error("Printer did not come back online within the timeout period");
}

// ---------------------------------------------------------------------------
// Sessions
//
// RepRapFirmware 3.5-b4 and later hand out a session key from rr_connect and
// expect it back in an X-Session-Key header on every subsequent request.
// Older firmware ignores the header. Opening one session for a whole batch of
// requests also avoids tripping the board's session cap (err: 2), which a
// per-file rr_connect loop would do.
// ---------------------------------------------------------------------------

export type PrinterSession = {
	ipAddress: string;
	sessionKey: number | null;
	/** Issues a request against the board with session headers attached. */
	request(path: string, init?: RequestInit): Promise<Response>;
};

function logRequest(
	method: string,
	url: string,
	status: number | string,
	elapsedMs: number,
	extra = "",
) {
	console.log(
		`[BOARD-FILES] ${method} ${url} -> ${status} in ${elapsedMs.toFixed(0)}ms${extra}`,
	);
}

/**
 * Opens one printer session, runs `fn` against it, and always disconnects.
 * `path` passed to `session.request` is the endpoint plus query string,
 * e.g. `/rr_filelist?dir=0:/sys`.
 */
export async function withPrinterSession<T>(
	fn: (session: PrinterSession) => Promise<T>,
): Promise<T> {
	const ipAddress = await getIpAddress();

	if (!ipAddress) {
		throw new Error("No printer IP address configured");
	}

	console.log(`[BOARD-FILES] Opening session with ${ipAddress}`);
	const connection = await connectToPrinter(ipAddress, {
		requestSessionKey: true,
	});
	const sessionKey = connection.sessionKey ?? null;
	console.log(
		`[BOARD-FILES] Session open (key ${sessionKey ?? "none — pre-3.5 firmware"}, timeout ${connection.sessionTimeout}ms)`,
	);

	const session: PrinterSession = {
		ipAddress,
		sessionKey,
		async request(path, init = {}) {
			const url = `http://${ipAddress}${path}`;
			const headers = new Headers(init.headers);
			if (sessionKey !== null) {
				headers.set("X-Session-Key", String(sessionKey));
			}

			const startedAt = performance.now();
			try {
				const response = await fetch(url, { ...init, headers });
				logRequest(
					init.method ?? "GET",
					url,
					response.status,
					performance.now() - startedAt,
				);
				return response;
			} catch (error) {
				logRequest(
					init.method ?? "GET",
					url,
					"NETWORK ERROR",
					performance.now() - startedAt,
					` (${error})`,
				);
				throw error;
			}
		},
	};

	try {
		return await fn(session);
	} finally {
		try {
			await session.request("/rr_disconnect");
			console.log("[BOARD-FILES] Session closed");
		} catch (error) {
			// A failed disconnect is not worth failing the operation over; the
			// board expires the session on its own timeout.
			console.warn(`[BOARD-FILES] Disconnect failed: ${error}`);
		}
	}
}

// ---------------------------------------------------------------------------
// File system endpoints
// ---------------------------------------------------------------------------

async function readErr(response: Response): Promise<number> {
	const data: ErrorResponse = await response.json();
	return data.err;
}

/** GET /rr_filelist — follows pagination so the full listing is returned. */
export async function listFiles(
	session: PrinterSession,
	directory: string,
): Promise<FileListEntry[]> {
	const entries: FileListEntry[] = [];
	let first = 0;

	while (true) {
		const response = await session.request(
			`/rr_filelist?dir=${encodeURIComponent(directory)}&first=${first}`,
		);

		if (!response.ok) {
			throw new Error(`Could not list ${directory}: HTTP ${response.status}`);
		}

		const data: FileListResponse = await response.json();

		if (data.err !== 0) {
			// err: 1 means the directory does not exist, which callers treat as
			// an empty listing rather than a failure.
			return entries;
		}

		entries.push(...(data.files ?? []));

		if (!data.next) break;
		first = data.next;
	}

	return entries;
}

/** True when `directory` exists on the board, checked via its parent listing. */
export async function directoryExists(
	session: PrinterSession,
	directory: string,
): Promise<boolean> {
	const trimmed = directory.replace(/\/$/, "");
	const separator = trimmed.lastIndexOf("/");
	const name = trimmed.slice(separator + 1);
	// A path like "0:/sys" has its separator inside the volume prefix, so
	// slicing there would yield "0:" rather than the volume root.
	const parent =
		separator <= trimmed.indexOf(":") + 1
			? `${trimmed.slice(0, trimmed.indexOf(":") + 1)}/`
			: trimmed.slice(0, separator);

	const entries = await listFiles(session, parent);
	return entries.some((entry) => entry.type === "d" && entry.name === name);
}

/** GET /rr_mkdir. Resolves false when the directory already existed. */
export async function makeDirectory(
	session: PrinterSession,
	directory: string,
): Promise<boolean> {
	const response = await session.request(
		`/rr_mkdir?dir=${encodeURIComponent(directory)}`,
	);

	if (!response.ok) {
		throw new Error(`Could not create ${directory}: HTTP ${response.status}`);
	}

	return (await readErr(response)) === 0;
}

/**
 * GET /rr_download. Resolves null when the board returns 404, which is how it
 * reports a file that is not present.
 */
export async function downloadFile(
	session: PrinterSession,
	name: string,
): Promise<string | null> {
	const response = await session.request(
		`/rr_download?name=${encodeURIComponent(name)}`,
	);

	if (response.status === 404) return null;

	if (!response.ok) {
		throw new Error(`Could not download ${name}: HTTP ${response.status}`);
	}

	return response.text();
}

/** POST /rr_upload with a CRC32 checksum so the board can reject bad writes. */
export async function uploadFile(
	session: PrinterSession,
	name: string,
	data: Blob,
): Promise<void> {
	// Read the bytes once and send those rather than the Blob, so the checksum
	// is computed over exactly what goes on the wire.
	const bytes = new Uint8Array(await data.arrayBuffer());
	const crcHex = decimalToHex(crc32.buf(bytes, 0) >>> 0);

	const response = await session.request(
		`/rr_upload?name=${encodeURIComponent(name)}&crc32=${crcHex}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/octet-stream" },
			body: bytes,
		},
	);

	if (!response.ok) {
		throw new Error(`Upload of ${name} failed: HTTP ${response.status}`);
	}

	const err = await readErr(response);
	if (err !== 0) {
		throw new Error(`Upload of ${name} failed: board returned err ${err}`);
	}
}

/** GET /rr_delete. */
export async function deleteFile(
	session: PrinterSession,
	name: string,
	recursive = false,
): Promise<boolean> {
	const response = await session.request(
		`/rr_delete?name=${encodeURIComponent(name)}${recursive ? "&recursive=yes" : ""}`,
	);

	if (!response.ok) {
		throw new Error(`Could not delete ${name}: HTTP ${response.status}`);
	}

	return (await readErr(response)) === 0;
}

/** GET /rr_gcode followed by GET /rr_reply, returning the board's reply text. */
export async function sendGCode(
	session: PrinterSession,
	gcode: string,
): Promise<string> {
	const response = await session.request(
		`/rr_gcode?gcode=${encodeURIComponent(gcode)}`,
	);

	if (!response.ok) {
		throw new Error(`Could not run ${gcode}: HTTP ${response.status}`);
	}

	return getReply(session);
}

/** GET /rr_reply. The board returns plain text, not JSON. */
export async function getReply(session: PrinterSession): Promise<string> {
	const response = await session.request("/rr_reply");

	if (!response.ok) {
		throw new Error(`Could not read reply: HTTP ${response.status}`);
	}

	return response.text();
}

// ---------------------------------------------------------------------------
// G-code job upload
// ---------------------------------------------------------------------------

async function calculateCRC32(binaryData: Blob): Promise<number> {
	const buf = await binaryData.arrayBuffer();
	return crc32.buf(new Uint8Array(buf), 0) >>> 0;
}

function decimalToHex(decimal: number) {
	if (!Number.isInteger(decimal) || decimal < 0) {
		throw new Error("Input must be a non-negative integer.");
	}

	return decimal.toString(16).toUpperCase();
}

export async function sendGCodeFile(binaryData: Blob, fileName: string) {
	const ipAddress = await getIpAddress();
	await connectToPrinter(ipAddress);

	const crc = await calculateCRC32(binaryData);
	const crcHex = decimalToHex(crc);

	const response = await fetch(
		`http://${ipAddress}/rr_upload?name=0:/gcodes/${encodeURIComponent(
			fileName,
		)}&crc32=${crcHex}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: binaryData,
		},
	);

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	const data: ErrorResponse = await response.json();

	if (data.err !== 0) {
		throw new Error("Upload failed");
	}
}
