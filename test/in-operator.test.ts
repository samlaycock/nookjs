import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("in operator", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Object properties", () => {
    test("returns true for existing property", () => {
      expect(interpreter.evaluate("'a' in {a: 1}")).toBe(true);
    });

    test("returns false for non-existing property", () => {
      expect(interpreter.evaluate("'b' in {a: 1}")).toBe(false);
    });

    test("works with variables", () => {
      interpreter.evaluate("let obj = {x: 10, y: 20}");
      expect(interpreter.evaluate("'x' in obj")).toBe(true);
      expect(interpreter.evaluate("'z' in obj")).toBe(false);
    });

    test("works with computed property names", () => {
      interpreter.evaluate("let key = 'foo'");
      interpreter.evaluate("let obj = {foo: 'bar'}");
      expect(interpreter.evaluate("key in obj")).toBe(true);
    });

    test("checks for property existence, not value", () => {
      interpreter.evaluate("let obj = {a: undefined}");
      expect(interpreter.evaluate("'a' in obj")).toBe(true);
    });

    test("works with nested objects", () => {
      interpreter.evaluate("let obj = {outer: {inner: 1}}");
      expect(interpreter.evaluate("'outer' in obj")).toBe(true);
      expect(interpreter.evaluate("'inner' in obj")).toBe(false);
    });
  });

  describe("Array indices", () => {
    test("returns true for existing index", () => {
      expect(interpreter.evaluate("0 in [1, 2, 3]")).toBe(true);
      expect(interpreter.evaluate("2 in [1, 2, 3]")).toBe(true);
    });

    test("returns false for out of bounds index", () => {
      expect(interpreter.evaluate("5 in [1, 2, 3]")).toBe(false);
    });

    test("works with string indices", () => {
      expect(interpreter.evaluate("'0' in [1, 2, 3]")).toBe(true);
      expect(interpreter.evaluate("'length' in [1, 2, 3]")).toBe(true);
    });

    test("works with negative indices (treated as property names)", () => {
      expect(interpreter.evaluate("-1 in [1, 2, 3]")).toBe(false);
    });
  });

  describe("Error cases", () => {
    test("throws for non-object right operand (number)", () => {
      expect(() => {
        interpreter.evaluate("'a' in 5");
      }).toThrow("Cannot use 'in' operator");
    });

    test("throws for non-object right operand (string)", () => {
      expect(() => {
        interpreter.evaluate("'a' in 'hello'");
      }).toThrow("Cannot use 'in' operator");
    });

    test("throws for null", () => {
      expect(() => {
        interpreter.evaluate("'a' in null");
      }).toThrow("Cannot use 'in' operator");
    });

    test("throws for undefined", () => {
      expect(() => {
        interpreter.evaluate("'a' in undefined");
      }).toThrow("Cannot use 'in' operator");
    });
  });

  describe("Practical examples", () => {
    test("property existence check", () => {
      interpreter.evaluate(`
        let user = {name: 'Alice', age: 30};
        let hasEmail = 'email' in user;
        let hasName = 'name' in user;
      `);
      expect(interpreter.evaluate("hasEmail")).toBe(false);
      expect(interpreter.evaluate("hasName")).toBe(true);
    });

    test("works in conditionals", () => {
      const result = interpreter.evaluate(`
        let obj = {a: 1};
        if ('a' in obj) {
          'found';
        } else {
          'not found';
        }
      `);
      expect(result).toBe("found");
    });

    test("works with logical operators", () => {
      interpreter.evaluate("let obj = {a: 1, b: 2}");
      expect(interpreter.evaluate("'a' in obj && 'b' in obj")).toBe(true);
      expect(interpreter.evaluate("'a' in obj && 'c' in obj")).toBe(false);
      expect(interpreter.evaluate("'c' in obj || 'a' in obj")).toBe(true);
    });
  });

  describe("Async evaluation", () => {
    test("works with async evaluation", async () => {
      const result = await interpreter.evaluateAsync("'a' in {a: 1}");
      expect(result).toBe(true);
    });
  });
});
