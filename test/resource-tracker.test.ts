import { describe, test, expect } from "bun:test";

import { Interpreter, ResourceExhaustedError, ResourceTracker } from "../src";
import { ES2022 } from "../src/presets";

describe("Resource Tracking", () => {
  describe("API", () => {
    describe("ResourceTracker", () => {
      describe("basic tracking", () => {
        test("should track evaluations without limits", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("1 + 1");
          interpreter.evaluate("2 + 2");

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(2);
          expect(stats.isExhausted).toBe(false);
        });

        test("should track evaluations with memory usage", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("const obj = {}; for (let i = 0; i < 100; i++) obj['key' + i] = i;");

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(1);
        });

        test("should track cumulative loop iterations", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("let sum = 0; for (let i = 0; i < 100; i++) { sum += i; }");
          interpreter.evaluate("let sum2 = 0; for (let i = 0; i < 50; i++) { sum2 += i; }");

          const stats = interpreter.getResourceStats();
          expect(stats.iterations).toBeGreaterThanOrEqual(150);
          expect(stats.evaluations).toBe(2);
        });

        test("should track cumulative function calls", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate(`
        function add(a, b) { return a + b; }
        add(1, 2);
        add(3, 4);
      `);

          const stats = interpreter.getResourceStats();
          expect(stats.functionCalls).toBeGreaterThanOrEqual(2);
        });

        test("should track evaluation stats", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("const small = {a: 1, b: 2, c: 3}");
          interpreter.evaluate(
            "const large = {}; for (let i = 0; i < 1000; i++) large['key' + i] = i;",
          );

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(2);
        });

        test("should track largest evaluation iterations", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("const small = {a: 1}");
          interpreter.evaluate(
            "const large = {}; for (let i = 0; i < 1000; i++) large['key' + i] = i * 2;",
          );
          interpreter.evaluate(
            "const medium = {}; for (let i = 0; i < 100; i++) medium['key' + i] = i;",
          );

          const stats = interpreter.getResourceStats();
          expect(stats.largestEvaluation.iterations).toBeGreaterThanOrEqual(1000);
        });
      });

      describe("limits enforcement", () => {
        test("should throw when maxTotalIterations exceeded", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxTotalIterations", 10);

          interpreter.evaluate("let sum = 0; for (let i = 0; i < 5; i++) { sum += i; }");

          interpreter.evaluate("let sum2 = 0; for (let i = 0; i < 5; i++) { sum2 += i; }");

          expect(() => {
            interpreter.evaluate("let sum3 = 0; for (let i = 0; i < 5; i++) { sum3 += i; }");
          }).toThrow(ResourceExhaustedError);
        });

        test("should throw when maxEvaluations exceeded", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxEvaluations", 2);

          interpreter.evaluate("1 + 1");
          interpreter.evaluate("2 + 2");

          expect(() => {
            interpreter.evaluate("3 + 3");
          }).toThrow(ResourceExhaustedError);
        });

        test("should throw when maxFunctionCalls exceeded", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxFunctionCalls", 1);

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
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxEvaluations", 2);

          interpreter.evaluate("1 + 1");
          interpreter.evaluate("2 + 2");

          try {
            interpreter.evaluate("3 + 3");
          } catch (error) {
            expect(error).toBeInstanceOf(ResourceExhaustedError);
            expect(interpreter.getResourceStats().isExhausted).toBe(true);
          }
        });

        test("should track limit status with remaining values", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxEvaluations", 10);

          interpreter.evaluate("1 + 1");
          interpreter.evaluate("2 + 2");

          const stats = interpreter.getResourceStats();
          expect(stats.limitStatus.maxEvaluations).toEqual({
            used: 2,
            limit: 10,
            remaining: 8,
          });
        });
      });

      describe("reset functionality", () => {
        test("should reset all tracked stats", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("const obj = {}; for (let i = 0; i < 100; i++) obj['key' + i] = i;");
          interpreter.evaluate("for (let i = 0; i < 100; i++) {}");

          interpreter.resetResourceStats();

          const stats = interpreter.getResourceStats();
          expect(stats.memoryBytes).toBe(0);
          expect(stats.iterations).toBe(0);
          expect(stats.functionCalls).toBe(0);
          expect(stats.evaluations).toBe(0);
          expect(stats.peakMemoryBytes).toBe(0);
          expect(stats.isExhausted).toBe(false);
        });

        test("should reset history", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("1 + 1");
          expect(interpreter.getResourceHistory().length).toBe(1);

          interpreter.resetResourceStats();
          expect(interpreter.getResourceHistory().length).toBe(0);
        });
      });

      describe("history tracking", () => {
        test("should store evaluation history", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("1 + 1");
          interpreter.evaluate("2 + 2");

          const history = interpreter.getResourceHistory();
          expect(history.length).toBe(2);
          expect(history[0]?.evaluationNumber).toBe(1);
          expect(history[1]?.evaluationNumber).toBe(2);
        });

        test("should include timestamp in history", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("1 + 1");

          const history = interpreter.getResourceHistory();
          expect(history[0]?.timestamp).toBeInstanceOf(Date);
        });

        test("should respect history size limit", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          for (let i = 0; i < 5; i++) {
            interpreter.evaluate(`${i} + ${i}`);
          }

          const history = interpreter.getResourceHistory();
          expect(history.length).toBe(5);
        });
      });

      describe("limit management", () => {
        test("should get individual limit", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxTotalMemory", 1024);
          interpreter.setResourceLimit("maxEvaluations", 10);

          expect(interpreter.getResourceLimit("maxTotalMemory")).toBe(1024);
          expect(interpreter.getResourceLimit("maxEvaluations")).toBe(10);
          expect(interpreter.getResourceLimit("maxTotalIterations")).toBeUndefined();
        });

        test("should set individual limit", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxTotalMemory", 2048);

          expect(interpreter.getResourceLimit("maxTotalMemory")).toBe(2048);
        });

        test("should update limits after construction", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxEvaluations", 2);
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
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });
          interpreter.setResourceLimit("maxEvaluations", 2);

          await interpreter.evaluateAsync("Promise.resolve(1 + 1)");
          await interpreter.evaluateAsync("Promise.resolve(2 + 2)");

          expect(interpreter.getResourceStats().evaluations).toBe(2);

          expect(interpreter.evaluateAsync("Promise.resolve(3 + 3)")).rejects.toThrow(
            ResourceExhaustedError,
          );
        });

        test("should track resources across multiple evaluations", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("let x = 1; x * 2;");
          interpreter.evaluate("let y = 2; y * 3;");
          interpreter.evaluate("let z = 3; z * 4;");

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(3);
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
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("");

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(1);
        });

        test("should handle code with no resource usage", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate("1");

          const stats = interpreter.getResourceStats();
          expect(stats.evaluations).toBe(1);
          expect(stats.memoryBytes).toBe(0);
        });

        test("should track nested function calls correctly", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate(`
        function outer() {
          function inner() {
            return 1;
          }
          return inner() + inner();
        }
        outer();
      `);

          const stats = interpreter.getResourceStats();
          expect(stats.functionCalls).toBeGreaterThanOrEqual(3);
        });

        test("should track memory from multiple allocations", () => {
          const interpreter = new Interpreter({
            ...ES2022,
            resourceTracking: true,
          });

          interpreter.evaluate(`
        const a = {}; for (let i = 0; i < 50; i++) a['key' + i] = i;
        const b = {}; for (let i = 0; i < 50; i++) b['key' + i] = i;
        const c = {}; for (let i = 0; i < 50; i++) c['key' + i] = i;
      `);

          const stats = interpreter.getResourceStats();
          expect(stats.iterations).toBeGreaterThanOrEqual(150);
        });
      });

      describe("ResourceTracker class standalone", () => {
        test("should create tracker without options", () => {
          const tracker = new ResourceTracker();
          expect(tracker.getStats()).toBeDefined();
        });

        test("should create tracker with limits", () => {
          const tracker = new ResourceTracker({
            limits: { maxEvaluations: 10 },
          });
          expect(tracker.getLimit("maxEvaluations")).toBe(10);
        });

        test("should create tracker with history size", () => {
          const tracker = new ResourceTracker({ historySize: 5 });
          expect(tracker.getHistory().length).toBe(0);
        });

        test("should get and set limits", () => {
          const tracker = new ResourceTracker();
          tracker.setLimit("maxTotalIterations", 1000);
          expect(tracker.getLimit("maxTotalIterations")).toBe(1000);
        });

        test("should reset tracker state", () => {
          const tracker = new ResourceTracker();
          tracker.setLimit("maxEvaluations", 10);

          expect(tracker.isExhausted()).toBe(false);

          tracker.reset();
          expect(tracker.getStats().evaluations).toBe(0);
          expect(tracker.isExhausted()).toBe(false);
        });

        test("should return history copy", () => {
          const tracker = new ResourceTracker();
          const history1 = tracker.getHistory();
          const history2 = tracker.getHistory();
          expect(history1).not.toBe(history2);
          expect(history1).toEqual(history2);
        });
      });
    });
  });
});
