import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function ResourceTrackerAPI() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Resource Tracking</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Monitor and limit cumulative resource usage across multiple evaluations.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Overview</h2>
        <p className="text-neutral-300 mb-4">
          NookJS provides integrated resource tracking for monitoring resource consumption across
          multiple <code className="text-amber-400 bg-neutral-800 px-1 rounded">run()</code> calls.
          This is essential for multi-tenant environments where you need to track and limit
          cumulative usage.
        </p>
        <p className="text-neutral-300 mb-4">
          Enable tracking with{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">trackResources: true</code>{" "}
          (or any total limits) when creating the sandbox:
        </p>
        <ul className="space-y-2 text-neutral-300">
          <li className="flex gap-3">
            <span className="text-amber-500">&#9632;</span>
            <span>Tracks aggregate resource usage across the sandbox's lifetime</span>
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Simplified API</h2>
        <p className="text-neutral-300 mb-4">
          When using <code className="text-amber-400 bg-neutral-800 px-1 rounded">createSandbox()</code>,
          setting total limits automatically enables tracking:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  limits: { total: { evaluations: 100, memoryBytes: 50 * 1024 * 1024 } },
});

const out = await sandbox.run("1 + 2", { result: "full" });
console.log(out.resources?.evaluations);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Quick Start</h2>
        <CodeBlock
          code={`import { createSandbox, ResourceExhaustedError } from "nookjs";

// Create sandbox with resource tracking enabled
const sandbox = createSandbox({
  env: "es2024",
  globals: { console },
  trackResources: true,
  limits: {
    total: {
      memoryBytes: 100 * 1024 * 1024, // 100 MB
      iterations: 1_000_000, // 1M iterations
      functionCalls: 10_000, // 10K calls
      evaluations: 100, // 100 evaluations
    },
  },
});

// Run code - resources are tracked
try {
  sandbox.runSync("const arr = Array(1000).fill(0)");
  sandbox.runSync("for (let i = 0; i < 10000; i++) {}");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(\`Limit exceeded: \${error.resourceType}\`);
  }
}

// Check cumulative stats
const stats = sandbox.resources();
if (stats) {
  console.log(\`Memory: \${stats.memoryBytes} bytes\`);
  console.log(\`Iterations: \${stats.iterations}\`);
  console.log(\`Evaluations: \${stats.evaluations}\`);
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Accessing Stats</h2>
        <p className="text-neutral-300 mb-4">
          Use <code className="text-amber-400 bg-neutral-800 px-1 rounded">resources()</code> for
          cumulative stats, or request a full result for per-run stats:
        </p>
        <CodeBlock
          code={`import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2024",
  trackResources: true,
  limits: { total: { evaluations: 10 } },
});

