# Internal Classes (Advanced)

The simplified API (`run`, `createSandbox`, `parse`) covers most use cases. If you need
fine-grained control, you can use the internal classes exposed from the package.

> These are advanced APIs. Prefer `createSandbox` unless you need direct access to the
> interpreter or module internals.
> See also: [`examples/internal/interpreter.ts`](../examples/internal/interpreter.ts).

## Interpreter

```typescript
import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      log: console.log,
      double: (x) => x * 2,
    },
  }),
);

const result = interpreter.evaluate("double(21)");
console.log(result); // 42
```

Async evaluation:

```typescript
const value = await interpreter.evaluateAsync(`
  async function run() {
    return await Promise.resolve(123);
  }
  run();
`);
console.log(value); // 123
```

## Module System (Resolver)

```typescript
import { Interpreter, ModuleResolver } from "nookjs";

const files = new Map([["math.js", "export const add = (a, b) => a + b;"]]);

const resolver: ModuleResolver = {
  resolve(specifier) {
    const code = files.get(specifier);
    if (!code) return null;
    return { type: "source", code, path: specifier };
  },
};

const interpreter = new Interpreter({
  modules: { enabled: true, resolver },
});

const exports = await interpreter.evaluateModuleAsync(
  'import { add } from "math.js"; export const result = add(1, 2);',
  { path: "main.js" },
);

console.log(exports.result); // 3
```

## Module Introspection

```typescript
interpreter.isModuleCached("math.js");
interpreter.getLoadedModuleSpecifiers();
interpreter.getModuleMetadata("math.js");
interpreter.clearModuleCache();
```

## ResourceTracker (Standalone)

```typescript
import { ResourceTracker } from "nookjs";

const tracker = new ResourceTracker({
  limits: {
    maxTotalMemory: 100 * 1024 * 1024,
    maxTotalIterations: 1_000_000,
  },
  historySize: 100,
});

const stats = tracker.getStats();
console.log(stats.memoryBytes);
```

## Errors

All interpreter errors extend `InterpreterError`:

```typescript
import {
  InterpreterError,
  ParseError,
  RuntimeError,
  SecurityError,
} from "nookjs";

try {
  // ...
} catch (error) {
  if (error instanceof ParseError) {
    // syntax error
  } else if (error instanceof SecurityError) {
    // blocked access
  } else if (error instanceof RuntimeError) {
    // thrown value in sandbox
  } else if (error instanceof InterpreterError) {
    // generic interpreter error
  }
}
```
