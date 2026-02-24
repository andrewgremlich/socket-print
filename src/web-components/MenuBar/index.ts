const SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

export class MenuBar extends HTMLElement {
	private _shadow: ShadowRoot;

	constructor() {
		super();
		this._shadow = this.attachShadow({ mode: "open" });
		this._shadow.innerHTML = `
			<style>${MenuBar.styles}</style>
			${MenuBar.template}
		`;
	}

	// -- Public getters for external code --

	get fileInput(): HTMLInputElement {
		return this._shadow.getElementById("stlFileInput") as HTMLInputElement;
	}

	get clearModelButton(): HTMLButtonElement {
		return this._shadow.getElementById("clearModelButton") as HTMLButtonElement;
	}

	get addTestStlButton(): HTMLButtonElement {
		return this._shadow.getElementById("addTestStlButton") as HTMLButtonElement;
	}

	get addTestCylinderButton(): HTMLButtonElement {
		return this._shadow.getElementById(
			"addTestCylinderButton",
		) as HTMLButtonElement;
	}

	// -- Lifecycle --

	connectedCallback() {
		this.setupDropdownLogic();
		this.setupFileInputDropdownClose();
		this.setupMenuActions();
		this.setupKeyboardNavigation();
	}

	// -- Internal logic --

	private setupDropdownLogic() {
		const nav = this._shadow.getElementById("menuBar") as HTMLElement;
		const dropdowns = this._shadow.querySelectorAll(
			".menuBarDropdown",
		) as NodeListOf<HTMLElement>;

		nav.addEventListener("click", (evt) => {
			const target = evt.target as HTMLElement;

			// Don't close dropdowns when clicking the file input label —
			// the browser needs the input visible to open the file picker.
			if (target.closest(".fileInputLabel")) {
				return;
			}

			for (const dropdown of dropdowns) {
				if (dropdown !== target.nextElementSibling) {
					dropdown.classList.remove("show");
				}
			}

			if (
				target.matches(".menuBarButton") &&
				!target.classList.contains("noDropdown")
			) {
				const nextSibling = target.nextElementSibling as HTMLElement;
				nextSibling.classList.toggle("show");
			}
		});

		// Close dropdowns when clicking outside
		window.addEventListener("click", (evt) => {
			const path = evt.composedPath();
			if (!path.includes(this)) {
				for (const dropdown of dropdowns) {
					dropdown.classList.remove("show");
				}
			}
		});
	}

	private closeAllDropdowns() {
		const dropdowns = this._shadow.querySelectorAll(
			".menuBarDropdown",
		) as NodeListOf<HTMLElement>;
		for (const dropdown of dropdowns) {
			dropdown.classList.remove("show");
		}
	}

	private setupFileInputDropdownClose() {
		this.fileInput?.addEventListener("change", () => {
			this.closeAllDropdowns();
		});
	}

	private setupMenuActions() {
		const dispatch = (name: string) => {
			this.closeAllDropdowns();
			this.dispatchEvent(new CustomEvent(name, { bubbles: true }));
		};

		this._shadow
			.getElementById("addMaterialProfile")
			?.addEventListener("click", () => dispatch("menu-add-material-profile"));

		this._shadow
			.getElementById("editActiveMaterialProfile")
			?.addEventListener("click", () => dispatch("menu-edit-material-profile"));

		this._shadow
			.getElementById("deleteMaterialProfile")
			?.addEventListener("click", () =>
				dispatch("menu-delete-material-profile"),
			);

		this._shadow
			.getElementById("helpButton")
			?.addEventListener("click", () => dispatch("menu-help"));

		this._shadow
			.getElementById("activateInfoDialog")
			?.addEventListener("click", () => dispatch("menu-info"));

		this._shadow
			.getElementById("activateSettingsDialog")
			?.addEventListener("click", () => dispatch("menu-settings"));
	}

