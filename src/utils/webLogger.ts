import { getDebugMode } from "@/db/appSettings";

export const webLogger = async () => {
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;
	const originalConsoleInfo = console.info;

	const debugMode = await getDebugMode();

	console.log = (...args: unknown[]) => {
		if (debugMode) {
			originalConsoleLog(...args);
		}
	};

	console.error = (...args: unknown[]) => {
		if (debugMode) {
			originalConsoleError(...args);
		}
	};

	console.warn = (...args: unknown[]) => {
		if (debugMode) {
			originalConsoleWarn(...args);
		}
	};

	console.info = (...args: unknown[]) => {
		if (debugMode) {
			originalConsoleInfo(...args);
		}
	};
};
