---
description: Review G-code generation changes for correctness
---

Review G-code generation code for correctness and safety. This is critical — incorrect G-code can damage hardware or produce unsafe prosthetic sockets.

## When to Invoke

Automatically invoke when changes touch:
- `src/3d/generateGCode.ts`
- `src/3d/sliceWorker.ts`
- `src/utils/cupTransitionLayer.ts`
- `src/utils/getExtrusionCalculation.ts`
- `src/utils/constants.ts`

## Action

Delegate to the **gcode-validator** agent for a full validation report. See `.claude/agents/gcode-validator.md` for the detailed checklist.
