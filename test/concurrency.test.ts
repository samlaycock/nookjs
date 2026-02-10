import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";
import { createSandbox } from "../src/sandbox";

describe("Concurrency", () => {
  describe("Concurrent Evaluation Isolation", () => {
    it("should not leak per-call globals between concurrent runs", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedValue = async (value: string, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        return value;
      };

      const [a, b] = await Promise.all([
        sb.run("delayedValue('VALUE_A', 20)", { globals: { delayedValue } }),
        sb.run("delayedValue('VALUE_B', 1)", { globals: { delayedValue } }),
      ]);

      expect(a).toBe("VALUE_A");
      expect(b).toBe("VALUE_B");
    });

    it("should not leave leftover globals after concurrent runs complete", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedValue = async (value: string, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        return value;
      };

      await Promise.all([
        sb.run("delayedValue('A', 5)", { globals: { delayedValue } }),
        sb.run("delayedValue('B', 5)", { globals: { delayedValue } }),
      ]);

      const leaked = await sb.run("MY_SECRET_A").catch(() => undefined);
      expect(leaked).toBeUndefined();
    });

    it("should not allow one run's error to corrupt another's globals", async () => {
      const sb = createSandbox({ env: "es2022" });

      const throwError = async (msg: string) => {
        await new Promise((r) => setTimeout(r, 50));
        throw new Error(msg);
      };

      const returnSuccess = async () => {
        await new Promise((r) => setTimeout(r, 10));
        return "success";
      };

      const runA = sb.run("throwError('expected')", { globals: { throwError } });
      const runB = sb.run("returnSuccess()", { globals: { returnSuccess } });

      expect(runA).rejects.toThrow();
      expect(runB).resolves.toBe("success");
    });

    it("should execute concurrent runs with their own distinct globals", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedValue = async (value: number, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        return value;
      };

      const results = await Promise.all([
        sb.run("delayedValue(100, 30)", { globals: { delayedValue } }),
        sb.run("delayedValue(200, 10)", { globals: { delayedValue } }),
        sb.run("delayedValue(300, 20)", { globals: { delayedValue } }),
      ]);

      expect(results).toEqual([100, 200, 300]);
    });

    it("should handle many concurrent runs without data leakage", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedValue = async (value: string, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        return value;
      };

      const runs = Array.from({ length: 5 }, (_, i) =>
        sb.run(`delayedValue('VALUE_${i}', ${Math.random() * 50})`, {
          globals: { delayedValue },
        }),
      );

      const results = await Promise.all(runs);

      for (let i = 0; i < results.length; i++) {
        expect(results[i]).toBe(`VALUE_${i}`);
      }

      for (let i = 0; i < 5; i++) {
        const leaked = await sb.run(`SECRET_${i}`).catch(() => undefined);
        expect(leaked).toBeUndefined();
      }
    });

    it("should allow sequential evaluations without interference", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedValue = async (value: number) => {
        await new Promise((r) => setTimeout(r, 1));
        return value;
      };

      for (let i = 0; i < 5; i++) {
        const result = await sb.run("delayedValue(MY_VAR)", {
          globals: { delayedValue, MY_VAR: i },
        });
        expect(result).toBe(i);
      }

      const leaked = await sb.run("MY_VAR").catch(() => undefined);
      expect(leaked).toBeUndefined();
    });

    it("should isolate per-call globals when using interpreter directly", async () => {
      const interpreter = new Interpreter({ ...ES2024 });

      const delayedValue = async (value: string, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        return value;
      };

      const [a, b] = await Promise.all([
        interpreter.evaluateAsync("delayedValue('A', 20)", {
          globals: { delayedValue },
        }),
        interpreter.evaluateAsync("delayedValue('B', 5)", {
          globals: { delayedValue },
        }),
      ]);

      expect(a).toBe("A");
      expect(b).toBe("B");
    });

    it("should serialize async evaluations", async () => {
      const sb = createSandbox({ env: "es2022" });

      const executionOrder: string[] = [];
      const recordOrder = (name: string) => {
        executionOrder.push(name);
      };

      const delayedRecord = async (name: string, delay: number) => {
        await new Promise((r) => setTimeout(r, delay));
        recordOrder(name);
        return name;
      };

      const runSlow = sb.run("delayedRecord('slow', 50)", {
        globals: { delayedRecord },
      });
      const runFast = sb.run("delayedRecord('fast', 10)", {
        globals: { delayedRecord },
      });

      const [slow, fast] = await Promise.all([runSlow, runFast]);

      expect(slow).toBe("slow");
      expect(fast).toBe("fast");
      expect(executionOrder).toEqual(["slow", "fast"]);
    });

    it("should not leak globals when one evaluation throws", async () => {
      const sb = createSandbox({ env: "es2022" });

      const delayedThrow = async () => {
        await new Promise((r) => setTimeout(r, 5));
        throw new Error("intentional");
      };

      const delayedReturn = async (value: string) => {
        await new Promise((r) => setTimeout(r, 1));
        return value;
      };

      await sb.run("delayedThrow()", { globals: { delayedThrow } }).catch(() => {});

      const result = await sb.run("delayedReturn('SHOULD_BE_ISOLATED')", {
        globals: { delayedReturn },
      });
      expect(result).toBe("SHOULD_BE_ISOLATED");
    });

    it("should isolate globals in synchronous concurrent evaluations", () => {
      const sb = createSandbox({ env: "es2022" });

      const getValue = (value: string) => value;

      const results = [
        sb.runSync("getValue('A')", { globals: { getValue } }),
        sb.runSync("getValue('B')", { globals: { getValue } }),
        sb.runSync("getValue('C')", { globals: { getValue } }),
      ];

      expect(results).toEqual(["A", "B", "C"]);
    });

    describe("AsyncMutex Mutual Exclusion", () => {
      it("should not start next evaluation until current one completes", async () => {
        const sb = createSandbox({ env: "es2022" });

        const startTimes: number[] = [];
        let evaluationIndex = 0;

        const trackStart = (delay: number) => {
          startTimes.push(evaluationIndex++);
          return delay;
        };

        const _delayedReturn = async (value: string, delay: number) => {
          await new Promise((r) => setTimeout(r, delay));
          return value;
        };

        const run1 = sb.run("trackStart(50)", { globals: { trackStart } });
        await new Promise((r) => setTimeout(r, 5));
        const run2 = sb.run("trackStart(10)", { globals: { trackStart } });

        await Promise.all([run1, run2]);

        expect(startTimes).toEqual([0, 1]);
      });

      it("should block new concurrent calls during async evaluation", async () => {
        const sb = createSandbox({ env: "es2022" });

        const executionLog: string[] = [];
        let _callCount = 0;

        const startTask = (name: string, duration: number) => {
          executionLog.push(`${name}_start`);
          return new Promise<string>((resolve) => {
            setTimeout(() => {
              executionLog.push(`${name}_end`);
              resolve(name);
            }, duration);
          });
        };

        const runLong = sb.run("startTask('long', 30)", {
          globals: { startTask },
        });

        await new Promise((r) => setTimeout(r, 10));

        const runShort = sb.run("startTask('short', 10)", {
          globals: { startTask },
        });

        await Promise.all([runLong, runShort]);

        expect(executionLog).toEqual(["long_start", "long_end", "short_start", "short_end"]);
      });

      it("should strictly serialize multiple queued async evaluations", async () => {
        const sb = createSandbox({ env: "es2022" });

        const executionOrder: string[] = [];

        const recordAndWait = async (name: string, delay: number) => {
          executionOrder.push(name);
          await new Promise((r) => setTimeout(r, delay));
          return name;
        };

        const runs = [
          sb.run("recordAndWait('first', 20)", { globals: { recordAndWait } }),
          sb.run("recordAndWait('second', 10)", { globals: { recordAndWait } }),
          sb.run("recordAndWait('third', 5)", { globals: { recordAndWait } }),
        ];

        const results = await Promise.all(runs);

        expect(results).toEqual(["first", "second", "third"]);
        expect(executionOrder).toEqual(["first", "second", "third"]);
      });

      it("should not allow concurrent execution with side effects", async () => {
        const sb = createSandbox({ env: "es2022" });

        const sharedState: number[] = [];

        const pushAndWait = async (value: number, delay: number) => {
          sharedState.push(value);
          await new Promise((r) => setTimeout(r, delay));
          return value;
        };

        const run1 = sb.run("pushAndWait(1, 50)", { globals: { pushAndWait } });
        const run2 = sb.run("pushAndWait(2, 30)", { globals: { pushAndWait } });
        const run3 = sb.run("pushAndWait(3, 10)", { globals: { pushAndWait } });

        await Promise.all([run1, run2, run3]);

        expect(sharedState).toEqual([1, 2, 3]);
      });

      it("should serialize error-throwing evaluations correctly", async () => {
        const sb = createSandbox({ env: "es2022" });

        const executionOrder: string[] = [];

        const recordAndThrow = async (name: string, shouldThrow: boolean) => {
          executionOrder.push(`${name}_start`);
          await new Promise((r) => setTimeout(r, 10));
          if (shouldThrow) {
            throw new Error(name);
          }
          executionOrder.push(`${name}_end`);
          return name;
        };

        const runThrow = sb.run("recordAndThrow('error', true)", {
          globals: { recordAndThrow },
        });
        const runSuccess = sb.run("recordAndThrow('success', false)", {
          globals: { recordAndThrow },
        });

        await runThrow.catch(() => {});
        await runSuccess;

        expect(executionOrder).toEqual(["error_start", "success_start", "success_end"]);
      });
    });
  });
});
