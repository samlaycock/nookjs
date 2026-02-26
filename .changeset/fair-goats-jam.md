---
"nookjs": patch
---

Forward the sandbox module resolver `getImportMeta` hook so `createSandbox({ modules: { resolver } })`
can customize `import.meta` fields consistently with the interpreter module API.
