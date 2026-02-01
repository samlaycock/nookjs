import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Execution Control", () => {
  describe("API", () => {
    describe("Execution Limits", () => {
      describe("maxCallStackDepth", () => {
        test("should execute successfully within call stack limit", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(
            `
        function countdown(n) {
          if (n <= 0) return 0;
          return countdown(n - 1);
        }
        countdown(10);
      `,
            { maxCallStackDepth: 100 },
          );
          expect(result).toBe(0);
        });

        test("should throw when call stack depth exceeded", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          function recurse(n) {
            return recurse(n + 1);
          }
          recurse(0);
        `,
              { maxCallStackDepth: 50 },
            );
          }).toThrow("Maximum call stack depth exceeded");
        });

        test("should track nested function calls", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          function a() { return b(); }
          function b() { return c(); }
          function c() { return d(); }
          function d() { return e(); }
          function e() { return f(); }
          function f() { return a(); }
          a();
        `,
              { maxCallStackDepth: 10 },
            );
          }).toThrow("Maximum call stack depth exceeded");
        });

        test("should work with async evaluation", async () => {
          const interpreter = new Interpreter();
          return expect(
            interpreter.evaluateAsync(
              `
          async function recurse(n) {
            return await recurse(n + 1);
          }
          await recurse(0);
        `,
              { maxCallStackDepth: 50 },
            ),
          ).rejects.toThrow("Maximum call stack depth exceeded");
        });

        test("should reset call stack between evaluations", () => {
          // First interpreter/call that uses most of the stack
          const interpreter1 = new Interpreter();
          const result1 = interpreter1.evaluate(
            `
        function deep(n) {
          if (n <= 0) return "done";
          return deep(n - 1);
        }
        deep(40);
      `,
            { maxCallStackDepth: 50 },
          );
          expect(result1).toBe("done");

          // Second interpreter/call should have fresh stack
          const interpreter2 = new Interpreter();
          const result2 = interpreter2.evaluate(
            `
        function deep(n) {
          if (n <= 0) return "done";
          return deep(n - 1);
        }
        deep(40);
      `,
            { maxCallStackDepth: 50 },
          );
          expect(result2).toBe("done");
        });
      });

      describe("maxLoopIterations", () => {
        test("should execute successfully within loop limit", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(
            `
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum = sum + i;
        }
        sum;
      `,
            { maxLoopIterations: 200 },
          );
          expect(result).toBe(4950);
        });

        test("should throw when while loop iterations exceeded", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          let i = 0;
          while (true) {
            i++;
          }
        `,
              { maxLoopIterations: 100 },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should throw when for loop iterations exceeded", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          for (let i = 0; ; i++) {
            // infinite for loop
          }
        `,
              { maxLoopIterations: 100 },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should throw when do-while loop iterations exceeded", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          let i = 0;
          do {
            i++;
          } while (true);
        `,
              { maxLoopIterations: 100 },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should throw when for-of loop iterations exceeded", () => {
          const interpreter = new Interpreter({
            globals: {
              infiniteGenerator: function* () {
                let i = 0;
                while (true) yield i++;
              },
            },
          });
          expect(() => {
            interpreter.evaluate(
              `
          for (const x of infiniteGenerator()) {
            // consume infinite generator
          }
        `,
              { maxLoopIterations: 100 },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should throw when for-in loop iterations exceeded", () => {
          const interpreter = new Interpreter();
          // Create an object with many properties
          const result = interpreter.evaluate(
            `
        const obj = {};
        for (let i = 0; i < 50; i++) {
          obj['key' + i] = i;
        }
        obj;
      `,
            { maxLoopIterations: 1000 },
          );
          expect(Object.keys(result).length).toBe(50);

          // Now iterate over it with a low limit
          const interpreter2 = new Interpreter({ globals: { obj: result } });
          expect(() => {
            interpreter2.evaluate(
              `
          for (const key in obj) {
            // iterate over properties
          }
        `,
              { maxLoopIterations: 10 },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should track iterations per-loop, not globally", () => {
          const interpreter = new Interpreter();
          // Two separate loops, each under the limit
          const result = interpreter.evaluate(
            `
        let sum = 0;
        for (let i = 0; i < 50; i++) {
          sum = sum + i;
        }
        for (let j = 0; j < 50; j++) {
          sum = sum + j;
        }
        sum;
      `,
            { maxLoopIterations: 100 },
          );
          expect(result).toBe(2450);
        });

        test("should work with async evaluation", async () => {
          const interpreter = new Interpreter({ globals: { Promise } });
          return expect(
            interpreter.evaluateAsync(
              `
          while (true) {
            await Promise.resolve();
          }
        `,
              { maxLoopIterations: 100 },
            ),
          ).rejects.toThrow("Maximum loop iterations exceeded");
        });
      });

      describe("maxMemory", () => {
        test("should execute successfully within memory limit", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(
            `
        const arr = [1, 2, 3, 4, 5];
        arr.length;
      `,
            { maxMemory: 10000 },
          );
          expect(result).toBe(5);
        });

        test("should throw when array allocation exceeds memory limit", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          const arr = [];
          for (let i = 0; i < 10000; i++) {
            arr.push([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
          }
        `,
              { maxMemory: 1000, maxLoopIterations: 100000 },
            );
          }).toThrow("Maximum memory limit exceeded");
        });

        test("should throw when object allocation exceeds memory limit", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            objects.push({ a: 1, b: 2, c: 3, d: 4, e: 5 });
          }
        `,
              { maxMemory: 5000, maxLoopIterations: 100000 },
            );
          }).toThrow("Maximum memory limit exceeded");
        });

        test("should throw when string concatenation exceeds memory limit", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          let str = '';
          for (let i = 0; i < 1000; i++) {
            str = \`\${str}hello world \`;
          }
        `,
              { maxMemory: 1000, maxLoopIterations: 100000 },
            );
          }).toThrow("Maximum memory limit exceeded");
        });

        test("should reset memory tracking between evaluations", () => {
          // First interpreter uses some memory
          const interpreter1 = new Interpreter();
          interpreter1.evaluate(`const arr = [1, 2, 3, 4, 5];`, {
            maxMemory: 10000,
          });

          // Second interpreter should have fresh memory tracking
          const interpreter2 = new Interpreter();
          const result = interpreter2.evaluate(`const arr2 = [1, 2, 3, 4, 5]; arr2.length;`, {
            maxMemory: 10000,
          });
          expect(result).toBe(5);
        });

        test("should work with async evaluation", async () => {
          const interpreter = new Interpreter({ globals: { Promise } });
          return expect(
            interpreter.evaluateAsync(
              `
          const objects = [];
          for (let i = 0; i < 1000; i++) {
            objects.push({ a: 1, b: 2, c: 3 });
            await Promise.resolve();
          }
        `,
              { maxMemory: 1000, maxLoopIterations: 100000 },
            ),
          ).rejects.toThrow("Maximum memory limit exceeded");
        });
      });

      describe("Combined limits", () => {
        test("should respect all limits together", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(
            `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(10);
      `,
            {
              maxCallStackDepth: 20,
              maxLoopIterations: 1000,
              maxMemory: 100000,
            },
          );
          expect(result).toBe(3628800);
        });

        test("should throw on call stack first if it exceeds", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          function recurse() { return recurse(); }
          recurse();
        `,
              {
                maxCallStackDepth: 10,
                maxLoopIterations: 1000,
                maxMemory: 100000,
              },
            );
          }).toThrow("Maximum call stack depth exceeded");
        });

        test("should throw on loop iterations first if it exceeds", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          while (true) {}
        `,
              {
                maxCallStackDepth: 1000,
                maxLoopIterations: 10,
                maxMemory: 100000,
              },
            );
          }).toThrow("Maximum loop iterations exceeded");
        });

        test("should throw on memory first if it exceeds", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(
              `
          const huge = [];
          for (let i = 0; i < 100; i++) {
            huge.push([1,2,3,4,5,6,7,8,9,10]);
          }
        `,
              {
                maxCallStackDepth: 1000,
                maxLoopIterations: 1000,
                maxMemory: 100,
              },
            );
          }).toThrow("Maximum memory limit exceeded");
        });
      });
    });

    describe("AbortSignal (async-only)", () => {
      test("should execute successfully when not aborted", async () => {
        const interpreter = new Interpreter();
        const controller = new AbortController();

        const result = await interpreter.evaluateAsync(
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

      test("should throw immediately if already aborted", async () => {
        const interpreter = new Interpreter();
        const controller = new AbortController();
        controller.abort();

        return expect(
          interpreter.evaluateAsync(`1 + 1`, { signal: controller.signal }),
        ).rejects.toThrow("Execution aborted");
      });

      test("should abort async evaluation via delayed signal", async () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        const interpreter = new Interpreter({
          globals: { delay },
        });
        const controller = new AbortController();

        setTimeout(() => controller.abort(), 100);

        return expect(
          interpreter.evaluateAsync(
            `
        var count = 0;
        while (true) {
          count = count + 1;
          await delay(1);
        }
      `,
            { signal: controller.signal },
          ),
        ).rejects.toThrow("Execution aborted");
      });

      test("signal should be per-call", async () => {
        const interpreter = new Interpreter();
        const controller1 = new AbortController();
        const controller2 = new AbortController();

        controller1.abort();

        // First call with aborted signal should throw
        try {
          await interpreter.evaluateAsync(`1 + 1`, {
            signal: controller1.signal,
          });
          expect().fail("Expected error");
        } catch (e: any) {
          expect(e.message).toBe("Execution aborted");
        }

        // Second call with non-aborted signal should work
        const result = await interpreter.evaluateAsync(`2 + 2`, {
          signal: controller2.signal,
        });
        expect(result).toBe(4);
      });

      test("signal is ignored in synchronous evaluate", () => {
        const interpreter = new Interpreter();
        const controller = new AbortController();
        controller.abort();

        // Sync evaluate ignores the signal — it completes normally
        const result = interpreter.evaluate(`1 + 1`, {
          signal: controller.signal,
        });
        expect(result).toBe(2);
      });
    });
  });
});
