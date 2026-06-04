const SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

export class MenuBar extends HTMLElement {
	#shadow: ShadowRoot;

	constructor() {
		super();
		this.#shadow = this.attachShadow({ mode: "open" });
		this.#shadow.innerHTML = `
			<style>${MenuBar.styles}</style>
			${MenuBar.template}
		`;
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

	// -- Static template & styles --

	static get template() {
		return `
			<div id="menuBar">
				<h1><a href="/" aria-label="ProvelPrint - Return to home page">ProvelPrint</a></h1>

				<div class="menuBarButtonContainer">
					<button role="menuitem" aria-haspopup="true" class="menuBarButton" type="button" popovertarget="fileDropdown" style="anchor-name: --file-trigger">File</button>
					<div id="fileDropdown" class="menuBarDropdown" popover role="menu" style="position-anchor: --file-trigger">
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
					<button role="menuitem" aria-haspopup="true" class="menuBarButton" type="button" popovertarget="editDropdown" style="anchor-name: --edit-trigger">Edit</button>
					<div id="editDropdown" class="menuBarDropdown" popover role="menu" style="position-anchor: --edit-trigger">
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

	static get styles() {
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

			.menuBarDropdown {
				z-index: var(--z-dropdown);
				background-color: var(--bg-menu);
				padding: 8px var(--spacing-xs);
				box-shadow: var(--shadow-dropdown);
				border-radius: var(--radius-sm);
				position: absolute;
				margin: 0;
				border: none;
				inset: unset;
				top: anchor(bottom);
				left: anchor(left);
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

			@keyframes fade-in {
				from {
					opacity: 0;
					transform: translateY(-5px);
				}

				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
		`;
	}
}

customElements.define("menu-bar", MenuBar);
