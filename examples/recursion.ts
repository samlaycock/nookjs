import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({ env: "es2022" });

const factorial = await sandbox.run<number>(ts`
  const factorial = (n) => {
    if (n <= 1) {
      return 1;
    }
    return n * factorial(n - 1);
  };
  factorial(6);
`);

const fibonacci = await sandbox.run<number>(ts`
  const fib = (n) => {
    if (n <= 1) {
      return n;
    }
    let a = 0;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b;
  };
  fib(10);
`);

const strictSandbox = createSandbox({
  env: "es2022",
  limits: {
    perRun: {
      callDepth: 25,
    },
  },
});

let depthLimitTriggered = false;
try {
  strictSandbox.runSync(ts`
    const recurse = (n) => {
      if (n === 0) {
        return 0;
      }
      return recurse(n - 1) + 1;
    };
    recurse(40);
  `);
} catch {
  depthLimitTriggered = true;
}

console.log({ factorial, fibonacci, depthLimitTriggered });
