import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Security() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Security Model</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Understanding how NookJS sandboxes untrusted code and protects your host environment.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Overview</h2>
        <p className="text-neutral-300 mb-4">
          NookJS provides a secure sandbox for executing untrusted JavaScript code. The security
          model is designed to <strong className="text-neutral-100">completely isolate</strong>{" "}
          sandbox code from the host environment, preventing any form of escape or information
          leakage.
        </p>
        <p className="text-neutral-300 mb-4">
          The security model is built around four key mechanisms:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">1.</span>
            <span>
              <strong className="text-neutral-100">ReadOnlyProxy</strong> - Wraps all host values to
              enforce immutability and block dangerous property access
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">2.</span>
            <span>
              <strong className="text-neutral-100">Dangerous Property Blocking</strong> - Blocks
              access to prototype chain manipulation and other dangerous properties
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">3.</span>
            <span>
              <strong className="text-neutral-100">Forbidden Globals</strong> - Prevents injection
              of code-execution primitives
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">4.</span>
            <span>
              <strong className="text-neutral-100">Error Sanitization</strong> - Prevents leakage of
              host information through error messages and stack traces
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">What's Blocked</h2>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">Dangerous Properties</h3>
        <p className="text-neutral-300 mb-4">
          The following properties are blocked on all host objects passed into the sandbox:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Category</th>
                <th className="text-left py-2 text-neutral-300">Properties</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Prototype chain</td>
                <td className="py-2">
                  <code className="text-amber-400">__proto__</code>,{" "}
                  <code className="text-amber-400">constructor</code>,{" "}
                  <code className="text-amber-400">prototype</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Legacy methods</td>
                <td className="py-2">
                  <code className="text-amber-400">__defineGetter__</code>,{" "}
                  <code className="text-amber-400">__defineSetter__</code>,{" "}
                  <code className="text-amber-400">__lookupGetter__</code>,{" "}
                  <code className="text-amber-400">__lookupSetter__</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Object.prototype</td>
                <td className="py-2">
                  <code className="text-amber-400">toString</code>,{" "}
                  <code className="text-amber-400">hasOwnProperty</code>,{" "}
                  <code className="text-amber-400">isPrototypeOf</code>,{" "}
                  <code className="text-amber-400">propertyIsEnumerable</code>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Function.prototype</td>
                <td className="py-2">
                  <code className="text-amber-400">apply</code>,{" "}
                  <code className="text-amber-400">call</code>,{" "}
                  <code className="text-amber-400">bind</code>,{" "}
                  <code className="text-amber-400">arguments</code>,{" "}
                  <code className="text-amber-400">caller</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock
          code={`// All of these will throw SecurityError
obj.__proto__;           // Prototype pollution
obj.constructor;         // Constructor access
obj.prototype;           // Prototype access
func.apply(null, args);  // Function methods blocked
func.call(null, arg);
func.bind(null);`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">Forbidden Globals</h3>
        <p className="text-neutral-300 mb-4">
          The following cannot be injected as globals, as they would allow arbitrary code execution:
        </p>
        <ul className="space-y-2 text-neutral-300 mb-4">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">Function</code> - Would
              allow arbitrary code execution via{" "}
              <code className="text-neutral-400">new Function("return this")()</code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">eval</code> - Would allow
              arbitrary code execution
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">Proxy</code> - Could
              intercept operations and escape sandbox
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">Reflect</code> - Could
              access internal operations
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                AsyncFunction, GeneratorFunction
              </code>{" "}
              - Function construction
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Security Options</h2>
        <p className="text-neutral-300 mb-4">
          Configure security behavior through the{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">security</code> option:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: { /* ... */ },
    security: {
      // Sanitize error stack traces to remove host file paths
      // Default: true
      sanitizeErrors: true,

      // Hide original error messages from host functions
      // Default: true
      hideHostErrorMessages: true,
    },
  })
);`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">
          sanitizeErrors (default: true)
        </h3>
        <p className="text-neutral-300 mb-4">
          When enabled, error stack traces are sanitized to remove host file paths. This prevents
          untrusted code from learning about your host environment's file structure.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-neutral-400 mb-2">Before sanitization:</p>
            <CodeBlock
              code={`Error: test
  at executeHostConstructor (/Users/dev/project/src/interpreter.ts:4122:30)
  at evaluateNewExpressionAsync (/Users/dev/project/src/interpreter.ts:7300:21)`}
            />
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-2">After sanitization:</p>
            <CodeBlock
              code={`Error: test
  at executeHostConstructor ([native code])
  at evaluateNewExpressionAsync ([native code])`}
            />
          </div>
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">
          hideHostErrorMessages (default: true)
        </h3>
        <p className="text-neutral-300 mb-4">
          When enabled, error messages from host functions are replaced with a generic message. This
          is useful when host functions might throw errors containing sensitive information.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-neutral-400 mb-2">Without hiding:</p>
            <CodeBlock
              code={`Host function 'readFile' threw error:
ENOENT: no such file, open '/etc/passwd'`}
            />
          </div>
          <div>
            <p className="text-sm text-neutral-400 mb-2">With hiding:</p>
            <CodeBlock
              code={`Host function 'readFile' threw error:
