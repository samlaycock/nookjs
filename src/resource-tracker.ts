import { InterpreterError } from "./errors";

export type ResourceLimits = {
  maxTotalMemory?: number;
  maxAllocationBytes?: number;
  maxTotalIterations?: number;
  maxFunctionCalls?: number;
  maxCpuTime?: number;
  maxEvaluations?: number;
};

export type ResourceStats = {
  allocationBytes: number;
  memoryBytes: number;
  iterations: number;
  functionCalls: number;
  cpuTimeMs: number;
  evaluations: number;
  peakMemoryBytes: number;
  largestEvaluation: {
    memory: number;
    iterations: number;
  };
  isExhausted: boolean;
  limitStatus: {
    [key in keyof ResourceLimits]?: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
};

export type ResourceHistoryEntry = {
  timestamp: Date;
  memoryBytes: number;
  iterations: number;
  functionCalls: number;
  evaluationNumber: number;
};

export class ResourceExhaustedError extends InterpreterError {
  resourceType: keyof ResourceLimits;
  used: number;
  limit: number;

  constructor(resourceType: keyof ResourceLimits, used: number, limit: number) {
    super(`Resource limit exceeded: ${resourceType} (used: ${used}, limit: ${limit})`);
    this.name = "ResourceExhaustedError";
    this.resourceType = resourceType;
    this.used = used;
    this.limit = limit;
  }
}

export class ResourceTracker {
  private limits: ResourceLimits = {};
  private historySize: number;
  private history: ResourceHistoryEntry[] = [];
  private evaluationNumber = 0;
  private preferredMemoryLimitKey: "maxAllocationBytes" | "maxTotalMemory" = "maxAllocationBytes";

  private cumulativeMemory = 0;
  private cumulativeIterations = 0;
  private cumulativeFunctionCalls = 0;
  private cumulativeCpuTime = 0;
  private peakMemory = 0;
  private largestEvaluationMemory = 0;
  private largestEvaluationIterations = 0;
  private exhaustedLimit: keyof ResourceLimits | null = null;

  constructor(options?: { limits?: ResourceLimits; historySize?: number }) {
    if (options?.limits) {
      this.assertMemoryLimitAliasesMatch(
        options.limits.maxAllocationBytes,
        options.limits.maxTotalMemory,
      );
      this.limits = { ...options.limits };
      this.preferredMemoryLimitKey =
        options.limits.maxAllocationBytes !== undefined ? "maxAllocationBytes" : "maxTotalMemory";
      this.syncMemoryLimitAliases(this.preferredMemoryLimitKey);
    }
    this.historySize = options?.historySize ?? 100;
  }

  getStats(): ResourceStats {
    const limitStatus: ResourceStats["limitStatus"] = {};

    for (const key of Object.keys(this.limits) as (keyof ResourceLimits)[]) {
      const limit = this.limits[key];
      if (limit === undefined) continue;

      let used = 0;
      switch (key) {
        case "maxTotalMemory":
        case "maxAllocationBytes":
          used = this.cumulativeMemory;
          break;
        case "maxTotalIterations":
          used = this.cumulativeIterations;
          break;
        case "maxFunctionCalls":
          used = this.cumulativeFunctionCalls;
          break;
        case "maxCpuTime":
          used = this.cumulativeCpuTime;
          break;
        case "maxEvaluations":
          used = this.evaluationNumber;
          break;
      }

      limitStatus[key] = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
      };
    }

    return {
      allocationBytes: this.cumulativeMemory,
      memoryBytes: this.cumulativeMemory,
      iterations: this.cumulativeIterations,
      functionCalls: this.cumulativeFunctionCalls,
      cpuTimeMs: this.cumulativeCpuTime,
      evaluations: this.evaluationNumber,
      peakMemoryBytes: this.peakMemory,
      largestEvaluation: {
        memory: this.largestEvaluationMemory,
        iterations: this.largestEvaluationIterations,
      },
      isExhausted: this.exhaustedLimit !== null,
      limitStatus,
    };
  }

  isExhausted(): boolean {
    return this.exhaustedLimit !== null;
  }

  getExhaustedLimit(): keyof ResourceLimits | null {
    return this.exhaustedLimit;
  }

  getCumulativeCpuTime(): number {
    return this.cumulativeCpuTime;
  }

  reset(): void {
    this.cumulativeMemory = 0;
    this.cumulativeIterations = 0;
    this.cumulativeFunctionCalls = 0;
    this.cumulativeCpuTime = 0;
    this.peakMemory = 0;
    this.largestEvaluationMemory = 0;
    this.largestEvaluationIterations = 0;
    this.exhaustedLimit = null;
    this.history = [];
    this.evaluationNumber = 0;
  }

  getHistory(): ResourceHistoryEntry[] {
    return [...this.history];
  }

  getLimit(key: keyof ResourceLimits): number | undefined {
    return this.limits[key];
  }

  setLimit(key: keyof ResourceLimits, value: number): void {
    this.limits[key] = value;
    if (key === "maxAllocationBytes" || key === "maxTotalMemory") {
      this.preferredMemoryLimitKey = key;
      this.syncMemoryLimitAliases(key);
    }
  }

  beginEvaluation(): void {
    if (this.exhaustedLimit !== null) {
      throw new ResourceExhaustedError(
        this.exhaustedLimit,
        this.getStats().limitStatus[this.exhaustedLimit]?.used ?? 0,
        this.limits[this.exhaustedLimit] ?? 0,
      );
    }

    const maxEvaluations = this.limits.maxEvaluations;
    const nextEvaluationNumber = this.evaluationNumber + 1;
    if (maxEvaluations !== undefined && nextEvaluationNumber > maxEvaluations) {
      this.exhaustedLimit = "maxEvaluations";
      throw new ResourceExhaustedError("maxEvaluations", nextEvaluationNumber, maxEvaluations);
    }
  }

  endEvaluation(
    memoryBytes: number,
    iterations: number,
    functionCalls: number,
    cpuTimeMs: number,
  ): void {
    this.evaluationNumber++;

    if (memoryBytes > this.peakMemory) {
      this.peakMemory = memoryBytes;
    }

    if (memoryBytes > this.largestEvaluationMemory) {
      this.largestEvaluationMemory = memoryBytes;
    }

    if (iterations > this.largestEvaluationIterations) {
      this.largestEvaluationIterations = iterations;
    }

    this.cumulativeMemory += memoryBytes;
    this.cumulativeIterations += iterations;
    this.cumulativeFunctionCalls += functionCalls;
    this.cumulativeCpuTime += cpuTimeMs;

    if (this.historySize > 0) {
      this.history.push({
        timestamp: new Date(),
        memoryBytes,
        iterations,
        functionCalls,
        evaluationNumber: this.evaluationNumber,
      });

      if (this.history.length > this.historySize) {
        this.history.shift();
      }
    }

    const exhaustedLimit = this.checkLimits();
    if (exhaustedLimit) {
      throw new ResourceExhaustedError(
        exhaustedLimit,
        this.getStats().limitStatus[exhaustedLimit]?.used ?? 0,
        this.limits[exhaustedLimit] ?? 0,
      );
    }
  }

  private checkLimits(): keyof ResourceLimits | null {
    const stats = this.getStats();

    const preferredMemoryLimitStatus = stats.limitStatus[this.preferredMemoryLimitKey];
    if (
      preferredMemoryLimitStatus &&
      preferredMemoryLimitStatus.used >= preferredMemoryLimitStatus.limit
    ) {
      this.exhaustedLimit = this.preferredMemoryLimitKey;
      return this.preferredMemoryLimitKey;
    }

    for (const key of Object.keys(stats.limitStatus) as (keyof ResourceLimits)[]) {
      if (key === "maxAllocationBytes" || key === "maxTotalMemory" || key === "maxEvaluations") {
        continue;
      }
      const status = stats.limitStatus[key];
      if (status && status.used >= status.limit) {
        this.exhaustedLimit = key;
        return key;
      }
    }

    return null;
  }

  private syncMemoryLimitAliases(lastWritten?: "maxAllocationBytes" | "maxTotalMemory"): void {
    const allocationLimit = this.limits.maxAllocationBytes;
    const totalMemoryLimit = this.limits.maxTotalMemory;

    if (lastWritten === "maxAllocationBytes" && allocationLimit !== undefined) {
      this.limits.maxTotalMemory = allocationLimit;
    } else if (lastWritten === "maxTotalMemory" && totalMemoryLimit !== undefined) {
      this.limits.maxAllocationBytes = totalMemoryLimit;
    } else if (allocationLimit !== undefined) {
      this.limits.maxTotalMemory = allocationLimit;
    } else if (totalMemoryLimit !== undefined) {
      this.limits.maxAllocationBytes = totalMemoryLimit;
    }
  }

  private assertMemoryLimitAliasesMatch(allocationLimit?: number, totalMemoryLimit?: number): void {
    if (
      allocationLimit !== undefined &&
      totalMemoryLimit !== undefined &&
      allocationLimit !== totalMemoryLimit
    ) {
      throw new Error("maxAllocationBytes and maxTotalMemory must match");
    }
  }
}
