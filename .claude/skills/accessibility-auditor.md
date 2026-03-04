---
description: Audit web components for WCAG 2.1 AA compliance
---

Audit web components for WCAG 2.1 AA compliance when they are created or modified.

## When to Invoke

Automatically invoke when:
- A new web component is created in `src/web-components/`
- An existing web component is modified
- User asks to check accessibility
- Major UI changes are made

## Action

Delegate to the **accessibility-auditor** agent for a full audit. See `.claude/agents/accessibility-auditor.md` for the detailed checklist.
