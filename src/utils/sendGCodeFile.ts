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

export async function connectToPrinter(ipAddress: string) {
	const password = "";

	try {
		const response = await fetch(
			`http://${ipAddress}/rr_connect?password=${password}`, //TODO: this is sending the full address with `socketprint`
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

		return `Connection response:${data}`;
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
			const crc = crc32.buf(uint8Array);
			resolve(crc);
		};
		reader.onerror = () => {
			reject(new Error("Failed to read the binary data"));
		};
		reader.readAsArrayBuffer(binaryData);
	});
}

function stringToHex(str: string) {
	return Array.from(str)
		.map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
		.join("");
}

export async function sendGCodeFile(binaryData: Blob, fileName: string) {
	try {
		const crc = await calculateCRC32(binaryData);
		console.log(`CRC32 Checksum: ${crc}`);

		const crcHex = stringToHex(crc.toString());
		console.log(`CRC32 Checksum (Hex): ${crcHex}`);

		const response = await fetch(
			`http://${
				window.provelPrintStore.ipAddress
			}/rr_upload?name=/gcodes/${encodeURIComponent(fileName)}&crc32=${crcHex}`,
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
