# Socket Print (Provel Print) - Claude Project File

## Project Overview

Socket Print (Product name: Provel Print) is a CAD-like desktop application designed to facilitate faster turnaround times for amputees to receive 3D-printed prosthetic sockets for residual limbs. It combines real-time 3D visualization, computational geometry, and G-code generation for pellet extrusion 3D printing systems.

**Repository**: https://github.com/andrewgremlich/socket-print
**Version**: 1.18.5
**License**: MIT

## Key Features

- Load and modify prosthetic socket STL files
- Real-time 3D visualization with Three.js
- Apply 3D transformations (rotation, translation)
- Generate G-code files for 3D printers
- Connect to compatible 3D printers for direct printing
- Material profile management
- Offline-first capability with service workers
- Cross-platform desktop app via Tauri

## Tech Stack

### Frontend
- **TypeScript** 5.9.3 - Type-safe language
- **Vite** 7.3.1 - Build tool and dev server
- **Three.js** 0.183.0 - 3D graphics library
- **three-mesh-bvh** 0.9.8 - Optimized ray casting
- **Dexie** 4.3.0 - IndexedDB wrapper
- **Web Components** - Custom UI elements
- **mathjs** 15.1.1 - Mathematical functions
- **hotkeys-js** 4.0.0 - Keyboard shortcuts
- **Lucide** 0.575.0 - Icon library
- **validator** 13.15.26 - Input validation
- **crc-32** 1.2.2 - CRC32 checksum

### Desktop Framework
- **Tauri** 2.x - Cross-platform native app (Rust backend)
- **Tauri Plugins**: dialog, fs, log, updater, process

### Build & Styling
- **LightningCSS** 1.31.1 - CSS transformation

### Testing & Quality
- **Vitest** 4.0.18 - Unit testing
- **Biome** 2.4.3 - Linting and formatting

## Project Structure

```
socket-print/
├── src/                      # Frontend TypeScript source
│   ├── 3d/                  # 3D geometry & G-code generation
│   │   ├── generateGCode.ts # G-code output generation
│   │   ├── sliceWorker.ts   # Web Worker for model slicing
│   │   └── ...              # Other 3D utilities
│   ├── classes/             # Core object classes
│   │   ├── Application.ts   # Main 3D scene manager
│   │   ├── PrintObject.ts   # Loaded STL model wrapper
│   │   ├── SocketCup.ts     # Prosthetic socket cup geometry
│   │   └── ...              # Other classes
│   ├── db/                  # Database & persistence layer
│   │   ├── db.ts           # Dexie database setup
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── ...             # DB actions and utilities
│   ├── utils/              # Utility functions & helpers
│   ├── web-components/     # Custom HTML elements
│   │   ├── Settings/       # Settings dialog
│   │   ├── MaterialProfileForm/
│   │   └── ...
│   └── renderer.ts         # Main app entry point
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs         # Tauri app setup & commands
│   │   └── printer.rs     # Printer interface
│   └── tauri.conf.json    # Tauri configuration
├── public/                 # Static assets
├── index.html             # Main app page
├── help.html              # Help documentation page
├── licenses.html          # Third-party licenses page
└── vite.config.ts         # Vite build config
```

## Development Commands

```bash
# Setup
npm install              # Install dependencies
npm run prepare         # Setup git hooks

# Development
npm run dev             # Start dev server (localhost:4200)
npm run dev:web         # Vite dev server

# Building
npm run build           # Production build
npm run build:tauri     # Build Tauri desktop app
npm run preview         # Preview build (localhost:4300)

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run check           # TypeScript check + Biome formatting
npm run clean           # Remove build artifacts
```

## Architecture & Workflow

### Core Application Flow

1. **Model Loading**
   - User loads STL file via file input
   - `PrintObject` class parses STL using Three.js STLLoader
   - Model stored in IndexedDB
   - Mesh added to 3D scene

