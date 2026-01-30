import { describe, test, expect } from "bun:test";

import { Interpreter, ResourceTracker, ResourceExhaustedError } from "../src";
import { ES2022 } from "../src/presets";

describe("ResourceTracker", () => {
  describe("basic tracking", () => {
    test("should track evaluations without limits", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(2);
      expect(stats.isExhausted).toBe(false);
    });

    test("should track evaluations with memory usage", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("const obj = {}; for (let i = 0; i < 100; i++) obj['key' + i] = i;");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(1);
    });

    test("should track cumulative loop iterations", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("let sum = 0; for (let i = 0; i < 100; i++) { sum += i; }");
      interpreter.evaluate("let sum2 = 0; for (let i = 0; i < 50; i++) { sum2 += i; }");

      const stats = tracker.getStats();
      expect(stats.iterations).toBeGreaterThanOrEqual(150);
      expect(stats.evaluations).toBe(2);
    });

    test("should track cumulative function calls", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate(`
        function add(a, b) { return a + b; }
        add(1, 2);
        add(3, 4);
      `);

      const stats = tracker.getStats();
      expect(stats.functionCalls).toBeGreaterThanOrEqual(2);
    });

    test("should track evaluation stats", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("const small = {a: 1, b: 2, c: 3}");
      interpreter.evaluate("const large = {}; for (let i = 0; i < 1000; i++) large['key' + i] = i;");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(2);
    });

    test("should track largest evaluation iterations", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("const small = {a: 1}");
      interpreter.evaluate("const large = {}; for (let i = 0; i < 1000; i++) large['key' + i] = i * 2;");
      interpreter.evaluate("const medium = {}; for (let i = 0; i < 100; i++) medium['key' + i] = i;");

      const stats = tracker.getStats();
      expect(stats.largestEvaluation.iterations).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("limits enforcement", () => {
    test("should throw when maxTotalIterations exceeded", () => {
      const tracker = new ResourceTracker({
        limits: { maxTotalIterations: 10 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("let sum = 0; for (let i = 0; i < 5; i++) { sum += i; }");

      interpreter.evaluate("let sum2 = 0; for (let i = 0; i < 5; i++) { sum2 += i; }");

      expect(() => {
        interpreter.evaluate("let sum3 = 0; for (let i = 0; i < 5; i++) { sum3 += i; }");
      }).toThrow(ResourceExhaustedError);
    });

    test("should throw when maxEvaluations exceeded", () => {
      const tracker = new ResourceTracker({
        limits: { maxEvaluations: 2 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      expect(() => {
        interpreter.evaluate("3 + 3");
      }).toThrow(ResourceExhaustedError);
    });

    test("should throw when maxFunctionCalls exceeded", () => {
      const tracker = new ResourceTracker({
        limits: { maxFunctionCalls: 1 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate(`
        function add(a, b) { return a + b; }
        add(1, 2);
      `);

      expect(() => {
        interpreter.evaluate(`
          function double(x) { return x * 2; }
          double(1);
        `);
      }).toThrow(ResourceExhaustedError);
    });

    test("should report correct exhausted limit", () => {
      const tracker = new ResourceTracker({
        limits: { maxEvaluations: 2 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      try {
        interpreter.evaluate("3 + 3");
      } catch (error) {
        expect(error).toBeInstanceOf(ResourceExhaustedError);
        expect(tracker.isExhausted()).toBe(true);
        expect(tracker.getExhaustedLimit()).toBe("maxEvaluations");
      }
    });

    test("should track limit status with remaining values", () => {
      const tracker = new ResourceTracker({
        limits: { maxEvaluations: 10 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      const stats = tracker.getStats();
      expect(stats.limitStatus.maxEvaluations).toEqual({
        used: 2,
        limit: 10,
        remaining: 8,
      });
    });
  });

  describe("reset functionality", () => {
    test("should reset all tracked stats", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("const obj = {}; for (let i = 0; i < 100; i++) obj['key' + i] = i;");
      interpreter.evaluate("for (let i = 0; i < 100; i++) {}");

      tracker.reset();

      const stats = tracker.getStats();
      expect(stats.memoryBytes).toBe(0);
      expect(stats.iterations).toBe(0);
      expect(stats.functionCalls).toBe(0);
      expect(stats.evaluations).toBe(0);
      expect(stats.peakMemoryBytes).toBe(0);
      expect(stats.isExhausted).toBe(false);
    });

    test("should reset history", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      expect(tracker.getHistory().length).toBe(1);

      tracker.reset();
      expect(tracker.getHistory().length).toBe(0);
    });
  });

  describe("history tracking", () => {
    test("should store evaluation history", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      const history = tracker.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].evaluationNumber).toBe(1);
      expect(history[1].evaluationNumber).toBe(2);
    });

    test("should include timestamp in history", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");

      const history = tracker.getHistory();
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    test("should respect history size limit", () => {
      const tracker = new ResourceTracker({ historySize: 3 });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      for (let i = 0; i < 5; i++) {
        interpreter.evaluate(`${i} + ${i}`);
      }

      const history = tracker.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].evaluationNumber).toBe(3);
      expect(history[2].evaluationNumber).toBe(5);
    });

    test("should disable history when size is 0", () => {
      const tracker = new ResourceTracker({ historySize: 0 });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      const history = tracker.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe("limit management", () => {
    test("should get individual limit", () => {
      const tracker = new ResourceTracker({
        limits: { maxTotalMemory: 1024, maxEvaluations: 10 },
      });

      expect(tracker.getLimit("maxTotalMemory")).toBe(1024);
      expect(tracker.getLimit("maxEvaluations")).toBe(10);
      expect(tracker.getLimit("maxTotalIterations")).toBeUndefined();
    });

    test("should set individual limit", () => {
      const tracker = new ResourceTracker();
      tracker.setLimit("maxTotalMemory", 2048);

      expect(tracker.getLimit("maxTotalMemory")).toBe(2048);
    });

    test("should update limits after construction", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      tracker.setLimit("maxEvaluations", 2);
      interpreter.evaluate("1 + 1");
      interpreter.evaluate("2 + 2");

      expect(() => {
        interpreter.evaluate("3 + 3");
      }).toThrow(ResourceExhaustedError);
    });
  });

  describe("integration with Interpreter", () => {
    test("should work without resource tracker", () => {
      const interpreter = new Interpreter();

      const result = interpreter.evaluate("1 + 1");
      expect(result).toBe(2);
    });

    test("should work with async evaluation", async () => {
      const tracker = new ResourceTracker({
        limits: { maxEvaluations: 2 },
      });
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      await interpreter.evaluateAsync("Promise.resolve(1 + 1)");
      await interpreter.evaluateAsync("Promise.resolve(2 + 2)");

      expect(tracker.getStats().evaluations).toBe(2);

      await expect(
        interpreter.evaluateAsync("Promise.resolve(3 + 3)"),
      ).rejects.toThrow(ResourceExhaustedError);
    });

    test("should track resources across multiple evaluations", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("let x = 1; x * 2;");
      interpreter.evaluate("let y = 2; y * 3;");
      interpreter.evaluate("let z = 3; z * 4;");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(3);
    });

    test("should handle concurrent resource trackers", () => {
      const tracker1 = new ResourceTracker({ limits: { maxEvaluations: 3 } });
      const tracker2 = new ResourceTracker({ limits: { maxEvaluations: 2 } });
      const interpreter1 = new Interpreter({ ...ES2022, resourceTracker: tracker1 });
      const interpreter2 = new Interpreter({ ...ES2022, resourceTracker: tracker2 });

      interpreter1.evaluate("1 + 1");
      interpreter1.evaluate("2 + 2");
      interpreter1.evaluate("3 + 3");

      interpreter2.evaluate("1");
      interpreter2.evaluate("2");

      expect(tracker1.isExhausted()).toBe(true);
      expect(tracker2.isExhausted()).toBe(true);
      expect(tracker1.getExhaustedLimit()).toBe("maxEvaluations");
      expect(tracker2.getExhaustedLimit()).toBe("maxEvaluations");
    });
  });

  describe("ResourceExhaustedError", () => {
    test("should have correct properties", () => {
      const error = new ResourceExhaustedError("maxTotalMemory", 2048, 1024);
      expect(error.resourceType).toBe("maxTotalMemory");
      expect(error.used).toBe(2048);
      expect(error.limit).toBe(1024);
      expect(error.message).toContain("maxTotalMemory");
      expect(error.message).toContain("2048");
      expect(error.message).toContain("1024");
    });

    test("should be instance of Error", () => {
      const error = new ResourceExhaustedError("maxEvaluations", 5, 3);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ResourceExhaustedError);
    });
  });

  describe("edge cases", () => {
    test("should handle empty code", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(1);
    });

    test("should handle code with no resource usage", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate("1");

      const stats = tracker.getStats();
      expect(stats.evaluations).toBe(1);
      expect(stats.memoryBytes).toBe(0);
    });

    test("should track nested function calls correctly", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate(`
        function outer() {
          function inner() {
            return 1;
          }
          return inner() + inner();
        }
        outer();
      `);

      const stats = tracker.getStats();
      expect(stats.functionCalls).toBeGreaterThanOrEqual(3);
    });

    test("should track memory from multiple allocations", () => {
      const tracker = new ResourceTracker();
      const interpreter = new Interpreter({ ...ES2022, resourceTracker: tracker });

      interpreter.evaluate(`
        const a = {}; for (let i = 0; i < 50; i++) a['key' + i] = i;
        const b = {}; for (let i = 0; i < 50; i++) b['key' + i] = i;
        const c = {}; for (let i = 0; i < 50; i++) c['key' + i] = i;
      `);

      const stats = tracker.getStats();
      expect(stats.iterations).toBeGreaterThanOrEqual(150);
    });
  });
});
