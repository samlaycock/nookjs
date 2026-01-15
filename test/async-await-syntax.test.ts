import { describe, expect, it } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Async/Await Syntax", () => {
  describe("Async function declarations", () => {
    it("should declare async functions", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync(`
        async function test() {
          return 42;
        }
      `);
      // Function should be declared
      const result = await interpreter.evaluateAsync("test()");
      expect(result).toBe(42);
    });

    it("should handle async functions with parameters", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function add(a, b) {
          return a + b;
        }
        add(10, 20)
      `);
      expect(result).toBe(30);
    });

    it("should handle async functions with local variables", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function calculate() {
          let x = 10;
          let y = 20;
          return x + y;
        }
        calculate()
      `);
      expect(result).toBe(30);
    });
  });

  describe("Async function expressions", () => {
    it("should handle async function expressions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let func = async function() {
          return 100;
        };
        func()
      `);
      expect(result).toBe(100);
    });

    it("should handle async function expressions with params", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let multiply = async function(a, b) {
          return a * b;
        };
        multiply(6, 7)
      `);
      expect(result).toBe(42);
    });
  });

  describe("Async arrow functions", () => {
    it("should handle async arrow functions with expression body", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let double = async (x) => x * 2;
        double(21)
      `);
      expect(result).toBe(42);
    });

    it("should handle async arrow functions with block body", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let calculate = async (x) => {
          let result = x * 2;
          return result + 10;
        };
        calculate(5)
      `);
      expect(result).toBe(20);
    });
  });

  describe("Await expressions", () => {
    it("should await async host functions", async () => {
      const asyncGetValue = async () => 42;
      const interpreter = new Interpreter({
        globals: { asyncGetValue },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          let value = await asyncGetValue();
          return value;
        }
        test()
      `);
      expect(result).toBe(42);
    });

    it("should await async host functions with arguments", async () => {
      const asyncAdd = async (a: number, b: number) => a + b;
      const interpreter = new Interpreter({
        globals: { asyncAdd },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          let result = await asyncAdd(10, 20);
          return result;
        }
        test()
      `);
      expect(result).toBe(30);
    });

    it("should await multiple async host functions", async () => {
      const asyncDouble = async (x: number) => x * 2;
      const asyncTriple = async (x: number) => x * 3;
      const interpreter = new Interpreter({
        globals: { asyncDouble, asyncTriple },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          let a = await asyncDouble(5);
          let b = await asyncTriple(4);
          return a + b;
        }
        test()
      `);
      expect(result).toBe(22); // 10 + 12
    });

    it("should await async sandbox functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function getData() {
          return 100;
        }
        async function process() {
          let data = await getData();
          return data * 2;
        }
        process()
      `);
      expect(result).toBe(200);
    });

    it("should handle nested async calls", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function getBase() {
          return 10;
        }
        async function double(x) {
          return x * 2;
        }
        async function calculate() {
          let base = await getBase();
          let result = await double(base);
          return result;
        }
        calculate()
      `);
      expect(result).toBe(20);
    });

    it("should await in expressions", async () => {
      const asyncGetValue = async (x: number) => x;
      const interpreter = new Interpreter({
        globals: { asyncGetValue },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          return (await asyncGetValue(10)) + (await asyncGetValue(20));
        }
        test()
      `);
      expect(result).toBe(30);
    });
  });

  describe("Async functions in control flow", () => {
    it("should use await in if statements", async () => {
      const asyncCheck = async (x: number) => x > 10;
      const interpreter = new Interpreter({
        globals: { asyncCheck },
      });
      const result = await interpreter.evaluateAsync(`
        async function test(val) {
          if (await asyncCheck(val)) {
            return "big";
          } else {
            return "small";
          }
        }
        test(15)
      `);
      expect(result).toBe("big");
    });

    it("should use await in loops", async () => {
      const asyncIncrement = async (x: number) => x + 1;
      const interpreter = new Interpreter({
        globals: { asyncIncrement },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          let sum = 0;
          for (let i = 0; i < 3; i++) {
            sum = sum + (await asyncIncrement(i));
          }
          return sum;
        }
        test()
      `);
      expect(result).toBe(6); // 1 + 2 + 3
    });

    it("should use await in while loops", async () => {
      const asyncGetNext = async (x: number) => x + 1;
      const interpreter = new Interpreter({
        globals: { asyncGetNext },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          let i = 0;
          let sum = 0;
          while (i < 3) {
            sum = sum + i;
            i = await asyncGetNext(i);
          }
          return sum;
        }
        test()
      `);
      expect(result).toBe(3); // 0 + 1 + 2
    });
  });

  describe("Mixed sync and async functions", () => {
    it("should call sync functions from async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function syncDouble(x) {
          return x * 2;
        }
        async function asyncProcess() {
          let value = syncDouble(10);
          return value + 5;
        }
        asyncProcess()
      `);
      expect(result).toBe(25);
    });

    it("should call async functions from async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function asyncDouble(x) {
          return x * 2;
        }
        async function asyncProcess() {
          let value = await asyncDouble(10);
          return value + 5;
        }
        asyncProcess()
      `);
      expect(result).toBe(25);
    });

    it("should mix sync host functions and async sandbox functions", async () => {
      const syncAdd = (a: number, b: number) => a + b;
      const interpreter = new Interpreter({
        globals: { syncAdd },
      });
      const result = await interpreter.evaluateAsync(`
        async function process() {
          let a = syncAdd(5, 10);
          let b = syncAdd(3, 7);
          return a + b;
        }
        process()
      `);
      expect(result).toBe(25);
    });
  });

  describe("Error handling with async/await", () => {
    it("should throw error when calling async function in sync mode", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          async function test() {
            return 42;
          }
          test()
        `);
      }).toThrow(
        "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
      );
    });

    it("should throw error when calling async sandbox function in sync mode", () => {
      const interpreter = new Interpreter();
      // First declare the async function in async mode
      interpreter.evaluateAsync(`
        async function asyncFunc() {
          return 42;
        }
      `);
      // Then try to call it in sync mode
      expect(() => {
        interpreter.evaluate("asyncFunc()");
      }).toThrow(
        "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
      );
    });

    it("should propagate errors from async sandbox functions", async () => {
      const interpreter = new Interpreter();
      expect(
        interpreter.evaluateAsync(`
          async function throwError() {
            let x = undefinedVar;
            return x;
          }
          throwError()
        `),
      ).rejects.toThrow("Undefined variable 'undefinedVar'");
    });
  });

  describe("Async function closures", () => {
    it("should handle closures in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function makeCounter() {
          let count = 0;
          return async function() {
            count = count + 1;
            return count;
          };
        }
        async function test() {
          let counter = await makeCounter();
          let a = await counter();
          let b = await counter();
          let c = await counter();
          return c;
        }
        test()
      `);
      expect(result).toBe(3);
    });
  });

  describe("Async function return values", () => {
    it("should handle early returns in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function check(x) {
          if (x > 10) {
            return "big";
          }
          return "small";
        }
        check(15)
      `);
      expect(result).toBe("big");
    });

    it("should handle no explicit return in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function noReturn() {
          let x = 10;
        }
        noReturn()
      `);
      expect(result).toBeUndefined();
    });

    it("should handle returning objects from async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function getUser() {
          return { name: "Alice", age: 30 };
        }
        async function test() {
          let user = await getUser();
          return user.name;
        }
        test()
      `);
      expect(result).toBe("Alice");
    });
  });
});
