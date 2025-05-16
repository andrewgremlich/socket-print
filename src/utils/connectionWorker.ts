import { isFQDN, isIP } from "validator";

import { connectToPrinter } from "@/3d/sendGCodeFile";
import { getIpAddress } from "@/db/appSettings";

import {
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
} from "./htmlElements";

self.onmessage = async () => {
	const printerConnection = async () => {
		console.log("Printer connection check");

		const storedIpAddress = await getIpAddress();
		const ipAddress = ipAddressInput.value || storedIpAddress;
		const isValid =
			isIP(ipAddress) || isFQDN(ipAddress) || ipAddress.includes("localhost");

		console.log("IP address", ipAddress, "is valid", isValid);

		if (isValid) {
			try {
				// await setPrinterIp(ipAddress); // Uncomment this line if you want to set the IP address in Deno

				console.log("Connecting to printer at", ipAddress);
				const { sessionTimeout } = await connectToPrinter(ipAddress);
				console.log(sessionTimeout);

				console.info("Printer connected");
				console.log("Session timeout:", sessionTimeout);

				ipAddressFailure.classList.toggle("hide");
				ipAddressSuccess.classList.toggle("hide");

				if (sessionTimeout) {
					const timeout = Math.max(0, sessionTimeout - 1000);
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
