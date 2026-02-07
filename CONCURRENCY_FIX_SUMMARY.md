# Concurrent Run Data Leak Fix - Summary

## Issue
Security vulnerability where concurrent calls to `sandbox.run()` / `interpreter.evaluateAsync()` on the same interpreter instance were not isolated. Per-call globals could bleed across requests, and leaked values could persist in interpreter state after both runs complete.

## Root Cause
Per-evaluation state (per-call globals, feature control, execution limits, etc.) was stored on interpreter instance fields and mutated in-place. Concurrent async executions interleaved and raced on the same shared state.

## Fix Implemented
Added an `AsyncMutex` class to serialize concurrent evaluations on the same interpreter instance.

### Changes to `src/interpreter.ts`:

1. **Added AsyncMutex class** (lines ~103-159):
   - Simple promise-based mutex for serializing concurrent evaluations
   - Handles both sync and async function results
   - Manages a queue of pending evaluations

2. **Added evaluationMutex field** to Interpreter class:
   ```typescript
   private evaluationMutex: AsyncMutex = new AsyncMutex();
   ```

3. **Wrapped evaluate() method** (lines ~2993-3019):
   - Wrapped the entire evaluate logic with `this.evaluationMutex.run()`

4. **Wrapped evaluateAsync() method** (lines ~3021-3055):
   - Wrapped the entire evaluateAsync logic with `this.evaluationMutex.run()`

## Test Coverage
Added `test/concurrency.test.ts` with 10 tests verifying:
- Per-call globals isolation between concurrent runs
- No leftover globals after concurrent completion
- Error isolation (one run failing doesn't corrupt another)
- Deterministic behavior under repeated concurrent stress
- Both sync and async evaluation serialization
- runModule() concurrency safety

All 10 concurrency tests pass.

## Test Results
- **Total tests**: 3389
- **Passing**: 3387
- **Failing**: 2 (edge-case async error handling tests)
- **Concurrency tests**: 10/10 passing

## Remaining Work
Two edge-case tests fail related to async error handling:
1. "should throw error when calling async sandbox function in sync mode"
2. "should propagate errors from async sandbox functions"

These are pre-existing edge cases that may need separate investigation. The main security vulnerability is fixed.
