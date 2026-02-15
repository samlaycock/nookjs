import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Globals() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">
        Global Injection
      </h1>
      <p className="text-xl text-neutral-300 mb-8">
        Safely inject variables and functions from your host environment into
        sandbox code.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Overview
        </h2>
        <p className="text-neutral-300 mb-4">
          Global injection allows you to expose specific values, functions, and
          objects to sandbox code while maintaining security. All injected
          values are automatically wrapped in a read-only proxy to prevent
          modification.
        </p>
        <p className="text-neutral-300 mb-4">
          There are two ways to inject globals:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">1.</span>
            <span>
              <strong className="text-neutral-100">Constructor globals</strong>{" "}
              - Persist across all{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                run()
              </code>{" "}
              calls
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">2.</span>
            <span>
              <strong className="text-neutral-100">Per-call globals</strong> -
              Available only for a single execution
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Simplified API
        </h2>
        <p className="text-neutral-300 mb-4">
          Use{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            createSandbox()
          </code>{" "}
          to set persistent globals:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  globals: {
    PI: 3.14159,
    log: (msg) => console.log("[sandbox]", msg),
  },
});

await sandbox.run("log(PI)");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Constructor Globals
        </h2>
        <p className="text-neutral-300 mb-4">
          Globals passed when creating the sandbox persist across all{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            run()
          </code>{" "}
          calls:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2024",
  globals: {
    // Simple values
    PI: 3.14159,
    VERSION: "1.0.0",
    DEBUG: true,

    // Objects (will be read-only in sandbox)
    config: {
      maxItems: 100,
      timeout: 5000,
    },

    // Functions
    log: (msg) => console.log("[sandbox]", msg),
  },
});

