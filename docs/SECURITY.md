# Security Model

This document describes the security sandboxing model of the interpreter, which is designed to **hide host implementation details from untrusted code**.

## Overview

The interpreter provides a secure sandbox for executing untrusted JavaScript code. The security model is built around several key mechanisms:

1. **ReadOnlyProxy** - Wraps all host values to enforce immutability and block dangerous property access
2. **Dangerous Property Blocking** - Blocks access to prototype chain manipulation and other dangerous properties
3. **Forbidden Globals** - Prevents injection of code-execution primitives
4. **Error Sanitization** - Prevents leakage of host information through error messages and stack traces

## Security Options

The interpreter accepts a `security` option with the following settings:

```typescript
const interpreter = new Interpreter({
  globals: {
    /* ... */
  },
  security: {
    // Sanitize error stack traces to remove host file paths (default: true)
    sanitizeErrors: true,

    // Hide original error messages from host functions (default: true)
    hideHostErrorMessages: true,
  },
});
```

### `sanitizeErrors` (default: `true`)

When enabled, error stack traces are sanitized to remove host file paths. This prevents untrusted code from learning about the host environment's file structure.

**Before sanitization:**

```
Error: test
    at executeHostConstructor (/Users/dev/project/src/interpreter.ts:4122:30)
    at evaluateNewExpressionAsync (/Users/dev/project/src/interpreter.ts:7300:21)
```

**After sanitization:**

```
Error: test
    at executeHostConstructor ([native code])
    at evaluateNewExpressionAsync ([native code])
```

### `hideHostErrorMessages` (default: `true`)

When enabled, error messages from host functions are replaced with a generic message. This is useful when host functions might throw errors containing sensitive information.

**Without hiding:**

```
Host function 'readFile' threw error: ENOENT: no such file, open '/etc/passwd'
```

**With hiding:**

```
Host function 'readFile' threw error: [error details hidden]
```

## What is Blocked

### Dangerous Properties

The following properties are blocked on all wrapped host objects:

| Category           | Properties                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| Prototype chain    | `__proto__`, `constructor`, `prototype`                                                 |
| Legacy methods     | `__defineGetter__`, `__defineSetter__`, `__lookupGetter__`, `__lookupSetter__`          |
| Object.prototype   | `toString`, `toLocaleString`, `hasOwnProperty`, `isPrototypeOf`, `propertyIsEnumerable` |
| Function.prototype | `apply`, `call`, `bind`, `arguments`, `caller`                                          |

### Dangerous Symbols

| Symbol                              | Reason                                                 |
| ----------------------------------- | ------------------------------------------------------ |
| `Symbol.toStringTag`                | Could leak type information                            |
| `Symbol.hasInstance`                | Could manipulate instanceof checks                     |
| `Symbol.species`                    | Could inject malicious constructors                    |
| `Symbol.toPrimitive`                | Returns `undefined` (not blocked) to enable arithmetic |
| `Symbol.match/replace/search/split` | Could manipulate string operations                     |

### Forbidden Globals

These cannot be injected as globals:

- `Function` - Would allow arbitrary code execution
- `eval` - Would allow arbitrary code execution
- `Proxy` - Could intercept operations
- `Reflect` - Could access internal operations
- `AsyncFunction`, `GeneratorFunction`, `AsyncGeneratorFunction` - Function construction

## How Host Values are Protected

### Functions

Host functions are wrapped in `HostFunctionValue` which:

- Allows calling the function
- Blocks access to dangerous properties
- Allows access to static methods (e.g., `Promise.resolve`, `Array.isArray`)
- Returns `undefined` for `.then` (to not break await detection)

### Objects

Host objects are wrapped in a `ReadOnlyProxy` which:

- Returns `null` for `getPrototypeOf()` (hides prototype chain)
- Blocks `set`, `deleteProperty`, `defineProperty`, `setPrototypeOf`
- Blocks access to dangerous properties
- Recursively wraps nested objects
- Wraps function properties as `HostFunctionValue`

### valueOf Behavior

