import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Function and Number Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Number Methods", () => {
    describe("Number.isNaN", () => {
      it("should return true for NaN", () => {
        expect(interpreter.evaluate("Number.isNaN(NaN)")).toBe(true);
      });

      it("should return false for number", () => {
        expect(interpreter.evaluate("Number.isNaN(42)")).toBe(false);
      });
    });

    describe("Number.isFinite", () => {
      it("should return true for finite number", () => {
        expect(interpreter.evaluate("Number.isFinite(42)")).toBe(true);
      });

      it("should return false for Infinity", () => {
        expect(interpreter.evaluate("Number.isFinite(Infinity)")).toBe(false);
      });
    });

    describe("Number.isInteger", () => {
      it("should return true for integer", () => {
        expect(interpreter.evaluate("Number.isInteger(42)")).toBe(true);
      });

      it("should return false for float", () => {
        expect(interpreter.evaluate("Number.isInteger(3.14)")).toBe(false);
      });
    });

    describe("Number.parseInt", () => {
      it("should parse integer", () => {
        expect(interpreter.evaluate("Number.parseInt('42')")).toBe(42);
      });

      it("should parse hex", () => {
        expect(interpreter.evaluate("Number.parseInt('FF', 16)")).toBe(255);
      });
    });

    describe("Number.parseFloat", () => {
      it("should parse float", () => {
        expect(interpreter.evaluate("Number.parseFloat('3.14')")).toBeCloseTo(3.14, 2);
      });
    });

    describe("Number.MAX_SAFE_INTEGER", () => {
      it("should have correct value", () => {
        expect(interpreter.evaluate("Number.MAX_SAFE_INTEGER")).toBe(9007199254740991);
      });
    });
  });

  describe("Symbol", () => {
    describe("Symbol.hasInstance", () => {
      it("should be Symbol.hasInstance", () => {
        expect(interpreter.evaluate("Symbol.hasInstance")).toBe(Symbol.hasInstance);
      });

      it("should work with instanceof", () => {
        expect(interpreter.evaluate("[] instanceof Array")).toBe(true);
      });
    });

    describe("Symbol.toStringTag", () => {
      it("should exist", () => {
        expect(interpreter.evaluate("typeof Symbol.toStringTag")).toBe("symbol");
      });
    });
  });
});
