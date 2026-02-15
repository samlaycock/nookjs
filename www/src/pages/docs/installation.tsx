import { Link } from "react-router";

import { CodeBlock } from "../../components/code-block";

export function Installation() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Installation</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Install NookJS using your preferred package manager.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Package Managers
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">npm</h3>
            <CodeBlock code="npm install nookjs" language="bash" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">yarn</h3>
            <CodeBlock code="yarn add nookjs" language="bash" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">pnpm</h3>
            <CodeBlock code="pnpm add nookjs" language="bash" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">bun</h3>
            <CodeBlock code="bun add nookjs" language="bash" />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Requirements
        </h2>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Node.js 18.0.0 or higher (for Node.js environments)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Modern browser with ES2020 support (for browser environments)
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Module Formats
        </h2>
        <p className="text-neutral-300 mb-4">
          NookJS is distributed in multiple module formats to support various
          environments:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">ESM</strong> -{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                dist/index.mjs
              </code>{" "}
              (recommended)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">CommonJS</strong> -{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                dist/index.js
              </code>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              <strong className="text-neutral-100">TypeScript</strong> -{" "}
              <code className="text-amber-400 bg-neutral-800 px-1 rounded">
                dist/index.d.ts
              </code>{" "}
              (type definitions included)
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Basic Import
        </h2>
        <p className="text-neutral-300 mb-4">
          Import the core classes and presets you need:
        </p>
        <CodeBlock
          code={`// ESM (recommended)
import { createSandbox, run, parse } from "nookjs";

// CommonJS
const { createSandbox, run, parse } = require("nookjs");`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Available Exports
        </h2>
        <p className="text-neutral-300 mb-4">NookJS exports the following:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">Export</th>
                <th className="text-left py-2 text-neutral-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">createSandbox</code>
                </td>
                <td className="py-2">Simplified sandbox builder</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">run</code>
                </td>
                <td className="py-2">One-off evaluation helper</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">parse</code>
                </td>
                <td className="py-2">Parse code without executing</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">Interpreter</code>
                </td>
                <td className="py-2">Internal interpreter class (advanced)</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">preset</code>
                </td>
                <td className="py-2">Function to combine presets</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ES5</code> -{" "}
                  <code className="text-amber-400">ES2024</code>
                </td>
                <td className="py-2">ECMAScript version presets</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ESNext</code>
                </td>
                <td className="py-2">All features enabled</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ResourceTracker</code>
                </td>
                <td className="py-2">Resource monitoring class</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">InterpreterError</code>
                </td>
                <td className="py-2">Base error class</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ParseError</code>
                </td>
                <td className="py-2">Parse-time error class</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">RuntimeError</code>
                </td>
                <td className="py-2">Runtime error class</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">
                  <code className="text-amber-400">SecurityError</code>
                </td>
                <td className="py-2">Security violation error class</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">ResourceExhaustedError</code>
                </td>
                <td className="py-2">Resource limit exceeded error class</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Introduction
        </Link>
        <Link
          to="/docs/quick-start"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Quick Start &rarr;
        </Link>
      </div>
    </article>
  );
}
