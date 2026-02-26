# nookjs

## 0.5.0

### Minor Changes

- 8398889: Support TypeScript type-only ES module syntax in the strip-only parser, including `import type`, `export type`, and mixed named specifiers like `import { value, type Foo }`.
- 598124a: Add ES module `import.meta` support with read-only `import.meta.url` and an optional resolver hook for custom `import.meta` fields.
- 8b3d6b0: Add support for dynamic `import()` expressions in async evaluation paths.

  This introduces parser and interpreter support for `ImportExpression`, routes dynamic imports through the existing module resolver and cache logic, and enforces module authorization/depth limits consistently with static imports. It also updates ES2020+ preset feature flags and module documentation, plus adds regression tests for parsing, success paths, blocked imports, max depth, and caching behavior.

### Patch Changes

- d3952a6: Strip leading hashbang lines in parser entry points so common CLI scripts parse without pre-processing.

  - Normalize `parseModule`, `parseScript`, and `parseModuleWithProfile` input by stripping a leading `#!...` line.
  - Add regression tests for hashbang handling with LF and CRLF inputs.
  - Keep non-leading `#!` invalid syntax to avoid broad tokenizer behavior changes.
  - Update AST parser docs to describe supported hashbang stripping behavior.

- b626594: Implement function declaration hoisting so declarations are pre-bound before statement execution in program and block scopes.

  - Add a scope-level declaration pass that hoists `FunctionDeclaration` nodes before executing statements.
  - Skip re-evaluating hoisted function declaration statements during normal execution.
  - Add regression tests for calling functions before declaration at top-level, in nested function scope, and inside block scope.
  - Update documentation to remove the previous no-hoisting limitation and describe scope-local hoisting behavior.

- a387f03: Support iterable spread arguments in call expressions so call spread behavior matches native JavaScript more closely.

  - Expand call spread arguments from generic iterables/iterators (including strings, Sets, Map iterators, and custom iterables), not just arrays.
  - Keep sync and async argument evaluation paths aligned by using the same iterable validation logic.
  - Preserve clear runtime errors for non-iterable spread values.
  - Add regression coverage for iterable call spread success/failure cases and async call spread behavior.
  - Update call/spread docs to reflect iterable support in call position.

- 7394b49: Implement live ESM bindings for named imports and re-exports instead of snapshotting export values at evaluation time.

  - Make imported bindings getter-backed so reads reflect exporter updates.
  - Keep re-exported bindings (`export { ... } from` and `export *`) live.
  - Reuse the in-progress module exports object during evaluation to improve circular import behavior.
  - Add module tests covering mutable exports, re-exports, and circular live-binding scenarios.
  - Update module docs to remove the stale "No live bindings" limitation.

- 40c5b6a: Fix `var` hoisting semantics so `var` bindings are created as `undefined` at function/global scope setup time instead of only when declaration statements execute.

  - Hoist `var` bindings before executing program and function bodies, including declarations nested inside blocks and loops.
  - Preserve assignment semantics so `var x;` does not overwrite an already-hoisted value at declaration execution time.
  - Add regressions for pre-declaration read/write behavior and nested-function scope shadowing.
  - Update docs to remove the outdated limitation that said `var` is not hoisted.

- a5ab163: Fix arrow functions to use lexical `this` and lexical `arguments` from the enclosing scope.

  - Capture arrow `this` at creation time and ignore call-site receiver binding.
  - Bind `arguments` for non-arrow functions so nested arrows resolve enclosing call arguments.
  - Add regression tests for method-context arrows, nested lexical arguments, and async arrows.
  - Update docs to remove the previous arrow lexical `this`/`arguments` limitation.

- c7c675b: Add configurable numeric semantics for division/modulo by zero to improve JS compatibility without changing the default sandbox behavior.

  - Introduce `numericSemantics: "safe" | "strict-js"` on both `InterpreterOptions` and `SandboxOptions`.
  - Keep `"safe"` as the default, preserving existing `InterpreterError` throws for `/ 0` and `% 0`.
  - Enable native JS numeric behavior in `"strict-js"` mode (`Infinity`, `-Infinity`, `NaN`).
  - Add tests for strict-js division/modulo edge cases including positive/negative zero and `NaN`.
  - Update README and operator/simplified API docs with migration guidance and configuration examples.

## 0.4.2

### Patch Changes

- 053ce30: Fix module failure caching state so failed modules are tracked as `failed` instead of remaining `initializing`.

  Failed module parse/evaluation now updates metadata with the stored error and reuses the failed cache record on subsequent imports, avoiding repeated re-evaluation attempts.

- 38dc510: Fix circular ES module handling so in-progress modules are reused instead of recursively re-evaluated.

  This prevents true import cycles (for example `a -> b -> a`) from recursing until module max depth is exceeded.

- 4d90f9e: Update stale project-structure paths in `CONTRIBUTING.md`.

  This refreshes the structure examples to match the current repository layout (`src/index.ts`, `test/` directory, current source modules) and fixes outdated `tests/` references in the contribution workflow.

- ad25e87: Remove unused `parseScript` and `parseModule` options parameters in the AST parser API.

  These options were accepted but ignored. The signatures now match runtime behavior, and related interpreter call sites were updated to call the parser helpers without no-op options.

- fb7a1c0: Clarify JavaScript compatibility expectations for arithmetic edge cases.

  This updates package and documentation wording to explicitly call out that division/modulo by zero intentionally throws `InterpreterError` rather than using native JS `Infinity`/`NaN` results.

- 77e0958: Fix missing-name validation for named re-exports.

  `export { missing } from "source.js"` now throws when the source module does not export the requested binding, matching named import validation behavior.

- bd79cd3: Pin CI/release toolchain versions and enforce frozen lockfile installs.

  This pins GitHub Actions Bun setup versions, pins the website deploy Wrangler action version, pins `@types/bun` in `package.json`, and updates workflow install steps to use `bun install --frozen-lockfile` for more reproducible CI and release runs.

- 4998249: Add explicit module-system regression coverage for circular imports and missing named re-exports.

  This adds tests for a direct `a -> b -> a` circular chain and for aliased missing re-exports (`export { missing as renamed } from ...`) to guard against regressions in ESM resolution and export validation.

- 35eda5b: Add opt-in strict evaluation isolation to serialize mixed sync/async access safely.

  When `strictEvaluationIsolation: true` is set on `Interpreter` (or `createSandbox`), synchronous `evaluate()` / `runSync()` calls are blocked while async/module evaluations are pending, preventing shared-state races between sync and async runs on the same instance.

- 399b0f3: Fix per-call globals cleanup when global injection fails before evaluation starts.

  This makes per-call global injection transactional so failed setup no longer leaks globals between runs, and it ensures async/module evaluation mutexes are still released when setup fails early.

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
