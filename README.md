# NookJS

A fast, secure JavaScript/TypeScript interpreter written in TypeScript. Execute untrusted code safely with a zero-dependency custom AST parser, sandbox isolation, and fine-grained feature control.

[![npm version](https://img.shields.io/npm/v/nookjs.svg)](https://npmjs.com/package/nookjs)
[![License](https://img.shields.io/npm/l/nookjs.svg)](LICENSE.md)

## What is NookJS?

NookJS is a JavaScript interpreter designed for safely executing untrusted code in a sandboxed environment. It parses and evaluates a subset of JavaScript (with TypeScript-style type annotations stripped) while providing strong security guarantees through:

- **Sandbox Isolation**: Complete isolation from the host environment with no access to `eval`, `Function`, or native prototypes
- **Feature Control**: Fine-grained whitelisting of language features (ES5 through ES2024 presets)
- **Global Injection**: Safe injection of host functions and data with property access protection
- **Zero Dependencies**: Custom AST parser with no runtime dependencies

### Compatibility Note

NookJS prioritizes sandbox safety and predictable host isolation over exact native-JavaScript parity in every edge case. Some behaviors are intentionally different from native JS semantics.

One important example: division/modulo by zero throws `InterpreterError` instead of returning `Infinity`, `-Infinity`, or `NaN`.

See [Limitations](#limitations) for the full list of known semantic differences.

### Use Cases

- **Plugin Systems**: Allow users to write custom logic without compromising security
- **Formula Evaluation**: Safely evaluate user-defined expressions and calculations
- **Template Engines**: Execute template logic with controlled access to data
- **Educational Tools**: Teach JavaScript in a safe, controlled environment
- **Rule Engines**: Run business rules written by non-developers

## Installation

```bash
# npm
npm install nookjs

# yarn
yarn add nookjs

# bun
bun add nookjs
```

## Quick Start

```typescript
import { createSandbox, parse, run } from "nookjs";

// One-off evaluation
const result = await run("2 + 3 * 4");
console.log(result); // 14

// Reusable sandbox
const sandbox = createSandbox({
  env: "es2022",
  apis: ["console"],
  globals: { PI: 3.14159 },
});

const value = await sandbox.run(`
  let numbers = [1, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum = sum + numbers[i];
  }
  sum + PI
`);

console.log(value); // 18.14159
```

### Advanced API (Internal Classes)

For low-level control (custom resolvers, direct evaluation, internal stats), see
[Internal Classes](docs/INTERNAL_CLASSES.md).

## Security Sandbox

The interpreter establishes a security boundary between your trusted host code and untrusted sandbox code.

### What's Blocked

```typescript
// These all throw security errors
obj.__proto__; // Prototype pollution
obj.constructor; // Constructor access
obj.prototype; // Prototype access
obj.__defineGetter__; // Legacy methods
obj.__defineSetter__;
obj.__lookupGetter__;
obj.__lookupSetter__;

eval("dangerous()"); // No eval access
Function("return x"); // No Function constructor
require("fs"); // No Node.js modules
```

### What Sandboxed Code Can Access

Sandboxed code has access only to:

- Variables it declares itself
- Injected globals you explicitly provide
- Built-in values: `undefined`, `NaN`, `Infinity`, `Symbol`, `Promise`
- `globalThis`/`global` (references the sandbox's scope, not the host)
- Control flow (if, for, while, etc.)

```typescript
const sandbox = createSandbox({
  env: "minimal",
  globals: {
    PI: 3.14159,
    calculateArea: (r: number) => PI * r * r,
  },
});

await sandbox.run("calculateArea(5)"); // 78.53975
await sandbox.run("Math.PI"); // Error: Math is not defined
```

### Security Best Practices

1. **Use built-in timeouts** for async/untrusted workloads:

```typescript
const sandbox = createSandbox({ env: "es2022", timeoutMs: 5000 });
const result = await sandbox.run(untrustedCode);

// Optional per-run override
await sandbox.run(untrustedCode, { timeoutMs: 1000 });
```

2. **Clone sensitive data** before passing as globals:

```typescript
await sandbox.run(code, {
  globals: { state: structuredClone(sharedState) },
});
```

3. **Validate host function arguments** - never trust sandbox input

4. **Use per-call globals** for isolation between executions

See [Security Documentation](docs/SECURITY.md) for complete details.

## Feature Whitelisting

Control exactly which JavaScript features are available using the feature control system. Choose from pre-configured ECMAScript presets or build your own custom configuration.

### ECMAScript Presets

```typescript
import { createSandbox } from "nookjs";

const es5 = createSandbox({ env: "es5" }); // var, functions, loops
const es2015 = createSandbox({ env: "es2015" }); // + let/const, arrow functions
const es2017 = createSandbox({ env: "es2017" }); // + async/await
const es2020 = createSandbox({ env: "es2020" }); // + nullish coalescing
```

| Preset      | Description                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| ES5         | Baseline JavaScript: var, functions, for/while loops, objects/arrays            |
| ES2015      | Modern JavaScript: let/const, arrow functions, template literals, destructuring |
| ES2016      | + Exponentiation (`**`), Array.includes                                         |
| ES2017      | + async/await                                                                   |
| ES2018-2024 | Progressive enhancements                                                        |
| ESNext      | All features enabled                                                            |

### Custom Feature Control

```typescript
const sandbox = createSandbox({
  env: "es2022",
  features: {
    mode: "whitelist",
    enable: [
      "VariableDeclarations",
      "FunctionDeclarations",
      "BinaryOperators",
      "IfStatement",
      "ForStatement",
    ],
  },
});

sandbox.runSync("() => {}"); // Error: ArrowFunctions is not enabled
```

Use blacklist mode to disable specific features:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  features: {
    mode: "blacklist",
    disable: ["ForStatement", "WhileStatement"], // Allow loops except these
  },
});
```

See [Presets Documentation](docs/PRESETS.md) and [Language Features](docs/README.md) for complete details.

## Global Value Injection

Inject variables and functions from the host environment into sandbox code.

### Constructor Globals (Persistent)

Globals passed when creating the sandbox persist across all runs:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  globals: {
    PI: 3.14159,
    VERSION: "1.0.0",
    config: { debug: true, maxItems: 100 },
  },
});

await sandbox.run("PI * 2"); // 6.28318
await sandbox.run("config.debug"); // true
```

### Per-Call Globals (Temporary)

Globals passed to individual runs are available only for that execution:

```typescript
await sandbox.run("x + y", {
  globals: { x: 10, y: 20 },
}); // 30

await sandbox.run("x + y"); // Error: x/y are not defined
```

### Host Functions

Pass functions from your host code that sandbox code can call:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  globals: {
    double: (x: number) => x * 2,
    log: (msg: string) => console.log(msg),
    random: () => Math.random(),
  },
});

await sandbox.run("double(5)"); // 10
await sandbox.run('log("Hello sandbox!")'); // Logs to console
```

### Merged Globals

Per-call globals override constructor globals (but not user-declared variables):

```typescript
const sandbox = createSandbox({
  env: "es2022",
  globals: { multiplier: 10 },
});

await sandbox.run("multiplier * 5"); // 50
await sandbox.run("multiplier * 5", {
  globals: { multiplier: 2 },
}); // 10
```

### Property Protection

All injected globals are protected from sandbox manipulation:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  globals: { myFunc: () => "secret" },
});

await sandbox.run("myFunc.name"); // Error: Cannot access properties on host functions
await sandbox.run("myFunc()"); // "secret" (calling works)
```

## Async Support

The sandbox supports both synchronous and asynchronous execution:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  globals: {
    fetchData: async (id: number) => {
      const response = await fetch(`/api/${id}`);
      return response.json();
    },
  },
});

