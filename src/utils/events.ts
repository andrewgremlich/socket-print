import {
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
	menuBar,
	menuBarDropdowns,
	printerFileInput,
} from "./htmlElements";
import { connectToPrinter, sendGCodeFile } from "./sendGCodeFile";

menuBar.addEventListener("click", (evt) => {
	const target = evt.target as HTMLElement;

	for (const dropdown of menuBarDropdowns) {
		if (dropdown !== target.nextElementSibling) {
			dropdown.classList.remove("show");
		}
	}

	if (target.matches(".menuBarButton")) {
		const nextSibling = target.nextElementSibling as HTMLElement;
		nextSibling.classList.toggle("show");
	}
});

window.addEventListener("click", (evt) => {
	if (!(evt.target as HTMLElement).matches(".menuBarButton")) {
		for (const dropdown of menuBarDropdowns) {
			dropdown.classList.remove("show");
		}
	}
});

printerFileInput.addEventListener("change", async () => {
	if (!printerFileInput.files) {
		throw new Error("No files found in file input");
	}

	const file = printerFileInput.files[0];
	const gcode = await file.text();

	// Send the G-code to the printer
	sendGCodeFile(new Blob([gcode]), file.name);
});

ipAddressInput.addEventListener("change", () => {
	connectToPrinter(ipAddressInput.value)
		.then(() => {
			console.log("successful connection");
			ipAddressFailure.classList.toggle("hide");
			ipAddressSuccess.classList.toggle("hide");
		})
		.catch((error) => {
			console.error("CAUGHT:", error);
		});
});
