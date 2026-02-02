import { spawn } from "bun";

const suites = [
  { name: "Interpreter", file: "interpreter.ts" },
  { name: "Async/Promise", file: "async.ts" },
  { name: "Parser Compare", file: "parser-compare.ts" },
  { name: "Parser Micro", file: "parser-micro.ts" },
  { name: "Parser Profile", file: "parser-profile.ts" },
];

console.log("========================================");
console.log("FULL BENCHMARK SUITE");
console.log("========================================\n");

const start = performance.now();

for (const suite of suites) {
  console.log(`\n--- ${suite.name} ---\n`);
  const proc = spawn({
    cmd: ["bun", `benchmarks/${suite.file}`],
    cwd: "/Users/samuellaycock/Development/nookjs",
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

const total = performance.now() - start;
console.log(`\n========================================`);
console.log(`Total time: ${(total / 1000).toFixed(2)}s`);
console.log("========================================");
