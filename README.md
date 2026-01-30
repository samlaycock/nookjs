# NookJS

A fast, secure JavaScript/TypeScript interpreter written in TypeScript. Execute untrusted code safely with a zero-dependency custom AST parser, sandbox isolation, and fine-grained feature control.

[![npm version](https://img.shields.io/npm/v/nookjs.svg)](https://npmjs.com/package/nookjs)
[![License](https://img.shields.io/npm/l/nookjs.svg)](LICENSE.md)

## What is NookJS?

NookJS is a JavaScript interpreter designed for safely executing untrusted code in a sandboxed environment. It parses and evaluates a subset of JavaScript (with TypeScript-style type annotations stripped) while providing strong security guarantees through:

- **Sandbox Isolation**: Complete isolation from the host environment with no access to `eval`, `Function`, `globalThis`, or native prototypes
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
import { Interpreter } from "nookjs";

const interpreter = new Interpreter();

const result = interpreter.evaluate("2 + 3 * 4");
console.log(result); // 14

interpreter.evaluate(`
  let numbers = [1, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum = sum + numbers[i];
  }
  sum
`); // 15
```

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
globalThis.someVar; // No host globals
require("fs"); // No Node.js modules
```

### What Sandboxed Code Can Access

Sandboxed code has access only to:

- Variables it declares itself
- Injected globals you explicitly provide
- Math operations, string/array methods you enable
- Control flow (if, for, while, etc.)

```typescript
const interpreter = new Interpreter({
  globals: {
    PI: 3.14159,
    calculateArea: (r: number) => PI * r * r,
  },
});

interpreter.evaluate("calculateArea(5)"); // 78.53975
interpreter.evaluate("Math.PI"); // Error: Math is not defined
```

### Security Best Practices

1. **Always use timeouts** to prevent infinite loops:

```typescript
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
const result = await Promise.race([interpreter.evaluateAsync(untrustedCode), timeout]);
```

2. **Clone sensitive data** before passing as globals:

```typescript
interpreter.evaluateAsync(code, {
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
import { Interpreter, ES5, ES2015, ES2017, ES2020 } from "nookjs";

const es5 = new Interpreter(ES5); // var, functions, loops
const es2015 = new Interpreter(ES2015); // + let/const, arrow functions
const es2017 = new Interpreter(ES2017); // + async/await
const es2020 = new Interpreter(ES2020); // + nullish coalescing
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
const interpreter = new Interpreter({
  featureControl: {
    mode: "whitelist",
    features: [
      "VariableDeclarations",
      "FunctionDeclarations",
      "BinaryOperators",
      "IfStatement",
      "ForStatement",
    ],
  },
});

interpreter.evaluate("() => {}"); // Error: ArrowFunctions is not enabled
```

Use blacklist mode to disable specific features:

```typescript
const interpreter = new Interpreter({
  featureControl: {
    mode: "blacklist",
    features: ["ForStatement", "WhileStatement"], // Allow loops except these
  },
});
```

See [Presets Documentation](docs/PRESETS.md) and [Language Features](docs/README.md) for complete details.

## Global Value Injection

Inject variables and functions from the host environment into sandbox code.

### Constructor Globals (Persistent)

Globals passed when creating the interpreter persist across all `evaluate()` calls:

```typescript
const interpreter = new Interpreter({
  globals: {
    PI: 3.14159,
    VERSION: "1.0.0",
    config: { debug: true, maxItems: 100 },
  },
});

interpreter.evaluate("PI * 2"); // 6.28318
interpreter.evaluate("config.debug"); // true
```

### Per-Call Globals (Temporary)

Globals passed to individual `evaluate()` calls are available only for that execution:

```typescript
interpreter.evaluate("x + y", {
  globals: { x: 10, y: 20 },
}); // 30

interpreter.evaluate("x + y"); // Error: x/y are not defined
```

### Host Functions

Pass functions from your host code that sandbox code can call:

```typescript
const interpreter = new Interpreter({
  globals: {
    double: (x: number) => x * 2,
    log: (msg: string) => console.log(msg),
    random: () => Math.random(),
  },
});

interpreter.evaluate("double(5)"); // 10
interpreter.evaluate('log("Hello sandbox!")'); // Logs to console
```

### Merged Globals

Per-call globals override constructor globals (but not user-declared variables):

```typescript
const interpreter = new Interpreter({
  globals: { multiplier: 10 },
});

interpreter.evaluate("multiplier * 5"); // 50
interpreter.evaluate("multiplier * 5", {
  globals: { multiplier: 2 },
}); // 10
```

### Property Protection

All injected globals are protected from sandbox manipulation:

```typescript
const interpreter = new Interpreter({
  globals: { myFunc: () => "secret" },
});

myFunc.name; // Error: Cannot access properties on host functions
myFunc(); // "secret" (calling works)
```

## Async Support

The interpreter supports both synchronous and asynchronous execution:

```typescript
const interpreter = new Interpreter({
  globals: {
    fetchData: async (id: number) => {
      const response = await fetch(`/api/${id}`);
      return response.json();
    },
  },
});

const result = await interpreter.evaluateAsync(`
  let data = await fetchData(123);
  data.name
`);
```

## TypeScript Support

TypeScript-style type annotations are automatically stripped at parse time:

```typescript
const interpreter = new Interpreter();

interpreter.evaluate(`
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
- [Language Features](docs/README.md) - Detailed documentation for each supported feature
- [Builtin Globals](docs/BUILTIN_GLOBALS.md) - Available built-in globals

## API Reference

### `new Interpreter(options?)`

Creates a new interpreter instance.

```typescript
interface InterpreterOptions {
  globals?: Record<string, unknown>;
  featureControl?: FeatureControl;
  validator?: (ast: Program) => boolean;
}
```

### `interpreter.evaluate(code, options?)`

Synchronously evaluates JavaScript code.

```typescript
evaluate(code: string, options?: EvaluateOptions): unknown

interface EvaluateOptions {
  globals?: Record<string, unknown>;
  validator?: (ast: Program) => boolean;
}
```

### `interpreter.evaluateAsync(code, options?)`

Asynchronously evaluates JavaScript code.

```typescript
evaluateAsync(code: string, options?: EvaluateOptions): Promise<unknown>
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
