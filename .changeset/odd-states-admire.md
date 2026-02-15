---
'nookjs': patch
---

Fix security option bleed between interpreter instances

Security options were stored in a module-global mutable state, causing one interpreter's settings to affect all other interpreters. This fix modifies ReadOnlyProxy.wrap() to accept an optional securityOptions parameter, and the Interpreter now passes its own securityOptions instead of relying on global state.
