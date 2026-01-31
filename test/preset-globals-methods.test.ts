import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2015 } from "../src/presets";

describe("Preset globals method access", () => {
  describe("Map", () => {
    it("should allow basic Map prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const map = new Map();
        map.set("a", 1);
        map.set("b", 2);
        [map.get("a"), map.has("b"), map.size];
      `);
      expect(result).toEqual([1, true, 2]);
    });

    it("should allow computed Map prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const map = new Map();
        map["set"]("x", 42);
        map["get"]("x");
      `);
      expect(result).toBe(42);
    });
  });

  describe("Set", () => {
    it("should allow basic Set prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const mySet = new Set();
        mySet.add(1);
        mySet.add(2);
        [mySet.has(2), mySet.size];
      `);
      expect(result).toEqual([true, 2]);
    });

    it("should allow computed Set prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const mySet = new Set();
        mySet["add"](3);
        mySet["has"](3);
      `);
      expect(result).toBe(true);
    });
  });

  describe("WeakMap", () => {
    it("should allow basic WeakMap prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const key = {};
        const map = new WeakMap();
        map.set(key, 99);
        [map.get(key), map.has(key)];
      `);
      expect(result).toEqual([99, true]);
    });

    it("should allow deleting entries from WeakMap", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const key = {};
        const map = new WeakMap();
        map.set(key, "value");
        const deleted = map.delete(key);
        [deleted, map.has(key)];
      `);
      expect(result).toEqual([true, false]);
    });
  });

  describe("WeakSet", () => {
    it("should allow basic WeakSet prototype methods", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const key = {};
        const mySet = new WeakSet();
        mySet.add(key);
        mySet.has(key);
      `);
      expect(result).toBe(true);
    });

    it("should allow deleting entries from WeakSet", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        const key = {};
        const mySet = new WeakSet();
        mySet.add(key);
        const deleted = mySet.delete(key);
        [deleted, mySet.has(key)];
      `);
      expect(result).toEqual([true, false]);
    });
  });
});
