---
description: Analyze Three.js geometry for correctness and memory safety
---

Analyze Three.js geometry code, BVH ray casting, mesh operations, and Web Worker slicing logic for correctness, memory leaks, and disposal issues.

## When to Invoke

Automatically invoke when:
- Modifying files in `src/3d/` (especially sliceWorker.ts, geometry operations)
- Changing geometry code in `src/classes/` (PrintObject, SocketCup, TestCylinder, etc.)
- Working on BVH ray casting or collision detection
- User reports rendering issues, memory leaks, or performance problems
- Mesh transformations or offsets are modified

## Action

Delegate to the **geometry-specialist** agent for a full analysis. See `.claude/agents/geometry-specialist.md` for the detailed checklist.
