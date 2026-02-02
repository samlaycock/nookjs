# nookjs

## 0.2.0

### Minor Changes

- 59ad469: Add pre-parsed AST support. The interpreter now accepts pre-parsed ESTree.Program AST nodes in addition to string inputs. This enables more efficient repeated evaluations and better integration with other AST processing tools.

### Patch Changes

- 3e1bb49: Allow safe native method access on primitives and injected globals, add preset/global coverage tests, and fix parser handling for `get`/`set` identifiers while preserving class accessors.

## 0.1.0

### Minor Changes

- 3c91593: Added `ResourceTracker` class for cumulative resource tracking and attribution in multi-tenant environments. The new feature enables host applications to monitor and limit aggregate resource consumption across multiple evaluations, with support for memory, iterations, function calls, CPU time, and evaluation count limits. Includes `ResourceExhaustedError` for error handling and comprehensive history tracking for analytics.
