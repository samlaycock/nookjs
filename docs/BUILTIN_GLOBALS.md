# Builtin Globals

The interpreter automatically provides certain builtin global variables that are always available in sandboxed code.

## Always Available (No Feature Flag Required)

| Variable     | Description                             |
| ------------ | --------------------------------------- |
| `undefined`  | The undefined primitive value           |
| `NaN`        | The Not-a-Number value                  |
| `Infinity`   | The Infinity value                      |
| `Symbol`     | The Symbol constructor                  |
| `globalThis` | Reference to the sandbox's global scope |
| `global`     | Alias for `globalThis`                  |

## ES5 Standard Globals

| Global                        | Description                           |
| ----------------------------- | ------------------------------------- |
| `Array`                       | Array constructor and prototype       |
| `Object`                      | Object constructor and prototype      |
| `String`                      | String constructor and prototype      |
| `Number`                      | Number constructor and prototype      |
| `Boolean`                     | Boolean constructor and prototype     |
| `Date`                        | Date constructor                      |
| `Math`                        | Math utilities (PI, random, etc.)     |
| `JSON`                        | JSON serialization (stringify, parse) |
| `Error`                       | Base error constructor                |
| `TypeError`                   | Type error constructor                |
| `ReferenceError`              | Reference error constructor           |
| `SyntaxError`                 | Syntax error constructor              |
| `RangeError`                  | Range error constructor               |
| `URIError`                    | URI error constructor                 |
| `EvalError`                   | Eval error constructor                |
| `parseInt(str, radix?)`       | Parses integer from string            |
| `parseFloat(str)`             | Parses float from string              |
| `isNaN(value)`                | Checks if value is NaN                |
| `isFinite(value)`             | Checks if value is finite             |
| `encodeURI(uri)`              | Encodes URI                           |
| `encodeURIComponent(str)`     | Encodes URI component                 |
| `decodeURI(encoded)`          | Decodes URI                           |
| `decodeURIComponent(encoded)` | Decodes URI component                 |

## ES2015+ Standard Globals

| Global                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `Promise`              | Promise constructor for async operations |
| `Symbol(description?)` | Creates unique symbols                   |
| `Map`                  | Key-value map collection                 |
| `Set`                  | Unique values collection                 |
| `WeakMap`              | Weak reference key-value map             |
| `WeakSet`              | Weak reference set                       |

## ES2020+ Standard Globals

| Global           | Description                          |
| ---------------- | ------------------------------------ |
| `BigInt(value?)` | Creates arbitrary-precision integers |
| `globalThis`     | Reference to sandbox global scope    |

## ES2021+ Standard Globals

| Global                 | Description                      |
| ---------------------- | -------------------------------- |
| `WeakRef(target?)`     | Creates weak reference to object |
| `FinalizationRegistry` | Cleanup callback registry        |

## globalThis and global

The `globalThis` and `global` variables provide access to the sandbox's global scope. This allows sandboxed code to:

1. **Read and write global variables:**

   ```javascript
   global.myVar = "hello";
   console.log(global.myVar); // "hello"
   ```

2. **Access injected globals:**

   ```javascript
   const interpreter = new Interpreter({ globals: { Math } });
   interpreter.evaluate(`
     global.Math.PI // 3.14159...
   `);
   ```

3. **Check for variable existence:**
   ```javascript
   if (global.myVar !== undefined) {
     // myVar exists
   }
   ```

## Preset-Specific Globals

Different ECMAScript version presets include different globals:

| Preset  | Additional Globals                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ES5     | Array, Object, String, Number, Boolean, Date, Math, JSON, Error types, parseInt, parseFloat, isNaN, isFinite, encodeURI*, decodeURI* |
| ES2015+ | Promise, Symbol, Map, Set, WeakMap, WeakSet                                                                                          |
| ES2017+ | Object.values, Object.entries (on prototype)                                                                                         |
| ES2020+ | BigInt, globalThis                                                                                                                   |
| ES2021+ | WeakRef, FinalizationRegistry                                                                                                        |

## Behavior Notes

- `globalThis` and `global` refer to the same sentinel object within a single interpreter instance
- Properties set on `globalThis`/`global` persist across multiple `evaluate()` calls on the same interpreter
- Each interpreter instance has its own isolated `globalThis` scope
- The sentinel object is not the actual host's `globalThis` - this maintains sandbox isolation
- Standard globals are wrapped in `ReadOnlyProxy` for security
