import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("ES2019+ Array Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(ES2024);
  });

  describe("Array.prototype.flat", () => {
    it("should flatten array by one level", () => {
      expect(interpreter.evaluate("[1, [2, 3], [4, [5]]].flat()")).toEqual([1, 2, 3, 4, [5]]);
    });

    it("should flatten nested arrays with depth", () => {
      expect(interpreter.evaluate("[1, [2, [3, [4]]]].flat(2)")).toEqual([1, 2, 3, [4]]);
    });

    it("should handle empty array", () => {
      expect(interpreter.evaluate("[].flat()")).toEqual([]);
    });
  });

  describe("Array.prototype.flatMap", () => {
    it("should map and flatten", () => {
      expect(interpreter.evaluate("[1, 2, 3].flatMap(x => [x, x * 2])")).toEqual([
        1, 2, 2, 4, 3, 6,
      ]);
    });

    it("should handle returning empty array", () => {
      expect(interpreter.evaluate("[1, 2, 3].flatMap(x => x === 2 ? [] : [x])")).toEqual([1, 3]);
    });

    it("should handle non-array return", () => {
      expect(interpreter.evaluate("[1, 2, 3].flatMap(x => x * 2)")).toEqual([2, 4, 6]);
    });
  });

  describe("Array.prototype.at", () => {
    it("should get element at positive index", () => {
      expect(interpreter.evaluate("[1, 2, 3].at(0)")).toBe(1);
    });

    it("should get element at last index", () => {
      expect(interpreter.evaluate("[1, 2, 3].at(2)")).toBe(3);
    });

    it("should get element at negative index", () => {
      expect(interpreter.evaluate("[1, 2, 3].at(-1)")).toBe(3);
    });

    it("should return undefined for out of bounds", () => {
      expect(interpreter.evaluate("[1, 2, 3].at(10)")).toBeUndefined();
    });

    it("should return undefined for negative out of bounds", () => {
      expect(interpreter.evaluate("[1, 2, 3].at(-10)")).toBeUndefined();
    });
  });

  describe("Array.prototype.findLast", () => {
    it("should find last matching element", () => {
      expect(interpreter.evaluate("[1, 2, 3, 4, 3, 2, 1].findLast(x => x > 2)")).toBe(3);
    });

    it("should return undefined when not found", () => {
      expect(interpreter.evaluate("[1, 2, 3].findLast(x => x > 10)")).toBeUndefined();
    });
  });

  describe("Array.prototype.findLastIndex", () => {
    it("should find last matching index", () => {
      expect(interpreter.evaluate("[1, 2, 3, 4, 3, 2, 1].findLastIndex(x => x > 2)")).toBe(4);
    });

    it("should return -1 when not found", () => {
      expect(interpreter.evaluate("[1, 2, 3].findLastIndex(x => x > 10)")).toBe(-1);
    });
  });

  describe("Array.prototype.toReversed", () => {
    it("should return reversed array without modifying original", () => {
      expect(
        interpreter.evaluate(`
        const arr = [1, 2, 3];
        const reversed = arr.toReversed();
        arr[0] + "-" + reversed[0]
      `),
      ).toBe("1-3");
    });

    it("should reverse array correctly", () => {
      expect(interpreter.evaluate("[1, 2, 3].toReversed()")).toEqual([3, 2, 1]);
    });
  });

  describe("Array.prototype.toSorted", () => {
    it("should return sorted array without modifying original", () => {
      expect(
        interpreter.evaluate(`
        const arr = [3, 1, 2];
        const sorted = arr.toSorted();
        arr[0] + "-" + sorted[0]
      `),
      ).toBe("3-1");
    });

    it("should sort array correctly", () => {
      expect(interpreter.evaluate("[3, 1, 2].toSorted()")).toEqual([1, 2, 3]);
    });
  });

  describe("Array.prototype.toSpliced", () => {
    it("should insert elements", () => {
      expect(interpreter.evaluate("[1, 2, 3].toSpliced(1, 0, 'a', 'b')")).toEqual([
        1,
        "a",
        "b",
        2,
        3,
      ]);
    });

    it("should remove elements", () => {
      expect(interpreter.evaluate("[1, 2, 3, 4].toSpliced(1, 2)")).toEqual([1, 4]);
    });
  });

  describe("Array.prototype.with", () => {
    it("should return new array with modified element", () => {
      expect(
        interpreter.evaluate(`
        const arr = [1, 2, 3];
        const newArr = arr.with(1, "modified");
        arr[1] + "-" + newArr[1]
      `),
      ).toBe("2-modified");
    });

    it("should modify at index", () => {
      expect(interpreter.evaluate("[1, 2, 3].with(0, 'a')")).toEqual(["a", 2, 3]);
    });
  });

  describe("Array.prototype.copyWithin", () => {
    it("should copy within array", () => {
      expect(interpreter.evaluate("[1, 2, 3, 4, 5].copyWithin(0, 3)")).toEqual([4, 5, 3, 4, 5]);
    });
  });
});
