import { describe, test, expect, beforeEach } from 'bun:test';
import { Interpreter, InterpreterError } from './interpreter';

describe('Functions', () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe('Basic function declarations', () => {
    test('declares a simple function', () => {
      const code = `
        function foo() {
          return 42;
        }
        foo()
      `;
      expect(interpreter.evaluate(code)).toBe(42);
    });

    test('function without return returns undefined', () => {
      const code = `
        function foo() {
          let x = 5;
        }
        foo()
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });

    test('empty function returns undefined', () => {
      const code = `
        function foo() {
        }
        foo()
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });

    test('function with multiple statements', () => {
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

    test('can call function multiple times', () => {
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

  describe('Function parameters', () => {
    test('function with single parameter', () => {
      const code = `
        function double(x) {
          return x * 2;
        }
        double(5)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('function with multiple parameters', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        add(3, 7)
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('function with three parameters', () => {
      const code = `
        function sum(a, b, c) {
          return a + b + c;
        }
        sum(1, 2, 3)
      `;
      expect(interpreter.evaluate(code)).toBe(6);
    });

    test('parameters shadow outer variables', () => {
      const code = `
        let x = 100;
        function foo(x) {
          return x;
        }
        foo(5)
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('outer variable unchanged after function call', () => {
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

    test('throws on wrong argument count - too few', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        add(5)
      `;
      expect(() => interpreter.evaluate(code)).toThrow('Expected 2 arguments but got 1');
    });

    test('throws on wrong argument count - too many', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        add(5, 10, 15)
      `;
      expect(() => interpreter.evaluate(code)).toThrow('Expected 2 arguments but got 3');
    });
  });

  describe('Return statements', () => {
    test('early return', () => {
      const code = `
        function foo() {
          return 1;
          return 2;
        }
        foo()
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('conditional return', () => {
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

    test('return from nested block', () => {
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

    test('return from loop', () => {
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

    test('return with expression', () => {
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

    test('return without value', () => {
      const code = `
        function foo() {
          return;
        }
        foo()
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });
  });

  describe('Recursion', () => {
    test('simple recursion - factorial', () => {
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

    test('fibonacci recursion', () => {
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

    test('countdown recursion', () => {
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

    test('recursive power function', () => {
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

    test('gcd recursive', () => {
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

  describe('Closures', () => {
    test('function closes over outer variable', () => {
      const code = `
        let x = 10;
        function getX() {
          return x;
        }
        getX()
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('function can modify outer variable', () => {
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

    test('multiple functions share closure', () => {
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

    test('closure with parameter and outer variable', () => {
      const code = `
        let multiplier = 10;
        function multiply(x) {
          return x * multiplier;
        }
        multiply(5)
      `;
      expect(interpreter.evaluate(code)).toBe(50);
    });

    test('nested function closure', () => {
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

    test('function defined in block closes over block variable', () => {
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

  describe('Functions with local variables', () => {
    test('function local variables are isolated', () => {
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

    test('local variable does not leak', () => {
      const code = `
        function foo() {
          let x = 10;
        }
        foo();
        x
      `;
      expect(() => interpreter.evaluate(code)).toThrow("Undefined variable 'x'");
    });

    test('local variable shadows outer', () => {
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

    test('outer variable unchanged by local shadow', () => {
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

  describe('Function composition', () => {
    test('passing function result to another function', () => {
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

    test('nested function calls', () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        add(add(1, 2), add(3, 4))
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('function call in expression', () => {
      const code = `
        function getValue() {
          return 5;
        }
        getValue() * 2 + getValue()
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });
  });

  describe('Functions with loops', () => {
    test('function with while loop', () => {
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

    test('loop counter stays in function scope', () => {
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

  describe('Functions with conditionals', () => {
    test('function with if statement', () => {
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

    test('function with if-else', () => {
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

    test('function with if-else if-else', () => {
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

  describe('Complex scenarios', () => {
    test('helper function pattern', () => {
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

    test('counter with reset', () => {
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

    test('function with complex logic', () => {
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

    test('memoization pattern with closure', () => {
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

    test('accumulator pattern', () => {
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

  describe('Error handling', () => {
    test('calling undefined function throws', () => {
      expect(() => interpreter.evaluate('foo()')).toThrow("Undefined variable 'foo'");
    });

    test('calling non-function throws', () => {
      const code = `
        let x = 5;
        x()
      `;
      expect(() => interpreter.evaluate(code)).toThrow('Callee is not a function');
    });

    test('cannot redeclare function', () => {
      const code = `
        function foo() {
          return 1;
        }
        function foo() {
          return 2;
        }
      `;
      expect(() => interpreter.evaluate(code)).toThrow("Variable 'foo' has already been declared");
    });
  });
});
