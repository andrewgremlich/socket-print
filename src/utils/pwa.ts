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
		updateSW(true);
	},
	onOfflineReady() {
		console.log("offline ready");
	},
});
