import { max } from "mathjs";
import { isFQDN, isIP } from "validator";
import { connectToPrinter } from "@/3d/sendGCodeFile";
import { getIpAddress } from "@/db/keyValueSettings";
import {
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
} from "./htmlElements";

self.onmessage = async () => {
	const printerConnection = async () => {
		const storedIpAddress = await getIpAddress();
		const ipAddress = ipAddressInput.value || storedIpAddress;
		const isValid =
			isIP(ipAddress) || isFQDN(ipAddress) || ipAddress.includes("localhost");

		if (isValid) {
			try {
				const { sessionTimeout } = await connectToPrinter(ipAddress);

				ipAddressFailure.classList.toggle("hide");
				ipAddressSuccess.classList.toggle("hide");

				if (sessionTimeout) {
					const timeout = max(0, sessionTimeout - 1000);
					setTimeout(printerConnection, timeout);
				}
			} catch (error) {
				console.error("Error connecting to printer:", error);
				ipAddressFailure.classList.remove("hide");
				ipAddressSuccess.classList.add("hide");
			}
		}
	};

	ipAddressInput.addEventListener("input", printerConnection);
	await printerConnection();
};
