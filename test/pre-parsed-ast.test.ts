import { describe, test, expect } from "bun:test";

import type { ESTree } from "../src/ast";

import { Interpreter } from "../src/interpreter";

declare const setTimeout: (
  handler: (value: unknown) => void,
  ms: number,
) => ReturnType<typeof setTimeout>;
declare const AbortController: typeof globalThis.AbortController;

describe("Pre-parsed AST Support", () => {
  describe("parse() method", () => {
    test("returns valid ESTree.Program", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("const x = 1 + 2;");

      expect(ast).toBeDefined();
      expect(ast.type).toBe("Program");
      expect(ast.sourceType).toBe("module");
      expect(Array.isArray(ast.body)).toBe(true);
    });

    test("parses simple expressions", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("2 + 2");

      expect(ast.body.length).toBe(1);
      expect(ast.body[0]?.type).toBe("ExpressionStatement");
    });

    test("parses complex code with functions", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(5)
      `);

      expect(ast.body.length).toBe(2);
      expect(ast.body[0]?.type).toBe("FunctionDeclaration");
      expect(ast.body[1]?.type).toBe("ExpressionStatement");
    });

    test("throws ParseError on invalid syntax", () => {
      const interpreter = new Interpreter();
      expect(() => interpreter.parse("let x =")).toThrow();
    });

    test("accepts and applies validator option", () => {
      const interpreter = new Interpreter();
      const noLoopsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      const ast = interpreter.parse("let x = 5; x + 3", {
        validator: noLoopsValidator,
      });

      expect(ast).toBeDefined();
    });

    test("throws when validator rejects", () => {
      const interpreter = new Interpreter();
      const rejectAllValidator = () => false;

      expect(() => interpreter.parse("let x = 5", { validator: rejectAllValidator })).toThrow(
        "AST validation failed",
      );
    });
  });

  describe("evaluate() with pre-parsed AST", () => {
    test("accepts AST as first argument", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("2 + 2");

      const result = interpreter.evaluate(ast);
      expect(result).toBe(4);
    });

    test("skips parsing when AST is provided", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(5)
      `);

      const result = interpreter.evaluate(ast);
      expect(result).toBe(120);
    });

    test("still applies per-call validator if provided", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("let x = 5; while (false) { x = 10; }");

      const noLoopsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      expect(() => interpreter.evaluate(ast, { validator: noLoopsValidator })).toThrow(
        "AST validation failed",
      );
    });

    test("maintains existing behavior for string input", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("2 + 2")).toBe(4);
      expect(interpreter.evaluate("let x = 10; x * 2")).toBe(20);
    });

    test("works with multiple evaluations of same AST", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("const x = 42; x * 2");

      const result1 = interpreter.evaluate(ast);
      const result2 = interpreter.evaluate(ast);
      const result3 = interpreter.evaluate(ast);

      expect(result1).toBe(84);
      expect(result2).toBe(84);
      expect(result3).toBe(84);
    });

    test("works with mixed string and AST inputs", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("10 + 5");

      expect(interpreter.evaluate("2 + 2")).toBe(4);
      expect(interpreter.evaluate(ast)).toBe(15);
      expect(interpreter.evaluate("3 * 3")).toBe(9);
    });

    test("applies constructor validator to pre-parsed AST", () => {
      const noLoopsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      const interpreter = new Interpreter({ validator: noLoopsValidator });
      const ast = interpreter.parse("let x = 5; x + 3");

      expect(interpreter.evaluate(ast)).toBe(8);

      const astWithLoop = interpreter.parse("let i = 0; while (false) { i = 1; }");
      expect(() => interpreter.evaluate(astWithLoop)).toThrow("AST validation failed");
    });

    test("per-call validator overrides constructor validator", () => {
      const rejectAllConstructor = () => false;
      const allowAllPerCall = () => true;

      const interpreter = new Interpreter({ validator: rejectAllConstructor });
      const ast = interpreter.parse("2 + 2");

      expect(interpreter.evaluate(ast, { validator: allowAllPerCall })).toBe(4);
    });
  });

  describe("evaluateAsync() with pre-parsed AST", () => {
    test("accepts AST as first argument", async () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("2 + 2");

      const result = await interpreter.evaluateAsync(ast);
      expect(result).toBe(4);
    });

    test("works with async/await code in AST", async () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        async function foo() {
          return 42;
        }
        foo()
      `);

      const result = await interpreter.evaluateAsync(ast);
      expect(result).toBe(42);
    });

    test("skips parsing when AST is provided", async () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        const add = async (a, b) => {
          return a + b;
        };
        add(10, 20)
      `);

      const result = await interpreter.evaluateAsync(ast);
      expect(result).toBe(30);
    });

    test("still applies per-call validator if provided", async () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("let x = 5; while (false) { x = 10; }");

      const noLoopsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      await expect(interpreter.evaluateAsync(ast, { validator: noLoopsValidator })).rejects.toThrow(
        "AST validation failed",
      );
    });

    test("maintains existing behavior for string input", async () => {
      const interpreter = new Interpreter();
      expect(await interpreter.evaluateAsync("2 + 2")).toBe(4);
      expect(await interpreter.evaluateAsync("let x = 10; x * 2")).toBe(20);
    });

    test("works with AbortSignal", async () => {
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const controller = new AbortController();
      const interpreter = new Interpreter({ globals: { delay } });

      const ast = interpreter.parse(`
        let count = 0;
        while (true) {
          count = count + 1;
          await delay(1);
        }
      `);

      setTimeout(() => controller.abort(), 25);

      await expect(interpreter.evaluateAsync(ast, { signal: controller.signal })).rejects.toThrow(
        "Execution aborted",
      );
    });
  });

  describe("edge cases", () => {
    test("handles AST from parse with validation in evaluate without validation", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("2 + 2", { validator: () => true });

      expect(interpreter.evaluate(ast)).toBe(4);
    });

    test("validator failing on pre-parsed AST still throws", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("2 + 2");

      const failValidator = () => false;
      expect(() => interpreter.evaluate(ast, { validator: failValidator })).toThrow(
        "AST validation failed",
      );
    });

    test("empty AST body evaluates correctly", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse("");

      const result = interpreter.evaluate(ast);
      expect(result).toBe(undefined);
    });

    test("complex nested AST evaluates correctly", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        const arr = [1, 2, 3, 4, 5];
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          sum += arr[i];
        }
        sum
      `);

      const result = interpreter.evaluate(ast);
      expect(result).toBe(15);
    });
  });

  describe("performance optimization", () => {
    test("parse once, evaluate multiple times", () => {
      const interpreter = new Interpreter();
      const ast = interpreter.parse(`
        function fib(n) {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }
        fib(10)
      `);

      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        const result = interpreter.evaluate(ast);
        expect(result).toBe(55);
      }
    });
  });
});
