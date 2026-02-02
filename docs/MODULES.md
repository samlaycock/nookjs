# ES Module System

NookJS supports ES module syntax (`import`/`export`) through a pluggable module resolver system. This enables modular code organization while maintaining full sandbox security.

## Overview

The module system provides:

- Full ES module syntax support (imports, exports, re-exports)
- Custom resolver for loading modules from any source
- Module caching with configurable behavior
- Pre-built module injection for host libraries
- Lifecycle hooks for monitoring and debugging
- Introspection API for cache management

## Enabling the Module System

The module system is disabled by default. Enable it by providing a `modules` configuration:

```typescript
import { Interpreter, ModuleResolver } from "nookjs";

const resolver: ModuleResolver = {
  resolve(specifier, importer, context) {
    // Return module source or null to block
    return { type: "source", code: "export const x = 1;", path: specifier };
  },
};

const interpreter = new Interpreter({
  modules: {
    enabled: true,
    resolver,
    maxDepth: 100, // Optional: max import depth (default: 100)
    cache: true, // Optional: enable caching (default: true)
  },
});
```

## Import Syntax

### Named Imports

```javascript
// Import specific exports
import { foo, bar } from "module.js";

// Import with alias
import { foo as myFoo } from "module.js";

// Import multiple with mixed aliases
import { foo, bar as myBar, baz } from "module.js";
```

### Default Imports

```javascript
// Import default export
import myDefault from "module.js";

// Combine default and named imports
import myDefault, { foo, bar } from "module.js";
```

### Namespace Imports

```javascript
// Import all exports as namespace object
import * as utils from "module.js";

// Access exports via namespace
utils.foo();
utils.bar;
```

### Side-effect Only Imports

```javascript
// Execute module without importing bindings
import "polyfill.js";
import "setup.js";
```

## Export Syntax

### Named Exports

```javascript
// Export declarations
export const value = 42;
export let mutable = "can change";
export function helper() {}
export class MyClass {}
export async function fetchData() {}
export function* generator() {}

// Export existing variables
const a = 1;
const b = 2;
export { a, b };

// Export with alias
export { a as aliasA, b as aliasB };
```

### Default Exports

```javascript
// Export default value
export default 42;
export default "string";
export default { key: "value" };
export default [1, 2, 3];

// Export default function (named or anonymous)
export default function myFunc() {}
export default function() {}

// Export default class (named or anonymous)
export default class MyClass {}
export default class {}

// Export default expression
export default condition ? valueA : valueB;
```

### Re-exports

```javascript
// Re-export specific names
export { foo, bar } from "other.js";

// Re-export with alias
export { foo as myFoo } from "other.js";

// Re-export all named exports (excludes default)
export * from "other.js";

// Re-export all as namespace
export * as utils from "other.js";

// Re-export default as named
export { default as otherDefault } from "other.js";
```

## Module Resolver Interface

The resolver is responsible for loading module source code:

```typescript
interface ModuleResolver {
  /**
   * Resolve a module specifier to source code or a pre-built namespace.
   *
   * @param specifier - The import specifier (e.g., "lodash", "./utils.js")
   * @param importer - The path of the importing module, or null for entry point
   * @param context - Additional context including the full importer chain
   * @returns Module source, or null to block the import
   */
  resolve(
    specifier: string,
    importer: string | null,
    context?: ModuleResolverContext,
  ): ModuleSource | Promise<ModuleSource | null> | null;

  /**
   * Optional: Called after a module is successfully loaded.
   */
  onLoad?(specifier: string, path: string, exports: Record<string, any>): void;

  /**
   * Optional: Called when module loading fails.
   */
  onError?(specifier: string, importer: string | null, error: Error): void;
}

interface ModuleResolverContext {
  specifier: string;
  importer: string | null;
  importerChain: readonly string[]; // Full chain for cycle detection
}
```

### Module Source Types

