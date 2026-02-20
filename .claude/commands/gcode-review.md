---
description: Review G-code generation changes for correctness
---

Review the G-code generation code and any recent changes for correctness and safety. This is critical — incorrect G-code can damage hardware or produce unsafe prosthetic sockets.

## Scope

Focus on these files and any code that feeds into them:
- `src/3d/generateGCode.ts` — Main G-code output
- `src/3d/sliceWorker.ts` — Model slicing worker
- `src/3d/cupTransitionLayer.ts` — Cup-to-socket transition
- `src/utils/getExtrusionCalculation.ts` — Extrusion math

## Review Checklist

### G-code Correctness
- Verify extrusion values are calculated correctly (distance, layer height, line width, density, output factor)
- Check that shrink scale compensation is applied: `1 / (1 - shrinkFactor / 100)`
- Ensure temperature commands (M104, M109, M140, M190) use correct values from material profiles
- Verify feedrate values are reasonable and correctly sourced from slicing worker
- Check coordinate values are within expected printer build volume
- Ensure E (extrusion) values are positive and incrementally increasing (or properly reset)

### Safety
- Verify the G-code header includes proper startup sequence (homing, heating, priming)
- Verify the G-code footer includes proper shutdown (cooldown, motor disable)
- Check that cup heater removal sequence timing is correct
- Ensure no divide-by-zero or NaN values can propagate into G-code output
- Validate that layer heights and nozzle sizes are within sane ranges

### Slicing Integrity
- Verify ray casting produces closed contours
- Check that contour point ordering is consistent (CW vs CCW)
- Ensure no duplicate or degenerate points in sliced output
- Validate that the transition layer connects cup geometry to socket geometry smoothly

### Code Quality
- Check for off-by-one errors in layer iteration
- Verify units are consistent (mm throughout)
- Ensure Web Worker message passing handles errors gracefully

## Output

1. **Issues Found** — Any bugs, potential safety issues, or incorrect calculations
2. **Risk Assessment** — High/Medium/Low for each issue
3. **Suggested Fixes** — Concrete code changes to address issues
