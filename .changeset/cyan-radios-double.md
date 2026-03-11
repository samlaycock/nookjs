---
"nookjs": minor
---

Add an optional `authorize()` module resolver hook so cached imports can skip repeated `resolve()` work without bypassing importer-aware access control.

- Re-check authorization on every import when `authorize()` is provided, including cache hits.
- Reuse cached module records for repeated imports from the same resolution context instead of re-running `resolve()`.
- Document how to split module loading and authorization logic while preserving the existing `resolve()` fallback behavior.
