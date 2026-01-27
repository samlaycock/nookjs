import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("labeled statements", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Labeled break", () => {
    test("break out of outer loop from inner loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        outer: for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 2) break outer;
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(2); // i=0, j=0 and j=1
    });

    test("break out of labeled while loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        outer: while (true) {
          let i = 0;
          while (i < 10) {
            if (i === 3) break outer;
            result++;
            i++;
          }
        }
        result;
      `);
      expect(result).toBe(3);
    });

    test("break out of labeled block statement", () => {
      const result = interpreter.evaluate(`
        let x = 0;
        block: {
          x = 1;
          break block;
          x = 2;
        }
        x;
      `);
      expect(result).toBe(1);
    });

    test("unlabeled break still works in labeled loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        outer: for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 2) break; // breaks inner loop only
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(10); // 5 iterations of outer * 2 iterations of inner
    });
  });

  describe("Labeled continue", () => {
    test("continue outer loop from inner loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        outer: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (j === 1) continue outer;
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(3); // i=0,j=0; i=1,j=0; i=2,j=0
    });

    test("continue labeled while loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        let i = 0;
        outer: while (i < 3) {
          i++;
          let j = 0;
          while (j < 3) {
            j++;
            if (j === 2) continue outer;
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(3); // each outer iteration: j=1 increments result, j=2 continues outer
    });

    test("unlabeled continue still works in labeled loop", () => {
      const result = interpreter.evaluate(`
        let result = 0;
        outer: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 2) continue; // continues inner loop only
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(12); // 3 * (5 - 1 skip) = 12
    });
  });

  describe("Nested labels", () => {
    test("multiple labels on nested loops", () => {
      const result = interpreter.evaluate(`
        let result = [];
        outer: for (let i = 0; i < 3; i++) {
          middle: for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
              if (k === 1) continue middle;
              if (j === 2) break outer;
              result.push(i + ',' + j + ',' + k);
            }
          }
        }
        result;
      `);
      // i=0,j=0,k=0 -> push; k=1 -> continue middle
      // i=0,j=1,k=0 -> push; k=1 -> continue middle
      // i=0,j=2 -> break outer
      expect(result).toEqual(["0,0,0", "0,1,0"]);
    });
  });

  describe("Label with for-of", () => {
    test("break labeled for-of from inner loop", () => {
      const result = interpreter.evaluate(`
        let result = [];
        outer: for (let item of [1, 2, 3]) {
          for (let j = 0; j < 3; j++) {
            if (j === 1) break outer;
            result.push(item);
          }
        }
        result;
      `);
      expect(result).toEqual([1]);
    });

    test("continue labeled for-of from inner loop", () => {
      const result = interpreter.evaluate(`
        let result = [];
        outer: for (let item of [1, 2, 3]) {
          for (let j = 0; j < 3; j++) {
            if (j === 1) continue outer;
            result.push(item + '-' + j);
          }
        }
        result;
      `);
      expect(result).toEqual(["1-0", "2-0", "3-0"]);
    });
  });

  describe("Label with for-in", () => {
    test("break labeled for-in from inner loop", () => {
      const result = interpreter.evaluate(`
        let result = [];
        let obj = { a: 1, b: 2, c: 3 };
        outer: for (let key in obj) {
          for (let j = 0; j < 3; j++) {
            if (j === 1) break outer;
            result.push(key);
          }
        }
        result;
      `);
      expect(result).toEqual(["a"]);
    });
  });

  describe("Async evaluation", () => {
    test("labeled break works in async context", async () => {
      const result = await interpreter.evaluateAsync(`
        let result = 0;
        outer: for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (j === 2) break outer;
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(2);
    });

    test("labeled continue works in async context", async () => {
      const result = await interpreter.evaluateAsync(`
        let result = 0;
        outer: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (j === 1) continue outer;
            result++;
          }
        }
        result;
      `);
      expect(result).toBe(3);
    });
  });
});