const result = await sandbox.run(`
  let data = await fetchData(123);
  data.name
`);
```

## ES Module Support

NookJS supports ES module syntax (`import`/`export`) through a custom module resolver system. This enables modular code organization while maintaining full sandbox security.

### Basic Usage

```typescript
import { createSandbox } from "nookjs";

// Define your modules
const sandbox = createSandbox({
  env: "es2022",
  modules: {
    files: {
      "math.js": "export const add = (a, b) => a + b; export const PI = 3.14159;",
      "utils.js": "export function double(x) { return x * 2; }",
    },
  },
});

// Evaluate module code
const exports = await sandbox.runModule(
  `import { add, PI } from "math.js";
   import { double } from "utils.js";
   export const result = double(add(1, 2));
   export const circumference = 2 * PI * 5;`,
  { path: "main.js" },
);

console.log(exports.result); // 6
console.log(exports.circumference); // 31.4159
```

### Supported Syntax

```typescript
// Named imports
import { foo, bar } from "module.js";
import { foo as renamed } from "module.js";

// Default imports
import myDefault from "module.js";

// Namespace imports
import * as utils from "module.js";

// Side-effect only imports
import "polyfill.js";

// Named exports
export const value = 42;
export function helper() {}
export class MyClass {}

// Default exports
export default function () {}
export default { key: "value" };

