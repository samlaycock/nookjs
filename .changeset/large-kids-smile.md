---
"nookjs": patch
---

Add `Atomics` to `BufferAPI` alongside `SharedArrayBuffer`, and unwrap shared buffers for native constructors so shared-memory views work correctly inside the sandbox.
