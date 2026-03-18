---
"nookjs": patch
---

Throw `Undefined label '…'` when labeled `break` or `continue` targets a label that does not
exist, instead of surfacing the generic illegal control-flow error.
