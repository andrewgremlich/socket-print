# Socket Print Development Guidelines

## Testing
- Always use **Vitest** for test files
- Test files should be co-located with source files (e.g., `MyClass.test.ts` next to `MyClass.ts`)
- Run tests with `npm run test` or `npm run test:watch`

## Code Style
- Always use **async/await** when generating asynchronous code
- Always use **ES modules** (`import`/`export`), never CommonJS (`require`/`module.exports`)
- When using a predicate function callback, use an **arrow function** (not an anonymous function)
- Use **Biome** for formatting and linting (run `npm run check`)

## Project-Specific Patterns

### Three.js & 3D
- Use `Vector3` from Three.js for 3D points
- Use BVH (Bounding Volume Hierarchy) for optimized ray casting via `three-mesh-bvh`
- Heavy computations (slicing) should run in Web Workers
- ThreeJs uses a Y-up coordinate system; convert to Z-up for G-code generation

### Database (Dexie/IndexedDB)
- All database operations are async - use `await`
- Import DB actions from `@/db/*DbActions` files
- Use path aliases: `@/` maps to `src/`

### G-Code Generation
- Extrusion calculations use material profile settings (density, gramsPerRevolution, outputFactor)
- Feedrate is calculated per layer based on seconds per layer setting
- Use `mathjs.floor()` for rounding G-code coordinates

### Web Components
- Custom elements should extend `HTMLElement`
- Use Shadow DOM for encapsulation
- Register with `customElements.define()`

## Path Aliases
- `@/` → `src/`
- `pkg` → `package.json` (for version info)

## Key Files to Know
- `src/renderer.ts` - Main application entry point
- `src/3d/generateGCode.ts` - G-code generation logic
- `src/3d/sliceWorker.ts` - Web Worker for model slicing
- `src/classes/PrintObject.ts` - STL model handling
- `src/db/types.ts` - TypeScript type definitions for database entities
