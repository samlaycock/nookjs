import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Collections (Map, Set, WeakMap, WeakSet)", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Map", () => {
    it("should create an empty Map", () => {
      expect(interpreter.evaluate("new Map().size")).toBe(0);
    });

    it("should create Map with entries", () => {
      expect(interpreter.evaluate("new Map([['a', 1], ['b', 2]]).size")).toBe(2);
    });

    it("should set a key-value pair", () => {
      expect(interpreter.evaluate(`
        const map = new Map();
        map.set('key', 'value');
        map.get('key')
      `)).toBe("value");
    });

    it("should get value by key", () => {
      expect(interpreter.evaluate(`
        const map = new Map([['a', 1], ['b', 2]]);
        map.get('b')
      `)).toBe(2);
    });

    it("should return undefined for missing key", () => {
      expect(interpreter.evaluate(`
        const map = new Map();
        map.get('missing')
      `)).toBeUndefined();
    });

    it("should return true for existing key with has", () => {
      expect(interpreter.evaluate(`
        const map = new Map([['a', 1]]);
        map.has('a')
      `)).toBe(true);
    });

    it("should delete a key", () => {
      expect(interpreter.evaluate(`
        const map = new Map([['a', 1]]);
        map.delete('a');
        map.has('a')
      `)).toBe(false);
    });

    it("should return size of map", () => {
      expect(interpreter.evaluate(`
        const map = new Map();
        map.set('a', 1);
        map.set('b', 2);
        map.size
      `)).toBe(2);
    });

    it("should clear all entries", () => {
      expect(interpreter.evaluate(`
        const map = new Map([['a', 1], ['b', 2]]);
        map.clear();
        map.size
      `)).toBe(0);
    });
  });

  describe("Set", () => {
    it("should create an empty Set", () => {
      expect(interpreter.evaluate("new Set().size")).toBe(0);
    });

    it("should create Set with values", () => {
      expect(interpreter.evaluate("new Set([1, 2, 3]).size")).toBe(3);
    });

    it("should remove duplicates", () => {
      expect(interpreter.evaluate("new Set([1, 2, 2, 3]).size")).toBe(3);
    });
  });
});
