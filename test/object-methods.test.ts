import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Object Static Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Object.values", () => {
    it("should return array of object values", () => {
      expect(interpreter.evaluate('Object.values({ a: 1, b: 2 })')).toEqual([1, 2]);
    });

    it("should return empty array for empty object", () => {
      expect(interpreter.evaluate("Object.values({})")).toEqual([]);
    });

    it("should work with arrays", () => {
      expect(interpreter.evaluate("Object.values([1, 2, 3])")).toEqual([1, 2, 3]);
    });
  });

  describe("Object.entries", () => {
    it("should return array of entries", () => {
      expect(interpreter.evaluate(`
        const entries = Object.entries({ a: 1, b: 2 });
        entries.length
      `)).toBe(2);
    });

    it("should return empty array for empty object", () => {
      expect(interpreter.evaluate("Object.entries({})")).toEqual([]);
    });
  });

  describe("Object.fromEntries", () => {
    it("should create object from entries", () => {
      expect(interpreter.evaluate("Object.fromEntries([['a', 1], ['b', 2]])")).toEqual({ a: 1, b: 2 });
    });

    it("should handle empty entries", () => {
      expect(interpreter.evaluate("Object.fromEntries([])")).toEqual({});
    });
  });

  describe("Object.hasOwn", () => {
    it("should return true for own property", () => {
      expect(interpreter.evaluate(`
        const obj = { a: 1 };
        Object.hasOwn(obj, 'a')
      `)).toBe(true);
    });

    it("should return false for inherited property", () => {
      expect(interpreter.evaluate(`
        const obj = { a: 1 };
        Object.hasOwn(obj, 'toString')
      `)).toBe(false);
    });
  });

  describe("Object.keys", () => {
    it("should return array of property keys", () => {
      expect(interpreter.evaluate('Object.keys({ a: 1, b: 2 })')).toEqual(["a", "b"]);
    });

    it("should return empty array for empty object", () => {
      expect(interpreter.evaluate("Object.keys({})")).toEqual([]);
    });
  });

  describe("Object.assign", () => {
    it("should copy properties from source to target", () => {
      expect(interpreter.evaluate(`
        const target = {};
        const source = { a: 1, b: 2 };
        Object.assign(target, source);
        target.a + target.b
      `)).toBe(3);
    });

    it("should copy from multiple sources", () => {
      expect(interpreter.evaluate(`
        const obj = {};
        Object.assign(obj, { a: 1 }, { b: 2 }, { c: 3 });
        obj.a + obj.b + obj.c
      `)).toBe(6);
    });
  });

  describe("Object.is", () => {
    it("should return true for same values", () => {
      expect(interpreter.evaluate("Object.is(5, 5)")).toBe(true);
    });

    it("should return true for same object", () => {
      expect(interpreter.evaluate(`
        const obj = {};
        Object.is(obj, obj)
      `)).toBe(true);
    });

    it("should return false for different objects", () => {
      expect(interpreter.evaluate("Object.is({}, {})")).toBe(false);
    });

    it("should distinguish +0 and -0", () => {
      expect(interpreter.evaluate("Object.is(0, -0)")).toBe(false);
    });

    it("should identify NaN as equal", () => {
      expect(interpreter.evaluate("Object.is(NaN, NaN)")).toBe(true);
    });
  });
});
