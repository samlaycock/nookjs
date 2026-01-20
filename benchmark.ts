/**
 * Performance Benchmark Suite
 *
 * Compares the interpreter's performance against Bun's native JavaScript execution.
 * Tests various operations to identify performance characteristics and bottlenecks.
 */

import { Interpreter } from "./src/interpreter";

/**
 * Benchmark result for a single test
 */
interface BenchmarkResult {
  name: string;
  interpreterTime: number; // milliseconds
  nativeTime: number; // milliseconds
  slowdownFactor: number; // interpreter / native
  opsPerSecond: {
    interpreter: number;
    native: number;
  };
}

/**
 * Run a benchmark comparing interpreter vs native execution
 */
function benchmark(
  name: string,
  code: string,
  iterations: number = 1000,
  globals?: Record<string, any>,
): BenchmarkResult {
  // Warm up both systems
  new Interpreter({ globals }).evaluate(code);
  eval(code);

  // Benchmark interpreter - create new interpreter for each iteration to avoid state pollution
  const interpreterStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const interpreter = new Interpreter({ globals });
    interpreter.evaluate(code);
  }
  const interpreterEnd = performance.now();
  const interpreterTime = interpreterEnd - interpreterStart;

  // Benchmark native
  const nativeStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    eval(code);
  }
  const nativeEnd = performance.now();
  const nativeTime = nativeEnd - nativeStart;

  // Calculate results
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

/**
 * Format a benchmark result for display
 */
function formatResult(result: BenchmarkResult): string {
  const slowdown = result.slowdownFactor.toFixed(2);
  const interpreterOps = result.opsPerSecond.interpreter.toFixed(0);
  const nativeOps = result.opsPerSecond.native.toFixed(0);

  return `
${result.name}:
  Interpreter: ${result.interpreterTime.toFixed(2)}ms (${interpreterOps} ops/sec)
  Native:      ${result.nativeTime.toFixed(2)}ms (${nativeOps} ops/sec)
  Slowdown:    ${slowdown}x`;
}

/**
 * Format summary statistics
 */
function formatSummary(results: BenchmarkResult[]): string {
  const avgSlowdown = results.reduce((sum, r) => sum + r.slowdownFactor, 0) / results.length;
  const minSlowdown = Math.min(...results.map((r) => r.slowdownFactor));
  const maxSlowdown = Math.max(...results.map((r) => r.slowdownFactor));

  const fastest = results.reduce((min, r) => (r.slowdownFactor < min.slowdownFactor ? r : min));
  const slowest = results.reduce((max, r) => (r.slowdownFactor > max.slowdownFactor ? r : max));

  return `
========================================
SUMMARY
========================================
Average slowdown: ${avgSlowdown.toFixed(2)}x
Range: ${minSlowdown.toFixed(2)}x - ${maxSlowdown.toFixed(2)}x

Fastest: ${fastest.name} (${fastest.slowdownFactor.toFixed(2)}x)
Slowest: ${slowest.name} (${slowest.slowdownFactor.toFixed(2)}x)
`;
}

// ============================================================================
// BENCHMARK SUITE
// ============================================================================

console.log("========================================");
console.log("INTERPRETER PERFORMANCE BENCHMARK");
console.log("========================================\n");

const results: BenchmarkResult[] = [];

// Arithmetic Operations
console.log("--- Arithmetic Operations ---");

results.push(benchmark("Simple Addition", "2 + 3", 10000));

results.push(benchmark("Complex Arithmetic", "(10 + 5) * 3 - 8 / 2 + 15 % 4", 10000));

results.push(benchmark("Exponentiation", "2 ** 10", 10000));

results.forEach((r) => console.log(formatResult(r)));

// Variable Operations
console.log("\n--- Variable Operations ---");

results.push(benchmark("Variable Declaration", "let x = 42", 10000));

results.push(benchmark("Variable Assignment", "let x = 10; x = 20", 10000));

results.push(benchmark("Multiple Variables", "let a = 1; let b = 2; let c = 3; a + b + c", 10000));

results.forEach((r) => console.log(formatResult(r)));

// Control Flow
console.log("\n--- Control Flow ---");

results.push(benchmark("Simple If Statement", "let x = 10; if (x > 5) { x = x * 2; }", 10000));

results.push(
  benchmark(
    "If/Else Chain",
    `let x = 15;
   if (x < 10) { x = 1; }
   else if (x < 20) { x = 2; }
   else { x = 3; }`,
    10000,
  ),
);

results.push(benchmark("Ternary Operator", "let x = 10; let y = x > 5 ? 100 : 50", 10000));

results.forEach((r) => console.log(formatResult(r)));

// Loops
console.log("\n--- Loops ---");

results.push(
  benchmark(
    "For Loop (small)",
    `let sum = 0;
   for (let i = 0; i < 10; i++) {
     sum = sum + i;
   }`,
    5000,
  ),
);

results.push(
  benchmark(
    "While Loop",
    `let sum = 0;
   let i = 0;
   while (i < 10) {
     sum = sum + i;
     i = i + 1;
   }`,
    5000,
  ),
);

results.push(
  benchmark(
    "for...of Loop",
    `let arr = [1, 2, 3, 4, 5];
   let sum = 0;
   for (let num of arr) {
     sum = sum + num;
   }`,
    5000,
  ),
);

