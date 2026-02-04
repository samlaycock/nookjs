# Object Methods

The interpreter provides support for various `Object` static methods through the global `Object` constructor. These methods are automatically available in all presets.

## Supported Methods

### ES5+ (Always Available)

| Method                                        | Description                                                    | Example                                          |
| --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `Object.keys(obj)`                            | Returns array of own enumerable string keys                    | `Object.keys({a:1,b:2})` → `['a','b']`           |
| `Object.getOwnPropertyNames(obj)`             | Returns array of own string keys                               | `Object.getOwnPropertyNames({a:1})` → `['a']`    |
| `Object.getPrototypeOf(obj)`                  | Returns prototype (ReadOnlyProxy globals report `null`)        | `Object.getPrototypeOf({})` → `Object.prototype` |
| `Object.getOwnPropertyDescriptor(obj, key)`   | Returns property descriptor                                    | `Object.getOwnPropertyDescriptor({x:1}, 'x')`    |
| `Object.defineProperty(obj, key, descriptor)` | Defines property (blocked on ReadOnlyProxy globals)            | `Object.defineProperty({}, 'x', {value:1})`      |
| `Object.defineProperties(obj, descriptors)`   | Defines multiple properties (blocked on ReadOnlyProxy globals) | `Object.defineProperties({}, {x:{value:1}})`     |
| `Object.seal(obj)`                            | Seals object                                                   | `Object.seal({})` → object                       |
| `Object.freeze(obj)`                          | Freezes object                                                 | `Object.freeze({})` → object                     |
| `Object.isSealed(obj)`                        | Checks if sealed                                               | `Object.isSealed({})` → `false`                  |
| `Object.isFrozen(obj)`                        | Checks if frozen                                               | `Object.isFrozen({})` → `false`                  |
| `Object.preventExtensions(obj)`               | Prevents extensions                                            | `Object.preventExtensions({})` → object          |
| `Object.isExtensible(obj)`                    | Checks if extensible                                           | `Object.isExtensible({})` → `true`               |

### ES2017+ Additions

| Method                | Description                            | Example                               |
| --------------------- | -------------------------------------- | ------------------------------------- |
| `Object.values(obj)`  | Returns array of own enumerable values | `Object.values({a:1,b:2})` → `[1,2]`  |
| `Object.entries(obj)` | Returns array of `[key, value]` pairs  | `Object.entries({a:1})` → `[['a',1]]` |

### ES2022+ Additions

| Method                     | Description                    | Example                              |
| -------------------------- | ------------------------------ | ------------------------------------ |
| `Object.hasOwn(obj, prop)` | Checks if prop is own property | `Object.hasOwn({x:1}, 'x')` → `true` |

## Implementation Details

### Security Restrictions

ReadOnlyProxy-wrapped globals are read-only. As a result:

- `Object.defineProperty()` / `Object.defineProperties()` throw when targeting wrapped globals.
- `Object.setPrototypeOf()` throws when targeting wrapped globals.
- Prototype access on wrapped globals is hidden (`Object.getPrototypeOf` returns `null`).

### Prototype Behavior

Prototype access is limited for safety. Dangerous property names like `__proto__` and
`constructor` are blocked, and wrapped globals hide their prototype chain. Plain sandbox
objects still use the normal JavaScript prototype chain.

### hasOwn vs hasOwnProperty

`Object.hasOwn()` is preferred in the sandbox over `hasOwnProperty()` because:

1. It's a static method on `Object` (wrapped by security proxy)
2. It doesn't rely on `Object.prototype.hasOwnProperty` which may be overridden
3. It works consistently with the sandbox's prototype restrictions

```javascript
// Safe in sandbox
Object.hasOwn(obj, "prop");

// May be unreliable
obj.hasOwnProperty("prop"); // hasOwnProperty might be blocked
```

## Availability

| Method                              | ECMAScript Version | Preset Available |
| ----------------------------------- | ------------------ | ---------------- |
| `Object.keys()`                     | ES5                | All              |
| `Object.getOwnPropertyNames()`      | ES5                | All              |
| `Object.getPrototypeOf()`           | ES5                | All              |
| `Object.getOwnPropertyDescriptor()` | ES5                | All              |
| `Object.defineProperty()`           | ES5                | All (restricted) |
| `Object.values()`                   | ES2017             | ES2017+          |
| `Object.entries()`                  | ES2017             | ES2017+          |
| `Object.hasOwn()`                   | ES2022             | ES2022+          |

## Example Usage

```javascript
const obj = { a: 1, b: 2, c: 3 };

// Get keys
Object.keys(obj); // ['a', 'b', 'c']

// Get values (ES2017+)
Object.values(obj); // [1, 2, 3]

// Get entries (ES2017+)
Object.entries(obj); // [['a', 1], ['b', 2], ['c', 3]]

// Check ownership (ES2022+)
Object.hasOwn(obj, "a"); // true
Object.hasOwn(obj, "toString"); // false
```
