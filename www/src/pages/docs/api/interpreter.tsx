import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function InterpreterAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Interpreter</h1>
      <p className="text-xl text-neutral-300 mb-8">
        The main class for executing JavaScript code in a sandboxed environment.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Constructor</h2>
        <CodeBlock code={`new Interpreter(options?: InterpreterOptions)`} />
        <p className="text-neutral-300 mt-4 mb-4">
          Creates a new interpreter instance with optional configuration.
        </p>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">InterpreterOptions</h3>
        <CodeBlock
          code={`interface InterpreterOptions {
  // Global variables and functions to inject into the sandbox
  globals?: Record<string, unknown>;

  // Control which language features are enabled
  featureControl?: FeatureControl;

  // Custom AST validator function
  validator?: (ast: Program) => boolean;

  // Security configuration
  security?: SecurityOptions;

  // Resource tracker for monitoring usage
  resourceTracker?: ResourceTracker;
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Example</h3>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

// Simple interpreter
const simple = new Interpreter();

// With preset
const withPreset = new Interpreter(ES2024);

// With custom configuration
const custom = new Interpreter(
  preset(ES2024, {
    globals: {
      log: console.log,
      calculateTax: (amount) => amount * 0.2,
    },
    security: {
      hideHostErrorMessages: false,
    },
  })
);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Methods</h2>

        <div className="space-y-8">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">evaluate(code, options?)</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Synchronously evaluates JavaScript code and returns the result.
            </p>
            <CodeBlock code={`evaluate(code: string, options?: EvaluateOptions): unknown`} />
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Parameters</h4>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>
                  <code className="text-amber-400">code</code> - The JavaScript code to evaluate
                </li>
                <li>
                  <code className="text-amber-400">options</code> - Optional per-call configuration
                </li>
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Returns</h4>
              <p className="text-sm text-neutral-400">
                The value of the last expression in the code
              </p>
            </div>
            <div className="mt-4">
              <CodeBlock
                code={`const result = interpreter.evaluate("2 + 2"); // 4

const sum = interpreter.evaluate(\`
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    total += i;
  }
  total
\`); // 55

// With per-call options
const value = interpreter.evaluate("x * multiplier", {
  globals: { x: 10, multiplier: 5 },
}); // 50`}
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              evaluateAsync(code, options?)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Asynchronously evaluates JavaScript code, supporting async/await.
            </p>
            <CodeBlock
              code={`evaluateAsync(code: string, options?: EvaluateOptions): Promise<unknown>`}
            />
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Parameters</h4>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>
                  <code className="text-amber-400">code</code> - The JavaScript code to evaluate
                </li>
                <li>
                  <code className="text-amber-400">options</code> - Optional per-call configuration
                </li>
              </ul>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Returns</h4>
              <p className="text-sm text-neutral-400">
                Promise resolving to the value of the last expression
              </p>
            </div>
            <div className="mt-4">
              <CodeBlock
                code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      fetchUser: async (id) => ({ id, name: "John" }),
    },
  })
);

const name = await interpreter.evaluateAsync(\`
  const user = await fetchUser(123);
  user.name
\`); // "John"`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">EvaluateOptions</h2>
        <p className="text-neutral-300 mb-4">
          Per-call options that override or extend constructor options:
        </p>
        <CodeBlock
          code={`interface EvaluateOptions {
  // Additional globals for this call only (merged with constructor globals)
  globals?: Record<string, unknown>;

  // Custom validator for this call only
  validator?: (ast: Program) => boolean;

  // Execution limits
  maxCallStackDepth?: number;  // Max recursion depth
  maxLoopIterations?: number;  // Max iterations per loop
  maxMemory?: number;          // Max memory in bytes (best-effort)

  // Abort signal for cancellation
  signal?: AbortSignal;
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Execution Limits</h3>
        <CodeBlock
          code={`// Protect against runaway code
const result = interpreter.evaluate(untrustedCode, {
  maxCallStackDepth: 100,    // Prevent deep recursion
  maxLoopIterations: 10000,  // Prevent infinite loops
  maxMemory: 10 * 1024 * 1024, // 10 MB memory limit
});

// With abort signal for timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  await interpreter.evaluateAsync(code, {
    signal: controller.signal,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Execution timed out');
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">SecurityOptions</h2>
        <CodeBlock
          code={`interface SecurityOptions {
  // Sanitize error stack traces to hide host paths
  // Default: true
  sanitizeErrors?: boolean;

  // Hide error messages from host functions
  // Default: true
  hideHostErrorMessages?: boolean;
}`}
        />
        <p className="text-neutral-300 mt-4">
          See the{" "}
          <Link to="/docs/security" className="text-amber-500 hover:text-amber-400">
            Security Model
          </Link>{" "}
          documentation for details.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">FeatureControl</h2>
        <CodeBlock
          code={`interface FeatureControl {
  // "whitelist" - only allow listed features
  // "blacklist" - allow all except listed features
  mode: "whitelist" | "blacklist";

  // Array of feature names
  features: LanguageFeature[];
}`}
        />
        <p className="text-neutral-300 mt-4">
          See the{" "}
          <Link to="/docs/features" className="text-amber-500 hover:text-amber-400">
            Feature Control
          </Link>{" "}
          documentation for the full list of features.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Custom Validators</h2>
        <p className="text-neutral-300 mb-4">
          Validators allow you to inspect and reject code before execution:
        </p>
        <CodeBlock
          code={`const interpreter = new Interpreter({
  validator: (ast) => {
    // Return false to reject the code
    // Return true to allow execution

    // Example: Reject code with more than 100 nodes
    let nodeCount = 0;
    function countNodes(node) {
      nodeCount++;
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(countNodes);
          } else if (node[key].type) {
            countNodes(node[key]);
          }
        }
      }
    }
    countNodes(ast);

    return nodeCount <= 100;
  },
});`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/features"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Feature Control
        </Link>
        <Link
          to="/docs/api/errors"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Error Types &rarr;
        </Link>
      </div>
    </article>
  );
}
