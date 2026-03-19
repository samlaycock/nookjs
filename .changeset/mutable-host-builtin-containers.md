---
"nookjs": patch
---

Materialize plain arrays and objects returned from host-backed built-ins into mutable
sandbox-owned containers while preserving nested sandbox identity and keeping host constructor
returns read-only.
