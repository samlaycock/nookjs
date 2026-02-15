---
"nookjs": patch
---

Fix stack sanitization path leaks across runtime frame formats.

Expanded `sanitizeErrorStack()` to redact absolute host paths in additional stack formats, including bare Unix/Windows paths, `file://` URLs, and eval-style frames with multiple path fragments. Also broadened host-error stack detection so sanitization runs on stack traces with non-Node indentation styles, and updated security documentation to clarify sanitization guarantees and caveats.
