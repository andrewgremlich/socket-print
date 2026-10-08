import { deleteDb } from "@/db/db";
import { downloadLogs } from "@/utils/logInterceptor";
import { Dialog } from "../Dialog";
import { ExtrusionTest } from "./ExtrusionTest";
import { PrinterMaintenance } from "./PrinterMaintenance";
import styles from "./Settings.css?inline";
import template from "./Settings.html?raw";
import { SettingsForms } from "./SettingsForms";
import { ThemeSettings } from "./ThemeSettings";

export { initializeTheme } from "./ThemeSettings";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class Settings extends Dialog {
	private settingsForms: SettingsForms;
	private printerMaintenance: PrinterMaintenance;
	private extrusionTest: ExtrusionTest;
	private themeSettings: ThemeSettings;

	constructor() {
		super();
		this.id = "settingsDialog";
		this.attachHTML(template, sheet);
		this.settingsForms = new SettingsForms(this.shadowRoot);
		this.form = this.settingsForms.form;
		this.printerMaintenance = new PrinterMaintenance(this.shadowRoot);
		this.extrusionTest = new ExtrusionTest(this.shadowRoot);
		this.themeSettings = new ThemeSettings(this.shadowRoot);
		this.dialogEvents();
	}

	async showSettings() {
		await this.settingsForms.loadDataIntoForm();
		this.themeSettings.load();
		this.printerMaintenance.reset();
		this.extrusionTest.reset();
		this.show();
		this.printerMaintenance.checkBoardFileStatus();
	}

	dialogEvents() {
		this.shadowRoot
			.getElementById("closeSettings")
			.addEventListener("click", () => this.hide());
		this.dialog.addEventListener("close", () => this.hide());
		this.shadowRoot
			.getElementById("resetApp")
			.addEventListener("click", () => this.resetApplication());
		this.shadowRoot
			.getElementById("downloadLogs")
			.addEventListener("click", () => downloadLogs());
	}

	async resetApplication() {
		if (
			confirm(
				"Are you sure you want to reset the application? This will delete all your data and settings!",
			)
		) {
			await deleteDb();
			location.reload();
		}
	}
}

customElements.define("app-settings", Settings);
