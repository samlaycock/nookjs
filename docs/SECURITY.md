# Security Model

This document describes the security sandboxing model of the interpreter, which is designed to **hide host implementation details from untrusted code**.

## Overview

The interpreter provides a secure sandbox for executing untrusted JavaScript code. The security model is built around several key mechanisms:

1. **ReadOnlyProxy** - Wraps all host values to enforce immutability and block dangerous property access
2. **Dangerous Property Blocking** - Blocks access to prototype chain manipulation and other dangerous properties
3. **Forbidden Globals** - Prevents injection of code-execution primitives
4. **Error Sanitization** - Prevents leakage of host information through error messages and stack traces

## Security Options

The sandbox accepts a `security` option with the following settings:

```typescript
const sandbox = createSandbox({
  env: "es2022",
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

### Simplified API Policy Mapping

When using `createSandbox`, you can set `policy.errors` instead of `security` directly:

- `safe` -> sanitize errors and hide host error messages
- `sanitize` -> sanitize errors but keep host error messages
- `full` -> disable sanitization and show full host errors

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

### TypedArrays Have Special Handling

TypedArrays (e.g., `Uint8Array`, `Int32Array`) and `ArrayBuffer` instances have special security handling to balance usability with sandbox protection.

#### Element Mutation is Allowed

Unlike other host objects which are fully read-only, TypedArrays allow **element mutation via numeric indices**. This enables common patterns like:

```typescript
const sandbox = createSandbox({ env: "es2022", apis: ["text", "buffer"] });

await sandbox.run(`
  async function run() {
    const arr = new Uint8Array(3);
    arr[0] = 10;  // Allowed - numeric index write
    arr[1] = 20;  // Allowed
    
    const encoder = new TextEncoder();
    const buffer = new Uint8Array(100);
    encoder.encodeInto('Hello', buffer);  // Allowed - writes to buffer
  }
  run();
`);
```

However, non-index property modifications are still blocked:

```typescript
await sandbox.run(`
  async function run() {
    const arr = new Uint8Array(3);
    arr.foo = 'bar';  // Blocked - not a numeric index
  }
  run();
`);
```

#### Unwrapped for Native Methods

When TypedArrays or `ArrayBuffer` instances are passed to host functions, they are **automatically unwrapped** from their `ReadOnlyProxy` wrapper. This is necessary because native methods like `TextDecoder.decode()` require actual TypedArray instances, not Proxy objects.

```typescript
const sandbox = createSandbox({ env: "es2024", apis: ["text", "buffer"] });

await sandbox.run(`
  async function run() {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const bytes = encoder.encode('hello');  // Returns proxied Uint8Array
    decoder.decode(bytes);                   // bytes is unwrapped for native decode()
  }
  run();
`);
```

**What this means:**

- Native host methods receive the real TypedArray, not a Proxy
- Element mutation is allowed within the sandbox via numeric indices
- The underlying `ArrayBuffer` memory is shared - the proxy never creates a copy

**Risk Assessment:** Low

1. **Host functions are trusted** - They are provided by the embedder, not the sandbox. If an embedder injects a malicious host function, they've already compromised their own sandbox.
2. **TypedArrays are value containers** - Unlike objects with methods that could be exploited, TypedArrays are essentially byte buffers with no dangerous capabilities.
3. **No new data exposed** - The `ReadOnlyProxy` wraps the same underlying `ArrayBuffer`. Unwrapping doesn't expose new data, just removes the proxy layer.
4. **Narrow scope** - Only TypedArrays and ArrayBuffers receive this special handling, not arbitrary objects.

**If you need stronger isolation:**

If your use case requires preventing sandbox code from mutating TypedArrays or preventing native host code from seeing sandbox-created data, avoid providing TypedArray-related APIs, or implement your own copying wrapper that creates a fresh TypedArray from the data before passing to sensitive operations.

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

The sandbox provides execution limits to protect against denial-of-service attacks from untrusted
code. Safe per-run defaults are enabled automatically:

- `callDepth: 250`
- `loops: 100_000`
- `memoryBytes: 16 * 1024 * 1024`

You can tighten or relax these limits per run:

```typescript
const sandbox = createSandbox({ env: "es2022" });

const result = sandbox.runSync(
  `
  function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  factorial(10);
`,
  {
    limits: {
      callDepth: 100,
      loops: 10000,
      memoryBytes: 10 * 1024 * 1024, // 10 MB
    },
  },
);
```

### `maxCallStackDepth`

Limits the depth of function call nesting. When exceeded, throws `InterpreterError: Maximum call stack depth exceeded`.

**Use case:** Prevent stack overflow from infinite recursion.

```typescript
// This will throw when maxCallStackDepth is exceeded
const sandbox = createSandbox({ env: "es2022" });

sandbox.runSync(
  `
  function infinite() { return infinite(); }
  infinite();
`,
  { limits: { callDepth: 50 } },
);
```

### `maxLoopIterations`

Limits the number of iterations **per loop**. Each loop (while, for, do-while, for-of, for-in) has its own counter that resets when the loop completes. When exceeded, throws `InterpreterError: Maximum loop iterations exceeded`.

**Use case:** Prevent infinite loops from consuming CPU.

```typescript
// This will throw when maxLoopIterations is exceeded
const sandbox = createSandbox({ env: "es2022" });

sandbox.runSync(`while (true) { }`, { limits: { loops: 1000 } });

// This works because each loop is under the limit
const sandbox = createSandbox({ env: "es2022" });