```typescript
type ModuleSource =
  | { type: "source"; code: string; path: string }
  | { type: "ast"; ast: Program; path: string }
  | { type: "namespace"; exports: Record<string, any>; path: string };
```

## Resolver Examples

### File System Resolver

```typescript
import * as fs from "fs";
import * as path from "path";

const resolver: ModuleResolver = {
  resolve(specifier, importer) {
    // Resolve relative paths
    const basePath = importer ? path.dirname(importer) : process.cwd();
    const fullPath = path.resolve(basePath, specifier);

    // Security: prevent path traversal
    if (!fullPath.startsWith("/allowed/directory")) {
      return null;
    }

    try {
      const code = fs.readFileSync(fullPath, "utf-8");
      return { type: "source", code, path: fullPath };
    } catch {
      return null;
    }
  },
};
```

### Virtual File System Resolver

```typescript
const files = new Map([
  ["math.js", "export const add = (a, b) => a + b;"],
  ["utils.js", "export const double = x => x * 2;"],
  ["index.js", 'import { add } from "math.js"; export { add };'],
]);

const resolver: ModuleResolver = {
  resolve(specifier) {
    const code = files.get(specifier);
    if (code === undefined) return null;
    return { type: "source", code, path: specifier };
  },
};
```

### Async Resolver (Database, HTTP, etc.)

```typescript
const resolver: ModuleResolver = {
  async resolve(specifier) {
    const response = await fetch(`https://api.example.com/modules/${specifier}`);
    if (!response.ok) return null;

    const code = await response.text();
    return { type: "source", code, path: specifier };
  },
};
```

### Pre-built Module Resolver

Inject host libraries without parsing:

```typescript
import _ from "lodash";

const resolver: ModuleResolver = {
  resolve(specifier) {
    if (specifier === "lodash") {
      return {
        type: "namespace",
        exports: {
          map: _.map,
          filter: _.filter,
          reduce: _.reduce,
          default: _, // For default import
        },
        path: "lodash",
      };
    }
    return null;
  },
};
```

## Evaluating Module Code

Use `evaluateModuleAsync` to evaluate ES module code:

```typescript
const exports = await interpreter.evaluateModuleAsync(
  `
  import { add } from "math.js";
  export const result = add(1, 2);
  export default result * 2;
`,
  { path: "main.js" },
);

console.log(exports.result); // 3
console.log(exports.default); // 6
```

### Options

```typescript
interface ModuleEvaluateOptions {
  path: string; // Required: canonical path for this module
}
```

## Module Caching

By default, modules are cached after first evaluation:

```typescript
// First import evaluates the module
await interpreter.evaluateModuleAsync('import { x } from "mod.js";', { path: "a.js" });

// Second import uses cached exports (no re-evaluation)
await interpreter.evaluateModuleAsync('import { x } from "mod.js";', { path: "b.js" });
```

### Cache Control

```typescript
// Disable caching (re-evaluate on every import)
const interpreter = new Interpreter({
  modules: { enabled: true, resolver, cache: false },
});

// Clear cache programmatically
interpreter.clearModuleCache();
```

## Introspection API

Query the module system state:

```typescript
// Check if a module is cached
interpreter.isModuleCached("math.js"); // by specifier
interpreter.isModuleCachedByPath("/full/path/math.js"); // by path

// List loaded modules
interpreter.getLoadedModuleSpecifiers(); // ["math.js", "utils.js"]
interpreter.getLoadedModulePaths(); // ["/full/path/math.js", ...]

// Get module metadata
const metadata = interpreter.getModuleMetadata("math.js");
// { path: string, specifier: string, status: string, loadedAt: number }

// Get cached exports
const exports = interpreter.getModuleExports("math.js");

// Cache size
interpreter.getModuleCacheSize(); // number of cached modules

