import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("for...of Loops", () => {
  describe("Basic for...of", () => {
    it("should iterate over array elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let sum = 0;
        let arr = [1, 2, 3, 4, 5];
        for (let num of arr) {
          sum = sum + num;
        }
        sum
      `);
      expect(result).toBe(15);
    });

    it("should work with const loop variable", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let product = 1;
        let arr = [2, 3, 4];
        for (const num of arr) {
          product = product * num;
        }
        product
      `);
      expect(result).toBe(24);
    });

    it("should iterate over string array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = "";
        let words = ["hello", " ", "world"];
        for (let word of words) {
          result = result + word;
        }
        result
      `);
      expect(result).toBe("hello world");
    });

    it("should work with empty array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        for (let item of []) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(0);
    });

    it("should work with single element array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let value = 0;
        for (let x of [42]) {
          value = x;
        }
        value
      `);
      expect(result).toBe(42);
    });
  });

  describe("for...of with existing variable", () => {
    it("should use existing variable for iteration", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let num = 0;
        let sum = 0;
        for (num of [10, 20, 30]) {
          sum = sum + num;
        }
        sum
      `);
      expect(result).toBe(60);
    });

    it("should preserve final value of loop variable", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let item = 0;
        for (item of [1, 2, 3]) {
          // iterate
        }
        item
      `);
      expect(result).toBe(3);
    });
  });

  describe("for...of with objects", () => {
    it("should iterate over array of objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let people = [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
          { name: "Charlie", age: 35 }
        ];
        let totalAge = 0;
        for (let person of people) {
          totalAge = totalAge + person.age;
        }
        totalAge
      `);
      expect(result).toBe(90);
    });

    it("should access object properties in loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let users = [
          { id: 1, active: true },
          { id: 2, active: false },
          { id: 3, active: true }
        ];
        let activeCount = 0;
        for (let user of users) {
          if (user.active) {
            activeCount = activeCount + 1;
          }
        }
        activeCount
      `);
      expect(result).toBe(2);
    });
  });

  describe("for...of with nested arrays", () => {
    it("should iterate over 2D array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let matrix = [[1, 2], [3, 4], [5, 6]];
        let sum = 0;
        for (let row of matrix) {
          for (let val of row) {
            sum = sum + val;
          }
        }
        sum
      `);
      expect(result).toBe(21);
    });

    it("should flatten nested array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let nested = [[1, 2], [3], [4, 5, 6]];
        let flat = [];
        let index = 0;
        for (let arr of nested) {
          for (let val of arr) {
            flat[index] = val;
            index = index + 1;
          }
        }
        flat.length
      `);
      expect(result).toBe(6);
    });
  });

  describe("for...of with break", () => {
    it("should exit loop on break", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3, 4, 5];
        let sum = 0;
        for (let num of arr) {
          if (num > 3) {
            break;
          }
          sum = sum + num;
        }
        sum
      `);
      expect(result).toBe(6); // 1+2+3
    });

    it("should find first matching element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [1, 3, 5, 8, 9, 10];
        let found = 0;
        for (let num of numbers) {
          if (num % 2 === 0) {
            found = num;
            break;
          }
        }
        found
      `);
      expect(result).toBe(8);
    });
  });

  describe("for...of with continue", () => {
    it("should skip even numbers", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [1, 2, 3, 4, 5, 6];
        let sum = 0;
        for (let num of numbers) {
          if (num % 2 === 0) {
            continue;
          }
          sum = sum + num;
        }
        sum
      `);
      expect(result).toBe(9); // 1+3+5
    });

    it("should process only positive numbers", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [-2, 5, -1, 3, 0, 7];
        let count = 0;
        for (let num of numbers) {
          if (num <= 0) {
            continue;
          }
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(3);
    });
  });

  describe("for...of in functions", () => {
    it("should work in function body", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function sumArray(arr) {
          let total = 0;
          for (let num of arr) {
            total = total + num;
          }
          return total;
        }
        sumArray([10, 20, 30, 40])
      `);
      expect(result).toBe(100);
    });

    it("should support early return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function findFirstNegative(arr) {
          for (let num of arr) {
            if (num < 0) {
              return num;
            }
          }
          return 0;
        }
        findFirstNegative([5, 3, -2, 8, -1])
      `);
      expect(result).toBe(-2);
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let maxValue = arr => {
          let max = arr[0];
          for (let val of arr) {
            if (val > max) {
              max = val;
            }
          }
          return max;
        };
        maxValue([3, 9, 1, 7, 5])
      `);
      expect(result).toBe(9);
    });
  });

  describe("for...of scoping", () => {
    it("should scope loop variable to loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 100;
        for (let x of [1, 2, 3]) {
          // x is scoped to loop
        }
        x
      `);
      expect(result).toBe(100);
    });

    it("should allow nested for...of with same variable name", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        for (let i of [1, 2]) {
          for (let i of [10, 20]) {
            count = count + i;
          }
        }
        count
      `);
      expect(result).toBe(60); // (10+20) * 2
    });

    it("should access outer scope variables", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let multiplier = 10;
        let result = 0;
        for (let num of [1, 2, 3]) {
          result = result + (num * multiplier);
        }
        result
      `);
      expect(result).toBe(60);
    });
  });

  describe("for...of with conditionals", () => {
    it("should work with if/else in body", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [1, 2, 3, 4, 5, 6];
        let evenSum = 0;
        let oddSum = 0;
        for (let num of numbers) {
          if (num % 2 === 0) {
            evenSum = evenSum + num;
          } else {
            oddSum = oddSum + num;
          }
        }
        evenSum - oddSum
      `);
      expect(result).toBe(3); // (2+4+6) - (1+3+5)
    });

    it("should support nested conditionals", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let values = [10, 25, 5, 30, 15];
        let category = "";
        for (let val of values) {
          if (val > 20) {
            if (val > 25) {
              category = "high";
            } else {
              category = "medium";
            }
          }
        }
        category
      `);
      expect(result).toBe("high");
    });
  });

  describe("for...of with array modifications", () => {
    it("should build new array from elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [1, 2, 3, 4];
        let doubled = [];
        let index = 0;
        for (let num of numbers) {
          doubled[index] = num * 2;
          index = index + 1;
        }
        doubled[2]
      `);
      expect(result).toBe(6);
    });

    it("should filter array elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let numbers = [1, 2, 3, 4, 5, 6, 7, 8];
        let evens = [];
        let index = 0;
        for (let num of numbers) {
          if (num % 2 === 0) {
            evens[index] = num;
            index = index + 1;
          }
        }
        evens.length
      `);
      expect(result).toBe(4);
    });
  });

  describe("Async for...of", () => {
    it("should work in evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        for (let num of [1, 2, 3, 4]) {
          sum = sum + num;
        }
        sum
      `);
      expect(result).toBe(10);
    });

    it("should work with async host functions", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncDouble: async (x: number) => x * 2,
        },
      });
      const result = await interpreter.evaluateAsync(`
        let sum = 0;
        for (let num of [1, 2, 3]) {
          sum = sum + asyncDouble(num);
        }
        sum
      `);
      expect(result).toBe(12); // 2+4+6
    });

    it("should support async operations in nested loops", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncAdd: async (a: number, b: number) => a + b,
        },
      });
      const result = await interpreter.evaluateAsync(`
        let total = 0;
        for (let i of [1, 2]) {
          for (let j of [10, 20]) {
            total = asyncAdd(total, i * j);
          }
        }
        total
      `);
      expect(result).toBe(90); // (1*10 + 1*20 + 2*10 + 2*20)
    });

    it("should work with async sandbox functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function processArray(arr) {
          let result = 0;
          for (let val of arr) {
            result = result + val;
          }
          return result;
        }
        processArray([5, 10, 15, 20])
      `);
      expect(result).toBe(50);
    });
  });

  describe("Error cases", () => {
    it("should throw error for non-array iterable", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          for (let x of 123) {
            // error
          }
        `);
      }).toThrow("for...of requires an iterable (array)");
    });

    it("should throw error for null iterable", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          for (let x of null) {
            // error
          }
        `);
      }).toThrow("for...of requires an iterable (array)");
    });

    it("should throw error for string iterable", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          for (let x of "hello") {
            // error
          }
        `);
      }).toThrow("for...of requires an iterable (array)");
    });

    it("should throw error for object iterable", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          for (let x of obj) {
            // error
          }
        `);
      }).toThrow("for...of requires an iterable (array)");
    });
  });

  describe("Edge cases", () => {
    it("should handle array with boolean values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, true, 3];
        let count = 0;
        for (let val of arr) {
          count = count + 1;
        }
        count
      `);
      expect(result).toBe(3);
    });

    it("should handle array with null values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [null, 2, null, 4];
        let sum = 0;
        for (let val of arr) {
          if (val !== null) {
            sum = sum + val;
          }
        }
        sum
      `);
      expect(result).toBe(6);
    });

    it("should handle array with mixed types", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, "hello", true, 42];
        let count = 0;
        for (let val of arr) {
          if (typeof val === "number") {
            count = count + 1;
          }
        }
        count
      `);
      expect(result).toBe(2);
    });

    it("should work with array from function call", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function getArray() {
          return [10, 20, 30];
        }
        let sum = 0;
        for (let val of getArray()) {
          sum = sum + val;
        }
        sum
      `);
      expect(result).toBe(60);
    });
  });
});
