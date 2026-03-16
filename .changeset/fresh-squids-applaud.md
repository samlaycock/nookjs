---
"nookjs": patch
---

Expand the AST parser's identifier tokenizer to accept Unicode identifier characters and `\u` escape sequences, including mixed ASCII/Unicode names that previously failed during lexing.