// All globals available in every run
sandbox.runSync("log(PI)");      // Logs: [sandbox] 3.14159
sandbox.runSync("log(VERSION)"); // Logs: [sandbox] 1.0.0
sandbox.runSync("config.maxItems"); // 100`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Per-Call Globals
        </h2>
        <p className="text-neutral-300 mb-4">
          Globals passed to individual{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            run()
          </code>{" "}
          calls are available only for that execution:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({ env: "es2024" });

// x and y only exist for this call
const sum = sandbox.runSync("x + y", {
  globals: { x: 10, y: 20 },
});
console.log(sum); // 30

// This would throw: x is not defined
sandbox.runSync("x + y");`}
        />
        <p className="text-neutral-300 mt-4">
          This is useful for providing context-specific data to each evaluation:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({ env: "es2024" });

function evaluateUserFormula(userId: string, formula: string) {
  const userData = getUserData(userId);

  return sandbox.runSync(formula, {
    globals: {
      user: userData,
      balance: userData.balance,
    },
  });
}

// Each user gets their own isolated context
evaluateUserFormula("user1", "balance * 0.1");
evaluateUserFormula("user2", "balance * 0.15");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Merging Behavior
        </h2>
        <p className="text-neutral-300 mb-4">
          Per-call globals override constructor globals with the same name (but
          don't affect user-declared variables):
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2024",
  globals: { multiplier: 10 },
});

// Uses constructor global
sandbox.runSync("multiplier * 5"); // 50

// Per-call global overrides constructor global
sandbox.runSync("multiplier * 5", {
  globals: { multiplier: 2 },
}); // 10

// Original constructor global still intact
sandbox.runSync("multiplier * 5"); // 50`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Host Functions
        </h2>
        <p className="text-neutral-300 mb-4">
          Pass functions from your host code that sandbox code can call:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2024",
  globals: {
    // Simple function
    double: (x) => x * 2,

    // Function with side effects
    log: (msg) => console.log(msg),

    // Async function
    fetchData: async (id) => {
      const response = await fetch(\`/api/data/\${id}\`);
      return response.json();
    },

    // Function returning complex data
    getConfig: () => ({
      maxItems: 100,
      features: ["a", "b", "c"],
    }),
  },
});

sandbox.runSync("double(21)"); // 42
sandbox.runSync("getConfig().maxItems"); // 100

await sandbox.run(\`
  async function run() {
    const data = await fetchData(123);
    return data.name;
  }
  run();
\`);`}
        />

        <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded mt-6">
          <h4 className="text-amber-400 font-medium mb-2">Security Note</h4>
          <p className="text-neutral-300 text-sm">
            Host functions can access your host environment with full
            privileges. Always validate arguments from sandbox code - never
            trust input from the sandbox.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          What Can Be Injected
        </h2>

        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Primitive Values
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Numbers, strings, booleans, null, undefined, BigInt, and Symbol.
            </p>
            <CodeBlock
              code={`globals: {
  count: 42,
  name: "Alice",
  enabled: true,
  nothing: null,
  bigNum: 9007199254740991n,
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Objects and Arrays
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Objects and arrays are wrapped in a read-only proxy. Sandbox code
              can read properties but cannot modify them.
            </p>
            <CodeBlock
              code={`globals: {
  config: { maxItems: 100, debug: false },
  items: [1, 2, 3, 4, 5],
  nested: { a: { b: { c: "deep" } } },
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Functions
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Functions can be called but their properties (like{" "}
              <code className="text-amber-400">name</code>,{" "}
              <code className="text-amber-400">length</code>) are blocked for
              security.
            </p>
            <CodeBlock
              code={`globals: {
  add: (a, b) => a + b,
  greet: function(name) { return "Hello, " + name; },
  async fetchUser(id) { return await db.getUser(id); },
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Classes and Constructors
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              You can inject constructors for sandbox code to instantiate.
            </p>
            <CodeBlock
              code={`class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  distance() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

const sandbox = createSandbox({
  env: "es2024",
  globals: { Point },
});

sandbox.runSync(\`
  const p = new Point(3, 4);
  p.distance()
\`); // 5`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Property Protection
        </h2>
        <p className="text-neutral-300 mb-4">
          All injected globals are protected from sandbox manipulation:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2024",
  globals: {
    config: { secret: "password123" },
    myFunc: () => "result",
  },
});

// Modifications silently fail (no error, but no effect)
sandbox.runSync(\`
  config.secret = "hacked";     // No effect
  delete config.secret;         // No effect
  config.newProp = "test";      // No effect

  config.secret                 // Still "password123"
\`);

// Function properties are blocked
sandbox.runSync(\`
  myFunc.name      // SecurityError
  myFunc.length    // SecurityError
  myFunc.toString  // SecurityError

  myFunc()         // Works: "result"
\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Best Practices
        </h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Validate all function arguments
            </h3>
            <CodeBlock
              code={`globals: {
  readFile: (path) => {
    // ALWAYS validate arguments from sandbox
    if (typeof path !== 'string') {
      throw new Error('Path must be a string');
    }
    if (path.includes('..') || path.startsWith('/')) {
      throw new Error('Invalid path');
    }
    // Only allow reading from specific directory
    return fs.readFileSync(\`./allowed/\${path}\`, 'utf8');
  },
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Clone sensitive data
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              While host objects are read-only, clone data for extra safety:
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({ env: "es2024" });

sandbox.runSync(code, {
  globals: {
    state: structuredClone(sharedState),
    config: { ...originalConfig },
  },
});`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Limit function capabilities
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Only expose the minimum functionality needed:
            </p>
            <CodeBlock
              code={`// Bad: Exposes full console
globals: { console }

// Good: Only expose what's needed
globals: {
  log: (...args) => console.log("[sandbox]", ...args),
  // No access to console.warn, console.error, etc.
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Use per-call globals for user context
            </h3>
            <CodeBlock
              code={`const sandbox = createSandbox({ env: "es2024" });

// Each evaluation gets isolated user context
function runUserScript(userId: string, script: string) {
  const user = getUser(userId);

  return sandbox.runSync(script, {
    globals: {
      currentUser: {
        id: user.id,
        name: user.name,
        // Don't expose sensitive fields like password hash
      },
      permissions: user.permissions,
    },
  });
}`}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/presets"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Presets
        </Link>
        <Link
          to="/docs/features"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Feature Control &rarr;
        </Link>
      </div>
    </article>
  );
}