2. **3D Manipulation**
   - User modifies position (X, Y, Z translation)
   - User applies rotations (Coronal, Sagittal, Transverse)
   - Changes stored in IndexedDB `appSettings`
   - 3D scene updates in real-time

3. **Slicing & G-code Generation**
   - Web Worker (`sliceWorker.ts`) performs ray casting to slice model
   - Collects 2D contours at each layer height
   - Main thread calculates feedrate and extrusion
   - Generates G-code output

4. **Output**
   - G-code sent to file (download) or printer (network)
   - Material profiles define temp, density, extrusion factors

### Data Persistence (IndexedDB)

- **formValues**: User input (IP, cup size, nozzle size, layer height)
- **appSettings**: App state (rotations, translations, lock position)
- **materialProfiles**: Printer material definitions
- **savedFiles**: Uploaded STL files

## Key Files

### Entry Points
- [index.html](index.html) - Main application entry
- [src/renderer.ts](src/renderer.ts) - Application initialization
- [src/classes/Application.ts](src/classes/Application.ts) - Three.js scene manager

### Core Classes
- [src/classes/AppObject.ts](src/classes/AppObject.ts) - Base class for 3D objects
- [src/classes/PrintObject.ts](src/classes/PrintObject.ts) - STL model handling
- [src/classes/PrintObjectEventManager.ts](src/classes/PrintObjectEventManager.ts) - Event management for print objects
- [src/classes/SocketCup.ts](src/classes/SocketCup.ts) - Prosthetic socket cup geometry
- [src/classes/TestCylinder.ts](src/classes/TestCylinder.ts) - Test cylinder
- [src/classes/CupToSocketTransition.ts](src/classes/CupToSocketTransition.ts) - Cup-to-socket transition geometry with fit validation
- [src/classes/CollisionDetector.ts](src/classes/CollisionDetector.ts) - Collision detection between objects
- [src/classes/MeshTransformController.ts](src/classes/MeshTransformController.ts) - Mesh transformation controls
- [src/classes/DebugPoint.ts](src/classes/DebugPoint.ts) - Debug visualization helper
- [src/classes/types.ts](src/classes/types.ts) - Class-level TypeScript types

### 3D Processing
- [src/3d/generateGCode.ts](src/3d/generateGCode.ts) - G-code generation
- [src/3d/sliceWorker.ts](src/3d/sliceWorker.ts) - Model slicing worker
- [src/3d/generateOffsetWithNormal.ts](src/3d/generateOffsetWithNormal.ts) - Mesh offset
- [src/3d/blendHardEdges.ts](src/3d/blendHardEdges.ts) - Edge smoothing
- [src/3d/calculateDistancePerLevel.ts](src/3d/calculateDistancePerLevel.ts) - Per-layer distance calculation
- [src/3d/calculatePrintTime.ts](src/3d/calculatePrintTime.ts) - Estimated print time
- [src/3d/sendGCodeFile.ts](src/3d/sendGCodeFile.ts) - Send G-code to printer over network
- [src/3d/ensureUV.ts](src/3d/ensureUV.ts) - Ensure UV coordinates on geometry

### Database
- [src/db/db.ts](src/db/db.ts) - Dexie database setup
- [src/db/store.ts](src/db/store.ts) - Database initialization
- [src/db/types.ts](src/db/types.ts) - TypeScript type definitions

### Utilities
- [src/utils/globalEvents.ts](src/utils/globalEvents.ts) - Global event handlers
- [src/utils/htmlElements.ts](src/utils/htmlElements.ts) - DOM references
- [src/utils/handlePrinterConnection.ts](src/utils/handlePrinterConnection.ts) - Printer connection
- [src/utils/cupTransitionLayer.ts](src/utils/cupTransitionLayer.ts) - Cup transition layer geometry helpers
- [src/utils/getExtrusionCalculation.ts](src/utils/getExtrusionCalculation.ts) - Extrusion volume calculation
- [src/utils/constants.ts](src/utils/constants.ts) - Shared constants (e.g. NOZZLE_SIZE_OFFSET_FACTOR)
- [src/utils/meshTransforms.ts](src/utils/meshTransforms.ts) - Mesh transformation utilities
- [src/utils/stlLoader.ts](src/utils/stlLoader.ts) - STL file loading helpers
- [src/utils/updater.ts](src/utils/updater.ts) - Tauri app updater integration
- [src/utils/getRadialSegments.ts](src/utils/getRadialSegments.ts) - Radial segment calculation
- [src/utils/printObject.ts](src/utils/printObject.ts) - Print object utilities
- [src/utils/printObjectEvents.ts](src/utils/printObjectEvents.ts) - Print object event helpers

