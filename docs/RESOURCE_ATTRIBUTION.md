# Resource Attribution

Resource attribution enables host applications to monitor and limit cumulative resource consumption across multiple evaluations. This is essential for multi-tenant environments where multiple untrusted code snippets execute concurrently.

## Overview

The `ResourceTracker` class provides:

- **Aggregate resource tracking** across multiple evaluations
- **Cumulative limit enforcement** for memory, iterations, function calls, CPU time, and evaluation count
- **Historical data** for analytics and billing
- **Resource exhaustion detection** to identify problematic code patterns

## Quick Start

```typescript
import { Interpreter, ResourceTracker, ResourceExhaustedError } from 'nookjs';

const tracker = new ResourceTracker({
  limits: {
    maxTotalMemory: 100 * 1024 * 1024,  // 100 MB cumulative
    maxTotalIterations: 1000000,         // 1M total loop iterations
    maxFunctionCalls: 10000,             // 10K function calls
    maxCpuTime: 30000,                   // 30 seconds cumulative CPU
    maxEvaluations: 100,                 // 100 evaluations
  }
});

const interpreter = new Interpreter({
  globals: { console },
  resourceTracker: tracker,
});

try {
  interpreter.evaluate(code);
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log(`Resource limit exceeded: ${error.resourceType}`);
  }
}

const stats = tracker.getStats();
console.log(`Memory used: ${stats.memoryBytes} bytes`);
console.log(`Iterations: ${stats.iterations}`);
```

## API Reference

### ResourceTracker Class

```typescript
class ResourceTracker {
  constructor(options?: {
    limits?: ResourceLimits;
    historySize?: number;
  });

  getStats(): ResourceStats;
  isExhausted(): boolean;
  getExhaustedLimit(): keyof ResourceLimits | null;
  reset(): void;
  getHistory(): ResourceHistoryEntry[];
  getLimit(key: keyof ResourceLimits): number | undefined;
  setLimit(key: keyof ResourceLimits, value: number): void;
}
```

### ResourceLimits

```typescript
type ResourceLimits = {
  maxTotalMemory?: number;        // bytes (cumulative)
  maxTotalIterations?: number;    // loop iterations (cumulative)
  maxFunctionCalls?: number;      // function invocations (cumulative)
  maxCpuTime?: number;            // milliseconds (best-effort)
  maxEvaluations?: number;        // number of evaluate() calls
};
```

### ResourceStats

```typescript
type ResourceStats = {
  memoryBytes: number;            // current estimated memory
  iterations: number;             // total loop iterations
  functionCalls: number;          // total function calls
  cpuTimeMs: number;              // cumulative CPU time
  evaluations: number;            // number of evaluations
  peakMemoryBytes: number;        // highest memory seen
  largestEvaluation: {            // heaviest single evaluation
    memory: number;
    iterations: number;
  };
  isExhausted: boolean;           // any limit exceeded
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

## Use Cases

### Multi-Tenant Plugin Systems

Track resource usage per plugin:

```typescript
const createPluginInterpreter = (pluginId: string, memoryLimit: number) => {
  const tracker = new ResourceTracker({
    limits: { maxTotalMemory: memoryLimit }
  });

  return new Interpreter({
    resourceTracker: tracker,
    globals: getPluginGlobals(pluginId),
  });
};

const plugins = {
  payment: createPluginInterpreter('payment', 50 * 1024 * 1024),
  analytics: createPluginInterpreter('analytics', 50 * 1024 * 1024),
};

plugins.payment.evaluate(paymentCode);
const stats = plugins.analytics.getStats();
```

### Educational Platforms

Monitor student code submissions:

```typescript
class StudentSession {
  private tracker: ResourceTracker;
  private interpreter: Interpreter;

  constructor(studentId: string) {
    this.tracker = new ResourceTracker({
      limits: {
        maxEvaluations: 50,
        maxTotalIterations: 100000,
        maxCpuTime: 5000,
      }
    });

    this.interpreter = new Interpreter({
      resourceTracker: this.tracker,
      globals: { console: educationalConsole },
    });
  }

