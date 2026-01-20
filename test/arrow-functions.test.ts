import { describe, it, expect } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Arrow Functions", () => {
  describe("Expression body", () => {
    it("should evaluate simple arrow function with expression body", () => {
      const interpreter = new Interpreter();
      const code = `
        let double = (x) => x * 2;
        double(5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should work with single parameter without parentheses", () => {
      const interpreter = new Interpreter();
      const code = `
        let square = x => x * x;
        square(4)
      `;
      expect(interpreter.evaluate(code)).toBe(16);
    });

    it("should work with multiple parameters", () => {
      const interpreter = new Interpreter();
      const code = `
        let add = (a, b) => a + b;
        add(3, 7)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should work with no parameters", () => {
      const interpreter = new Interpreter();
      const code = `
        let getFortyTwo = () => 42;
        getFortyTwo()
      `;
      expect(interpreter.evaluate(code)).toBe(42);
    });

    it("should evaluate complex expressions", () => {
      const interpreter = new Interpreter();
      const code = `
        let calc = (x, y) => x * x + y * y;
        calc(3, 4)
      `;
      expect(interpreter.evaluate(code)).toBe(25);
    });

    it("should work with string concatenation", () => {
      const interpreter = new Interpreter();
      const code = `
        let greet = name => "Hello " + name;
        greet("Alice")
      `;
      expect(interpreter.evaluate(code)).toBe("Hello Alice");
    });

    it("should work with boolean expressions", () => {
      const interpreter = new Interpreter();
      const code = `
        let isEven = n => n % 2 === 0;
        isEven(4)
      `;
      expect(interpreter.evaluate(code)).toBe(true);
    });
  });

  describe("Block body", () => {
    it("should evaluate arrow function with block body", () => {
      const interpreter = new Interpreter();
      const code = `
        let double = (x) => {
          return x * 2;
        };
        double(5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should handle multiple statements in block", () => {
      const interpreter = new Interpreter();
      const code = `
        let calc = (x, y) => {
          let sum = x + y;
          let product = x * y;
          return sum + product;
        };
        calc(3, 4)
      `;
      expect(interpreter.evaluate(code)).toBe(19); // 7 + 12
    });

    it("should handle conditionals in block", () => {
      const interpreter = new Interpreter();
      const code = `
        let abs = x => {
          if (x < 0) {
            return -x;
          }
          return x;
        };
        abs(-5)
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    it("should handle loops in block", () => {
      const interpreter = new Interpreter();
      const code = `
        let factorial = n => {
          let result = 1;
          for (let i = 1; i <= n; i++) {
            result = result * i;
          }
          return result;
        };
        factorial(5)
      `;
      expect(interpreter.evaluate(code)).toBe(120);
    });
  });

  describe("Closures", () => {
    it("should capture variables from outer scope", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 10;
        let addX = y => x + y;
        addX(5)
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });

    it("should create closures with arrow functions", () => {
      const interpreter = new Interpreter();
      const code = `
        let makeCounter = () => {
          let count = 0;
          return () => {
            count = count + 1;
            return count;
          };
        };
        let counter = makeCounter();
        counter();
        counter();
        counter()
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    it("should capture parameters in nested arrow functions", () => {
      const interpreter = new Interpreter();
      const code = `
        let makeAdder = x => y => x + y;
        let add5 = makeAdder(5);
        add5(3)
      `;
      expect(interpreter.evaluate(code)).toBe(8);
    });
  });

  describe("As function parameters", () => {
    it("should pass arrow function as parameter", () => {
      const interpreter = new Interpreter();
      const code = `
        function apply(f, x) {
          return f(x);
        }
        apply(x => x * 2, 5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should use arrow function with array operations", () => {
      const interpreter = new Interpreter();
      const code = `
        function map(arr, f) {
          let result = [];
          for (let i = 0; i < arr.length; i++) {
            result[i] = f(arr[i]);
          }
          return result;
        }
        let nums = [1, 2, 3, 4];
        let doubled = map(nums, x => x * 2);
        doubled[2]
      `;
      expect(interpreter.evaluate(code)).toBe(6);
    });

    it("should filter array with arrow function", () => {
      const interpreter = new Interpreter();
      const code = `
        function filter(arr, pred) {
          let result = [];
          let j = 0;
          for (let i = 0; i < arr.length; i++) {
            if (pred(arr[i])) {
              result[j] = arr[i];
              j = j + 1;
            }
          }
          return result;
        }
        let nums = [1, 2, 3, 4, 5, 6];
        let evens = filter(nums, n => n % 2 === 0);
        evens.length
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });
  });

  describe("Returning arrow functions", () => {
    it("should return arrow function from regular function", () => {
      const interpreter = new Interpreter();
      const code = `
        function makeMultiplier(factor) {
          return x => x * factor;
        }
        let triple = makeMultiplier(3);
        triple(4)
      `;
      expect(interpreter.evaluate(code)).toBe(12);
    });

    it("should return arrow function from arrow function", () => {
      const interpreter = new Interpreter();
      const code = `
        let curry = (a, b) => c => a + b + c;
        let addFive = curry(2, 3);
        addFive(4)
      `;
      expect(interpreter.evaluate(code)).toBe(9);
    });
  });

  describe("With objects and arrays", () => {
    it("should work with object properties", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = {
          value: 10,
          double: x => x * 2
        };
        obj.double(obj.value)
      `;
      expect(interpreter.evaluate(code)).toBe(20);
    });

    it("should work in array of functions", () => {
      const interpreter = new Interpreter();
      const code = `
        let ops = [
          x => x + 1,
          x => x * 2,
          x => x * x
        ];
        ops[1](5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should process array of objects", () => {
      const interpreter = new Interpreter();
      const code = `
        let people = [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 }
        ];
        let getName = person => person.name;
        getName(people[1])
      `;
      expect(interpreter.evaluate(code)).toBe("Bob");
    });
  });

  describe("Complex examples", () => {
    it("should implement reduce with arrow function", () => {
      const interpreter = new Interpreter();
      const code = `
        function reduce(arr, f, initial) {
          let acc = initial;
          for (let i = 0; i < arr.length; i++) {
            acc = f(acc, arr[i]);
          }
          return acc;
        }
        let nums = [1, 2, 3, 4, 5];
        reduce(nums, (acc, x) => acc + x, 0)
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });

    it("should compose functions with arrow functions", () => {
      const interpreter = new Interpreter();
      const code = `
        let compose = (f, g) => x => f(g(x));
        let add1 = x => x + 1;
        let double = x => x * 2;
        let doubleThenAdd1 = compose(add1, double);
        doubleThenAdd1(5)
      `;
      expect(interpreter.evaluate(code)).toBe(11); // (5 * 2) + 1
    });

    it("should find element with arrow function predicate", () => {
      const interpreter = new Interpreter();
      const code = `
        function find(arr, pred) {
          for (let i = 0; i < arr.length; i++) {
            if (pred(arr[i])) {
              return arr[i];
            }
          }
          return -1;
        }
        let nums = [1, 3, 4, 7, 9];
        find(nums, n => n % 2 === 0)
      `;
      expect(interpreter.evaluate(code)).toBe(4);
    });

    it("should sum array with chained operations", () => {
      const interpreter = new Interpreter();
      const code = `
        function map(arr, f) {
          let result = [];
          for (let i = 0; i < arr.length; i++) {
            result[i] = f(arr[i]);
          }
          return result;
        }
        function sum(arr) {
          let total = 0;
          for (let i = 0; i < arr.length; i++) {
            total = total + arr[i];
          }
          return total;
        }
        let nums = [1, 2, 3, 4];
        let squared = map(nums, x => x * x);
        sum(squared)
      `;
      expect(interpreter.evaluate(code)).toBe(30); // 1+4+9+16
    });
  });

  describe("Recursion with arrow functions", () => {
    it("should support recursion in block body", () => {
      const interpreter = new Interpreter();
      const code = `
        let factorial = n => {
          if (n <= 1) {
            return 1;
          }
          return n * factorial(n - 1);
        };
        factorial(5)
      `;
      expect(interpreter.evaluate(code)).toBe(120);
    });

    it("should support mutual recursion", () => {
      const interpreter = new Interpreter();
      const code = `
        let isEven = n => {
          if (n === 0) {
            return 1;
          }
          return isOdd(n - 1);
        };
        let isOdd = n => {
          if (n === 0) {
            return 0;
          }
          return isEven(n - 1);
        };
        isEven(4)
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle arrow function returning arrow function", () => {
      const interpreter = new Interpreter();
      const code = `
        let f = x => y => z => x + y + z;
        f(1)(2)(3)
      `;
      expect(interpreter.evaluate(code)).toBe(6);
    });

    it("should handle immediate invocation", () => {
      const interpreter = new Interpreter();
      const code = `
        (x => x * 2)(5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should work with mixed arrow and regular functions", () => {
      const interpreter = new Interpreter();
      const code = `
        function apply(f, x) {
          return f(x);
        }
        let double = x => x * 2;
        apply(double, 7)
      `;
      expect(interpreter.evaluate(code)).toBe(14);
    });

    it("should handle empty expression body returning undefined", () => {
      const interpreter = new Interpreter();
      const code = `
        let arr = [1, 2, 3];
        let x = arr[5];
        let identity = y => y;
        identity(x)
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });
  });
});
