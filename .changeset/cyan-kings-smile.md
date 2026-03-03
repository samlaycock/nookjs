---
"nookjs": patch
---

Add configurable `security.nativeUnwrapAllowlist` support so host-call argument unwrapping can be extended for branded objects like `DataView` and `Headers` while keeping conservative defaults.

Also document the security tradeoffs and add regression tests for default and allowlisted behavior.