The `valueOf` method is handled specially for security:

- **Custom valueOf is NOT called** - Host objects with custom `valueOf` methods will NOT have them invoked
- For primitive wrappers (`Number`, `String`, `Boolean`), returns the primitive value
- For `Date` objects, returns the timestamp
- For other objects, returns a wrapped proxy of the object itself

This prevents host objects from leaking sensitive data through custom `valueOf` implementations.

## Known Limitations

### Promises Pass Through Unwrapped

Promise objects are passed through `ReadOnlyProxy.wrap()` without wrapping. This is **intentional** because:

1. Wrapping breaks the thenable protocol that `await` relies on
2. `await` checks for a `.then` property to determine if something is a Promise
3. If `.then` becomes a `HostFunctionValue`, the native Promise resolution fails

**Implications:**

- Sandbox code can call native Promise methods directly
- Promise values are resolved/rejected through standard interfaces
- This is considered an acceptable trade-off for async/await support

**Risk Assessment:** Low - Promise API doesn't provide access to prototype chain or dangerous capabilities.

### Error Messages Hidden by Default

By default, host error messages are hidden from the sandbox. If you need to see error details for debugging, you can disable this with `hideHostErrorMessages: false`.

## Execution Limits

The interpreter provides execution limits to protect against denial-of-service attacks from untrusted code. These limits are configured per-call via `EvaluateOptions`:

```typescript
const interpreter = new Interpreter();

const result = interpreter.evaluate(
  `
  function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  factorial(10);
`,
  {
    // Maximum call stack depth (protects against infinite recursion)
    maxCallStackDepth: 100,

    // Maximum iterations per loop (protects against infinite loops)
    maxLoopIterations: 10000,

    // Maximum memory usage in bytes (best-effort estimate)
    maxMemory: 10 * 1024 * 1024, // 10 MB
  },
);
```

### `maxCallStackDepth`

Limits the depth of function call nesting. When exceeded, throws `InterpreterError: Maximum call stack depth exceeded`.

**Use case:** Prevent stack overflow from infinite recursion.

```typescript
// This will throw when maxCallStackDepth is exceeded
interpreter.evaluate(
  `
  function infinite() { return infinite(); }
  infinite();
`,
  { maxCallStackDepth: 50 },
);
```

### `maxLoopIterations`

Limits the number of iterations **per loop**. Each loop (while, for, do-while, for-of, for-in) has its own counter that resets when the loop completes. When exceeded, throws `InterpreterError: Maximum loop iterations exceeded`.

**Use case:** Prevent infinite loops from consuming CPU.

```typescript
// This will throw when maxLoopIterations is exceeded
interpreter.evaluate(`while (true) { }`, { maxLoopIterations: 1000 });

// This works because each loop is under the limit
interpreter.evaluate(
  `
  for (let i = 0; i < 500; i++) { }  // 500 iterations
  for (let j = 0; j < 500; j++) { }  // 500 iterations
`,
  { maxLoopIterations: 1000 },
);
```

### `maxMemory`

Limits estimated memory usage in bytes. This is a **best-effort heuristic** that tracks:

- Array allocations: ~16 bytes per element
- Object allocations: ~64 bytes base + 32 bytes per property
- String allocations (via template literals): ~2 bytes per character

When exceeded, throws `InterpreterError: Maximum memory limit exceeded`.

**Note:** This is not a precise memory limit. JavaScript doesn't expose precise memory tracking, so the interpreter estimates based on allocations it can observe. The goal is to catch runaway memory consumption, not precise accounting.

```typescript
// This will throw when estimated memory exceeds the limit
interpreter.evaluate(
  `
  const huge = [];
  for (let i = 0; i < 100000; i++) {
    huge.push([1, 2, 3, 4, 5]);
  }
`,
  { maxMemory: 1024 * 1024, maxLoopIterations: 1000000 },
);
```

### Combined with Timeout

For comprehensive protection, combine execution limits with the existing `timeout` option:

