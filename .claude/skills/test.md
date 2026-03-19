---
description: Run tests, report results, and fix failures
---

Run the test suite and handle any failures.

## Steps

1. Run `npm run test` to execute the full Vitest test suite
2. If all tests pass, report a summary of results
3. If any tests fail:
   - Analyze the failure output to identify root causes
   - Read the failing test files and the source code they test
   - Fix the underlying issue in the source code (not the test) unless the test itself is clearly wrong
   - Re-run tests to confirm the fix
   - Repeat until all tests pass

## Guidelines

- Prefer fixing source code over modifying tests
- If a test expectation is genuinely wrong (e.g., outdated after an intentional change), update the test
- Do not skip or delete failing tests
- For geometry/math tests, double-check calculations carefully before changing expected values
- Report what was wrong and what you changed

## Output

1. **Test Results** — Pass/fail summary
2. **Failures** (if any) — What failed and why
3. **Fixes Applied** — What was changed to resolve failures