// Re-exports
export { foo, bar } from "other.js";
export * from "other.js";
export * as namespace from "other.js";
```

### Pre-built Modules

Inject host modules directly without source code parsing:

```typescript
const sandbox = createSandbox({
  env: "es2022",
  modules: {
    externals: {
      lodash: { map, filter, reduce },
    },
  },
});
```

### Module Introspection

Query the module cache and metadata:

Module cache introspection and low-level module APIs are available on the internal
`Interpreter` class. See [Internal Classes](docs/INTERNAL_CLASSES.md) for details.

See [Module Documentation](docs/MODULES.md) for complete details including security considerations, lifecycle hooks, and advanced resolver patterns.

## TypeScript Support

TypeScript-style type annotations are automatically stripped at parse time:

```typescript
const sandbox = createSandbox({ env: "es2022" });

await sandbox.run(`
  function greet(name: string): string {
    return "Hello, " + name;
  }
  greet("World")
`); // "Hello, World"
```

Supported (stripped):

- Variable/parameter/property type annotations
- Function return types
- `as` assertions
- `type` and `interface` declarations

## FAQ

### Is NookJS a VM or process sandbox?

No. NookJS is a **language-level interpreter sandbox**. It blocks dangerous language/runtime access
(`eval`, `Function`, prototype-escape paths) and isolates interpreted code from your host values, but
it is not a substitute for OS/process isolation when your threat model requires kernel boundaries.

### Is it safe for untrusted code?

It is designed for untrusted code execution with:

- Read-only wrapping of injected host values
- Dangerous property blocking
- Forbidden global injection (`eval`, `Function`, `Proxy`, `Reflect`, etc.)
- Error sanitization controls
- Execution guards (`limits`, `timeoutMs`, `AbortSignal`)

For production multi-tenant workloads, pair interpreter controls with external isolation/rate-limits.
See [Security Guide](docs/SECURITY.md).

### Does NookJS implement all of JavaScript?

No. It supports a large, practical subset controlled by presets/feature flags, with explicit
interpreter-specific behavior in some areas. See [Language Features](docs/README.md) for
feature-by-feature behavior and gotchas.

### How should I choose between `run()`, `runSync()`, `runModule()`, and `parse()`?

- `run()` for async-capable script evaluation
- `runSync()` for sync-only script evaluation
- `runModule()` for ES module code (`import`/`export`, top-level `await`)
- `parse()` when you want AST-only parsing without execution

### What TypeScript does it support?

NookJS strips TypeScript-style annotations/comments and executes the resulting JavaScript.
Supported stripping includes annotations, return types, `as`, and `type/interface` declarations.

Not supported as TypeScript input:

- TSX/JSX
- `enum` / `namespace`
- Type-only imports/exports (`import type`, `export type`)

### How do `env`, `features`, and `apis` differ?

- `env`: language/builtin baseline (`es5` ... `es2024`, `esnext`, `minimal`)
- `features`: explicit enable/disable control for syntax/runtime features
- `apis`: host-like globals (`fetch`, `console`, `timers`, `crypto`, etc.)

Use `env` for default posture, then tighten/relax with `features` and `apis`.

### What globals are available by default?

Always available: `undefined`, `NaN`, `Infinity`, `Symbol`, `Promise`, `globalThis`, `global`.

`globalThis` and `global` are sandbox-owned objects and are separate references. They do not
automatically mirror lexical variables or injected globals. See [Builtin Globals](docs/BUILTIN_GLOBALS.md).

### Do globals and variables persist across runs?

With a reusable sandbox/interpreter, user-declared variables and constructor globals persist across
runs. Per-call globals apply only to that call and are cleaned up afterward.

### Can sandbox code mutate host objects I inject?

Generally no. Injected host objects are read-only wrapped. Notable exception: typed array element
writes by numeric index are allowed for compatibility (e.g., `TextEncoder.encodeInto` flows). See
[Security Guide](docs/SECURITY.md#known-limitations).

### Why does `myHostFunc.name` or `myHostFunc.call(...)` throw?

Host function property access is intentionally restricted to avoid escape vectors. Direct invocation is
allowed (`myHostFunc(...)`), but dangerous/introspective function properties are blocked.

### How do I prevent infinite loops or expensive code paths?

Use multiple controls together:

- Per-run limits (`loops`, `callDepth`, `memoryBytes`)
- Total limits for cumulative usage (`limits.total`)
- Async timeout (`timeoutMs`)
- Optional cancellation (`AbortSignal`)

### How do I get better error details during development?

Use `policy.errors`:

- `"safe"` (default): hide host details + sanitize stack
- `"sanitize"`: keep host messages, sanitize stack
- `"full"`: full host errors (use carefully for production)

### How do modules work?

Enable `modules` and use `runModule()` with a module `path`. You can provide module sources via
`files`, `ast`, or `externals`, or supply a custom resolver.

### Does `run()` support top-level `await`?

No. Top-level `await` is supported only for module evaluation (`runModule()`).

### Can I use `require()` or Node-style module resolution?

`require` is not available. The ES module system is resolver-driven and does not do automatic
Node-style resolution unless your resolver implements it.

### Is module output mutable?

No. Export namespaces are read-only/frozen from sandbox code. Module caching is enabled by default
and can be disabled/configured.

### How can I inspect resource usage?

Use `result: "full"` per call for execution stats, and `sandbox.resources()` for cumulative stats when
resource tracking is enabled.

## Limitations

### Security model boundaries

- Language-level sandboxing only; not a process/VM boundary.
- Host functions are trusted by design. If you expose dangerous host behavior, sandbox code can call it.
- Dangerous property names and symbols are blocked, which may differ from native JS expectations.
- `eval`, `Function`, `Proxy`, `Reflect`, async/generator function constructors cannot be injected.

### Language semantics that differ from native JS

- `var` is not hoisted to `undefined`; it is created at evaluation time.
- `division`/`modulo` by zero throws `InterpreterError` instead of yielding JS numeric infinities/NaN.
- Generator/async generator objects do not provide full native prototype/`instanceof` behavior.

### Syntax/feature scope

- Parser targets interpreter-supported syntax, not arbitrary JS/TS grammar.
- Hashbang (`#!`) is not stripped by the parser.
- TypeScript support is strip-only and excludes TSX/JSX, `enum`, `namespace`, and type-only import/export.
- Some constructs have intentionally narrower behavior (for example, spread/destructuring/loop gotchas in feature docs).

