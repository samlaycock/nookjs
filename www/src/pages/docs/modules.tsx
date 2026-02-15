import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Modules() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">
        ES Module System
      </h1>
      <p className="text-xl text-neutral-300 mb-8">
        Support for ES module syntax with import/export, custom resolvers, and
        module caching.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Overview
        </h2>
        <p className="text-neutral-300 mb-4">
          NookJS supports ES module syntax through a pluggable module resolver
          system. This enables modular code organization while maintaining full
          sandbox security.
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">
                Full ES module syntax
              </strong>{" "}
              - imports, exports, re-exports, and namespace imports
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Custom resolver</strong> -
              load modules from any source (files, database, HTTP)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Module caching</strong> -
              automatic caching with configurable behavior
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Pre-built modules</strong> -
              inject host libraries without parsing
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Secure by default</strong> -
              exports are read-only and protected
            </span>
          </li>
        </ul>
        <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded mt-6">
          <h4 className="text-amber-400 font-medium mb-2">Top-level await</h4>
          <p className="text-neutral-300 text-sm">
            Top-level <code className="text-amber-400">await</code> is only
            supported in module evaluation (use{" "}
            <code className="text-amber-400">runModule()</code> or
            <code className="text-amber-400">evaluateModuleAsync()</code>).
            Script evaluation via
            <code className="text-amber-400">run()</code> only allows{" "}
            <code className="text-amber-400">await</code> inside async
            functions.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Simplified Modules
        </h2>
        <p className="text-neutral-300 mb-4">
          For common cases, provide module sources directly without writing a
          resolver:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

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
  "import { add } from \\"math.js\\"; export const result = add(1, 2);",
  { path: "main.js" },
);

