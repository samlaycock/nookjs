import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("for...of with destructuring", () => {
  describe("Array destructuring", () => {
    it("should support array destructuring with const", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let sum = 0;
        const pairs = [[1, 2], [3, 4], [5, 6]];
        for (const [a, b] of pairs) {
          sum += a + b;
        }
        sum;
      `);
      expect(result).toBe(21);
    });

    it("should support array destructuring with let", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const entries = [[1, 10], [2, 20]];
        for (let [key, value] of entries) {
          key = key * 2;
          results.push(key + value);
        }
        results;
      `);
      expect(result).toEqual([12, 24]);
    });

    it("should support nested array destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const data = [[1, [2, 3]], [4, [5, 6]]];
        for (const [a, [b, c]] of data) {
          results.push(a + b + c);
        }
        results;
      `);
      expect(result).toEqual([6, 15]);
    });

    it("should support rest element in array destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const arrays = [[1, 2, 3, 4], [5, 6, 7, 8]];
        for (const [first, ...rest] of arrays) {
          results.push([first, rest]);
        }
        results;
      `);
      expect(result).toEqual([
        [1, [2, 3, 4]],
        [5, [6, 7, 8]],
      ]);
    });

    it("should support default values in array destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const data = [[1], [2, 3], [4]];
        for (const [a, b = 0] of data) {
          results.push(a + b);
        }
        results;
      `);
      expect(result).toEqual([1, 5, 4]);
    });
  });

  describe("Object destructuring", () => {
    it("should support object destructuring with const", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let names = [];
        const people = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
        for (const { name } of people) {
          names.push(name);
        }
        names;
      `);
      expect(result).toEqual(["Alice", "Bob"]);
    });

    it("should support object destructuring with let", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const items = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
        for (let { x, y } of items) {
          x = x * 10;
          results.push(x + y);
        }
        results;
      `);
      expect(result).toEqual([12, 34]);
    });

    it("should support renaming in object destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const items = [{ a: 1 }, { a: 2 }];
        for (const { a: value } of items) {
          results.push(value * 2);
        }
        results;
      `);
      expect(result).toEqual([2, 4]);
    });

    it("should support default values in object destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const items = [{ a: 1 }, { a: 2, b: 3 }];
        for (const { a, b = 0 } of items) {
          results.push(a + b);
        }
        results;
      `);
      expect(result).toEqual([1, 5]);
    });

    it("should support nested object destructuring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let results = [];
        const data = [
          { outer: { inner: 1 } },
          { outer: { inner: 2 } }
        ];
        for (const { outer: { inner } } of data) {
          results.push(inner);
        }
        results;
      `);
      expect(result).toEqual([1, 2]);
    });
  });

  describe("Mixed and edge cases", () => {
    it("should work with Map.entries()-like data", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        const entries = [['a', 1], ['b', 2], ['c', 3]];
        for (const [key, value] of entries) {
          obj[key] = value;
        }
        obj;
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should work with generators", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* pairs() {
          yield [1, 2];
          yield [3, 4];
        }
        let sum = 0;
        for (const [a, b] of pairs()) {
          sum += a + b;
        }
        sum;
      `);
      expect(result).toBe(10);
    });

    it("should create new scope per iteration for closures", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const funcs = [];
        const pairs = [[1, 'a'], [2, 'b'], [3, 'c']];
        for (const [num, letter] of pairs) {
          funcs.push(() => num + letter);
        }
        [funcs[0](), funcs[1](), funcs[2]()];
      `);
      expect(result).toEqual(["1a", "2b", "3c"]);
    });
  });

  describe("Async evaluation", () => {
    it("should support destructuring in async for...of", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        const pairs = [[1, 2], [3, 4]];
        for (const [a, b] of pairs) {
          sum += a + b;
        }
        sum;
      `);
      expect(result).toBe(10);
    });

    it("should support object destructuring in async for...of", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let names = [];
        const items = [{ name: 'X' }, { name: 'Y' }];
        for (const { name } of items) {
          names.push(name);
        }
        names;
      `);
      expect(result).toEqual(["X", "Y"]);
    });
  });
});
