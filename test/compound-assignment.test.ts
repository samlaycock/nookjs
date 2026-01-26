import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Compound Assignment Operators", () => {
  describe("Arithmetic operators", () => {
    test("+= addition assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 5; x += 3; x`)).toBe(8);
    });

    test("-= subtraction assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 10; x -= 3; x`)).toBe(7);
    });

    test("*= multiplication assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 4; x *= 3; x`)).toBe(12);
    });

    test("/= division assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 20; x /= 4; x`)).toBe(5);
    });

    test("%= modulo assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 17; x %= 5; x`)).toBe(2);
    });

    test("**= exponentiation assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 2; x **= 3; x`)).toBe(8);
    });
  });

  describe("Bitwise operators", () => {
    test("<<= left shift assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 5; x <<= 2; x`)).toBe(20);
    });

    test(">>= right shift assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 20; x >>= 2; x`)).toBe(5);
    });

    test(">>>= unsigned right shift assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = -8; x >>>= 2; x`)).toBe(1073741822);
    });

    test("&= bitwise AND assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 15; x &= 9; x`)).toBe(9);
    });

    test("|= bitwise OR assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 5; x |= 3; x`)).toBe(7);
    });

    test("^= bitwise XOR assignment", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 15; x ^= 5; x`)).toBe(10);
    });
  });

  describe("String concatenation", () => {
    test("+= string concatenation", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let s = "hello"; s += " world"; s`)).toBe("hello world");
    });

    test("+= mixed string and number", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let s = "count: "; s += 42; s`)).toBe("count: 42");
    });
  });

  describe("Array element assignment", () => {
    test("+= on array element", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let arr = [1, 2, 3]; arr[1] += 10; arr[1]`)).toBe(12);
    });

    test("-= on array element", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let arr = [10, 20, 30]; arr[0] -= 5; arr[0]`)).toBe(5);
    });

    test("*= on array element with computed index", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let arr = [1, 2, 3]; let i = 2; arr[i] *= 4; arr[2]`)).toBe(12);
    });
  });

  describe("Object property assignment", () => {
    test("+= on object property", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let obj = { x: 5 }; obj.x += 3; obj.x`)).toBe(8);
    });

    test("-= on object property", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let obj = { value: 100 }; obj.value -= 25; obj.value`)).toBe(75);
    });

    test("+= on computed object property", () => {
      const interpreter = new Interpreter();
      expect(
        interpreter.evaluate(`let obj = { key: 10 }; let prop = "key"; obj[prop] += 5; obj.key`),
      ).toBe(15);
    });

    test("*= on nested object property", () => {
      const interpreter = new Interpreter();
      expect(
        interpreter.evaluate(
          `let obj = { inner: { value: 7 } }; obj.inner.value *= 3; obj.inner.value`,
        ),
      ).toBe(21);
    });
  });

  describe("Class instance properties", () => {
    test("+= on class instance property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          constructor() {
            this.count = 0;
          }
          increment(n) {
            this.count += n;
            return this.count;
          }
        }
        const c = new Counter();
        c.increment(5);
        c.increment(3);
      `);
      expect(result).toBe(8);
    });

    test("-= on class instance property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Balance {
          constructor(initial) {
            this.amount = initial;
          }
          withdraw(n) {
            this.amount -= n;
            return this.amount;
          }
        }
        const b = new Balance(100);
        b.withdraw(30);
      `);
      expect(result).toBe(70);
    });
  });

  describe("Private fields", () => {
    test("+= on private field", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          #count = 0;
          add(n) {
            this.#count += n;
            return this.#count;
          }
        }
        const c = new Counter();
        c.add(5);
        c.add(10);
      `);
      expect(result).toBe(15);
    });
  });

  describe("Return value", () => {
    test("compound assignment returns the new value", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 5; (x += 3)`)).toBe(8);
    });

    test("compound assignment in expression context", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate(`let x = 5; let y = (x += 3) * 2; y`)).toBe(16);
    });
  });

  describe("Async evaluation", () => {
    test("+= works in async context", async () => {
      const interpreter = new Interpreter({ globals: { Promise } });
      const result = await interpreter.evaluateAsync(`
        let x = 5;
        x += 3;
        x;
      `);
      expect(result).toBe(8);
    });

    test("+= on object property in async context", async () => {
      const interpreter = new Interpreter({ globals: { Promise } });
      const result = await interpreter.evaluateAsync(`
        let obj = { value: 10 };
        await Promise.resolve();
        obj.value += 5;
        obj.value;
      `);
      expect(result).toBe(15);
    });
  });

  describe("Chained operations", () => {
    test("multiple compound assignments in sequence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 10;
        x += 5;
        x *= 2;
        x -= 10;
        x /= 5;
        x;
      `);
      expect(result).toBe(4);
    });

    test("compound assignment in loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let sum = 0;
        for (let i = 1; i <= 5; i++) {
          sum += i;
        }
        sum;
      `);
      expect(result).toBe(15);
    });
  });
});