sandbox.runSync(
  `
  for (let i = 0; i < 500; i++) { }  // 500 iterations
  for (let j = 0; j < 500; j++) { }  // 500 iterations
`,
  { limits: { loops: 1000 } },
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
const sandbox = createSandbox({ env: "es2022" });

sandbox.runSync(
  `
  const huge = [];
  for (let i = 0; i < 100000; i++) {
    huge.push([1, 2, 3, 4, 5]);
  }
`,
  { limits: { memoryBytes: 1024 * 1024, loops: 1000000 } },
);
```

### Combined with Timeout

For async evaluations, use first-class `timeoutMs`:

```typescript
await sandbox.run(code, {
  timeoutMs: 5000,
  limits: { callDepth: 100, loops: 100000, memoryBytes: 10 * 1024 * 1024 },
});
```

### Execution Limits and AbortSignal

You can also use `AbortSignal` for immediate cancellation:

```typescript
const controller = new AbortController();

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000);

await sandbox.run(code, {
  signal: controller.signal,
  limits: { loops: 100000 },
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
import { createSandbox, ResourceExhaustedError } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  limits: {
    total: {
      memoryBytes: 100 * 1024 * 1024, // 100 MB
      iterations: 1_000_000, // 1M iterations
      functionCalls: 10_000, // 10K calls
      evaluations: 100, // 100 evaluations
    },
  },
});

try {
  await sandbox.run("const arr = Array(1000).fill(0).map((_, i) => i)");
  await sandbox.run("for (let i = 0; i < 10000; i++) { }");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
  }
}

const stats = sandbox.resources();
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

### Internal Resource Methods

Low-level resource APIs (history, resets, and explicit limit setters) are available on the
internal `Interpreter` class. See [Internal Classes](INTERNAL_CLASSES.md).

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
import { createSandbox, ResourceExhaustedError } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  limits: { total: { evaluations: 5 } },
});

try {
  for (let i = 0; i < 10; i++) {
    sandbox.runSync("1 + 1");
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
function createPluginSandbox(pluginId: string, memoryLimit: number) {
  return createSandbox({
    env: "es2022",
    globals: getPluginGlobals(pluginId),
    limits: { total: { memoryBytes: memoryLimit } },
  });
}

const plugin1 = createPluginSandbox("plugin1", 50 * 1024 * 1024);
const plugin2 = createPluginSandbox("plugin2", 50 * 1024 * 1024);

plugin1.runSync(plugin1Code);
const stats = plugin1.resources();
if ((stats?.memoryBytes ?? 0) > 40 * 1024 * 1024) {
  console.log("Plugin1 approaching memory limit");
}
```

#### Educational Platforms

Monitor student code for excessive resource consumption:

```typescript
const studentSandbox = createSandbox({
  env: "es2022",
  limits: { total: { evaluations: 50, iterations: 100000, cpuTimeMs: 5000 } },
});

// Allow multiple submissions
for (const code of studentSubmissions) {
  studentSandbox.runSync(code);
}
```

#### Rate Limiting

Implement evaluation-count-based rate limiting:

```typescript
let sandbox = createSandbox({
  env: "es2022",
  limits: { total: { evaluations: 1000 } },
});

// Reset at the start of each billing cycle
setInterval(
  () => {
    sandbox = createSandbox({
      env: "es2022",
      limits: { total: { evaluations: 1000 } },
    });
  },
  24 * 60 * 60 * 1000,
); // Daily reset
```

### History Tracking

For evaluation history and detailed inspection, use the internal Interpreter API
(see [Internal Classes](INTERNAL_CLASSES.md)).

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
const sandbox = createSandbox({
  env: "es2022",
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

## Concurrent Run Isolation

The interpreter guarantees policy isolation between concurrent runs on the same sandbox instance. Each run has its own isolated execution context for:

### Feature Control Isolation

Per-call feature toggles are scoped to each evaluation:

```typescript
const sb = createSandbox({ env: "es2022" });

const run1 = sb.run(
  "obj.secret",
  { features: { mode: "blacklist", disable: ["MemberExpression"] } },
);

const run2 = sb.run("obj.value"); // No restrictions

await Promise.all([run1, run2]);
// run1 throws "MemberExpression is not enabled"
// run2 succeeds
```

### Validator Isolation

Per-call validators apply only to their evaluation:

```typescript
const sb = createSandbox({ env: "es2022" });

const validator1 = (ast) => {
  console.log("validator1 called");
  return true;
};

const validator2 = (ast) => {
  console.log("validator2 called");
  return true;
};

await Promise.all([
  sb.run(code1, { validator: validator1 }),
  sb.run(code2, { validator: validator2 }),
]);
// Both validators are called independently
```

### Abort Signal Isolation

Aborting one run does not affect sibling runs:

```typescript
const sb = createSandbox({ env: "es2022" });
const controller = new AbortController();

const run1 = sb.run(longRunningCode, { signal: controller.signal });
const run2 = sb.run(shortCode); // No abort signal

controller.abort(); // Only run1 is cancelled

const [result1, result2] = await Promise.allSettled([run1, run2]);
// result1: rejected (aborted)
// result2: fulfilled
```

### Limit Isolation

Per-run limits are applied independently:

```typescript
const sb = createSandbox({ env: "es2022" });

await sb.run(heavyLoop, { limits: { loops: 100 } });
await sb.run(heavyLoop, { limits: { loops: 100 } });
// Both runs get 100 loop iterations - no leakage
```

### Shared State Considerations

While policy controls are isolated, **shared interpreter state persists**:

- Declared variables and functions persist across runs
- Constructor globals remain available
- Module cache is shared

For complete isolation (no shared state), use separate sandbox instances:

```typescript
// Each run gets a fresh interpreter
const [result1, result2] = await Promise.all([
  run("code1", { sandbox: createSandbox() }),
  run("code2", { sandbox: createSandbox() }),
]);
```
