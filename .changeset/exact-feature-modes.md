---
"nookjs": patch
---

Treat an explicit `features.mode` as an exact whitelist/blacklist instead of merging it into the `env` preset or sandbox feature control, for both `createSandbox()` and per-run options. Omitting `mode` still adds to or removes from the preset.
