import { Interpreter, ts } from "../src/index";

const asyncInterpreter = new Interpreter({
  globals: {
    fetchData: async (id: number) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Data for ID ${id}`), 10);
      });
    },
    asyncDouble: async (x: number) => x * 2,
  },
});

await asyncInterpreter.evaluateAsync(ts`fetchData(42)`);
await asyncInterpreter.evaluateAsync(ts`asyncDouble(5) + asyncDouble(10)`);

const complexAsyncInterpreter = new Interpreter({
  globals: {
    asyncGetUser: async (id: number) => ({
      id,
      name: `User${id}`,
      active: true,
    }),
    asyncCalculate: async (a: number, b: number) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(a * b + 10), 5);
      });
    },
  },
});

await complexAsyncInterpreter.evaluateAsync(ts`
    let user = asyncGetUser(123);
    user.name
  `);

await complexAsyncInterpreter.evaluateAsync(ts`
    asyncCalculate(5, asyncCalculate(2, 3))
  `);

const asyncLoopInterpreter = new Interpreter({
  globals: {
    asyncIncrement: async (x: number) => x + 1,
  },
});

await asyncLoopInterpreter.evaluateAsync(ts`
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum = sum + asyncIncrement(i);
    }
    sum
  `);

await asyncLoopInterpreter.evaluateAsync(ts`
    let result;
    if (asyncIncrement(5) > 5) {
      result = "greater";
    } else {
      result = "not greater";
    }
    result
  `);

const mixedAsyncInterpreter = new Interpreter({
  globals: {
    syncAdd: (a: number, b: number) => a + b,
    asyncMultiply: async (a: number, b: number) => a * b,
  },
});

await mixedAsyncInterpreter.evaluateAsync(ts`
    asyncMultiply(syncAdd(2, 3), syncAdd(4, 6))
  `);

const sandboxAsyncInterpreter = new Interpreter();

await sandboxAsyncInterpreter.evaluateAsync(ts`
    async function getData() {
      return 42;
    }
    async function process() {
      let data = await getData();
      return data * 2;
    }
    process()
  `);

await sandboxAsyncInterpreter.evaluateAsync(ts`
    async function fetchUser(id) {
      return { id: id, name: "User" + id, active: true };
    }
    async function getUsername(id) {
      let user = await fetchUser(id);
      return user.name;
    }
    getUsername(123)
  `);

const mixedSandboxInterpreter = new Interpreter({
  globals: {
    asyncFetch: async (id: number) => `Data${id}`,
  },
});

await mixedSandboxInterpreter.evaluateAsync(ts`
    async function processData(id) {
      let data = await asyncFetch(id);
      return data + " processed";
    }
    processData(999)
  `);

await sandboxAsyncInterpreter.evaluateAsync(ts`
    let asyncDouble = async (x) => x * 2;
    let asyncProcess = async (x) => {
      let doubled = await asyncDouble(x);
      return doubled + 10;
    };
    asyncProcess(5)
  `);

await mixedSandboxInterpreter.evaluateAsync(ts`
    async function increment(x) {
      return x + 1;
    }
    async function sumSequence() {
      let sum = 0;
      for (let i = 0; i < 5; i++) {
        sum = sum + (await increment(i));
      }
      return sum;
    }
    sumSequence()
  `);

await mixedSandboxInterpreter.evaluateAsync(ts`
    async function check(x) {
      return x > 10;
    }
    async function classify(x) {
      if (await check(x)) {
        return "big";
      } else {
        return "small";
      }
    }
    classify(15)
  `);
