import { describe, expect, it } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("evaluateAsync()", () => {
  describe("Async host functions", () => {
    it("should call async host function and await result", async () => {
      const asyncFunc = async () => {
        return 42;
      };
      const interpreter = new Interpreter({
        globals: { asyncFunc },
      });
      const result = await interpreter.evaluateAsync("asyncFunc()");
      expect(result).toBe(42);
    });

    it("should call async host function with arguments", async () => {
      const asyncAdd = async (a: number, b: number) => {
        return a + b;
      };
      const interpreter = new Interpreter({
        globals: { asyncAdd },
      });
      const result = await interpreter.evaluateAsync("asyncAdd(10, 20)");
      expect(result).toBe(30);
    });

    it("should handle async host function that returns promise", async () => {
      const fetchData = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("data"), 10);
        });
      };
      const interpreter = new Interpreter({
        globals: { fetchData },
      });
      const result = await interpreter.evaluateAsync("fetchData()");
      expect(result).toBe("data");
    });

    it("should propagate errors from async host functions", async () => {
      const asyncError = async () => {
        throw new Error("Async error");
      };
      const interpreter = new Interpreter({
        globals: { asyncError },
        security: { hideHostErrorMessages: false },
      });
      return expect(interpreter.evaluateAsync("asyncError()")).rejects.toThrow(
        "Host function 'asyncError' threw error: Async error",
      );
    });

    it("should handle multiple async host function calls", async () => {
      const asyncDouble = async (x: number) => x * 2;
      const asyncTriple = async (x: number) => x * 3;
      const interpreter = new Interpreter({
        globals: { asyncDouble, asyncTriple },
      });
      const result = await interpreter.evaluateAsync("asyncDouble(5) + asyncTriple(4)");
      expect(result).toBe(22); // 10 + 12
    });

    it("should handle nested async host function calls", async () => {
      const asyncAdd = async (a: number, b: number) => a + b;
      const asyncDouble = async (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { asyncAdd, asyncDouble },
      });
      const result = await interpreter.evaluateAsync("asyncDouble(asyncAdd(3, 7))");
      expect(result).toBe(20); // double(10) = 20
    });
  });

  describe("Sync host functions in async mode", () => {
    it("should call sync host functions in evaluateAsync()", async () => {
      const syncFunc = (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { syncFunc },
      });
      const result = await interpreter.evaluateAsync("syncFunc(5)");
      expect(result).toBe(10);
    });

    it("should mix sync and async host functions", async () => {
      const syncAdd = (a: number, b: number) => a + b;
      const asyncDouble = async (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { syncAdd, asyncDouble },
      });
      const result = await interpreter.evaluateAsync("asyncDouble(syncAdd(3, 7))");
      expect(result).toBe(20);
    });
  });

  describe("Basic async operations", () => {
    it("should evaluate binary expressions", async () => {
      const interpreter = new Interpreter();
      expect(await interpreter.evaluateAsync("5 + 3")).toBe(8);
      expect(await interpreter.evaluateAsync("10 - 4")).toBe(6);
      expect(await interpreter.evaluateAsync("6 * 7")).toBe(42);
      expect(await interpreter.evaluateAsync("20 / 4")).toBe(5);
    });

    it("should evaluate unary expressions", async () => {
      const interpreter = new Interpreter();
      expect(await interpreter.evaluateAsync("-5")).toBe(-5);
      expect(await interpreter.evaluateAsync("+10")).toBe(10);
      expect(await interpreter.evaluateAsync("!true")).toBe(false);
      expect(await interpreter.evaluateAsync("!false")).toBe(true);
    });

    it("should evaluate logical expressions", async () => {
      const interpreter = new Interpreter();
      expect(await interpreter.evaluateAsync("true && true")).toBe(true);
      expect(await interpreter.evaluateAsync("true && false")).toBe(false);
      expect(await interpreter.evaluateAsync("true || false")).toBe(true);
      expect(await interpreter.evaluateAsync("false || false")).toBe(false);
    });

    it("should evaluate update expressions", async () => {
      const interpreter = new Interpreter();
      expect(await interpreter.evaluateAsync("let x = 5; x++; x")).toBe(6);
      expect(await interpreter.evaluateAsync("let y = 5; ++y")).toBe(6);
      expect(await interpreter.evaluateAsync("let z = 5; z--; z")).toBe(4);
    });

    it("should evaluate variable declarations and assignments", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let x = 10");
      expect(await interpreter.evaluateAsync("x")).toBe(10);
      await interpreter.evaluateAsync("x = 20");
      expect(await interpreter.evaluateAsync("x")).toBe(20);
    });

    it("should evaluate const declarations", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("const PI = 3.14159");
      expect(await interpreter.evaluateAsync("PI")).toBe(3.14159);
    });

    it("should evaluate arrays", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("[1, 2, 3, 4, 5]");
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should evaluate objects", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("({ name: 'Alice', age: 30 })");
      expect(result).toEqual({ name: "Alice", age: 30 });
    });

    it("should evaluate member expressions", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let obj = { x: 10, y: 20 }");
      expect(await interpreter.evaluateAsync("obj.x")).toBe(10);
      expect(await interpreter.evaluateAsync("obj['y']")).toBe(20);
    });
  });

  describe("Async control flow", () => {
    it("should evaluate if statements", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let x = 10;
        if (x > 5) {
          x = 100;
        }
        x
      `);
      expect(result).toBe(100);
    });

    it("should evaluate if-else statements", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let x = 3;
        let result;
        if (x > 5) {
          result = 'big';
        } else {
          result = 'small';
        }
        result
      `);
      expect(result).toBe("small");
    });

    it("should evaluate while loops", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        let i = 1;
        while (i <= 5) {
          sum = sum + i;
          i++;
        }
        sum
      `);
      expect(result).toBe(15); // 1+2+3+4+5
    });

    it("should evaluate for loops", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        for (let i = 1; i <= 5; i++) {
          sum = sum + i;
        }
        sum
      `);
      expect(result).toBe(15);
    });

    it("should evaluate nested loops", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let total = 0;
        for (let i = 1; i <= 3; i++) {
          for (let j = 1; j <= 2; j++) {
            total = total + i * j;
          }
        }
        total
      `);
      expect(result).toBe(18); // (1*1 + 1*2) + (2*1 + 2*2) + (3*1 + 3*2)
    });
  });

  describe("Async sandbox functions", () => {
    it("should evaluate sandbox function declarations", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync(`
        function double(x) {
          return x * 2;
        }
      `);
      const result = await interpreter.evaluateAsync("double(5)");
      expect(result).toBe(10);
    });

    it("should evaluate sandbox function expressions", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync(`
        let triple = function(x) {
          return x * 3;
        };
      `);
      const result = await interpreter.evaluateAsync("triple(4)");
      expect(result).toBe(12);
    });

    it("should evaluate arrow functions", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let square = (x) => x * x");
      const result = await interpreter.evaluateAsync("square(7)");
      expect(result).toBe(49);
    });

    it("should handle closures", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function makeCounter() {
          let count = 0;
          return function() {
            count = count + 1;
            return count;
          };
        }
        let counter = makeCounter();
        counter();
        counter();
        counter()
      `);
      expect(result).toBe(3);
    });

    it("should handle recursive functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(5)
      `);
      expect(result).toBe(120);
    });
  });

  describe("Async with host functions in control flow", () => {
    it("should call async host function in if condition", async () => {
      const asyncIsPositive = async (x: number) => x > 0;
      const interpreter = new Interpreter({
        globals: { asyncIsPositive },
      });
      const result = await interpreter.evaluateAsync(`
        let x = 10;
        let result;
        if (asyncIsPositive(x)) {
          result = 'positive';
        } else {
          result = 'negative';
        }
        result
      `);
      expect(result).toBe("positive");
    });

    it("should call async host function in loop", async () => {
      const asyncDouble = async (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { asyncDouble },
      });
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        for (let i = 1; i <= 3; i++) {
          sum = sum + asyncDouble(i);
        }
        sum
      `);
      expect(result).toBe(12); // 2 + 4 + 6
    });

    it("should call async host function with array elements", async () => {
      const asyncIncrement = async (x: number) => x + 1;
      const interpreter = new Interpreter({
        globals: { asyncIncrement },
      });
      const result = await interpreter.evaluateAsync(`
        [asyncIncrement(1), asyncIncrement(2), asyncIncrement(3)]
      `);
      expect(result).toEqual([2, 3, 4]);
    });

    it("should call async host function in object properties", async () => {
      const asyncGetName = async () => "Alice";
      const asyncGetAge = async () => 30;
      const interpreter = new Interpreter({
        globals: { asyncGetName, asyncGetAge },
      });
      const result = await interpreter.evaluateAsync(`
        ({ name: asyncGetName(), age: asyncGetAge() })
      `);
      expect(result).toEqual({ name: "Alice", age: 30 });
    });
  });

  describe("Complex async scenarios", () => {
    it("should handle deeply nested async calls", async () => {
      const asyncAdd = async (a: number, b: number) => a + b;
      const asyncMult = async (a: number, b: number) => a * b;
      const interpreter = new Interpreter({
        globals: { asyncAdd, asyncMult },
      });
      const result = await interpreter.evaluateAsync(`
        asyncMult(asyncAdd(2, 3), asyncAdd(4, 6))
      `);
      expect(result).toBe(50); // (2+3) * (4+6) = 5 * 10
    });

    it("should handle async functions returning complex objects", async () => {
      const asyncGetUser = async (id: number) => ({
        id,
        name: `User${id}`,
        active: true,
      });
      const interpreter = new Interpreter({
        globals: { asyncGetUser },
      });
      const result = await interpreter.evaluateAsync(`
        let user = asyncGetUser(42);
        user.name
      `);
      expect(result).toBe("User42");
    });

    it("should handle async functions with complex logic", async () => {
      const asyncProcessData = async (data: number[]) => {
        let sum = 0;
        for (const num of data) {
          sum += num;
        }
        return sum / data.length;
      };
      const interpreter = new Interpreter({
        globals: { asyncProcessData },
      });
      const result = await interpreter.evaluateAsync("asyncProcessData([10, 20, 30, 40, 50])");
      expect(result).toBe(30);
    });
  });

  describe("Per-call globals in async mode", () => {
    it("should support per-call globals with async", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("x + y", {
        globals: { x: 10, y: 20 },
      });
      expect(result).toBe(30);
    });

    it("should support async host functions as per-call globals", async () => {
      const asyncFunc = async () => 42;
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("asyncFunc()", {
        globals: { asyncFunc },
      });
      expect(result).toBe(42);
    });

    it("should clean up per-call globals after async execution", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let result = x", { globals: { x: 10 } });
      return expect(interpreter.evaluateAsync("x")).rejects.toThrow("Undefined variable 'x'");
    });
  });

  describe("Error handling in async mode", () => {
    it("should handle errors in async expressions", async () => {
      const interpreter = new Interpreter();
      return expect(interpreter.evaluateAsync("undefinedVar")).rejects.toThrow(
        "Undefined variable 'undefinedVar'",
      );
    });

    it("should handle errors in async control flow", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          if (unknownVar > 5) {
            let x = 10;
          }
        `),
      ).rejects.toThrow("Undefined variable 'unknownVar'");
    });

    it("should handle const reassignment errors in async", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          const PI = 3.14159;
          PI = 3.14;
        `),
      ).rejects.toThrow("Cannot assign to const variable 'PI'");
    });
  });

  describe("Return statements in async mode", () => {
    it("should handle return statements in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function getValue() {
          return 42;
        }
        getValue()
      `);
      expect(result).toBe(42);
    });

    it("should handle early returns in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        function checkValue(x) {
          if (x > 10) {
            return 'big';
          }
          return 'small';
        }
        checkValue(15)
      `);
      expect(result).toBe("big");
    });
  });
});
