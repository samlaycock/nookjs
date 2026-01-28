import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("ES2024 groupBy Methods", () => {
  describe("Object.groupBy", () => {
    it("should group elements by key", () => {
      const interpreter = new Interpreter(ES2024);
      const result = interpreter.evaluate(`
        const arr = [{type: "fruit", name: "apple"}, {type: "vegetable", name: "carrot"}, {type: "fruit", name: "banana"}];
        Object.groupBy(arr, item => item.type);
      `);
      expect(result.fruit).toHaveLength(2);
      expect(result.vegetable).toHaveLength(1);
      expect(result.fruit[0].name).toBe("apple");
      expect(result.fruit[1].name).toBe("banana");
    });

    it("should handle empty arrays", () => {
      const interpreter = new Interpreter(ES2024);
      const result = interpreter.evaluate("Object.groupBy([], x => x)");
      expect(result).toEqual({});
    });

    it("should work with number keys converted to strings", () => {
      const interpreter = new Interpreter(ES2024);
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5, 6];
        Object.groupBy(arr, x => x % 2);
      `);
      expect(result["0"]).toEqual([2, 4, 6]);
      expect(result["1"]).toEqual([1, 3, 5]);
    });

    it("should preserve element order within groups", () => {
      const interpreter = new Interpreter(ES2024);
      const result = interpreter.evaluate(`
        const arr = [{id: 1, cat: "a"}, {id: 2, cat: "b"}, {id: 3, cat: "a"}, {id: 4, cat: "a"}];
        const grouped = Object.groupBy(arr, x => x.cat);
        grouped.a.map(x => x.id);
      `);
      expect(result).toEqual([1, 3, 4]);
    });

    it("should work with computed keys", () => {
      const interpreter = new Interpreter(ES2024);
      const result = interpreter.evaluate(`
        const words = ["one", "two", "three", "four", "five"];
        Object.groupBy(words, word => word.length);
      `);
      expect(result["3"]).toEqual(["one", "two"]);
      expect(result["4"]).toEqual(["four", "five"]);
      expect(result["5"]).toEqual(["three"]);
    });
  });

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
