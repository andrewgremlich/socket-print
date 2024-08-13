// biome-ignore lint/style/useExportType: <explanation>
export {};

declare global {
	interface Window {
		__SOCKET_PRINT_ENV__: string;
	}
}
