# nookjs

## 0.3.0

### Minor Changes

- 35fe723: Add ES module support with import/export syntax
  - Support all import types: named, default, namespace, side-effect only
  - Support all export types: named declarations, default, re-exports, `export * as namespace`
  - Pluggable `ModuleResolver` interface for loading modules from any source
  - Pre-built module injection via `type: "namespace"` for host libraries
  - Module caching with configurable behavior
  - Introspection API on `Interpreter`: `isModuleCached`, `getLoadedModuleSpecifiers`, `getModuleMetadata`, `clearModuleCache`, and more
  - Lifecycle hooks: `onLoad` and `onError` for monitoring module loading
  - Security: read-only exports via proxy, prototype access blocked, import depth limiting

- a76f9e2: Add simplified `createSandbox` and `run` APIs with env presets, add-on APIs, and structured limits.
- 72e527a: Add TypedArray support for mutation and static methods
  - Enable TypedArray element mutation via numeric indices (e.g., `arr[0] = 10`)
  - Allow inherited static methods on host functions (e.g., `Uint8Array.from()`, `Uint8Array.of()`)
  - Unwrap TypedArray/ArrayBuffer proxies when passed to native host methods like `TextDecoder.decode()`
  - Fix `TextEncoder.encodeInto()` to work with sandbox-created TypedArrays

### Patch Changes

- b6850f7: Fix Promise support in async evaluation
  - Prevent auto-awaiting of Promise values returned from host functions, preserving Promise identity for `.then()` chaining
  - Allow `.catch` and `.finally` access on Promises (previously only `.then` was allowlisted)
  - Unwrap non-plain-object proxies for native method compatibility (e.g., `clearTimeout` with proxied `Timeout` objects)

- c66ea69: Refactor member access to centralize blacklist checks while preserving array/string method overrides.
- 48d91ae: Consolidate interpreter evaluation paths and helper utilities to reduce duplication.

## 0.2.0

### Minor Changes

- 59ad469: Add pre-parsed AST support. The interpreter now accepts pre-parsed ESTree.Program AST nodes in addition to string inputs. This enables more efficient repeated evaluations and better integration with other AST processing tools.

### Patch Changes

- 3e1bb49: Allow safe native method access on primitives and injected globals, add preset/global coverage tests, and fix parser handling for `get`/`set` identifiers while preserving class accessors.

## 0.1.0

### Minor Changes

- 3c91593: Added `ResourceTracker` class for cumulative resource tracking and attribution in multi-tenant environments. The new feature enables host applications to monitor and limit aggregate resource consumption across multiple evaluations, with support for memory, iterations, function calls, CPU time, and evaluation count limits. Includes `ResourceExhaustedError` for error handling and comprehensive history tracking for analytics.
