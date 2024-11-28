import { menuBarButtons } from "./htmlElements";

window.addEventListener("click", (event) => {
	const target = event.target as HTMLInputElement;

	if (
		target.className === "menuBarButton" ||
		target.className === "menuOptionCheckbox"
	) {
		return;
	}

	for (const menuButton of menuBarButtons) {
		menuButton.checked = false;
	}
});
