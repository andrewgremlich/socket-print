import { beforeEach, expect, test, vi } from "vitest";
import { checkBoardFileVersions, installBoardFiles } from "@/3d/boardFiles";
import { getIpAddress } from "@/db/formValuesDbActions";
import { PrinterMaintenance } from "./PrinterMaintenance";
import template from "./Settings.html?raw";

vi.mock("@/3d/boardFiles");
vi.mock("@/db/formValuesDbActions");

let maintenance: PrinterMaintenance;

beforeEach(() => {
	vi.resetAllMocks();
	const root = document.createElement("div").attachShadow({ mode: "open" });
	root.innerHTML = template;
	maintenance = new PrinterMaintenance(root);
});

test("does not check the board when no printer IP is configured", async () => {
	vi.mocked(getIpAddress).mockResolvedValue("");
	maintenance.reset();
	await maintenance.checkBoardFileStatus();

	expect(checkBoardFileVersions).not.toHaveBeenCalled();
	expect(maintenance.installBoardFilesButton.disabled).toBe(true);
	expect(maintenance.printerStatusSpan.textContent).toBe("No IP configured");
});

test("screen updates stay separate from macro installation", async () => {
	vi.mocked(getIpAddress).mockResolvedValue("192.168.1.10");
	vi.mocked(checkBoardFileVersions).mockResolvedValue([
		{
			group: "screen",
			target: "0:/firmware",
			bundledVersion: "2.0.0",
			installedVersion: "1.0.0",
			needsUpdate: true,
			fileCount: 1,
		},
	]);
	await maintenance.checkBoardFileStatus();

	expect(maintenance.installBoardFilesButton.disabled).toBe(true);
	expect(maintenance.screenFirmwareContainer.style.display).toBe("block");
	expect(maintenance.flashScreenFirmwareButton.textContent).toBe(
		"Flash Screen Firmware (v2.0.0)",
	);
	await maintenance.performBoardFileInstall();
	expect(installBoardFiles).not.toHaveBeenCalled();
});