```typescript
interpreter.evaluate(code, {
  timeout: 5000, // 5 seconds wall-clock time
  maxCallStackDepth: 100,
  maxLoopIterations: 100000,
  maxMemory: 10 * 1024 * 1024,
});
```

### Execution Limits and AbortSignal

You can also use `AbortSignal` for immediate cancellation:

```typescript
const controller = new AbortController();

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000);

interpreter.evaluate(code, {
  signal: controller.signal,
  maxLoopIterations: 100000,
});
```

## Resource Attribution for Multi-Tenant Environments

The interpreter provides integrated resource tracking for monitoring cumulative resource usage across multiple evaluations. This is essential for multi-tenant environments where multiple untrusted code snippets execute concurrently.

### Overview

Integrated resource tracking enables:

1. **Aggregate resource usage** across multiple evaluations in the same interpreter instance
2. **Track cumulative costs** for billing, rate-limiting, or fairness in multi-tenant scenarios
3. **Detect resource exhaustion patterns** that might indicate malicious or runaway code
4. **Expose runtime statistics** to host applications for monitoring dashboards

### Quick Start

```typescript
import { Interpreter, ResourceExhaustedError } from "nookjs";

// Create interpreter with resource tracking enabled
const interpreter = new Interpreter({
  globals: { console },
  resourceTracking: true,
});

// Set cumulative limits
interpreter.setResourceLimit("maxTotalMemory", 100 * 1024 * 1024); // 100 MB
interpreter.setResourceLimit("maxTotalIterations", 1000000); // 1M iterations
interpreter.setResourceLimit("maxFunctionCalls", 10000); // 10K calls
interpreter.setResourceLimit("maxEvaluations", 100); // 100 evaluations

// Run code
try {
  interpreter.evaluate("const arr = Array(1000).fill(0).map((_, i) => i)");
  interpreter.evaluate("for (let i = 0; i < 10000; i++) { }");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
  }
}

// Get current stats
const stats = interpreter.getResourceStats();
console.log(stats);
/*
{
  memoryBytes: 24576,
  iterations: 10000,
  functionCalls: 3,
  cpuTimeMs: 15,
  evaluations: 2,
  peakMemoryBytes: 32768,
  largestEvaluation: { memory: 16384, iterations: 10000 },
  isExhausted: false,
  limitStatus: {
    maxTotalMemory: { used: 24576, limit: 104857600, remaining: 104833024 },
    maxTotalIterations: { used: 10000, limit: 1000000, remaining: 990000 },
    ...
  }
}
*/
```

### Interpreter Resource Methods

When `resourceTracking: true` is set, the Interpreter exposes these methods:

| Method                       | Description                         |
| ---------------------------- | ----------------------------------- |
| `getResourceStats()`         | Returns current resource statistics |
| `resetResourceStats()`       | Clears all statistics and history   |
| `getResourceHistory()`       | Returns array of past eval stats    |
| `setResourceLimit(key, val)` | Sets a cumulative limit             |
| `getResourceLimit(key)`      | Gets a specific limit value         |

### ResourceLimits

```typescript
type ResourceLimits = {
  maxTotalMemory?: number; // bytes
  maxTotalIterations?: number; // loop iterations
  maxFunctionCalls?: number; // total function invocations
  maxCpuTime?: number; // milliseconds (best-effort)
  maxEvaluations?: number; // number of evaluate() calls
};
```

### ResourceStats

```typescript
type ResourceStats = {
  memoryBytes: number; // current estimated memory
  iterations: number; // total loop iterations
  functionCalls: number; // total function calls
  cpuTimeMs: number; // cumulative CPU time (best-effort)
  evaluations: number; // number of evaluations
  peakMemoryBytes: number; // highest memory seen
  largestEvaluation: {
    memory: number;
    iterations: number;
  };
  isExhausted: boolean; // any limit exceeded
  limitStatus: {
    [key in keyof ResourceLimits]?: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
};
```

### Error Handling

When a limit is exceeded, a `ResourceExhaustedError` is thrown:

