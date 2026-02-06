import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({
  env: "es2022",
  globals: {
    fetchData: async (id: number) => {
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(id * 2), 10);
      });
    },
    asyncDouble: async (x: number) => x * 2,
  },
});

const hostAsync = await sandbox.run<number>(ts`
  async function run() {
    const data = await fetchData(21);
    return await asyncDouble(data);
  }
  run();
`);

const asyncLoop = await sandbox.run<number>(ts`
  async function run() {
    let total = 0;
    for (let i = 0; i < 4; i++) {
      total = total + (await asyncDouble(i));
    }
    return total;
  }
  run();
`);

const asyncArrow = await sandbox.run<number>(ts`
  const plusOne = async (x) => x + 1;
  async function run() {
    return await plusOne(41);
  }
  run();
`);

console.log({ hostAsync, asyncLoop, asyncArrow });
