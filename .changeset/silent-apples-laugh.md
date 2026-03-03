---
"nookjs": patch
---

Cache `HostFunctionValue` static method wrappers so repeated reads (for example `Promise.resolve`,
`Object.keys`, and inherited methods like `Uint8Array.from`) keep stable function identity while
avoiding unnecessary re-binding/wrapping allocations.
