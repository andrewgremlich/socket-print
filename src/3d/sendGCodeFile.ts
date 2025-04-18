import { getIpAddress } from "@/db/appSettings";
import crc32 from "crc-32";

type UploadResponse = {
	err: 0 | 1 | 2;
	sessionTimeout: number;
	boardType: string;
	sessionKey: number;
};

type ModelInformation = {
	key: string;
	flags: number;
	result: number;
};

export async function setPrinterIp(ipAddress: string) {
	const response = await fetch("http://127.0.0.1:8724/printer_ip", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ip: ipAddress }),
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	return await response.json();
}

// DOCS: https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
export async function connectToPrinter(ipAddress: string) {
	const password = "";

	try {
		const response = await fetch(
			`http://${ipAddress}/rr_connect?password=${password}`,
		);

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
		await connectToPrinter(ipAddress);

		const crc = await calculateCRC32(binaryData);
		const crcHex = decimalToHex(crc);

		const response = await fetch(
			`http://${ipAddress}/rr_upload?name=/gcodes/${encodeURIComponent(fileName)}&crc32=${crcHex}`,
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
