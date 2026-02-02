---
"nookjs": minor
---

Add TypedArray support for mutation and static methods

- Enable TypedArray element mutation via numeric indices (e.g., `arr[0] = 10`)
- Allow inherited static methods on host functions (e.g., `Uint8Array.from()`, `Uint8Array.of()`)
- Unwrap TypedArray/ArrayBuffer proxies when passed to native host methods like `TextDecoder.decode()`
- Fix `TextEncoder.encodeInto()` to work with sandbox-created TypedArrays
