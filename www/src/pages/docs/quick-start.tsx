import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function QuickStart() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Quick Start</h1>
      <p className="text-xl text-neutral-300 mb-8">Get up and running with NookJS in minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Basic Evaluation</h2>
        <p className="text-neutral-300 mb-4">Create an interpreter and evaluate JavaScript code:</p>
        <CodeBlock
          code={`import { Interpreter } from "nookjs";

const interpreter = new Interpreter();

// Simple expressions
const sum = interpreter.evaluate("2 + 3 * 4");
console.log(sum); // 14

// Multi-line code
const result = interpreter.evaluate(\`
  let numbers = [1, 2, 3, 4, 5];
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum = sum + numbers[i];
  }
  sum
\`);
console.log(result); // 15`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Using Presets</h2>
        <p className="text-neutral-300 mb-4">
          Presets configure the interpreter with specific ECMAScript version features and built-in
          globals:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

// Create interpreter with ES2024 features
const interpreter = new Interpreter(ES2024);

// Now you can use modern JavaScript features
interpreter.evaluate(\`
  const data = { a: 1, b: 2, c: 3 };
  const values = Object.values(data);
  const sum = values.reduce((acc, val) => acc + val, 0);
  sum
\`); // 6`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Injecting Globals</h2>
        <p className="text-neutral-300 mb-4">Pass host functions and data into the sandbox:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      // Simple values
      PI: 3.14159,
      VERSION: "1.0.0",

      // Functions
      log: (msg) => console.log("[sandbox]", msg),
      calculateArea: (radius) => Math.PI * radius * radius,

      // Objects (will be read-only in sandbox)
      config: {
        maxItems: 100,
        debug: true,
      },
    },
  })
);

interpreter.evaluate(\`
  log("Calculating area...");
  const area = calculateArea(5);
  log("Area: " + area);

  // Accessing injected config
  if (config.debug) {
    log("Debug mode enabled");
  }
\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Async Code</h2>
        <p className="text-neutral-300 mb-4">
          Use <code className="text-amber-400 bg-neutral-800 px-1 rounded">evaluateAsync</code> to
          execute code with async/await:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      fetchUser: async (id) => {
        // Simulated async operation
        return { id, name: "John Doe", email: "john@example.com" };
      },
    },
  })
);

const result = await interpreter.evaluateAsync(\`
  const user = await fetchUser(123);
  user.name
\`);

console.log(result); // "John Doe"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Handling</h2>
        <p className="text-neutral-300 mb-4">Catch and handle errors from sandbox code:</p>
        <CodeBlock
          code={`import {
  Interpreter,
  ES2024,
  ParseError,
  RuntimeError,
  SecurityError
} from "nookjs";

const interpreter = new Interpreter(ES2024);

try {
  interpreter.evaluate(userProvidedCode);
} catch (error) {
  if (error instanceof ParseError) {
    // Syntax error in the code
    console.error("Syntax error:", error.message);
  } else if (error instanceof SecurityError) {
    // Attempted to access blocked property
    console.error("Security violation:", error.message);
  } else if (error instanceof RuntimeError) {
    // Runtime error (thrown value accessible via error.thrownValue)
    console.error("Runtime error:", error.message);
  } else {
    // Unknown error
    console.error("Error:", error);
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">TypeScript Support</h2>
        <p className="text-neutral-300 mb-4">
          Type annotations are automatically stripped at parse time:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024 } from "nookjs";

const interpreter = new Interpreter(ES2024);

// TypeScript syntax works out of the box
const result = interpreter.evaluate(\`
  interface User {
    name: string;
    age: number;
  }

  function greet(user: User): string {
    return "Hello, " + user.name;
  }

  const user: User = { name: "Alice", age: 30 };
  greet(user)
\`);

console.log(result); // "Hello, Alice"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Complete Example</h2>
        <p className="text-neutral-300 mb-4">
          Here's a complete example showing a typical use case:
        </p>
        <CodeBlock
          code={`import {
  Interpreter,
  ES2024,
  preset,
  ParseError,
  InterpreterError
} from "nookjs";

// Create a sandboxed interpreter for evaluating user formulas
function createFormulaEvaluator(data: Record<string, number>) {
  const interpreter = new Interpreter(
    preset(ES2024, {
      globals: {
        // Expose data as read-only
        data,

        // Provide safe math helpers
        sum: (...nums: number[]) => nums.reduce((a, b) => a + b, 0),
        avg: (...nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length,
        min: Math.min,
        max: Math.max,
        round: Math.round,
      },
    })
  );

  return (formula: string) => {
    try {
      return interpreter.evaluate(formula);
    } catch (error) {
      if (error instanceof ParseError || error instanceof InterpreterError) {
        throw new Error(\`Formula error: \${error.message}\`);
      }
      throw error;
    }
  };
}

// Usage
const evaluate = createFormulaEvaluator({
  revenue: 50000,
  costs: 30000,
  employees: 10,
});

console.log(evaluate("data.revenue - data.costs")); // 20000
console.log(evaluate("avg(data.revenue, data.costs)")); // 40000
console.log(evaluate("data.revenue / data.employees")); // 5000`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/installation"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Installation
        </Link>
        <Link to="/docs/security" className="text-amber-500 hover:text-amber-400 transition-colors">
          Security Model &rarr;
        </Link>
      </div>
    </article>
  );
}
