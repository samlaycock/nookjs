import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("for...in Loops", () => {
  describe("Basic for...in with objects", () => {
    it("should iterate over object keys", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2, c: 3 };
        let keys = [];
        for (let key in obj) {
          keys[keys.length] = key;
        }
        keys
      `);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should access object values using keys", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { x: 10, y: 20, z: 30 };
        let sum = 0;
        for (let key in obj) {
          sum = sum + obj[key];
        }
        sum
      `);
      expect(result).toBe(60);
    });

    it("should work with const loop variable", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2 };
        let result = "";
        for (const key in obj) {
          result = result + key;
        }
        result
      `);
      expect(result).toBe("ab");
    });

    it("should work with existing variable", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { x: 5, y: 10 };
        let key;
        let sum = 0;
        for (key in obj) {
          sum = sum + obj[key];
        }
        key
      `);
      expect(result).toBe("y"); // Last key assigned
    });
  });

  describe("for...in with arrays", () => {
    it("should iterate over array indices", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [10, 20, 30];
        let indices = [];
        for (let i in arr) {
          indices[indices.length] = i;
        }
        indices
      `);
      expect(result).toEqual(["0", "1", "2"]); // Indices are strings
    });

    it("should access array elements using string indices", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [5, 10, 15];
        let sum = 0;
        for (let i in arr) {
          sum = sum + arr[i];
        }
        sum
      `);
      expect(result).toBe(30);
    });

    it("should work with sparse arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [];
        arr[0] = 10;
        arr[2] = 30;
        let count = 0;
        for (let i in arr) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(2); // Only defined indices
    });
  });

  describe("for...in with break and continue", () => {
    it("should break out of loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2, c: 3, d: 4 };
        let count = 0;
        for (let key in obj) {
          count = count + 1;
          if (count === 2) {
            break;
          }
        }
        count
      `);
      expect(result).toBe(2);
    });

    it("should continue to next iteration", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2, c: 3, d: 4 };
        let sum = 0;
        for (let key in obj) {
          if (key === "b") {
            continue;
          }
          sum = sum + obj[key];
        }
        sum
      `);
      expect(result).toBe(8); // 1 + 3 + 4 (skips b: 2)
    });

    it("should break and return correct key list", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { x: 10, y: 20, z: 30 };
        let keys = [];
        for (let key in obj) {
          if (obj[key] === 20) {
            break;
          }
          keys[keys.length] = key;
        }
        keys
      `);
      expect(result).toEqual(["x"]);
    });
  });

  describe("for...in in functions", () => {
    it("should work inside functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function getKeys(obj) {
          let keys = [];
          for (let key in obj) {
            keys[keys.length] = key;
          }
          return keys;
        }
        getKeys({ name: "Alice", age: 30 })
      `);
      expect(result).toEqual(["name", "age"]);
    });

    it("should return early from function", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function findKey(obj, value) {
          for (let key in obj) {
            if (obj[key] === value) {
              return key;
            }
          }
          return "not found";
        }
        findKey({ a: 10, b: 20, c: 30 }, 20)
      `);
      expect(result).toBe("b");
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let sumValues = obj => {
          let sum = 0;
          for (let key in obj) {
            sum = sum + obj[key];
          }
          return sum;
        };
        sumValues({ x: 5, y: 10, z: 15 })
      `);
      expect(result).toBe(30);
    });
  });

  describe("Nested for...in loops", () => {
    it("should handle nested for...in", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj1 = { a: 1, b: 2 };
        let obj2 = { x: 10, y: 20 };
        let count = 0;
        for (let key1 in obj1) {
          for (let key2 in obj2) {
            count = count + 1;
          }
        }
        count
      `);
      expect(result).toBe(4); // 2 * 2
    });

    it("should access nested object properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let nested = {
          person1: { name: "Alice", age: 30 },
          person2: { name: "Bob", age: 25 }
        };
        let names = [];
        for (let key in nested) {
          let person = nested[key];
          for (let prop in person) {
            if (prop === "name") {
              names[names.length] = person[prop];
            }
          }
        }
        names
      `);
      expect(result).toEqual(["Alice", "Bob"]);
    });
  });

  describe("for...in scoping", () => {
    it("should scope loop variable to iteration with let", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2 };
        let key = "outer";
        for (let key in obj) {
          // inner key shadows outer
        }
        key
      `);
      expect(result).toBe("outer");
    });

    it("should scope loop variable to iteration with const", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2, c: 3 };
        for (const key in obj) {
          // const should work since each iteration has new scope
        }
        let result = "ok";
        result
      `);
      expect(result).toBe("ok");
    });

    it("should access outer scope from loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let multiplier = 10;
        let obj = { a: 1, b: 2 };
        let sum = 0;
        for (let key in obj) {
          sum = sum + (obj[key] * multiplier);
        }
        sum
      `);
      expect(result).toBe(30); // (1*10) + (2*10)
    });
  });

  describe("for...in with conditionals", () => {
    it("should filter properties with if", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 5, b: 15, c: 25, d: 10 };
        let sum = 0;
        for (let key in obj) {
          if (obj[key] > 10) {
            sum = sum + obj[key];
          }
        }
        sum
      `);
      expect(result).toBe(40); // 15 + 25
    });

    it("should work with if-else in loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 10, b: 20, c: 30 };
        let evenSum = 0;
        let oddSum = 0;
        for (let key in obj) {
          if (obj[key] % 2 === 0) {
            evenSum = evenSum + obj[key];
          } else {
            oddSum = oddSum + obj[key];
          }
        }
        evenSum
      `);
      expect(result).toBe(60); // All are even
    });
  });

  describe("for...in with array methods", () => {
    it("should build array using for...in", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { a: 1, b: 2, c: 3 };
        let values = [];
        for (let key in obj) {
          values.push(obj[key]);
        }
        values
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should use array methods on result", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { x: 5, y: 10, z: 15 };
        let values = [];
        for (let key in obj) {
          values.push(obj[key]);
        }
        values.map(v => v * 2)
      `);
      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe("for...in with string methods", () => {
    it("should build string from keys", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { first: 1, second: 2, third: 3 };
        let result = "";
        for (let key in obj) {
          result = result + key.toUpperCase() + ",";
        }
        result.slice(0, -1)
      `);
      expect(result).toBe("FIRST,SECOND,THIRD");
    });
  });

  describe("Mixed for...in and for...of", () => {
    it("should use for...in with object and for...of with array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { items: [10, 20, 30] };
        let sum = 0;
        for (let key in obj) {
          for (let value of obj[key]) {
            sum = sum + value;
          }
        }
        sum
      `);
      expect(result).toBe(60);
    });
  });

  describe("Async for...in", () => {
    it("should work with evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let obj = { a: 1, b: 2, c: 3 };
        let sum = 0;
        for (let key in obj) {
          sum = sum + obj[key];
        }
        sum
      `);
      expect(result).toBe(6);
    });

    it("should work with async host functions", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncDouble: async (x: number) => x * 2,
        },
      });
      const result = await interpreter.evaluateAsync(`
        let obj = { a: 5, b: 10 };
        let sum = 0;
        for (let key in obj) {
          sum = sum + asyncDouble(obj[key]);
        }
        sum
      `);
      expect(result).toBe(30); // (5*2) + (10*2)
    });
  });

  describe("Edge cases", () => {
    it("should handle empty object", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        let count = 0;
        for (let key in obj) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(0);
    });

    it("should handle empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [];
        let count = 0;
        for (let key in arr) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(0);
    });

    it("should throw error for null", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = null;
          for (let key in obj) {
            // should not reach here
          }
        `);
      }).toThrow("for...in requires an object or array, got null/undefined");
    });

    it("should throw error for undefined", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj;
          for (let key in obj) {
            // should not reach here
          }
        `);
      }).toThrow("for...in requires an object or array, got null/undefined");
    });

    it("should throw error for primitives", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let num = 42;
          for (let key in num) {
            // should not reach here
          }
        `);
      }).toThrow("for...in requires an object or array, got number");
    });

    it("should handle object with numeric keys", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { 1: "one", 2: "two", 3: "three" };
        let keys = [];
        for (let key in obj) {
          keys.push(key);
        }
        keys
      `);
      expect(result).toEqual(["1", "2", "3"]);
    });
  });
});
