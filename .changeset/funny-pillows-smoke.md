---
"nookjs": patch
---

Fix stack sanitization to prevent host path leakage

Improved `sanitizeErrorStack()` to catch all common runtime stack frame formats:
- Unix absolute paths with any file extension
- Windows absolute paths
- file:// URLs
- Eval-style frames (including Bun-like formats)

Added comprehensive tests for all sanitization scenarios. Updated SECURITY.md with clarified sanitization guarantees and caveats.
