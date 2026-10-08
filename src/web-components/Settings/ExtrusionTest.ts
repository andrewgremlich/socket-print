import { sendGCodeFile } from "@/3d/printerApi";
import { getIpAddress } from "@/db/formValuesDbActions";

export class ExtrusionTest {
	extrusionTestGcodeButton: HTMLButtonElement;
	extrusionTestStatus: HTMLParagraphElement;

	constructor(private shadowRoot: ShadowRoot) {
		this.extrusionTestGcodeButton = this.shadowRoot.getElementById(
			"extrusionTestGcode",
		) as HTMLButtonElement;
		this.extrusionTestStatus = this.shadowRoot.getElementById(
			"extrusionTestStatus",
		) as HTMLParagraphElement;
		this.extrusionTestGcodeButton.addEventListener("click", () =>
			this.sendExtrusionTestGcode(),
		);
	}

	reset() {
		this.#setExtrusionTestStatus("");
	}

	#setExtrusionTestStatus(message: string, isError = false) {
		this.extrusionTestStatus.textContent = message;
		this.extrusionTestStatus.className = isError ? "firmware-error" : "";
	}

	/**
	 * Uploads the bundled extrusion linearity test to the board's gcodes folder.
	 * Like the main Print button, this only uploads — the operator starts the
	 * job from the printer's own screen.
	 */
	async sendExtrusionTestGcode() {
		const ipAddress = await getIpAddress();

		if (!ipAddress) {
			this.#setExtrusionTestStatus("Set a printer IP address first.", true);
			return;
		}

		this.extrusionTestGcodeButton.disabled = true;
		this.#setExtrusionTestStatus("Uploading extrusion test...");

		try {
			const response = await fetch("/extrusion_test.gcode", {
				cache: "no-cache",
			});

			if (!response.ok) {
				throw new Error(
					`Could not read the bundled test file: HTTP ${response.status}`,
				);
			}

			await sendGCodeFile(await response.blob(), "extrusion_test.gcode");

			this.#setExtrusionTestStatus(
				"Uploaded to 0:/gcodes/extrusion_test.gcode. Start it from the printer screen.",
			);
		} catch (error) {
			this.#setExtrusionTestStatus(
				`Upload failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		} finally {
			this.extrusionTestGcodeButton.disabled = false;
		}
	}
}