console.log(exports.result); // 3`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Enabling the Module System
        </h2>
        <p className="text-neutral-300 mb-4">
          The module system is disabled by default. Enable it by providing a{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            modules
          </code>{" "}
          configuration with a resolver:
        </p>
        <CodeBlock
          code={`import { createSandbox, type ModuleResolver } from "nookjs";

// Define your modules (could be files, database, API, etc.)
const files = new Map([
  ["math.js", "export const add = (a, b) => a + b; export const PI = 3.14159;"],
  ["utils.js", "export function double(x) { return x * 2; }"],
]);

// Create a resolver that provides module source code
const resolver: ModuleResolver = {
  resolve(specifier) {
    const code = files.get(specifier);
    if (!code) return null;
    return { type: "source", code, path: specifier };
  },
};

const sandbox = createSandbox({
  modules: {
    resolver,
    maxDepth: 100,  // Optional: max import depth (default: 100)
    cache: true,    // Optional: enable caching (default: true)
  },
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Basic Usage
        </h2>
        <p className="text-neutral-300 mb-4">
          Use{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            runModule
          </code>{" "}
          to evaluate ES module code:
        </p>
        <CodeBlock
          code={`const exports = await sandbox.runModule(
  \`import { add, PI } from "math.js";
   import { double } from "utils.js";

   export const result = double(add(1, 2));
   export const circumference = 2 * PI * 5;
   export default "main module";\`,
  { path: "main.js" }
);

console.log(exports.result);        // 6
console.log(exports.circumference); // 31.4159
console.log(exports.default);       // "main module"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Import Syntax
        </h2>

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Named Imports
        </h3>
        <CodeBlock
          code={`// Import specific exports
import { foo, bar } from "module.js";

// Import with alias
import { foo as myFoo } from "module.js";

// Import multiple with mixed aliases
import { foo, bar as myBar, baz } from "module.js";`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Default Imports
        </h3>
        <CodeBlock
          code={`// Import default export
import myDefault from "module.js";

// Combine default and named imports
import myDefault, { foo, bar } from "module.js";`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Namespace Imports
        </h3>
        <CodeBlock
          code={`// Import all exports as namespace object
import * as utils from "module.js";

// Access exports via namespace
utils.foo();
utils.bar;`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Side-effect Only Imports
        </h3>
        <CodeBlock
          code={`// Execute module without importing bindings
import "polyfill.js";
import "setup.js";`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Export Syntax
        </h2>

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Named Exports
        </h3>
        <CodeBlock
          code={`// Export declarations
export const value = 42;
export let mutable = "can change";
export function helper() {}
export class MyClass {}
export async function fetchData() {}

// Export existing variables
const a = 1;
const b = 2;
export { a, b };

// Export with alias
export { a as aliasA, b as aliasB };`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Default Exports
        </h3>
        <CodeBlock
          code={`// Export default value
export default 42;
export default { key: "value" };
export default [1, 2, 3];

// Export default function (named or anonymous)
export default function myFunc() {}
export default function() {}

// Export default class
export default class MyClass {}`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Re-exports
        </h3>
        <CodeBlock
          code={`// Re-export specific names
export { foo, bar } from "other.js";

// Re-export with alias
export { foo as myFoo } from "other.js";

// Re-export all named exports (excludes default)
export * from "other.js";

// Re-export all as namespace
export * as utils from "other.js";

// Re-export default as named
export { default as otherDefault } from "other.js";`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Module Resolver
        </h2>
        <p className="text-neutral-300 mb-4">
          The resolver is responsible for loading module source code. It
          receives the import specifier and returns the module source:
        </p>
        <CodeBlock
          code={`interface ModuleResolver {
  resolve(
    specifier: string,              // The import specifier
    importer: string | null,        // The importing module's path
    context?: ModuleResolverContext // Additional context
  ): ModuleSource | Promise<ModuleSource | null> | null;

  // Optional: Called after a module is loaded
  onLoad?(specifier: string, path: string, exports: Record<string, any>): void;

  // Optional: Called when loading fails
  onError?(specifier: string, importer: string | null, error: Error): void;
}

// Module source types
type ModuleSource =
  | { type: "source"; code: string; path: string }     // Source code
  | { type: "ast"; ast: Program; path: string }        // Pre-parsed AST
  | { type: "namespace"; exports: Record<string, any>; path: string }; // Pre-built`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Resolver Examples
        </h2>

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Virtual File System
        </h3>
        <CodeBlock
          code={`const files = new Map([
  ["math.js", "export const add = (a, b) => a + b;"],
  ["utils.js", "export const double = x => x * 2;"],
]);

const resolver: ModuleResolver = {
  resolve(specifier) {
    const code = files.get(specifier);
    if (code === undefined) return null;
    return { type: "source", code, path: specifier };
  },
};`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Async Resolver (HTTP)
        </h3>
        <CodeBlock
          code={`const resolver: ModuleResolver = {
  async resolve(specifier) {
    const response = await fetch(\`https://api.example.com/modules/\${specifier}\`);
    if (!response.ok) return null;

    const code = await response.text();
    return { type: "source", code, path: specifier };
  },
};`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Pre-built Modules
        </h3>
        <p className="text-neutral-300 mb-4">
          Inject host libraries directly without parsing:
        </p>
        <CodeBlock
          code={`import _ from "lodash";
import { createSandbox, type ModuleResolver } from "nookjs";

const resolver: ModuleResolver = {
  resolve(specifier) {
    if (specifier === "lodash") {
      return {
        type: "namespace",
        exports: {
          map: _.map,
          filter: _.filter,
          reduce: _.reduce,
          default: _,  // For default import
        },
        path: "lodash",
      };
    }
    return null;
  },
};

const sandbox = createSandbox({
  modules: { resolver },
});

// Now sandbox code can use lodash
const result = await sandbox.runModule(
  \`import { map } from "lodash";
   export const doubled = map([1, 2, 3], x => x * 2);\`,
  { path: "main.js" }
);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Module Caching
        </h2>
        <p className="text-neutral-300 mb-4">
          By default, modules are cached after first evaluation:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  modules: { resolver, cache: true },
});

// First import evaluates the module
await sandbox.runModule(
  'import { x } from "mod.js";',
  { path: "a.js" }
);

// Second import uses cached exports (no re-evaluation)
await sandbox.runModule(
  'import { x } from "mod.js";',
  { path: "b.js" }
);

// Disable caching
const noCacheSandbox = createSandbox({
  modules: { resolver, cache: false },
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Introspection API
        </h2>
        <p className="text-neutral-300 mb-4">
          Need cache introspection or module metadata? Those live on the
          internal{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            Interpreter
          </code>{" "}
          and{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            ModuleSystem
          </code>{" "}
          classes. See{" "}
          <Link
            to="/docs/api/interpreter"
            className="text-amber-400 hover:text-amber-300"
          >
            Internal Classes
          </Link>{" "}
          for advanced control.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Lifecycle Hooks
        </h2>
        <p className="text-neutral-300 mb-4">
          Monitor module loading with resolver hooks:
        </p>
        <CodeBlock
          code={`const resolver: ModuleResolver = {
  resolve(specifier) { /* ... */ },

  onLoad(specifier, path, exports) {
    console.log(\`Loaded \${specifier} from \${path}\`);
    console.log(\`Exports:\`, Object.keys(exports));
  },

  onError(specifier, importer, error) {
    console.error(\`Failed to load \${specifier}:\`, error);
  },
};`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Security
        </h2>
        <p className="text-neutral-300 mb-4">
          The module system maintains the same security guarantees as the rest
          of the sandbox runtime:
        </p>

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Export Immutability
        </h3>
        <p className="text-neutral-300 mb-4">
          All module exports are wrapped in read-only proxies:
        </p>
        <CodeBlock
          code={`import { config } from "settings.js";

config.secret = "hacked";  // Throws: Cannot modify property
config.newProp = "value"; // Throws: Cannot add property`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Dangerous Property Access
        </h3>
        <p className="text-neutral-300 mb-4">
          Access to prototype-related properties is blocked:
        </p>
        <CodeBlock
          code={`import { obj } from "module.js";

obj.__proto__;    // Throws: SecurityError
obj.constructor;  // Throws: SecurityError`}
        />

        <h3 className="text-xl font-semibold text-neutral-200 mb-3 mt-6">
          Import Depth Limiting
        </h3>
        <p className="text-neutral-300 mb-4">
          Prevent stack overflow from deeply nested imports:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  modules: {
    resolver,
    maxDepth: 50,  // Throw after 50 levels of imports
  },
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Limitations
        </h2>
        <p className="text-neutral-300 mb-4">
          Compared to native ES modules, the following are not supported:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-red-400">&#10005;</span>
            <span>
              <strong className="text-neutral-100">Dynamic import()</strong> -
              The{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                import()
              </code>{" "}
              expression is not supported
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-400">&#10005;</span>
            <span>
              <strong className="text-neutral-100">import.meta</strong> - The{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                import.meta
              </code>{" "}
              object is not available
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-400">&#10005;</span>
            <span>
              <strong className="text-neutral-100">Live bindings</strong> -
              Exports are snapshotted at evaluation time
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-red-400">&#10005;</span>
            <span>
              <strong className="text-neutral-100">Automatic resolution</strong>{" "}
              - No Node.js-style resolution (you control it via resolver)
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Complete Example
        </h2>
        <CodeBlock
          code={`import { createSandbox, type ModuleResolver } from "nookjs";

// Define a virtual file system
const modules = new Map([
  ["utils/math.js", \`
    export const add = (a, b) => a + b;
    export const multiply = (a, b) => a * b;
    export const PI = 3.14159;
  \`],
  ["utils/string.js", \`
    export function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    export const GREETING = "Hello";
  \`],
  ["utils/index.js", \`
    export * from "./math.js";
    export * from "./string.js";
  \`],
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

  onLoad(specifier) {
    console.log(\`[MODULE] Loaded: \${specifier}\`);
  },
};

// Create sandbox
const sandbox = createSandbox({
  modules: { resolver },
});

// Run module code
const result = await sandbox.runModule(\`
  import { add, multiply, capitalize, GREETING } from "utils/index.js";

  const sum = add(5, 3);
  const product = multiply(4, 7);
  const message = capitalize(GREETING + " world");

  export { sum, product, message };
\`, { path: "main.js" });

console.log(result.sum);     // 8
console.log(result.product); // 28
console.log(result.message); // "Hello world"`}
        />
      </section>
    </article>
  );
}