### Module system gaps vs native ESM

- No dynamic `import()`.
- No `import.meta`.
- No live bindings; exports are snapshot-based.
- Module resolution is custom/resolver-driven (no automatic Node resolution).
- Module system is opt-in and disabled unless `modules` config is provided.

### Host interop and reflection constraints

- Many prototype/reflection access paths are intentionally blocked for safety.
- Host function internals/properties are restricted; direct calls are allowed.
- Dangerous/inherited symbol property access is blocked in security-sensitive paths.
- `call`/`apply`/`bind` on host functions are blocked.

### Built-in/runtime API coverage

- Available globals depend on selected `env` and explicit `apis`.
- Web/runtime APIs are opt-in via `apis` and depend on what the host runtime provides.
- Built-in method exposure is curated; some standard prototype methods are intentionally unavailable.

### Data model and mutability constraints

- Injected host objects are read-only proxied.
- Custom host `valueOf` is intentionally not invoked to avoid data leakage.
- Typed arrays are special-cased: numeric index writes are allowed and may be unwrapped for native host APIs.
- Promise objects pass through unwrapped for correct async behavior.

### Execution control limitations

- Memory and CPU tracking are best-effort heuristics, not exact runtime accounting.
- Loop limits are per-loop counters (they reset between loops).
- `timeoutMs` is an async execution guard (use external process-level limits for hard enforcement).
- In sync mode (`runSync()` / `evaluate()`), async host function flows are not supported.

