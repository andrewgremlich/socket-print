interface LogEntry {
	type: "log" | "warn" | "error" | "unhandled-error" | "unhandled-rejection";
	timestamp: string;
	message: string;
}

const logs: LogEntry[] = [];

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function formatArgs(args: unknown[]): string {
	return args
		.map((arg) =>
			typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
		)
		.join(" ");
}

function now(): string {
	return new Date().toISOString();
}

export function initLogInterceptor(): void {
	console.error = (...args: unknown[]) => {
		logs.push({ type: "error", timestamp: now(), message: formatArgs(args) });
		originalConsoleError.apply(console, args);
	};

	console.warn = (...args: unknown[]) => {
		logs.push({ type: "warn", timestamp: now(), message: formatArgs(args) });
		originalConsoleWarn.apply(console, args);
	};

	window.addEventListener("error", (e) => {
		logs.push({
			type: "unhandled-error",
			timestamp: now(),
			message: `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
		});
	});

	window.addEventListener("unhandledrejection", (e) => {
		logs.push({
			type: "unhandled-rejection",
			timestamp: now(),
			message: String(e.reason),
		});
	});
}

export function downloadLogs(): void {
	if (logs.length === 0) {
		alert("No logs captured.");
		return;
	}

	const content = logs
		.map((entry) => `[${entry.timestamp}] [${entry.type}] ${entry.message}`)
		.join("\n");

	const blob = new Blob([content], { type: "text/plain" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `provel-print-logs-${Date.now()}.txt`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
