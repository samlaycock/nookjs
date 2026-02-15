import { parseModule } from "../src/ast";

interface Sample {
  name: string;
  code: string;
  iterations: number;
}

interface RunStats {
  minMs: number;
  maxMs: number;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  opsPerSecond: number;
}

const samples: Sample[] = [
  { name: "Tiny Expression", code: "2 + 3", iterations: 50000 },
  {
    name: "Arithmetic + Variables",
    code: "let a = 1; let b = 2; let c = a + b * 3; c",
    iterations: 20000,
  },
  {
    name: "Control Flow",
    code: `
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          sum = sum + i;
        }
      }
      sum
    `,
    iterations: 10000,
  },
  {
    name: "Functions + Closures",
    code: `
      function makeAdder(x) {
        return y => x + y;
      }
      let add10 = makeAdder(10);
      add10(5)
    `,
    iterations: 10000,
  },
  {
    name: "Objects + Destructuring",
    code: `
      let obj = { a: 1, b: 2, c: { d: 4 } };
      let { a, c: { d } } = obj;
      a + d
    `,
    iterations: 10000,
  },
  {
    name: "Classes + Fields",
    code: `
      class Box {
        static count = 0;
        #value = 1;
        constructor(v) { this.#value = v; }
        get value() { return this.#value; }
        static { Box.count = Box.count + 1; }
      }
      new Box(2).value
    `,
    iterations: 6000,
  },
  {
    name: "Optional Chaining + Template",
    code: "obj?.value?.() + `${1 + 2}`",
    iterations: 15000,
  },
];

const DEFAULT_RUNS = 12;
const DEFAULT_WARMUP = 2;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx] ?? 0;
}

function summarize(iterations: number, runs: number[]): RunStats {
  const sorted = runs.slice().sort((a, b) => a - b);
  const total = runs.reduce((sum, value) => sum + value, 0);
  const meanMs = runs.length ? total / runs.length : 0;
  const medianMs = percentile(sorted, 0.5);
  const p95Ms = percentile(sorted, 0.95);
  const minMs = sorted[0] ?? 0;
  const maxMs = sorted[sorted.length - 1] ?? 0;
  // Use median for ops/sec to reduce noise from GC spikes.
  const opsPerSecond = medianMs > 0 ? (iterations / medianMs) * 1000 : 0;
  return { minMs, maxMs, meanMs, medianMs, p95Ms, opsPerSecond };
}

function runSample(sample: Sample, runs: number, warmup: number): RunStats {
  for (let i = 0; i < warmup; i++) {
    for (let j = 0; j < sample.iterations; j++) {
      parseModule(sample.code);
    }
  }

  const timings: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    for (let j = 0; j < sample.iterations; j++) {
      parseModule(sample.code);
    }
    timings.push(performance.now() - start);
  }

  return summarize(sample.iterations, timings);
}

function formatStats(stats: RunStats): string {
  return `min ${stats.minMs.toFixed(2)}ms | p50 ${stats.medianMs.toFixed(2)}ms | p95 ${stats.p95Ms.toFixed(2)}ms | mean ${stats.meanMs.toFixed(2)}ms | max ${stats.maxMs.toFixed(2)}ms | ${stats.opsPerSecond.toFixed(0)} ops/sec`;
}

const runsArg = Number.parseInt(process.argv[2] ?? "", 10);
const warmupArg = Number.parseInt(process.argv[3] ?? "", 10);
const runs = Number.isFinite(runsArg) && runsArg > 0 ? runsArg : DEFAULT_RUNS;
const warmup = Number.isFinite(warmupArg) && warmupArg >= 0 ? warmupArg : DEFAULT_WARMUP;

console.log("========================================");
console.log("PARSER MICRO-BENCHMARK (parseModule)");
console.log("========================================");
console.log(`Runs: ${runs}  Warmup: ${warmup}`);

for (const sample of samples) {
  const stats = runSample(sample, runs, warmup);
  console.log(`\n${sample.name}`);
  console.log(`  iterations: ${sample.iterations}`);
  console.log(`  ${formatStats(stats)}`);
}
