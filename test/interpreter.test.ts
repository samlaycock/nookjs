import { describe, test, expect } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Interpreter", () => {
  const interpreter = new Interpreter();

  describe("Numeric Literals", () => {
    test("evaluates positive integer", () => {
      expect(interpreter.evaluate("42")).toBe(42);
    });

    test("evaluates negative integer", () => {
      expect(interpreter.evaluate("-42")).toBe(-42);
    });

    test("evaluates floating point number", () => {
      expect(interpreter.evaluate("3.14")).toBe(3.14);
    });

    test("evaluates zero", () => {
      expect(interpreter.evaluate("0")).toBe(0);
    });
  });

  describe("Binary Operations - Addition", () => {
    test("adds two positive numbers", () => {
      expect(interpreter.evaluate("2 + 3")).toBe(5);
    });

    test("adds negative numbers", () => {
      expect(interpreter.evaluate("-5 + 3")).toBe(-2);
    });

    test("adds floating point numbers", () => {
      expect(interpreter.evaluate("1.5 + 2.5")).toBe(4);
    });

    test("handles chain of additions", () => {
      expect(interpreter.evaluate("1 + 2 + 3 + 4")).toBe(10);
    });
  });

  describe("Binary Operations - Subtraction", () => {
    test("subtracts two numbers", () => {
      expect(interpreter.evaluate("10 - 3")).toBe(7);
    });

    test("handles negative result", () => {
      expect(interpreter.evaluate("3 - 10")).toBe(-7);
    });

    test("handles chain of subtractions", () => {
      expect(interpreter.evaluate("20 - 5 - 3")).toBe(12);
    });
  });

  describe("Binary Operations - Multiplication", () => {
    test("multiplies two positive numbers", () => {
      expect(interpreter.evaluate("6 * 7")).toBe(42);
    });

    test("multiplies with negative number", () => {
      expect(interpreter.evaluate("-5 * 3")).toBe(-15);
    });

    test("multiplies two negative numbers", () => {
      expect(interpreter.evaluate("-5 * -3")).toBe(15);
    });

    test("multiplies by zero", () => {
      expect(interpreter.evaluate("42 * 0")).toBe(0);
    });

    test("multiplies floating point numbers", () => {
      expect(interpreter.evaluate("2.5 * 4")).toBe(10);
    });
  });

  describe("Binary Operations - Division", () => {
    test("divides two numbers", () => {
      expect(interpreter.evaluate("10 / 2")).toBe(5);
    });

    test("divides with floating point result", () => {
      expect(interpreter.evaluate("7 / 2")).toBe(3.5);
    });

    test("divides negative numbers", () => {
      expect(interpreter.evaluate("-10 / 2")).toBe(-5);
    });

    test("throws error on division by zero", () => {
      expect(() => interpreter.evaluate("5 / 0")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("5 / 0")).toThrow("Division by zero");
    });
  });

  describe("Binary Operations - Modulo", () => {
    test("calculates modulo", () => {
      expect(interpreter.evaluate("10 % 3")).toBe(1);
    });

    test("modulo with zero result", () => {
      expect(interpreter.evaluate("10 % 5")).toBe(0);
    });

    test("throws error on modulo by zero", () => {
      expect(() => interpreter.evaluate("5 % 0")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("5 % 0")).toThrow("Modulo by zero");
    });
  });

  describe("Binary Operations - Exponentiation", () => {
    test("calculates power", () => {
      expect(interpreter.evaluate("2 ** 3")).toBe(8);
    });

    test("calculates power with zero exponent", () => {
      expect(interpreter.evaluate("5 ** 0")).toBe(1);
    });

    test("calculates power with negative exponent", () => {
      expect(interpreter.evaluate("2 ** -1")).toBe(0.5);
    });

    test("calculates fractional exponent", () => {
      expect(interpreter.evaluate("4 ** 0.5")).toBe(2);
    });
  });

  describe("Unary Operations", () => {
    test("applies unary minus", () => {
      expect(interpreter.evaluate("-42")).toBe(-42);
    });

    test("applies unary plus", () => {
      expect(interpreter.evaluate("+42")).toBe(42);
    });

    test("double negation", () => {
      expect(interpreter.evaluate("-(-42)")).toBe(42);
    });

    test("unary operators with expressions", () => {
      expect(interpreter.evaluate("-(5 + 3)")).toBe(-8);
    });
  });

  describe("Complex Expressions", () => {
    test("respects operator precedence (multiplication before addition)", () => {
      expect(interpreter.evaluate("2 + 3 * 4")).toBe(14);
    });

    test("respects operator precedence (division before subtraction)", () => {
      expect(interpreter.evaluate("10 - 8 / 2")).toBe(6);
    });

    test("handles parentheses", () => {
      expect(interpreter.evaluate("(2 + 3) * 4")).toBe(20);
    });

    test("handles nested parentheses", () => {
      expect(interpreter.evaluate("((2 + 3) * 4) - 5")).toBe(15);
    });

    test("complex expression with mixed operators", () => {
      expect(interpreter.evaluate("2 + 3 * 4 - 10 / 2")).toBe(9);
    });

    test("complex expression with exponentiation", () => {
      expect(interpreter.evaluate("2 ** 3 + 4 * 5")).toBe(28);
    });

    test("deeply nested expression", () => {
      expect(interpreter.evaluate("(((1 + 2) * (3 + 4)) - 5) / 2")).toBe(8);
    });
  });

  describe("Edge Cases", () => {
    test("handles whitespace", () => {
      expect(interpreter.evaluate("  5   +   3  ")).toBe(8);
    });

    test("handles empty program", () => {
      expect(interpreter.evaluate("")).toBeUndefined();
    });

    test("handles multiple statements (returns last)", () => {
      expect(interpreter.evaluate("5; 10; 15")).toBe(15);
    });
  });

  describe("Error Handling", () => {
    test("throws on unsupported node type", () => {
      // Using with statement which is not supported (parseModule throws ParseError in strict mode)
      expect(() => interpreter.evaluate("with (obj) { x = 5; }")).toThrow();
    });

    test("in operator works correctly", () => {
      // The 'in' operator is supported
      expect(interpreter.evaluate("'a' in {a: 1}")).toBe(true);
      expect(interpreter.evaluate("'b' in {a: 1}")).toBe(false);
    });
  });
});
