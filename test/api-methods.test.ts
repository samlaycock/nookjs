import { describe, it, expect } from "bun:test";

import type { ExecutionStats, ExecutionStep } from "../src/interpreter";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Interpreter", () => {
  describe("API", () => {
    describe("clearGlobals()", () => {
      it("should clear user-declared variables", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate("let x = 10; let y = 20;");

        // Variables exist before clearing
        expect(interpreter.evaluate("x")).toBe(10);
        expect(interpreter.evaluate("y")).toBe(20);

        interpreter.clearGlobals();

        // Variables are cleared
        expect(() => interpreter.evaluate("x")).toThrow("Undefined variable 'x'");
        expect(() => interpreter.evaluate("y")).toThrow("Undefined variable 'y'");
      });

      it("should preserve built-in globals", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate("let x = 10;");

        interpreter.clearGlobals();

        // Built-in globals still available
        expect(interpreter.evaluate("undefined")).toBe(undefined);
        expect(interpreter.evaluate("NaN")).toBeNaN();
        expect(interpreter.evaluate("Infinity")).toBe(Infinity);
      });

      it("should preserve constructor-provided globals", () => {
        const interpreter = new Interpreter({ globals: { Math, myValue: 42 } });
        interpreter.evaluate("let x = 10;");

        interpreter.clearGlobals();

        // Constructor globals preserved
        expect(interpreter.evaluate("Math.PI")).toBeCloseTo(3.14159, 4);
        expect(interpreter.evaluate("myValue")).toBe(42);

        // User variable cleared
        expect(() => interpreter.evaluate("x")).toThrow("Undefined variable 'x'");
      });

      it("should allow new declarations after clearing", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate("let x = 10;");
        interpreter.clearGlobals();

        // Can declare x again
        interpreter.evaluate("let x = 100;");
        expect(interpreter.evaluate("x")).toBe(100);
      });

      it("should clear functions and classes", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        function add(a, b) { return a + b; }
        class Foo { bar() { return 42; } }
      `);

        expect(interpreter.evaluate("add(1, 2)")).toBe(3);

        interpreter.clearGlobals();

        expect(() => interpreter.evaluate("add(1, 2)")).toThrow("Undefined variable 'add'");
        expect(() => interpreter.evaluate("new Foo()")).toThrow("Undefined variable 'Foo'");
      });
    });

    describe("parse()", () => {
      it("should parse simple code and return AST", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("const x = 1 + 2;");

        expect(ast.type).toBe("Program");
        expect(ast.body.length).toBe(1);
        expect(ast.body[0]?.type).toBe("VariableDeclaration");
      });

      it("should parse function declarations", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("function foo(a, b) { return a + b; }");

        expect(ast.body[0]?.type).toBe("FunctionDeclaration");
      });

      it("should parse class declarations", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("class Foo { bar() {} }");

        expect(ast.body[0]?.type).toBe("ClassDeclaration");
      });

      it("should parse async/await", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("async function foo() { await bar(); }");

        expect(ast.body[0]?.type).toBe("FunctionDeclaration");
      });

      it("should throw ParseError for invalid syntax", () => {
        const interpreter = new Interpreter();

        expect(() => interpreter.parse("const x = ;")).toThrow();
        expect(() => interpreter.parse("function () {}")).toThrow();
      });

      it("should reject unsupported TypeScript enum and namespace declarations", () => {
        const interpreter = new Interpreter();

        expect(() => interpreter.parse("enum Color { Red, Blue }")).toThrow(
          "TypeScript 'enum' declarations are not supported",
        );
        expect(() => interpreter.parse("namespace Foo { export const x = 1; }")).toThrow(
          "TypeScript 'namespace' declarations are not supported",
        );
        expect(() => interpreter.evaluate("enum Color { Red, Blue }")).toThrow(
          "TypeScript 'enum' declarations are not supported",
        );
        expect(() => interpreter.evaluate("namespace Foo { export const x = 1; }")).toThrow(
          "TypeScript 'namespace' declarations are not supported",
        );
      });

      it("should parse without executing", () => {
        const interpreter = new Interpreter();

        // This would throw if executed because 'foo' doesn't exist
        // but parsing should succeed
        const ast = interpreter.parse("const x = foo();");
        expect(ast.type).toBe("Program");
      });

      it("should parse arrow functions", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("const add = (a, b) => a + b;");

        expect(ast.body[0]?.type).toBe("VariableDeclaration");
      });

      it("should parse template literals", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("const msg = `hello ${name}`;");

        expect(ast.body[0]?.type).toBe("VariableDeclaration");
      });

      it("should parse destructuring", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("const { a, b } = obj;");

        expect(ast.body[0]?.type).toBe("VariableDeclaration");
      });

      it("should parse generators", () => {
        const interpreter = new Interpreter();
        const ast = interpreter.parse("function* gen() { yield 1; }");

        expect(ast.body[0]?.type).toBe("FunctionDeclaration");
      });
    });

    describe("getStats()", () => {
      it("should return execution statistics", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate("const x = 1 + 2;");

        const stats: ExecutionStats = interpreter.getStats();

        expect(stats.nodeCount).toBeGreaterThan(0);
        expect(stats.functionCalls).toBe(0);
        expect(stats.loopIterations).toBe(0);
        expect(stats.executionTimeMs).toBeGreaterThanOrEqual(0);
      });

      it("should track loop iterations", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        for (let i = 0; i < 10; i++) {
          const x = i;
        }
      `);

        const stats = interpreter.getStats();

        // Loop iterations includes the final check that exits the loop
        expect(stats.loopIterations).toBeGreaterThanOrEqual(10);
      });

      it("should track function calls", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        function add(a, b) { return a + b; }
        add(1, 2);
        add(3, 4);
        add(5, 6);
      `);

        const stats = interpreter.getStats();

        expect(stats.functionCalls).toBe(3);
      });

      it("should track nested function calls", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        function outer() {
          return inner();
        }
        function inner() {
          return 42;
        }
        outer();
      `);

        const stats = interpreter.getStats();

        // outer() calls inner(), so 2 calls total
        expect(stats.functionCalls).toBe(2);
      });

      it("should track while loop iterations", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        let i = 0;
        while (i < 5) {
          i++;
        }
      `);

        const stats = interpreter.getStats();

        expect(stats.loopIterations).toBeGreaterThanOrEqual(5);
      });

      it("should track for-of loop iterations", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        for (const x of arr) {
          const y = x;
        }
      `);

        const stats = interpreter.getStats();

        expect(stats.loopIterations).toBeGreaterThanOrEqual(5);
      });

      it("should reset stats between evaluations", () => {
        const interpreter = new Interpreter();

        // First evaluation with loops
        interpreter.evaluate(`
        for (let i = 0; i < 10; i++) {}
      `);
        const stats1 = interpreter.getStats();
        expect(stats1.loopIterations).toBeGreaterThanOrEqual(10);

        // Second evaluation with fewer loops
        interpreter.evaluate(`
        for (let i = 0; i < 3; i++) {}
      `);
        const stats2 = interpreter.getStats();
        expect(stats2.loopIterations).toBeLessThan(stats1.loopIterations);
      });

      it("should work with async evaluation", async () => {
        const interpreter = new Interpreter();
        await interpreter.evaluateAsync(`
        for (let i = 0; i < 5; i++) {
          const x = i;
        }
      `);

        const stats = interpreter.getStats();

        expect(stats.loopIterations).toBeGreaterThanOrEqual(5);
        expect(stats.nodeCount).toBeGreaterThan(0);
      });

      it("should track method calls on classes", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        class Calculator {
          add(a, b) { return a + b; }
          multiply(a, b) { return a * b; }
        }
        const calc = new Calculator();
        calc.add(1, 2);
        calc.multiply(3, 4);
      `);

        const stats = interpreter.getStats();

        // 2 method calls (add and multiply)
        expect(stats.functionCalls).toBeGreaterThanOrEqual(2);
      });

      it("should track execution time", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
      `);

        const stats = interpreter.getStats();

        expect(stats.executionTimeMs).toBeGreaterThanOrEqual(0);
      });
    });

    describe("evaluateSteps()", () => {
      it("should yield steps for each statement", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps(`
        let x = 1;
        let y = 2;
        x + y;
      `);

        const steps: ExecutionStep[] = [];
        for (const step of stepper) {
          steps.push(step);
        }

        // Should have 4 steps: 3 statements + final done step
        expect(steps.length).toBe(4);
        expect(steps[0]?.nodeType).toBe("VariableDeclaration");
        expect(steps[1]?.nodeType).toBe("VariableDeclaration");
        expect(steps[2]?.nodeType).toBe("ExpressionStatement");
        expect(steps[3]?.done).toBe(true);
        expect(steps[3]?.result).toBe(3);
      });

      it("should include line numbers when available", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps("let x = 1;\nlet y = 2;");

        const steps: ExecutionStep[] = [];
        for (const step of stepper) {
          steps.push(step);
        }

        // Line numbers should be defined
        expect(steps[0]?.line).toBeDefined();
      });

      it("should allow inspecting scope between steps", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps(`
        let x = 10;
        let y = 20;
      `);

        const gen = stepper[Symbol.iterator]();

        // Before first statement
        gen.next();
        // After x = 10 is declared
        gen.next();

        // Now x should be in scope
        const scope1 = interpreter.getScope();
        expect(scope1.x).toBe(10);

        // After y = 20 is declared
        gen.next();
        gen.next();

        const scope2 = interpreter.getScope();
        expect(scope2.x).toBe(10);
        expect(scope2.y).toBe(20);
      });

      it("should work with function declarations", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps(`
        function add(a, b) { return a + b; }
        add(1, 2);
      `);

        const steps: ExecutionStep[] = [];
        for (const step of stepper) {
          steps.push(step);
        }

        expect(steps[0]?.nodeType).toBe("FunctionDeclaration");
        expect(steps[1]?.nodeType).toBe("ExpressionStatement");
        expect(steps[2]?.done).toBe(true);
        expect(steps[2]?.result).toBe(3);
      });

      it("should handle empty code", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps("");

        const steps: ExecutionStep[] = [];
        for (const step of stepper) {
          steps.push(step);
        }

        expect(steps.length).toBe(1);
        expect(steps[0]?.done).toBe(true);
      });

      it("should allow early termination", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps(`
        let x = 1;
        let y = 2;
        let z = 3;
      `);

        const steps: ExecutionStep[] = [];
        for (const step of stepper) {
          steps.push(step);
          if (steps.length === 2) {
            break; // Stop early
          }
        }

        expect(steps.length).toBe(2);
      });

      it("should apply validators before stepping", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps("let x = 1;", {
          validator: () => false,
        });

        expect(() => stepper.next()).toThrow("AST validation failed");
      });

      it("should apply per-evaluation limits while stepping", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps(
          `
          for (let i = 0; i < 3; i++) {
            i;
          }
        `,
          { maxLoopIterations: 1 },
        );

        expect(() => Array.from(stepper)).toThrow("Maximum loop iterations exceeded");
      });

      it("should enhance errors with source metadata while stepping", () => {
        const interpreter = new Interpreter();
        const code = "missingValue + 1;";
        const stepper = interpreter.evaluateSteps(code);

        expect(() => {
          Array.from(stepper);
        }).toThrow(
          expect.objectContaining({
            sourceCode: code,
            callStack: [],
          }),
        );
      });

      it("should use standard evaluation cleanup for early-terminated stepping", () => {
        const interpreter = new Interpreter({ resourceTracking: true });

        for (const _step of interpreter.evaluateSteps("temp;", { globals: { temp: 42 } })) {
          break;
        }

        expect("temp" in interpreter.getScope()).toBe(false);
        expect(interpreter.getResourceStats().evaluations).toBe(1);
      });

      it("should not start evaluation state before stepping begins", () => {
        const interpreter = new Interpreter({ resourceTracking: true });

        interpreter.evaluateSteps("temp;", { globals: { temp: 42 } });

        expect("temp" in interpreter.getScope()).toBe(false);
        expect(interpreter.getResourceStats().evaluations).toBe(0);
      });

      it("should clean up immediately after yielding the final completion step", () => {
        const interpreter = new Interpreter({ resourceTracking: true });
        const stepper = interpreter.evaluateSteps("temp;", { globals: { temp: 42 } });

        expect(stepper.next().value).toMatchObject({
          nodeType: "ExpressionStatement",
          done: false,
        });
        expect(stepper.next().value).toMatchObject({
          nodeType: "Program",
          done: true,
        });

        expect("temp" in interpreter.getScope()).toBe(false);
        expect(interpreter.getResourceStats().evaluations).toBe(1);
      });

      it("should clean up an abandoned step evaluation before a later evaluation starts", () => {
        const interpreter = new Interpreter({ resourceTracking: true });
        const stepper = interpreter.evaluateSteps("temp;", { globals: { temp: 42 } });

        expect(stepper.next().value).toMatchObject({
          nodeType: "ExpressionStatement",
          done: false,
        });
        expect(interpreter.getScope().temp).toBe(42);

        expect(interpreter.evaluate("1 + 1")).toBe(2);

        expect("temp" in interpreter.getScope()).toBe(false);
        expect(interpreter.getResourceStats().evaluations).toBe(2);
      });

      it("should preserve InterpreterError instances when enhancing step errors", () => {
        const interpreter = new Interpreter();
        const stepper = interpreter.evaluateSteps("unknownName;");

        try {
          Array.from(stepper);
          throw new Error("expected stepper to throw");
        } catch (error) {
          expect(error).toBeInstanceOf(InterpreterError);
        }
      });
    });

    describe("getScope()", () => {
      it("should return current scope variables", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate("let x = 10; let y = 20;");

        const scope = interpreter.getScope();

        expect(scope.x).toBe(10);
        expect(scope.y).toBe(20);
      });

      it("should include built-in globals", () => {
        const interpreter = new Interpreter();
        const scope = interpreter.getScope();

        expect("undefined" in scope).toBe(true);
        expect("NaN" in scope).toBe(true);
        expect("Infinity" in scope).toBe(true);
      });

      it("should include constructor-provided globals", () => {
        const interpreter = new Interpreter({ globals: { myVar: 42 } });
        const scope = interpreter.getScope();

        expect(scope.myVar).toBe(42);
      });

      it("should reflect changes after evaluation", () => {
        const interpreter = new Interpreter();

        interpreter.evaluate("let counter = 0;");
        expect(interpreter.getScope().counter).toBe(0);

        interpreter.evaluate("counter = 5;");
        expect(interpreter.getScope().counter).toBe(5);
      });

      it("should resolve getter-backed module imports to their current values", async () => {
        const capturedScopes: Array<Record<string, any>> = [];
        const files = new Map<string, string>([
          [
            "counter.js",
            `
              export let value = 1;
              export function setValue(next) {
                value = next;
              }
            `,
          ],
        ]);

        const interpreter = new Interpreter({
          globals: {
            captureScope() {
              capturedScopes.push(interpreter.getScope());
            },
          },
          modules: {
            enabled: true,
            resolver: {
              resolve(specifier) {
                const code = files.get(specifier);
                if (!code) {
                  return null;
                }
                return { type: "source", code, path: specifier };
              },
            },
          },
        });

        await interpreter.evaluateModuleAsync(
          `
            import { value, setValue } from "counter.js";

            captureScope();
            setValue(2);
            captureScope();
          `,
          { path: "main.js" },
        );

        expect(capturedScopes).toHaveLength(2);
        expect(capturedScopes[0]?.value).toBe(1);
        expect(capturedScopes[1]?.value).toBe(2);
      });
    });
  });
});
