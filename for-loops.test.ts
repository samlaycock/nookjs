import { describe, it, expect } from "bun:test";
import { Interpreter, InterpreterError } from "./interpreter";

describe("For Loops", () => {
  describe("Basic for loops", () => {
    it("should execute a simple for loop with postfix increment", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 5; i++) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should execute a simple for loop with prefix increment", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 5; ++i) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should execute a for loop with decrement", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 5; i > 0; i--) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(15); // 5+4+3+2+1
    });

    it("should handle for loop with step of 2", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 10; i = i + 2) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(20); // 0+2+4+6+8
    });

    it("should execute for loop with no iterations", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 5; i < 3; i++) {
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(0);
    });

    it("should handle for loop with single iteration", () => {
      const interpreter = new Interpreter();
      const code = `
        let result = 0;
        for (let i = 0; i < 1; i++) {
          result = 42;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(42);
    });

    it("should support for loop without init", () => {
      const interpreter = new Interpreter();
      const code = `
        let i = 0;
        let sum = 0;
        for (; i < 5; i++) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should support for loop without test (infinite loop with early return)", () => {
      const interpreter = new Interpreter();
      const code = `
        function testInfinite() {
          let count = 0;
          for (let i = 0; ; i++) {
            count = count + 1;
            if (count === 3) {
              return count;
            }
          }
        }
        testInfinite()
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    it("should support for loop without update", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 5; ) {
          sum = sum + i;
          i = i + 1;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should support for loop with only body (infinite loop with return)", () => {
      const interpreter = new Interpreter();
      const code = `
        function testMinimal() {
          let count = 0;
          for (;;) {
            count = count + 1;
            if (count === 5) {
              return count;
            }
          }
        }
        testMinimal()
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });
  });

  describe("For loop scoping", () => {
    it("should scope loop variable to for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 100;
        for (let i = 0; i < 3; i++) {
          x = x + i;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(103); // 100 + 0 + 1 + 2
    });

    it("should not leak loop variable outside for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        for (let i = 0; i < 3; i++) {
          let x = i;
        }
        i
      `;
      expect(() => interpreter.evaluate(code)).toThrow(InterpreterError);
      expect(() => interpreter.evaluate(code)).toThrow(
        "Undefined variable 'i'",
      );
    });

    it("should allow same variable name in sequential for loops", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum1 = 0;
        for (let i = 0; i < 3; i++) {
          sum1 = sum1 + i;
        }
        let sum2 = 0;
        for (let i = 0; i < 3; i++) {
          sum2 = sum2 + i;
        }
        sum1 + sum2
      `;
      expect(interpreter.evaluate(code)).toBe(6); // (0+1+2) + (0+1+2)
    });

    it("should shadow outer variable in for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let i = 100;
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          sum = sum + i;
        }
        sum + i
      `;
      expect(interpreter.evaluate(code)).toBe(103); // (0+1+2) + 100
    });

    it("should handle const in for loop body", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          const doubled = i * 2;
          sum = sum + doubled;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(6); // 0*2 + 1*2 + 2*2
    });
  });

  describe("Nested for loops", () => {
    it("should handle nested for loops", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 1; i <= 3; i++) {
          for (let j = 1; j <= 3; j++) {
            sum = sum + (i * j);
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(36); // Sum of multiplication table 1-3
    });

    it("should handle three levels of nested for loops", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            for (let k = 0; k < 2; k++) {
              count = count + 1;
            }
          }
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(8); // 2*2*2
    });

    it("should handle nested loops with different ranges", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < i; j++) {
            sum = sum + 1;
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(6); // 0 + 1 + 2 + 3
    });
  });

  describe("For loops with conditionals", () => {
    it("should handle for loop with if statement", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 10; i++) {
          if (i % 2 === 0) {
            sum = sum + i;
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(20); // 0+2+4+6+8
    });

    it("should handle for loop with if-else", () => {
      const interpreter = new Interpreter();
      const code = `
        let evens = 0;
        let odds = 0;
        for (let i = 0; i < 10; i++) {
          if (i % 2 === 0) {
            evens = evens + 1;
          } else {
            odds = odds + 1;
          }
        }
        evens * 10 + odds
      `;
      expect(interpreter.evaluate(code)).toBe(55); // 5 evens, 5 odds -> 55
    });

    it("should handle complex condition in for loop body", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 1; i <= 20; i++) {
          if (i % 3 === 0 && i % 5 === 0) {
            count = count + 1;
          }
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(1); // Only 15 is divisible by both
    });
  });

  describe("For loops with arrays", () => {
    it("should iterate over array by index", () => {
      const interpreter = new Interpreter();
      const code = `
        let arr = [10, 20, 30, 40, 50];
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          sum = sum + arr[i];
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(150);
    });

    it("should build an array using for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let squares = [];
        for (let i = 0; i < 5; i++) {
          squares[i] = i * i;
        }
        squares
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual([0, 1, 4, 9, 16]);
    });

    it("should modify array elements in for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        let arr = [1, 2, 3, 4, 5];
        for (let i = 0; i < arr.length; i++) {
          arr[i] = arr[i] * 2;
        }
        arr
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it("should find element in array", () => {
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

    it("should reverse an array using for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function reverse(arr) {
          let result = [];
          for (let i = arr.length - 1; i >= 0; i--) {
            result[arr.length - 1 - i] = arr[i];
          }
          return result;
        }
        reverse([1, 2, 3, 4, 5])
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });
  });

  describe("For loops with functions", () => {
    it("should use for loop in function", () => {
      const interpreter = new Interpreter();
      const code = `
        function sum(n) {
          let result = 0;
          for (let i = 1; i <= n; i++) {
            result = result + i;
          }
          return result;
        }
        sum(10)
      `;
      expect(interpreter.evaluate(code)).toBe(55);
    });

    it("should handle return from for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function findFirst(arr, target) {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === target) {
              return i;
            }
          }
          return -1;
        }
        findFirst([5, 10, 15, 20], 15)
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    it("should handle for loop with early return", () => {
      const interpreter = new Interpreter();
      const code = `
        function findEven(n) {
          for (let i = 0; i < n; i++) {
            if (i % 2 === 0 && i > 0) {
              return i;
            }
          }
          return -1;
        }
        findEven(10)
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    it("should compute factorial using for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function factorial(n) {
          let result = 1;
          for (let i = 1; i <= n; i++) {
            result = result * i;
          }
          return result;
        }
        factorial(5)
      `;
      expect(interpreter.evaluate(code)).toBe(120);
    });

    it("should compute fibonacci using for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function fib(n) {
          if (n <= 1) {
            return n;
          }
          let a = 0;
          let b = 1;
          let temp = 0;
          for (let i = 2; i <= n; i++) {
            temp = a + b;
            a = b;
            b = temp;
          }
          return b;
        }
        fib(10)
      `;
      expect(interpreter.evaluate(code)).toBe(55);
    });
  });

  describe("Update expressions", () => {
    it("should handle postfix increment", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 5;
        let y = x++;
        y * 10 + x
      `;
      expect(interpreter.evaluate(code)).toBe(56); // y=5, x=6 -> 56
    });

    it("should handle prefix increment", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 5;
        let y = ++x;
        y * 10 + x
      `;
      expect(interpreter.evaluate(code)).toBe(66); // y=6, x=6 -> 66
    });

    it("should handle postfix decrement", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 5;
        let y = x--;
        y * 10 + x
      `;
      expect(interpreter.evaluate(code)).toBe(54); // y=5, x=4 -> 54
    });

    it("should handle prefix decrement", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 5;
        let y = --x;
        y * 10 + x
      `;
      expect(interpreter.evaluate(code)).toBe(44); // y=4, x=4 -> 44
    });

    it("should throw error for update on non-identifier", () => {
      const interpreter = new Interpreter();
      const code = `(5)++`;
      // Parser catches this error before our interpreter does
      expect(() => interpreter.evaluate(code)).toThrow();
    });

    it("should throw error for update on non-number", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = "hello";
        x++
      `;
      // Only evaluate once to avoid redeclaration error
      try {
        interpreter.evaluate(code);
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(InterpreterError);
        expect(error.message).toContain("can only be used with numbers");
      }
    });
  });

  describe("Practical algorithms with for loops", () => {
    it("should check if number is prime", () => {
      const interpreter = new Interpreter();
      const code = `
        function isPrime(n) {
          if (n <= 1) {
            return 0;
          }
          for (let i = 2; i * i <= n; i++) {
            if (n % i === 0) {
              return 0;
            }
          }
          return 1;
        }
        isPrime(17) * 10 + isPrime(18)
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 17 is prime (1), 18 is not (0)
    });

    it("should count primes up to n", () => {
      const interpreter = new Interpreter();
      const code = `
        function isPrime(n) {
          if (n <= 1) {
            return 0;
          }
          for (let i = 2; i * i <= n; i++) {
            if (n % i === 0) {
              return 0;
            }
          }
          return 1;
        }

        function countPrimes(max) {
          let count = 0;
          for (let i = 2; i <= max; i++) {
            if (isPrime(i)) {
              count = count + 1;
            }
          }
          return count;
        }

        countPrimes(20)
      `;
      expect(interpreter.evaluate(code)).toBe(8); // 2,3,5,7,11,13,17,19
    });

    it("should compute GCD using for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        function gcd(a, b) {
          for (; b !== 0; ) {
            let temp = b;
            b = a % b;
            a = temp;
          }
          return a;
        }
        gcd(48, 18)
      `;
      expect(interpreter.evaluate(code)).toBe(6);
    });

    it("should sum multiples of 3 or 5 below n", () => {
      const interpreter = new Interpreter();
      const code = `
        function sumMultiples(n) {
          let sum = 0;
          for (let i = 0; i < n; i++) {
            if (i % 3 === 0 || i % 5 === 0) {
              sum = sum + i;
            }
          }
          return sum;
        }
        sumMultiples(10)
      `;
      expect(interpreter.evaluate(code)).toBe(23); // 0+3+5+6+9 = 23
    });

    it("should create a 2D identity matrix", () => {
      const interpreter = new Interpreter();
      const code = `
        function identity(n) {
          let matrix = [];
          for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
              if (i === j) {
                matrix[i][j] = 1;
              } else {
                matrix[i][j] = 0;
              }
            }
          }
          return matrix;
        }
        identity(3)
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    });

    it("should multiply two matrices", () => {
      const interpreter = new Interpreter();
      const code = `
        function matrixMultiply(a, b) {
          let result = [];
          for (let i = 0; i < 2; i++) {
            result[i] = [];
            for (let j = 0; j < 2; j++) {
              let sum = 0;
              for (let k = 0; k < 2; k++) {
                sum = sum + a[i][k] * b[k][j];
              }
              result[i][j] = sum;
            }
          }
          return result;
        }

        let a = [[1, 2], [3, 4]];
        let b = [[5, 6], [7, 8]];
        matrixMultiply(a, b)
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual([
        [19, 22],
        [43, 50],
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should handle large iteration count", () => {
      const interpreter = new Interpreter();
      const code = `
        let count = 0;
        for (let i = 0; i < 1000; i++) {
          count = count + 1;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(1000);
    });

    it("should handle for loop with only test condition", () => {
      const interpreter = new Interpreter();
      const code = `
        function testSimple() {
          let i = 0;
          for (; i < 3; ) {
            i = i + 1;
          }
          return i;
        }
        testSimple()
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    it("should handle nested for loops with same variable name in different scopes", () => {
      const interpreter = new Interpreter();
      const code = `
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          for (let i = 0; i < 2; i++) {
            sum = sum + 1;
          }
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(6); // outer runs 3 times, inner runs 2 times each
    });

    it("should return last evaluated value from for loop", () => {
      const interpreter = new Interpreter();
      const code = `
        for (let i = 0; i < 3; i++) {
          i * 2;
        }
      `;
      expect(interpreter.evaluate(code)).toBe(4); // Last iteration: 2 * 2 = 4
    });
  });
});
