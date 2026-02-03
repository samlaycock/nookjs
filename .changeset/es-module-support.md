---
"nookjs": minor
---

Add ES module support with import/export syntax

- Support all import types: named, default, namespace, side-effect only
- Support all export types: named declarations, default, re-exports, `export * as namespace`
- Pluggable `ModuleResolver` interface for loading modules from any source
- Pre-built module injection via `type: "namespace"` for host libraries
- Module caching with configurable behavior
- Introspection API on `Interpreter`: `isModuleCached`, `getLoadedModuleSpecifiers`, `getModuleMetadata`, `clearModuleCache`, and more
- Lifecycle hooks: `onLoad` and `onError` for monitoring module loading
- Security: read-only exports via proxy, prototype access blocked, import depth limiting
