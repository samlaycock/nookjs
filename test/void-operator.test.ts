import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("void operator", () => {
  it("should return undefined for void 0", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate("void 0");
    expect(result).toBe(undefined);
  });

  it("should return undefined for any literal", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("void 1")).toBe(undefined);
    expect(interpreter.evaluate("void 'hello'")).toBe(undefined);
    expect(interpreter.evaluate("void true")).toBe(undefined);
    expect(interpreter.evaluate("void null")).toBe(undefined);
  });

  it("should return undefined for expressions", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("void (1 + 2)")).toBe(undefined);
    expect(interpreter.evaluate("void (2 * 3 + 4)")).toBe(undefined);
  });

  it("should evaluate the operand for side effects", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      let x = 0;
      void (x = 5);
      x;
    `);
    expect(result).toBe(5);
  });

  it("should evaluate function calls for side effects", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      let called = false;
      function f() { called = true; return 42; }
      void f();
      called;
    `);
    expect(result).toBe(true);
  });

  it("should work in larger expressions", () => {
    const interpreter = new Interpreter();
    // void 0 is undefined, so (void 0 || 2) is 2
    const result = interpreter.evaluate("1 + (void 0 || 2)");
    expect(result).toBe(3);
  });

  it("should work with variables", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      const x = 42;
      void x;
    `);
    expect(result).toBe(undefined);
  });

  it("should work in async evaluation", async () => {
    const interpreter = new Interpreter();
    const result = await interpreter.evaluateAsync("void (1 + 2)");
    expect(result).toBe(undefined);
  });
});
