export interface ProvelPrintApp {
	cupSize: string | number;
	cupTemp: string | number;
	layerHeight: string | number;
	material: string | number;
	nozzleSize: string | number;
	nozzleTemp: string | number;
	outputFactor: string | number;
	ipAddress: string | number;
	shrinkFactor: string | number;
}

declare global {
	interface Window {
		provelPrintStore: ProvelPrintApp;
	}
}
