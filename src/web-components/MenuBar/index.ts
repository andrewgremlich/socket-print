import styles from "./MenuBar.css?inline";
import template from "./MenuBar.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class MenuBar extends HTMLElement {
	#shadow: ShadowRoot;

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
		this.#setupFileInputDropdownClose();
		this.#setupMenuActions();
		this.#setupKeyboardNavigation();
	}

	// -- Internal logic --

	#setupFileInputDropdownClose() {
		this.fileInput?.addEventListener("change", () => {
			const popover = this.#shadow.getElementById(
				"fileDropdown",
			) as HTMLElement & { hidePopover(): void };
			popover?.hidePopover();
		});
	}

	#setupMenuActions() {
		const dispatch = (name: string) => {
			const popovers = this.#shadow.querySelectorAll("[popover]") as NodeListOf<
				HTMLElement & { hidePopover(): void }
			>;
			for (const p of popovers) p.hidePopover();
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

			const openPopover = this.#shadow.querySelector(
				"[popover]:popover-open",
			) as HTMLElement | null;

			if (evt.key === "Escape") {
				if (openPopover) {
					(openPopover as HTMLElement & { hidePopover(): void }).hidePopover();
					const triggerId = openPopover.id;
					(
						this.#shadow.querySelector(
							`[popovertarget="${triggerId}"]`,
						) as HTMLElement | null
					)?.focus();
				}
				evt.preventDefault();
				return;
			}

			// Navigation within an open popover
			if (openPopover?.contains(target)) {
				const items = openPopover.querySelectorAll(
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
					const targetId = target.getAttribute("popovertarget");
					if (targetId) {
						const popover = this.#shadow.getElementById(
							targetId,
						) as HTMLElement & {
							showPopover(): void;
						};
						popover?.showPopover();
						const firstItem = popover?.querySelector(
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
