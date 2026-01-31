import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Promise Static Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Promise.resolve", () => {
    it("should return a resolved promise with value", async () => {
      const result = await interpreter.evaluateAsync("Promise.resolve(42)");
      expect(result).toBe(42);
    });

    it("should return a resolved promise with undefined", async () => {
      const result = await interpreter.evaluateAsync("Promise.resolve()");
      expect(result).toBeUndefined();
    });

    it("should return a resolved promise with object", async () => {
      const result = await interpreter.evaluateAsync("Promise.resolve({ a: 1 })");
      expect(result).toEqual({ a: 1 });
    });
  });

  describe("Promise.reject", () => {
    it("should return a rejected promise", async () => {
      try {
        await interpreter.evaluateAsync("Promise.reject('error')");
        expect(true).toBe(false);
      } catch (e) {
        expect(String(e)).toContain("error");
      }
    });
  });

  describe("Promise.all", () => {
    it("should resolve with all values when all promises resolve", async () => {
      const result = await interpreter.evaluateAsync(`
        Promise.all([
          Promise.resolve(1),
          Promise.resolve(2),
          Promise.resolve(3)
        ])
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle empty array", async () => {
      const result = await interpreter.evaluateAsync("Promise.all([])");
      expect(result).toEqual([]);
    });
  });

  describe("Promise.race", () => {
    it("should return first resolved promise", async () => {
      const result = await interpreter.evaluateAsync(`
        Promise.race([
          Promise.resolve(1),
          Promise.resolve(2)
        ])
      `);
      expect(result).toBe(1);
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

    it("should handle empty array", async () => {
      const result = await interpreter.evaluateAsync("Promise.allSettled([])");
      expect(result).toEqual([]);
    });
  });

  describe("Promise.withResolvers", () => {
    it("should return object with promise, resolve, and reject", async () => {
      const result = await interpreter.evaluateAsync(`
        const { promise, resolve } = Promise.withResolvers();
        resolve(42);
        promise
      `);
      expect(result).toBe(42);
    });
  });
});
