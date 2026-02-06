import { createSandbox, ts } from "../src/index";

const logs: string[] = [];
const sandbox = createSandbox({
  env: "es2022",
  globals: {
    Math,
    console: {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    },
    api: {
      version: "1.0.0",
      calculate(x: number, y: number) {
        return x * y + 10;
      },
    },
  },
});

const mathResult = await sandbox.run<number>(ts`
  const radius = 5;
  Math.round(Math.PI * Math.pow(radius, 2))
`);

const apiResult = await sandbox.run<number>("api.calculate(5, 3)");
await sandbox.run('console.log("Hello from sandbox", api.version)');

let blockedProperty = false;
try {
  await sandbox.run("Math.constructor");
} catch {
  blockedProperty = true;
}

console.log({ mathResult, apiResult, blockedProperty, logs });
