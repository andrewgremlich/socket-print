# G-Code Generation Pipeline

The G-code generation system (`src/3d/generateGCode.ts`) is a critical component, fed by the slicing Web Worker (`src/3d/sliceWorker.ts`).

## Coordinate System

Three.js uses **Y-up**; G-code/3D printing uses **Z-up**. The pipeline carries both axes and flips them at output time:

- `verticalAxis: "y" | "z"` — the current vertical axis
- `flipVerticalAxis()` (`src/3d/generateGCode.ts:36`) — swaps Y and Z
- `makeGCodePoint()` (`src/3d/generateGCode.ts:40`) — emits `G1 X Y Z` with the axes swapped according to options

## Slicing (Web Worker)

`src/3d/sliceWorker.ts` exposes two enums and two modes:

```ts
enum SliceMode { VASE = "vase", JACKET = "jacket" }
enum SliceWorkerStatus { DONE = "done", PROGRESS = "progress" }
```

- **Vase mode** (`vaseMode`): ray-casts a full circle per layer; spiral-vase style continuous extrusion. Stops if a layer has too many missing points or a large gap (mesh top).
- **Jacket mode** (`jacketMode`): detects a lace opening via `detectOpening()`, then sweeps only the solid arc, alternating sweep direction per layer (boustrophedon).

Both modes use a BVH (`three-mesh-bvh`) for fast ray-casting and post progress events back to the main thread.

## Pipeline Stages (main thread, in `generateGCode.ts`)

1. **Header generation** (`generateGCodeHeader`)
   - Sets temperatures for nozzle and cup heater
   - Includes cup heater pickup/removal sequence
   - Primes extruder before printing

2. **Transition layer**: circular layer from cup to socket
   - Uses `getCirclePoints()` and `getTransitionLayer()` from `src/utils/cupTransitionLayer.ts`

3. **Layer-by-layer extrusion**: iterates `pointGatherer` from the worker
   - Calculates per-segment extrusion via `getExtrusionCalculation()`
   - Applies per-level feedrate from `calculateFeedratePerLevel()`
   - **First-layer ramp**: linearly interpolates between the transition-layer extrusion and the steady-state first-layer extrusion across the first layer, smoothing the handoff (see `generateGCode.ts:292-300`).

4. **End sequence**: purge, lift Z, park head, turn off temperatures and blowers, call `end.g` macro.

## Key Constants & Calculations

- `NOZZLE_SIZE_OFFSET_FACTOR = 2` (`src/utils/constants.ts`) — divides nozzle size for centerline offset
- **Shrink scale**: `1 / (1 - shrinkFactor / 100)` — compensates for material shrinkage
- **Extrusion**: derived from distance × layerHeight × lineWidth × density × outputFactor / (gramsPerRevolution / ePerRevolution)

## Key Files

- `src/3d/generateGCode.ts` — Main G-code output
- `src/3d/sliceWorker.ts` — Slicing Web Worker (vase + jacket)
- `src/3d/calculateDistancePerLevel.ts` — Per-level feedrate
- `src/3d/calculatePrintTime.ts` — Estimated print time
- `src/utils/cupTransitionLayer.ts` — Cup-to-socket transition
- `src/utils/getExtrusionCalculation.ts` — Extrusion math
- `src/utils/constants.ts` — Shared constants
