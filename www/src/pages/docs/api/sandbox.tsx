import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function SandboxAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Sandbox API</h1>
      <p className="text-xl text-neutral-300 mb-8">
        A simplified, ergonomic API built on top of the Interpreter. Use it for most integrations.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Quick Example</h2>
        <CodeBlock
          code={`import { createSandbox, run } from "nookjs";

// One-off evaluation
const value = await run("2 + 3 * 4");

// Reusable sandbox
const sandbox = createSandbox({
  env: "es2022",
  apis: ["console"],
  globals: { PI: 3.14159 },
});

const result = await sandbox.run("PI * 2");
console.log(result); // 6.28318`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">createSandbox()</h2>
        <CodeBlock code={`createSandbox(options?: SandboxOptions)`} />
        <p className="text-neutral-300 mt-4 mb-4">
          Builds a reusable sandbox with intuitive options for language presets, API add-ons,
          globals, and limits.
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2022",
  apis: ["fetch", "console"],
  globals: { VERSION: "1.0.0" },
  limits: {
    perRun: { loops: 1_000_000, callDepth: 200 },
    total: { evaluations: 100, memoryBytes: 50 * 1024 * 1024 },
  },
  policy: { errors: "safe" },
});`}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">env</h3>
            <p className="text-sm text-neutral-400">
              Language preset: "minimal", "es2022", "esnext", "browser", "node", "wintercg".
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">apis</h3>
            <p className="text-sm text-neutral-400">
              Add-on globals: "fetch", "console", "timers", "text", "crypto", "streams", "blob".
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">features</h3>
            <p className="text-sm text-neutral-400">
              Enable/disable language features without building full featureControl lists.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">limits</h3>
            <p className="text-sm text-neutral-400">
              Guard per-run execution and cumulative usage. Total limits enable resource tracking.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">run() and runSync()</h2>
        <p className="text-neutral-300 mb-4">
          Execute code and optionally return stats/resources with
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">result: "full"</code>.
        </p>
        <CodeBlock
          code={`const output = await sandbox.run("1 + 2", { result: "full" });

console.log(output.value);     // 3
console.log(output.stats);     // ExecutionStats
console.log(output.resources); // ResourceStats (when tracking enabled)`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">parse()</h2>
        <p className="text-neutral-300 mb-4">Parse code without executing it.</p>
        <CodeBlock
          code={`import { parse } from "nookjs";

const ast = parse("const x = 1 + 2;");
console.log(ast.type); // Program`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Modules</h2>
        <p className="text-neutral-300 mb-4">
          Provide module sources directly, or use a custom resolver for advanced use cases.
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
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
  'import { add } from "math.js"; export const result = add(1, 2);',
  { path: "main.js" },
);

console.log(exports.result); // 3`}
        />
        <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded mt-6">
          <h4 className="text-amber-400 font-medium mb-2">Top-level await</h4>
          <p className="text-neutral-300 text-sm">
            Top-level <code className="text-amber-400">await</code> is only supported in module
            evaluation (use <code className="text-amber-400">runModule()</code>). Script evaluation
            via <code className="text-amber-400">run()</code> only allows
            <code className="text-amber-400">await</code> inside async functions.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Advanced Usage</h2>
        <p className="text-neutral-300">
          Need fine-grained control? Use the
          <Link
            to="/docs/api/interpreter"
            className="text-amber-500 hover:text-amber-400 underline"
          >
            {" "}
            Interpreter API
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
