import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2015, ES2024 } from "../src/presets";

describe("Collections", () => {
  describe("ES2015", () => {
    describe("Map", () => {
      it("should create an empty Map", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("new Map().size")).toBe(0);
      });

      it("should create Map with entries", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("new Map([['a', 1], ['b', 2]]).size")).toBe(2);
      });

      it("should set a key-value pair", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map();
          map.set('key', 'value');
          map.get('key')
        `),
        ).toBe("value");
      });

      it("should handle NaN keys", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const map = new Map();
          map.set(NaN, "value");
          map.get(NaN);
        `);
        expect(result).toBe("value");
      });

      it("should get value by key", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1], ['b', 2]]);
          map.get('b')
        `),
        ).toBe(2);
      });

      it("should treat object keys by reference", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const key = { id: 1 };
          const map = new Map();
          map.set(key, "value");
          [map.get(key), map.get({ id: 1 })];
        `);
        expect(result).toEqual(["value", undefined]);
      });

      it("should return undefined for missing key", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map();
          map.get('missing')
        `),
        ).toBeUndefined();
      });

      it("should return true for existing key with has", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1]]);
          map.has('a')
        `),
        ).toBe(true);
      });

      it("should return false for missing key with has", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1]]);
          map.has('b')
        `),
        ).toBe(false);
      });

      it("should delete a key", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1]]);
          map.delete('a');
          map.has('a')
        `),
        ).toBe(false);
      });

      it("should return false when deleting missing key", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1]]);
          map.delete('b')
        `),
        ).toBe(false);
      });

      it("should return size of map", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map();
          map.set('a', 1);
          map.set('b', 2);
          map.size
        `),
        ).toBe(2);
      });

      it("should clear all entries", () => {
        const interpreter = new Interpreter(ES2015);
        expect(
          interpreter.evaluate(`
          const map = new Map([['a', 1], ['b', 2]]);
          map.clear();
          map.size
        `),
        ).toBe(0);
      });

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

      it("should overwrite values for existing keys", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const map = new Map();
          map.set("a", 1);
          map.set("a", 2);
          [map.size, map.get("a")];
        `);
        expect(result).toEqual([1, 2]);
      });

      it("should iterate with forEach in insertion order", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const map = new Map();
          map.set("a", 1);
          map.set("b", 2);
          const values = [];
          map.forEach((value, key) => {
            values.push(key + value);
          });
          values;
        `);
        expect(result).toEqual(["a1", "b2"]);
      });

      it("should expose keys, values, and entries iterators", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const map = new Map([["a", 1], ["b", 2]]);
          [Array.from(map.keys()), Array.from(map.values()), Array.from(map.entries())];
        `);
        expect(result).toEqual([
          ["a", "b"],
          [1, 2],
          [
            ["a", 1],
            ["b", 2],
          ],
        ]);
      });

      it("should iterate with for...of over entries", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const map = new Map([["a", 1], ["b", 2]]);
          const out = [];
          for (const [k, v] of map) {
            out.push(k + v);
          }
          out;
        `);
        expect(result).toEqual(["a1", "b2"]);
      });
    });

    describe("Set", () => {
      it("should create an empty Set", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("new Set().size")).toBe(0);
      });

      it("should create Set with values", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("new Set([1, 2, 3]).size")).toBe(3);
      });

      it("should remove duplicates", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("new Set([1, 2, 2, 3]).size")).toBe(3);
      });

      it("should treat same object reference as duplicate", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const obj = { id: 1 };
          const set = new Set([obj, obj]);
          set.size;
        `);
        expect(result).toBe(1);
      });

      it("should treat NaN as the same value", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const set = new Set();
          set.add(NaN);
          set.add(NaN);
          [set.size, set.has(NaN)];
        `);
        expect(result).toEqual([1, true]);
      });

      it("should treat object references as unique values", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const a = { id: 1 };
          const b = { id: 1 };
          const set = new Set();
          set.add(a);
          set.add(b);
          [set.size, set.has(a), set.has(b), set.has({ id: 1 })];
        `);
        expect(result).toEqual([2, true, true, false]);
      });

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

      it("should return false for missing value with has", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const mySet = new Set([1, 2]);
          mySet.has(3);
        `);
        expect(result).toBe(false);
      });

      it("should return false when deleting missing value", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const mySet = new Set([1, 2]);
          mySet.delete(3);
        `);
        expect(result).toBe(false);
      });

      it("should delete existing values", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const mySet = new Set([1, 2]);
          const removed = mySet.delete(2);
          [removed, mySet.has(2), mySet.size];
        `);
        expect(result).toEqual([true, false, 1]);
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

      it("should iterate with forEach", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const set = new Set([1, 2, 3]);
          const values = [];
          set.forEach(value => {
            values.push(value * 2);
          });
          values;
        `);
        expect(result).toEqual([2, 4, 6]);
      });

      it("should expose values and entries iterators", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const set = new Set([1, 2]);
          [Array.from(set.values()), Array.from(set.entries())];
        `);
        expect(result).toEqual([
          [1, 2],
          [
            [1, 1],
            [2, 2],
          ],
        ]);
      });

      it("should iterate with for...of", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const set = new Set([1, 2, 3]);
          const out = [];
          for (const value of set) {
            out.push(value);
          }
          out;
        `);
        expect(result).toEqual([1, 2, 3]);
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

      it("should return false for missing key with has", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const key = {};
          const map = new WeakMap();
          map.set(key, 99);
          map.has({});
        `);
        expect(result).toBe(false);
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

  describe("ES2024", () => {
    describe("Map.groupBy", () => {
      it("should group elements into a Map", () => {
        const interpreter = new Interpreter(ES2024);
        const result = interpreter.evaluate(`
          const arr = [{type: "fruit", name: "apple"}, {type: "vegetable", name: "carrot"}, {type: "fruit", name: "banana"}];
          const grouped = Map.groupBy(arr, item => item.type);
          [grouped.get("fruit").length, grouped.get("vegetable").length];
        `);
        expect(result).toEqual([2, 1]);
      });

      it("should handle empty arrays", () => {
        const interpreter = new Interpreter(ES2024);
        const result = interpreter.evaluate("Map.groupBy([], x => x).size");
        expect(result).toBe(0);
      });

      it("should preserve non-string keys", () => {
        const interpreter = new Interpreter(ES2024);
        const result = interpreter.evaluate(`
          const arr = [1, 2, 3, 4, 5, 6];
          const grouped = Map.groupBy(arr, x => x % 2);
          [grouped.get(0), grouped.get(1)];
        `);
        expect(result[0]).toEqual([2, 4, 6]);
        expect(result[1]).toEqual([1, 3, 5]);
      });

      it("should work with object keys", () => {
        const interpreter = new Interpreter(ES2024);
        const result = interpreter.evaluate(`
          const keyA = {id: "a"};
          const keyB = {id: "b"};
          const arr = [{k: keyA, v: 1}, {k: keyB, v: 2}, {k: keyA, v: 3}];
          const grouped = Map.groupBy(arr, x => x.k);
          [grouped.get(keyA).length, grouped.get(keyB).length];
        `);
        expect(result).toEqual([2, 1]);
      });

      it("should return a Map instance", () => {
        const interpreter = new Interpreter(ES2024);
        const result = interpreter.evaluate(`
          const grouped = Map.groupBy([1, 2, 3], x => x % 2);
          grouped instanceof Map;
        `);
        expect(result).toBe(true);
      });
    });
  });
});
