# Security Considerations

## Overview

The JavaScript interpreter is designed to safely execute untrusted JavaScript code in a sandboxed environment. This document outlines the security model, protections in place, and important considerations for users.

## Security Model

**Trust Boundary**: The interpreter establishes a security boundary between:
- **Host (Trusted)**: The TypeScript/JavaScript code running the interpreter
- **Sandbox (Untrusted)**: The JavaScript code being evaluated by the interpreter

**Goal**: Prevent sandbox code from:
1. Accessing the host runtime environment
2. Modifying global objects or prototypes
3. Executing arbitrary host code
4. Escaping the sandbox

**Note**: The host is trusted and can inspect all aspects of execution, including returned values, internal state, and memory.

## Built-in Protections

### 1. Prototype Pollution Prevention

The interpreter blocks access to dangerous property names:

```typescript
// These are blocked for security
obj.__proto__
obj.constructor
obj.prototype
obj.__defineGetter__
obj.__defineSetter__
obj.__lookupGetter__
obj.__lookupSetter__
```

**Why**: These properties could be used to pollute prototypes or access the global object.

**Example Attack (Blocked)**:
```javascript
let obj = {};
obj["__proto__"]["polluted"] = true; // ❌ Error: Property name '__proto__' is not allowed
```

### 2. No Built-in Global Access

Sandbox code does not have access to:
- `eval`
- `Function` constructor
- `Promise` constructor
- `globalThis` / `window` / `global`
- `require` / `import`
- Any Node.js/Bun/browser APIs

**Why**: These could be used to break out of the sandbox or execute arbitrary code.

**Example Attack (Blocked)**:
```javascript
async function escape() {
  return Function("return this")(); // ❌ Error: Undefined variable 'Function'
}
```

### 3. Host Function Protection

Host functions passed as globals are wrapped and protected:

**Property Access Blocked**:
```javascript
// Host passes: { myFunc: () => "secret" }
myFunc.name;       // ❌ Error: Cannot access properties on host functions
myFunc.toString(); // ❌ Error: Cannot access properties on host functions
```

**Awaiting Host Functions Blocked**:
```javascript
async function expose() {
  return await myFunc; // ❌ Error: Cannot await a host function
}
```

**Why**: Directly awaiting a host function (not calling it) would expose the `HostFunctionValue` wrapper containing the raw function reference, potentially allowing the host to accidentally use leaked internal structures.

**Correct Usage**:
```javascript
myFunc();              // ✓ Calling is allowed
await asyncHostFunc(); // ✓ Calling async host functions is allowed
```

### 4. Whitelisted AST Nodes Only

Only explicitly supported AST node types are evaluated. Any unsupported node type throws an error.

**Why**: Prevents exploitation through unsupported language features.

### 5. Async/Await Protections

**Sync Mode (`evaluate()`)**: Cannot call async functions or use await
```javascript
async function test() { return 42; }
test(); // ❌ Error: Cannot call async function in synchronous evaluate()
```

**Why**: Prevents mixing sync/async contexts which could lead to unexpected behavior.

## Security Test Coverage

The interpreter includes 838+ tests, including 22 dedicated security tests covering:

- Host function protection (property access, awaiting)
- Prototype pollution prevention
- Built-in object access blocking
- Environment isolation
- Error handling in async contexts
- Closure security
- State management

Run security tests: `bun test security-async.test.ts`

## What the Interpreter Does NOT Protect Against

### 1. Denial of Service (DoS)

**Infinite Loops**: Not prevented
```javascript
while (true) {} // Will hang forever
```

**Memory Exhaustion**: Not prevented
```javascript
let arr = [];
for (let i = 0; i < 1000000000; i++) {
  arr.push(i);
}
```

**Mitigation**: Host should implement timeouts and resource limits:
```typescript
const timeout = new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Timeout")), 5000)
);

const result = await Promise.race([
  interpreter.evaluateAsync(untrustedCode),
  timeout
]);
```

### 2. Logic Bombs

Code that appears safe but has malicious intent:
```javascript
// Looks harmless but destroys data after 1000 iterations
for (let i = 0; i < 1000; i++) {
  someData[i] = null;
}
```

**Mitigation**: Use AST validators to restrict language features:
```typescript
const validator = (ast) => {
  // No loops allowed
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') && !code.includes('"ForStatement"');
};

new Interpreter({ validator });
```

### 3. Information Disclosure to Host

**By Design**: The host can inspect:
- All returned values (including function internals)
- Variable names and values in the environment
- AST structure of executed code
- Closures and scopes

**Why**: The host is trusted and needs visibility for debugging, monitoring, and management.

**Example**:
```typescript
const result = await interpreter.evaluateAsync(`
  function secret() { return "confidential"; }
  secret
`);

// Host can inspect:
console.log(result.params);  // []
console.log(result.body);    // AST nodes
console.log(result.closure); // Environment with variables
```

**Implication**: Hosts should treat internal structures as implementation details and not rely on their format.

