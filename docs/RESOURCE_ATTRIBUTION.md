# Resource Attribution

Resource attribution enables host applications to monitor and limit cumulative resource consumption across multiple evaluations. This is essential for multi-tenant environments where multiple untrusted code snippets execute concurrently.

## Overview

NookJS provides two approaches to resource tracking:

1. **Integrated Resource Tracking** - Enable via `limits.total` or `trackResources` on `createSandbox()`. The sandbox tracks resources internally and exposes stats via `sandbox.resources()`.

2. **Standalone ResourceTracker** - Use the `ResourceTracker` class independently for custom resource accounting scenarios.

## Simplified API (createSandbox)

The simplified API enables integrated tracking automatically when you set total limits:

```typescript
import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  limits: {
    total: {
      evaluations: 100,
      memoryBytes: 50 * 1024 * 1024,
    },
  },
});

const out = await sandbox.run("1 + 2", { result: "full" });
console.log(out.resources?.evaluations);
```

You can also enable tracking explicitly with `trackResources: true` and access stats via
`sandbox.resources()` or `sandbox.interpreter.getResourceStats()`.

## Integrated Resource Tracking

The recommended approach for most use cases. Enable tracking when creating a sandbox and set
total limits:

```typescript
import { createSandbox, ResourceExhaustedError } from "nookjs";

const sandbox = createSandbox({
  env: "es2022",
  limits: {
    total: {
      memoryBytes: 100 * 1024 * 1024,
      iterations: 1_000_000,
      functionCalls: 10_000,
      evaluations: 100,
    },
  },
});

try {
  await sandbox.run("const arr = Array(1000).fill(0)");
  await sandbox.run("for (let i = 0; i < 10000; i++) {}");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
  }
}

const stats = sandbox.resources();
console.log(`Memory used: ${stats?.memoryBytes} bytes`);
```

For low-level resource APIs, see [Internal Classes](INTERNAL_CLASSES.md).

## Standalone ResourceTracker

For advanced scenarios where you need independent resource tracking (e.g., aggregating across multiple interpreters or custom accounting):

```typescript
import { ResourceTracker, ResourceExhaustedError } from "nookjs";

const tracker = new ResourceTracker({
  limits: {
    maxTotalMemory: 100 * 1024 * 1024,
    maxTotalIterations: 1000000,
    maxFunctionCalls: 10000,
    maxCpuTime: 30000,
    maxEvaluations: 100,
  },
  historySize: 100, // Keep last 100 evaluation records
});

// Check stats
const stats = tracker.getStats();

// Check if any limit exceeded
if (tracker.isExhausted()) {
  const limit = tracker.getExhaustedLimit();
  console.log(`Exhausted: ${limit}`);
}

// Reset tracking
tracker.reset();

// Get/set individual limits
tracker.setLimit("maxTotalMemory", 200 * 1024 * 1024);
const memLimit = tracker.getLimit("maxTotalMemory");

// Get evaluation history
const history = tracker.getHistory();
```

**Note**: The standalone ResourceTracker is not automatically integrated with the sandbox. Use integrated tracking via `createSandbox()` for automatic enforcement during evaluation.

## Type Reference

### ResourceLimits

```typescript
type ResourceLimits = {
  maxTotalMemory?: number; // bytes (cumulative)
  maxTotalIterations?: number; // loop iterations (cumulative)
  maxFunctionCalls?: number; // function invocations (cumulative)
  maxCpuTime?: number; // milliseconds (best-effort)
  maxEvaluations?: number; // number of evaluate() calls
};
```

### ResourceStats

```typescript
type ResourceStats = {
  memoryBytes: number; // current estimated memory
  iterations: number; // total loop iterations
  functionCalls: number; // total function calls
  cpuTimeMs: number; // cumulative CPU time
  evaluations: number; // number of evaluations
  peakMemoryBytes: number; // highest memory seen
  largestEvaluation: {
    memory: number;
    iterations: number;
  };
  isExhausted: boolean; // any limit exceeded
  limitStatus: {
    [key in keyof ResourceLimits]?: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
};
```

### ResourceHistoryEntry

```typescript
type ResourceHistoryEntry = {
  timestamp: Date;
  memoryBytes: number;
  iterations: number;
  functionCalls: number;
  evaluationNumber: number;
};
```

### ResourceExhaustedError

```typescript
class ResourceExhaustedError extends InterpreterError {
  resourceType: keyof ResourceLimits;
  used: number;
  limit: number;
}
```

## Use Cases

### Multi-Tenant Plugin Systems

Track resource usage per plugin using total limits:

