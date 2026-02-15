# Simplified Sandbox API

NookJS includes a simplified API for common use cases. Use `run()` for one-off evaluations, or
`createSandbox()` for reusable sandboxes with intuitive configuration options.

## One-off execution

```typescript
import { run } from "nookjs";

const value = await run("2 + 3 * 4");
console.log(value); // 14
```

## Create a sandbox

```typescript
import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  apis: ["console"],
  timeoutMs: 5000,
  globals: {
    PI: 3.14159,
    double: (x: number) => x * 2,
  },
  limits: {
    perRun: { loops: 1_000_000, callDepth: 200 },
    total: { memoryBytes: 50 * 1024 * 1024 },
  },
  policy: { errors: "safe" },
});

const result = await sandbox.run("double(PI)");
console.log(result); // 6.28318
```

## Parse without executing

```typescript
import { parse } from "nookjs";

const ast = parse("const x = 1 + 2;");
console.log(ast.type); // Program
```

You can also parse using sandbox defaults:

```typescript
const ast = parse("const x = 1", {
  sandbox: { env: "es2022", validator: (tree) => tree.body.length > 0 },
});
```

## Options overview

### `env`

Controls the language preset and built-in globals.

Allowed values:

- `"minimal"`
- `"es5"`, `"es6"`, `"es2015"` ... `"es2024"`, `"esnext"`
- `"browser"`, `"node"`, `"wintercg"`

### `apis`

Adds host-like globals via preset bundles.

Common values:

- `"console"`, `"fetch"`, `"timers"`, `"text"`, `"crypto"`, `"streams"`, `"blob"`, `"buffer"`

### `features`

Enable or disable language features without building a full `featureControl` list.

```typescript
const sandbox = createSandbox({
  env: "es2022",
  features: {
    disable: ["ArrowFunctions"],
  },
});
```

### `limits`

Guard execution per run and over time.

Safe per-run defaults are enabled automatically:

- `loops: 100_000`
- `callDepth: 250`
- `memoryBytes: 16 * 1024 * 1024`

```typescript
const sandbox = createSandbox({
  env: "es2022",
  limits: {
    perRun: { loops: 100_000, callDepth: 200, memoryBytes: 2_000_000 },
    total: { evaluations: 100, memoryBytes: 50_000_000 },
  },
});
```

### `timeoutMs`

Set async execution timeouts without wrapping `run()` in `Promise.race`.

```typescript
const sandbox = createSandbox({
  env: "es2022",
  timeoutMs: 5000, // default timeout for sandbox.run/runModule
});

await sandbox.run(untrustedCode, { timeoutMs: 1000 }); // per-call override
```

### `policy`

Simplifies error sanitization.

- `"safe"` - hide host error details and sanitize stacks (default)
- `"sanitize"` - keep messages, sanitize stacks
- `"full"` - expose full host errors

### `modules`

Quick module wiring without a custom resolver.

```typescript
const sandbox = createSandbox({
  env: "es2022",
  modules: {
    files: {
      "math.js": "export const add = (a, b) => a + b;",
    },
    externals: {
      lodash: { map, filter },
    },
  },
});

const exports = await sandbox.runModule(
  'import { add } from "math.js"; export const result = add(1, 2);',
  { path: "main.js" },
);
```

`runModule` accepts the same per-run options as `run` (globals, features, limits, timeoutMs, validator, signal) plus the required `path`.

### `result: "full"`

Return stats and resource usage alongside the result.

```typescript
const out = await sandbox.run("1 + 2", { result: "full" });
console.log(out.value, out.stats);
```

### Typed result helpers

Use generics when you want typed return values from `run` and `runModule`:

```typescript
const value = await sandbox.run<number>("40 + 2");
const moduleExports = await sandbox.runModule<{ result: number }>(
  "export const result = 40 + 2;",
  {
    path: "main.js",
  },
);
```

## Advanced API

The simplified API is a convenience wrapper. For full control, use the
`Interpreter` class, `preset()` helper, and module system APIs directly.
