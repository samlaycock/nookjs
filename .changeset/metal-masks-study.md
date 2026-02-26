---
"nookjs": patch
---

Tighten TypeScript declaration stripping lookahead so statements starting with `type` or `interface`
are only skipped when they match actual TS declaration syntax, preserving valid JavaScript labeled
statements like `type: while (...) {}` and `interface: x = 1`.
