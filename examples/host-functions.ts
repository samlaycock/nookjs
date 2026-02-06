import { createSandbox, ts } from "../src/index";

const logs: string[] = [];
const sandbox = createSandbox({
  env: "es2022",
  globals: {
    double: (x: number) => x * 2,
    add: (a: number, b: number) => a + b,
    log: (message: string) => logs.push(message),
  },
});

const doubled = await sandbox.run<number>("double(5)");
const combined = await sandbox.run<number>("add(double(5), 3)");
await sandbox.run(ts`
  log("Host functions are available");
  log("combined=" + add(double(5), 3));
`);

const perCall = await sandbox.run<number>("multiply(4, 5)", {
  globals: {
    multiply: (a: number, b: number) => a * b,
  },
});

console.log({ doubled, combined, perCall, logs });
