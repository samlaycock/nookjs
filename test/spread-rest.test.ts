import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Spread and Rest Operators", () => {
  describe("Array Spread in Literals", () => {
    it("should spread array elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2, 3];
        [...arr];
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should spread array with additional elements before", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [2, 3];
        [1, ...arr];
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should spread array with additional elements after", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2];
        [...arr, 3];
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should spread array with elements before and after", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [2, 3];
        [1, ...arr, 4];
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should handle multiple spreads", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr1 = [1, 2];
        const arr2 = [3, 4];
        [...arr1, ...arr2];
      `);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should handle nested spreads", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, 2];
        [...[...arr, 3]];
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should spread empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [];
        [1, ...arr, 2];
      `);
      expect(result).toEqual([1, 2]);
    });

    it("should throw error when spreading non-iterable (number)", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`[...5]`);
      }).toThrow("Spread syntax requires an iterable");
    });

    it("should throw error when spreading non-iterable (object)", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`[...{a: 1}]`);
      }).toThrow("Spread syntax requires an iterable");
    });

    it("should throw error when spreading null", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`[...null]`);
      }).toThrow("Spread syntax requires an iterable");
    });

    it("should throw error when spreading undefined", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let x;
          [...x];
        `);
      }).toThrow("Spread syntax requires an iterable");
    });

    it("should spread array from function return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function getArray() {
          return [1, 2, 3];
        }
        [...getArray()];
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should spread array with undefined elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x;
        const arr = [1, x, 3];
        [...arr];
      `);
      expect(result).toEqual([1, undefined, 3]);
    });

    it("should handle spread with holes", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [1, , 3];
        [...arr];
      `);
      expect(result).toEqual([1, undefined, 3]);
    });
  });

  describe("Object Spread in Literals", () => {
    it("should spread object properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1, b: 2};
        ({...obj});
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should spread object with additional properties before", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {b: 2, c: 3};
        ({a: 1, ...obj});
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should spread object with additional properties after", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1, b: 2};
        ({...obj, c: 3});
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should override properties when spread comes first", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1, b: 2};
        ({...obj, b: 99});
      `);
      expect(result).toEqual({ a: 1, b: 99 });
    });

    it("should be overridden when spread comes after", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1, b: 99};
        ({b: 2, ...obj});
      `);
      expect(result).toEqual({ a: 1, b: 99 });
    });

    it("should handle multiple spreads", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj1 = {a: 1, b: 2};
        const obj2 = {c: 3, d: 4};
        ({...obj1, ...obj2});
      `);
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it("should handle nested spreads", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1};
        ({...{...obj, b: 2}});
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should spread empty object", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {};
        ({a: 1, ...obj, b: 2});
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should throw error when spreading array", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`({...[1, 2, 3]})`);
      }).toThrow("Spread syntax in objects requires an object");
    });

    it("should throw error when spreading null", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`({...null})`);
      }).toThrow("Spread syntax in objects requires an object");
    });

    it("should throw error when spreading undefined", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let x;
          ({...x});
        `);
      }).toThrow("Spread syntax in objects requires an object");
    });

    it("should throw error when spreading primitive (number)", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`({...5})`);
      }).toThrow("Spread syntax in objects requires an object");
    });

    it("should spread object from function return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function getObject() {
          return {a: 1, b: 2};
        }
        ({...getObject()});
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should handle spreading objects with undefined values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x;
        const obj = {a: 1, b: x};
        ({...obj});
      `);
      expect(result).toEqual({ a: 1, b: undefined });
    });

    it("should handle multiple overlapping spreads", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj1 = {a: 1, b: 2};
        const obj2 = {b: 99, c: 3};
        ({...obj1, ...obj2});
      `);
      expect(result).toEqual({ a: 1, b: 99, c: 3 });
    });
  });

  describe("Call Spread for Function Arguments", () => {
    it("should spread array as function arguments", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(a, b, c) {
          return a + b + c;
        }
        const args = [1, 2, 3];
        sum(...args);
      `);
      expect(result).toBe(6);
    });

    it("should spread with additional arguments before", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(a, b, c, d) {
          return a + b + c + d;
        }
        const args = [2, 3, 4];
        sum(1, ...args);
      `);
      expect(result).toBe(10);
    });

    it("should spread with additional arguments after", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(a, b, c, d) {
          return a + b + c + d;
        }
        const args = [1, 2, 3];
        sum(...args, 4);
      `);
      expect(result).toBe(10);
    });

    it("should handle multiple spreads in call", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(a, b, c, d) {
          return a + b + c + d;
        }
        const args1 = [1, 2];
        const args2 = [3, 4];
        sum(...args1, ...args2);
      `);
      expect(result).toBe(10);
    });

    it("should spread empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(a, b) {
          return a + b;
        }
        const args = [];
        sum(1, ...args, 2);
      `);
      expect(result).toBe(3);
    });

    it("should throw error when spreading non-array in call", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function fn(a) { return a; }
          fn(...5);
        `);
      }).toThrow("Spread syntax in function calls requires an array");
    });

    it("should throw error when spreading object in call", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function fn(a) { return a; }
          fn(...{a: 1});
        `);
      }).toThrow("Spread syntax in function calls requires an array");
    });

    it("should work with rest parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function collect(...args) {
          return args;
        }
        const arr = [1, 2, 3];
        collect(...arr);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const sum = (a, b, c) => a + b + c;
        const args = [1, 2, 3];
        sum(...args);
      `);
      expect(result).toBe(6);
    });

    it("should spread into host function", () => {
      const interpreter = new Interpreter();
      // Use a custom function since Math is not available
      const result = interpreter.evaluate(`
        const max = function(...args) {
          let m = args[0];
          for (let i = 1; i < args.length; i++) {
            if (args[i] > m) m = args[i];
          }
          return m;
        };
        const args = [1, 2, 3];
        max(...args);
      `);
      expect(result).toBe(3);
    });

    it("should handle nested array spreads in calls", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(...args) {
          let total = 0;
          for (const n of args) {
            total = total + n;
          }
          return total;
        }
        const arr = [[1, 2], [3, 4]];
        sum(...arr[0], ...arr[1]);
      `);
      expect(result).toBe(10);
    });
  });

  describe("Array Rest in Destructuring", () => {
    it("should collect remaining array elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, ...rest] = [1, 2, 3, 4];
        rest;
      `);
      expect(result).toEqual([2, 3, 4]);
    });

    it("should collect with multiple elements before rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, b, ...rest] = [1, 2, 3, 4, 5];
        rest;
      `);
      expect(result).toEqual([3, 4, 5]);
    });

    it("should create empty array when no remaining elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, b, ...rest] = [1, 2];
        rest;
      `);
      expect(result).toEqual([]);
    });

    it("should handle rest as only element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [...rest] = [1, 2, 3];
        rest;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with let declaration", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, ...rest] = [1, 2, 3];
        rest;
      `);
      expect(result).toEqual([2, 3]);
    });

    it("should work with assignment pattern", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let a, rest;
        [a, ...rest] = [1, 2, 3];
        rest;
      `);
      expect(result).toEqual([2, 3]);
    });

    it("should work with defaults before rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a = 10, b = 20, ...rest] = [1];
        rest;
      `);
      expect(result).toEqual([]);
    });

    it("should handle nested destructuring with rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [[a], ...rest] = [[1], 2, 3];
        rest;
      `);
      expect(result).toEqual([2, 3]);
    });

    it("should collect undefined elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x;
        const [a, ...rest] = [1, x, 3];
        rest;
      `);
      expect(result).toEqual([undefined, 3]);
    });

    it("should handle rest with holes", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, ...rest] = [1, , 3];
        rest;
      `);
      expect(result).toEqual([undefined, 3]);
    });

    it("should collect empty when array too short", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, b, c, ...rest] = [1, 2];
        rest;
      `);
      expect(result).toEqual([]);
    });
  });

  describe("Object Rest in Destructuring", () => {
    it("should collect remaining object properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a, ...rest} = {a: 1, b: 2, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should collect with multiple properties before rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a, b, ...rest} = {a: 1, b: 2, c: 3, d: 4};
        rest;
      `);
      expect(result).toEqual({ c: 3, d: 4 });
    });

    it("should create empty object when no remaining properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a, b, ...rest} = {a: 1, b: 2};
        rest;
      `);
      expect(result).toEqual({});
    });

    it("should handle rest as only element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {...rest} = {a: 1, b: 2};
        rest;
      `);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should work with let declaration", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {a, ...rest} = {a: 1, b: 2, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should work with assignment pattern", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let a, rest;
        ({a, ...rest} = {a: 1, b: 2, c: 3});
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should work with defaults before rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a = 10, b = 20, ...rest} = {a: 1, c: 3};
        rest;
      `);
      expect(result).toEqual({ c: 3 });
    });

    it("should handle nested destructuring with rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a: {x}, ...rest} = {a: {x: 1}, b: 2, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should collect undefined values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x;
        const {a, ...rest} = {a: 1, b: x, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: undefined, c: 3 });
    });

    it("should work with renamed properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const {a: x, ...rest} = {a: 1, b: 2, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should handle computed property names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const key = "a";
        const {[key]: x, ...rest} = {a: 1, b: 2, c: 3};
        rest;
      `);
      expect(result).toEqual({ b: 2, c: 3 });
    });
  });

  describe("Rest Parameters in Functions", () => {
    it("should collect rest parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(...args) {
          return args;
        }
        fn(1, 2, 3);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should collect with regular parameters before rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(a, b, ...rest) {
          return rest;
        }
        fn(1, 2, 3, 4, 5);
      `);
      expect(result).toEqual([3, 4, 5]);
    });

    it("should create empty array when no rest arguments", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(a, b, ...rest) {
          return rest;
        }
        fn(1, 2);
      `);
      expect(result).toEqual([]);
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const fn = (...args) => args;
        fn(1, 2, 3);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with function expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const fn = function(...args) {
          return args;
        };
        fn(1, 2, 3);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should allow accessing rest parameter multiple times", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(...args) {
          return args.length + args[0];
        }
        fn(10, 20, 30);
      `);
      expect(result).toBe(13);
    });

    it("should work with spread in call", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(...args) {
          return args;
        }
        const arr = [1, 2, 3];
        fn(...arr);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle rest with regular params and spread", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(a, ...rest) {
          return [a, rest];
        }
        const arr = [2, 3, 4];
        fn(1, ...arr);
      `);
      expect(result).toEqual([1, [2, 3, 4]]);
    });

    it("should throw error when too few arguments", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function fn(a, b, ...rest) {
            return rest;
          }
          fn(1);
        `);
      }).toThrow("Expected at least 2 arguments but got 1");
    });

    it("should allow zero arguments when only rest parameter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(...args) {
          return args;
        }
        fn();
      `);
      expect(result).toEqual([]);
    });

    it("should work in async functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluateAsync(`
        async function fn(...args) {
          return args;
        }
        fn(1, 2, 3);
      `);
      expect(result).resolves.toEqual([1, 2, 3]);
    });

    it("should work in async arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluateAsync(`
        const fn = async (...args) => args;
        fn(1, 2, 3);
      `);
      expect(result).resolves.toEqual([1, 2, 3]);
    });

    it("should handle complex rest parameter usage", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(...numbers) {
          let total = 0;
          for (const n of numbers) {
            total = total + n;
          }
          return total;
        }
        sum(1, 2, 3, 4, 5);
      `);
      expect(result).toBe(15);
    });

    it("should work with closures", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function makeAdder(...base) {
          return function(...args) {
            let sum = 0;
            for (const n of base) {
              sum = sum + n;
            }
            for (const n of args) {
              sum = sum + n;
            }
            return sum;
          };
        }
        const addTo10 = makeAdder(1, 2, 3, 4);
        addTo10(5, 6);
      `);
      expect(result).toBe(21);
    });
  });

  describe("Integration Tests", () => {
    it("should combine spread and rest in same expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function collect(...args) {
          return args;
        }
        const arr = [1, 2, 3];
        collect(...arr, 4, 5);
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should destructure spread result", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr1 = [1, 2];
        const arr2 = [3, 4];
        const [a, b, ...rest] = [...arr1, ...arr2];
        rest;
      `);
      expect(result).toEqual([3, 4]);
    });

    it("should spread in object and array simultaneously", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {a: 1, b: 2};
        const arr = [3, 4];
        ({...obj, arr: [...arr]});
      `);
      expect(result).toEqual({ a: 1, b: 2, arr: [3, 4] });
    });

    it("should use rest in nested functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function outer(...args1) {
          function inner(...args2) {
            return [...args1, ...args2];
          }
          return inner(4, 5);
        }
        outer(1, 2, 3);
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle complex destructuring with spread", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const data = {
          arr: [1, 2, 3, 4],
          obj: {x: 10, y: 20}
        };
        const {arr: [first, ...restArr], obj: {...restObj}} = data;
        [restArr, restObj];
      `);
      expect(result).toEqual([[2, 3, 4], { x: 10, y: 20 }]);
    });

    it("should spread multiple times in single call", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function fn(...args) {
          return args;
        }
        fn(...[1, 2], 3, ...[4, 5]);
      `);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle rest in method calls", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          method(...args) {
            return args;
          }
        };
        obj.method(1, 2, 3);
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should work with recursive functions using rest", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sum(...nums) {
          if (nums.length === 0) return 0;
          const [first, ...rest] = nums;
          return first + sum(...rest);
        }
        sum(1, 2, 3, 4, 5);
      `);
      expect(result).toBe(15);
    });

    it("should handle array spread in returned object", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function process(...nums) {
          return {
            original: nums,
            doubled: [...nums.map(n => n * 2)]
          };
        }
        process(1, 2, 3);
      `);
      expect(result).toEqual({
        original: [1, 2, 3],
        doubled: [2, 4, 6],
      });
    });

    it("should combine all features in complex scenario", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function transform(obj, arr) {
          const {a, ...objRest} = obj;
          const [...arrRest] = arr;
          return function(...fnRest) {
            return {
              obj: {...objRest, new: a},
              arr: [...arrRest, ...fnRest]
            };
          };
        }
        const fn = transform({a: 1, b: 2, c: 3}, [10, 20, 30]);
        fn(100, 200);
      `);
      expect(result).toEqual({
        obj: { b: 2, c: 3, new: 1 },
        arr: [10, 20, 30, 100, 200],
      });
    });
  });
});