results.forEach((r) => console.log(formatResult(r)));

// Functions
console.log("\n--- Functions ---");

results.push(benchmark("Function Declaration", "function add(a, b) { return a + b; }", 10000));

results.push(
  benchmark(
    "Function Call",
    `function add(a, b) { return a + b; }
   add(10, 20)`,
    5000,
  ),
);

results.push(
  benchmark(
    "Recursive Factorial",
    `function factorial(n) {
     if (n <= 1) return 1;
     return n * factorial(n - 1);
   }
   factorial(5)`,
    5000,
  ),
);

results.push(
  benchmark(
    "Closure",
    `function makeCounter() {
     let count = 0;
     function increment() {
       count = count + 1;
       return count;
     }
     return increment;
   }
   let counter = makeCounter();
   counter();
   counter()`,
    5000,
  ),
);

results.push(benchmark("Arrow Function", "let double = x => x * 2; double(21)", 5000));

results.forEach((r) => console.log(formatResult(r)));

// Arrays
console.log("\n--- Arrays ---");

results.push(benchmark("Array Creation", "let arr = [1, 2, 3, 4, 5]", 10000));

results.push(benchmark("Array Access", "let arr = [10, 20, 30]; arr[1]", 10000));

results.push(benchmark("Array Assignment", "let arr = [1, 2, 3]; arr[1] = 99", 10000));

results.push(
  benchmark(
    "Array Iteration",
    `let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   let sum = 0;
   for (let i = 0; i < arr.length; i++) {
     sum = sum + arr[i];
   }`,
    5000,
  ),
);

results.forEach((r) => console.log(formatResult(r)));

// Objects
console.log("\n--- Objects ---");

results.push(benchmark("Object Creation", "let obj = { x: 10, y: 20, z: 30 }", 10000));

results.push(benchmark("Object Property Access", "let obj = { x: 10, y: 20 }; obj.x", 10000));

results.push(benchmark("Object Property Assignment", "let obj = { x: 10 }; obj.x = 20", 10000));

results.push(
  benchmark(
    "Object Method Call",
    `let obj = {
     value: 0,
     increment: function() {
       this.value = this.value + 1;
       return this.value;
     }
   };
   obj.increment()`,
    5000,
  ),
);

results.forEach((r) => console.log(formatResult(r)));

// Strings
console.log("\n--- Strings ---");

results.push(benchmark("String Concatenation", '"hello" + " " + "world"', 10000));

results.push(benchmark("String Length", '"hello world".length', 10000));

results.forEach((r) => console.log(formatResult(r)));

// typeof Operator
console.log("\n--- typeof Operator ---");

results.push(benchmark("typeof Number", "typeof 42", 10000));

results.push(benchmark("typeof Variable", "let x = 10; typeof x", 10000));

results.forEach((r) => console.log(formatResult(r)));

// Logical Operators
console.log("\n--- Logical Operators ---");

results.push(benchmark("Logical AND", "true && false", 10000));

results.push(benchmark("Logical OR", "false || true", 10000));

results.push(benchmark("Logical NOT", "!true", 10000));

results.forEach((r) => console.log(formatResult(r)));

// Complex Scenarios
console.log("\n--- Complex Scenarios ---");

results.push(
  benchmark(
    "Fibonacci (iterative)",
    `function fib(n) {
     let a = 0;
     let b = 1;
     for (let i = 0; i < n; i++) {
       let temp = a;
       a = b;
       b = temp + b;
     }
     return a;
   }
   fib(10)`,
    2000,
  ),
);

results.push(
  benchmark(
    "Prime Check",
    `function isPrime(n) {
     if (n <= 1) return false;
     for (let i = 2; i * i <= n; i++) {
       if (n % i === 0) return false;
     }
     return true;
   }
   isPrime(17)`,
    2000,
  ),
);

results.push(
  benchmark(
    "Array Sum with Higher-Order Function",
    `function reduce(arr, fn, init) {
     let acc = init;
     for (let i = 0; i < arr.length; i++) {
       acc = fn(acc, arr[i]);
     }
     return acc;
   }
   let arr = [1, 2, 3, 4, 5];
   reduce(arr, (a, b) => a + b, 0)`,
    2000,
  ),
);

results.push(
  benchmark(
    "Nested Object Processing",
    `let data = [
     { name: "Alice", scores: [85, 90, 95] },
     { name: "Bob", scores: [70, 75, 80] },
     { name: "Charlie", scores: [90, 95, 100] }
   ];
   let totalAvg = 0;
   for (let person of data) {
     let sum = 0;
     for (let score of person.scores) {
       sum = sum + score;
     }
     totalAvg = totalAvg + (sum / person.scores.length);
   }
   totalAvg / data.length`,
    1000,
  ),
);

results.forEach((r) => console.log(formatResult(r)));

// Print summary
console.log(formatSummary(results));

// Export results as JSON for further analysis
const jsonOutput = {
  timestamp: new Date().toISOString(),
  runtime: "Bun",
  version: Bun.version,
  results: results,
};

console.log("\nWriting results to benchmark-results.json...");
await Bun.write("benchmark-results.json", JSON.stringify(jsonOutput, null, 2));
console.log("Done!");