### 4. Side Effects via Host Functions

Host functions have full access to the host environment:

```typescript
const interpreter = new Interpreter({
  globals: {
    dangerousDelete: (path: string) => fs.unlinkSync(path) // Dangerous!
  }
});

await interpreter.evaluateAsync(`
  dangerousDelete("/important/file.txt"); // Deletes actual file!
`);
```

**Mitigation**: 
- Only expose safe, sandboxed host functions
- Validate all arguments passed to host functions
- Use read-only operations when possible
- Implement permission checks inside host functions

### 5. Reference Leakage

Globals are passed **by reference**:

```typescript
const sharedState = { count: 0 };
const interpreter = new Interpreter({
  globals: { state: sharedState }
});

await interpreter.evaluateAsync(`
  state.count = 999; // Modifies host's sharedState object!
`);

console.log(sharedState.count); // 999
```

**Mitigation**: Clone objects before passing as globals:
```typescript
const interpreter = new Interpreter({
  globals: { state: structuredClone(sharedState) }
});
```

## Best Practices

### 1. Minimize Host Function Surface Area

Only expose what's necessary:

```typescript
// ❌ Bad: Exposes too much
const interpreter = new Interpreter({
  globals: {
    fs: fs,           // Entire filesystem API!
    process: process, // Entire process API!
  }
});

// ✓ Good: Minimal, specific functions
const interpreter = new Interpreter({
  globals: {
    readUserFile: async (filename: string) => {
      // Validate filename
      if (!filename.startsWith('/safe/dir/')) {
        throw new Error('Access denied');
      }
      return await fs.promises.readFile(filename, 'utf8');
    }
  }
});
```

### 2. Use AST Validators

Restrict language features based on use case:

```typescript
// Read-only validator (no variable declarations)
const readOnlyValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"VariableDeclaration"') &&
         !code.includes('"AssignmentExpression"');
};

// No loops validator (prevent DoS)
const noLoopsValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') &&
         !code.includes('"ForStatement"');
};

// Combined validators
const strictValidator = (ast) => {
  return readOnlyValidator(ast) && noLoopsValidator(ast);
};

const interpreter = new Interpreter({ validator: strictValidator });
```

### 3. Implement Timeouts

Protect against infinite loops:

```typescript
async function evaluateWithTimeout(code: string, timeoutMs: number) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
  );

  return await Promise.race([
    interpreter.evaluateAsync(code),
    timeout
  ]);
}
```

### 4. Clone Sensitive Data

Prevent reference leakage:

```typescript
const sensitiveConfig = { apiKey: 'secret123' };

// ❌ Bad: Passes by reference
new Interpreter({ globals: { config: sensitiveConfig } });

// ✓ Good: Clone before passing
new Interpreter({ 
  globals: { 
    config: structuredClone(sensitiveConfig) 
  } 
});
```

### 5. Validate Host Function Arguments

Never trust sandbox input:

```typescript
const interpreter = new Interpreter({
  globals: {
    readFile: async (path: string) => {
      // Validate input
      if (typeof path !== 'string') {
        throw new Error('Invalid path type');
      }
      if (path.includes('..')) {
        throw new Error('Path traversal not allowed');
      }
      if (!path.startsWith('/safe/')) {
        throw new Error('Access denied');
      }
      
      return await fs.promises.readFile(path, 'utf8');
    }
  }
});
```

### 6. Use Per-Call Globals for Isolation

Isolate per-execution state:

```typescript
// ❌ Shared state across all evaluations
const interpreter = new Interpreter({
  globals: { userId: 123 }
});

// ✓ Isolated per evaluation
const interpreter = new Interpreter();

async function evaluateForUser(code: string, userId: number) {
  return await interpreter.evaluateAsync(code, {
    globals: { userId } // Only available for this call
  });
}
```

## Reporting Security Issues

If you discover a security vulnerability in the interpreter, please report it by:
1. Opening a GitHub issue with the `security` label
2. Providing a minimal reproduction case
3. Describing the potential impact

**Do not** include actual exploits or proof-of-concept attacks in public issues.

## Security Changelog

### Version 1.x.x
- ✅ Prototype pollution prevention
- ✅ Host function property access blocking
- ✅ Async/await sandbox escape prevention
- ✅ No built-in global access
- ✅ Whitelisted AST nodes only
- ✅ Comprehensive security test suite

## Summary

The interpreter provides strong sandboxing for JavaScript code execution, but security is a shared responsibility:

**Interpreter Protects**:
- Sandbox escape via prototype pollution
- Access to host runtime via built-ins
- Property access on host functions
- Mixing sync/async incorrectly

**Host Must Handle**:
- DoS prevention (timeouts, resource limits)
- Host function argument validation
- Reference leakage (clone sensitive data)
- Side effect permissions
- AST validation for specific use cases

When used correctly with appropriate host-side protections, the interpreter provides a secure environment for executing untrusted JavaScript code.
