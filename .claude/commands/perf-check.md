---
description: Analyze 3D rendering and slicing performance bottlenecks
---

Analyze the codebase for performance bottlenecks in 3D rendering, model slicing, and G-code generation.

## Areas to Analyze

### Three.js Rendering (`src/classes/`)
- Check for unnecessary re-renders or geometry rebuilds
- Verify BVH (three-mesh-bvh) is used effectively for ray casting
- Look for memory leaks (undisposed geometries, materials, textures)
- Check if `dispose()` is called properly when objects are removed
- Identify any blocking operations on the main thread

### Slicing Worker (`src/3d/sliceWorker.ts`)
- Check ray casting efficiency and BVH usage
- Look for redundant calculations in the slicing loop
- Verify data transfer between main thread and worker is minimal (avoid copying large arrays unnecessarily)
- Check if Transferable objects are used where appropriate

### G-code Generation (`src/3d/generateGCode.ts`)
- Look for string concatenation in loops (prefer array join)
- Check for unnecessary object allocations in hot paths
- Verify math operations are optimized (avoid repeated calculations)

### IndexedDB (`src/db/`)
- Check for excessive read/write operations
- Look for missing batch operations where multiple records are updated
- Verify Dexie transactions are used appropriately

### General
- Identify any synchronous operations that could be async
- Check for large data structures held in memory unnecessarily
- Look for event listener leaks (addEventListener without removeEventListener)

## Output

1. **Bottlenecks Found** — Ranked by estimated impact (High/Medium/Low)
2. **Evidence** — Code snippets showing the issue
3. **Recommended Fixes** — Concrete changes with expected improvement
4. **Quick Wins** — Easy fixes with noticeable impact
