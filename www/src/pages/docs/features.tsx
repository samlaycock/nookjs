import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Features() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Feature Control</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Fine-grained control over which JavaScript language features are available in the sandbox.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Overview</h2>
        <p className="text-neutral-300 mb-4">
          Feature control allows you to restrict which JavaScript language constructs can be used in
          sandbox code. This is useful for:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Security</strong> - Disable features that could
              be abused
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Simplicity</strong> - Limit to a simple subset
              for formula evaluation
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">Education</strong> - Teach specific JavaScript
              concepts by enabling only relevant features
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Simplified Toggles</h2>
        <p className="text-neutral-300 mb-4">
          Use <code className="text-amber-400 bg-neutral-800 px-1 rounded">features</code> with
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">createSandbox()</code> to
          enable or disable specific features.
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  features: {
    disable: ["ArrowFunctions", "ForStatement"],
  },
});

// Throws: ArrowFunctions is not enabled
sandbox.runSync("(() => 1)()");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Whitelist Mode</h2>
        <p className="text-neutral-300 mb-4">
          Only allow explicitly listed features (most restrictive):
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  features: {
    mode: "whitelist",
    enable: [
      "VariableDeclarations",
      "BinaryOperators",
      "UnaryOperators",
      "CallExpression",
      "MemberExpression",
    ],
  },
});

// These work
sandbox.runSync("let x = 5");
sandbox.runSync("x + 10");
sandbox.runSync("Math.abs(-5)");

// These throw FeatureError
sandbox.runSync("for (let i = 0; i < 10; i++) {}"); // ForStatement not enabled
sandbox.runSync("() => {}");                         // ArrowFunctions not enabled`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Blacklist Mode</h2>
        <p className="text-neutral-300 mb-4">Allow everything except explicitly listed features:</p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2022",
  features: {
    mode: "blacklist",
    disable: [
      "ForStatement",
      "WhileStatement",
      "DoWhileStatement",
      "ForInStatement",
      "ForOfStatement",
    ],
  },
});

// Most features work
sandbox.runSync("const fn = () => x * 2");
sandbox.runSync("if (x > 0) { return x; }");

// Loops throw FeatureError
sandbox.runSync("for (let i = 0; i < 10; i++) {}"); // ForStatement is blacklisted
sandbox.runSync("while (true) {}");                  // WhileStatement is blacklisted`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Available Features</h2>
        <p className="text-neutral-300 mb-4">The following features can be controlled:</p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Variables & Declarations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["VariableDeclarations", "FunctionDeclarations", "ClassDeclarations"].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Operators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "BinaryOperators",
                "UnaryOperators",
                "LogicalOperators",
                "AssignmentOperators",
                "UpdateOperators",
                "ConditionalExpression",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Control Flow</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "IfStatement",
                "SwitchStatement",
                "ForStatement",
                "ForInStatement",
                "ForOfStatement",
                "WhileStatement",
                "DoWhileStatement",
                "BreakStatement",
                "ContinueStatement",
                "ReturnStatement",
                "ThrowStatement",
                "TryStatement",
                "LabeledStatement",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Functions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "FunctionExpressions",
                "ArrowFunctions",
                "FunctionCalls",
                "NewExpressions",
                "DefaultParameters",
                "RestParameters",
                "SpreadElements",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Objects & Arrays</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "ObjectExpressions",
                "ArrayExpressions",
                "MemberExpressions",
                "ComputedProperties",
                "ShorthandProperties",
                "SpreadProperties",
                "Destructuring",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">ES6+ Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "TemplateLiterals",
                "TaggedTemplates",
                "Classes",
                "ClassFields",
                "PrivateFields",
                "StaticBlocks",
                "Generators",
                "AsyncFunctions",
                "AsyncGenerators",
                "AwaitExpression",
                "YieldExpression",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-neutral-100 mb-3">Modern Operators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "OptionalChaining",
                "NullishCoalescing",
                "LogicalAssignment",
                "ExponentiationOperator",
              ].map((f) => (
                <code key={f} className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm">
                  {f}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Using with Presets</h2>
        <p className="text-neutral-300 mb-4">
          ECMAScript presets include feature control configured for their version. You can further
          restrict them:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

// ES2024 preset with loops disabled
const sandbox = createSandbox({
  env: "es2024",
  features: {
    mode: "blacklist",
    disable: [
      "ForStatement",
      "WhileStatement",
      "DoWhileStatement",
    ],
  },
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Example Use Cases</h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Formula Evaluator (Math Only)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              A minimal sandbox for spreadsheet-style formulas:
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  features: {
    mode: "whitelist",
    enable: [
      "BinaryOperators",
      "UnaryOperators",
      "ConditionalExpression",
      "FunctionCalls",
      "MemberExpressions",
    ],
  },
  globals: {
    Math,
    SUM: (...nums) => nums.reduce((a, b) => a + b, 0),
    AVG: (...nums) => nums.reduce((a, b) => a + b, 0) / nums.length,
    IF: (cond, then, else_) => cond ? then : else_,
  },
});

sandbox.runSync("SUM(1, 2, 3) * 2"); // 12
sandbox.runSync("IF(A1 > 10, A1 * 0.9, A1)", {
  globals: { A1: 15 },
}); // 13.5`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Template Engine (No Loops)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Allow expressions but prevent potentially infinite loops:
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  features: {
    mode: "blacklist",
    disable: [
      "ForStatement",
      "ForInStatement",
      "ForOfStatement",
      "WhileStatement",
      "DoWhileStatement",
    ],
  },
  globals: {
    data: templateData,
    formatDate: (d) => new Date(d).toLocaleDateString(),
    formatCurrency: (n) => "$" + n.toFixed(2),
  },
});`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Learning Environment (ES5 Only)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Teach JavaScript basics without modern syntax:
            </p>
            <CodeBlock
              code={`import { createSandbox } from "nookjs";

// ES5 preset only enables pre-2015 features
const sandbox = createSandbox({ env: "es5" });

// These work
sandbox.runSync("var x = 5;");
sandbox.runSync("function add(a, b) { return a + b; }");

// These throw FeatureError
sandbox.runSync("let x = 5;");    // let not in ES5
sandbox.runSync("() => {}");       // arrows not in ES5
sandbox.runSync("class Foo {}");   // classes not in ES5`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Handling</h2>
        <p className="text-neutral-300 mb-4">
          When a disabled feature is used, a{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">FeatureError</code> is
          thrown:
        </p>
        <CodeBlock
          code={`import { createSandbox, FeatureError } from "nookjs";

const sandbox = createSandbox({
  features: {
    mode: "whitelist",
    enable: ["BinaryOperators"],
  },
});

try {
  sandbox.runSync("for (let i = 0; i < 10; i++) {}");
} catch (error) {
  if (error instanceof FeatureError) {
    console.log(error.feature);  // "ForStatement"
    console.log(error.message);  // "Feature 'ForStatement' is not enabled"
  }
}`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/globals"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Global Injection
        </Link>
        <Link
          to="/docs/api/interpreter"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          API Reference &rarr;
        </Link>
      </div>
    </article>
  );
}
