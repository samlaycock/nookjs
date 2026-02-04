# PR: Simplify Public API Docs + Sticky Navigation

## Summary

- Migrated website docs/examples to the simplified `createSandbox`/`run` API and aligned limits/modules/globals/security patterns accordingly.
- Updated Resource Tracking docs to match sandbox limits and `resources()` access, with internal-class references for advanced controls.
- Added sticky top nav across layouts and made the docs sidebar stick beneath it on desktop; fixed mobile nav layering.

## Changes

- Website docs pages and examples now use `createSandbox`, `run`, `runSync`, and `runModule` (Interpreter usage remains only on the internal API page).
- Resource Tracker page updated to the sandbox model (`SandboxLimits`, `resources()`, `result: "full"`).
- Docs navigation improvements:
  - Sticky global header
  - Sticky docs sidebar with header offset
  - Mobile menu z-index fixed

## Testing

- `bun lint`
- `bun typecheck`
