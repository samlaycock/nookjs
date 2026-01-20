import { describe, expect, it } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Ternary Operator", () => {
  describe("Basic ternary expressions", () => {
    it("should evaluate true condition", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("true ? 10 : 20")).toBe(10);
    });

    it("should evaluate false condition", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("false ? 10 : 20")).toBe(20);
    });

    it("should work with numbers", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("5 > 3 ? 100 : 200")).toBe(100);
      expect(interpreter.evaluate("2 > 5 ? 100 : 200")).toBe(200);
    });

    it("should work with strings", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate('true ? "yes" : "no"')).toBe("yes");
      expect(interpreter.evaluate('false ? "yes" : "no"')).toBe("no");
    });
  });

  describe("Ternary with variables", () => {
    it("should work with variable in condition", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 10");
      expect(interpreter.evaluate("x > 5 ? 'big' : 'small'")).toBe("big");
    });

    it("should work with variables in branches", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let a = 10");
      interpreter.evaluate("let b = 20");
      expect(interpreter.evaluate("true ? a : b")).toBe(10);
      expect(interpreter.evaluate("false ? a : b")).toBe(20);
    });

    it("should assign ternary result to variable", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let age = 25");
      interpreter.evaluate('let status = age >= 18 ? "adult" : "minor"');
      expect(interpreter.evaluate("status")).toBe("adult");
    });
  });

  describe("Nested ternary expressions", () => {
    it("should handle nested ternary in consequent", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let a = 5");
      interpreter.evaluate("let b = 3");
      const result = interpreter.evaluate(
        'a > 0 ? (b > 0 ? "both positive" : "a positive") : "a negative"',
      );
      expect(result).toBe("both positive");
    });

    it("should handle nested ternary in alternate", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let a = -1");
      interpreter.evaluate("let b = 3");
      const result = interpreter.evaluate(
        'a > 0 ? "a positive" : (b > 0 ? "only b positive" : "both negative")',
      );
      expect(result).toBe("only b positive");
    });

    it("should handle multiple levels of nesting", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let score = 85");
      const result = interpreter.evaluate(
        'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"',
      );
      expect(result).toBe("B");
    });
  });

  describe("Ternary with expressions", () => {
    it("should evaluate arithmetic in branches", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("true ? 5 + 3 : 10 - 2")).toBe(8);
      expect(interpreter.evaluate("false ? 5 + 3 : 10 - 2")).toBe(8);
    });

    it("should evaluate function calls in branches", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        function double(x) { return x * 2; }
        function triple(x) { return x * 3; }
      `);
      expect(interpreter.evaluate("true ? double(5) : triple(5)")).toBe(10);
      expect(interpreter.evaluate("false ? double(5) : triple(5)")).toBe(15);
    });

    it("should evaluate complex condition", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 10");
      interpreter.evaluate("let y = 20");
      expect(interpreter.evaluate("x > 5 && y < 30 ? 100 : 200")).toBe(100);
      expect(interpreter.evaluate("x > 15 || y < 10 ? 100 : 200")).toBe(200);
    });
  });

  describe("Ternary with objects and arrays", () => {
    it("should return object from ternary", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate('true ? { name: "Alice" } : { name: "Bob" }');
      expect(result).toEqual({ name: "Alice" });
    });

    it("should return array from ternary", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("false ? [1, 2] : [3, 4]");
      expect(result).toEqual([3, 4]);
    });

    it("should access properties on ternary result", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let isAdmin = true");
      const result = interpreter.evaluate('(isAdmin ? { role: "admin" } : { role: "user" }).role');
      expect(result).toBe("admin");
    });
  });

  describe("Ternary with falsy values", () => {
    it("should handle 0 as falsy", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("0 ? 'truthy' : 'falsy'")).toBe("falsy");
    });

    it("should handle empty string as falsy", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("\"\" ? 'truthy' : 'falsy'")).toBe("falsy");
    });

    it("should handle null as falsy", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = null");
      expect(interpreter.evaluate("x ? 'truthy' : 'falsy'")).toBe("falsy");
    });

    it("should handle undefined as falsy", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x");
      expect(interpreter.evaluate("x ? 'truthy' : 'falsy'")).toBe("falsy");
    });

    it("should handle truthy values correctly", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("1 ? 'truthy' : 'falsy'")).toBe("truthy");
      expect(interpreter.evaluate("\"hello\" ? 'truthy' : 'falsy'")).toBe("truthy");
      interpreter.evaluate("let arr = []");
      expect(interpreter.evaluate("arr ? 'truthy' : 'falsy'")).toBe("truthy");
      interpreter.evaluate("let obj = {}");
      expect(interpreter.evaluate("obj ? 'truthy' : 'falsy'")).toBe("truthy");
    });
  });

  describe("Ternary in return statements", () => {
    it("should return ternary result from function", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        function getMax(a, b) {
          return a > b ? a : b;
        }
      `);
      expect(interpreter.evaluate("getMax(10, 5)")).toBe(10);
      expect(interpreter.evaluate("getMax(3, 7)")).toBe(7);
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let isEven = x => x % 2 === 0 ? true : false");
      expect(interpreter.evaluate("isEven(4)")).toBe(true);
      expect(interpreter.evaluate("isEven(5)")).toBe(false);
    });
  });

  describe("Ternary in loops", () => {
    it("should work in for loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = [];
        for (let i = 0; i < 5; i++) {
          result[i] = i % 2 === 0 ? "even" : "odd";
        }
        result
      `);
      expect(result).toEqual(["even", "odd", "even", "odd", "even"]);
    });

    it("should work in while loop condition", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        let limit = 5;
        while (count < (count > 2 ? 4 : limit)) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(4);
    });
  });

  describe("Async ternary expressions", () => {
    it("should work with evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("true ? 100 : 200");
      expect(result).toBe(100);
    });

    it("should work with async host functions in branches", async () => {
      const asyncDouble = async (x: number) => x * 2;
      const asyncTriple = async (x: number) => x * 3;
      const interpreter = new Interpreter({
        globals: { asyncDouble, asyncTriple },
      });
      const result1 = await interpreter.evaluateAsync("true ? asyncDouble(5) : asyncTriple(5)");
      expect(result1).toBe(10);

      const result2 = await interpreter.evaluateAsync("false ? asyncDouble(5) : asyncTriple(5)");
      expect(result2).toBe(15);
    });

    it("should work in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function classify(num) {
          return num > 0 ? "positive" : num < 0 ? "negative" : "zero";
        }
        classify(-5)
      `);
      expect(result).toBe("negative");
    });

    it("should work with await in ternary branches", async () => {
      const asyncGetValue = async (x: number) => x * 10;
      const interpreter = new Interpreter({
        globals: { asyncGetValue },
      });
      const result = await interpreter.evaluateAsync(`
        async function test(condition) {
          return condition ? await asyncGetValue(1) : await asyncGetValue(2);
        }
        test(true)
      `);
      expect(result).toBe(10);
    });
  });

  describe("Edge cases", () => {
    it("should not evaluate alternate if condition is true", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let sideEffect = 0");
      interpreter.evaluate("true ? 1 : (sideEffect = 1)");
      expect(interpreter.evaluate("sideEffect")).toBe(0);
    });

    it("should not evaluate consequent if condition is false", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let sideEffect = 0");
      interpreter.evaluate("false ? (sideEffect = 1) : 2");
      expect(interpreter.evaluate("sideEffect")).toBe(0);
    });

    it("should work with ternary as function argument", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("function add(a, b) { return a + b; }");
      expect(interpreter.evaluate("add(true ? 5 : 10, false ? 3 : 7)")).toBe(12);
    });

    it("should work with ternary in array literal", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("let arr = [true ? 1 : 2, false ? 3 : 4]; arr");
      expect(result).toEqual([1, 4]);
    });

    it("should work with ternary in object literal", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(
        'let obj = { a: true ? 10 : 20, b: false ? "x" : "y" }; obj',
      );
      expect(result).toEqual({ a: 10, b: "y" });
    });
  });
});
