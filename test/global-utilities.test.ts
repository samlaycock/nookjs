import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Global Utilities", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("parseInt", () => {
    it("should parse integer from string", () => {
      expect(interpreter.evaluate("parseInt('42')")).toBe(42);
    });

    it("should parse with radix", () => {
      expect(interpreter.evaluate("parseInt('10', 2)")).toBe(2);
      expect(interpreter.evaluate("parseInt('10', 16)")).toBe(16);
    });

    it("should return NaN for invalid input", () => {
      expect(Number.isNaN(interpreter.evaluate("parseInt('abc')"))).toBe(true);
    });

    it("should handle negative numbers", () => {
      expect(interpreter.evaluate("parseInt('-42')")).toBe(-42);
    });
  });

  describe("parseFloat", () => {
    it("should parse float from string", () => {
      expect(interpreter.evaluate("parseFloat('3.14')")).toBeCloseTo(3.14, 2);
    });

    it("should parse integer", () => {
      expect(interpreter.evaluate("parseFloat('42')")).toBe(42);
    });

    it("should return NaN for invalid input", () => {
      expect(Number.isNaN(interpreter.evaluate("parseFloat('abc')"))).toBe(true);
    });
  });

  describe("isNaN", () => {
    it("should return true for NaN", () => {
      expect(interpreter.evaluate("isNaN(NaN)")).toBe(true);
    });

    it("should return false for number", () => {
      expect(interpreter.evaluate("isNaN(42)")).toBe(false);
    });

    it("should return false for null", () => {
      expect(interpreter.evaluate("isNaN(null)")).toBe(false);
    });
  });

  describe("isFinite", () => {
    it("should return false for Infinity", () => {
      expect(interpreter.evaluate("isFinite(Infinity)")).toBe(false);
    });

    it("should return false for -Infinity", () => {
      expect(interpreter.evaluate("isFinite(-Infinity)")).toBe(false);
    });

    it("should return true for regular number", () => {
      expect(interpreter.evaluate("isFinite(42)")).toBe(true);
    });

    it("should return true for zero", () => {
      expect(interpreter.evaluate("isFinite(0)")).toBe(true);
    });
  });

  describe("encodeURI", () => {
    it("should encode URI components", () => {
      expect(interpreter.evaluate('encodeURI("hello world")')).toBe("hello%20world");
    });

    it("should preserve URI structure characters", () => {
      expect(interpreter.evaluate('encodeURI("https://example.com")')).toContain("https://");
    });
  });

  describe("decodeURI", () => {
    it("should decode URI components", () => {
      expect(interpreter.evaluate('decodeURI("hello%20world")')).toBe("hello world");
    });
  });

  describe("encodeURIComponent", () => {
    it("should encode all special characters", () => {
      expect(interpreter.evaluate('encodeURIComponent("a:b/c")')).toBe("a%3Ab%2Fc");
    });

    it("should encode spaces as %20", () => {
      expect(interpreter.evaluate('encodeURIComponent("a b")')).toBe("a%20b");
    });
  });

  describe("decodeURIComponent", () => {
    it("should decode URI component", () => {
      expect(interpreter.evaluate('decodeURIComponent("a%3Ab%2Fc")')).toBe("a:b/c");
    });
  });

  describe("Number constructors and methods", () => {
    it("Number.isNaN should return true only for NaN", () => {
      expect(interpreter.evaluate("Number.isNaN(NaN)")).toBe(true);
      expect(interpreter.evaluate("Number.isNaN(42)")).toBe(false);
    });

    it("Number.isFinite should return true only for finite numbers", () => {
      expect(interpreter.evaluate("Number.isFinite(42)")).toBe(true);
      expect(interpreter.evaluate("Number.isFinite(Infinity)")).toBe(false);
    });

    it("Number.isInteger should check if value is integer", () => {
      expect(interpreter.evaluate("Number.isInteger(42)")).toBe(true);
      expect(interpreter.evaluate("Number.isInteger(3.14)")).toBe(false);
    });

    it("Number.parseInt should parse integer", () => {
      expect(interpreter.evaluate("Number.parseInt('42')")).toBe(42);
    });

    it("Number.parseFloat should parse float", () => {
      expect(interpreter.evaluate("Number.parseFloat('3.14')")).toBeCloseTo(3.14, 2);
    });
  });
});
