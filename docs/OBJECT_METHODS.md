# Object Methods

The interpreter provides support for various `Object` static methods through the global `Object` constructor. These methods are automatically available in all presets.

## Supported Methods

### ES5+ (Always Available)

| Method                                        | Description                                  | Example                                       |
| --------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `Object.keys(obj)`                            | Returns array of own enumerable string keys  | `Object.keys({a:1,b:2})` → `['a','b']`        |
| `Object.getOwnPropertyNames(obj)`             | Returns array of own string keys             | `Object.getOwnPropertyNames({a:1})` → `['a']` |
| `Object.getPrototypeOf(obj)`                  | Returns prototype (always `null` in sandbox) | `Object.getPrototypeOf({})` → `null`          |
| `Object.getOwnPropertyDescriptor(obj, key)`   | Returns property descriptor                  | `Object.getOwnPropertyDescriptor({x:1}, 'x')` |
| `Object.defineProperty(obj, key, descriptor)` | Defines property (restricted)                | Throws in sandbox                             |
| `Object.defineProperties(obj, descriptors)`   | Defines multiple properties                  | Throws in sandbox                             |
| `Object.seal(obj)`                            | Seals object (restricted)                    | Returns original object                       |
| `Object.freeze(obj)`                          | Freezes object (restricted)                  | Returns original object                       |
| `Object.isSealed(obj)`                        | Checks if sealed                             | `false`                                       |
| `Object.isFrozen(obj)`                        | Checks if frozen                             | `false`                                       |
| `Object.preventExtensions(obj)`               | Prevents extensions (restricted)             | Returns original object                       |
| `Object.isExtensible(obj)`                    | Checks if extensible                         | `false`                                       |

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

The following methods are restricted in the sandbox:

- `Object.setPrototypeOf()` - Throws `PROTOTYPE_ACCESS` error
- `Object.defineProperty()` / `Object.defineProperties()` - Throws for non-wrapped properties
- `Object.create()` with prototype - Restricted

These restrictions prevent prototype chain manipulation attacks.

### Prototype Behavior

In the sandbox:

```javascript
const obj = {};
Object.getPrototypeOf(obj); // null
obj.__proto__; // undefined (blocked)
obj.constructor; // undefined (blocked)
Object.prototype.isPrototypeOf(obj); // false
```

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
