import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function ResourceTrackerAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">
        Resource Tracking
      </h1>
      <p className="text-xl text-neutral-300 mb-8">
        Monitor and limit cumulative resource usage across multiple evaluations.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Overview
        </h2>
        <p className="text-neutral-300 mb-4">
          NookJS provides integrated resource tracking for monitoring resource
          consumption across multiple{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            evaluate()
          </code>{" "}
          calls. This is essential for multi-tenant environments where you need
          to track and limit cumulative usage.
        </p>
        <p className="text-neutral-300 mb-4">
          Enable tracking with{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            resourceTracking: true
          </code>{" "}
          when creating the Interpreter:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Tracks aggregate resource usage across the interpreter's lifetime
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Provides detailed statistics and history</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>
              Supports billing, rate-limiting, and fairness enforcement
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Quick Start
        </h2>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset, ResourceExhaustedError } from "nookjs";

// Create interpreter with resource tracking enabled
const interpreter = new Interpreter(
  preset(ES2024, {
    globals: { console },
    resourceTracking: true,
  })
);

// Set cumulative limits
interpreter.setResourceLimit("maxTotalMemory", 100 * 1024 * 1024); // 100 MB
interpreter.setResourceLimit("maxTotalIterations", 1000000); // 1M iterations
interpreter.setResourceLimit("maxFunctionCalls", 10000); // 10K calls
interpreter.setResourceLimit("maxEvaluations", 100); // 100 evaluations

// Run code - resources are tracked
try {
  interpreter.evaluate("const arr = Array(1000).fill(0)");
  interpreter.evaluate("for (let i = 0; i < 10000; i++) {}");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(\`Limit exceeded: \${error.resourceType}\`);
  }
}

// Check cumulative stats
const stats = interpreter.getResourceStats();
console.log(\`Memory: \${stats.memoryBytes} bytes\`);
console.log(\`Iterations: \${stats.iterations}\`);
console.log(\`Evaluations: \${stats.evaluations}\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Interpreter Methods
        </h2>
        <p className="text-neutral-300 mb-4">
          When{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            resourceTracking: true
          </code>{" "}
          is set, the Interpreter exposes these methods:
        </p>

        <div className="space-y-8">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              getResourceStats()
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Returns current cumulative resource statistics.
            </p>
            <CodeBlock
              code={`const stats = interpreter.getResourceStats();

console.log(stats);
/*
{
  memoryBytes: 24576,
  iterations: 10000,
  functionCalls: 3,
  cpuTimeMs: 15,
  evaluations: 2,
  peakMemoryBytes: 32768,
  largestEvaluation: {
    memory: 16384,
    iterations: 10000
  },
  isExhausted: false,
  limitStatus: {
    maxTotalMemory: { used: 24576, limit: 104857600, remaining: 104833024 },
    maxTotalIterations: { used: 10000, limit: 1000000, remaining: 990000 },
    // ...
  }
}
*/`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              resetResourceStats()
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Clears all statistics and history.
            </p>
            <CodeBlock
              code={`// Reset at the start of each billing cycle
setInterval(() => {
  interpreter.resetResourceStats();
}, 24 * 60 * 60 * 1000); // Daily reset`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              getResourceHistory()
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Returns array of past evaluation statistics.
            </p>
            <CodeBlock
              code={`const history = interpreter.getResourceHistory();
/*
[
  {
    timestamp: Date,
    memoryBytes: 1234,
    iterations: 500,
    functionCalls: 5,
    evaluationNumber: 1
  },
  // ...
]
*/`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              setResourceLimit(key, value) / getResourceLimit(key)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Get or set specific limits dynamically.
            </p>
            <CodeBlock
              code={`// Set limits
interpreter.setResourceLimit("maxTotalMemory", 100 * 1024 * 1024);
interpreter.setResourceLimit("maxEvaluations", 1000);

// Check current limit
const memLimit = interpreter.getResourceLimit("maxTotalMemory");

// Increase limit for premium users
if (user.isPremium) {
  interpreter.setResourceLimit("maxTotalMemory", 500 * 1024 * 1024);
}`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          ResourceLimits
        </h2>
        <p className="text-neutral-300 mb-4">Available limits you can set:</p>
        <CodeBlock
          code={`type ResourceLimits = {
  maxTotalMemory?: number;      // bytes (cumulative)
  maxTotalIterations?: number;  // loop iterations (cumulative)
  maxFunctionCalls?: number;    // total function invocations
  maxCpuTime?: number;          // milliseconds (best-effort)
  maxEvaluations?: number;      // number of evaluate() calls
};`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Error Handling
        </h2>
        <p className="text-neutral-300 mb-4">
          When a limit is exceeded, a{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            ResourceExhaustedError
          </code>{" "}
          is thrown:
        </p>
        <CodeBlock
          code={`import { Interpreter, ResourceExhaustedError } from "nookjs";

const interpreter = new Interpreter({ resourceTracking: true });
interpreter.setResourceLimit("maxEvaluations", 5);

try {
  for (let i = 0; i < 10; i++) {
    interpreter.evaluate("1 + 1");
  }
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(\`Resource limit exceeded: \${error.resourceType}\`);
    console.log(\`Used: \${error.used}, Limit: \${error.limit}\`);
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Use Cases
        </h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Plugin Systems
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Track resource usage per plugin to enforce fair allocation:
            </p>
            <CodeBlock
              code={`function createPluginInterpreter(pluginId: string, memoryLimit: number) {
  const interpreter = new Interpreter(
    preset(ES2024, {
      resourceTracking: true,
      globals: getPluginGlobals(pluginId),
    })
  );

  interpreter.setResourceLimit("maxTotalMemory", memoryLimit);
  interpreter.setResourceLimit("maxEvaluations", 1000);

  return interpreter;
}

const plugin1 = createPluginInterpreter("plugin1", 50 * 1024 * 1024);
const plugin2 = createPluginInterpreter("plugin2", 50 * 1024 * 1024);

plugin1.evaluate(pluginCode);
const stats = plugin1.getResourceStats();
console.log(\`Plugin memory: \${stats.memoryBytes} bytes\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Rate Limiting
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Implement evaluation-count-based rate limiting:
            </p>
            <CodeBlock
              code={`class RateLimitedSandbox {
  private interpreter: Interpreter;

  constructor(tier: "free" | "pro") {
    const evalLimit = tier === "pro" ? 10000 : 100;
    const memLimit = tier === "pro" ? 500 * 1024 * 1024 : 50 * 1024 * 1024;

    this.interpreter = new Interpreter(
      preset(ES2024, { resourceTracking: true })
    );

    this.interpreter.setResourceLimit("maxEvaluations", evalLimit);
    this.interpreter.setResourceLimit("maxTotalMemory", memLimit);
  }

  evaluate(code: string) {
    return this.interpreter.evaluate(code);
  }

  // Reset limits at the start of each day
  resetDailyLimits() {
    this.interpreter.resetResourceStats();
  }

  getUsage() {
    return this.interpreter.getResourceStats();
  }
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              Monitoring Dashboard
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Expose stats for monitoring:
            </p>
            <CodeBlock
              code={`// API endpoint for monitoring
app.get("/api/sandbox/:userId/stats", (req, res) => {
  const interpreter = getUserInterpreter(req.params.userId);
  if (!interpreter) {
    return res.status(404).json({ error: "User not found" });
  }

  const stats = interpreter.getResourceStats();
  res.json({
    usage: {
      memory: stats.memoryBytes,
      memoryPeak: stats.peakMemoryBytes,
      iterations: stats.iterations,
      functionCalls: stats.functionCalls,
      evaluations: stats.evaluations,
      cpuTime: stats.cpuTimeMs,
    },
    limits: stats.limitStatus,
    isExhausted: stats.isExhausted,
    history: interpreter.getResourceHistory().slice(-10),
  });
});`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Per-Evaluation vs Cumulative Limits
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-2 pr-4 text-neutral-300">
                  Feature
                </th>
                <th className="text-left py-2 pr-4 text-neutral-300">
                  Per-Evaluation
                </th>
                <th className="text-left py-2 text-neutral-300">
                  resourceTracking
                </th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Scope</td>
                <td className="py-2 pr-4">
                  Single <code className="text-amber-400">evaluate()</code> call
                </td>
                <td className="py-2">Across multiple calls</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Memory</td>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">maxMemory</code>
                </td>
                <td className="py-2">
                  <code className="text-amber-400">maxTotalMemory</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Loop iterations</td>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">maxLoopIterations</code>
                </td>
                <td className="py-2">
                  <code className="text-amber-400">maxTotalIterations</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Function calls</td>
                <td className="py-2 pr-4">Not available</td>
                <td className="py-2">
                  <code className="text-amber-400">maxFunctionCalls</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Statistics</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2">
                  Detailed stats via{" "}
                  <code className="text-amber-400">getResourceStats()</code>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Use case</td>
                <td className="py-2 pr-4">Prevent single runaway script</td>
                <td className="py-2">Multi-tenant resource accounting</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Standalone ResourceTracker
        </h2>
        <p className="text-neutral-300 mb-4">
          For advanced scenarios, NookJS also exports a standalone{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">
            ResourceTracker
          </code>{" "}
          class that can be used independently for custom resource accounting:
        </p>
        <CodeBlock
          code={`import { ResourceTracker } from "nookjs";

const tracker = new ResourceTracker({
  limits: {
    maxTotalMemory: 100 * 1024 * 1024,
    maxEvaluations: 100,
  },
  historySize: 50, // Keep last 50 evaluation records
});

// Check stats
const stats = tracker.getStats();

// Check if exhausted
if (tracker.isExhausted()) {
  const limit = tracker.getExhaustedLimit();
  console.log(\`Exhausted: \${limit}\`);
}

// Reset
tracker.reset();`}
        />
        <p className="text-neutral-400 text-sm mt-4">
          Note: The standalone ResourceTracker is not automatically integrated
          with the Interpreter. Use{" "}
          <code className="text-amber-400">resourceTracking: true</code> for
          automatic tracking during evaluation.
        </p>
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/api/errors"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Error Types
        </Link>
        <Link
          to="/docs/examples/basic"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Examples &rarr;
        </Link>
      </div>
    </article>
  );
}
