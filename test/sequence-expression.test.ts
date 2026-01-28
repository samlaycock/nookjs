import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Sequence Expression (Comma Operator)", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("basic comma operator", () => {
    test("returns the last value", () => {
      const result = interpreter.evaluate(`(1, 2, 3)`);
      expect(result).toBe(3);
    });

    test("two operands", () => {
      const result = interpreter.evaluate(`(10, 20)`);
      expect(result).toBe(20);
    });

    test("evaluates all expressions for side effects", () => {
      const result = interpreter.evaluate(`
        let x = 0;
        (x = 1, x = x + 10, x = x * 2);
        x;
      `);
      expect(result).toBe(22);
    });

    test("works with different types", () => {
      const result = interpreter.evaluate(`("hello", true, 42)`);
      expect(result).toBe(42);
    });
  });

  describe("comma operator in for loops", () => {
    test("multiple update expressions", () => {
      const result = interpreter.evaluate(`
        let a = 0;
        let b = 10;
        for (let i = 0; i < 3; i++, a++, b--) {}
        [a, b];
      `);
      expect(result).toEqual([3, 7]);
    });

    test("multiple init expressions via comma in for update", () => {
      const result = interpreter.evaluate(`
        let sum = 0;
        for (let i = 0, j = 10; i < j; i++, j--) {
          sum = sum + 1;
        }
        sum;
      `);
      expect(result).toBe(5);
    });
  });

  describe("comma operator in expressions", () => {
    test("in parenthesized expression", () => {
      const result = interpreter.evaluate(`
        let x = (1, 2, 3);
        x;
      `);
      expect(result).toBe(3);
    });

    test("function calls as operands", () => {
      const result = interpreter.evaluate(`
        let log = [];
        function a() { log.push("a"); return 1; }
        function b() { log.push("b"); return 2; }
        function c() { log.push("c"); return 3; }
        const result = (a(), b(), c());
        [result, log];
      `);
      expect(result).toEqual([3, ["a", "b", "c"]]);
    });

    test("in return statement", () => {
      const result = interpreter.evaluate(`
        function foo() {
          return (1, 2, 42);
        }
        foo();
      `);
      expect(result).toBe(42);
    });

    test("does not affect function arguments", () => {
      const result = interpreter.evaluate(`
        function add(a, b) { return a + b; }
        add(1, 2);
      `);
      expect(result).toBe(3);
    });

    test("does not affect array literals", () => {
      const result = interpreter.evaluate(`[1, 2, 3]`);
      expect(result).toEqual([1, 2, 3]);
    });

    test("does not affect object literals", () => {
      const result = interpreter.evaluate(`
        const obj = { a: 1, b: 2 };
        obj.a + obj.b;
      `);
      expect(result).toBe(3);
    });
  });
});
