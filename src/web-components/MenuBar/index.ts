import styles from "./MenuBar.css?inline";
import template from "./MenuBar.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class MenuBar extends HTMLElement {
	#shadow: ShadowRoot;
	#onDocumentPointerDown = (evt: Event) => {
		if (!evt.composedPath().includes(this)) {
			this.#closeAllMenus();
		}
	};

	constructor() {
		super();
		this.#shadow = this.attachShadow({ mode: "open" });
		this.#shadow.adoptedStyleSheets = [sheet];
		this.#shadow.innerHTML = template;
	}

	// -- Public getters for external code --

	get fileInput(): HTMLInputElement {
		return this.#shadow.getElementById("stlFileInput") as HTMLInputElement;
	}

	get clearModelButton(): HTMLButtonElement {
		return this.#shadow.getElementById("clearModelButton") as HTMLButtonElement;
	}

	get addTestStlButton(): HTMLButtonElement {
		return this.#shadow.getElementById("addTestStlButton") as HTMLButtonElement;
	}

	get addTestCylinderButton(): HTMLButtonElement {
		return this.#shadow.getElementById(
			"addTestCylinderButton",
		) as HTMLButtonElement;
	}

	// -- Lifecycle --

	connectedCallback() {
		this.#setupTriggers();
		this.#setupFileInputDropdownClose();
		this.#setupMenuActions();
		this.#setupKeyboardNavigation();

		document.addEventListener("pointerdown", this.#onDocumentPointerDown);
	}

	disconnectedCallback() {
		document.removeEventListener("pointerdown", this.#onDocumentPointerDown);
	}

	// -- Internal logic --

	#openMenu(dropdown: HTMLElement) {
		this.#closeAllMenus();
		dropdown.classList.add("open");
		this.#shadow
			.querySelector(`[aria-controls="${dropdown.id}"]`)
			?.setAttribute("aria-expanded", "true");
	}

	#closeAllMenus() {
		for (const dropdown of this.#shadow.querySelectorAll(".menuBarDropdown")) {
			dropdown.classList.remove("open");
		}
		for (const trigger of this.#shadow.querySelectorAll("[aria-controls]")) {
			trigger.setAttribute("aria-expanded", "false");
		}
	}

	#setupTriggers() {
		const triggers = this.#shadow.querySelectorAll(
			".menuBarButton[aria-controls]",
		) as NodeListOf<HTMLElement>;

		for (const trigger of triggers) {
			trigger.addEventListener("click", (evt) => {
				evt.stopPropagation();

				const dropdownId = trigger.getAttribute("aria-controls");
				if (!dropdownId) return;

				const dropdown = this.#shadow.getElementById(dropdownId);
				if (!dropdown) return;

				if (dropdown.classList.contains("open")) {
					this.#closeAllMenus();
				} else {
					this.#openMenu(dropdown);
				}
			});
		}
	}

	#setupFileInputDropdownClose() {
		this.fileInput?.addEventListener("change", () => this.#closeAllMenus());
	}

	#setupMenuActions() {
		const dispatch = (name: string) => {
			this.#closeAllMenus();
			this.dispatchEvent(new CustomEvent(name, { bubbles: true }));
		};

		this.#shadow
			.getElementById("addMaterialProfile")
			?.addEventListener("click", () => dispatch("menu-add-material-profile"));

		this.#shadow
			.getElementById("editActiveMaterialProfile")
			?.addEventListener("click", () => dispatch("menu-edit-material-profile"));

		this.#shadow
			.getElementById("deleteMaterialProfile")
			?.addEventListener("click", () =>
				dispatch("menu-delete-material-profile"),
			);

		this.#shadow
			.getElementById("helpButton")
			?.addEventListener("click", () => dispatch("menu-help"));

		this.#shadow
			.getElementById("activateInfoDialog")
			?.addEventListener("click", () => dispatch("menu-info"));

		this.#shadow
			.getElementById("activateSettingsDialog")
			?.addEventListener("click", () => dispatch("menu-settings"));
	}

	#setupKeyboardNavigation() {
		const nav = this.#shadow.getElementById("menuBar") as HTMLElement;
		const topLevelButtons = nav.querySelectorAll(
			":scope > div:first-child > .menuBarButtonContainer > .menuBarButton, :scope > div:first-child > .menuBarButton",
		) as NodeListOf<HTMLElement>;

		nav.addEventListener("keydown", (evt) => {
			const target = evt.target as HTMLElement;

			const openDropdown = this.#shadow.querySelector(
				".menuBarDropdown.open",
			) as HTMLElement | null;

			if (evt.key === "Escape") {
				if (openDropdown) {
					const dropdownId = openDropdown.id;
					this.#closeAllMenus();
					(
						this.#shadow.querySelector(
							`[aria-controls="${dropdownId}"]`,
						) as HTMLElement | null
					)?.focus();
				}
				evt.preventDefault();
				return;
			}

			// Navigation within an open dropdown
			if (openDropdown?.contains(target)) {
				const items = openDropdown.querySelectorAll(
					"button.menuBarDropdownButton, label.menuBarDropdownButton",
				) as NodeListOf<HTMLElement>;
				const currentIndex = Array.from(items).indexOf(target);

				if (evt.key === "ArrowDown") {
					evt.preventDefault();
					const next = (currentIndex + 1) % items.length;
					items[next].focus();
				} else if (evt.key === "ArrowUp") {
					evt.preventDefault();
					const prev = (currentIndex - 1 + items.length) % items.length;
					items[prev].focus();
				}
				return;
			}

			// Navigation among top-level buttons
			const currentTopIndex = Array.from(topLevelButtons).indexOf(target);
			if (currentTopIndex === -1) return;

			if (evt.key === "ArrowRight") {
				evt.preventDefault();
				const next = (currentTopIndex + 1) % topLevelButtons.length;
				topLevelButtons[next].focus();
			} else if (evt.key === "ArrowLeft") {
				evt.preventDefault();
				const prev =
					(currentTopIndex - 1 + topLevelButtons.length) %
					topLevelButtons.length;
				topLevelButtons[prev].focus();
			} else if (evt.key === "ArrowDown") {
				if (
					target.matches(".menuBarButton") &&
					!target.classList.contains("noDropdown")
				) {
					evt.preventDefault();
					const targetId = target.getAttribute("aria-controls");
					if (targetId) {
						const dropdown = this.#shadow.getElementById(targetId);
						if (!dropdown) return;

						this.#openMenu(dropdown);
						const firstItem = dropdown.querySelector(
							"button.menuBarDropdownButton, label.menuBarDropdownButton",
						) as HTMLElement | null;
						firstItem?.focus();
					}
				}
			}
		});
	}
}

customElements.define("menu-bar", MenuBar);
