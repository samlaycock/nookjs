import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Array Methods", () => {
  describe("push", () => {
    it("should add element to end of array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.push(4);
        arr
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should return new length", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2];
        arr.push(3)
      `);
      expect(result).toBe(3);
    });

    it("should add multiple elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1];
        arr.push(2, 3, 4);
        arr
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe("pop", () => {
    it("should remove and return last element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.pop()
      `);
      expect(result).toBe(3);
    });

    it("should modify the array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.pop();
        arr
      `);
      expect(result).toEqual([1, 2]);
    });

    it("should return undefined for empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [];
        arr.pop()
      `);
      expect(result).toBe(undefined);
    });
  });

  describe("shift", () => {
    it("should remove and return first element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.shift()
      `);
      expect(result).toBe(1);
    });

    it("should modify the array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.shift();
        arr
      `);
      expect(result).toEqual([2, 3]);
    });
  });

  describe("unshift", () => {
    it("should add element to beginning", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [2, 3];
        arr.unshift(1);
        arr
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return new length", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1];
        arr.unshift(0)
      `);
      expect(result).toBe(2);
    });

    it("should add multiple elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [4, 5];
        arr.unshift(1, 2, 3);
        arr
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("slice", () => {
    it("should return subarray", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5];
        arr.slice(1, 3)
      `);
      expect(result).toEqual([2, 3]);
    });

    it("should not modify original array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.slice(0, 2);
        arr
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with single argument", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4];
        arr.slice(2)
      `);
      expect(result).toEqual([3, 4]);
    });

    it("should work with no arguments (copy)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.slice()
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("concat", () => {
    it("should concatenate arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr1 = [1, 2];
        let arr2 = [3, 4];
        arr1.concat(arr2)
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should not modify original arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr1 = [1, 2];
        let arr2 = [3, 4];
        arr1.concat(arr2);
        arr1
      `);
      expect(result).toEqual([1, 2]);
    });

    it("should concatenate multiple arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1];
        arr.concat([2], [3], [4])
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should concatenate single values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2];
        arr.concat(3, 4, 5)
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("indexOf", () => {
    it("should find element index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [10, 20, 30, 40];
        arr.indexOf(30)
      `);
      expect(result).toBe(2);
    });

    it("should return -1 when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.indexOf(5)
      `);
      expect(result).toBe(-1);
    });

    it("should work with fromIndex", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 2, 1];
        arr.indexOf(2, 2)
      `);
      expect(result).toBe(3);
    });
  });

  describe("includes", () => {
    it("should return true when element exists", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.includes(2)
      `);
      expect(result).toBe(true);
    });

    it("should return false when element doesn't exist", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.includes(5)
      `);
      expect(result).toBe(false);
    });
  });

  describe("join", () => {
    it("should join with default comma separator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.join()
      `);
      expect(result).toBe("1,2,3");
    });

    it("should join with custom separator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = ["hello", "world"];
        arr.join(" ")
      `);
      expect(result).toBe("hello world");
    });

    it("should join with empty separator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = ["a", "b", "c"];
        arr.join("")
      `);
      expect(result).toBe("abc");
    });
  });

  describe("reverse", () => {
    it("should reverse array in place", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4];
        arr.reverse();
        arr
      `);
      expect(result).toEqual([4, 3, 2, 1]);
    });

    it("should return the reversed array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.reverse()
      `);
      expect(result).toEqual([3, 2, 1]);
    });
  });

  describe("map", () => {
    it("should map elements with function", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.map(x => x * 2)
      `);
      expect(result).toEqual([2, 4, 6]);
    });

    it("should pass index to callback", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [10, 20, 30];
        arr.map((val, i) => val + i)
      `);
      expect(result).toEqual([10, 21, 32]);
    });

    it("should work with regular functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.map(function(x) { return x + 10; })
      `);
      expect(result).toEqual([11, 12, 13]);
    });

    it("should not modify original array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.map(x => x * 2);
        arr
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("filter", () => {
    it("should filter elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5, 6];
        arr.filter(x => x % 2 === 0)
      `);
      expect(result).toEqual([2, 4, 6]);
    });

    it("should pass index to callback", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [10, 20, 30, 40];
        arr.filter((val, i) => i < 2)
      `);
      expect(result).toEqual([10, 20]);
    });

    it("should return empty array when no matches", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.filter(x => x > 10)
      `);
      expect(result).toEqual([]);
    });
  });

  describe("reduce", () => {
    it("should reduce with initial value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4];
        arr.reduce((acc, val) => acc + val, 0)
      `);
      expect(result).toBe(10);
    });

    it("should reduce without initial value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4];
        arr.reduce((acc, val) => acc + val)
      `);
      expect(result).toBe(10);
    });

    it("should pass index and array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [10, 20, 30];
        arr.reduce((acc, val, i) => acc + (val * i), 0)
      `);
      expect(result).toBe(80); // (10*0) + (20*1) + (30*2)
    });

    it("should throw error for empty array without initial value", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let arr = [];
          arr.reduce((acc, val) => acc + val)
        `);
      }).toThrow("Reduce of empty array with no initial value");
    });

    it("should work for building objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.reduce((acc, val) => {
          acc[val] = val * 2;
          return acc;
        }, {})
      `);
      expect(result).toEqual({ 1: 2, 2: 4, 3: 6 });
    });
  });

  describe("find", () => {
    it("should find first matching element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5];
        arr.find(x => x > 3)
      `);
      expect(result).toBe(4);
    });

    it("should return undefined when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.find(x => x > 10)
      `);
      expect(result).toBe(undefined);
    });

    it("should work with objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" }
        ];
        arr.find(x => x.id === 2)
      `);
      expect(result).toEqual({ id: 2, name: "Bob" });
    });
  });

  describe("findIndex", () => {
    it("should find first matching index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5];
        arr.findIndex(x => x > 3)
      `);
      expect(result).toBe(3);
    });

    it("should return -1 when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        arr.findIndex(x => x > 10)
      `);
      expect(result).toBe(-1);
    });
  });

  describe("every", () => {
    it("should return true when all match", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [2, 4, 6, 8];
        arr.every(x => x % 2 === 0)
      `);
      expect(result).toBe(true);
    });

    it("should return false when one doesn't match", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [2, 4, 5, 8];
        arr.every(x => x % 2 === 0)
      `);
      expect(result).toBe(false);
    });

    it("should return true for empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [];
        arr.every(x => x > 100)
      `);
      expect(result).toBe(true);
    });
  });

  describe("some", () => {
    it("should return true when at least one matches", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 3, 5, 6];
        arr.some(x => x % 2 === 0)
      `);
      expect(result).toBe(true);
    });

    it("should return false when none match", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 3, 5, 7];
        arr.some(x => x % 2 === 0)
      `);
      expect(result).toBe(false);
    });

    it("should return false for empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [];
        arr.some(x => true)
      `);
      expect(result).toBe(false);
    });
  });

  describe("Method chaining", () => {
    it("should chain map and filter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5];
        arr.map(x => x * 2).filter(x => x > 5)
      `);
      expect(result).toEqual([6, 8, 10]);
    });

    it("should chain multiple methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4];
        arr
          .map(x => x * 2)
          .filter(x => x > 4)
          .reduce((acc, val) => acc + val, 0)
      `);
      expect(result).toBe(14); // 6 + 8
    });

    it("should chain with slice", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5, 6];
        arr.slice(1, 4).map(x => x * 10)
      `);
      expect(result).toEqual([20, 30, 40]);
    });
  });

  describe("Async array methods", () => {
    it("should work with evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let arr = [1, 2, 3];
        arr.map(x => x * 2)
      `);
      expect(result).toEqual([2, 4, 6]);
    });

    it("should work in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function processArray() {
          let arr = [1, 2, 3, 4, 5];
          return arr.filter(x => x > 2).reduce((acc, val) => acc + val, 0);
        }
        processArray()
      `);
      expect(result).toBe(12); // 3 + 4 + 5
    });
  });
});
