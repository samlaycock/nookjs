import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function ErrorsAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Error Types</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Error classes thrown by the interpreter for different failure scenarios.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Hierarchy</h2>
        <CodeBlock
          code={`Error
└── InterpreterError (base class)
    ├── ParseError        // Syntax errors
    ├── RuntimeError      // Runtime exceptions
    ├── SecurityError     // Security violations
    ├── FeatureError      // Disabled feature used
    └── ResourceExhaustedError  // Resource limit exceeded`}
          language="text"
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">InterpreterError</h2>
        <p className="text-neutral-300 mb-4">
          Base class for all interpreter errors. All specific error types extend this class.
        </p>
        <CodeBlock
          code={`import { InterpreterError } from "nookjs";

try {
  interpreter.evaluate(code);
} catch (error) {
  if (error instanceof InterpreterError) {
    console.log(error.message);
    console.log(error.code);  // Error code like "E0001"
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">ParseError</h2>
        <p className="text-neutral-300 mb-4">
          Thrown when the code contains syntax errors that prevent parsing.
        </p>
        <CodeBlock
          code={`import { ParseError } from "nookjs";

try {
  interpreter.evaluate("const x = ;"); // Syntax error
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.message);
    // "Unexpected token ';' at line 1, column 11"

    console.log(error.line);    // 1
    console.log(error.column);  // 11
  }
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Properties</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Property</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Type</th>
                <th className="text-left py-2 text-neutral-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">message</code>
                </td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Human-readable error description</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">line</code>
                </td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Line number where error occurred</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">column</code>
                </td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Column number where error occurred</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">code</code>
                </td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Error code (e.g., "E0001")</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">RuntimeError</h2>
        <p className="text-neutral-300 mb-4">
          Thrown when sandbox code throws an error during execution.
        </p>
        <CodeBlock
          code={`import { RuntimeError } from "nookjs";

try {
  interpreter.evaluate(\`
    throw new Error("Something went wrong");
  \`);
} catch (error) {
  if (error instanceof RuntimeError) {
    console.log(error.message);
    // "Uncaught Error: Something went wrong"

    // Access the original thrown value
    console.log(error.thrownValue);
    // Error { message: "Something went wrong" }
  }
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Properties</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Property</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Type</th>
                <th className="text-left py-2 text-neutral-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">message</code>
                </td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Error message with call stack</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">thrownValue</code>
                </td>
                <td className="py-2 pr-4">unknown</td>
                <td className="py-2">The actual value thrown by sandbox code</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Non-Error Throws</h3>
        <p className="text-neutral-300 mb-4">
          JavaScript allows throwing any value, not just Error objects:
        </p>
        <CodeBlock
          code={`try {
  interpreter.evaluate('throw "string error"');
} catch (error) {
  if (error instanceof RuntimeError) {
    console.log(error.thrownValue); // "string error"
  }
}

try {
  interpreter.evaluate('throw { code: 404, reason: "Not found" }');
} catch (error) {
  if (error instanceof RuntimeError) {
    console.log(error.thrownValue); // { code: 404, reason: "Not found" }
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">SecurityError</h2>
        <p className="text-neutral-300 mb-4">
          Thrown when sandbox code attempts to access blocked properties or perform forbidden
          operations.
        </p>
        <CodeBlock
          code={`import { SecurityError } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: { obj: { foo: "bar" } },
  })
);

try {
  interpreter.evaluate("obj.__proto__");
} catch (error) {
  if (error instanceof SecurityError) {
    console.log(error.message);
    // "Access to property '__proto__' is not allowed"

    console.log(error.property); // "__proto__"
  }
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Common Triggers</h3>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Accessing <code className="text-amber-400">__proto__</code>,{" "}
              <code className="text-amber-400">constructor</code>, or{" "}
              <code className="text-amber-400">prototype</code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Calling <code className="text-amber-400">apply</code>,{" "}
              <code className="text-amber-400">call</code>, or{" "}
              <code className="text-amber-400">bind</code> on host functions
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Attempting to inject forbidden globals</span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">FeatureError</h2>
        <p className="text-neutral-300 mb-4">
          Thrown when sandbox code uses a language feature that is not enabled.
        </p>
        <CodeBlock
          code={`import { FeatureError } from "nookjs";

const interpreter = new Interpreter({
  featureControl: {
    mode: "whitelist",
    features: ["BinaryOperators"],
  },
});

try {
  interpreter.evaluate("for (let i = 0; i < 10; i++) {}");
} catch (error) {
  if (error instanceof FeatureError) {
    console.log(error.message);
    // "Feature 'ForStatement' is not enabled"

    console.log(error.feature); // "ForStatement"
  }
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Properties</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Property</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Type</th>
                <th className="text-left py-2 text-neutral-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">feature</code>
                </td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">The feature that was used but not enabled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">ResourceExhaustedError</h2>
        <p className="text-neutral-300 mb-4">
          Thrown when execution exceeds configured resource limits.
        </p>
        <CodeBlock
          code={`import { ResourceExhaustedError } from "nookjs";

try {
  interpreter.evaluate(\`
    while (true) {}
  \`, {
    maxLoopIterations: 1000,
  });
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(error.message);
    // "Maximum loop iterations exceeded"

    console.log(error.resourceType); // "loopIterations"
    console.log(error.used);         // 1001
    console.log(error.limit);        // 1000
  }
}`}
        />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Properties</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Property</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Type</th>
                <th className="text-left py-2 text-neutral-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">resourceType</code>
                </td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Type of resource: "callStack", "loopIterations", "memory"</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">used</code>
                </td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Amount of resource used when limit was hit</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">limit</code>
                </td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">The configured limit that was exceeded</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Comprehensive Error Handling
        </h2>
        <p className="text-neutral-300 mb-4">Handle all error types in your application:</p>
        <CodeBlock
          code={`import {
  Interpreter,
  ES2024,
  ParseError,
  RuntimeError,
  SecurityError,
  FeatureError,
  ResourceExhaustedError,
} from "nookjs";

function executeUserCode(code: string) {
  const interpreter = new Interpreter(ES2024);

  try {
    return {
      success: true,
      result: interpreter.evaluate(code, {
        maxLoopIterations: 10000,
        maxCallStackDepth: 100,
      }),
    };
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        success: false,
        error: "syntax",
        message: \`Syntax error at line \${error.line}: \${error.message}\`,
      };
    }

    if (error instanceof FeatureError) {
      return {
        success: false,
        error: "feature",
        message: \`The feature '\${error.feature}' is not allowed\`,
      };
    }

    if (error instanceof SecurityError) {
      return {
        success: false,
        error: "security",
        message: "Security violation detected",
      };
    }

    if (error instanceof ResourceExhaustedError) {
      return {
        success: false,
        error: "resource",
        message: \`Resource limit exceeded: \${error.resourceType}\`,
      };
    }

    if (error instanceof RuntimeError) {
      return {
        success: false,
        error: "runtime",
        message: error.message,
        thrown: error.thrownValue,
      };
    }

    // Unknown error
    throw error;
  }
}`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/api/interpreter"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Interpreter
        </Link>
        <Link
          to="/docs/api/resource-tracker"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Resource Tracker &rarr;
        </Link>
      </div>
    </article>
  );
}