  submitCode(code: string): SubmissionResult {
    try {
      this.interpreter.evaluate(code);
      return { success: true, stats: this.tracker.getStats() };
    } catch (error) {
      if (error instanceof ResourceExhaustedError) {
        return {
          success: false,
          reason: 'resource_limit_exceeded',
          limit: error.resourceType,
        };
      }
      throw error;
    }
  }

  getStats() {
    return this.tracker.getStats();
  }

  reset() {
    this.tracker.reset();
  }
}
```

### Rate Limiting with Token Bucket

Implement token-bucket style rate limiting:

```typescript
class RateLimitedInterpreter {
  private tracker: ResourceTracker;
  private interpreter: Interpreter;
  private tokens = 1000;

  constructor() {
    this.tracker = new ResourceTracker({
      limits: { maxEvaluations: 1000 }
    });

    this.interpreter = new Interpreter({
      resourceTracker: this.tracker,
    });
  }

  evaluate(code: string): any {
    if (this.tokens <= 0) {
      throw new Error('Rate limit exceeded');
    }

    const result = this.interpreter.evaluate(code);
    this.tokens--;
    return result;
  }

  refill(): void {
    this.tokens = 1000;
    this.tracker.reset();
  }
}
```

### Billing Based on Resource Usage

Track resources for usage-based billing:

```typescript
class BillingTracker {
  private tracker: ResourceTracker;

  constructor() {
    this.tracker = new ResourceTracker();
  }

  evaluate(code: string, userId: string): any {
    const interpreter = new Interpreter({
      resourceTracker: this.tracker,
      globals: this.getUserGlobals(userId),
    });

    return interpreter.evaluate(code);
  }

  generateInvoice(userId: string): Invoice {
    const stats = this.tracker.getStats();
    const cost = this.calculateCost(stats);

    return {
      userId,
      period: this.billingPeriod,
      evaluations: stats.evaluations,
      resourceUsage: {
        memoryMB: stats.memoryBytes / (1024 * 1024),
        iterations: stats.iterations,
        cpuTimeMs: stats.cpuTimeMs,
      },
      cost,
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

### Monitoring Dashboard Data

Expose stats for monitoring:

```typescript
const createMonitoringEndpoint = () => {
  const tracker = new ResourceTracker({
    limits: {
      maxTotalMemory: 500 * 1024 * 1024,
      maxTotalIterations: 10000000,
    }
  });

  const interpreter = new Interpreter({
    resourceTracker: tracker,
  });

  return {
    evaluate: (code: string) => interpreter.evaluate(code),
    getMetrics: () => ({
      current: tracker.getStats(),
      history: tracker.getHistory(),
      limits: {
        memory: tracker.getLimit('maxTotalMemory'),
        iterations: tracker.getLimit('maxTotalIterations'),
      },
    }),
    reset: () => tracker.reset(),
  };
};
```

## Error Handling

### ResourceExhaustedError

```typescript
class ResourceExhaustedError extends InterpreterError {
  resourceType: keyof ResourceLimits;
  used: number;
  limit: number;
}
```

Example:

```typescript
const tracker = new ResourceTracker({
  limits: { maxEvaluations: 5 }
});
const interpreter = new Interpreter({ resourceTracker: tracker });

try {
  for (let i = 0; i < 10; i++) {
    interpreter.evaluate(code);
  }
} catch (error) {
  if (error instanceof ResourceExhaustedError) {
    console.log({
      type: error.resourceType,
      used: error.used,
      limit: error.limit,
      message: error.message,
    });
  }
}
```

## Performance Characteristics

| Operation | Overhead |
|-----------|----------|
| `getStats()` | O(1) |
| `isExhausted()` | O(1) |
| `getHistory()` | O(n) where n = history size |
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

| Feature | Per-Evaluation Limit | ResourceTracker |
|---------|---------------------|-----------------|
| Memory | `maxMemory` | `maxTotalMemory` |
| Loop iterations | `maxLoopIterations` | `maxTotalIterations` |
| Call stack depth | `maxCallStackDepth` | Not tracked |
| Function calls | Not available | `maxFunctionCalls` |
| CPU time | Not available | `maxCpuTime` |
| Evaluation count | Not available | `maxEvaluations` |
| Scope | Single call | Cumulative |

Use per-evaluation limits for immediate protection against single runaway scripts, and ResourceTracker for multi-tenant resource accounting and billing.
