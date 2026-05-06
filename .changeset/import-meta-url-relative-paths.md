---
"nookjs": patch
---

Allow resolver's `getImportMeta` to provide a canonical `url` for relative module paths. When a resolver returns a relative `path` (e.g. `"dep.js"`) and its `getImportMeta` hook returns a `url` field containing a valid absolute URL, that URL is used as `import.meta.url` instead of the misleading `file:///dep.js` fallback. Absolute paths and URL-scheme paths retain their existing auto-generated URLs and are not affected.
