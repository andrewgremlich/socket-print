type Theme = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "app-theme";

export function initializeTheme(): void {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
	const theme: Theme = storedTheme ?? "dark";
	document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	document.documentElement.setAttribute("data-theme", theme);
}

function getTheme(): Theme {
	return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? "dark";
}

export class ThemeSettings {
	private select: HTMLSelectElement;

	constructor(shadowRoot: ShadowRoot) {
		this.select = shadowRoot.getElementById("themeSelect") as HTMLSelectElement;
		this.select.addEventListener("change", () =>
			setTheme(this.select.value as Theme),
		);
	}

	load() {
		this.select.value = getTheme();
	}
}
