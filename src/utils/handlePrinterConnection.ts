import { max } from "mathjs";
import { isFQDN, isIP } from "validator";
import { connectToPrinter } from "@/3d/sendGCodeFile";
import { getIpAddress } from "@/db/keyValueSettings";
import {
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
} from "./htmlElements";

let isConnecting = false;
let connectionTimeoutId: number | undefined;
let retryCount = 0;
const MAX_RETRIES = 10;

export const printerConnection = async () => {
	// Prevent concurrent connection attempts
	if (isConnecting) {
		return;
	}

	const storedIpAddress = await getIpAddress();
	const ipAddress = ipAddressInput.value || storedIpAddress;
	const isValid =
		isIP(ipAddress) || isFQDN(ipAddress) || ipAddress.includes("localhost");

	if (!isValid) {
		console.warn("Invalid IP address or FQDN:", ipAddress);
		ipAddressFailure.classList.remove("hide");
		ipAddressSuccess.classList.add("hide");
		return;
	}

	isConnecting = true;

	try {
		const { sessionTimeout } = await connectToPrinter(ipAddress);

		// Reset retry count on successful connection
		retryCount = 0;

		ipAddressFailure.classList.add("hide");
		ipAddressSuccess.classList.remove("hide");

		// Schedule next connection attempt
		const timeout = sessionTimeout
			? max(1000, sessionTimeout - 1000) // Ensure minimum 1 second, reconnect 1 second before timeout
			: 30000; // Increase default interval to 30 seconds for health checks

		connectionTimeoutId = window.setTimeout(async () => {
			isConnecting = false;
			await printerConnection();
		}, timeout) as number;
	} catch (error) {
		console.error("Error connecting to printer:", error);
		retryCount++;

		ipAddressFailure.classList.remove("hide");
		ipAddressSuccess.classList.add("hide");

		// Exponential backoff with max retries
		if (retryCount <= MAX_RETRIES) {
			const backoffDelay = Math.min(1000 * 2 ** (retryCount - 1), 30000); // Cap at 30 seconds
			console.log(
				`Retrying connection in ${backoffDelay}ms (attempt ${retryCount}/${MAX_RETRIES})`,
			);

			connectionTimeoutId = window.setTimeout(async () => {
				isConnecting = false;
				await printerConnection();
			}, backoffDelay) as number;
		} else {
			console.warn("Max retry attempts reached. Stopping connection attempts.");
		}
	} finally {
		isConnecting = false;
	}
};

export const handleIpAddressChange = async () => {
	// Clear existing timeout when IP changes
	if (connectionTimeoutId) {
		window.clearTimeout(connectionTimeoutId);
		connectionTimeoutId = undefined;
	}

	// Reset retry count when user changes IP
	retryCount = 0;
	isConnecting = false;

	await printerConnection();
};
