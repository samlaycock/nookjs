import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2023 } from "../src/presets";

describe("ES2023 Array Methods", () => {
  describe("findLast", () => {
    it("should find the last element matching a predicate", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[1, 2, 3, 4, 5].findLast(x => x < 4)")).toBe(3);
    });

    it("should return undefined if no element matches", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[1, 2, 3].findLast(x => x > 10)")).toBe(undefined);
    });

    it("should work with objects", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate(`
        const arr = [{id: 1, active: true}, {id: 2, active: false}, {id: 3, active: true}];
        arr.findLast(x => x.active).id;
      `);
      expect(result).toBe(3);
    });
  });

  describe("findLastIndex", () => {
    it("should find the last index matching a predicate", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[1, 2, 3, 4, 5].findLastIndex(x => x < 4)")).toBe(2);
    });

    it("should return -1 if no element matches", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[1, 2, 3].findLastIndex(x => x > 10)")).toBe(-1);
    });

    it("should work with duplicates", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[1, 2, 2, 2, 3].findLastIndex(x => x === 2)")).toBe(3);
    });
  });

  describe("toReversed", () => {
    it("should return a reversed copy without mutating original", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        const reversed = arr.toReversed();
        [reversed, arr];
      `);
      expect(result[0]).toEqual([3, 2, 1]);
      expect(result[1]).toEqual([1, 2, 3]);
    });

    it("should work with empty arrays", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[].toReversed()")).toEqual([]);
    });

    it("should work with single element", () => {
      const interpreter = new Interpreter(ES2023);
      expect(interpreter.evaluate("[42].toReversed()")).toEqual([42]);
    });
  });

  describe("toSorted", () => {
    it("should return a sorted copy without mutating original", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate(`
        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
        [sorted, arr];
      `);
      expect(result[0]).toEqual([1, 2, 3]);
      expect(result[1]).toEqual([3, 1, 2]);
    });

    it("should accept a compare function", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate("[3, 1, 2].toSorted((a, b) => b - a)");
      expect(result).toEqual([3, 2, 1]);
    });

    it("should handle strings correctly", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate('["banana", "apple", "cherry"].toSorted()');
      expect(result).toEqual(["apple", "banana", "cherry"]);
    });
  });

  describe("toSpliced", () => {
    it("should return a spliced copy without mutating original", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4];
        const spliced = arr.toSpliced(1, 2, "a", "b");
        [spliced, arr];
      `);
      expect(result[0]).toEqual([1, "a", "b", 4]);
      expect(result[1]).toEqual([1, 2, 3, 4]);
    });

    it("should work with only deletion", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate("[1, 2, 3, 4, 5].toSpliced(1, 3)");
      expect(result).toEqual([1, 5]);
    });

    it("should work with only insertion", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate('[1, 2, 3].toSpliced(1, 0, "a", "b")');
      expect(result).toEqual([1, "a", "b", 2, 3]);
    });

    it("should handle negative start index", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate("[1, 2, 3, 4, 5].toSpliced(-2, 1)");
      expect(result).toEqual([1, 2, 3, 5]);
    });
  });

  describe("with", () => {
    it("should return a copy with element replaced", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        const updated = arr.with(1, "x");
        [updated, arr];
      `);
      expect(result[0]).toEqual([1, "x", 3]);
      expect(result[1]).toEqual([1, 2, 3]);
    });

    it("should handle negative index", () => {
      const interpreter = new Interpreter(ES2023);
      const result = interpreter.evaluate('[1, 2, 3].with(-1, "last")');
      expect(result).toEqual([1, 2, "last"]);
    });

    it("should throw for out of bounds index", () => {
      const interpreter = new Interpreter(ES2023);
      expect(() => interpreter.evaluate("[1, 2, 3].with(10, 'x')")).toThrow();
    });
  });
});
