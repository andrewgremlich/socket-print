import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
	onRegisteredSW(swUrl, r) {
		console.log("SW Registered");
	},
	onRegisterError(error) {
		console.error("SW registration error", error);
	},
	onNeedRefresh() {
		console.log("refresh");
		// Clear some localStorage keys here
		// localStorage.removeItem("provelPrintStore");
		// localStorage.removeItem("materialProfiles");

		// Trigger the service worker update
		updateSW(true);
	},
	onOfflineReady() {
		console.log("offline ready");
	},
});
