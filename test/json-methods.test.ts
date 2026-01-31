import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("JSON Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("JSON.stringify", () => {
    it("should stringify a string", () => {
      expect(interpreter.evaluate('JSON.stringify("hello")')).toBe('"hello"');
    });

    it("should stringify a number", () => {
      expect(interpreter.evaluate("JSON.stringify(42)")).toBe("42");
    });

    it("should stringify a boolean", () => {
      expect(interpreter.evaluate("JSON.stringify(true)")).toBe("true");
      expect(interpreter.evaluate("JSON.stringify(false)")).toBe("false");
    });

    it("should stringify null", () => {
      expect(interpreter.evaluate("JSON.stringify(null)")).toBe("null");
    });

    it("should stringify an array", () => {
      expect(interpreter.evaluate("JSON.stringify([1, 2, 3])")).toBe("[1,2,3]");
    });

    it("should stringify an object", () => {
      const result = interpreter.evaluate("JSON.stringify({ a: 1, b: 2 })");
      expect(result).toMatch(/\{.*"a":1.*"b":2.*\}/);
    });

    it("should handle mixed types in object", () => {
      const result = interpreter.evaluate(
        'JSON.stringify({ str: "hello", num: 42, bool: true, nullVal: null })',
      );
      expect(result).toBe('{"str":"hello","num":42,"bool":true,"nullVal":null}');
    });

    it("should handle NaN and Infinity", () => {
      expect(interpreter.evaluate("JSON.stringify(NaN)")).toBe("null");
      expect(interpreter.evaluate("JSON.stringify(Infinity)")).toBe("null");
    });
  });

  describe("JSON.parse", () => {
    it("should parse a JSON string", () => {
      expect(interpreter.evaluate('JSON.parse("42")')).toBe(42);
    });

    it("should parse a boolean", () => {
      expect(interpreter.evaluate("JSON.parse('true')")).toBe(true);
      expect(interpreter.evaluate("JSON.parse('false')")).toBe(false);
    });

    it("should parse null", () => {
      expect(interpreter.evaluate("JSON.parse('null')")).toBe(null);
    });

    it("should parse an array", () => {
      expect(interpreter.evaluate("JSON.parse('[1, 2, 3]')")).toEqual([1, 2, 3]);
    });

    it("should parse an object", () => {
      expect(interpreter.evaluate('JSON.parse(\'{"a": 1, "b": 2}\')')).toEqual({ a: 1, b: 2 });
    });

    it("should throw on invalid JSON", () => {
      expect(() => {
        interpreter.evaluate('JSON.parse("{invalid}")');
      }).toThrow();
    });
  });
});
