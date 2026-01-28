import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Extended array methods", () => {
  describe("sort", () => {
    it("should sort an array in place (default)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [3, 1, 2];
        arr.sort();
        arr;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should sort with a comparison function", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [3, 1, 2];
        arr.sort((a, b) => b - a);
        arr;
      `);
      expect(result).toEqual([3, 2, 1]);
    });

    it("should sort in place and return sorted array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [2, 1];
        const sorted = arr.sort();
        sorted[0] + "," + sorted[1];
      `);
      expect(result).toBe("1,2");
    });
  });

  describe("flat", () => {
    it("should flatten one level by default", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, [2, 3], [4, [5]]];
        arr.flat();
      `);
      expect(result).toEqual([1, 2, 3, 4, [5]]);
    });

    it("should flatten to specified depth", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, [2, [3, [4]]]];
        arr.flat(2);
      `);
      expect(result).toEqual([1, 2, 3, [4]]);
    });
  });

  describe("flatMap", () => {
    it("should map and flatten one level", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        arr.flatMap(x => [x, x * 2]);
      `);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);
    });

    it("should handle non-array return values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        arr.flatMap(x => x * 10);
      `);
      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe("at", () => {
    it("should access element at positive index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = ["a", "b", "c"];
        arr.at(1);
      `);
      expect(result).toBe("b");
    });

    it("should access element at negative index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = ["a", "b", "c"];
        arr.at(-1);
      `);
      expect(result).toBe("c");
    });

    it("should return undefined for out-of-range index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2];
        arr.at(5);
      `);
      expect(result).toBeUndefined();
    });
  });

  describe("findLast", () => {
    it("should find last matching element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        arr.findLast(x => x % 2 === 0);
      `);
      expect(result).toBe(4);
    });

    it("should return undefined when no match", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 3, 5];
        arr.findLast(x => x % 2 === 0);
      `);
      expect(result).toBeUndefined();
    });
  });

  describe("findLastIndex", () => {
    it("should find last matching index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        arr.findLastIndex(x => x % 2 === 0);
      `);
      expect(result).toBe(3);
    });

    it("should return -1 when no match", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 3, 5];
        arr.findLastIndex(x => x % 2 === 0);
      `);
      expect(result).toBe(-1);
    });
  });

  describe("reduceRight", () => {
    it("should reduce from right to left", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = ["a", "b", "c"];
        arr.reduceRight((acc, val) => acc + val, "");
      `);
      expect(result).toBe("cba");
    });

    it("should use last element as initial when no initialValue", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        arr.reduceRight((acc, val) => acc - val);
      `);
      // 3 - 2 - 1 = 0
      expect(result).toBe(0);
    });
  });

  describe("forEach", () => {
    it("should iterate over all elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        let sum = 0;
        arr.forEach(x => { sum = sum + x; });
        sum;
      `);
      expect(result).toBe(6);
    });

    it("should pass index and array to callback", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = ["a", "b"];
        let indices = [];
        arr.forEach((val, idx) => { indices.push(idx); });
        indices;
      `);
      expect(result).toEqual([0, 1]);
    });

    it("should return undefined", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1];
        arr.forEach(x => x);
      `);
      expect(result).toBeUndefined();
    });
  });

  describe("splice", () => {
    it("should remove elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        const removed = arr.splice(1, 2);
        removed;
      `);
      expect(result).toEqual([2, 3]);
    });

    it("should modify the original array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        arr.splice(1, 2);
        arr;
      `);
      expect(result).toEqual([1, 4, 5]);
    });

    it("should insert elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 4, 5];
        arr.splice(1, 0, 2, 3);
        arr;
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should remove to end when no deleteCount", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4];
        arr.splice(2);
      `);
      expect(result).toEqual([3, 4]);
    });
  });

  describe("fill", () => {
    it("should fill entire array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        arr.fill(0);
        arr;
      `);
      expect(result).toEqual([0, 0, 0]);
    });

    it("should fill with start and end", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4];
        arr.fill(9, 1, 3);
        arr;
      `);
      expect(result).toEqual([1, 9, 9, 4]);
    });
  });

  describe("lastIndexOf", () => {
    it("should find last occurrence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 2, 1];
        arr.lastIndexOf(2);
      `);
      expect(result).toBe(3);
    });

    it("should return -1 when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        arr.lastIndexOf(5);
      `);
      expect(result).toBe(-1);
    });

    it("should accept fromIndex parameter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 2, 1];
        arr.lastIndexOf(2, 2);
      `);
      expect(result).toBe(1);
    });
  });
});