	private setupKeyboardNavigation() {
		const nav = this._shadow.getElementById("menuBar") as HTMLElement;
		const topLevelButtons = nav.querySelectorAll(
			":scope > div:first-child > .menuBarButtonContainer > .menuBarButton, :scope > div:first-child > .menuBarButton",
		) as NodeListOf<HTMLElement>;

		nav.addEventListener("keydown", (evt) => {
			const target = evt.target as HTMLElement;

			// Find the open dropdown, if any
			const openDropdown = this._shadow.querySelector(
				".menuBarDropdown.show",
			) as HTMLElement | null;

			if (evt.key === "Escape") {
				this.closeAllDropdowns();
				// Focus the parent top-level button
				const container = target.closest(".menuBarButtonContainer");
				if (container) {
					(container.querySelector(".menuBarButton") as HTMLElement)?.focus();
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
				// Open dropdown and focus first item
				if (
					target.matches(".menuBarButton") &&
					!target.classList.contains("noDropdown")
				) {
					evt.preventDefault();
					const dropdown = target.nextElementSibling as HTMLElement;
					this.closeAllDropdowns();
					dropdown.classList.add("show");
					const firstItem = dropdown.querySelector(
						"button.menuBarDropdownButton, label.menuBarDropdownButton",
					) as HTMLElement | null;
					firstItem?.focus();
				}
			}
		});
	}

	// -- Static template & styles --

	private static get template() {
		return `
			<div id="menuBar">
				<h1><a href="/" aria-label="ProvelPrint - Return to home page">ProvelPrint</a></h1>

				<div class="menuBarButtonContainer">
					<button role="menuitem" aria-haspopup="true" class="menuBarButton" type="button">File</button>
					<div class="menuBarDropdown" role="menu">
						<label class="menuBarDropdownButton fileInputLabel" for="stlFileInput" id="stlFileInputLabel" tabindex="0">
							Open STL file
							<input role="menuitem" type="file" accept=".stl" id="stlFileInput" name="stlFileInput" class="fileInput" />
						</label>
						<button role="menuitem" class="menuBarDropdownButton" id="clearModelButton" type="button">Clear model</button>
						<button role="menuitem" class="menuBarDropdownButton" id="addTestStlButton" type="button">Load Test Socket STL</button>
						<button role="menuitem" class="menuBarDropdownButton" id="addTestCylinderButton" type="button">Load Test Cylinder STL</button>
					</div>
				</div>

				<div class="menuBarButtonContainer">
					<button role="menuitem" aria-haspopup="true" class="menuBarButton" type="button">Edit</button>
					<div class="menuBarDropdown" role="menu">
						<button role="menuitem" class="menuBarDropdownButton" id="addMaterialProfile" type="button">Add Material Profile</button>
						<button role="menuitem" class="menuBarDropdownButton" id="editActiveMaterialProfile" type="button">Edit Active Material Profile</button>
						<button role="menuitem" class="menuBarDropdownButton" id="deleteMaterialProfile" type="button">Delete Active Material Profile</button>
					</div>
				</div>

				<button role="menuitem" class="menuBarButton noDropdown" id="helpButton" type="button">Help</button>
				<button role="menuitem" class="menuBarButton noDropdown" id="activateInfoDialog" type="button">Info</button>
			</div>

			<div>
				<button role="menuitem" id="activateSettingsDialog" class="menuBarButton noDropdown" type="button" aria-label="Settings">
					${SETTINGS_ICON_SVG}
				</button>
			</div>
		`;
	}

	private static get styles() {
		return `
			:host {
				display: flex;
				justify-content: space-between;
				width: 100%;
				background-color: var(--bg-menu);
				padding: 0 var(--spacing-lg);
			}

			#menuBar {
				display: flex;
				align-items: center;
				height: var(--menu-bar-height);
			}

			.show {
				display: block !important;
			}

			h1 {
				color: var(--text-primary);
				font-size: var(--font-size-2xl);
				font-weight: 600;
				margin-right: var(--spacing-lg);

				& a {
					color: inherit;
					text-decoration: none;
				}
			}

			#activateSettingsDialog {
				color: #e5e5e5;

				&:hover {
					color: #010101;
					transition: color var(--transition-slow);
				}
			}

			@media (prefers-color-scheme: dark) {
				#activateSettingsDialog {
					color: #4f4f4f;

					&:hover {
						color: var(--text-primary);
						transition: color var(--transition-slow);
					}
				}
			}

			.menuBarButton {
				text-align: center;
				vertical-align: middle;
				line-height: 1.2;
				display: block;
				color: var(--text-primary);
				border: none;
				background-color: transparent;
				cursor: pointer;
				text-decoration: none;
				transition: color var(--transition-normal);
				box-shadow: none;
				font-family: inherit;
				font-size: var(--font-size-sm);
				font-weight: 500;
				padding: 8px 16px;

				&:hover,
				&:focus {
					color: var(--accent-color);
					text-decoration: underline;
					text-underline-offset: 3px;
				}

				&:focus {
					outline: 2px solid var(--accent-color);
					outline-offset: 2px;
				}
			}

			.menuBarButtonContainer {
				position: relative;

				& .menuBarDropdown {
					display: none;
					z-index: var(--z-dropdown);
					background-color: var(--bg-menu);
					padding: 8px var(--spacing-xs);
					box-shadow: var(--shadow-dropdown);
					border-radius: var(--radius-sm);
					position: absolute;
					left: 0;
					top: var(--menu-bar-height);
				}
			}

			.menuBarDropdownButton {
				background: none;
				border: none;
				box-shadow: none;
				color: var(--text-primary);
				padding: var(--spacing-xs);
				text-decoration: none;
				display: block;
				white-space: nowrap;
				transition: color var(--transition-normal);
				font-family: inherit;
				font-size: var(--font-size-sm);

				&:hover,
				&:focus {
					color: var(--accent-color);
					text-decoration: underline;
					text-underline-offset: 3px;
					cursor: pointer;
				}

				&:focus {
					outline: 2px solid var(--accent-color);
					outline-offset: 2px;
				}
			}

			.fileInputLabel {
				white-space: nowrap;

				& > .fileInput {
					display: none;
				}
			}
		`;
	}
}

customElements.define("menu-bar", MenuBar);
