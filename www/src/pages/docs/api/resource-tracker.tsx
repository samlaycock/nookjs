import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function ResourceTrackerAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Resource Tracker</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Monitor and limit cumulative resource usage across multiple evaluations.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Overview</h2>
        <p className="text-neutral-300 mb-4">
          The <code className="text-amber-400 bg-neutral-800 px-1 rounded">ResourceTracker</code>{" "}
          class enables monitoring of resource consumption across multiple{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">evaluate()</code> calls. This
          is essential for multi-tenant environments where you need to track and limit cumulative
          usage.
        </p>
        <p className="text-neutral-300 mb-4">Unlike per-call limits, the ResourceTracker:</p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Tracks aggregate resource usage across the interpreter's lifetime</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Provides detailed statistics and history</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Supports billing, rate-limiting, and fairness enforcement</span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Quick Start</h2>
        <CodeBlock
          code={`import { Interpreter, ResourceTracker, ES2024, preset } from "nookjs";

// Create a tracker with limits
const tracker = new ResourceTracker({
  limits: {
    maxTotalMemory: 100 * 1024 * 1024,  // 100 MB cumulative
    maxTotalIterations: 1000000,         // 1M total loop iterations
    maxFunctionCalls: 10000,             // 10K function calls
    maxCpuTime: 30000,                   // 30 seconds cumulative
    maxEvaluations: 100,                 // 100 evaluations
  },
});

// Create interpreter with tracker
const interpreter = new Interpreter(
  preset(ES2024, {
    globals: { console },
    resourceTracker: tracker,
  })
);

// Run code - resources are tracked
interpreter.evaluate("const arr = Array(1000).fill(0)");
interpreter.evaluate("for (let i = 0; i < 10000; i++) {}");

// Check stats
const stats = tracker.getStats();
console.log(\`Memory: \${stats.memoryBytes} bytes\`);
console.log(\`Iterations: \${stats.iterations}\`);
console.log(\`Evaluations: \${stats.evaluations}\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Constructor</h2>
        <CodeBlock code={`new ResourceTracker(options?: ResourceTrackerOptions)`} />

        <h3 className="text-xl font-medium text-neutral-100 mb-3 mt-6">Options</h3>
        <CodeBlock
          code={`interface ResourceTrackerOptions {
  // Resource limits (all optional)
  limits?: ResourceLimits;

  // Number of past evaluations to track (default: 100, 0 to disable)
  historySize?: number;
}

interface ResourceLimits {
  maxTotalMemory?: number;      // bytes
  maxTotalIterations?: number;  // loop iterations
  maxFunctionCalls?: number;    // total function invocations
  maxCpuTime?: number;          // milliseconds (best-effort)
  maxEvaluations?: number;      // number of evaluate() calls
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Methods</h2>

        <div className="space-y-8">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">getStats()</h3>
            <p className="text-neutral-400 text-sm mb-3">Returns current resource statistics.</p>
            <CodeBlock
              code={`const stats = tracker.getStats();

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
            <h3 className="text-lg font-medium text-neutral-100 mb-2">isExhausted()</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Returns true if any resource limit has been exceeded.
            </p>
            <CodeBlock
              code={`if (tracker.isExhausted()) {
  console.log("Resource limit exceeded");
  // Reject further evaluations
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">getExhaustedLimit()</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Returns the key of the exhausted limit, or null if none exceeded.
            </p>
            <CodeBlock
              code={`const exhausted = tracker.getExhaustedLimit();
if (exhausted) {
  console.log(\`Limit exceeded: \${exhausted}\`);
  // e.g., "maxTotalMemory", "maxEvaluations"
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">reset()</h3>
            <p className="text-neutral-400 text-sm mb-3">Clears all statistics and history.</p>
            <CodeBlock
              code={`// Reset at the start of each billing cycle
setInterval(() => {
  tracker.reset();
}, 24 * 60 * 60 * 1000); // Daily reset`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">getHistory()</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Returns array of past evaluation statistics.
            </p>
            <CodeBlock
              code={`const history = tracker.getHistory();
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
              getLimit(key) / setLimit(key, value)
            </h3>
            <p className="text-neutral-400 text-sm mb-3">
              Get or update specific limits dynamically.
            </p>
            <CodeBlock
              code={`// Check current limit
const memLimit = tracker.getLimit("maxTotalMemory");

// Increase limit for premium users
if (user.isPremium) {
  tracker.setLimit("maxTotalMemory", 500 * 1024 * 1024);
  tracker.setLimit("maxEvaluations", 1000);
}`}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Handling</h2>
        <p className="text-neutral-300 mb-4">
          When a limit is exceeded, a{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">ResourceExhaustedError</code>{" "}
          is thrown:
        </p>
        <CodeBlock
          code={`import { ResourceExhaustedError } from "nookjs";

try {
  interpreter.evaluate(code);
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(\`Resource limit exceeded: \${error.resourceType}\`);
    console.log(\`Used: \${error.used}, Limit: \${error.limit}\`);

    // Log for billing/monitoring
    await logResourceExhaustion(userId, {
      type: error.resourceType,
      used: error.used,
      limit: error.limit,
    });
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Use Cases</h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">Plugin Systems</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Track resource usage per plugin to enforce fair allocation:
            </p>
            <CodeBlock
              code={`// Each plugin gets its own tracker
const plugins = new Map();

function createPluginInterpreter(pluginId: string) {
  const tracker = new ResourceTracker({
    limits: {
      maxTotalMemory: 50 * 1024 * 1024, // 50 MB per plugin
      maxEvaluations: 1000,
    },
  });

  plugins.set(pluginId, tracker);

  return new Interpreter(
    preset(ES2024, { resourceTracker: tracker })
  );
}

// Check plugin resource usage
function getPluginUsage(pluginId: string) {
  return plugins.get(pluginId)?.getStats();
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">Rate Limiting</h3>
            <p className="text-neutral-400 text-sm mb-3">Implement token-bucket style limits:</p>
            <CodeBlock
              code={`class UserSandbox {
  private tracker: ResourceTracker;
  private interpreter: Interpreter;

  constructor(userId: string, tier: "free" | "pro") {
    const limits = tier === "pro"
      ? { maxEvaluations: 10000, maxTotalMemory: 500 * 1024 * 1024 }
      : { maxEvaluations: 100, maxTotalMemory: 50 * 1024 * 1024 };

    this.tracker = new ResourceTracker({ limits });
    this.interpreter = new Interpreter(
      preset(ES2024, { resourceTracker: this.tracker })
    );
  }

  evaluate(code: string) {
    if (this.tracker.isExhausted()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    return this.interpreter.evaluate(code);
  }

  // Reset limits at the start of each day
  resetDailyLimits() {
    this.tracker.reset();
  }
}`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">Monitoring Dashboard</h3>
            <p className="text-neutral-400 text-sm mb-3">Expose stats for monitoring:</p>
            <CodeBlock
              code={`// API endpoint for monitoring
app.get("/api/sandbox/:userId/stats", (req, res) => {
  const tracker = getUserTracker(req.params.userId);
  if (!tracker) {
    return res.status(404).json({ error: "User not found" });
  }

  const stats = tracker.getStats();
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
    history: tracker.getHistory().slice(-10), // Last 10 evaluations
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
                <th className="text-left py-2 pr-4 text-neutral-300">Feature</th>
                <th className="text-left py-2 pr-4 text-neutral-300">Per-Evaluation</th>
                <th className="text-left py-2 text-neutral-300">ResourceTracker</th>
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
                  Detailed stats via <code className="text-amber-400">getStats()</code>
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
