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

1. **Always use timeouts** to prevent infinite loops:

```typescript
const sandbox = createSandbox({ env: "es2022" });
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
const result = await Promise.race([sandbox.run(untrustedCode), timeout]);
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

## Documentation

- [Security Guide](docs/SECURITY.md) - Sandboxing model and recommendations
- [Presets Guide](docs/PRESETS.md) - ECMAScript versions and feature control
- [Module System](docs/MODULES.md) - ES module support with import/export syntax
- [Language Features](docs/README.md) - Detailed documentation for each supported feature
- [Builtin Globals](docs/BUILTIN_GLOBALS.md) - Available built-in globals

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
- `limits.perRun`: Per-evaluation guards (`loops`, `callDepth`, `memoryBytes`)
- `limits.total`: Cumulative resource limits (requires integrated tracking)
- `policy.errors`: `"safe"` | `"sanitize"` | `"full"`
- `modules`: `{ files, ast, externals }` for easy module resolution

### Internal Classes

Need low-level access (Interpreter, ModuleSystem, ResourceTracker)? See
[Internal Classes](docs/INTERNAL_CLASSES.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