const result = await sandbox.run("1 + 2", { result: "full" });
console.log(result.stats);     // per-run execution stats
console.log(result.resources); // cumulative resource stats`}
        />
        <p className="text-neutral-300 mt-4">
          Need history or dynamic limit updates? See{" "}
          <Link to="/docs/api/interpreter" className="text-amber-400 hover:text-amber-300">
            Internal Classes
          </Link>{" "}
          for advanced controls.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">SandboxLimits</h2>
        <p className="text-neutral-300 mb-4">Available limits you can set:</p>
        <CodeBlock
          code={`type SandboxLimits = {
  perRun?: {
    callDepth?: number;   // call stack depth
    loops?: number;       // loop iterations
    memoryBytes?: number; // bytes
  };
  total?: {
    memoryBytes?: number;   // bytes (cumulative)
    iterations?: number;    // loop iterations (cumulative)
    functionCalls?: number; // total function invocations
    cpuTimeMs?: number;     // milliseconds (best-effort)
    evaluations?: number;   // number of run() calls
  };
};`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Error Handling</h2>
        <p className="text-neutral-300 mb-4">
          When a limit is exceeded, a{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">ResourceExhaustedError</code>{" "}
          is thrown:
        </p>
        <CodeBlock
          code={`import { createSandbox, ResourceExhaustedError } from "nookjs";

const sandbox = createSandbox({
  trackResources: true,
  limits: { total: { evaluations: 5 } },
});

try {
  for (let i = 0; i < 10; i++) {
    sandbox.runSync("1 + 1");
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Use Cases</h2>

        <div className="space-y-6">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">Plugin Systems</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Track resource usage per plugin to enforce fair allocation:
            </p>
            <CodeBlock
              code={`import { createSandbox } from "nookjs";

function createPluginSandbox(pluginId: string, memoryLimit: number) {
  return createSandbox({
    env: "es2024",
    trackResources: true,
    limits: { total: { memoryBytes: memoryLimit, evaluations: 1000 } },
    globals: getPluginGlobals(pluginId),
  });
}

const plugin1 = createPluginSandbox("plugin1", 50 * 1024 * 1024);
const plugin2 = createPluginSandbox("plugin2", 50 * 1024 * 1024);

plugin1.runSync(pluginCode);
const stats = plugin1.resources();
console.log(\`Plugin memory: \${stats?.memoryBytes} bytes\`);`}
            />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">Rate Limiting</h3>
            <p className="text-neutral-400 text-sm mb-3">
              Implement evaluation-count-based rate limiting:
            </p>
            <CodeBlock
              code={`import { createSandbox } from "nookjs";

class RateLimitedSandbox {
  private sandbox;
  private options;

  constructor(tier: "free" | "pro") {
    const evalLimit = tier === "pro" ? 10000 : 100;
    const memLimit = tier === "pro" ? 500 * 1024 * 1024 : 50 * 1024 * 1024;

    this.options = {
      env: "es2024",
      trackResources: true,
      limits: { total: { evaluations: evalLimit, memoryBytes: memLimit } },
    };

    this.sandbox = createSandbox(this.options);
  }

  run(code: string) {
    return this.sandbox.runSync(code);
  }

  // Reset limits at the start of each day
  resetDailyLimits() {
    this.sandbox = createSandbox(this.options);
  }

  getUsage() {
    return this.sandbox.resources();
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
  const sandbox = getUserSandbox(req.params.userId);
  if (!sandbox) {
    return res.status(404).json({ error: "User not found" });
  }

  const stats = sandbox.resources();
  if (!stats) {
    return res.status(409).json({ error: "Tracking not enabled" });
  }

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
                <th className="text-left py-2 pr-4 text-neutral-300">Per-Run</th>
                <th className="text-left py-2 text-neutral-300">Cumulative</th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Scope</td>
                <td className="py-2 pr-4">
                  Single <code className="text-amber-400">run()</code> call
                </td>
                <td className="py-2">Across multiple calls</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Memory</td>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">limits.perRun.memoryBytes</code>
                </td>
                <td className="py-2">
                  <code className="text-amber-400">limits.total.memoryBytes</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Loop iterations</td>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">limits.perRun.loops</code>
                </td>
                <td className="py-2">
                  <code className="text-amber-400">limits.total.iterations</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Function calls</td>
                <td className="py-2 pr-4">Not available</td>
                <td className="py-2">
                  <code className="text-amber-400">limits.total.functionCalls</code>
                </td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="py-2 pr-4">Statistics</td>
                <td className="py-2 pr-4">
                  <code className="text-amber-400">result: "full"</code> stats
                </td>
                <td className="py-2">
                  <code className="text-amber-400">resources()</code> totals
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Standalone ResourceTracker</h2>
        <p className="text-neutral-300 mb-4">
          For advanced scenarios, NookJS also exports a standalone{" "}
          <code className="text-amber-400 bg-neutral-800 px-1 rounded">ResourceTracker</code> class
          that can be used independently for custom resource accounting:
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
          Note: The standalone ResourceTracker is not automatically integrated with the sandbox.
          Use <code className="text-amber-400">trackResources: true</code> (or{" "}
          <code className="text-amber-400">limits.total</code>) for automatic tracking during{" "}
          <code className="text-amber-400">run()</code>.
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