```typescript
function createPluginSandbox(pluginId: string, memoryLimit: number) {
  return createSandbox({
    env: "es2022",
    globals: getPluginGlobals(pluginId),
    limits: {
      total: {
        memoryBytes: memoryLimit,
        evaluations: 1000,
      },
    },
  });
}

const plugins = {
  payment: createPluginSandbox("payment", 50 * 1024 * 1024),
  analytics: createPluginSandbox("analytics", 50 * 1024 * 1024),
};

await plugins.payment.run(paymentCode);
const stats = plugins.payment.resources();
console.log(`Payment plugin memory: ${stats?.memoryBytes} bytes`);
```

### Educational Platforms

Monitor student code submissions:

```typescript
class StudentSession {
  private sandbox = createSandbox({
    env: "es2022",
    globals: { console: educationalConsole },
    limits: {
      total: {
        evaluations: 50,
        iterations: 100_000,
        cpuTimeMs: 5000,
      },
    },
  });

  async submitCode(code: string): Promise<SubmissionResult> {
    try {
      await this.sandbox.run(code);
      return { success: true, stats: this.sandbox.resources() };
    } catch (error) {
      if (error instanceof ResourceExhaustedError) {
        return {
          success: false,
          reason: "resource_limit_exceeded",
          limit: error.resourceType,
        };
      }
      throw error;
    }
  }
}
```

### Rate Limiting

Implement evaluation-count-based rate limiting:

```typescript
class RateLimitedSandbox {
  private sandbox = createSandbox({
    env: "es2022",
    limits: { total: { evaluations: 1000 } },
  });

  evaluate(code: string): unknown {
    return this.sandbox.runSync(code);
  }

  refill(): void {
    this.sandbox = createSandbox({
      env: "es2022",
      limits: { total: { evaluations: 1000 } },
    });
  }
}
```

### Billing Based on Resource Usage

Track resources for usage-based billing:

```typescript
class BillingTracker {
  private sandbox = createSandbox({
    env: "es2022",
    trackResources: true,
  });

  evaluate(code: string): unknown {
    return this.sandbox.runSync(code);
  }

  generateInvoice(userId: string): Invoice {
    const stats = this.sandbox.resources();

    return {
      userId,
      evaluations: stats?.evaluations ?? 0,
      resourceUsage: {
        memoryMB: (stats?.memoryBytes ?? 0) / (1024 * 1024),
        iterations: stats?.iterations ?? 0,
        cpuTimeMs: stats?.cpuTimeMs ?? 0,
      },
      cost: this.calculateCost(stats),
    };
  }

  private calculateCost(stats?: ResourceStats): number {
    if (!stats) return 0;
    const baseCost = 0.01;
    const memoryCost = (stats.memoryBytes / (1024 * 1024)) * 0.001;
    const iterationCost = stats.iterations * 0.00001;
    return baseCost + memoryCost + iterationCost;
  }
}
```

### Monitoring Dashboard

Expose stats for monitoring:

```typescript
function createMonitoredSandbox() {
  const sandbox = createSandbox({
    env: "es2022",
    limits: {
      total: { memoryBytes: 500 * 1024 * 1024, iterations: 10_000_000 },
    },
  });

  return {
    evaluate: (code: string) => sandbox.runSync(code),
    getMetrics: () => ({
      current: sandbox.resources(),
    }),
  };
}
```

## Performance Characteristics

| Operation               | Overhead                       |
| ----------------------- | ------------------------------ |
| `getResourceStats()`    | O(1)                           |
| `isExhausted()`         | O(1)                           |
| `getResourceHistory()`  | O(n) where n = history size    |
| Per-evaluation tracking | Minimal (< 1% additional time) |

### Memory Tracking Notes

Memory tracking is a best-effort estimate based on:

- Array allocations: ~16 bytes per element
- Object allocations: ~64 bytes base + 32 bytes per property
- String allocations (via template literals): ~2 bytes per character

This is not precise memory accounting but serves to detect runaway allocations.

### CPU Time Notes

CPU time is estimated using wall-clock time. This is a best-effort approximation since JavaScript doesn't expose precise CPU timing.

## Comparison with Per-Evaluation Limits

| Feature          | Per-Evaluation Limit | Integrated Resource Tracking |
| ---------------- | -------------------- | ---------------------------- |
| Memory           | `maxMemory`          | `maxTotalMemory`             |
| Loop iterations  | `maxLoopIterations`  | `maxTotalIterations`         |
| Call stack depth | `maxCallStackDepth`  | Not tracked                  |
| Function calls   | Not available        | `maxFunctionCalls`           |
| CPU time         | Not available        | `maxCpuTime`                 |
| Evaluation count | Not available        | `maxEvaluations`             |
| Scope            | Single call          | Cumulative                   |

Use per-evaluation limits for immediate protection against single runaway scripts, and integrated resource tracking for multi-tenant resource accounting and billing.
