---
description: Write Vitest unit tests for source files
---

Write Vitest unit tests for source files that lack coverage, especially for critical geometry and G-code generation logic.

## When to Invoke

Automatically invoke when:
- New functions are added without corresponding tests
- User asks to improve test coverage
- Critical geometry or G-code functions are modified
- A bug was just fixed (should have regression test)
- A new utility function is created in `src/utils/`

## Action

Delegate to the **test-writer** agent. See `.claude/agents/test-writer.md` for test style conventions and guidelines.
