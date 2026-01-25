import { parseModule } from "./src/ast";

const { parseModule: parseMeriyah } = await import("meriyah");

interface ParseBenchmarkResult {
  name: string;
  iterations: number;
  oursMs: number;
  meriyahMs: number;
  slowdown: number;
  opsPerSecond: {
    ours: number;
    meriyah: number;
  };
}

const samples: { name: string; code: string; iterations: number }[] = [
  { name: "Tiny Expression", code: "2 + 3", iterations: 20000 },
  {
    name: "Arithmetic + Variables",
    code: "let a = 1; let b = 2; let c = a + b * 3; c",
    iterations: 10000,
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
    iterations: 5000,
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
    iterations: 5000,
  },
  {
    name: "Objects + Destructuring",
    code: `
      let obj = { a: 1, b: 2, c: { d: 4 } };
      let { a, c: { d } } = obj;
      a + d
    `,
    iterations: 5000,
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
    iterations: 3000,
  },
  {
    name: "Optional Chaining + Template",
    code: "obj?.value?.() + `${1 + 2}`",
    iterations: 8000,
  },
];

function runParseBenchmark(name: string, code: string, iterations: number): ParseBenchmarkResult {
  parseModule(code);
  parseMeriyah(code, { next: true });

  const oursStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    parseModule(code);
  }
  const oursMs = performance.now() - oursStart;

  const meriyahStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    parseMeriyah(code, { next: true });
  }
  const meriyahMs = performance.now() - meriyahStart;

  const slowdown = oursMs / meriyahMs;
  return {
    name,
    iterations,
    oursMs,
    meriyahMs,
    slowdown,
    opsPerSecond: {
      ours: (iterations / oursMs) * 1000,
      meriyah: (iterations / meriyahMs) * 1000,
    },
  };
}

function formatResult(result: ParseBenchmarkResult): string {
  return `
${result.name}:
  Ours:    ${result.oursMs.toFixed(2)}ms (${result.opsPerSecond.ours.toFixed(0)} ops/sec)
  Meriyah: ${result.meriyahMs.toFixed(2)}ms (${result.opsPerSecond.meriyah.toFixed(0)} ops/sec)
  Slowdown: ${result.slowdown.toFixed(2)}x`;
}

console.log("========================================");
console.log("PARSER PERFORMANCE BENCHMARK");
console.log("========================================\n");

const results: ParseBenchmarkResult[] = [];
for (const sample of samples) {
  results.push(runParseBenchmark(sample.name, sample.code, sample.iterations));
}

for (const result of results) {
  console.log(formatResult(result));
}

const average = results.reduce((sum, result) => sum + result.slowdown, 0) / results.length;
console.log("\nAverage slowdown:", average.toFixed(2) + "x");
