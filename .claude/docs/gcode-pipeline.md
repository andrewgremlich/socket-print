# G-Code Generation Pipeline

The G-code generation system (`src/3d/generateGCode.ts`) is a critical component.

## Pipeline Stages

1. **Header Generation** (`generateGCodeHeader`): Creates metadata and startup sequence
   - Sets temperatures for nozzle and cup heater
   - Includes cup heater removal sequence
   - Primes extruder before printing

2. **Transition Layer**: Generates circular transition from cup to socket
   - Uses `getCirclePoints()` and `getTransitionLayer()` from `src/utils/cupTransitionLayer.ts`

3. **Layer-by-Layer Extrusion**: Iterates through sliced point data
   - Calculates extrusion amount using `getExtrusionCalculation()`
   - Applies feedrate per level from slicing worker

4. **End Sequence**: Handles print completion (purge, cooldown, end macro)

## Key Constants & Calculations

- **NOZZLE_SIZE_OFFSET_FACTOR**: 2 (used for calculating nozzle offset)
- **Shrink Scale**: `1 / (1 - shrinkFactor / 100)` - compensates for material shrinkage
- **Extrusion**: Based on distance, layer height, line width, material density, and output factor

## Key Files

- `src/3d/generateGCode.ts` — Main G-code output
- `src/3d/sliceWorker.ts` — Model slicing worker
- `src/utils/cupTransitionLayer.ts` — Cup-to-socket transition
- `src/utils/getExtrusionCalculation.ts` — Extrusion math
- `src/utils/constants.ts` — Shared constants