```typescript
import { Interpreter, ResourceExhaustedError } from "nookjs";

const interpreter = new Interpreter({ resourceTracking: true });
interpreter.setResourceLimit("maxEvaluations", 5);

try {
  for (let i = 0; i < 10; i++) {
    interpreter.evaluate("1 + 1");
  }
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
    console.log(`Used: ${error.used}, Limit: ${error.limit}`);
  }
}
```

### Use Cases

#### Plugin Systems

Track resource usage per plugin to enforce fair allocation:

```typescript
function createPluginInterpreter(pluginId: string, memoryLimit: number) {
  const interpreter = new Interpreter({
    resourceTracking: true,
    globals: getPluginGlobals(pluginId),
  });
  interpreter.setResourceLimit("maxTotalMemory", memoryLimit);
  return interpreter;
}

const plugin1 = createPluginInterpreter("plugin1", 50 * 1024 * 1024);
const plugin2 = createPluginInterpreter("plugin2", 50 * 1024 * 1024);

plugin1.evaluate(plugin1Code);
const stats = plugin1.getResourceStats();
if (stats.memoryBytes > 40 * 1024 * 1024) {
  console.log("Plugin1 approaching memory limit");
}
```

#### Educational Platforms

Monitor student code for excessive resource consumption:

```typescript
const studentInterpreter = new Interpreter({ resourceTracking: true });
studentInterpreter.setResourceLimit("maxEvaluations", 50);
studentInterpreter.setResourceLimit("maxTotalIterations", 100000);
studentInterpreter.setResourceLimit("maxCpuTime", 5000);

// Allow multiple submissions
for (const code of studentSubmissions) {
  studentInterpreter.evaluate(code);
}
```

#### Rate Limiting

Implement evaluation-count-based rate limiting:

```typescript
const interpreter = new Interpreter({ resourceTracking: true });
interpreter.setResourceLimit("maxEvaluations", 1000);

// Reset at the start of each billing cycle
setInterval(
  () => {
    interpreter.resetResourceStats();
  },
  24 * 60 * 60 * 1000,
); // Daily reset
```

### History Tracking

The interpreter maintains a history of past evaluations for analytics:

```typescript
const interpreter = new Interpreter({ resourceTracking: true });

interpreter.evaluate(code1);
interpreter.evaluate(code2);

const history = interpreter.getResourceHistory();
// [{ timestamp: Date, memoryBytes: 1234, iterations: 500, functionCalls: 5, evaluationNumber: 1 }, ...]
```

### Performance Considerations

- **Minimal overhead:** Resource tracking adds negligible performance cost
- **Bounded history:** The history buffer is capped (default: 100 entries)
- **Optional:** Only enabled when `resourceTracking: true` is set
- **CPU time is best-effort:** JavaScript doesn't expose precise CPU time; wall-clock time is used

### Comparison: Per-Evaluation vs Cumulative Limits

| Feature         | Per-Evaluation                | Cumulative (resourceTracking)    |
| --------------- | ----------------------------- | -------------------------------- |
| Scope           | Single `evaluate()` call      | Across multiple calls            |
| Memory          | `maxMemory`                   | `maxTotalMemory`                 |
| Loop iterations | `maxLoopIterations`           | `maxTotalIterations`             |
| Function calls  | Not available                 | `maxFunctionCalls`               |
| Use case        | Prevent single runaway script | Multi-tenant resource accounting |

## Security Testing

The interpreter includes comprehensive security tests in:

- `test/readonly-proxy-security.test.ts` - Tests for ReadOnlyProxy protections
- `test/security.test.ts` - General security tests
- `test/security-options.test.ts` - Tests for security configuration options
- `test/execution-control.test.ts` - Tests for execution limits (call stack, loops, memory)

## Recommendations

The default security settings provide maximum protection. For debugging during development, you may want to temporarily disable error hiding:

```typescript
const interpreter = new Interpreter({
  globals: {
    // Only inject what's absolutely necessary
    console: { log: (...args) => console.log(...args) },
  },
  security: {
    // For debugging only - remove in production
    sanitizeErrors: false,
    hideHostErrorMessages: false,
  },
});
```
