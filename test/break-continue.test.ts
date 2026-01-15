import { describe, it, expect } from "bun:test";
import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Break and Continue", () => {
  describe("Break in while loops", () => {
    it("should break out of while loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        let i = 0;
        while (i < 10) {
          if (i === 5) {
            break;
          }
          sum = sum + i;
          i = i + 1;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should break immediately when condition is met", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        while (true) {
          count = count + 1;
          if (count === 3) {
            break;
          }
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    it("should support break with multiple conditions", () => {
      const interpreter = new Interpreter();
      const code = `
        let i = 0;
        let result = 0;
        while (i < 100) {
          if (i % 3 === 0 && i > 10) {
            break;
          }
          result = i;
          i = i + 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(11);
    });

    it("should handle break in nested if", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        let i = 1;
        while (i <= 10) {
          if (i > 5) {
            if (i === 7) {
              break;
            }
          }
          sum = sum + i;
          i = i + 1;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(21); // 1+2+3+4+5+6
    });
  });

  describe("Continue in while loops", () => {
    it("should continue to next iteration", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        let i = 0;
        while (i < 10) {
          i = i + 1;
          if (i % 2 === 0) {
            continue;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
    });

    it("should skip rest of loop body after continue", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        let i = 0;
        while (i < 5) {
          i = i + 1;
          if (i === 3) {
            continue;
          }
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(4); // skips i=3
    });

    it("should handle multiple continues", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        let i = 0;
        while (i < 10) {
          i = i + 1;
          if (i % 2 === 0) {
            continue;
          }
          if (i > 7) {
            continue;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(16); // 1+3+5+7
    });
  });

  describe("Break in for loops", () => {
    it("should break out of for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 10; i++) {
          if (i === 5) {
            break;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should break from infinite for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (;;) {
          count = count + 1;
          if (count === 5) {
            break;
          }
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    it("should break with complex condition", () => {
      const interpreter = new Interpreter();
      const code = `
        let result = 0;
        for (let i = 1; i <= 100; i++) {
          if (i * i > 50) {
            break;
          }
          result = i;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(7); // 7*7=49, 8*8=64
    });
  });

  describe("Continue in for loops", () => {
    it("should continue to next iteration in for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 10; i++) {
          if (i % 2 === 0) {
            continue;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
    });

    it("should execute update expression after continue", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 0; i < 5; i++) {
          if (i === 2) {
            continue;
          }
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(4); // skips i=2
    });

    it("should handle continue with multiple conditions", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 1; i <= 10; i++) {
          if (i % 2 === 0 || i > 7) {
            continue;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(16); // 1+3+5+7
    });
  });

  describe("Nested loops with break", () => {
    it("should break only inner loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 3) {
              break;
            }
            sum = sum + 1;
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(9); // 3 * 3
    });

    it("should break inner while loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let result = 0;
        let i = 0;
        while (i < 3) {
          let j = 0;
          while (j < 5) {
            if (j === 2) {
              break;
            }
            result = result + 1;
            j = j + 1;
          }
          i = i + 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(6); // 3 * 2
    });

    it("should break outer loop from inner condition", () => {
      const interpreter = new Interpreter();
      const code = `
        let found = 0;
        let done = 0;
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (i === 2 && j === 3) {
              found = 1;
              done = 1;
            }
            if (done) {
              break;
            }
          }
          if (done) {
            break;
          }
        }
        found
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });
  });

  describe("Nested loops with continue", () => {
    it("should continue only inner loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 2) {
              continue;
            }
            sum = sum + 1;
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(12); // 3 * 4
    });

    it("should continue inner while loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        let i = 0;
        while (i < 3) {
          let j = 0;
          while (j < 5) {
            j = j + 1;
            if (j === 3) {
              continue;
            }
            count = count + 1;
          }
          i = i + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(12); // 3 * 4
    });
  });

  describe("Break and continue with arrays", () => {
    it("should break when finding element in array", () => {
      const interpreter = new Interpreter();
      const code = `
        function findIndex(arr, target) {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === target) {
              return i;
            }
          }
          return -1;
        }
        findIndex([10, 20, 30, 40], 30)
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    it("should continue to skip elements", () => {
      const interpreter = new Interpreter();
      const code = `
        let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] % 3 === 0) {
            continue;
          }
          sum = sum + arr[i];
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(37); // 55 - (3+6+9)
    });

    it("should break when sum exceeds threshold", () => {
      const interpreter = new Interpreter();
      const code = `
        let arr = [5, 10, 15, 20, 25];
        let sum = 0;
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
          sum = sum + arr[i];
          count = count + 1;
          if (sum > 30) {
            break;
          }
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(4); // 5+10+15+20=50 >30, so breaks after 4 iterations
    });
  });

  describe("Break and continue with objects", () => {
    it("should break when finding object property", () => {
      const interpreter = new Interpreter();
      const code = `
        let people = [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
          { name: "Charlie", age: 35 }
        ];
        let found = "";
        for (let i = 0; i < people.length; i++) {
          if (people[i].age === 30) {
            found = people[i].name;
            break;
          }
        }
        found
      `;
      expect(interpreter.evaluate(code)).toBe("Bob");
    });

    it("should continue to skip objects", () => {
      const interpreter = new Interpreter();
      const code = `
        let items = [
          { value: 10, active: 1 },
          { value: 20, active: 0 },
          { value: 30, active: 1 },
          { value: 40, active: 0 }
        ];
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
          if (items[i].active === 0) {
            continue;
          }
          sum = sum + items[i].value;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(40); // 10+30
    });
  });

  describe("Break and continue in functions", () => {
    it("should use break in function with loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function firstEven(n) {
          for (let i = 0; i < n; i++) {
            if (i % 2 === 0 && i > 0) {
              return i;
            }
          }
          return -1;
        }
        firstEven(10)
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    it("should use continue in function with loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function sumOdds(n) {
          let sum = 0;
          for (let i = 0; i < n; i++) {
            if (i % 2 === 0) {
              continue;
            }
            sum = sum + i;
          }
          return sum;
        }
        sumOdds(10)
      `;
      expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
    });

    it("should use both break and continue", () => {
      const interpreter = new Interpreter();
      const code = `
        function countSpecial(n) {
          let count = 0;
          for (let i = 1; i <= n; i++) {
            if (i > 20) {
              break;
            }
            if (i % 2 === 0) {
              continue;
            }
            if (i % 3 === 0) {
              count = count + 1;
            }
          }
          return count;
        }
        countSpecial(50)
      `;
      expect(interpreter.evaluate(code)).toBe(3); // 3, 9, 15 (stops at 21, so only 3 odd multiples of 3 <=20)
    });
  });

  describe("Complex break and continue patterns", () => {
    it("should handle break with continue in same loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 20; i++) {
          if (i > 15) {
            break;
          }
          if (i % 2 === 0) {
            continue;
          }
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(64); // 1+3+5+7+9+11+13+15
    });

    it("should use break in while with complex logic", () => {
      const interpreter = new Interpreter();
      const code = `
        let result = 0;
        let i = 0;
        while (i < 100) {
          i = i + 1;
          if (i % 5 === 0) {
            if (i > 30) {
              break;
            }
            continue;
          }
          result = result + i;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(490); // sum(1..35) - (5+10+15+20+25+30) = 630-140=490
    });

    it("should handle alternating break and continue", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        let i = 0;
        while (i < 10) {
          i = i + 1;
          if (i === 8) {
            break;
          }
          if (i % 2 === 0) {
            continue;
          }
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(4); // 1,3,5,7 (stops before 8)
    });
  });

  describe("Edge cases", () => {
    it("should handle break as first statement in loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 0; i < 10; i++) {
          break;
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(0);
    });

    it("should handle continue as last effective statement", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 5; i++) {
          sum = sum + i;
          continue;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should handle break in single iteration loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 0;
        while (x < 1) {
          x = x + 1;
          break;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    it("should return undefined from loop with break", () => {
      const interpreter = new Interpreter();
      const code = `
        for (let i = 0; i < 5; i++) {
          if (i === 2) {
            break;
          }
        }
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });
  });
});
