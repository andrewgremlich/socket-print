export interface MaterialProfile {
	nozzleTemp: number;
	cupTemp: number;
	shrinkFactor: number;
	outputFactor: number;
}

export interface ProvelPrintApp {
	ipAddress: string;
	lockPosition: "left" | "right";
	cupSize: string;
	nozzleSize: number;
	layerHeight: number;
	activeMaterialProfile: string;
}

declare global {
	interface Window {
		provelPrintStore: ProvelPrintApp;
		materialProfiles: Record<string, MaterialProfile>;
	}
}
