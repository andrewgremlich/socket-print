# Socket Print (Provel Print) - Claude Project File

## Project Overview

Socket Print (Product name: Provel Print) is a CAD-like web application for faster turnaround times for amputees to receive 3D-printed prosthetic sockets. It combines real-time 3D visualization, computational geometry, and G-code generation for pellet extrusion 3D printing systems.

**Repository**: https://github.com/andrewgremlich/socket-print

## Tech Stack

- **TypeScript** + **Vite** — Frontend build
- **Three.js** + **three-mesh-bvh** — 3D graphics and optimized ray casting
- **Dexie** — IndexedDB wrapper for persistence
- **Web Components** — Custom UI elements (Shadow DOM)
- **Vitest** — Unit testing
- **Biome** — Linting and formatting
- **LightningCSS** — CSS transformation

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (localhost:4200)
npm run build            # Production build
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run check            # TypeScript check + Biome formatting
```

## Architecture

See `.claude/docs/` for detailed reference:
- `.claude/docs/architecture.md` — Full file listings, project structure, data flow
- `.claude/docs/gcode-pipeline.md` — G-code generation pipeline details
- `.claude/docs/database-schema.md` — Dexie schema and type definitions

### Key Entry Points

- `index.html` → `src/renderer.ts` → `src/classes/Application.ts`
- Slicing: `src/3d/sliceWorker.ts` (Web Worker)
- G-code: `src/3d/generateGCode.ts`

### Core Flow

1. User loads STL → `PrintObject` parses → stored in IndexedDB → mesh in 3D scene
2. User manipulates position/rotation → stored in IndexedDB → scene updates
3. Web Worker slices model via ray casting → main thread generates G-code
4. G-code sent to file or printer over network

## Code Style

- Prefer simple solutions over over-engineering
- Only add features/refactors when explicitly requested
- Delete unused code completely (no backwards-compatibility hacks)
- Use Biome for formatting and linting

## Important Constraints

### Security
- Avoid command injection, XSS, SQL injection
- Validate user input at system boundaries
- Trust internal code and framework guarantees

### 3D Graphics Performance
- Uses BVH for optimized ray casting
- Web Worker for slicing to avoid blocking UI
- Mesh updates are reactive based on form changes
- Always `dispose()` geometries, materials, and textures when removing from scene

### Testing
- Use Vitest for unit tests
- Tests should focus on critical geometry and G-code generation logic
- See existing tests for style reference

### Material Profiles
- Define nozzle temp, cup temp, shrink factor, output factor
- Stored in IndexedDB for persistence

## Claude Code Configuration

### Auto-Invoked Skills (`.claude/skills/`)
Trigger automatically based on what files are being modified. See individual skill files for details.

### User Commands (`.claude/commands/`)
- `/code-cleanup` — Refactor and clean up code
- `/new-component` — Scaffold a new web component
- `/perf-check` — Analyze performance bottlenecks

### Agents (`.claude/agents/`)
Specialized subagents for code review, G-code validation, geometry analysis, accessibility auditing, and test writing.

### MCP Servers (`.claude/mcp.json`)
- **context7** — Up-to-date documentation and code examples for libraries/frameworks
