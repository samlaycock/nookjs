---
"nookjs": patch
---

Preserve module introspection metadata when multiple authorized specifiers resolve to the same cached module path.

- Register every successfully resolved specifier before returning an existing cached module record.
- Add regression coverage for `isModuleCached()`, `getLoadedModuleSpecifiers()`, `getModuleMetadata()`, and `getModuleExportsBySpecifier()` when aliased specifiers share a canonical path.
