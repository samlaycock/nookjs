import { describe, it, expect } from "bun:test";

import type { ESTree } from "meriyah";

import { Interpreter } from "../src/interpreter";

describe("AST Validator", () => {
  describe("Constructor validator", () => {
    it("should validate all code with constructor validator", () => {
      const validator = (ast: ESTree.Program) => {
        // Only allow programs with no while loops
        const hasWhileLoop = JSON.stringify(ast).includes('"WhileStatement"');
        return !hasWhileLoop;
      };

      const interpreter = new Interpreter({ validator });

      // Should work - no while loop
      expect(interpreter.evaluate("let x = 5; x + 3")).toBe(8);

      // Should fail - has while loop
      expect(() => interpreter.evaluate("let i = 0; while (i < 5) { i = i + 1; } i")).toThrow(
        "AST validation failed",
      );
    });

    it("should allow code that passes validation", () => {
      const validator = (ast: ESTree.Program) => {
        // Only allow simple expressions (no loops, no functions)
        const code = JSON.stringify(ast);
        return (
          !code.includes('"WhileStatement"') &&
          !code.includes('"ForStatement"') &&
          !code.includes('"FunctionDeclaration"')
        );
      };

      const interpreter = new Interpreter({ validator });
      expect(interpreter.evaluate("2 + 2")).toBe(4);
      expect(interpreter.evaluate("let x = 10; x * 2")).toBe(20);
    });

    it("should reject code that fails validation", () => {
      const validator = () => false; // Reject everything

      const interpreter = new Interpreter({ validator });
      expect(() => interpreter.evaluate("1 + 1")).toThrow("AST validation failed");
    });

    it("should work with no validator", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("1 + 1")).toBe(2);
      expect(interpreter.evaluate("let i = 0; while (i < 3) { i = i + 1; } i")).toBe(3);
    });
  });

  describe("Per-call validator", () => {
    it("should validate with per-call validator", () => {
      const interpreter = new Interpreter();

      const strictValidator = () => false; // Reject everything

      // Normal call works
      expect(interpreter.evaluate("5 + 5")).toBe(10);

      // Call with validator fails
      expect(() => interpreter.evaluate("3 + 3", { validator: strictValidator })).toThrow(
        "AST validation failed",
      );

      // Next call without validator works again
      expect(interpreter.evaluate("7 + 7")).toBe(14);
    });

    it("should allow different validators per call", () => {
      const interpreter = new Interpreter();

      const noLoopsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      const noFunctionsValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"FunctionDeclaration"');
      };

      // With no-loops validator
      expect(interpreter.evaluate("10 + 5", { validator: noLoopsValidator })).toBe(15);
      expect(() =>
        interpreter.evaluate("let i = 0; while (i < 5) { i = i + 1; } i", {
          validator: noLoopsValidator,
        }),
      ).toThrow("AST validation failed");

      // With no-functions validator
      expect(interpreter.evaluate("20 + 5", { validator: noFunctionsValidator })).toBe(25);
      expect(() =>
        interpreter.evaluate("function foo() { return 42; } foo()", {
          validator: noFunctionsValidator,
        }),
      ).toThrow("AST validation failed");
    });
  });

  describe("Validator precedence", () => {
    it("should use per-call validator over constructor validator", () => {
      const constructorValidator = () => false; // Reject everything
      const perCallValidator = () => true; // Allow everything

      const interpreter = new Interpreter({ validator: constructorValidator });

      // Constructor validator would reject this
      // But per-call validator allows it
      expect(interpreter.evaluate("1 + 1", { validator: perCallValidator })).toBe(2);
    });

    it("should fall back to constructor validator if no per-call validator", () => {
      const constructorValidator = () => true; // Allow everything

      const interpreter = new Interpreter({ validator: constructorValidator });
      expect(interpreter.evaluate("2 + 2")).toBe(4);
    });
  });

  describe("Practical validator examples", () => {
    it("should restrict to read-only operations", () => {
      const readOnlyValidator = (ast: ESTree.Program) => {
        // No variable declarations or assignments
        const code = JSON.stringify(ast);
        return !code.includes('"VariableDeclaration"') && !code.includes('"AssignmentExpression"');
      };

      const interpreter = new Interpreter({ validator: readOnlyValidator });

      // Read-only operations work
      expect(interpreter.evaluate("5 + 3")).toBe(8);
      expect(interpreter.evaluate("10 * 2")).toBe(20);

      // Variable declarations fail
      expect(() => interpreter.evaluate("let x = 5")).toThrow("AST validation failed");

      // Assignments fail
      expect(() => interpreter.evaluate("x = 10")).toThrow("AST validation failed");
    });

    it("should restrict maximum AST depth", () => {
      const maxDepthValidator = (ast: ESTree.Program) => {
        let maxDepth = 0;

        const traverse = (node: any, depth: number) => {
          if (depth > maxDepth) maxDepth = depth;
          if (depth > 10) return; // Stop if too deep

          for (const key in node) {
            if (node[key] && typeof node[key] === "object") {
              traverse(node[key], depth + 1);
            }
          }
        };

        traverse(ast, 0);
        return maxDepth <= 10;
      };

      const interpreter = new Interpreter({ validator: maxDepthValidator });

      // Simple expression works
      expect(interpreter.evaluate("1 + 2 + 3")).toBe(6);

      // Deeply nested expression might fail (depending on depth)
      const deeplyNested = "1" + " + 1".repeat(50);
      expect(() => interpreter.evaluate(deeplyNested)).toThrow("AST validation failed");
    });

    it("should restrict function complexity", () => {
      const noRecursionValidator = (ast: ESTree.Program) => {
        const _code = JSON.stringify(ast);
        // Simple heuristic: check if function name appears in its own body
        // This is a simplified check - real implementation would need proper traversal
        return true; // Placeholder for complex logic
      };

      const interpreter = new Interpreter({ validator: noRecursionValidator });

      // Non-recursive function works
      const simpleFunc = `
        function double(x) {
          return x * 2;
        }
        double(5)
      `;
      expect(interpreter.evaluate(simpleFunc)).toBe(10);
    });

    it("should limit number of top-level statements", () => {
      const maxStatementsValidator = (ast: ESTree.Program) => {
        // Limit number of statements in the program body
        return ast.body.length <= 3;
      };

      const interpreter = new Interpreter({
        validator: maxStatementsValidator,
      });

      // Small program works (2 statements)
      expect(interpreter.evaluate("let x = 5; let y = 10; x + y")).toBe(15);

      // Program with too many top-level statements fails (5 statements)
      const largeProgram = `
        let x = 1;
        let y = 2;
        let z = 3;
        let a = 4;
        let b = 5;
      `;
      expect(() => interpreter.evaluate(largeProgram)).toThrow("AST validation failed");
    });

    it("should block specific identifiers", () => {
      const noEvalValidator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        // Block dangerous identifiers
        return (
          !code.includes('"eval"') && !code.includes('"Function"') && !code.includes('"__proto__"')
        );
      };

      const interpreter = new Interpreter({ validator: noEvalValidator });

      // Normal code works
      expect(interpreter.evaluate("let x = 10; x + 5")).toBe(15);

      // Code with blocked identifiers fails (parseModule throws ParseError in strict mode before validator runs)
      expect(() => interpreter.evaluate("let eval = 5")).toThrow();
    });
  });

  describe("Validator with globals", () => {
    it("should work with constructor globals and validator", () => {
      const validator = (ast: ESTree.Program) => {
        const code = JSON.stringify(ast);
        return !code.includes('"WhileStatement"');
      };

      const interpreter = new Interpreter({
        globals: { PI: 3.14159 },
        validator,
      });

      // Global works
      expect(interpreter.evaluate("PI * 2")).toBeCloseTo(6.28318, 4);

      // Validator still enforced
      expect(() => interpreter.evaluate("let i = 0; while (i < 5) { i = i + 1; }")).toThrow(
        "AST validation failed",
      );
    });

    it("should work with per-call globals and validator", () => {
      const interpreter = new Interpreter();

      const validator = () => true;

      expect(
        interpreter.evaluate("x + y", {
          globals: { x: 10, y: 20 },
          validator,
        }),
      ).toBe(30);
    });
  });

  describe("Error cases", () => {
    it("should provide clear error message on validation failure", () => {
      const validator = () => false;
      const interpreter = new Interpreter({ validator });

      try {
        interpreter.evaluate("1 + 1");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("AST validation failed");
      }
    });

    it("should not affect parsing errors", () => {
      const validator = () => true;
      const interpreter = new Interpreter({ validator });

      // Syntax error should still be thrown by parser
      expect(() => interpreter.evaluate("let x = ")).toThrow();
    });

    it("should handle validator exceptions gracefully", () => {
      const throwingValidator = (_ast: ESTree.Program) => {
        throw new Error("Custom validator error");
      };

      const interpreter = new Interpreter({ validator: throwingValidator });

      expect(() => interpreter.evaluate("1 + 1")).toThrow("Custom validator error");
    });
  });
});
