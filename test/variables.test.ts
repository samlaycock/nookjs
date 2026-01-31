import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Variables and Assignments", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Variable Declarations - let", () => {
    test("declares and initializes a let variable", () => {
      interpreter.evaluate("let x = 5");
      expect(interpreter.evaluate("x")).toBe(5);
    });

    test("declares multiple variables in one statement", () => {
      interpreter.evaluate("let x = 5, y = 10");
      expect(interpreter.evaluate("x")).toBe(5);
      expect(interpreter.evaluate("y")).toBe(10);
    });

    test("declares variable with expression", () => {
      interpreter.evaluate("let x = 2 + 3");
      expect(interpreter.evaluate("x")).toBe(5);
    });

    test("declares variable without initializer (undefined)", () => {
      interpreter.evaluate("let x");
      expect(interpreter.evaluate("x")).toBeUndefined();
    });

    test("throws error on duplicate declaration", () => {
      interpreter.evaluate("let x = 5");
      expect(() => interpreter.evaluate("let x = 10")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("let x = 10")).toThrow(
        "Variable 'x' has already been declared",
      );
    });

    test("can reassign let variable", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("x = 10");
      expect(interpreter.evaluate("x")).toBe(10);
    });

    test("can use variable in expressions", () => {
      interpreter.evaluate("let x = 5");
      expect(interpreter.evaluate("x + 3")).toBe(8);
      expect(interpreter.evaluate("x * 2")).toBe(10);
    });
  });

  describe("Variable Declarations - const", () => {
    test("declares and initializes a const variable", () => {
      interpreter.evaluate("const x = 5");
      expect(interpreter.evaluate("x")).toBe(5);
    });

    test("throws error on const without initializer", () => {
      expect(() => interpreter.evaluate("const x")).toThrow(
        "Missing initializer in const declaration",
      );
    });

    test("throws error on const reassignment", () => {
      interpreter.evaluate("const x = 5");
      expect(() => interpreter.evaluate("x = 10")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("x = 10")).toThrow("Cannot assign to const variable 'x'");
    });

    test("can use const in expressions", () => {
      interpreter.evaluate("const x = 5");
      expect(interpreter.evaluate("x + 3")).toBe(8);
    });

    test("throws error on duplicate const declaration", () => {
      interpreter.evaluate("const x = 5");
      expect(() => interpreter.evaluate("const x = 10")).toThrow(InterpreterError);
    });

    test("allows keywords like set as identifiers", () => {
      interpreter.evaluate("const set = 5");
      expect(interpreter.evaluate("set")).toBe(5);
    });
  });

  describe("Variable Access", () => {
    test("throws error on undefined variable", () => {
      expect(() => interpreter.evaluate("x")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("x")).toThrow("Undefined variable 'x'");
    });

    test("throws error on assignment to undefined variable", () => {
      expect(() => interpreter.evaluate("x = 5")).toThrow(InterpreterError);
      expect(() => interpreter.evaluate("x = 5")).toThrow("Undefined variable 'x'");
    });

    test("can reference variable in same statement after declaration", () => {
      expect(interpreter.evaluate("let x = 5; x")).toBe(5);
    });
  });

  describe("Assignment Expressions", () => {
    test("simple assignment returns the assigned value", () => {
      interpreter.evaluate("let x = 5");
      expect(interpreter.evaluate("x = 10")).toBe(10);
    });

    test("can chain assignments (right-to-left)", () => {
      interpreter.evaluate("let x = 0; let y = 0");
      interpreter.evaluate("x = y = 5");
      expect(interpreter.evaluate("x")).toBe(5);
      expect(interpreter.evaluate("y")).toBe(5);
    });

    test("assignment with expression", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("x = x + 3");
      expect(interpreter.evaluate("x")).toBe(8);
    });

    test("assignment with complex expression", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("x = (x + 3) * 2");
      expect(interpreter.evaluate("x")).toBe(16);
    });

    test("throws error on invalid assignment target", () => {
      expect(() => interpreter.evaluate("5 = 10")).toThrow("Invalid left-hand side in assignment");
    });
  });

  describe("Complex Variable Usage", () => {
    test("multiple variables in expression", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let y = 10");
      expect(interpreter.evaluate("x + y")).toBe(15);
      expect(interpreter.evaluate("x * y")).toBe(50);
    });

    test("variable references variable", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let y = x + 3");
      expect(interpreter.evaluate("y")).toBe(8);
    });

    test("sequential assignments", () => {
      interpreter.evaluate("let x = 1");
      interpreter.evaluate("x = x + 1");
      interpreter.evaluate("x = x * 2");
      expect(interpreter.evaluate("x")).toBe(4);
    });

    test("multiple variables with same value", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let y = 5");
      expect(interpreter.evaluate("x")).toBe(5);
      expect(interpreter.evaluate("y")).toBe(5);
    });

    test("update one variable does not affect others", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let y = x");
      interpreter.evaluate("x = 10");
      expect(interpreter.evaluate("x")).toBe(10);
      expect(interpreter.evaluate("y")).toBe(5);
    });
  });

  describe("Variable Shadowing Prevention", () => {
    test("cannot redeclare with let", () => {
      interpreter.evaluate("let x = 5");
      expect(() => interpreter.evaluate("let x = 10")).toThrow(InterpreterError);
    });

    test("cannot redeclare with const", () => {
      interpreter.evaluate("const x = 5");
      expect(() => interpreter.evaluate("const x = 10")).toThrow(InterpreterError);
    });

    test("cannot mix let and const with same name", () => {
      interpreter.evaluate("let x = 5");
      expect(() => interpreter.evaluate("const x = 10")).toThrow(InterpreterError);
    });
  });

  describe("Integration with Arithmetic", () => {
    test("complex calculation with variables", () => {
      interpreter.evaluate("let a = 10");
      interpreter.evaluate("let b = 5");
      interpreter.evaluate("let c = a * b + (a - b) / 2");
      expect(interpreter.evaluate("c")).toBe(52.5);
    });

    test("using variables in nested expressions", () => {
      interpreter.evaluate("let x = 2");
      interpreter.evaluate("let y = 3");
      expect(interpreter.evaluate("(x + y) * (x - y)")).toBe(-5);
    });

    test("fibonacci-like sequence", () => {
      interpreter.evaluate("let a = 1");
      interpreter.evaluate("let b = 1");
      interpreter.evaluate("let c = a + b");
      expect(interpreter.evaluate("c")).toBe(2);
      interpreter.evaluate("a = b");
      interpreter.evaluate("b = c");
      interpreter.evaluate("c = a + b");
      expect(interpreter.evaluate("c")).toBe(3);
    });

    test("accumulator pattern", () => {
      interpreter.evaluate("let sum = 0");
      interpreter.evaluate("sum = sum + 1");
      interpreter.evaluate("sum = sum + 2");
      interpreter.evaluate("sum = sum + 3");
      expect(interpreter.evaluate("sum")).toBe(6);
    });
  });

  describe("Edge Cases", () => {
    test("variable with number-like name", () => {
      interpreter.evaluate("let x1 = 5");
      expect(interpreter.evaluate("x1")).toBe(5);
    });

    test("variable with underscore", () => {
      interpreter.evaluate("let _private = 42");
      expect(interpreter.evaluate("_private")).toBe(42);
    });

    test("variable with dollar sign", () => {
      interpreter.evaluate("let $value = 100");
      expect(interpreter.evaluate("$value")).toBe(100);
    });

    test("multiple statements on separate lines", () => {
      const code = `
        let x = 5;
        let y = 10;
        x + y
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });

    test("declaration returns the initialized value", () => {
      expect(interpreter.evaluate("let x = 42")).toBe(42);
    });

    test("const declaration returns the initialized value", () => {
      expect(interpreter.evaluate("const x = 42")).toBe(42);
    });
  });
});
