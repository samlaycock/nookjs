import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Math Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Math.abs", () => {
    it("should return absolute value of positive number", () => {
      expect(interpreter.evaluate("Math.abs(5)")).toBe(5);
    });

    it("should return absolute value of negative number", () => {
      expect(interpreter.evaluate("Math.abs(-5)")).toBe(5);
    });

    it("should return absolute value of zero", () => {
      expect(interpreter.evaluate("Math.abs(0)")).toBe(0);
    });

    it("should return absolute value of float", () => {
      expect(interpreter.evaluate("Math.abs(-3.14)")).toBeCloseTo(3.14, 4);
    });
  });

  describe("Math.round", () => {
    it("should round down positive decimal", () => {
      expect(interpreter.evaluate("Math.round(4.3)")).toBe(4);
    });

    it("should round up positive decimal", () => {
      expect(interpreter.evaluate("Math.round(4.7)")).toBe(5);
    });

    it("should round to nearest integer", () => {
      expect(interpreter.evaluate("Math.round(4.5)")).toBe(5);
    });

    it("should round negative numbers", () => {
      expect(interpreter.evaluate("Math.round(-4.3)")).toBe(-4);
      expect(interpreter.evaluate("Math.round(-4.7)")).toBe(-5);
    });
  });

  describe("Math.floor", () => {
    it("should floor positive number", () => {
      expect(interpreter.evaluate("Math.floor(4.9)")).toBe(4);
    });

    it("should floor to same integer", () => {
      expect(interpreter.evaluate("Math.floor(4)")).toBe(4);
    });

    it("should floor negative numbers", () => {
      expect(interpreter.evaluate("Math.floor(-4.1)")).toBe(-5);
    });
  });

  describe("Math.ceil", () => {
    it("should ceil positive number", () => {
      expect(interpreter.evaluate("Math.ceil(4.1)")).toBe(5);
    });

    it("should ceil to same integer", () => {
      expect(interpreter.evaluate("Math.ceil(4)")).toBe(4);
    });

    it("should ceil negative numbers", () => {
      expect(interpreter.evaluate("Math.ceil(-4.1)")).toBe(-4);
    });
  });

  describe("Math.trunc", () => {
    it("should truncate positive decimal", () => {
      expect(interpreter.evaluate("Math.trunc(4.9)")).toBe(4);
    });

    it("should truncate negative decimal", () => {
      expect(interpreter.evaluate("Math.trunc(-4.9)")).toBe(-4);
    });
  });

  describe("Math.max", () => {
    it("should return maximum", () => {
      expect(interpreter.evaluate("Math.max(5, 10)")).toBe(10);
    });

    it("should return maximum of multiple", () => {
      expect(interpreter.evaluate("Math.max(1, 5, 3, 9, 2)")).toBe(9);
    });

    it("should return -Infinity for no arguments", () => {
      const result = interpreter.evaluate("Math.max()");
      expect(result).toBe(-Infinity);
    });
  });

  describe("Math.min", () => {
    it("should return minimum", () => {
      expect(interpreter.evaluate("Math.min(5, 10)")).toBe(5);
    });

    it("should return minimum of multiple", () => {
      expect(interpreter.evaluate("Math.min(1, 5, 3, 9, 2)")).toBe(1);
    });
  });

  describe("Math.sqrt", () => {
    it("should return square root", () => {
      expect(interpreter.evaluate("Math.sqrt(9)")).toBe(3);
    });

    it("should return NaN for negative", () => {
      const result = interpreter.evaluate("Math.sqrt(-1)");
      expect(Number.isNaN(result)).toBe(true);
    });
  });

  describe("Math.pow", () => {
    it("should return power", () => {
      expect(interpreter.evaluate("Math.pow(2, 3)")).toBe(8);
    });

    it("should return 1 for exponent 0", () => {
      expect(interpreter.evaluate("Math.pow(5, 0)")).toBe(1);
    });
  });

  describe("Math.random", () => {
    it("should return number between 0 and 1", () => {
      const result = interpreter.evaluate("Math.random()");
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });
  });

  describe("Math.PI", () => {
    it("should be approximately 3.14", () => {
      expect(interpreter.evaluate("Math.PI")).toBeCloseTo(3.14159, 4);
    });
  });

  describe("Math.sin", () => {
    it("should return sine of 0", () => {
      expect(interpreter.evaluate("Math.sin(0)")).toBe(0);
    });
  });

  describe("Math.cos", () => {
    it("should return cosine of 0", () => {
      expect(interpreter.evaluate("Math.cos(0)")).toBe(1);
    });
  });

  describe("Math.log", () => {
    it("should return natural logarithm", () => {
      expect(interpreter.evaluate("Math.log(1)")).toBe(0);
    });

    it("should return -Infinity for 0", () => {
      const result = interpreter.evaluate("Math.log(0)");
      expect(result).toBe(-Infinity);
    });
  });

  describe("Math constants", () => {
    it("Math.E should be approximately 2.72", () => {
      expect(interpreter.evaluate("Math.E")).toBeCloseTo(2.71828, 4);
    });

    it("Math.LN2 should be approximately 0.69", () => {
      expect(interpreter.evaluate("Math.LN2")).toBeCloseTo(0.693, 3);
    });

    it("Math.SQRT2 should be approximately 1.41", () => {
      expect(interpreter.evaluate("Math.SQRT2")).toBeCloseTo(1.414, 3);
    });
  });
});
