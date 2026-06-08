# Architecture & File Reference

## Project Structure

```
socket-print/
├── .claude/                 # Claude Code configuration
│   ├── agents/              # Agent-specific instructions
│   ├── commands/            # User-invokable commands
│   ├── skills/              # Auto-invokable skills
│   └── docs/                # Detailed reference docs
├── .mcp.json                # MCP server configuration (repo root)
├── src/                     # Frontend TypeScript source
│   ├── 3d/                  # 3D geometry & G-code generation
│   ├── classes/             # Core object classes
│   ├── db/                  # Database & persistence layer
│   ├── utils/               # Utility functions & helpers
│   ├── web-components/      # Custom HTML elements
│   ├── renderer.ts          # Main app entry point
│   ├── help-renderer.ts     # help.html entry point
│   └── license-renderer.ts  # licenses.html entry point
├── public/                  # Static assets (STL samples, fonts, icons, sw-template.js)
├── deno_scripts/            # Deno-based helper scripts (e.g. mock-printer)
├── index.html               # Main app page
├── help.html                # Help documentation page
├── licenses.html            # Third-party licenses page
├── vite.config.ts           # Vite build config
└── vite-sw-plugin.ts        # Service worker build plugin
```

## Key Files

### Entry Points
- `index.html` — Main application entry
- `src/renderer.ts` — Application initialization
- `src/help-renderer.ts` — Help page entry
- `src/license-renderer.ts` — Licenses page entry
- `src/classes/Application.ts` — Three.js scene manager

### Core Classes
- `src/classes/AppObject.ts` — Base class for 3D objects
- `src/classes/PrintObject.ts` — STL model handling
- `src/classes/PrintObjectEventManager.ts` — Event management for print objects
- `src/classes/SocketCup.ts` — Prosthetic socket cup geometry
- `src/classes/TestCylinder.ts` — Test cylinder
- `src/classes/CupToSocketTransition.ts` — Cup-to-socket transition geometry with fit validation
- `src/classes/CollisionDetector.ts` — Collision detection between objects
- `src/classes/MeshTransformController.ts` — Mesh transformation controls
- `src/classes/DebugPoint.ts` — Debug visualization helper
- `src/classes/types.ts` — Class-level TypeScript types

### 3D Processing
- `src/3d/generateGCode.ts` — G-code generation
- `src/3d/sliceWorker.ts` — Model slicing Web Worker (vase + jacket modes)
- `src/3d/generateOffsetWithNormal.ts` — Mesh offset along normals
- `src/3d/blendHardEdges.ts` — Edge smoothing
- `src/3d/calculateDistancePerLevel.ts` — Per-layer distance and feedrate calculation
- `src/3d/calculatePrintTime.ts` — Estimated print time
- `src/3d/printerApi.ts` — Duet/RepRapFirmware HTTP client (connect, board info, firmware update, sendGCodeFile)
- `src/3d/ensureUV.ts` — Ensure UV coordinates on geometry

### Database
- `src/db/db.ts` — Dexie database setup
- `src/db/store.ts` — Database initialization
- `src/db/types.ts` — TypeScript type definitions
- `src/db/dbDefaults.ts` — Seed values
- `src/db/appendMaterialProfiles.ts` — Material profile seeding
- `src/db/loadDataIntoForms.ts` — Populate UI forms from DB
- `src/db/file.ts` — STL file CRUD
- `src/db/appSettingsDbActions.ts` — App settings getters/setters
- `src/db/formValuesDbActions.ts` — Form value getters/setters
- `src/db/materialProfilesDbActions.ts` — Material profile getters/setters

### Utilities
- `src/utils/globalEvents.ts` — Global event handlers
- `src/utils/htmlElements.ts` — DOM references
- `src/utils/handlePrinterConnection.ts` — Printer connection handler
- `src/utils/cupTransitionLayer.ts` — Cup transition layer geometry helpers
- `src/utils/getExtrusionCalculation.ts` — Extrusion volume calculation
- `src/utils/constants.ts` — Shared constants (e.g. NOZZLE_SIZE_OFFSET_FACTOR)
- `src/utils/meshTransforms.ts` — Mesh transformation utilities
- `src/utils/stlLoader.ts` — STL file loading helpers
- `src/utils/getRadialSegments.ts` — Radial segment calculation
- `src/utils/printObject.ts` — Print object utilities
- `src/utils/printObjectEvents.ts` — Print object event helpers
- `src/utils/logInterceptor.ts` — Wraps console.* so the Settings dialog can download a log file

### Web Components (`src/web-components/`)
- `index.ts` — Registers all custom elements
- `AppInput.ts` — Labelled input wrapper
- `Dialog.ts`, `DialogStyle.ts` — Base modal dialog
- `Info.ts` — Info banner
- `MaterialProfileForm.ts` — Material profile editor
- `MenuBar.ts` — Top menu bar
- `OfflineIndicator.ts` — Online/offline status pill
- `ProgressBar.ts` — Slicing progress bar
- `Settings.ts` — Settings dialog (theme, GCode factors, firmware update)
- `UpdateNotification.ts` — Service worker update toast

## Core Application Flow

1. **Model Loading** — User loads STL → `PrintObject` parses via STLLoader → stored in IndexedDB → mesh added to scene
2. **3D Manipulation** — User modifies position/rotation → changes stored in IndexedDB → scene updates in real-time
3. **Slicing & G-code** — Web Worker (`sliceWorker.ts`) ray casts to slice model → main thread calculates feedrate/extrusion → generates G-code
4. **Output** — G-code sent to file (download) or printer (network via `printerApi.sendGCodeFile`)

## Data Persistence (IndexedDB via Dexie)

- **formValues** — User input (IP, cup size, nozzle size, layer height); stored as key/value rows
- **appSettings** — App state (rotations, translations, lock position, etc.); stored as key/value rows
- **materialProfiles** — Material definitions (object rows)
- **savedFiles** — Uploaded STL files (object rows)

See `database-schema.md` for the full schema.
