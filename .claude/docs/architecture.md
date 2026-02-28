# Architecture & File Reference

## Project Structure

```
socket-print/
├── .claude/                 # Claude Code configuration
│   ├── agents/             # Agent-specific instructions
│   ├── commands/           # User-invokable commands
│   ├── skills/             # Auto-invokable skills
│   ├── docs/               # Detailed reference docs
│   ├── agent-memory/       # Agent conversation history
│   ├── mcp.json            # MCP server configuration
│   └── settings.local.json # Local Claude settings
├── src/                      # Frontend TypeScript source
│   ├── 3d/                  # 3D geometry & G-code generation
│   ├── classes/             # Core object classes
│   ├── db/                  # Database & persistence layer
│   ├── utils/              # Utility functions & helpers
│   ├── web-components/     # Custom HTML elements
│   └── renderer.ts         # Main app entry point
├── public/                 # Static assets
├── index.html             # Main app page
├── help.html              # Help documentation page
├── licenses.html          # Third-party licenses page
└── vite.config.ts         # Vite build config
```

## Key Files

### Entry Points
- `index.html` - Main application entry
- `src/renderer.ts` - Application initialization
- `src/classes/Application.ts` - Three.js scene manager

### Core Classes
- `src/classes/AppObject.ts` - Base class for 3D objects
- `src/classes/PrintObject.ts` - STL model handling
- `src/classes/PrintObjectEventManager.ts` - Event management for print objects
- `src/classes/SocketCup.ts` - Prosthetic socket cup geometry
- `src/classes/TestCylinder.ts` - Test cylinder
- `src/classes/CupToSocketTransition.ts` - Cup-to-socket transition geometry with fit validation
- `src/classes/CollisionDetector.ts` - Collision detection between objects
- `src/classes/MeshTransformController.ts` - Mesh transformation controls
- `src/classes/DebugPoint.ts` - Debug visualization helper
- `src/classes/types.ts` - Class-level TypeScript types

### 3D Processing
- `src/3d/generateGCode.ts` - G-code generation
- `src/3d/sliceWorker.ts` - Model slicing worker
- `src/3d/generateOffsetWithNormal.ts` - Mesh offset
- `src/3d/blendHardEdges.ts` - Edge smoothing
- `src/3d/calculateDistancePerLevel.ts` - Per-layer distance calculation
- `src/3d/calculatePrintTime.ts` - Estimated print time
- `src/3d/sendGCodeFile.ts` - Send G-code to printer over network
- `src/3d/ensureUV.ts` - Ensure UV coordinates on geometry

### Database
- `src/db/db.ts` - Dexie database setup
- `src/db/store.ts` - Database initialization
- `src/db/types.ts` - TypeScript type definitions

### Utilities
- `src/utils/globalEvents.ts` - Global event handlers
- `src/utils/htmlElements.ts` - DOM references
- `src/utils/handlePrinterConnection.ts` - Printer connection
- `src/utils/cupTransitionLayer.ts` - Cup transition layer geometry helpers
- `src/utils/getExtrusionCalculation.ts` - Extrusion volume calculation
- `src/utils/constants.ts` - Shared constants (e.g. NOZZLE_SIZE_OFFSET_FACTOR)
- `src/utils/meshTransforms.ts` - Mesh transformation utilities
- `src/utils/stlLoader.ts` - STL file loading helpers
- `src/utils/getRadialSegments.ts` - Radial segment calculation
- `src/utils/printObject.ts` - Print object utilities
- `src/utils/printObjectEvents.ts` - Print object event helpers

## Core Application Flow

1. **Model Loading** - User loads STL → `PrintObject` parses via STLLoader → stored in IndexedDB → mesh added to scene
2. **3D Manipulation** - User modifies position/rotation → changes stored in IndexedDB → scene updates in real-time
3. **Slicing & G-code** - Web Worker (`sliceWorker.ts`) ray casts to slice model → main thread calculates feedrate/extrusion → generates G-code
4. **Output** - G-code sent to file (download) or printer (network)

## Data Persistence (IndexedDB via Dexie)

- **formValues**: User input (IP, cup size, nozzle size, layer height)
- **appSettings**: App state (rotations, translations, lock position)
- **materialProfiles**: Printer material definitions
- **savedFiles**: Uploaded STL files
