import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function BasicExamples() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Basic Usage</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Common patterns and examples for using NookJS in your applications.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Simple Expression Evaluator
        </h2>
        <p className="text-neutral-300 mb-4">
          The simplest use case - evaluate mathematical expressions:
        </p>
        <CodeBlock
          code={`import { Interpreter } from "nookjs";

const interpreter = new Interpreter();

// Basic math
interpreter.evaluate("2 + 2");          // 4
interpreter.evaluate("10 * 5 / 2");     // 25
interpreter.evaluate("2 ** 10");        // 1024

// With variables
interpreter.evaluate(\`
  let x = 10;
  let y = 20;
  x * y + 5
\`); // 205`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Formula Evaluator</h2>
        <p className="text-neutral-300 mb-4">
          Build a spreadsheet-style formula evaluator with cell references:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

function createFormulaEvaluator() {
  const interpreter = new Interpreter(
    preset(ES2024, {
      globals: {
        // Spreadsheet functions
        SUM: (...nums: number[]) => nums.reduce((a, b) => a + b, 0),
        AVG: (...nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length,
        MIN: Math.min,
        MAX: Math.max,
        ABS: Math.abs,
        ROUND: Math.round,
        FLOOR: Math.floor,
        CEIL: Math.ceil,
        IF: (condition: boolean, then: unknown, else_: unknown) =>
          condition ? then : else_,
        AND: (...vals: boolean[]) => vals.every(Boolean),
        OR: (...vals: boolean[]) => vals.some(Boolean),
      },
    })
  );

  return function evaluate(formula: string, cells: Record<string, number>) {
    return interpreter.evaluate(formula, { globals: cells });
  };
}

// Usage
const evaluate = createFormulaEvaluator();

const cells = { A1: 10, A2: 20, A3: 30, B1: 100 };

evaluate("A1 + A2", cells);                    // 30
evaluate("SUM(A1, A2, A3)", cells);            // 60
evaluate("AVG(A1, A2, A3)", cells);            // 20
evaluate("IF(A1 > 5, B1, 0)", cells);          // 100
evaluate("SUM(A1, A2) * IF(B1 > 50, 2, 1)", cells); // 60`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Configuration/Rules Engine</h2>
        <p className="text-neutral-300 mb-4">Let users define business rules in JavaScript:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

interface Order {
  total: number;
  items: number;
  customerTier: "bronze" | "silver" | "gold";
  isFirstOrder: boolean;
}

function createRulesEngine() {
  const interpreter = new Interpreter(ES2024);

  return function evaluateRule(rule: string, order: Order): boolean {
    return interpreter.evaluate(rule, {
      globals: { order },
    }) as boolean;
  };
}

// Usage
const evaluateRule = createRulesEngine();

const order: Order = {
  total: 150,
  items: 3,
  customerTier: "gold",
  isFirstOrder: false,
};

// User-defined discount rules
const rules = [
  {
    name: "Gold Customer Discount",
    condition: 'order.customerTier === "gold"',
    discount: 0.15,
  },
  {
    name: "Bulk Order Discount",
    condition: "order.items >= 5 || order.total >= 200",
    discount: 0.1,
  },
  {
    name: "First Order Bonus",
    condition: "order.isFirstOrder && order.total >= 50",
    discount: 0.2,
  },
];

// Find applicable discounts
const applicableDiscounts = rules.filter((rule) =>
  evaluateRule(rule.condition, order)
);
// [{ name: "Gold Customer Discount", ... }]`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Template Rendering</h2>
        <p className="text-neutral-300 mb-4">Execute template expressions safely:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

function createTemplateEngine() {
  const interpreter = new Interpreter(
    preset(ES2024, {
      globals: {
        // Template helpers
        uppercase: (s: string) => s.toUpperCase(),
        lowercase: (s: string) => s.toLowerCase(),
        capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
        formatDate: (d: string | Date) => new Date(d).toLocaleDateString(),
        formatCurrency: (n: number) => "$" + n.toFixed(2),
        pluralize: (count: number, singular: string, plural: string) =>
          count === 1 ? singular : plural,
      },
      // Disable loops for safety
      featureControl: {
        mode: "blacklist",
        features: [
          "ForStatement",
          "WhileStatement",
          "DoWhileStatement",
          "ForInStatement",
          "ForOfStatement",
        ],
      },
    })
  );

  // Render template with {{ expression }} syntax
  return function render(template: string, data: Record<string, unknown>): string {
    return template.replace(/\\{\\{\\s*(.+?)\\s*\\}\\}/g, (_, expression) => {
      try {
        const result = interpreter.evaluate(expression, { globals: data });
        return String(result);
      } catch (error) {
        return \`[Error: \${expression}]\`;
      }
    });
  };
}

// Usage
const render = createTemplateEngine();

const template = \`
Hello {{ capitalize(user.name) }}!

You have {{ items.length }} {{ pluralize(items.length, "item", "items") }} in your cart.
Total: {{ formatCurrency(total) }}

Order date: {{ formatDate(orderDate) }}
\`;

const html = render(template, {
  user: { name: "john" },
  items: [1, 2, 3],
  total: 99.99,
  orderDate: new Date(),
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Data Transformation</h2>
        <p className="text-neutral-300 mb-4">Let users define data transformations:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

function createTransformer<T, R>(transformCode: string) {
  const interpreter = new Interpreter(ES2024);

  return function transform(data: T): R {
    return interpreter.evaluate(transformCode, {
      globals: { data },
    }) as R;
  };
}

// Usage: User-defined transformation
const transform = createTransformer<
  { users: Array<{ name: string; age: number }> },
  Array<{ displayName: string; isAdult: boolean }>
>(\`
  data.users.map(user => ({
    displayName: user.name.toUpperCase(),
    isAdult: user.age >= 18
  }))
\`);

const result = transform({
  users: [
    { name: "Alice", age: 25 },
    { name: "Bob", age: 17 },
  ],
});
// [{ displayName: "ALICE", isAdult: true }, { displayName: "BOB", isAdult: false }]`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Validation Rules</h2>
        <p className="text-neutral-300 mb-4">Let users define validation logic:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset, RuntimeError } from "nookjs";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function createValidator(rules: Array<{ rule: string; message: string }>) {
  const interpreter = new Interpreter(ES2024);

  return function validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    for (const { rule, message } of rules) {
      try {
        const result = interpreter.evaluate(rule, { globals: data });
        if (!result) {
          errors.push(message);
        }
      } catch (error) {
        if (error instanceof RuntimeError) {
          errors.push(\`Validation error: \${message}\`);
        } else {
          throw error;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  };
}

// Usage
const validateUser = createValidator([
  { rule: "name && name.length >= 2", message: "Name must be at least 2 characters" },
  { rule: "email && email.includes('@')", message: "Valid email required" },
  { rule: "age >= 18", message: "Must be 18 or older" },
  { rule: "password && password.length >= 8", message: "Password must be at least 8 characters" },
]);

const result = validateUser({
  name: "A",
  email: "invalid",
  age: 16,
  password: "short",
});
// { valid: false, errors: ["Name must be at least 2 characters", "Valid email required", "Must be 18 or older", "Password must be at least 8 characters"] }`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Calculated Fields</h2>
        <p className="text-neutral-300 mb-4">
          Add computed properties to objects based on user-defined formulas:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

interface FieldDefinition {
  name: string;
  formula: string;
}

function createCalculatedFields<T extends Record<string, unknown>>(
  fields: FieldDefinition[]
) {
  const interpreter = new Interpreter(ES2024);

  return function compute(data: T): T & Record<string, unknown> {
    const result = { ...data };

    for (const field of fields) {
      result[field.name] = interpreter.evaluate(field.formula, {
        globals: result,
      });
    }

    return result;
  };
}

// Usage
const computeOrderFields = createCalculatedFields([
  { name: "subtotal", formula: "quantity * unitPrice" },
  { name: "tax", formula: "subtotal * taxRate" },
  { name: "total", formula: "subtotal + tax" },
  { name: "savings", formula: "originalPrice - total" },
]);

const order = computeOrderFields({
  quantity: 3,
  unitPrice: 29.99,
  taxRate: 0.08,
  originalPrice: 100,
});
// { quantity: 3, unitPrice: 29.99, taxRate: 0.08, originalPrice: 100,
//   subtotal: 89.97, tax: 7.1976, total: 97.1676, savings: 2.8324 }`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/api/resource-tracker"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Resource Tracker
        </Link>
        <Link
          to="/docs/examples/async"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Async Operations &rarr;
        </Link>
      </div>
    </article>
  );
}
