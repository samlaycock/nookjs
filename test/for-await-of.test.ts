import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("for await...of", () => {
  describe("async generators", () => {
    test("iterates over async generator values", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        let sum = 0;
        for await (const val of gen()) {
          sum = sum + val;
        }
        sum;
      `);
      expect(result).toBe(6);
    });

    test("collects async generator values into array", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield "a";
          yield "b";
          yield "c";
        }
        const items = [];
        for await (const val of gen()) {
          items.push(val);
        }
        items;
      `);
      expect(result).toEqual(["a", "b", "c"]);
    });

    test("break in for await...of", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield 1;
          yield 2;
          yield 3;
          yield 4;
        }
        let last = 0;
        for await (const val of gen()) {
          last = val;
          if (val === 2) break;
        }
        last;
      `);
      expect(result).toBe(2);
    });
  });

  describe("sync iterables with for await", () => {
    test("for await...of over regular array", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        const items = [];
        for await (const val of [10, 20, 30]) {
          items.push(val);
        }
        items;
      `);
      expect(result).toEqual([10, 20, 30]);
    });

    test("for await...of over sync generator", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function* gen() {
          yield 1;
          yield 2;
        }
        let sum = 0;
        for await (const val of gen()) {
          sum = sum + val;
        }
        sum;
      `);
      expect(result).toBe(3);
    });
  });

  describe("destructuring in for await", () => {
    test("for await with let declaration", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield 1;
          yield 2;
        }
        let total = 0;
        for await (let val of gen()) {
          total = total + val;
        }
        total;
      `);
      expect(result).toBe(3);
    });
  });

  describe("error handling", () => {
    test("rejects for await...of in sync evaluate", () => {
      const interpreter = new Interpreter();
      expect(() =>
        interpreter.evaluate(`
          for await (const val of [1, 2, 3]) {}
        `),
      ).toThrow("Cannot use for await...of in synchronous evaluate()");
    });
  });

  describe("with host async iterables", () => {
    test("iterates host async generator", async () => {
      async function* hostGen() {
        yield 100;
        yield 200;
      }
      const interpreter = new Interpreter({ globals: { hostGen } });
      const result = await interpreter.evaluateAsync(`
        const items = [];
        for await (const val of hostGen()) {
          items.push(val);
        }
        items;
      `);
      expect(result).toEqual([100, 200]);
    });
  });
});
