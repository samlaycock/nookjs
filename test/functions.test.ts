import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Functions", () => {
  describe("ES5", () => {
    describe("Functions", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Basic function declarations", () => {
        test("declares a simple function", () => {
          const code = `
            function foo() {
              return 42;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(42);
        });

        test("function without return returns undefined", () => {
          const code = `
            function foo() {
              let x = 5;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });

        test("empty function returns undefined", () => {
          const code = `
            function foo() {
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });

        test("function with multiple statements", () => {
          const code = `
            function foo() {
              let x = 10;
              let y = 20;
              return x + y;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(30);
        });

        test("can call function multiple times", () => {
          const code = `
            function getValue() {
              return 5;
            }
            let a = getValue();
            let b = getValue();
            a + b
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });
      });

      describe("Function parameters", () => {
        test("function with single parameter", () => {
          const code = `
            function double(x) {
              return x * 2;
            }
            double(5)
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("function with multiple parameters", () => {
          const code = `
            function add(a, b) {
              return a + b;
            }
            add(3, 7)
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("function with three parameters", () => {
          const code = `
            function sum(a, b, c) {
              return a + b + c;
            }
            sum(1, 2, 3)
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("parameters shadow outer variables", () => {
          const code = `
            let x = 100;
            function foo(x) {
              return x;
            }
            foo(5)
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("outer variable unchanged after function call", () => {
          const code = `
            let x = 100;
            function foo(x) {
              x = 5;
              return x;
            }
            foo(10);
            x
          `;
          expect(interpreter.evaluate(code)).toBe(100);
        });

        test("throws on wrong argument count - too few", () => {
          const code = `
            function add(a, b) {
              return a + b;
            }
            add(5)
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Expected at least 2 arguments but got 1",
          );
        });

        test("allows extra arguments (for compatibility with rest parameters)", () => {
          const code = `
            function add(a, b) {
              return a + b;
            }
            add(5, 10, 15)
          `;
          // Extra arguments are now allowed (ignored if no rest parameter)
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(code);
          expect(result).toBe(15);
        });

        test("supports immediately-invoked function expression (IIFE)", () => {
          const code = `
            (function () {
              let value = 40;
              return value + 2;
            })()
          `;
          expect(interpreter.evaluate(code)).toBe(42);
        });
      });

      describe("Return statements", () => {
        test("early return", () => {
          const code = `
            function foo() {
              return 1;
              return 2;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("conditional return", () => {
          const code = `
            function abs(x) {
              if (x < 0) {
                return -x;
              }
              return x;
            }
            abs(-5)
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("return from nested block", () => {
          const code = `
            function foo() {
              {
                return 42;
              }
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(42);
        });

        test("return from loop", () => {
          const code = `
            function findFirst() {
              let i = 0;
              while (i < 10) {
                if (i === 5) {
                  return i;
                }
                i = i + 1;
              }
              return -1;
            }
            findFirst()
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("return with expression", () => {
          const code = `
            function calculate() {
              let a = 10;
              let b = 20;
              return a + b * 2;
            }
            calculate()
          `;
          expect(interpreter.evaluate(code)).toBe(50);
        });

        test("return without value", () => {
          const code = `
            function foo() {
              return;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });
      });

      describe("Recursion", () => {
        test("simple recursion - factorial", () => {
          const code = `
            function factorial(n) {
              if (n <= 1) {
                return 1;
              }
              return n * factorial(n - 1);
            }
            factorial(5)
          `;
          expect(interpreter.evaluate(code)).toBe(120);
        });

        test("fibonacci recursion", () => {
          const code = `
            function fib(n) {
              if (n <= 1) {
                return n;
              }
              return fib(n - 1) + fib(n - 2);
            }
            fib(7)
          `;
          expect(interpreter.evaluate(code)).toBe(13);
        });

        test("countdown recursion", () => {
          const code = `
            function countdown(n) {
              if (n <= 0) {
                return 0;
              }
              return n + countdown(n - 1);
            }
            countdown(5)
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        test("recursive power function", () => {
          const code = `
            function power(base, exp) {
              if (exp === 0) {
                return 1;
              }
              return base * power(base, exp - 1);
            }
            power(2, 10)
          `;
          expect(interpreter.evaluate(code)).toBe(1024);
        });

        test("gcd recursive", () => {
          const code = `
            function gcd(a, b) {
              if (b === 0) {
                return a;
              }
              return gcd(b, a % b);
            }
            gcd(48, 18)
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });
      });

      describe("Closures", () => {
        test("function closes over outer variable", () => {
          const code = `
            let x = 10;
            function getX() {
              return x;
            }
            getX()
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("function can modify outer variable", () => {
          const code = `
            let counter = 0;
            function increment() {
              counter = counter + 1;
              return counter;
            }
            increment();
            increment();
            counter
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        test("multiple functions share closure", () => {
          const code = `
            let value = 0;
            function inc() {
              value = value + 1;
            }
            function dec() {
              value = value - 1;
            }
            inc();
            inc();
            dec();
            value
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("closure with parameter and outer variable", () => {
          const code = `
            let multiplier = 10;
            function multiply(x) {
              return x * multiplier;
            }
            multiply(5)
          `;
          expect(interpreter.evaluate(code)).toBe(50);
        });

        test("nested function closure", () => {
          const code = `
            function outer() {
              let x = 10;
              function inner() {
                return x + 5;
              }
              return inner();
            }
            outer()
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        test("function defined in block closes over block variable", () => {
          const code = `
            let result = 0;
            {
              let x = 42;
              function getX() {
                return x;
              }
              result = getX();
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(42);
        });
      });

      describe("Functions with local variables", () => {
        test("function local variables are isolated", () => {
          const code = `
            function foo() {
              let x = 10;
              return x;
            }
            foo();
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("local variable does not leak", () => {
          const code = `
            function foo() {
              let x = 10;
            }
            foo();
            x
          `;
          expect(() => interpreter.evaluate(code)).toThrow("Undefined variable 'x'");
        });

        test("local variable shadows outer", () => {
          const code = `
            let x = 100;
            function foo() {
              let x = 10;
              return x;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("outer variable unchanged by local shadow", () => {
          const code = `
            let x = 100;
            function foo() {
              let x = 10;
            }
            foo();
            x
          `;
          expect(interpreter.evaluate(code)).toBe(100);
        });
      });

      describe("Function composition", () => {
        test("passing function result to another function", () => {
          const code = `
            function double(x) {
              return x * 2;
            }
            function addTen(x) {
              return x + 10;
            }
            addTen(double(5))
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("nested function calls", () => {
          const code = `
            function add(a, b) {
              return a + b;
            }
            add(add(1, 2), add(3, 4))
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("function call in expression", () => {
          const code = `
            function getValue() {
              return 5;
            }
            getValue() * 2 + getValue()
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });
      });

      describe("Functions with loops", () => {
        test("function with while loop", () => {
          const code = `
            function sum(n) {
              let result = 0;
              let i = 1;
              while (i <= n) {
                result = result + i;
                i = i + 1;
              }
              return result;
            }
            sum(10)
          `;
          expect(interpreter.evaluate(code)).toBe(55);
        });

        test("loop counter stays in function scope", () => {
          const code = `
            function foo() {
              let i = 0;
              while (i < 3) {
                i = i + 1;
              }
              return i;
            }
            foo()
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });
      });

      describe("Functions with conditionals", () => {
        test("function with if statement", () => {
          const code = `
            function max(a, b) {
              if (a > b) {
                return a;
              }
              return b;
            }
            max(10, 5)
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("function with if-else", () => {
          const code = `
            function isEven(n) {
              if (n % 2 === 0) {
                return 1;
              } else {
                return 0;
              }
            }
            isEven(4)
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("function with if-else if-else", () => {
          const code = `
            function sign(x) {
              if (x > 0) {
                return 1;
              } else if (x < 0) {
                return -1;
              } else {
                return 0;
              }
            }
            sign(-5)
          `;
          expect(interpreter.evaluate(code)).toBe(-1);
        });
      });

      describe("Complex scenarios", () => {
        test("helper function pattern", () => {
          const code = `
            function square(x) {
              return x * x;
            }
            function sumOfSquares(a, b) {
              return square(a) + square(b);
            }
            sumOfSquares(3, 4)
          `;
          expect(interpreter.evaluate(code)).toBe(25);
        });

        test("counter with reset", () => {
          const code = `
            let count = 0;
            function increment() {
              count = count + 1;
              return count;
            }
            function reset() {
              count = 0;
            }
            increment();
            increment();
            increment();
            reset();
            increment()
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("function with complex logic", () => {
          const code = `
            function isPrime(n) {
              if (n <= 1) {
                return 0;
              }
              let i = 2;
              while (i * i <= n) {
                if (n % i === 0) {
                  return 0;
                }
                i = i + 1;
              }
              return 1;
            }
            isPrime(17)
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("memoization pattern with closure", () => {
          const code = `
            let cached = 0;
            let cacheValid = 0;
            function expensiveCalc() {
              if (cacheValid === 1) {
                return cached;
              }
              let result = 100;
              cached = result;
              cacheValid = 1;
              return result;
            }
            expensiveCalc();
            expensiveCalc()
          `;
          expect(interpreter.evaluate(code)).toBe(100);
        });

        test("accumulator pattern", () => {
          const code = `
            function sumArray(n) {
              let sum = 0;
              let i = 1;
              while (i <= n) {
                sum = sum + i;
                i = i + 1;
              }
              return sum;
            }
            let total = 0;
            total = total + sumArray(5);
            total = total + sumArray(3);
            total
          `;
          expect(interpreter.evaluate(code)).toBe(21); // 15 + 6
        });
      });

      describe("Error handling", () => {
        test("calling undefined function throws", () => {
          expect(() => interpreter.evaluate("foo()")).toThrow("Undefined variable 'foo'");
        });

        test("calling non-function throws", () => {
          const code = `
            let x = 5;
            x()
          `;
          expect(() => interpreter.evaluate(code)).toThrow("Callee is not a function");
        });

        test("cannot redeclare function", () => {
          const code = `
            function foo() {
              return 1;
            }
            function foo() {
              return 2;
            }
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Variable 'foo' has already been declared",
          );
        });
      });
    });
  });

  describe("ES2015", () => {
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

    describe("Default parameters", () => {
      it("should use default when argument is missing", () => {
        const interpreter = new Interpreter();
        const code = `
            function greet(name = "world") {
              return "hi " + name;
            }
            greet()
          `;
        expect(interpreter.evaluate(code)).toBe("hi world");
      });

      it("should use default when argument is undefined", () => {
        const interpreter = new Interpreter();
        const code = `
            function value(x = 5) {
              return x;
            }
            value(undefined)
          `;
        expect(interpreter.evaluate(code)).toBe(5);
      });

      it("should allow default to reference earlier parameter", () => {
        const interpreter = new Interpreter();
        const code = `
            function calc(a, b = a * 2) {
              return b;
            }
            calc(3)
          `;
        expect(interpreter.evaluate(code)).toBe(6);
      });

      it("should allow default with object destructuring", () => {
        const interpreter = new Interpreter();
        const code = `
            function getPort({ port = 3000 } = {}) {
              return port;
            }
            getPort()
          `;
        expect(interpreter.evaluate(code)).toBe(3000);
      });

      it("should allow nested destructuring defaults", () => {
        const interpreter = new Interpreter();
        const code = `
            function getHost({ db: { host = "localhost" } = {} } = {}) {
              return host;
            }
            getHost()
          `;
        expect(interpreter.evaluate(code)).toBe("localhost");
      });
    });

    describe("Rest parameters", () => {
      it("should collect remaining arguments into an array", () => {
        const interpreter = new Interpreter();
        const code = `
            function sum(...nums) {
              return nums.reduce((acc, n) => acc + n, 0);
            }
            sum(1, 2, 3)
          `;
        expect(interpreter.evaluate(code)).toBe(6);
      });

      it("should work with leading parameters", () => {
        const interpreter = new Interpreter();
        const code = `
            function join(sep, ...parts) {
              return parts.join(sep);
            }
            join("-", "a", "b", "c")
          `;
        expect(interpreter.evaluate(code)).toBe("a-b-c");
      });

      it("should handle zero rest arguments", () => {
        const interpreter = new Interpreter();
        const code = `
            function count(...items) {
              return items.length;
            }
            count()
          `;
        expect(interpreter.evaluate(code)).toBe(0);
      });
    });

    describe("Generator Functions", () => {
      describe("Basic sync generators", () => {
        test("simple generator with yield", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        test("generator returns done: true when exhausted", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
            }
            const g = gen();
            g.next(); // value: 1, done: false
            const final = g.next(); // value: undefined, done: true
            final.done;
          `);
          expect(result).toBe(true);
        });

        test("generator with return statement", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              return 42;
              yield 2; // never reached
            }
            const g = gen();
            const first = g.next();
            const second = g.next();
            second.value;
          `);
          expect(result).toBe(42);
        });

        test("generator without yields returns immediately", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              return 10;
            }
            const g = gen();
            const r = g.next();
            r.value;
          `);
          expect(result).toBe(10);
        });

        test("generator with expression yield", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1 + 1;
              yield 2 * 3;
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([2, 6]);
        });
      });

      describe("Generator with parameters", () => {
        test("generator accepts parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* range(start, end) {
              yield start;
              yield start + 1;
              yield end;
            }
            const g = range(5, 10);
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([5, 6, 10]);
        });

        test("generator with rest parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* yieldAll(...values) {
              yield values[0];
              yield values[1];
              yield values[2];
            }
            const g = yieldAll(10, 20, 30);
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([10, 20, 30]);
        });
      });

      describe("Generator with control flow", () => {
        test("generator with if statement", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* conditional(flag) {
              if (flag) {
                yield 1;
              } else {
                yield 2;
              }
              yield 3;
            }
            const g1 = conditional(true);
            const g2 = conditional(false);
            const results = [];
            results.push(g1.next().value);
            results.push(g1.next().value);
            results.push(g2.next().value);
            results.push(g2.next().value);
            results;
          `);
          expect(result).toEqual([1, 3, 2, 3]);
        });

        test("generator with for loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* counter(max) {
              for (var i = 0; i < max; i++) {
                yield i;
              }
            }
            const g = counter(3);
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([0, 1, 2]);
        });

        test("generator with while loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* countdown(n) {
              while (n > 0) {
                yield n;
                n = n - 1;
              }
            }
            const g = countdown(3);
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([3, 2, 1]);
        });
      });

      describe("Generator expressions", () => {
        test("generator function expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const gen = function*() {
              yield 1;
              yield 2;
            };
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([1, 2]);
        });

        test("named generator function expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const gen = function* myGen() {
              yield 42;
            };
            const g = gen();
            g.next().value;
          `);
          expect(result).toBe(42);
        });
      });

      describe("Generator state management", () => {
        test("multiple generator instances are independent", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
            }
            const g1 = gen();
            const g2 = gen();
            const results = [];
            results.push(g1.next().value); // 1 from g1
            results.push(g2.next().value); // 1 from g2
            results.push(g1.next().value); // 2 from g1
            results.push(g2.next().value); // 2 from g2
            results;
          `);
          expect(result).toEqual([1, 1, 2, 2]);
        });

        test("generator maintains closure state", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* counter() {
              var count = 0;
              while (true) {
                count = count + 1;
                yield count;
                if (count >= 3) return;
              }
            }
            const g = counter();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([1, 2, 3]);
        });
      });

      describe("Async generators", () => {
        test("simple async generator", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* asyncGen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const g = asyncGen();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        test("async generator with await", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncValue: async () => 42,
            },
          });
          const result = await interpreter.evaluateAsync(`
            async function* asyncGen() {
              const val = await asyncValue();
              yield val;
              yield val + 1;
            }
            const g = asyncGen();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results;
          `);
          expect(result).toEqual([42, 43]);
        });

        test("async generator returns done: true when exhausted", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* asyncGen() {
              yield 1;
            }
            const g = asyncGen();
            await g.next(); // value: 1, done: false
            const final = await g.next(); // value: undefined, done: true
            final.done;
          `);
          expect(result).toBe(true);
        });
      });

      describe("Generator methods", () => {
        test("generator.return() completes generator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const g = gen();
            g.next(); // 1
            const returnResult = g.return(99);
            const after = g.next();
            returnResult.done && after.done;
          `);
          expect(result).toBe(true);
        });

        test("generator.return() returns provided value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
            }
            const g = gen();
            const returnResult = g.return(42);
            returnResult.value;
          `);
          expect(result).toBe(42);
        });

        test("generator.throw() throws error", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function* gen() {
                yield 1;
              }
              const g = gen();
              g.throw("error");
            `);
          }).toThrow();
        });
      });

      describe("Error handling", () => {
        test("cannot use yield outside generator", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function notAGenerator() {
                yield 1;
              }
              notAGenerator();
            `);
          }).toThrow();
        });

        test("cannot call async generator in sync mode", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              async function* asyncGen() {
                yield 1;
              }
              asyncGen();
            `);
          }).toThrow("Cannot call async generator in synchronous evaluate");
        });
      });

      describe("yield* delegation", () => {
        test("yield* with array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield* [1, 2, 3];
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().done);
            results;
          `);
          expect(result).toEqual([1, 2, 3, true]);
        });

        test("yield* with another generator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* inner() {
              yield 'a';
              yield 'b';
            }
            function* outer() {
              yield 1;
              yield* inner();
              yield 2;
            }
            const g = outer();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([1, "a", "b", 2]);
        });

        test("yield* with string (iterable)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield* "hi";
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual(["h", "i"]);
        });

        test("yield* with nested delegation", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* level3() {
              yield 'c';
            }
            function* level2() {
              yield 'b';
              yield* level3();
            }
            function* level1() {
              yield 'a';
              yield* level2();
              yield 'd';
            }
            const g = level1();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual(["a", "b", "c", "d"]);
        });

        test("async yield* with array", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* gen() {
              yield* [1, 2, 3];
            }
            const g = gen();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        test("async yield* with another async generator", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* inner() {
              yield 'x';
              yield 'y';
            }
            async function* outer() {
              yield 1;
              yield* inner();
              yield 2;
            }
            const g = outer();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results;
          `);
          expect(result).toEqual([1, "x", "y", 2]);
        });
      });

      describe("Yields in for...of and for...in loops", () => {
        test("generator with yield inside for...of loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              for (const x of [1, 2, 3]) {
                yield x * 10;
              }
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([10, 20, 30]);
        });

        test("generator with yield inside for...in loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const obj = { a: 1, b: 2, c: 3 };
              for (const key in obj) {
                yield key;
              }
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        test("generator with break in for...of loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              for (const x of [1, 2, 3, 4, 5]) {
                if (x > 3) break;
                yield x;
              }
              yield 99;
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results.push(g.next().value);
            results;
          `);
          expect(result).toEqual([1, 2, 3, 99]);
        });

        test("generator with return in for...of loop", () => {
          const interpreter = new Interpreter();
          // First call should yield 1
          const result1 = interpreter.evaluate(`
            function* gen() {
              for (const x of [1, 2, 3]) {
                if (x === 2) return 42;
                yield x;
              }
            }
            gen().next().value;
          `);
          expect(result1).toBe(1);

          // Second call on same generator should return 42
          const result2 = interpreter.evaluate(`
            function* gen() {
              for (const x of [1, 2, 3]) {
                if (x === 2) return 42;
                yield x;
              }
            }
            const g = gen();
            g.next(); // yields 1
            g.next(); // returns 42
          `);
          expect(result2).toEqual({ value: 42, done: true });
        });

        test("async generator with yield inside for...of loop", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* gen() {
              for (const x of [1, 2, 3]) {
                yield x * 10;
              }
            }
            const g = gen();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results.push((await g.next()).value);
            results;
          `);
          expect(result).toEqual([10, 20, 30]);
        });
      });

      describe("Iterator protocol (@@iterator)", () => {
        test("generator is iterable with for...of", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const results = [];
            for (const x of gen()) {
              results.push(x);
            }
            results;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        test("generator instance is iterable with for...of", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 'a';
              yield 'b';
            }
            const g = gen();
            const results = [];
            for (const x of g) {
              results.push(x);
            }
            results;
          `);
          expect(result).toEqual(["a", "b"]);
        });

        test("spread operator works with generators", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const arr = [...gen()];
            arr;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        test("for...of with generator that has early return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              return 42;
              yield 2;
            }
            const results = [];
            for (const x of gen()) {
              results.push(x);
            }
            results;
          `);
          // for...of doesn't include the return value, only yielded values
          expect(result).toEqual([1]);
        });
      });

      describe("return() respecting finally blocks", () => {
        test("return() executes finally block when generator paused inside try", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const log = [];
            function* gen() {
              try {
                log.push('try-start');
                yield 1;
                log.push('after-yield');
              } finally {
                log.push('finally');
              }
              log.push('after-finally');
            }
            const g = gen();
            g.next(); // pauses at yield 1
            g.return(42); // should execute finally
            log;
          `);
          expect(result).toEqual(["try-start", "finally"]);
        });

        test("return() returns the value from finally if finally has return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              try {
                yield 1;
              } finally {
                return 'from-finally';
              }
            }
            const g = gen();
            g.next();
            const r = g.return(42);
            r.value;
          `);
          expect(result).toBe("from-finally");
        });

        test("return() with nested try-finally executes all finally blocks", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const log = [];
            function* gen() {
              try {
                log.push('outer-try');
                try {
                  log.push('inner-try');
                  yield 1;
                  log.push('after-inner-yield');
                } finally {
                  log.push('inner-finally');
                }
                log.push('after-inner');
              } finally {
                log.push('outer-finally');
              }
            }
            const g = gen();
            g.next();
            g.return();
            log;
          `);
          expect(result).toEqual(["outer-try", "inner-try", "inner-finally", "outer-finally"]);
        });

        test("async return() executes finally block", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            const log = [];
            async function* gen() {
              try {
                log.push('try-start');
                yield 1;
                log.push('after-yield');
              } finally {
                log.push('finally');
              }
            }
            const g = gen();
            await g.next();
            await g.return(42);
            log;
          `);
          expect(result).toEqual(["try-start", "finally"]);
        });

        test("for...of calls return() when breaking early", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const log = [];
            function* gen() {
              try {
                log.push('start');
                yield 1;
                yield 2;
                yield 3;
              } finally {
                log.push('cleanup');
              }
            }
            for (const x of gen()) {
              log.push('got-' + x);
              if (x === 1) break;
            }
            log;
          `);
          expect(result).toEqual(["start", "got-1", "cleanup"]);
        });
      });

      describe("next(value) two-way communication", () => {
        test("next(value) passes value to yield expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const x = yield 1;
              yield x + 10;
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);   // yields 1
            results.push(g.next(5).value);  // x = 5, yields 15
            results;
          `);
          expect(result).toEqual([1, 15]);
        });

        test("first next() value is ignored", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const x = yield 1;
              yield x;
            }
            const g = gen();
            g.next(999);  // this value is ignored (no yield to receive it)
            const second = g.next(42);
            second.value;
          `);
          expect(result).toBe(42);
        });

        test("multiple yields with values passed in", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const a = yield 'first';
              const b = yield 'second';
              const c = yield 'third';
              yield a + '-' + b + '-' + c;
            }
            const g = gen();
            g.next();          // yields 'first'
            g.next('A');       // a = 'A', yields 'second'
            g.next('B');       // b = 'B', yields 'third'
            const result = g.next('C');  // c = 'C', yields 'A-B-C'
            result.value;
          `);
          expect(result).toBe("A-B-C");
        });

        test("yield expression value is undefined if next() called without argument", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const x = yield 1;
              yield x;
            }
            const g = gen();
            g.next();
            const second = g.next();  // no value passed
            second.value;
          `);
          expect(result).toBe(undefined);
        });

        test("async generator next(value) passes value to yield", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function* gen() {
              const x = yield 1;
              yield x * 2;
            }
            const g = gen();
            const results = [];
            results.push((await g.next()).value);
            results.push((await g.next(10)).value);
            results;
          `);
          expect(result).toEqual([1, 20]);
        });

        test("yield in expression position receives value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* gen() {
              const sum = (yield 1) + (yield 2);
              yield sum;
            }
            const g = gen();
            g.next();       // yields 1
            g.next(10);     // first yield = 10, yields 2
            const result = g.next(20);  // second yield = 20, sum = 30, yields 30
            result.value;
          `);
          expect(result).toBe(30);
        });
      });

      describe("throw() injection", () => {
        test("basic throw() terminates generator", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
              yield 2;
              yield 3;
            }
            const g = gen();
            g.next(); // yields 1
            let caught = null;
            try {
              g.throw(new Error('injected'));
            } catch (e) {
              caught = e.message;
            }
            caught;
          `);
          expect(result).toBe("injected");
        });

        test("throw() can be caught inside generator with try/catch", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            function* gen() {
              try {
                yield 1;
                yield 2;
              } catch (e) {
                yield 'caught: ' + e.message;
              }
              yield 3;
            }
            const g = gen();
            const results = [];
            results.push(g.next().value);  // yields 1
            results.push(g.throw(new Error('oops')).value);  // caught, yields 'caught: oops'
            results.push(g.next().value);  // yields 3
            results;
          `);
          expect(result).toEqual([1, "caught: oops", 3]);
        });

        test("throw() on unstarted generator throws immediately", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
            }
            const g = gen();
            let caught = null;
            try {
              g.throw(new Error('early'));
            } catch (e) {
              caught = e.message;
            }
            caught;
          `);
          expect(result).toBe("early");
        });

        test("throw() on completed generator throws immediately", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            function* gen() {
              yield 1;
            }
            const g = gen();
            g.next();  // yields 1
            g.next();  // done
            let caught = null;
            try {
              g.throw(new Error('after done'));
            } catch (e) {
              caught = e.message;
            }
            caught;
          `);
          expect(result).toBe("after done");
        });

        test("throw() with finally block", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            const log = [];
            function* gen() {
              try {
                yield 1;
                yield 2;
              } finally {
                log.push('finally');
              }
              yield 3;
            }
            const g = gen();
            g.next();  // yields 1
            try {
              g.throw(new Error('oops'));
            } catch (e) {
              log.push('outer catch: ' + e.message);
            }
            log;
          `);
          expect(result).toEqual(["finally", "outer catch: oops"]);
        });

        test("throw() caught in inner try, finally still runs", () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = interpreter.evaluate(`
            const log = [];
            function* gen() {
              try {
                yield 1;
              } catch (e) {
                log.push('caught: ' + e.message);
              } finally {
                log.push('finally');
              }
              yield 2;
            }
            const g = gen();
            log.push('value: ' + g.next().value);  // yields 1
            log.push('value: ' + g.throw(new Error('injected')).value);  // caught, yields 2
            log;
          `);
          expect(result).toEqual(["value: 1", "caught: injected", "finally", "value: 2"]);
        });

        test("async generator throw() basic", async () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = await interpreter.evaluateAsync(`
            async function* gen() {
              yield 1;
              yield 2;
            }
            const g = gen();
            await g.next();  // yields 1
            let caught = null;
            try {
              await g.throw(new Error('async error'));
            } catch (e) {
              caught = e.message;
            }
            caught;
          `);
          expect(result).toBe("async error");
        });

        test("async generator throw() with try/catch", async () => {
          const interpreter = new Interpreter({ globals: { Error } });
          const result = await interpreter.evaluateAsync(`
            async function* gen() {
              try {
                yield 1;
                yield 2;
              } catch (e) {
                yield 'caught: ' + e.message;
              }
              yield 3;
            }
            const g = gen();
            const results = [];
            results.push((await g.next()).value);  // yields 1
            results.push((await g.throw(new Error('oops'))).value);  // caught, yields 'caught: oops'
            results.push((await g.next()).value);  // yields 3
            results;
          `);
          expect(result).toEqual([1, "caught: oops", 3]);
        });
      });
    });
  });
});
