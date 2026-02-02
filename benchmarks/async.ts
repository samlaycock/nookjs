/**
 * Async/Promise Performance Benchmark Suite
 *
 * Compares the interpreter's async performance against Bun's native JavaScript execution.
 * Tests Promise creation, async/await patterns, Promise combinators, and generators.
 */

import type { ComparisonResult } from "./shared/format";

import { Interpreter } from "../src/interpreter";

import { formatTable, formatSummary } from "./shared/format";

interface AsyncBenchmarkResult {
  name: string;
  interpreterTime: number;
  nativeTime: number;
  slowdownFactor: number;
  opsPerSecond: {
    interpreter: number;
    native: number;
  };
}

async function benchmarkAsync(
  name: string,
  code: string,
  iterations: number = 1000,
  globals?: Record<string, any>,
): Promise<AsyncBenchmarkResult> {
  const interpreter = new Interpreter({ globals });

  await interpreter.evaluateAsync(code);
  // eslint-disable-next-line no-eval
  await eval(`(async () => { ${code} })()`);

  const interpreterStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const interp = new Interpreter({ globals });
    await interp.evaluateAsync(code);
  }
  const interpreterTime = performance.now() - interpreterStart;

  const nativeStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    // eslint-disable-next-line no-eval
    await eval(`(async () => { ${code} })()`);
  }
  const nativeTime = performance.now() - nativeStart;

  const slowdownFactor = interpreterTime / nativeTime;
  const interpreterOps = (iterations / interpreterTime) * 1000;
  const nativeOps = (iterations / nativeTime) * 1000;

  return {
    name,
    interpreterTime,
    nativeTime,
    slowdownFactor,
    opsPerSecond: {
      interpreter: interpreterOps,
      native: nativeOps,
    },
  };
}

const benchmarkCases: { name: string; code: string; iterations: number }[] = [
  {
    name: "Promise.resolve",
    code: "Promise.resolve(42)",
    iterations: 5000,
  },
  {
    name: "Promise Constructor",
    code: "new Promise(resolve => resolve(42))",
    iterations: 5000,
  },
  {
    name: "Async Function Call",
    code: `async function getValue() { return 42; } await getValue();`,
    iterations: 5000,
  },
  {
    name: "Chained Awaits",
    code: `
      async function a() { return 1; }
      async function b() { return await a() + 1; }
      async function c() { return await b() + 1; }
      await c();
    `,
    iterations: 2000,
  },
  {
    name: "Sequential Awaits (loop)",
    code: `
      async function getValue(n) { return n; }
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += await getValue(i);
      }
      sum;
    `,
    iterations: 1000,
  },
  {
    name: "Promise.all (5 promises)",
    code: `
      await Promise.all([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
        Promise.resolve(4),
        Promise.resolve(5)
      ]);
    `,
    iterations: 2000,
  },
  {
    name: "Promise.race",
    code: `
      await Promise.race([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]);
    `,
    iterations: 2000,
  },
  {
    name: "Promise.allSettled",
    code: `
      await Promise.allSettled([
        Promise.resolve(1),
        Promise.reject(new Error("test")),
        Promise.resolve(3)
      ]);
    `,
    iterations: 2000,
  },
  {
    name: "Promise.then Chain (5 steps)",
    code: `
      await Promise.resolve(1)
        .then(x => x + 1)
        .then(x => x + 1)
        .then(x => x + 1)
        .then(x => x + 1)
        .then(x => x + 1);
    `,
    iterations: 2000,
  },
  {
    name: "Promise with Error Handling",
    code: `
      await Promise.resolve(1)
        .then(x => { if (x > 0) throw new Error("test"); return x; })
        .catch(e => 0)
        .then(x => x + 1);
    `,
    iterations: 2000,
  },
  {
    name: "Sync Generator (10 yields)",
    code: `
      function* gen() {
        for (let i = 0; i < 10; i++) yield i;
      }
      let sum = 0;
      for (const v of gen()) sum += v;
      sum;
    `,
    iterations: 2000,
  },
  {
    name: "Async Generator (10 yields)",
    code: `
      async function* gen() {
        for (let i = 0; i < 10; i++) yield i;
      }
      let sum = 0;
      for await (const v of gen()) sum += v;
      sum;
    `,
    iterations: 1000,
  },
  {
    name: "Async Data Pipeline",
    code: `
      async function fetchData(id) { return { id, value: id * 10 }; }
      async function processData(data) { return data.value * 2; }
      async function saveData(value) { return { saved: true, value }; }

      const data = await fetchData(1);
      const processed = await processData(data);
      await saveData(processed);
    `,
    iterations: 1000,
  },
  {
    name: "Concurrent Fetch Pattern",
    code: `
      async function fetchItem(id) { return { id }; }
      const ids = [1, 2, 3, 4, 5];
      await Promise.all(ids.map(id => fetchItem(id)));
    `,
    iterations: 1000,
  },
  {
    name: "Async IIFE",
    code: "(async () => { return 42; })()",
    iterations: 5000,
  },
  {
    name: "Async Arrow Function",
    code: "const fn = async (x) => x * 2; await fn(21)",
    iterations: 5000,
  },
  {
    name: "Async Closure",
    code: `
      function makeAsyncCounter() {
        let count = 0;
        async function increment() { count = count + 1; return count; }
        return { increment };
      }
      const counter = makeAsyncCounter();
      await counter.increment();
      await counter.increment();
    `,
    iterations: 2000,
  },
  {
    name: "Promise.map Pattern",
    code: `
      const items = [1, 2, 3, 4, 5];
      await Promise.all(items.map(async x => x * 2));
    `,
    iterations: 2000,
  },
];

async function main() {
  console.log("========================================");
  console.log("ASYNC/PROMISE PERFORMANCE BENCHMARK");
  console.log("========================================\n");

  const results: AsyncBenchmarkResult[] = [];
  for (const c of benchmarkCases) {
    const result = await benchmarkAsync(c.name, c.code, c.iterations);
    results.push(result);
  }

  const tableData: ComparisonResult[] = results.map((r) => ({
    name: r.name,
    timeMs: r.interpreterTime,
    baselineTimeMs: r.nativeTime,
    opsPerSecond: r.opsPerSecond.interpreter,
    baselineOpsPerSecond: r.opsPerSecond.native,
    slowdown: r.slowdownFactor,
  }));

  console.log(formatTable(tableData, true));
  console.log(formatSummary(results));

  const jsonOutput = {
    timestamp: new Date().toISOString(),
    runtime: "Bun",
    version: Bun.version,
    type: "async",
    results: results,
  };

  console.log("Writing results to benchmark-async-results.json...");
  await Bun.write("benchmark-async-results.json", JSON.stringify(jsonOutput, null, 2));
  console.log("Done!");
}

await main();
