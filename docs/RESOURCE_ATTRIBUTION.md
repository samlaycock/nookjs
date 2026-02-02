# Resource Attribution

Resource attribution enables host applications to monitor and limit cumulative resource consumption across multiple evaluations. This is essential for multi-tenant environments where multiple untrusted code snippets execute concurrently.

## Overview

NookJS provides two approaches to resource tracking:

1. **Integrated Resource Tracking** - Enable via `{ resourceTracking: true }` on the Interpreter. The Interpreter tracks resources internally and exposes methods to get stats, set limits, and reset.

2. **Standalone ResourceTracker** - Use the `ResourceTracker` class independently for custom resource accounting scenarios.

## Integrated Resource Tracking

The recommended approach for most use cases. Enable tracking when creating the Interpreter:

```typescript
import { Interpreter, ResourceExhaustedError } from "nookjs";

const interpreter = new Interpreter({
  globals: { console },
  resourceTracking: true,
});

// Set limits
interpreter.setResourceLimit("maxTotalMemory", 100 * 1024 * 1024); // 100 MB
interpreter.setResourceLimit("maxTotalIterations", 1000000); // 1M iterations
interpreter.setResourceLimit("maxFunctionCalls", 10000); // 10K calls
interpreter.setResourceLimit("maxEvaluations", 100); // 100 evaluations

// Run code
try {
  interpreter.evaluate("const arr = Array(1000).fill(0)");
  interpreter.evaluate("for (let i = 0; i < 10000; i++) {}");
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
  }
}

// Get cumulative stats
const stats = interpreter.getResourceStats();
console.log(`Memory used: ${stats.memoryBytes} bytes`);
console.log(`Iterations: ${stats.iterations}`);
console.log(`Evaluations: ${stats.evaluations}`);
```

### Interpreter Resource Methods

When `resourceTracking: true` is set, the Interpreter exposes these methods:

```typescript
// Get cumulative resource statistics
interpreter.getResourceStats(): ResourceStats;

// Reset all tracking statistics
interpreter.resetResourceStats(): void;

// Get history of past evaluations
interpreter.getResourceHistory(): ResourceHistoryEntry[];

// Set a resource limit
interpreter.setResourceLimit(key: keyof ResourceLimits, value: number): void;

// Get a resource limit
interpreter.getResourceLimit(key: keyof ResourceLimits): number | undefined;
```

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

**Note**: The standalone ResourceTracker is not automatically integrated with the Interpreter. Use integrated tracking (`resourceTracking: true`) for automatic enforcement during evaluation.

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

Track resource usage per plugin using integrated tracking:

```typescript
function createPluginInterpreter(pluginId: string, memoryLimit: number) {
  const interpreter = new Interpreter({
    resourceTracking: true,
    globals: getPluginGlobals(pluginId),
  });

  interpreter.setResourceLimit("maxTotalMemory", memoryLimit);
  interpreter.setResourceLimit("maxEvaluations", 1000);

  return interpreter;
}

const plugins = {
  payment: createPluginInterpreter("payment", 50 * 1024 * 1024),
  analytics: createPluginInterpreter("analytics", 50 * 1024 * 1024),
};

plugins.payment.evaluate(paymentCode);
const stats = plugins.payment.getResourceStats();
console.log(`Payment plugin memory: ${stats.memoryBytes} bytes`);
```

### Educational Platforms

Monitor student code submissions:

```typescript
class StudentSession {
  private interpreter: Interpreter;

  constructor(studentId: string) {
    this.interpreter = new Interpreter({
      resourceTracking: true,
      globals: { console: educationalConsole },
    });

    // Set limits for student submissions
    this.interpreter.setResourceLimit("maxEvaluations", 50);
    this.interpreter.setResourceLimit("maxTotalIterations", 100000);
    this.interpreter.setResourceLimit("maxCpuTime", 5000);
  }

  submitCode(code: string): SubmissionResult {
    try {
      this.interpreter.evaluate(code);
      return { success: true, stats: this.interpreter.getResourceStats() };
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

  getStats() {
    return this.interpreter.getResourceStats();
  }

  reset() {
    this.interpreter.resetResourceStats();
  }
}
```

### Rate Limiting

Implement evaluation-count-based rate limiting:

```typescript
class RateLimitedInterpreter {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter({
      resourceTracking: true,
    });

    // Allow 1000 evaluations per period
    this.interpreter.setResourceLimit("maxEvaluations", 1000);
  }

  evaluate(code: string): unknown {
    return this.interpreter.evaluate(code);
  }

  refill(): void {
    this.interpreter.resetResourceStats();
  }
}
```

### Billing Based on Resource Usage

Track resources for usage-based billing:

```typescript
class BillingTracker {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter({
      resourceTracking: true,
    });
  }

  evaluate(code: string): unknown {
    return this.interpreter.evaluate(code);
  }

  generateInvoice(userId: string): Invoice {
    const stats = this.interpreter.getResourceStats();

    return {
      userId,
      evaluations: stats.evaluations,
      resourceUsage: {
        memoryMB: stats.memoryBytes / (1024 * 1024),
        iterations: stats.iterations,
        cpuTimeMs: stats.cpuTimeMs,
      },
      cost: this.calculateCost(stats),
    };
  }

  private calculateCost(stats: ResourceStats): number {
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
function createMonitoredInterpreter() {
  const interpreter = new Interpreter({
    resourceTracking: true,
  });

  interpreter.setResourceLimit("maxTotalMemory", 500 * 1024 * 1024);
  interpreter.setResourceLimit("maxTotalIterations", 10000000);

  return {
    evaluate: (code: string) => interpreter.evaluate(code),
    getMetrics: () => ({
      current: interpreter.getResourceStats(),
      history: interpreter.getResourceHistory(),
      limits: {
        memory: interpreter.getResourceLimit("maxTotalMemory"),
        iterations: interpreter.getResourceLimit("maxTotalIterations"),
      },
    }),
    reset: () => interpreter.resetResourceStats(),
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
