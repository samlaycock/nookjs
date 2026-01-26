# Presets

Presets provide pre-configured `InterpreterOptions` for common use cases. They include ECMAScript version presets and API addon presets that can be combined using the `preset()` function.

## Quick Start

```typescript
import { Interpreter } from "./interpreter";
import { preset, ES2022, FetchAPI, ConsoleAPI } from "./presets";

// Create an interpreter with ES2022 features, Fetch API, and console
const interpreter = new Interpreter(preset(ES2022, FetchAPI, ConsoleAPI));

await interpreter.evaluateAsync(`
  console.log('Fetching data...');
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  console.log('Got:', data);
`);
```

## The `preset()` Function

The `preset()` function combines multiple presets and option overrides into a single `InterpreterOptions` object.

```typescript
function preset(...presets: InterpreterOptions[]): InterpreterOptions;
```

### Merging Behavior

| Property         | Merge Strategy                                |
| ---------------- | --------------------------------------------- |
| `globals`        | Shallow merge, later presets override earlier |
| `featureControl` | Features are unioned (see below)              |
| `security`       | Shallow merge, later presets override earlier |
| `validator`      | Last one wins                                 |

### Feature Control Merging

When combining presets with `featureControl`:

- **Both whitelists**: Features are unioned (allows features from both)
- **Both blacklists**: Features are unioned (blocks features from both)
- **Mixed modes**: Whitelist takes precedence (more restrictive), with blacklisted features removed

### Examples

```typescript
// Basic combination
const opts = preset(ES2022, FetchAPI);

// Multiple addons
const opts = preset(ES2022, FetchAPI, ConsoleAPI, TimersAPI);

// With custom security settings
const opts = preset(ES2022, FetchAPI, {
  security: { hideHostErrorMessages: false },
});

// With custom globals
const opts = preset(ES2022, {
  globals: { myHelper: (x) => x * 2 },
});
```

## ECMAScript Version Presets

These presets configure the interpreter for specific ECMAScript versions by whitelisting appropriate language features and providing era-appropriate globals.

| Preset           | Year | Key Features                                              |
| ---------------- | ---- | --------------------------------------------------------- |
| `ES5`            | 2009 | var, functions, basic control flow                        |
| `ES2015` / `ES6` | 2015 | let/const, arrow functions, classes, Promises, generators |
| `ES2016`         | 2016 | Exponentiation operator                                   |
| `ES2017`         | 2017 | async/await                                               |
| `ES2018`         | 2018 | Async generators                                          |
| `ES2019`         | 2019 | Optional catch binding                                    |
| `ES2020`         | 2020 | Optional chaining, nullish coalescing, BigInt             |
| `ES2021`         | 2021 | Logical assignment operators                              |
| `ES2022`         | 2022 | Class fields, private fields, static blocks               |
| `ES2023`         | 2023 | (No new interpreter features)                             |
| `ES2024`         | 2024 | (No new interpreter features)                             |
| `ESNext`         | -    | All features enabled, no restrictions                     |

### Included Globals

All ES presets include these globals (from ES5):

- `Array`, `Object`, `String`, `Number`, `Boolean`
- `Date`, `Math`, `JSON`
- `Error`, `TypeError`, `ReferenceError`, `SyntaxError`, `RangeError`, `URIError`, `EvalError`
- `parseInt`, `parseFloat`, `isNaN`, `isFinite`
- `encodeURI`, `encodeURIComponent`, `decodeURI`, `decodeURIComponent`

ES2015+ presets add:

- `Promise`, `Symbol`, `Map`, `Set`, `WeakMap`, `WeakSet`

ES2020+ presets add:

- `BigInt`, `globalThis`

ES2021+ presets add:

- `WeakRef`, `FinalizationRegistry`

## API Addon Presets

Addon presets provide access to specific Web/Runtime APIs. They only add globals and don't modify feature control.

### `FetchAPI`

Provides the Fetch API for making HTTP requests. Requires async/await (ES2017+).

```typescript
const interpreter = new Interpreter(preset(ES2022, FetchAPI));

await interpreter.evaluateAsync(`
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
`);
```

**Includes:** `fetch`, `Request`, `Response`, `Headers`, `AbortController`, `AbortSignal`, `URL`, `URLSearchParams`

### `ConsoleAPI`

Provides console methods for logging.

```typescript
const interpreter = new Interpreter(preset(ES2022, ConsoleAPI));

interpreter.evaluate(`
  console.log('Hello, world!');
  console.error('Something went wrong');
`);
```

**Includes:** `console`

### `TimersAPI`

Provides timer functions. Note: These are async operations.

```typescript
const interpreter = new Interpreter(preset(ES2022, TimersAPI));

await interpreter.evaluateAsync(`
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('1 second later');
`);
```

**Includes:** `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`

### `TextCodecAPI`

Provides text encoding/decoding utilities.

```typescript
const interpreter = new Interpreter(preset(ES2022, TextCodecAPI));

interpreter.evaluate(`
  const encoder = new TextEncoder();
  const bytes = encoder.encode('Hello');
  // bytes is Uint8Array [72, 101, 108, 108, 111]
`);
```

**Includes:** `TextEncoder`, `TextDecoder`

### `CryptoAPI`

Provides cryptographic functions.

```typescript
const interpreter = new Interpreter(preset(ES2022, CryptoAPI));

interpreter.evaluate(`
  const uuid = crypto.randomUUID();
  // uuid is something like "550e8400-e29b-41d4-a716-446655440000"
`);
```

**Includes:** `crypto`

## Creating Custom Presets

You can create your own presets by defining an `InterpreterOptions` object:

```typescript
// Custom addon preset
const MyAPI: InterpreterOptions = {
  globals: {
    myFunction: (x: number) => x * 2,
    myConstant: 42,
  },
};

// Use it
const interpreter = new Interpreter(preset(ES2022, MyAPI));
```

For more restrictive presets, you can include feature control:

```typescript
// A preset that only allows basic math
const BasicMath: InterpreterOptions = {
  featureControl: {
    mode: "whitelist",
    features: ["VariableDeclarations", "BinaryOperators", "UnaryOperators"],
  },
  globals: {
    Math,
  },
};
```

## Helper Functions

### `getPreset(name)`

Get a preset by name string:

```typescript
import { getPreset } from "./presets";

const preset = getPreset("ES2022"); // Returns ES2022 preset
```

### `PRESET_NAMES`

Array of all available preset names:

```typescript
import { PRESET_NAMES } from "./presets";

console.log(PRESET_NAMES);
// ["ES5", "ES6", "ES2015", "ES2016", ..., "ESNext"]
```
