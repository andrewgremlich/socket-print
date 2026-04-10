import crc32 from "crc-32";
import { getIpAddress } from "@/db/formValuesDbActions";

type UploadResponse = {
	err: 0 | 1 | 2;
	sessionTimeout: number;
	boardType: string;
	sessionKey: number;
};

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

type GitHubAsset = {
	name: string;
	browser_download_url: string;
};

export type GitHubRelease = {
	tag_name: string; // e.g. "3.5.4"
	assets: GitHubAsset[];
};

// DOCS: https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
export async function connectToPrinter(ipAddress: string) {
	const password = "";

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

		const response = await fetch(
			`http://${ipAddress}/rr_connect?password=${password}`,
			{ signal: controller.signal },
		);

		clearTimeout(timeout);

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data: UploadResponse = await response.json();

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

export async function getLatestFirmwareRelease(): Promise<GitHubRelease> {
	const response = await fetch(
		"https://api.github.com/repos/Duet3D/RepRapFirmware/releases/latest",
	);

	if (!response.ok) {
		throw new Error("Could not fetch firmware release info");
	}

	return response.json() as Promise<GitHubRelease>;
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

export async function uploadFirmwareFile(
	ipAddress: string,
	fileName: string,
	data: ArrayBuffer,
): Promise<void> {
	try {
		const blob = new Blob([data], { type: "application/octet-stream" });
		const crc = await calculateCRC32(blob);
		const crcHex = decimalToHex(crc);

		const response = await fetch(
			`http://${ipAddress}/rr_upload?name=0:/firmware/${encodeURIComponent(fileName)}&crc32=${crcHex}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/octet-stream" },
				body: blob,
			},
		);

		if (!response.ok) {
			throw new Error(`Upload failed for ${fileName}`);
		}

		const result: UploadResponse = await response.json();
		if (result.err !== 0) {
			throw new Error(`Upload error ${result.err} for ${fileName}`);
		}
	} catch (error) {
		throw new Error(`Could not upload firmware file:${error}`);
	}
}

export async function triggerFirmwareFlash(ipAddress: string): Promise<void> {
	const response = await fetch(
		`http://${ipAddress}/rr_gcode?gcode=${encodeURIComponent("M997")}`,
	);

	if (!response.ok) {
		throw new Error("Failed to trigger firmware flash");
	}
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

export async function getModelInformation(ipAddress: string) {
	try {
		const response = await fetch(`http://${ipAddress}/rr_model?key=boards[0]`);

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data: ModelInformation = await response.json();

		return data;
	} catch (error) {
		throw new Error(`There was a problem with the fetch operation:${error}`);
	}
}

export async function getFirmwareVersion() {
	try {
		const ipAddress = await getIpAddress();
		await connectToPrinter(ipAddress);
		const firmwareVersionCall = await fetch(
			`http://${ipAddress}/rr_gcode?gcode=M115`,
		);
		const firmwareVersionResponse = await fetch(`http://${ipAddress}/rr_reply`);

		if (!firmwareVersionCall.ok || !firmwareVersionResponse.ok) {
			throw new Error("Could not fetch firmware version");
		}

		const firmwareVersionData: { reply: string } =
			await firmwareVersionResponse.json();

		return firmwareVersionData.reply;
	} catch (error) {
		throw new Error(`Could not fetch firmware version:${error}`);
	}
}

function calculateCRC32(binaryData: Blob): Promise<number> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const arrayBuffer = reader.result as ArrayBuffer;
			const uint8Array = new Uint8Array(arrayBuffer);
			const crc = crc32.buf(uint8Array, 0) >>> 0;
			resolve(crc);
		};
		reader.onerror = () => {
			reject(new Error("Failed to read the binary data"));
		};
		reader.readAsArrayBuffer(binaryData);
	});
}

function decimalToHex(decimal: number) {
	if (!Number.isInteger(decimal) || decimal < 0) {
		throw new Error("Input must be a non-negative integer.");
	}

	return decimal.toString(16).toUpperCase();
}

export async function sendGCodeFile(binaryData: Blob, fileName: string) {
	try {
		const ipAddress = await getIpAddress();

		console.log(ipAddress);

		await connectToPrinter(ipAddress);

		const crc = await calculateCRC32(binaryData);
		const crcHex = decimalToHex(crc);

		const response = await fetch(
			`http://${ipAddress}/rr_upload?name=/gcodes/${encodeURIComponent(
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

		const data: UploadResponse = await response.json();

		if (data.err === 1) {
			throw new Error("Upload failed");
		}
	} catch (error) {
		console.error(error);
	}
}
