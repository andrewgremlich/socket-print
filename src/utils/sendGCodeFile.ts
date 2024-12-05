type UploadResponse = {
	err: "0" | "1" | "2";
	sessionTimeout: number;
	boardType: string;
	sessionKey: number;
};

export async function connectToPrinter() {
	const password = "";

	try {
		const response = await fetch(
			`${window.provelPrintStore.ipAddress}/rr_connect?password=${password}`,
		);

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data: UploadResponse = await response.json();

		if (data.err === "1") {
			throw new Error("Password incorrect");
		}

		if (data.err === "2") {
			throw new Error("Too many user sessions");
		}

		console.log("Connection response:", data);
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}

export async function sendGCodeFile(binaryData: Blob, fileName: string) {
	try {
		const response = await fetch(
			`${window.provelPrintStore.ipAddress}/rr_upload?name=/gcodes/${fileName}`,
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

		if (data.err === "1") {
			throw new Error("Upload failed");
		}
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
}
