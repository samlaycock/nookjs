import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({
  env: "es2022",
  globals: {
    PI: 3.14159,
    E: 2.71828,
    config: {
      maxRetries: 3,
      debug: true,
    },
  },
});

const area = await sandbox.run<number>(ts`
  const radius = 10;
  PI * radius * radius
`);

const perCall = await sandbox.run<number>("multiplier * value", {
  globals: { multiplier: 5, value: 20 },
});

const merged = await sandbox.run<number>("x + y + z", {
  globals: { x: 10, y: 20, z: 30 },
});

const retries = await sandbox.run<number>(ts`
  let count = 0;
  while (count < config.maxRetries) {
    count = count + 1;
  }
  count
`);

console.log({ area, perCall, merged, retries });
