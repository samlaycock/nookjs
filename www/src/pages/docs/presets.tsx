import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Presets() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Presets</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Configure the interpreter with pre-built ECMAScript versions and API addons.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Overview</h2>
        <p className="text-neutral-300 mb-4">
          Presets provide pre-configured{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">InterpreterOptions</code> for
          common use cases. Use the{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">preset()</code> function to
          combine multiple presets and add your own customizations.
        </p>
        <CodeBlock
          code={`import { Interpreter, preset, ES2024, ConsoleAPI, FetchAPI } from "nookjs";

// Combine presets and custom options
const interpreter = new Interpreter(
  preset(
    ES2024,           // ECMAScript version
    ConsoleAPI,       // Add console.log
    FetchAPI,         // Add fetch API
    {                 // Custom options
      globals: { myHelper: (x) => x * 2 },
    }
  )
);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">ECMAScript Version Presets</h2>
        <p className="text-neutral-300 mb-4">
          These presets configure the interpreter for specific ECMAScript versions by whitelisting
          appropriate language features and providing era-appropriate globals.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Preset</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Year</th>
                <th className="text-left py-2 text-neutral-300">Key Features Added</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES5</code>
                </td>
                <td className="py-2 pr-4">2009</td>
                <td className="py-2">var, functions, for/while loops, objects/arrays</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2015</code> /{" "}
                  <code className="text-amber-400">ES6</code>
                </td>
                <td className="py-2 pr-4">2015</td>
                <td className="py-2">
                  let/const, arrow functions, classes, Promises, generators, template literals
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
                <td className="py-2">Async generators, rest/spread properties</td>
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
                <td className="py-2">Optional chaining (?.), nullish coalescing (??), BigInt</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2021</code>
                </td>
                <td className="py-2 pr-4">2021</td>
                <td className="py-2">Logical assignment operators (&&=, ||=, ??=)</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2022</code>
                </td>
                <td className="py-2 pr-4">2022</td>
                <td className="py-2">Class fields, private fields (#), static blocks</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2023</code>
                </td>
                <td className="py-2 pr-4">2023</td>
                <td className="py-2">Array findLast, toReversed, toSorted, toSpliced</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES2024</code>
                </td>
                <td className="py-2 pr-4">2024</td>
                <td className="py-2">Promise.withResolvers, ArrayBuffer transfer</td>
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Included Globals</h2>
        <p className="text-neutral-300 mb-4">
          ECMAScript presets include built-in globals appropriate for their version:
        </p>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">ES5+ Globals</h3>
        <p className="text-neutral-400 text-sm mb-4">Included in all presets:</p>
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

        <h3 className="text-xl font-medium text-neutral-100 mb-3">ES2015+ Globals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {["Promise", "Symbol", "Map", "Set", "WeakMap", "WeakSet"].map((g) => (
            <code
              key={g}
              className="text-amber-400 bg-neutral-800 px-2 py-1 rounded text-sm text-center"
            >
              {g}
            </code>
          ))}
        </div>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">ES2020+ Globals</h3>
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

        <h3 className="text-xl font-medium text-neutral-100 mb-3">ES2021+ Globals</h3>
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">API Addon Presets</h2>
        <p className="text-neutral-300 mb-4">
          Addon presets provide access to specific Web/Runtime APIs. They only add globals and don't
          modify feature control.
        </p>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">FetchAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides the Fetch API for making HTTP requests. Requires async/await (ES2017+).
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: fetch, Request, Response, Headers, AbortController, AbortSignal, URL,
              URLSearchParams
            </p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, FetchAPI));

await interpreter.evaluateAsync(\`
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">ConsoleAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">Provides console methods for logging.</p>
            <p className="text-neutral-500 text-xs mb-3">Includes: console</p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, ConsoleAPI));

interpreter.evaluate(\`
  console.log('Hello, world!');
  console.error('Something went wrong');
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">TimersAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides timer functions. Note: These are async operations.
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: setTimeout, clearTimeout, setInterval, clearInterval
            </p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, TimersAPI));

await interpreter.evaluateAsync(\`
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('1 second later');
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">TextCodecAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides text encoding/decoding utilities.
            </p>
            <p className="text-neutral-500 text-xs mb-3">Includes: TextEncoder, TextDecoder</p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, TextCodecAPI));

interpreter.evaluate(\`
  const encoder = new TextEncoder();
  const bytes = encoder.encode('Hello');
  // bytes is Uint8Array [72, 101, 108, 108, 111]
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">BufferAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides binary data handling with ArrayBuffer, DataView, and typed arrays.
            </p>
            <p className="text-neutral-500 text-xs mb-3">
              Includes: ArrayBuffer, DataView, Int8Array, Uint8Array, Float32Array, etc.
            </p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, BufferAPI));

interpreter.evaluate(\`
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, 42);
  const arr = new Uint8Array(buffer);
\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">RegExpAPI</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Provides regular expression functionality.
            </p>
            <p className="text-neutral-500 text-xs mb-3">Includes: RegExp</p>
            <CodeBlock
              code={`const interpreter = new Interpreter(preset(ES2024, RegExpAPI));

interpreter.evaluate(\`
  const pattern = new RegExp('hello', 'i');
  pattern.test('Hello World'); // true
\`);`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">The preset() Function</h2>
        <p className="text-neutral-300 mb-4">
          The <code className="text-amber-400 bg-neutral-800 px-1 rounded">preset()</code> function
          combines multiple presets and option overrides into a single configuration.
        </p>

        <h3 className="text-xl font-medium text-neutral-100 mb-3">Merging Behavior</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Property</th>
                <th className="text-left py-2 text-neutral-300">Merge Strategy</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">globals</code>
                </td>
                <td className="py-2">Shallow merge, later presets override earlier</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">featureControl</code>
                </td>
                <td className="py-2">Features are unioned</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">security</code>
                </td>
                <td className="py-2">Shallow merge, later presets override earlier</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">validator</code>
                </td>
                <td className="py-2">Last one wins</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock
          code={`import { preset, ES2024, FetchAPI, ConsoleAPI } from "nookjs";

// Combine multiple presets
const opts = preset(ES2024, FetchAPI, ConsoleAPI);

// Add custom security settings
const opts = preset(ES2024, FetchAPI, {
  security: { hideHostErrorMessages: false },
});

// Add custom globals
const opts = preset(ES2024, {
  globals: { myHelper: (x) => x * 2 },
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Creating Custom Presets</h2>
        <p className="text-neutral-300 mb-4">
          Create your own presets by defining an{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">InterpreterOptions</code>{" "}
          object:
        </p>
        <CodeBlock
          code={`import { Interpreter, preset, ES2024, InterpreterOptions } from "nookjs";

// Custom addon preset with helpers
const MathHelpers: InterpreterOptions = {
  globals: {
    sum: (...nums: number[]) => nums.reduce((a, b) => a + b, 0),
    avg: (...nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length,
    clamp: (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max),
  },
};

// Restrictive preset for math-only operations
const MathOnly: InterpreterOptions = {
  featureControl: {
    mode: "whitelist",
    features: [
      "VariableDeclarations",
      "BinaryOperators",
      "UnaryOperators",
      "FunctionCalls",
    ],
  },
  globals: {
    Math,
  },
};

// Use custom presets
const interpreter = new Interpreter(
  preset(ES2024, MathHelpers)
);`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/security"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Security Model
        </Link>
        <Link to="/docs/globals" className="text-amber-500 hover:text-amber-400 transition-colors">
          Global Injection &rarr;
        </Link>
      </div>
    </article>
  );
}
