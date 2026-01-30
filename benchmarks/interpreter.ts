/**
 * Performance Benchmark Suite
 *
 * Compares the interpreter's performance against Bun's native JavaScript execution.
 * Tests various operations to identify performance characteristics and bottlenecks.
 */

import { Interpreter } from "../src/interpreter";
import { formatTable, formatSummary } from "./shared/format";
import type { ComparisonResult } from "./shared/format";

interface BenchmarkResult {
  name: string;
  interpreterTime: number;
  nativeTime: number;
  slowdownFactor: number;
  opsPerSecond: {
    interpreter: number;
    native: number;
  };
}

function benchmark(
  name: string,
  code: string,
  iterations: number = 1000,
  globals?: Record<string, any>,
): BenchmarkResult {
  new Interpreter({ globals }).evaluate(code);
  eval(code);

  const interpreterStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const interpreter = new Interpreter({ globals });
    interpreter.evaluate(code);
  }
  const interpreterTime = performance.now() - interpreterStart;

  const nativeStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    eval(code);
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
  { name: "Simple Addition", code: "2 + 3", iterations: 10000 },
  { name: "Complex Arithmetic", code: "(10 + 5) * 3 - 8 / 2 + 15 % 4", iterations: 10000 },
  { name: "Exponentiation", code: "2 ** 10", iterations: 10000 },
  { name: "Variable Declaration", code: "let x = 42", iterations: 10000 },
  { name: "Variable Assignment", code: "let x = 10; x = 20", iterations: 10000 },
  { name: "Multiple Variables", code: "let a = 1; let b = 2; let c = 3; a + b + c", iterations: 10000 },
  { name: "Simple If Statement", code: "let x = 10; if (x > 5) { x = x * 2; }", iterations: 10000 },
  { name: "If/Else Chain", code: "let x = 15; if (x < 10) { x = 1; } else if (x < 20) { x = 2; } else { x = 3; }", iterations: 10000 },
  { name: "Ternary Operator", code: "let x = 10; let y = x > 5 ? 100 : 50", iterations: 10000 },
  { name: "For Loop (small)", code: "let sum = 0; for (let i = 0; i < 10; i++) { sum = sum + i; }", iterations: 5000 },
  { name: "While Loop", code: "let sum = 0; let i = 0; while (i < 10) { sum = sum + i; i = i + 1; }", iterations: 5000 },
  { name: "for...of Loop", code: "let arr = [1, 2, 3, 4, 5]; let sum = 0; for (let num of arr) { sum = sum + num; }", iterations: 5000 },
  { name: "Function Declaration", code: "function add(a, b) { return a + b; }", iterations: 10000 },
  { name: "Function Call", code: "function add(a, b) { return a + b; } add(10, 20)", iterations: 5000 },
  { name: "Recursive Factorial", code: "function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); } factorial(5)", iterations: 5000 },
  { name: "Closure", code: "function makeCounter() { let count = 0; function increment() { count = count + 1; return count; } return increment; } let counter = makeCounter(); counter(); counter()", iterations: 5000 },
  { name: "Arrow Function", code: "let double = x => x * 2; double(21)", iterations: 5000 },
  { name: "Array Creation", code: "let arr = [1, 2, 3, 4, 5]", iterations: 10000 },
  { name: "Array Access", code: "let arr = [10, 20, 30]; arr[1]", iterations: 10000 },
  { name: "Array Assignment", code: "let arr = [1, 2, 3]; arr[1] = 99", iterations: 10000 },
  { name: "Array Iteration", code: "let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; let sum = 0; for (let i = 0; i < arr.length; i++) { sum = sum + arr[i]; }", iterations: 5000 },
  { name: "Object Creation", code: "let obj = { x: 10, y: 20, z: 30 }", iterations: 10000 },
  { name: "Object Property Access", code: "let obj = { x: 10, y: 20 }; obj.x", iterations: 10000 },
  { name: "Object Property Assignment", code: "let obj = { x: 10 }; obj.x = 20", iterations: 10000 },
  { name: "Object Method Call", code: "let obj = { value: 0, increment: function() { this.value = this.value + 1; return this.value; } }; obj.increment()", iterations: 5000 },
  { name: "String Concatenation", code: '"hello" + " " + "world"', iterations: 10000 },
  { name: "String Length", code: '"hello world".length', iterations: 10000 },
  { name: "typeof Number", code: "typeof 42", iterations: 10000 },
  { name: "typeof Variable", code: "let x = 10; typeof x", iterations: 10000 },
  { name: "Logical AND", code: "true && false", iterations: 10000 },
  { name: "Logical OR", code: "false || true", iterations: 10000 },
  { name: "Logical NOT", code: "!true", iterations: 10000 },
  { name: "Fibonacci (iterative)", code: "function fib(n) { let a = 0; let b = 1; for (let i = 0; i < n; i++) { let temp = a; a = b; b = temp + b; } return a; } fib(10)", iterations: 2000 },
  { name: "Prime Check", code: "function isPrime(n) { if (n <= 1) return false; for (let i = 2; i * i <= n; i++) { if (n % i === 0) return false; } return true; } isPrime(17)", iterations: 2000 },
  { name: "Array Sum with Higher-Order Function", code: "function reduce(arr, fn, init) { let acc = init; for (let i = 0; i < arr.length; i++) { acc = fn(acc, arr[i]); } return acc; } let arr = [1, 2, 3, 4, 5]; reduce(arr, (a, b) => a + b, 0)", iterations: 2000 },
  { name: "Nested Object Processing", code: "let data = [{ name: \"Alice\", scores: [85, 90, 95] }, { name: \"Bob\", scores: [70, 75, 80] }, { name: \"Charlie\", scores: [90, 95, 100] }]; let totalAvg = 0; for (let person of data) { let sum = 0; for (let score of person.scores) { sum = sum + score; } totalAvg = totalAvg + (sum / person.scores.length); } totalAvg / data.length", iterations: 1000 },
];

console.log("========================================");
console.log("INTERPRETER PERFORMANCE BENCHMARK");
console.log("========================================\n");

const results: BenchmarkResult[] = benchmarkCases.map((c) => benchmark(c.name, c.code, c.iterations));

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
  results: results,
};

console.log("Writing results to benchmark-results.json...");
await Bun.write("benchmark-results.json", JSON.stringify(jsonOutput, null, 2));
console.log("Done!");