[error details hidden]`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Execution Limits</h2>
        <p className="text-neutral-300 mb-4">
          Protect against denial-of-service attacks with execution limits:
        </p>
        <CodeBlock
          code={`const result = interpreter.evaluate(untrustedCode, {
  // Maximum call stack depth (protects against infinite recursion)
  maxCallStackDepth: 100,

  // Maximum iterations per loop (protects against infinite loops)
  maxLoopIterations: 10000,

  // Maximum memory usage in bytes (best-effort estimate)
  maxMemory: 10 * 1024 * 1024, // 10 MB
});`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">maxCallStackDepth</h3>
        <p className="text-neutral-300 mb-4">
          Limits the depth of function call nesting. When exceeded, throws{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            InterpreterError: Maximum call stack depth exceeded
          </code>
          .
        </p>
        <CodeBlock
          code={`// This will throw when maxCallStackDepth is exceeded
interpreter.evaluate(\`
  function infinite() { return infinite(); }
  infinite();
\`, { maxCallStackDepth: 50 });`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">maxLoopIterations</h3>
        <p className="text-neutral-300 mb-4">
          Limits the number of iterations <strong>per loop</strong>. Each loop has its own counter
          that resets when the loop completes.
        </p>
        <CodeBlock
          code={`// This will throw
interpreter.evaluate(\`while (true) { }\`, { maxLoopIterations: 1000 });

// This works - each loop is under the limit
interpreter.evaluate(\`
  for (let i = 0; i < 500; i++) { }  // 500 iterations
  for (let j = 0; j < 500; j++) { }  // 500 iterations
\`, { maxLoopIterations: 1000 });`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">maxMemory</h3>
        <p className="text-neutral-300 mb-4">
          Limits estimated memory usage in bytes. This is a <strong>best-effort heuristic</strong>{" "}
          that tracks array, object, and string allocations.
        </p>
        <CodeBlock
          code={`// This will throw when estimated memory exceeds the limit
interpreter.evaluate(\`
  const huge = [];
  for (let i = 0; i < 100000; i++) {
    huge.push([1, 2, 3, 4, 5]);
  }
\`, {
  maxMemory: 1024 * 1024,  // 1 MB
  maxLoopIterations: 1000000
});`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-8">
          Combined with AbortSignal
        </h3>
        <p className="text-neutral-300 mb-4">
          For comprehensive protection, combine execution limits with AbortSignal for timeouts:
        </p>
        <CodeBlock
          code={`const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  await interpreter.evaluateAsync(code, {
    signal: controller.signal,
    maxCallStackDepth: 100,
    maxLoopIterations: 100000,
    maxMemory: 10 * 1024 * 1024,
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Execution timed out');
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Host Value Protection</h2>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">ReadOnlyProxy</h3>
        <p className="text-neutral-300 mb-4">
          All host values are wrapped in a ReadOnlyProxy which:
        </p>
        <ul className="space-y-2 text-neutral-300 mb-6">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Returns <code className="text-amber-400">null</code> for{" "}
              <code className="text-amber-400">getPrototypeOf()</code> (hides prototype chain)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Blocks <code className="text-amber-400">set</code>,{" "}
              <code className="text-amber-400">deleteProperty</code>,{" "}
              <code className="text-amber-400">defineProperty</code>,{" "}
              <code className="text-amber-400">setPrototypeOf</code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Blocks access to dangerous properties listed above</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Recursively wraps nested objects</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Wraps function properties as HostFunctionValue</span>
          </li>
        </ul>

        <CodeBlock
          code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      config: { secret: "password123" },
    },
  })
);

// Sandbox code cannot modify host objects
interpreter.evaluate(\`
  config.secret = "hacked";  // Silently fails (no error, but no effect)
  delete config.secret;      // Silently fails
  config.newProp = "test";   // Silently fails

  config.secret              // Still "password123"
\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Best Practices</h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              1. Always use execution limits
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Prevent infinite loops and excessive resource consumption:
            </p>
            <CodeBlock
              code={`interpreter.evaluate(code, {
  maxCallStackDepth: 100,
  maxLoopIterations: 10000,
  maxMemory: 10 * 1024 * 1024,
});`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              2. Clone sensitive data before passing
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              While host objects are read-only in the sandbox, clone sensitive data for extra
              safety:
            </p>
            <CodeBlock
              code={`interpreter.evaluate(code, {
  globals: { state: structuredClone(sharedState) },
});`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              3. Validate host function arguments
            </h3>
            <p className="text-neutral-400 text-sm mb-3">Never trust input from sandbox code:</p>
            <CodeBlock
              code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      readFile: (path) => {
        // ALWAYS validate arguments from sandbox
        if (typeof path !== 'string') {
          throw new Error('Path must be a string');
        }
        if (path.includes('..') || path.startsWith('/')) {
          throw new Error('Invalid path');
        }
        return fs.readFileSync(\`./allowed/\${path}\`, 'utf8');
      },
    },
  })
);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              4. Use per-call globals for isolation
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provide context-specific data per evaluation:
            </p>
            <CodeBlock
              code={`// Each user gets their own isolated context
function evaluateUserCode(userId: string, code: string) {
  return interpreter.evaluate(code, {
    globals: {
      userId,
      userData: getUserData(userId),
    },
  });
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              5. Keep security options enabled in production
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Only disable error hiding during development:
            </p>
            <CodeBlock
              code={`const interpreter = new Interpreter(
  preset(ES2024, {
    security: {
      // For debugging only - remove in production
      sanitizeErrors: process.env.NODE_ENV === 'development',
      hideHostErrorMessages: process.env.NODE_ENV === 'development',
    },
  })
);`}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/quick-start"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Quick Start
        </Link>
        <Link to="/docs/presets" className="text-amber-500 hover:text-amber-400 transition-colors">
          Presets &rarr;
        </Link>
      </div>
    </article>
  );
}
