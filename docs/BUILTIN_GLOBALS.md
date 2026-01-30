# Builtin Globals

The interpreter automatically provides certain builtin global variables that are always available in sandboxed code.

## Available Globals

| Variable     | Description                             |
| ------------ | --------------------------------------- |
| `undefined`  | The undefined primitive value           |
| `NaN`        | The Not-a-Number value                  |
| `Infinity`   | The Infinity value                      |
| `Symbol`     | The Symbol constructor                  |
| `globalThis` | Reference to the sandbox's global scope |
| `global`     | Alias for `globalThis`                  |

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

## Behavior Notes

- `globalThis` and `global` refer to the same sentinel object within a single interpreter instance
- Properties set on `globalThis`/`global` persist across multiple `evaluate()` calls on the same interpreter
- Each interpreter instance has its own isolated `globalThis` scope
- The sentinel object is not the actual host's `globalThis` - this maintains sandbox isolation
