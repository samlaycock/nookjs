---
"nookjs": patch
---

Fix Promise support in async evaluation

- Prevent auto-awaiting of Promise values returned from host functions, preserving Promise identity for `.then()` chaining
- Allow `.catch` and `.finally` access on Promises (previously only `.then` was allowlisted)
- Unwrap non-plain-object proxies for native method compatibility (e.g., `clearTimeout` with proxied `Timeout` objects)
