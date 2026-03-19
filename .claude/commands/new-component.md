---
description: Scaffold a new web component following project patterns
---

Create a new web component named `$ARGUMENTS` following the existing project patterns.

## Project Conventions

Web components in this project follow these patterns:

### File Structure
- Each component lives in `src/web-components/<ComponentName>/index.ts`
- Components are registered in `src/web-components/index.ts` via a side-effect import
- Dialog-based components extend the `Dialog` base class from `src/web-components/Dialog/`
- Standalone components extend `HTMLElement` directly

### Component Pattern (standalone)
```typescript
class ComponentName extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // Clean up event listeners
  }

  private render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Scoped styles */
      </style>
      <div>
        <!-- Component markup -->
      </div>
    `;
  }
}

customElements.define("component-name", ComponentName);
```

### Component Pattern (dialog-based)
```typescript
import { Dialog } from "../Dialog";

export class ComponentName extends Dialog {
  constructor() {
    super();
    this.id = "componentNameDialog";
    this.attachHTML`
      <dialog id="${this.id}" aria-labelledby="componentTitle">
        <h3 id="componentTitle">Title</h3>
        <!-- Dialog content -->
      </dialog>
    `;
  }
}

customElements.define("component-name", ComponentName);
```

## Steps

1. Determine if the component should be standalone or dialog-based
2. Create `src/web-components/<ComponentName>/index.ts` using the appropriate pattern
3. Add the import to `src/web-components/index.ts`
4. Include proper accessibility attributes (aria-labels, roles, semantic HTML)
5. Use Shadow DOM with scoped styles
6. Clean up event listeners in `disconnectedCallback`
