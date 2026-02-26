---
"nookjs": patch
---

Preserve accessors and branded values when loading resolver-provided module namespace exports and
`import.meta` extensions by replacing deep cloning at those boundaries with descriptor-preserving
shallow copies.