## Important Notes

### Security Considerations
- Avoid command injection, XSS, SQL injection
- Validate user input at system boundaries
- Trust internal code and framework guarantees

### Code Style
- Prefer simple solutions over over-engineering
- Only add features/refactors when explicitly requested
- Delete unused code completely (no backwards-compatibility hacks)
- Use Biome for formatting and linting

### 3D Graphics Performance
- Uses BVH (Bounding Volume Hierarchy) for optimized ray casting
- Web Worker for slicing to avoid blocking UI
- Mesh updates are reactive based on form changes

### Material Profiles
- Define nozzle temp, cup temp, shrink factor, output factor
- Support for various 3D printing materials
- Stored in IndexedDB for persistence

### Testing
- Use Vitest for unit tests
- Test coverage available via `npm run test:coverage`
- Tests should focus on critical geometry and G-code generation logic

## Recent Changes (v1.18.x)

- **v1.18.5**: Current version (see git log for details)
- **v1.16.1**: Theme selector, test improvements, build bug fixes
- **v1.16.0**: Accurate socket cup geometry, CSS design system with light/dark theme support, comprehensive accessibility updates
- **v1.15.7**: Fix rotation save/restore to use actual mesh Euler angles
- **v1.15.x**: Wireframe visualization, UAT fixes, service worker improvements, collision detection

## G-Code Generation Pipeline

The G-code generation system (`src/3d/generateGCode.ts`) is a critical component:

1. **Header Generation** (`generateGCodeHeader`): Creates metadata and startup sequence
   - Sets temperatures for nozzle and cup heater
   - Includes cup heater removal sequence
   - Primes extruder before printing

2. **Transition Layer**: Generates circular transition from cup to socket
   - Uses `getCirclePoints()` and `getTransitionLayer()` from cupTransitionLayer utils

3. **Layer-by-Layer Extrusion**: Iterates through sliced point data
   - Calculates extrusion amount using `getExtrusionCalculation()`
   - Applies feedrate per level from slicing worker

4. **End Sequence**: Handles print completion (purge, cooldown, end macro)

## Key Constants & Calculations

- **NOZZLE_SIZE_OFFSET_FACTOR**: 2 (used for calculating nozzle offset)
- **Shrink Scale**: `1 / (1 - shrinkFactor / 100)` - compensates for material shrinkage
- **Extrusion**: Based on distance, layer height, line width, material density, and output factor

## Database Schema (Dexie v21)

Four main tables:
- **formValues**: IP address, lock position (left/right), cup size, nozzle size, layer height, active material profile
- **appSettings**: Lock depth, circularSegments, translations (X/Y/Z), rotations (coronal/sagittal/transverse), startingCupLayerHeight, lineWidthAdjustment, testCylinderHeight, testCylinderInnerDiameter, seconds per layer, E per revolution
- **materialProfiles**: Name, nozzle temp, cup temp, shrink factor, output factor, grams per revolution, density
- **savedFiles**: Name, type (Socket/TestCylinder), file blob

## Print Object Types

```typescript
enum PrintObjectType {
  TestCylinder = "TestCylinder",
  Socket = "Socket",
}
```

## Cup Size Configuration

```typescript
type CupSize = {
  innerDiameter: number;
  outerDiameter: number;
  height: number;
  name: string;
};
```
