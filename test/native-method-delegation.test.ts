import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Native method delegation", () => {
  describe("String methods (delegated)", () => {
    it("should support replaceAll", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"aabbcc".replaceAll("b", "x")`);
      expect(result).toBe("aaxxcc");
    });

    it("should support charCodeAt", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"A".charCodeAt(0)`);
      expect(result).toBe(65);
    });

    it("should support codePointAt", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"A".codePointAt(0)`);
      expect(result).toBe(65);
    });

    it("should support concat", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"hello".concat(" ", "world")`);
      expect(result).toBe("hello world");
    });

    it("should support search", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"hello world".search("world")`);
      expect(result).toBe(6);
    });

    it("should support at", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"hello".at(-1)`);
      expect(result).toBe("o");
    });

    it("should support normalize", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"hello".normalize()`);
      expect(result).toBe("hello");
    });

    it("should support localeCompare", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`"a".localeCompare("b")`);
      expect(result).toBe(-1);
    });
  });

  describe("Array methods (delegated)", () => {
    it("should support copyWithin", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        arr.copyWithin(0, 3);
        arr;
      `);
      expect(result).toEqual([4, 5, 3, 4, 5]);
    });
  });

  describe("Security", () => {
    it("should block dangerous properties on strings", () => {
      const interpreter = new Interpreter();
      expect(() => interpreter.evaluate(`"hello".constructor`)).toThrow();
    });

    it("should block dangerous properties on arrays", () => {
      const interpreter = new Interpreter();
      expect(() => interpreter.evaluate(`[1,2,3].constructor`)).toThrow();
    });

    it("should block __proto__ on strings", () => {
      const interpreter = new Interpreter();
      expect(() => interpreter.evaluate(`"hello".__proto__`)).toThrow();
    });

    it("should block __proto__ on arrays", () => {
      const interpreter = new Interpreter();
      expect(() => interpreter.evaluate(`[1,2,3].__proto__`)).toThrow();
    });
  });

  describe("Explicit methods still work", () => {
    it("should still use explicit string methods", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`"hello".toUpperCase()`)).toBe("HELLO");
      expect(interpreter.evaluate(`"hello world".split(" ")`)).toEqual(["hello", "world"]);
      expect(interpreter.evaluate(`"  hello  ".trim()`)).toBe("hello");
    });

    it("should still use explicit array methods with callbacks", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`[1,2,3].map(x => x * 2)`)).toEqual([2, 4, 6]);
      expect(interpreter.evaluate(`[1,2,3].filter(x => x > 1)`)).toEqual([2, 3]);
      expect(interpreter.evaluate(`[1,2,3].reduce((a, b) => a + b, 0)`)).toBe(6);
    });
  });
});
