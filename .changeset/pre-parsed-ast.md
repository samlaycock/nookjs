---
"nookjs": major
---

Add pre-parsed AST support. The interpreter now accepts pre-parsed ESTree.Program AST nodes in addition to string inputs. This enables more efficient repeated evaluations and better integration with other AST processing tools.
