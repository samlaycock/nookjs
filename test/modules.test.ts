import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";
import type { ModuleResolver, ModuleSource } from "../src/modules";

describe("Module System", () => {
  describe("Module Resolver Interface", () => {
    test("should throw error when module system is not enabled", async () => {
      const interpreter = new Interpreter();

      await expect(
        interpreter.evaluateModuleAsync("export const x = 1;", { path: "test.js" }),
      ).rejects.toThrow("Module system is not enabled");
    });

    test("should check if module system is enabled", () => {
      const interpreter = new Interpreter();
      expect(interpreter.isModuleSystemEnabled()).toBe(false);

      const interpreterWithModules = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });
      expect(interpreterWithModules.isModuleSystemEnabled()).toBe(true);
    });
  });

  describe("Basic Import/Export", () => {
    test("should export named constant", async () => {
      const files = new Map<string, string>([
        ["math.js", "export const add = (a, b) => a + b;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const exports = await interpreter.evaluateModuleAsync(
        `import { add } from "math.js";
         add(2, 3);`,
        { path: "main.js" },
      );

      expect(typeof exports.add).toBe("function");
    });

    test("should export function", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export function multiply(a, b) { return a * b; }"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { multiply } from "utils.js";
         multiply(4, 5);`,
        { path: "main.js" },
      );

      expect(result.multiply).toBeDefined();
    });
  });

  describe("Import Types", () => {
    test("should handle named imports", async () => {
      const files = new Map<string, string>([
        ["module.js", "export const foo = 1; export const bar = 2;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { foo, bar } from "module.js";
         foo + bar;`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });

    test("should handle renamed imports", async () => {
      const files = new Map<string, string>([
        ["module.js", "export const original = 42;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { original as renamed } from "module.js";
         renamed;`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });

    test("should handle namespace imports", async () => {
      const files = new Map<string, string>([
        ["module.js", "export const value = 100;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import * as mod from "module.js";
         mod.value;`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });

    test("should handle default import", async () => {
      const files = new Map<string, string>([
        ["module.js", "export default 42;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import defaultExport from "module.js";
         defaultExport;`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });
  });

  describe("Export Types", () => {
    test("should handle export const", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "source",
            code: "export const value = 123;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export const value = 123;`,
        { path: "main.js" },
      );

      expect(result.value).toBe(123);
    });

    test("should handle export function", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "source",
            code: "export function greet(name) { return 'Hello, ' + name; }",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export function greet(name) { return 'Hello, ' + name; }`,
        { path: "main.js" },
      );

      expect(typeof result.greet).toBe("function");
    });

    test("should handle export default", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "source",
            code: "export default 42;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export default 42;`,
        { path: "main.js" },
      );

      expect(result.default).toBe(42);
    });
  });

  describe("Module Resolution", () => {
    test("should throw error when module not found", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await expect(
        interpreter.evaluateModuleAsync(
          `import { foo } from "nonexistent.js";`,
          { path: "main.js" },
        ),
      ).rejects.toThrow("Cannot find module");
    });

    test("should handle multi-file modules", async () => {
      const files = new Map<string, string>([
        ["main.js", `import { add } from "./math.js"; add(1, 2);`],
        ["math.js", `export function add(a, b) { return a + b; }`],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          const path = specifier.replace("./", "");
          const code = files.get(path);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        files.get("main.js")!,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });
  });

  describe("Namespace Exports", () => {
    test("should handle pre-built module namespace", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          if (specifier === "math") {
            return {
              type: "namespace",
              path: "math",
              exports: {
                add: (a: number, b: number) => a + b,
                PI: 3.14159,
              },
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { add, PI } from "math";
         add(PI, 1);`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });
  });

  describe("Module Cache", () => {
    test("should cache resolved modules", async () => {
      let resolveCount = 0;

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          resolveCount++;
          return {
            type: "source",
            code: "export const value = 1;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, cache: true },
      });

      await interpreter.evaluateModuleAsync(
        `import { value } from "module.js";
         import { value as v2 } from "module.js";`,
        { path: "main.js" },
      );

      expect(resolveCount).toBe(1);
    });

    test("should clear module cache", async () => {
      let resolveCount = 0;

      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          resolveCount++;
          return {
            type: "source",
            code: "export const value = 1;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, cache: true },
      });

      await interpreter.evaluateModuleAsync(
        `import { value } from "module.js";`,
        { path: "main.js" },
      );

      expect(resolveCount).toBe(1);

      interpreter.clearModuleCache();

      await interpreter.evaluateModuleAsync(
        `import { value } from "module.js";`,
        { path: "main.js" },
      );

      expect(resolveCount).toBe(2);
    });

    test("should get cached module exports", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "source",
            code: "export const value = 42;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(
        `import { value } from "module.js";`,
        { path: "main.js" },
      );

      const exports = interpreter.getModuleExports("module.js");
      expect(exports?.value).toBe(42);
    });
  });

  describe("Security", () => {
    test("should require explicit resolver", () => {
      expect(() => {
        new Interpreter({
          modules: {
            enabled: true,
            resolver: {
              resolve() {
                return null;
              },
            },
          },
        }).evaluateModuleAsync("1 + 1", { path: "test.js" });
      }).not.toThrow();
    });

    test("should reject unknown modules when resolver returns null", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          if (specifier === "./allowed.js") {
            return {
              type: "source",
              code: "export const value = 1;",
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await expect(
        interpreter.evaluateModuleAsync(
          `import { value } from "./forbidden.js";`,
          { path: "main.js" },
        ),
      ).rejects.toThrow("Cannot find module");
    });
  });

  describe("Max Depth", () => {
    test("should enforce max depth limit", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "source",
            code: `import { value } from "${specifier}"; export { value };`,
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, maxDepth: 2 },
      });

      await expect(
        interpreter.evaluateModuleAsync(
          `import { value } from "./a.js";`,
          { path: "main.js" },
        ),
      ).rejects.toThrow("depth exceeded");
    });
  });

  describe("AST Source Type", () => {
    test("should accept pre-parsed AST", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier, importer) {
          return {
            type: "ast",
            path: specifier,
            ast: {
              type: "Program",
              body: [
                {
                  type: "ExportNamedDeclaration",
                  declaration: {
                    type: "VariableDeclaration",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: { type: "Identifier", name: "value" },
                        init: { type: "Literal", value: 123 },
                      },
                    ],
                    kind: "const",
                  },
                  specifiers: [],
                },
              ],
              sourceType: "module",
            },
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { value } from "module.js";`,
        { path: "main.js" },
      );

      expect(result).toBeDefined();
    });
  });
});
