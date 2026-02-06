import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({ env: "es2022" });

const expression = await sandbox.run<number>(ts`
  const double = (x) => x * 2;
  const add = (a, b) => a + b;
  double(5) + add(3, 7)
`);

const closure = await sandbox.run<number>(ts`
  const makeAdder = (x) => (y) => x + y;
  const add10 = makeAdder(10);
  add10(5)
`);

const higherOrder = await sandbox.run<number>(ts`
  const nums = [1, 2, 3, 4, 5];
  const squared = nums.map((x) => x * x);
  squared[3]
`);

console.log({ expression, closure, higherOrder });
