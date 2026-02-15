import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Presets() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Presets</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Configure the sandbox with pre-built ECMAScript versions and API addons.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Overview
        </h2>
        <p className="text-neutral-300 mb-4">
          Presets power the simplified API. Choose an{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            env
          </code>{" "}
          for the language version and add{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            apis
          </code>{" "}
          for extra globals. For advanced preset composition, see{" "}
          <Link
            to="/docs/api/interpreter"
            className="text-amber-400 hover:text-amber-300"
          >
            Internal Classes
          </Link>
          .
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

// Combine presets and custom options
const sandbox = createSandbox({
  env: "es2024",
  apis: ["console", "fetch"],
  globals: { myHelper: (x) => x * 2 },
});

await sandbox.run("console.log(myHelper(3))");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Simplified Usage
        </h2>
        <p className="text-neutral-300 mb-4">
          For most projects, the simplified API is easier to use. It maps
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            env
          </code>{" "}
          to ECMAScript presets and{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            apis
          </code>{" "}
          to addon presets.
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  apis: ["fetch", "console"],
});

await sandbox.run(
  "async function run() { console.log(await (await fetch('https://example.com')).status); } run();"
);`}
        />
        <p className="text-neutral-300 mt-4">
          Use{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            preset()
          </code>{" "}
          directly when you need advanced merging behavior.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          ECMAScript Version Presets
        </h2>
        <p className="text-neutral-300 mb-4">
          These presets configure the sandbox for specific ECMAScript versions
          by whitelisting appropriate language features and providing
          era-appropriate globals.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Preset</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Year</th>
                <th className="text-left py-2 text-neutral-300">
                  Key Features Added
                </th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES5</code>
                </td>
                <td className="py-2 pr-4">2009</td>
                <td className="py-2">
                  var, functions, for/while loops, objects/arrays
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2015</code> /{" "}
                  <code className="text-amber-400">ES6</code>
                </td>
                <td className="py-2 pr-4">2015</td>
                <td className="py-2">
                  let/const, arrow functions, classes, Promises, generators,
                  template literals
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2016</code>
                </td>
                <td className="py-2 pr-4">2016</td>
                <td className="py-2">Exponentiation operator (**)</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2017</code>
                </td>
                <td className="py-2 pr-4">2017</td>
                <td className="py-2">async/await</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2018</code>
                </td>
                <td className="py-2 pr-4">2018</td>
                <td className="py-2">
                  Async generators, rest/spread properties
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2019</code>
                </td>
                <td className="py-2 pr-4">2019</td>
                <td className="py-2">Optional catch binding</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2020</code>
                </td>
                <td className="py-2 pr-4">2020</td>
                <td className="py-2">
                  Optional chaining (?.), nullish coalescing (??), BigInt
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2021</code>
                </td>
                <td className="py-2 pr-4">2021</td>
                <td className="py-2">
                  Logical assignment operators (&&=, ||=, ??=)
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2022</code>
                </td>
                <td className="py-2 pr-4">2022</td>
                <td className="py-2">
                  Class fields, private fields (#), static blocks
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2023</code>
                </td>
                <td className="py-2 pr-4">2023</td>
                <td className="py-2">
                  Array findLast, toReversed, toSorted, toSpliced
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2024</code>
                </td>
                <td className="py-2 pr-4">2024</td>
                <td className="py-2">
                  Promise.withResolvers, ArrayBuffer transfer
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ESNext</code>
                </td>
                <td className="py-2 pr-4">-</td>
                <td className="py-2">All features enabled, no restrictions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Included Globals
        </h2>
        <p className="text-neutral-300 mb-4">
          ECMAScript presets include built-in globals appropriate for their
          version:
        </p>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">
          ES5+ Globals
        </h3>
        <p className="text-neutral-400 text-sm mb-4">
          Included in all presets:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {[
            "Array",
            "Object",
            "String",
            "Number",
            "Boolean",
            "Date",
            "Math",
            "JSON",
            "Error",
            "TypeError",
            "ReferenceError",
            "SyntaxError",
            "RangeError",
            "parseInt",
            "parseFloat",
            "isNaN",
            "isFinite",
            "encodeURI",
            "decodeURI",
          ].map((g) => (
            <code
              key={g}
              className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm text-center"
            >
              {g}
            </code>
          ))}
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">
          ES2015+ Globals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {["Promise", "Symbol", "Map", "Set", "WeakMap", "WeakSet"].map(
            (g) => (
              <code
                key={g}
                className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm text-center"
              >
                {g}
              </code>
            ),
          )}
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">
          ES2020+ Globals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {["BigInt", "globalThis"].map((g) => (
            <code
              key={g}
              className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm text-center"
            >
              {g}
            </code>
          ))}
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">
          ES2021+ Globals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {["WeakRef", "FinalizationRegistry"].map((g) => (
            <code
              key={g}
              className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm text-center"
            >
              {g}
            </code>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          API Addon Presets
        </h2>
        <p className="text-neutral-300 mb-4">
          Addon presets provide access to specific Web/Runtime APIs. They only
          add globals and don't modify feature control.
        </p>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              FetchAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides the Fetch API for making HTTP requests. Requires
              async/await (ES2017+).
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: fetch, Request, Response, Headers, AbortController,
              AbortSignal, URL, URLSearchParams
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["fetch"],
});

await sandbox.run(\`
  async function run() {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
  }
  run();
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              ConsoleAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides console methods for logging.
            </p>
            <p className="text-neutral-500 text-xs mb-3">Includes: console</p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["console"],
});

sandbox.runSync(\`
  console.log('Hello, world!');
  console.error('Something went wrong');
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              TimersAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides timer functions. Note: These are async operations.
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: setTimeout, clearTimeout, setInterval, clearInterval
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["timers", "console"],
});

await sandbox.run(\`
  async function run() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('1 second later');
  }
  run();
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              TextCodecAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides text encoding/decoding utilities.
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: TextEncoder, TextDecoder
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["textcodec"],
});

sandbox.runSync(\`
  const encoder = new TextEncoder();
  const bytes = encoder.encode('Hello');
  // bytes is Uint8Array [72, 101, 108, 108, 111]
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              BufferAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides binary data handling with ArrayBuffer, DataView, and
              typed arrays.
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: ArrayBuffer, DataView, Int8Array, Uint8Array,
              Float32Array, etc.
            </p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["buffer"],
});

sandbox.runSync(\`
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, 42);
  const arr = new Uint8Array(buffer);
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              RegExpAPI
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides regular expression functionality.
            </p>
            <p className="text-neutral-500 text-xs mb-3">Includes: RegExp</p>
            <CodeBlock
              code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["regexp"],
});

sandbox.runSync(\`
  const pattern = new RegExp('hello', 'i');
  pattern.test('Hello World'); // true
\`);`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Composing Presets
        </h2>
        <p className="text-neutral-300 mb-4">
          Combine an{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            env
          </code>{" "}
          preset with one or more{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            apis
          </code>
          , then layer your own policy and globals. For internal preset merging,
          see{" "}
          <Link
            to="/docs/api/interpreter"
            className="text-amber-400 hover:text-amber-300"
          >
            Internal Classes
          </Link>
          .
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2024",
  apis: ["fetch", "console"],
  policy: { errors: "sanitize" },
  globals: { myHelper: (x) => x * 2 },
});

await sandbox.run("console.log(myHelper(2))");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Creating Custom Presets
        </h2>
        <p className="text-neutral-300 mb-4">
          Create your own presets by composing globals and feature toggles:
        </p>
        <CodeBlock
          code={`const sandbox = createSandbox({
  env: "es2024",
  globals: {
    sum: (...nums: number[]) => nums.reduce((a, b) => a + b, 0),
    avg: (...nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length,
    clamp: (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max),
  },
  features: {
    mode: "whitelist",
    enable: [
      "VariableDeclarations",
      "BinaryOperators",
      "UnaryOperators",
      "FunctionCalls",
    ],
  },
});

sandbox.runSync("sum(1, 2, 3)"); // 6`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/security"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Security Model
        </Link>
        <Link
          to="/docs/globals"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Global Injection &rarr;
        </Link>
      </div>
    </article>
  );
}
