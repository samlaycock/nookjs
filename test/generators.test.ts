import { describe, test, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Generator Functions", () => {
  describe("Basic sync generators", () => {
    test("simple generator with yield", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("generator returns done: true when exhausted", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        g.next(); // value: 1, done: false
        const final = g.next(); // value: undefined, done: true
        final.done;
      `);
      expect(result).toBe(true);
    });

    test("generator with return statement", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          return 42;
          yield 2; // never reached
        }
        const g = gen();
        const first = g.next();
        const second = g.next();
        second.value;
      `);
      expect(result).toBe(42);
    });

    test("generator without yields returns immediately", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          return 10;
        }
        const g = gen();
        const r = g.next();
        r.value;
      `);
      expect(result).toBe(10);
    });

    test("generator with expression yield", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1 + 1;
          yield 2 * 3;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([2, 6]);
    });
  });

  describe("Generator with parameters", () => {
    test("generator accepts parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* range(start, end) {
          yield start;
          yield start + 1;
          yield end;
        }
        const g = range(5, 10);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([5, 6, 10]);
    });

    test("generator with rest parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* yieldAll(...values) {
          yield values[0];
          yield values[1];
          yield values[2];
        }
        const g = yieldAll(10, 20, 30);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe("Generator with control flow", () => {
    test("generator with if statement", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* conditional(flag) {
          if (flag) {
            yield 1;
          } else {
            yield 2;
          }
          yield 3;
        }
        const g1 = conditional(true);
        const g2 = conditional(false);
        const results = [];
        results.push(g1.next().value);
        results.push(g1.next().value);
        results.push(g2.next().value);
        results.push(g2.next().value);
        results;
      `);
      expect(result).toEqual([1, 3, 2, 3]);
    });

    test("generator with for loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* counter(max) {
          for (var i = 0; i < max; i++) {
            yield i;
          }
        }
        const g = counter(3);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([0, 1, 2]);
    });

    test("generator with while loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* countdown(n) {
          while (n > 0) {
            yield n;
            n = n - 1;
          }
        }
        const g = countdown(3);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([3, 2, 1]);
    });
  });

  describe("Generator expressions", () => {
    test("generator function expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const gen = function*() {
          yield 1;
          yield 2;
        };
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2]);
    });

    test("named generator function expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const gen = function* myGen() {
          yield 42;
        };
        const g = gen();
        g.next().value;
      `);
      expect(result).toBe(42);
    });
  });

  describe("Generator state management", () => {
    test("multiple generator instances are independent", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
        }
        const g1 = gen();
        const g2 = gen();
        const results = [];
        results.push(g1.next().value); // 1 from g1
        results.push(g2.next().value); // 1 from g2
        results.push(g1.next().value); // 2 from g1
        results.push(g2.next().value); // 2 from g2
        results;
      `);
      expect(result).toEqual([1, 1, 2, 2]);
    });

    test("generator maintains closure state", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* counter() {
          var count = 0;
          while (true) {
            count = count + 1;
            yield count;
            if (count >= 3) return;
          }
        }
        const g = counter();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("Async generators", () => {
    test("simple async generator", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = asyncGen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("async generator with await", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncValue: async () => 42,
        },
      });
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          const val = await asyncValue();
          yield val;
          yield val + 1;
        }
        const g = asyncGen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([42, 43]);
    });

    test("async generator returns done: true when exhausted", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          yield 1;
        }
        const g = asyncGen();
        await g.next(); // value: 1, done: false
        const final = await g.next(); // value: undefined, done: true
        final.done;
      `);
      expect(result).toBe(true);
    });
  });

  describe("Generator methods", () => {
    test("generator.return() completes generator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        g.next(); // 1
        const returnResult = g.return(99);
        const after = g.next();
        returnResult.done && after.done;
      `);
      expect(result).toBe(true);
    });

    test("generator.return() returns provided value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        const returnResult = g.return(42);
        returnResult.value;
      `);
      expect(result).toBe(42);
    });

    test("generator.throw() throws error", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function* gen() {
            yield 1;
          }
          const g = gen();
          g.throw("error");
        `);
      }).toThrow();
    });
  });

  describe("Error handling", () => {
    test("cannot use yield outside generator", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function notAGenerator() {
            yield 1;
          }
          notAGenerator();
        `);
      }).toThrow();
    });

    test("cannot call async generator in sync mode", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          async function* asyncGen() {
            yield 1;
          }
          asyncGen();
        `);
      }).toThrow("Cannot call async generator in synchronous evaluate");
    });
  });
});
