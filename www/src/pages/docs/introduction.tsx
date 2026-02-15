import { Link } from "react-router";

import { Button } from "../../components/button";
import { CodeBlock } from "../../components/code-block";

export function Introduction() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">
        Nook<span className="text-amber-500">JS</span>
      </h1>
      <p className="text-xl text-neutral-300 mb-8">
        A fast, secure JavaScript/TypeScript interpreter for safely executing
        untrusted code in a sandboxed environment.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          What is NookJS?
        </h2>
        <p className="text-neutral-300 mb-4">
          NookJS is a JavaScript interpreter designed for safely executing
          untrusted code. It parses and evaluates JavaScript (with
          TypeScript-style type annotations stripped) while providing strong
          security guarantees through complete sandbox isolation.
        </p>
        <p className="text-neutral-300 mb-4">
          Unlike{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            eval()
          </code>{" "}
          or the{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            Function
          </code>{" "}
          constructor, NookJS executes code in a fully isolated environment with
          no access to the host's global scope, prototypes, or dangerous APIs.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Key Features
        </h2>
        <ul className="space-y-4 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">Sandbox Isolation</strong> -
              Complete isolation from the host environment with no access to{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                eval
              </code>
              ,{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                Function
              </code>
              ,{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                globalThis
              </code>
              , or native prototypes
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">Feature Control</strong> -
              Fine-grained whitelisting of language features using ECMAScript
              version presets (ES5 through ES2024)
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">Global Injection</strong> -
              Safely inject host functions and data with automatic property
              access protection
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">Resource Tracking</strong> -
              Monitor and limit memory usage, loop iterations, function calls,
              and CPU time
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">TypeScript Support</strong> -
              Type annotations are automatically stripped at parse time
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500 shrink-0">&#9632;</span>
            <div>
              <strong className="text-neutral-100">Zero Dependencies</strong> -
              Custom AST parser with no runtime dependencies
            </div>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Use Cases
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Plugin Systems
            </h3>
            <p className="text-neutral-400 text-sm">
              Allow users to write custom logic for your application without
              compromising security.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Formula Evaluation
            </h3>
            <p className="text-neutral-400 text-sm">
              Safely evaluate user-defined expressions and calculations in
              spreadsheets or form builders.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Educational Tools
            </h3>
            <p className="text-neutral-400 text-sm">
              Teach JavaScript in a safe, controlled environment where students
              can't break out of the sandbox.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Rule Engines
            </h3>
            <p className="text-neutral-400 text-sm">
              Run business rules and automation logic written by non-developers
              in a controlled environment.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Quick Example
        </h2>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  apis: ["console"],
  globals: {
    calculateDiscount: (price, percent) => price * (1 - percent / 100),
  },
});

// Execute user-provided code safely
const result = await sandbox.run(\`
  const price = 100;
  const discount = calculateDiscount(price, 20);
  console.log("Discounted price:", discount);
  discount
\`);

console.log(result); // 80`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Try It Out
        </h2>
        <p className="text-neutral-300 mb-4">
          Head to the{" "}
          <Link
            to="/"
            className="text-amber-500 hover:text-amber-400 underline"
          >
            Playground
          </Link>{" "}
          to experiment with NookJS in your browser, or continue to the{" "}
          <Link
            to="/docs/installation"
            className="text-amber-500 hover:text-amber-400 underline"
          >
            Installation
          </Link>{" "}
          guide to add it to your project.
        </p>
      </section>

      <div className="flex gap-4 pt-8 border-t border-neutral-800">
        <Button as="link" to="/docs/installation">
          Get Started
        </Button>
        <Button
          as="anchor"
          href="https://github.com/samlaycock/nookjs"
          target="_blank"
          rel="noreferrer"
          variant="secondary"
        >
          View on GitHub
        </Button>
      </div>
    </article>
  );
}
