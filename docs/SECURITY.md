# Security Model

This document describes the security sandboxing model of the interpreter, which is designed to **hide host implementation details from untrusted code**.

## Overview

The interpreter provides a secure sandbox for executing untrusted JavaScript code. The security model is built around several key mechanisms:

1. **ReadOnlyProxy** - Wraps all host values to enforce immutability and block dangerous property access
2. **Dangerous Property Blocking** - Blocks access to prototype chain manipulation and other dangerous properties
3. **Forbidden Globals** - Prevents injection of code-execution primitives
4. **Error Sanitization** - Prevents leakage of host information through error messages and stack traces

## Security Options

The interpreter accepts a `security` option with the following settings:

```typescript
const interpreter = new Interpreter({
  globals: { /* ... */ },
  security: {
    // Sanitize error stack traces to remove host file paths (default: true)
    sanitizeErrors: true,
    
    // Hide original error messages from host functions (default: true)
    hideHostErrorMessages: true,
  }
});
```

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

| Category | Properties |
|----------|------------|
| Prototype chain | `__proto__`, `constructor`, `prototype` |
| Legacy methods | `__defineGetter__`, `__defineSetter__`, `__lookupGetter__`, `__lookupSetter__` |
| Object.prototype | `toString`, `toLocaleString`, `hasOwnProperty`, `isPrototypeOf`, `propertyIsEnumerable` |
| Function.prototype | `apply`, `call`, `bind`, `arguments`, `caller` |

### Dangerous Symbols

| Symbol | Reason |
|--------|--------|
| `Symbol.toStringTag` | Could leak type information |
| `Symbol.hasInstance` | Could manipulate instanceof checks |
| `Symbol.species` | Could inject malicious constructors |
| `Symbol.toPrimitive` | Returns `undefined` (not blocked) to enable arithmetic |
| `Symbol.match/replace/search/split` | Could manipulate string operations |

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

## Security Testing

The interpreter includes comprehensive security tests in:
- `test/readonly-proxy-security.test.ts` - Tests for ReadOnlyProxy protections
- `test/security.test.ts` - General security tests
- `test/security-options.test.ts` - Tests for security configuration options

## Recommendations

The default security settings provide maximum protection. For debugging during development, you may want to temporarily disable error hiding:

```typescript
const interpreter = new Interpreter({
  globals: {
    // Only inject what's absolutely necessary
    console: { log: (...args) => console.log(...args) },
  },
  security: {
    // For debugging only - remove in production
    sanitizeErrors: false,
    hideHostErrorMessages: false,
  }
});
```
