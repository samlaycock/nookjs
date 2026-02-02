import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5, ES2015 } from "../src/presets";

describe("Math", () => {
  describe("ES5", () => {
    describe("Math.abs", () => {
      it("should return absolute value of positive number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.abs(5)")).toBe(5);
      });

      it("should return absolute value of negative number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.abs(-5)")).toBe(5);
      });

      it("should return absolute value of zero", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.abs(0)")).toBe(0);
      });

      it("should return absolute value of float", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.abs(-3.14)")).toBeCloseTo(3.14, 4);
      });
    });

    describe("Math.round", () => {
      it("should round down positive decimal", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.round(4.3)")).toBe(4);
      });

      it("should round up positive decimal", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.round(4.7)")).toBe(5);
      });

      it("should round to nearest integer", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.round(4.5)")).toBe(5);
      });

      it("should round negative numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.round(-4.3)")).toBe(-4);
        expect(interpreter.evaluate("Math.round(-4.7)")).toBe(-5);
      });

      it("should round half away from zero for negatives", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.round(-1.5)")).toBe(-1);
      });
    });

    describe("Math.floor", () => {
      it("should floor positive number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.floor(4.9)")).toBe(4);
      });

      it("should floor to same integer", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.floor(4)")).toBe(4);
      });

      it("should floor negative numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.floor(-4.1)")).toBe(-5);
      });
    });

    describe("Math.ceil", () => {
      it("should ceil positive number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.ceil(4.1)")).toBe(5);
      });

      it("should ceil to same integer", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.ceil(4)")).toBe(4);
      });

      it("should ceil negative numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.ceil(-4.1)")).toBe(-4);
      });
    });

    describe("Math.max", () => {
      it("should return maximum", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.max(5, 10)")).toBe(10);
      });

      it("should return maximum of multiple", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.max(1, 5, 3, 9, 2)")).toBe(9);
      });

      it("should handle negative values", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.max(-5, -2, -10)")).toBe(-2);
      });

      it("should return -Infinity for no arguments", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.max()");
        expect(result).toBe(-Infinity);
      });

      it("should return NaN if any argument is NaN", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.max(1, NaN)");
        expect(Number.isNaN(result)).toBe(true);
      });
    });

    describe("Math.min", () => {
      it("should return minimum", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.min(5, 10)")).toBe(5);
      });

      it("should return minimum of multiple", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.min(1, 5, 3, 9, 2)")).toBe(1);
      });

      it("should handle negative values", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.min(-5, -2, -10)")).toBe(-10);
      });

      it("should return Infinity for no arguments", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.min()");
        expect(result).toBe(Infinity);
      });

      it("should return NaN if any argument is NaN", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.min(1, NaN)");
        expect(Number.isNaN(result)).toBe(true);
      });
    });

    describe("Math.sqrt", () => {
      it("should return square root", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.sqrt(9)")).toBe(3);
      });

      it("should return NaN for negative", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.sqrt(-1)");
        expect(Number.isNaN(result)).toBe(true);
      });
    });

    describe("Math.pow", () => {
      it("should return power", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.pow(2, 3)")).toBe(8);
      });

      it("should return 1 for exponent 0", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.pow(5, 0)")).toBe(1);
      });

      it("should handle negative exponent", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.pow(2, -1)")).toBeCloseTo(0.5, 5);
      });
    });

    describe("Math.random", () => {
      it("should return number between 0 and 1", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.random()");
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });
    });

    describe("Math.PI", () => {
      it("should be approximately 3.14", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.PI")).toBeCloseTo(3.14159, 4);
      });
    });

    describe("Math.sin", () => {
      it("should return sine of 0", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.sin(0)")).toBe(0);
      });
    });

    describe("Math.cos", () => {
      it("should return cosine of 0", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.cos(0)")).toBe(1);
      });
    });

    describe("Math.log", () => {
      it("should return natural logarithm", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.log(1)")).toBe(0);
      });

      it("should return -Infinity for 0", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("Math.log(0)");
        expect(result).toBe(-Infinity);
      });
    });

    describe("Math constants", () => {
      it("Math.E should be approximately 2.72", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.E")).toBeCloseTo(2.71828, 4);
      });

      it("Math.LN2 should be approximately 0.69", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.LN2")).toBeCloseTo(0.693, 3);
      });

      it("Math.SQRT2 should be approximately 1.41", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Math.SQRT2")).toBeCloseTo(1.414, 3);
      });
    });
  });

  describe("ES2015", () => {
    describe("Math.trunc", () => {
      it("should truncate positive decimal", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.trunc(4.9)")).toBe(4);
      });

      it("should truncate negative decimal", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.trunc(-4.9)")).toBe(-4);
      });

      it("should preserve negative zero", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate("Object.is(Math.trunc(-0), -0)");
        expect(result).toBe(true);
      });
    });

    describe("Math.sign", () => {
      it("should return sign for positive, negative, and zero", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          [Math.sign(3), Math.sign(-3), Math.sign(0)]
        `);
        expect(result).toEqual([1, -1, 0]);
      });

      it("should preserve negative zero", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate("Object.is(Math.sign(-0), -0)");
        expect(result).toBe(true);
      });

      it("should return NaN for NaN input", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate("Math.sign(NaN)");
        expect(Number.isNaN(result)).toBe(true);
      });
    });

    describe("Math.hypot", () => {
      it("should compute hypotenuse for two numbers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.hypot(3, 4)")).toBe(5);
      });

      it("should compute hypotenuse for multiple numbers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.hypot(3, 4, 12)")).toBe(13);
      });
    });

    describe("Math.imul", () => {
      it("should multiply 32-bit integers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.imul(2, 4)")).toBe(8);
      });
    });

    describe("Math.clz32", () => {
      it("should count leading zero bits", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.clz32(1)")).toBe(31);
      });
    });

    describe("Math.fround", () => {
      it("should round to 32-bit float precision", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Math.fround(1.337)")).toBe(Math.fround(1.337));
      });
    });
  });
});
