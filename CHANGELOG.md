# nookjs

## 0.4.1

### Patch Changes

- 0702a1a: Block async/generator constructor aliases to prevent sandbox escape (closes #37)
- 064bb5c: Fix stack sanitization path leaks across runtime frame formats.

  Expanded `sanitizeErrorStack()` to redact absolute host paths in additional stack formats, including bare Unix/Windows paths, `file://` URLs, and eval-style frames with multiple path fragments. Also broadened host-error stack detection so sanitization runs on stack traces with non-Node indentation styles, and updated security documentation to clarify sanitization guarantees and caveats.

- 42edc61: Fix concurrent cross-request data leak by serializing evaluateAsync calls

  Adds an evaluation mutex to serialize concurrent `evaluateAsync()` and `evaluateModuleAsync()` calls, ensuring proper isolation of per-call globals between concurrent requests. This fixes a security vulnerability where globals could leak between different async evaluations.

- e857b4a: Fix EvaluationContext stack for run isolation - fix security vulnerability where concurrent async runs shared per-call policy state, allowing policy bypass. Added EvaluationContext class with stack-based management to isolate validators, feature controls, abort signals, and resource limits between overlapping runs.
- 60b36c4: Fix P0 security vulnerability: module cache authorization bypass. The module cache was checked by raw specifier before resolver authorization was applied, allowing an attacker to import a module cached by a previously authorized importer. Now the resolver is always called first before cache access, and the cache key uses the resolved path instead of the specifier.
- 58741d2: Security fix: narrow unwrap allowlist to prevent sandbox bypass via Object.defineProperty
- 76f5cd2: Fix security option bleed between interpreter instances

  Security options were stored in a module-global mutable state, causing one interpreter's settings to affect all other interpreters. This fix modifies ReadOnlyProxy.wrap() to accept an optional securityOptions parameter, and the Interpreter now passes its own securityOptions instead of relying on global state.

## 0.4.0

### Minor Changes

- 9cf6162: Improve the simplified sandbox API and onboarding experience:
  - add safe default per-run limits for `createSandbox()` (`callDepth`, `loops`, `memoryBytes`)
  - add first-class `timeoutMs` support for async `run()` and `runModule()` (sandbox default + per-call override)
  - add typed generics for `run`, `runSync`, and `runModule` return values
  - add a `test` script to `package.json`
  - migrate examples to the simplified API and move internal `Interpreter` usage to `examples/internal`
  - document timeout support, safe defaults, typed run helpers, and example organization

- a1c00b8: Restrict top-level await to module evaluation and run modules through the full per-run evaluation options (globals, limits, validator, signal).

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