// Check if module system is enabled
interpreter.isModuleSystemEnabled(); // true
```

## Lifecycle Hooks

Monitor module loading with resolver hooks:

```typescript
const resolver: ModuleResolver = {
  resolve(specifier) {
    /* ... */
  },

  onLoad(specifier, path, exports) {
    console.log(`Loaded ${specifier} from ${path}`);
    console.log(`Exports:`, Object.keys(exports));
  },

  onError(specifier, importer, error) {
    console.error(`Failed to load ${specifier} from ${importer}:`, error);
  },
};
```

## Security Considerations

### Export Immutability

All module exports are wrapped in read-only proxies:

```javascript
import { config } from "settings.js";

config.secret = "hacked"; // Throws: Cannot modify property
config.newProp = "value"; // Throws: Cannot add property
```

### Namespace Protection

Namespace imports are deeply frozen:

```javascript
import * as ns from "module.js";

ns.newExport = "value"; // Throws: Cannot modify namespace
Object.prototype.hack = true; // No effect on namespace
```

### Dangerous Property Access

Access to prototype-related properties is blocked:

```javascript
import { obj } from "module.js";

obj.__proto__; // Throws: SecurityError
obj.constructor; // Throws: SecurityError
```

### Circular Dependency Handling

The interpreter detects circular imports and handles them gracefully:

```javascript
// a.js
import { b } from "b.js";
export const a = "a" + b;

// b.js
import { a } from "a.js";
export const b = "b"; // Works - doesn't depend on 'a'
```

### Import Depth Limiting

Prevent stack overflow from deeply nested imports:

```typescript
const interpreter = new Interpreter({
  modules: {
    enabled: true,
    resolver,
    maxDepth: 50, // Throw after 50 levels of imports
  },
});
```

## Terminology

- **Specifier**: The string in an import statement (e.g., `"./utils.js"`, `"lodash"`)
- **Path**: The canonical, resolved identifier for a module (often the absolute file path)
- **Importer**: The module that contains the import statement
- **Importer Chain**: The full chain of importers for cycle detection

## Differences from Native ES Modules

1. **No dynamic import()**: The `import()` expression is not supported
2. **No import.meta**: The `import.meta` object is not available
3. **Synchronous resolution**: While resolver can be async, module graph is built before execution
4. **Custom resolution**: No automatic Node.js-style resolution (you control it via resolver)
5. **No live bindings**: Exports are snapshotted at evaluation time

## Complete Example

```typescript
import { Interpreter, ModuleResolver } from "nookjs";

// Define a virtual file system
const modules = new Map([
  [
    "utils/math.js",
    `
    export const add = (a, b) => a + b;
    export const multiply = (a, b) => a * b;
    export const PI = 3.14159;
  `,
  ],
  [
    "utils/string.js",
    `
    export function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    export const GREETING = "Hello";
  `,
  ],
  [
    "utils/index.js",
    `
    export * from "./math.js";
    export * from "./string.js";
  `,
  ],
]);

// Create resolver with logging
const resolver: ModuleResolver = {
  resolve(specifier, importer) {
    // Handle relative imports
    if (specifier.startsWith("./") && importer) {
      const base = importer.substring(0, importer.lastIndexOf("/"));
      specifier = base + specifier.substring(1);
    }

    const code = modules.get(specifier);
    if (!code) return null;
    return { type: "source", code, path: specifier };
  },

  onLoad(specifier, path) {
    console.log(`[MODULE] Loaded: ${specifier}`);
  },
};

// Create interpreter
const interpreter = new Interpreter({
  modules: { enabled: true, resolver },
});

// Run module code
const result = await interpreter.evaluateModuleAsync(
  `
  import { add, multiply, capitalize, GREETING } from "utils/index.js";

  const sum = add(5, 3);
  const product = multiply(4, 7);
  const message = capitalize(GREETING + " world");

  export { sum, product, message };
`,
  { path: "main.js" },
);

console.log(result.sum); // 8
console.log(result.product); // 28
console.log(result.message); // "Hello world"
```
