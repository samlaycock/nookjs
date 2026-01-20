import { describe, test, expect } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe.skip("Execution Control", () => {
  describe("Timeout", () => {
    test("should execute successfully within timeout", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(
        `
        var sum = 0;
        for (var i = 0; i < 100; i++) {
          sum = sum + i;
        }
        sum;
      `,
        { timeout: 1000 },
      );
      expect(result).toBe(4950);
    });

    test("should throw on timeout exceeded", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(
          `
          var count = 0;
          while (true) {
            count = count + 1;
            // Infinite loop
          }
        `,
          { timeout: 100 },
        );
      }).toThrow("Execution timeout");
    });

    test("should work with async evaluation", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncOp: async () =>
            new Promise((resolve) => setTimeout(() => resolve(42), 10)),
        },
      });

      const result = await interpreter.evaluateAsync(
        `
        var result = await asyncOp();
        result;
      `,
        { timeout: 1000 },
      );
      expect(result).toBe(42);
    });

    test("should timeout async evaluation", async () => {
      const interpreter = new Interpreter();

      await expect(async () => {
        await interpreter.evaluateAsync(
          `
          var count = 0;
          while (true) {
            count = count + 1;
          }
        `,
          { timeout: 100 },
        );
      }).toThrow("Execution timeout");
    });

    test("should not timeout with no timeout set", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var sum = 0;
        for (var i = 0; i < 1000; i++) {
          sum = sum + i;
        }
        sum;
      `);
      expect(result).toBe(499500);
    });

    test("timeout should be per-call", () => {
      const interpreter = new Interpreter();

      // First call with timeout
      expect(() => {
        interpreter.evaluate(`var count = 0; while (true) { count++; }`, {
          timeout: 50,
        });
      }).toThrow("Execution timeout");

      // Second call without timeout should work
      const result = interpreter.evaluate(`1 + 1`);
      expect(result).toBe(2);
    });
  });

  describe("AbortSignal", () => {
    test("should execute successfully when not aborted", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      const result = interpreter.evaluate(
        `
        var sum = 0;
        for (var i = 0; i < 100; i++) {
          sum = sum + i;
        }
        sum;
      `,
        { signal: controller.signal },
      );

      expect(result).toBe(4950);
    });

    test("should throw when signal is aborted", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      expect(() => {
        interpreter.evaluate(
          `
          var count = 0;
          while (true) {
            count = count + 1;
          }
        `,
          { signal: controller.signal },
        );
      }).toThrow("Execution aborted");
    });

    test("should work with async evaluation", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncOp: async () =>
            new Promise((resolve) => setTimeout(() => resolve(42), 10)),
        },
      });
      const controller = new AbortController();

      const result = await interpreter.evaluateAsync(`await asyncOp();`, {
        signal: controller.signal,
      });

      expect(result).toBe(42);
    });

    test("should abort async evaluation", async () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      await expect(async () => {
        await interpreter.evaluateAsync(
          `
          var count = 0;
          while (true) {
            count = count + 1;
          }
        `,
          { signal: controller.signal },
        );
      }).toThrow("Execution aborted");
    });

    test("should throw immediately if already aborted", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();
      controller.abort(); // Abort before execution

      expect(() => {
        interpreter.evaluate(`1 + 1`, { signal: controller.signal });
      }).toThrow("Execution aborted");
    });

    test("signal should be per-call", () => {
      const interpreter = new Interpreter();
      const controller1 = new AbortController();
      const controller2 = new AbortController();

      controller1.abort();

      // First call with aborted signal should throw
      expect(() => {
        interpreter.evaluate(`1 + 1`, { signal: controller1.signal });
      }).toThrow("Execution aborted");

      // Second call with non-aborted signal should work
      const result = interpreter.evaluate(`2 + 2`, {
        signal: controller2.signal,
      });
      expect(result).toBe(4);
    });
  });

  describe("Combined timeout and signal", () => {
    test("should respect both timeout and signal", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      const result = interpreter.evaluate(`var x = 10; x * 2;`, {
        timeout: 1000,
        signal: controller.signal,
      });

      expect(result).toBe(20);
    });

    test("should throw on whichever happens first - timeout", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      // Abort after 200ms, but timeout at 50ms
      setTimeout(() => controller.abort(), 200);

      expect(() => {
        interpreter.evaluate(`var count = 0; while (true) { count++; }`, {
          timeout: 50,
          signal: controller.signal,
        });
      }).toThrow("Execution timeout");
    });

    test("should throw on whichever happens first - abort", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      // Abort after 50ms, but timeout at 200ms
      setTimeout(() => controller.abort(), 50);

      expect(() => {
        interpreter.evaluate(`var count = 0; while (true) { count++; }`, {
          timeout: 200,
          signal: controller.signal,
        });
      }).toThrow("Execution aborted");
    });
  });

  describe("Execution control with generators", () => {
    test("should timeout in generator execution", () => {
      const interpreter = new Interpreter();

      expect(() => {
        interpreter.evaluate(
          `
          function* infiniteGen() {
            while (true) {
              yield 1;
            }
          }
          var g = infiniteGen();
          var sum = 0;
          while (true) {
            var n = g.next();
            sum = sum + n.value;
          }
        `,
          { timeout: 100 },
        );
      }).toThrow("Execution timeout");
    });

    test("should abort generator execution", () => {
      const interpreter = new Interpreter();
      const controller = new AbortController();

      setTimeout(() => controller.abort(), 50);

      expect(() => {
        interpreter.evaluate(
          `
          function* gen() {
            var count = 0;
            while (true) {
              yield count++;
            }
          }
          var g = gen();
          var sum = 0;
          while (true) {
            sum = sum + g.next().value;
          }
        `,
          { signal: controller.signal },
        );
      }).toThrow("Execution aborted");
    });
  });

  describe("Performance optimization", () => {
    test("check counter should minimize performance impact", () => {
      const interpreter = new Interpreter();

      // This should run quickly even with timeout checking
      const start = Date.now();
      const result = interpreter.evaluate(
        `
        var sum = 0;
        for (var i = 0; i < 10000; i++) {
          sum = sum + i;
        }
        sum;
      `,
        { timeout: 5000 },
      );
      const elapsed = Date.now() - start;

      expect(result).toBe(49995000);
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
