---
"nookjs": patch
---

Protect values fulfilled by host Promises so sandbox code cannot mutate host objects through `await`, `.then()` callbacks or Promise combinators, while preserving the identity of sandbox-owned values.
