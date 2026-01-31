import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("ES2020+ Features", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("String.prototype.replaceAll", () => {
    it("should replace all occurrences", () => {
      expect(interpreter.evaluate('"foo foo foo".replaceAll("foo", "bar")')).toBe("bar bar bar");
    });

    it("should replace with empty string", () => {
      expect(interpreter.evaluate('"a,b,c".replaceAll(",", "")')).toBe("abc");
    });

    it("should work with global regex", () => {
      expect(interpreter.evaluate('"a1b2c3".replaceAll(/\\d/g, "-")')).toBe("a-b-c-");
    });
  });

  describe("Logical Assignment Operators", () => {
    it("should use ||=", () => {
      expect(
        interpreter.evaluate(`
        let x = null;
        x ||= 5;
        x
      `),
      ).toBe(5);
    });

    it("should use &&=", () => {
      expect(
        interpreter.evaluate(`
        let x = 10;
        x &&= 5;
        x
      `),
      ).toBe(5);
    });

    it("should use ??=", () => {
      expect(
        interpreter.evaluate(`
        let x = null;
        x ??= 5;
        x
      `),
      ).toBe(5);
    });
  });

  describe("Numeric Separators", () => {
    it("should support numeric separators", () => {
      expect(interpreter.evaluate("1_000_000")).toBe(1000000);
    });

    it("should support in hex", () => {
      expect(interpreter.evaluate("0x1_000")).toBe(4096);
    });
  });

  describe("Exponentiation Operator", () => {
    it("should compute power", () => {
      expect(interpreter.evaluate("2 ** 3")).toBe(8);
    });

    it("should use **=", () => {
      expect(
        interpreter.evaluate(`
        let x = 2;
        x **= 3;
        x
      `),
      ).toBe(8);
    });
  });

  describe("String.prototype.trimStart", () => {
    it("should trim leading whitespace", () => {
      expect(interpreter.evaluate('"  hello".trimStart()')).toBe("hello");
    });
  });

  describe("String.prototype.trimEnd", () => {
    it("should trim trailing whitespace", () => {
      expect(interpreter.evaluate('"hello  ".trimEnd()')).toBe("hello");
    });
  });

  describe("Promise.allSettled", () => {
    it("should resolve with all results", async () => {
      const result = await interpreter.evaluateAsync(`
        Promise.allSettled([
          Promise.resolve(1),
          Promise.resolve(2)
        ])
      `);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
    });
  });
});