### Operational behavior to plan for

- Reused sandboxes are stateful by default (variables can persist across runs).
- Per-call globals are temporary and do not persist after the call.
- Module caching is enabled by default unless configured otherwise.
- `run()` script mode does not allow top-level `await`; use `runModule()` for that.

## Documentation

- [Security Guide](docs/SECURITY.md) - Sandboxing model and recommendations
- [Presets Guide](docs/PRESETS.md) - ECMAScript versions and feature control
- [Module System](docs/MODULES.md) - ES module support with import/export syntax
- [Language Features](docs/README.md) - Detailed documentation for each supported feature
- [Builtin Globals](docs/BUILTIN_GLOBALS.md) - Available built-in globals
- [Examples](examples/README.md) - Simplified API examples and advanced/internal examples

## API Reference

### Simplified API

```typescript
import { createSandbox, run } from "nookjs";

// One-off
await run("1 + 2");

// Reusable sandbox
const sandbox = createSandbox({
  env: "es2022",
  apis: ["fetch", "console"],
  globals: { VERSION: "1.0.0" },
  limits: {
    perRun: { loops: 1_000_000, callDepth: 200 },
    total: { memoryBytes: 50 * 1024 * 1024 },
  },
  policy: { errors: "safe" },
});

const value = await sandbox.run("VERSION");

const ast = parse("1 + 2");
```

**Options overview**

- `env`: Language preset (`"minimal"`, `"es2022"`, `"esnext"`, `"browser"`, `"node"`, `"wintercg"`)
- `apis`: Add-on globals (`"fetch"`, `"console"`, `"timers"`, `"crypto"`, `"text"`, `"streams"`, etc.)
- `globals`: Host-provided values
- `limits.perRun`: Per-evaluation guards (`loops`, `callDepth`, `memoryBytes`) with safe defaults
  of `{ loops: 100_000, callDepth: 250, memoryBytes: 16MB }`
- `limits.total`: Cumulative resource limits (requires integrated tracking)
- `timeoutMs`: First-class async timeout (sandbox-level default or per-run override)
- `policy.errors`: `"safe"` | `"sanitize"` | `"full"`
- `modules`: `{ files, ast, externals }` for easy module resolution

### Internal Classes

Need low-level access (Interpreter, ModuleSystem, ResourceTracker)? See
[Internal Classes](docs/INTERNAL_CLASSES.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
