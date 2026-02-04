import { CodeBlock } from "../../components/code-block";

export function QuickStart() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Quick Start</h1>
      <p className="text-xl text-neutral-300 mb-8">Get up and running with NookJS in minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Basic Evaluation</h2>
        <p className="text-neutral-300 mb-4">
          Use <code className="text-amber-400 bg-neutral-800 px-1 rounded">run()</code> for quick,
          one-off evaluations:
        </p>
        <CodeBlock
          code={`import { run } from "nookjs";

const value = await run("2 + 3 * 4");
console.log(value); // 14`}
        />
        <p className="text-neutral-300 mt-6 mb-4">
          For repeated evaluations, create a reusable sandbox:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({ env: "es2022" });

const result = await sandbox.run(
  "let sum = 0; for (let i = 0; i < 5; i++) { sum += i; } sum"
);

console.log(result); // 10`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Presets and APIs</h2>
        <p className="text-neutral-300 mb-4">Choose an environment preset and add optional APIs:</p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2022",
  apis: ["fetch", "console"],
});

await sandbox.run(
  "console.log(await (await fetch('https://example.com')).status)"
);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Injecting Globals</h2>
        <p className="text-neutral-300 mb-4">Pass host functions and data into the sandbox:</p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2022",
  globals: {
    PI: 3.14159,
    log: (msg) => console.log("[sandbox]", msg),
    calculateArea: (radius) => PI * radius * radius,
    config: { debug: true, maxItems: 100 },
  },
});

await sandbox.run(
  "log('Area: ' + calculateArea(5)); config.debug"
);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Async Code</h2>
        <p className="text-neutral-300 mb-4">Use async/await with `run()`:</p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2022",
  globals: {
    fetchUser: async (id) => ({ id, name: "John Doe" }),
  },
});

const name = await sandbox.run(
  "const user = await fetchUser(123); user.name"
);

console.log(name); // "John Doe"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Handling</h2>
        <p className="text-neutral-300 mb-4">Catch and handle errors from sandbox code:</p>
        <CodeBlock
          code={`import { run, ParseError, RuntimeError, SecurityError } from "nookjs";

try {
  await run(userProvidedCode);
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Syntax error:", error.message);
  } else if (error instanceof SecurityError) {
    console.error("Security violation:", error.message);
  } else if (error instanceof RuntimeError) {
    console.error("Runtime error:", error.message);
  } else {
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
          code={`const sandbox = createSandbox({ env: "es2022" });

const result = await sandbox.run(
  "interface User { name: string; } const user: User = { name: 'Alice' }; user.name"
);

console.log(result); // "Alice"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Complete Example</h2>
        <p className="text-neutral-300 mb-4">A typical usage pattern:</p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  apis: ["console"],
  globals: {
    calculateDiscount: (price, percent) => price * (1 - percent / 100),
  },
  limits: { perRun: { loops: 100_000 } },
});

const result = await sandbox.run(
  "const price = 100; calculateDiscount(price, 20)"
);

console.log(result); // 80`}
        />
      </section>
    </article>
  );
}
