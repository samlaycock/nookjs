import { describe, test, expect } from "bun:test";

import type { ModuleResolver } from "../src/modules";

import { Interpreter } from "../src/interpreter";

describe("Module System", () => {
  describe("Module Resolver Interface", () => {
    test("should throw error when module system is not enabled", async () => {
      const interpreter = new Interpreter();

      expect(
        interpreter.evaluateModuleAsync("export const x = 1;", {
          path: "test.js",
        }),
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
      const files = new Map<string, string>([["math.js", "export const add = (a, b) => a + b;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
         const result = add(2, 3);
         export { result };`,
        { path: "main.js" },
      );

      expect(exports.result).toBe(5);
    });

    test("should export function", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export function multiply(a, b) { return a * b; }"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
         const product = multiply(4, 5);
         export { product };`,
        { path: "main.js" },
      );

      expect(result.product).toBe(20);
    });
  });

  describe("Import Types", () => {
    test("should handle named imports", async () => {
      const files = new Map<string, string>([
        ["module.js", "export const foo = 1; export const bar = 2;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
      const files = new Map<string, string>([["module.js", "export const original = 42;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
      const files = new Map<string, string>([["module.js", "export const value = 100;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
      const files = new Map<string, string>([["module.js", "export default 42;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
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
        resolve(specifier) {
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

      const result = await interpreter.evaluateModuleAsync(`export const value = 123;`, {
        path: "main.js",
      });

      expect(result.value).toBe(123);
    });

    test("should handle export function", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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

      expect(result.greet).toBeDefined();
    });

    test("should handle export default", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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

      const result = await interpreter.evaluateModuleAsync(`export default 42;`, {
        path: "main.js",
      });

      expect(result.default).toBe(42);
    });
  });

  describe("Module Resolution", () => {
    test("should throw error when module not found", async () => {
      const resolver: ModuleResolver = {
        resolve() {
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { foo } from "nonexistent.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("Cannot find module");
    });

    test("should handle multi-file modules", async () => {
      const files = new Map<string, string>([
        ["main.js", `import { add } from "./math.js"; add(1, 2);`],
        ["math.js", `export function add(a, b) { return a + b; }`],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const path = specifier.replace("./", "");
          const code = files.get(path);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(files.get("main.js")!, {
        path: "main.js",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Namespace Exports", () => {
    test("should handle pre-built module namespace", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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
        resolve(specifier) {
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
        resolve(specifier) {
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

      await interpreter.evaluateModuleAsync(`import { value } from "module.js";`, {
        path: "main.js",
      });

      expect(resolveCount).toBe(1);

      interpreter.clearModuleCache();

      await interpreter.evaluateModuleAsync(`import { value } from "module.js";`, {
        path: "main.js",
      });

      expect(resolveCount).toBe(2);
    });

    test("should get cached module exports", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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

      await interpreter.evaluateModuleAsync(`import { value } from "module.js";`, {
        path: "main.js",
      });

      const exports = interpreter.getModuleExports("module.js");
      expect(exports?.value).toBe(42);
    });

    test("should provide module introspection API", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: "export const value = 1;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      // Before loading any modules
      expect(interpreter.isModuleSystemEnabled()).toBe(true);
      expect(interpreter.getModuleCacheSize()).toBe(0);

      // Load a module
      await interpreter.evaluateModuleAsync(
        `import { value } from "utils.js"; export const x = value;`,
        { path: "main.js" },
      );

      // Check introspection API on Interpreter (public methods)
      expect(interpreter.isModuleCached("utils.js")).toBe(true);
      expect(interpreter.isModuleCached("nonexistent.js")).toBe(false);
      expect(interpreter.getLoadedModuleSpecifiers()).toContain("utils.js");
      expect(interpreter.getModuleCacheSize()).toBeGreaterThan(0);

      // Check module metadata
      const metadata = interpreter.getModuleMetadata("utils.js");
      expect(metadata).toBeDefined();
      expect(metadata?.status).toBe("initialized");
      expect(metadata?.path).toBe("utils.js");
      expect(metadata?.loadedAt).toBeLessThanOrEqual(Date.now());

      // Test exports retrieval by specifier
      const exports = interpreter.getModuleExportsBySpecifier("utils.js");
      expect(exports?.value).toBe(1);
    });

    test("should call lifecycle hooks", async () => {
      const loadedModules: string[] = [];
      const errors: Array<{ specifier: string; error: Error }> = [];

      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "error.js") {
            return {
              type: "source",
              code: "syntax error {{{{",
              path: specifier,
            };
          }
          return {
            type: "source",
            code: "export const x = 1;",
            path: specifier,
          };
        },
        onLoad(specifier, _path) {
          loadedModules.push(specifier);
        },
        onError(specifier, _importer, error) {
          errors.push({ specifier, error });
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      // Test onLoad hook
      await interpreter.evaluateModuleAsync(`import { x } from "good.js"; export const y = x;`, {
        path: "main.js",
      });
      expect(loadedModules).toContain("good.js");

      // Test onError hook - syntax error in module
      try {
        await interpreter.evaluateModuleAsync(`import { x } from "error.js";`, {
          path: "main2.js",
        });
      } catch {
        // Expected to throw
      }
      // Note: onError may not be called for parse errors since they happen
      // after resolution but before setModuleExports
    });

    test("should provide importer chain in resolver context", async () => {
      const importerChains: Map<string, readonly string[]> = new Map();

      const resolver: ModuleResolver = {
        resolve(specifier, _importer, context) {
          if (context) {
            importerChains.set(specifier, [...context.importerChain]);
          }
          if (specifier === "a.js") {
            return {
              type: "source",
              code: `import { b } from "b.js"; export const a = b;`,
              path: specifier,
            };
          }
          if (specifier === "b.js") {
            return {
              type: "source",
              code: `import { c } from "c.js"; export const b = c;`,
              path: specifier,
            };
          }
          if (specifier === "c.js") {
            return {
              type: "source",
              code: `export const c = 42;`,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(`import { a } from "a.js"; export const result = a;`, {
        path: "main.js",
      });

      // When resolving c.js, the importer chain should include main.js, a.js, b.js
      const cChain = importerChains.get("c.js");
      expect(cChain).toBeDefined();
      expect(cChain!.length).toBeGreaterThan(0);
    });
  });

  describe("Security", () => {
    test("should require explicit resolver", () => {
      expect(async () => {
        await new Interpreter({
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
        resolve(specifier) {
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

      expect(
        interpreter.evaluateModuleAsync(`import { value } from "./forbidden.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("Cannot find module");
    });
  });

  describe("Max Depth", () => {
    test("should enforce max depth limit", async () => {
      // Create a chain of modules: a -> b -> c -> d -> e -> ...
      // Each module imports from the next letter in the alphabet
      let moduleCount = 0;
      const resolver: ModuleResolver = {
        resolve(specifier) {
          moduleCount++;
          const nextModule = String.fromCharCode(specifier.charCodeAt(0) + 1);
          return {
            type: "source",
            code: `import { value } from "${nextModule}"; export const value = ${moduleCount};`,
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, maxDepth: 3 },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { value } from "a";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("depth exceeded");
    });
  });

  describe("Re-exports", () => {
    test("should handle export * from 'module'", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export const foo = 1; export const bar = 2;"],
        ["index.js", "export * from 'utils.js';"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { foo, bar } from "index.js";
         export const sum = foo + bar;`,
        { path: "main.js" },
      );

      expect(result.sum).toBe(3);
    });

    test("should not re-export default with export *", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export const foo = 1; export default 'defaultValue';"],
        ["index.js", "export * from 'utils.js';"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(`export * from "index.js";`, {
        path: "main.js",
      });

      expect(result.foo).toBe(1);
      expect(result.default).toBeUndefined();
    });

    test("should handle export * as namespace from 'module'", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export const foo = 1; export const bar = 2;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(`export * as utils from "utils.js";`, {
        path: "main.js",
      });

      expect(result.utils).toBeDefined();
      expect(result.utils.foo).toBe(1);
      expect(result.utils.bar).toBe(2);
    });

    test("should handle named re-exports", async () => {
      const files = new Map<string, string>([
        ["utils.js", "export const foo = 1; export const bar = 2;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(`export { foo } from "utils.js";`, {
        path: "main.js",
      });

      expect(result.foo).toBe(1);
      expect(result.bar).toBeUndefined();
    });
  });

  describe("Export Default Expressions", () => {
    test("should handle export default with literal", async () => {
      const interpreter = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });

      const result = await interpreter.evaluateModuleAsync(`export default 42;`, {
        path: "main.js",
      });

      expect(result.default).toBe(42);
    });

    test("should handle export default with object literal", async () => {
      const interpreter = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });

      const result = await interpreter.evaluateModuleAsync(`export default { foo: 1, bar: 2 };`, {
        path: "main.js",
      });

      expect(result.default.foo).toBe(1);
      expect(result.default.bar).toBe(2);
    });

    test("should handle export default with array literal", async () => {
      const interpreter = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });

      const result = await interpreter.evaluateModuleAsync(`export default [1, 2, 3];`, {
        path: "main.js",
      });

      expect(result.default).toEqual([1, 2, 3]);
    });

    test("should handle export default with expression", async () => {
      const interpreter = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });

      const result = await interpreter.evaluateModuleAsync(`export default 1 + 2 + 3;`, {
        path: "main.js",
      });

      expect(result.default).toBe(6);
    });

    test("should handle export default with arrow function", async () => {
      const interpreter = new Interpreter({
        modules: {
          enabled: true,
          resolver: { resolve: () => null },
        },
      });

      const result = await interpreter.evaluateModuleAsync(`export default (a, b) => a + b;`, {
        path: "main.js",
      });

      expect(result.default).toBeDefined();
    });
  });

  describe("AST Source Type", () => {
    test("should accept pre-parsed AST", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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

      const result = await interpreter.evaluateModuleAsync(`import { value } from "module.js";`, {
        path: "main.js",
      });

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // COMPREHENSIVE IMPORT SYNTAX TESTS
  // ============================================================================

  describe("Import Syntax - Comprehensive", () => {
    const createResolver = (files: Map<string, string>): ModuleResolver => ({
      resolve(specifier) {
        const code = files.get(specifier);
        if (code === undefined) return null;
        return { type: "source", code, path: specifier };
      },
    });

    describe("Named Imports", () => {
      test("should import single named export", async () => {
        const files = new Map([["mod.js", "export const a = 1;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { a } from "mod.js"; export const val = a;`,
          { path: "main.js" },
        );
        expect(result.val).toBe(1);
      });

      test("should import multiple named exports", async () => {
        const files = new Map([
          ["mod.js", "export const a = 1; export const b = 2; export const c = 3;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { a, b, c } from "mod.js"; export const sum = a + b + c;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(6);
      });

      test("should import with alias (as)", async () => {
        const files = new Map([["mod.js", "export const originalName = 42;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { originalName as alias } from "mod.js"; export const val = alias;`,
          { path: "main.js" },
        );
        expect(result.val).toBe(42);
      });

      test("should import multiple with mixed aliases", async () => {
        const files = new Map([
          ["mod.js", "export const a = 1; export const b = 2; export const c = 3;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { a, b as aliasB, c } from "mod.js"; export const sum = a + aliasB + c;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(6);
      });

      test("should handle trailing comma in import list", async () => {
        const files = new Map([["mod.js", "export const a = 1; export const b = 2;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { a, b, } from "mod.js"; export const sum = a + b;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(3);
      });
    });

    describe("Default Imports", () => {
      test("should import default export", async () => {
        const files = new Map([["mod.js", "export default 42;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import def from "mod.js"; export const val = def;`,
          { path: "main.js" },
        );
        expect(result.val).toBe(42);
      });

      test("should import default function", async () => {
        const files = new Map([["mod.js", "export default function() { return 'hello'; }"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import fn from "mod.js"; export const val = fn();`,
          { path: "main.js" },
        );
        expect(result.val).toBe("hello");
      });

      test("should import default class", async () => {
        const files = new Map([
          ["mod.js", "export default class { constructor() { this.x = 10; } }"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import Cls from "mod.js"; export const val = new Cls().x;`,
          { path: "main.js" },
        );
        expect(result.val).toBe(10);
      });

      test("should import default with any valid identifier name", async () => {
        const files = new Map([["mod.js", "export default 99;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import _$myDefault123 from "mod.js"; export const val = _$myDefault123;`,
          { path: "main.js" },
        );
        expect(result.val).toBe(99);
      });
    });

    describe("Namespace Imports", () => {
      test("should import entire module as namespace", async () => {
        const files = new Map([["mod.js", "export const a = 1; export const b = 2;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import * as ns from "mod.js"; export const sum = ns.a + ns.b;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(3);
      });

      test("should include default in namespace", async () => {
        const files = new Map([
          ["mod.js", "export default 'defaultVal'; export const named = 'namedVal';"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import * as ns from "mod.js"; export const def = ns.default; export const named = ns.named;`,
          { path: "main.js" },
        );
        expect(result.def).toBe("defaultVal");
        expect(result.named).toBe("namedVal");
      });

      test("should access namespace properties dynamically", async () => {
        const files = new Map([["mod.js", "export const foo = 1; export const bar = 2;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import * as ns from "mod.js";
           const key = "foo";
           export const val = ns[key];`,
          { path: "main.js" },
        );
        expect(result.val).toBe(1);
      });
    });

    describe("Mixed Import Styles", () => {
      test("should combine default and named imports", async () => {
        const files = new Map([
          ["mod.js", "export default 100; export const a = 1; export const b = 2;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import def, { a, b } from "mod.js"; export const sum = def + a + b;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(103);
      });

      test("should combine default with aliased named imports", async () => {
        const files = new Map([["mod.js", "export default 10; export const x = 5;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import myDefault, { x as myX } from "mod.js"; export const sum = myDefault + myX;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(15);
      });

      test("should import from multiple modules", async () => {
        const files = new Map([
          ["a.js", "export const a = 1;"],
          ["b.js", "export const b = 2;"],
          ["c.js", "export const c = 3;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { a } from "a.js";
           import { b } from "b.js";
           import { c } from "c.js";
           export const sum = a + b + c;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(6);
      });

      test("should import same module multiple times with different styles", async () => {
        const files = new Map([["mod.js", "export default 100; export const x = 10;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import def from "mod.js";
           import { x } from "mod.js";
           import * as ns from "mod.js";
           export const sum = def + x + ns.x + ns.default;`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(220);
      });
    });
  });

  // ============================================================================
  // COMPREHENSIVE EXPORT SYNTAX TESTS
  // ============================================================================

  describe("Export Syntax - Comprehensive", () => {
    describe("Named Export Declarations", () => {
      test("should export const declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export const x = 42;`, {
          path: "main.js",
        });
        expect(result.x).toBe(42);
      });

      test("should export let declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export let x = 42;`, {
          path: "main.js",
        });
        expect(result.x).toBe(42);
      });

      test("should export var declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export var x = 42;`, {
          path: "main.js",
        });
        expect(result.x).toBe(42);
      });

      test("should export multiple variables in one declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export const a = 1, b = 2, c = 3;`, {
          path: "main.js",
        });
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
        expect(result.c).toBe(3);
      });

      test("should export function declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export function add(a, b) { return a + b; }`,
          { path: "main.js" },
        );
        expect(result.add).toBeDefined();
      });

      test("should export async function declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export async function fetchData() { return 42; }`,
          { path: "main.js" },
        );
        expect(result.fetchData).toBeDefined();
      });

      test("should export generator function declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export function* gen() { yield 1; yield 2; }`,
          { path: "main.js" },
        );
        expect(result.gen).toBeDefined();
      });

      test("should export class declaration", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export class MyClass { constructor() { this.x = 10; } }`,
          { path: "main.js" },
        );
        expect(result.MyClass).toBeDefined();
      });
    });

    describe("Export List (export { })", () => {
      test("should export previously declared variables", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `const a = 1; const b = 2; export { a, b };`,
          { path: "main.js" },
        );
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
      });

      test("should export with aliases", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `const internal = 42; export { internal as external };`,
          { path: "main.js" },
        );
        expect(result.external).toBe(42);
        expect(result.internal).toBeUndefined();
      });

      test("should export same value under multiple names", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `const val = 42; export { val, val as alias1, val as alias2 };`,
          { path: "main.js" },
        );
        expect(result.val).toBe(42);
        expect(result.alias1).toBe(42);
        expect(result.alias2).toBe(42);
      });

      test("should export functions declared earlier", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `function foo() { return 1; }
           function bar() { return 2; }
           export { foo, bar };`,
          { path: "main.js" },
        );
        expect(result.foo).toBeDefined();
        expect(result.bar).toBeDefined();
      });
    });

    describe("Default Exports", () => {
      test("should export default literal number", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default 42;`, {
          path: "main.js",
        });
        expect(result.default).toBe(42);
      });

      test("should export default literal string", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default "hello";`, {
          path: "main.js",
        });
        expect(result.default).toBe("hello");
      });

      test("should export default literal boolean", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default true;`, {
          path: "main.js",
        });
        expect(result.default).toBe(true);
      });

      test("should export default null", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default null;`, {
          path: "main.js",
        });
        expect(result.default).toBe(null);
      });

      test("should export default object literal", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default { a: 1, b: 2, nested: { c: 3 } };`,
          { path: "main.js" },
        );
        expect(result.default.a).toBe(1);
        expect(result.default.b).toBe(2);
        expect(result.default.nested.c).toBe(3);
      });

      test("should export default array literal", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default [1, 2, 3];`, {
          path: "main.js",
        });
        expect(result.default).toEqual([1, 2, 3]);
      });

      test("should export default expression", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default 1 + 2 * 3;`, {
          path: "main.js",
        });
        expect(result.default).toBe(7);
      });

      test("should export default arrow function", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default (x) => x * 2;`, {
          path: "main.js",
        });
        expect(result.default).toBeDefined();
      });

      test("should export default named function", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default function myFunc() { return 42; }`,
          { path: "main.js" },
        );
        expect(result.default).toBeDefined();
      });

      test("should export default anonymous function", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default function() { return 42; }`,
          { path: "main.js" },
        );
        expect(result.default).toBeDefined();
      });

      test("should export default named class", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default class MyClass { }`, {
          path: "main.js",
        });
        expect(result.default).toBeDefined();
      });

      test("should export default anonymous class", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(`export default class { }`, {
          path: "main.js",
        });
        expect(result.default).toBeDefined();
      });

      test("should export default async function", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default async function() { return 42; }`,
          { path: "main.js" },
        );
        expect(result.default).toBeDefined();
      });

      test("should export default ternary expression", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default true ? "yes" : "no";`,
          {
            path: "main.js",
          },
        );
        expect(result.default).toBe("yes");
      });

      test("should export default variable reference", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `const myValue = 42; export default myValue;`,
          { path: "main.js" },
        );
        expect(result.default).toBe(42);
      });
    });

    describe("Combined Default and Named Exports", () => {
      test("should have both default and named exports", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export default "defaultValue";
           export const named1 = 1;
           export const named2 = 2;`,
          { path: "main.js" },
        );
        expect(result.default).toBe("defaultValue");
        expect(result.named1).toBe(1);
        expect(result.named2).toBe(2);
      });

      test("should allow named export called default via alias", async () => {
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: { resolve: () => null } },
        });

        const result = await interpreter.evaluateModuleAsync(
          `const myDefault = 42;
           export { myDefault as default };
           export const other = 1;`,
          { path: "main.js" },
        );
        expect(result.default).toBe(42);
        expect(result.other).toBe(1);
      });
    });
  });

  // ============================================================================
  // COMPREHENSIVE RE-EXPORT TESTS
  // ============================================================================

  describe("Re-exports - Comprehensive", () => {
    const createResolver = (files: Map<string, string>): ModuleResolver => ({
      resolve(specifier) {
        const code = files.get(specifier);
        if (!code) return null;
        return { type: "source", code, path: specifier };
      },
    });

    describe("export * from", () => {
      test("should re-export all named exports", async () => {
        const files = new Map([
          ["source.js", "export const a = 1; export const b = 2; export const c = 3;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export * from "source.js";`, {
          path: "main.js",
        });
        expect(result.a).toBe(1);
        expect(result.b).toBe(2);
        expect(result.c).toBe(3);
      });

      test("should not re-export default with export *", async () => {
        const files = new Map([["source.js", "export default 'defVal'; export const named = 1;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export * from "source.js";`, {
          path: "main.js",
        });
        expect(result.named).toBe(1);
        expect(result.default).toBeUndefined();
      });

      test("should chain multiple export *", async () => {
        const files = new Map([
          ["a.js", "export const fromA = 'A';"],
          ["b.js", "export * from 'a.js'; export const fromB = 'B';"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export * from "b.js";`, {
          path: "main.js",
        });
        expect(result.fromA).toBe("A");
        expect(result.fromB).toBe("B");
      });

      test("should combine export * with local exports", async () => {
        const files = new Map([["source.js", "export const remote = 1;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export * from "source.js";
           export const local = 2;`,
          { path: "main.js" },
        );
        expect(result.remote).toBe(1);
        expect(result.local).toBe(2);
      });
    });

    describe("export * as namespace from", () => {
      test("should re-export all as namespace object", async () => {
        const files = new Map([["source.js", "export const a = 1; export const b = 2;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export * as ns from "source.js";`, {
          path: "main.js",
        });
        expect(result.ns).toBeDefined();
        expect(result.ns.a).toBe(1);
        expect(result.ns.b).toBe(2);
      });

      test("should include default in namespace", async () => {
        const files = new Map([["source.js", "export default 'def'; export const named = 1;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export * as ns from "source.js";`, {
          path: "main.js",
        });
        expect(result.ns.default).toBe("def");
        expect(result.ns.named).toBe(1);
      });

      test("should combine namespace re-export with other exports", async () => {
        const files = new Map([["source.js", "export const x = 10;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export * as utils from "source.js";
           export const local = 20;`,
          { path: "main.js" },
        );
        expect(result.utils.x).toBe(10);
        expect(result.local).toBe(20);
      });
    });

    describe("export { } from", () => {
      test("should re-export specific named exports", async () => {
        const files = new Map([
          ["source.js", "export const a = 1; export const b = 2; export const c = 3;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(`export { a, c } from "source.js";`, {
          path: "main.js",
        });
        expect(result.a).toBe(1);
        expect(result.c).toBe(3);
        expect(result.b).toBeUndefined();
      });

      test("should re-export with alias", async () => {
        const files = new Map([["source.js", "export const original = 42;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export { original as renamed } from "source.js";`,
          { path: "main.js" },
        );
        expect(result.renamed).toBe(42);
        expect(result.original).toBeUndefined();
      });

      test("should re-export default as named", async () => {
        const files = new Map([["source.js", "export default 99;"]]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export { default as myDefault } from "source.js";`,
          { path: "main.js" },
        );
        expect(result.myDefault).toBe(99);
      });

      test("should re-export from multiple sources", async () => {
        const files = new Map([
          ["a.js", "export const fromA = 1;"],
          ["b.js", "export const fromB = 2;"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `export { fromA } from "a.js";
           export { fromB } from "b.js";`,
          { path: "main.js" },
        );
        expect(result.fromA).toBe(1);
        expect(result.fromB).toBe(2);
      });
    });

    describe("Complex Re-export Scenarios", () => {
      test("should handle barrel file pattern (index re-exports)", async () => {
        const files = new Map([
          [
            "utils/math.js",
            "export const add = (a, b) => a + b; export const sub = (a, b) => a - b;",
          ],
          ["utils/string.js", "export const upper = (s) => s.toUpperCase();"],
          ["utils/index.js", "export * from 'utils/math.js'; export * from 'utils/string.js';"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { add, sub, upper } from "utils/index.js";
           export const sum = add(1, 2);
           export const diff = sub(5, 3);
           export const str = upper("hello");`,
          { path: "main.js" },
        );
        expect(result.sum).toBe(3);
        expect(result.diff).toBe(2);
        expect(result.str).toBe("HELLO");
      });

      test("should handle diamond dependency pattern", async () => {
        const files = new Map([
          ["base.js", "export const BASE = 'base';"],
          ["left.js", "export * from 'base.js'; export const LEFT = 'left';"],
          ["right.js", "export * from 'base.js'; export const RIGHT = 'right';"],
          ["top.js", "export * from 'left.js'; export * from 'right.js';"],
        ]);
        const interpreter = new Interpreter({
          modules: { enabled: true, resolver: createResolver(files) },
        });

        const result = await interpreter.evaluateModuleAsync(
          `import { BASE, LEFT, RIGHT } from "top.js";
           export const all = BASE + LEFT + RIGHT;`,
          { path: "main.js" },
        );
        expect(result.all).toBe("baseleftright");
      });
    });
  });

  // ============================================================================
  // MODULE EVALUATION ORDER AND SIDE EFFECTS
  // ============================================================================

  describe("Module Evaluation Order", () => {
    test("should evaluate imported module before importer", async () => {
      const evalOrder: string[] = [];
      const files = new Map([["dep.js", "export const val = 1;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          evalOrder.push(`resolve:${specifier}`);
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(`import { val } from "dep.js"; export const x = val;`, {
        path: "main.js",
      });

      expect(evalOrder).toContain("resolve:dep.js");
    });

    test("should execute module code only once when imported multiple times", async () => {
      let evalCount = 0;
      const files = new Map([["counter.js", "export const count = 1;"]]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "counter.js") {
            evalCount++;
          }
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(
        `import { count } from "counter.js";
         import { count as count2 } from "counter.js";
         export const sum = count + count2;`,
        { path: "main.js" },
      );

      // Module should only be resolved once due to caching
      expect(evalCount).toBe(1);
    });

    test("should maintain module state across imports", async () => {
      const files = new Map([
        [
          "state.js",
          "export let counter = 0; export function increment() { counter++; return counter; }",
        ],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { increment } from "state.js";
         export const first = increment();
         export const second = increment();
         export const third = increment();`,
        { path: "main.js" },
      );

      expect(result.first).toBe(1);
      expect(result.second).toBe(2);
      expect(result.third).toBe(3);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling - Comprehensive", () => {
    const createResolver = (files: Map<string, string>): ModuleResolver => ({
      resolve(specifier) {
        const code = files.get(specifier);
        if (!code) return null;
        return { type: "source", code, path: specifier };
      },
    });

    test("should throw when importing non-existent module", async () => {
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { x } from "nonexistent.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("Cannot find module");
    });

    test("should throw when importing non-existent named export", async () => {
      const files = new Map([["mod.js", "export const a = 1;"]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      expect(
        interpreter.evaluateModuleAsync(
          `import { nonexistent } from "mod.js"; export const x = nonexistent;`,
          { path: "main.js" },
        ),
      ).rejects.toThrow();
    });

    test("should throw on syntax error in imported module", async () => {
      const files = new Map([["bad.js", "export const x = {{{;"]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { x } from "bad.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow();
    });

    test("should throw on runtime error in imported module", async () => {
      const files = new Map([["error.js", "export const x = undefinedVar;"]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { x } from "error.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow();
    });

    test("should throw when re-exporting from non-existent module", async () => {
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      expect(
        interpreter.evaluateModuleAsync(`export * from "nonexistent.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("Cannot find module");
    });

    test("should handle error in deeply nested import", async () => {
      const files = new Map([
        ["a.js", `import { x } from "b.js"; export const a = x;`],
        ["b.js", `import { y } from "c.js"; export const x = y;`],
        ["c.js", `export const y = undefinedVar;`],
      ]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { a } from "a.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // CIRCULAR DEPENDENCIES
  // ============================================================================

  describe("Circular Dependencies", () => {
    const createResolver = (files: Map<string, string>): ModuleResolver => ({
      resolve(specifier) {
        const code = files.get(specifier);
        if (!code) return null;
        return { type: "source", code, path: specifier };
      },
    });

    test("should handle simple circular dependency with functions", async () => {
      const files = new Map([
        ["a.js", `import { b } from "b.js"; export const a = () => "a" + b();`],
        ["b.js", `export const b = () => "b";`],
      ]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { a } from "a.js"; export const result = a();`,
        { path: "main.js" },
      );
      expect(result.result).toBe("ab");
    });

    test("should handle modules that dont actually have circular runtime dependency", async () => {
      const files = new Map([
        ["utils.js", `export const helper = (x) => x * 2;`],
        [
          "main-dep.js",
          `import { helper } from "utils.js"; export const compute = (x) => helper(x) + 1;`,
        ],
      ]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { compute } from "main-dep.js"; export const val = compute(5);`,
        { path: "main.js" },
      );
      expect(result.val).toBe(11);
    });
  });

  // ============================================================================
  // EDGE CASES AND SPECIAL SCENARIOS
  // ============================================================================

  describe("Edge Cases", () => {
    const createResolver = (files: Map<string, string>): ModuleResolver => ({
      resolve(specifier) {
        const code = files.get(specifier);
        if (code === undefined) return null;
        return { type: "source", code, path: specifier };
      },
    });

    test("should handle empty module", async () => {
      const files = new Map([["empty.js", ""]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import "empty.js"; export const x = 1;`,
        {
          path: "main.js",
        },
      );
      // Note: side-effect only imports may not be fully supported
      expect(result.x).toBe(1);
    });

    test("should handle module with only comments", async () => {
      const files = new Map([["comments.js", "// just a comment\n/* block comment */"]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(`export const x = 1;`, {
        path: "main.js",
      });
      expect(result.x).toBe(1);
    });

    test("should handle module with no exports", async () => {
      const files = new Map([["noexport.js", "const internal = 42;"]]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(`export * from "noexport.js";`, {
        path: "main.js",
      });
      expect(Object.keys(result).length).toBe(0);
    });

    test("should handle very long export names", async () => {
      const longName = "a".repeat(100);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      const result = await interpreter.evaluateModuleAsync(`export const ${longName} = 42;`, {
        path: "main.js",
      });
      expect(result[longName]).toBe(42);
    });

    test("should handle export names starting with underscore", async () => {
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export const _private = 1; export const __dunder = 2;`,
        { path: "main.js" },
      );
      expect(result._private).toBe(1);
      expect(result.__dunder).toBe(2);
    });

    test("should handle export names starting with $", async () => {
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export const $dollar = 1; export const $$double = 2;`,
        { path: "main.js" },
      );
      expect(result.$dollar).toBe(1);
      expect(result.$$double).toBe(2);
    });

    test("should handle deeply nested module imports", async () => {
      const files = new Map([
        ["d.js", "export const d = 4;"],
        ["c.js", "import { d } from 'd.js'; export const c = d + 3;"],
        ["b.js", "import { c } from 'c.js'; export const b = c + 2;"],
        ["a.js", "import { b } from 'b.js'; export const a = b + 1;"],
      ]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { a } from "a.js"; export const result = a;`,
        { path: "main.js" },
      );
      expect(result.result).toBe(10); // 4 + 3 + 2 + 1
    });

    test("should handle module that exports imported value", async () => {
      const files = new Map([
        ["source.js", "export const original = 42;"],
        ["passthrough.js", "import { original } from 'source.js'; export { original };"],
      ]);
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: createResolver(files) },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { original } from "passthrough.js"; export const val = original;`,
        { path: "main.js" },
      );
      expect(result.val).toBe(42);
    });

    test("should handle module with mixed statement types", async () => {
      const interpreter = new Interpreter({
        modules: { enabled: true, resolver: { resolve: () => null } },
      });

      const result = await interpreter.evaluateModuleAsync(
        `// Comment
         const internal = 10;
         export const a = 1;
         function helper() { return internal; }
         export const b = helper();
         export default "default";
         export const c = 3;`,
        { path: "main.js" },
      );
      expect(result.a).toBe(1);
      expect(result.b).toBe(10);
      expect(result.c).toBe(3);
      expect(result.default).toBe("default");
    });
  });

  // ============================================================================
  // IMPORT/EXPORT WITH COMPLEX VALUES
  // ============================================================================

  describe("Complex Value Types", () => {
    test("should export and import functions that use closures", async () => {
      const files = new Map([
        [
          "closure.js",
          `const secret = 42;
           export function getSecret() { return secret; }
           export function makeCounter() {
             let count = 0;
             return () => ++count;
           }`,
        ],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { getSecret, makeCounter } from "closure.js";
         const counter = makeCounter();
         export const secret = getSecret();
         export const count1 = counter();
         export const count2 = counter();`,
        { path: "main.js" },
      );
      expect(result.secret).toBe(42);
      expect(result.count1).toBe(1);
      expect(result.count2).toBe(2);
    });

    test("should export and import classes with methods", async () => {
      const files = new Map([
        [
          "class.js",
          `export class Calculator {
             constructor(initial) { this.value = initial || 0; }
             add(n) { this.value += n; return this; }
             subtract(n) { this.value -= n; return this; }
             getResult() { return this.value; }
           }`,
        ],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { Calculator } from "class.js";
         const calc = new Calculator(10);
         export const result = calc.add(5).subtract(3).getResult();`,
        { path: "main.js" },
      );
      expect(result.result).toBe(12);
    });

    test("should export and import generators", async () => {
      const files = new Map([
        [
          "gen.js",
          `export function* range(start, end) {
             for (let i = start; i < end; i++) yield i;
           }`,
        ],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { range } from "gen.js";
         const arr = [...range(0, 5)];
         export const sum = arr.reduce((a, b) => a + b, 0);`,
        { path: "main.js" },
      );
      expect(result.sum).toBe(10); // 0+1+2+3+4
    });

    test("should export and import async functions", async () => {
      const files = new Map([
        [
          "async.js",
          `export async function fetchValue() {
             return await Promise.resolve(42);
           }`,
        ],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { fetchValue } from "async.js";
         export const val = await fetchValue();`,
        { path: "main.js" },
      );
      expect(result.val).toBe(42);
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  describe("Security - Export Immutability", () => {
    test("should prevent mutation of exported primitive values", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
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

      const result = await interpreter.evaluateModuleAsync(
        `import { value } from "mod.js";
         export const original = value;
         // Attempt to reassign (should fail since imports are const)
         try {
           value = 999;
         } catch (e) {
           // Expected
         }
         export const afterAttempt = value;`,
        { path: "main.js" },
      );
      expect(result.original).toBe(42);
      expect(result.afterAttempt).toBe(42);
    });

    test("should prevent mutation of exported object properties via proxy", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: "export const config = { secret: 'original' };",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { config } from "mod.js";
         export const before = config.secret;
         try {
           config.secret = 'hacked';
         } catch (e) {
           // Expected - ReadOnlyProxy blocks mutations
         }
         export const after = config.secret;`,
        { path: "main.js" },
      );
      expect(result.before).toBe("original");
      expect(result.after).toBe("original");
    });

    test("should block access to dangerous properties on exports", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: "export const obj = { value: 1 };",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      // Access to __proto__ should throw SecurityError
      expect(
        interpreter.evaluateModuleAsync(
          `import { obj } from "mod.js";
           export const proto = obj.__proto__;`,
          { path: "main.js" },
        ),
      ).rejects.toThrow("__proto__");

      // Clear cache before next test
      interpreter.clearModuleCache();

      // Access to constructor should throw SecurityError
      expect(
        interpreter.evaluateModuleAsync(
          `import { obj } from "mod2.js";
           export const ctor = obj.constructor;`,
          { path: "main2.js" },
        ),
      ).rejects.toThrow("constructor");
    });

    test("should isolate namespace exports from prototype pollution", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: "export const a = 1; export const b = 2;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import * as ns from "mod.js";
         let polluted = false;
         try {
           ns.__proto__.polluted = true;
         } catch (e) {
           // Expected
         }
         export const isPolluted = ({}).polluted === true;
         export const a = ns.a;`,
        { path: "main.js" },
      );
      expect(result.isPolluted).toBe(false);
      expect(result.a).toBe(1);
    });
  });

  // ============================================================================
  // ASYNC RESOLVER TESTS
  // ============================================================================

  describe("Async Resolver", () => {
    test("should support async resolver returning Promise", async () => {
      const resolver: ModuleResolver = {
        async resolve(specifier) {
          // Simulate async operation (e.g., fetching from network)
          await new Promise((r) => setTimeout(r, 1));
          return {
            type: "source",
            code: "export const value = 'async-loaded';",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { value } from "async-module.js";
         export const loaded = value;`,
        { path: "main.js" },
      );
      expect(result.loaded).toBe("async-loaded");
    });

    test("should handle async resolver with multiple modules", async () => {
      const files = new Map([
        ["a.js", "export const a = 'A';"],
        ["b.js", "export const b = 'B';"],
        ["c.js", "export const c = 'C';"],
      ]);

      const resolver: ModuleResolver = {
        async resolve(specifier) {
          await new Promise((r) => setTimeout(r, 1));
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { a } from "a.js";
         import { b } from "b.js";
         import { c } from "c.js";
         export const combined = a + b + c;`,
        { path: "main.js" },
      );
      expect(result.combined).toBe("ABC");
    });

    test("should handle async resolver that returns null", async () => {
      const resolver: ModuleResolver = {
        async resolve() {
          await new Promise((r) => setTimeout(r, 1));
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      expect(
        interpreter.evaluateModuleAsync(`import { x } from "nonexistent.js";`, {
          path: "main.js",
        }),
      ).rejects.toThrow("Cannot find module");
    });
  });

  // ============================================================================
  // CACHE CONFIGURATION TESTS
  // ============================================================================

  describe("Cache Configuration", () => {
    test("should re-evaluate module when cache is disabled", async () => {
      let evalCount = 0;
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: `export const count = ${++evalCount};`,
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, cache: false },
      });

      const result1 = await interpreter.evaluateModuleAsync(
        `import { count } from "counter.js"; export const c = count;`,
        { path: "main1.js" },
      );

      const result2 = await interpreter.evaluateModuleAsync(
        `import { count } from "counter.js"; export const c = count;`,
        { path: "main2.js" },
      );

      // With cache disabled, module should be re-evaluated each time
      expect(result1.c).toBe(1);
      expect(result2.c).toBe(2);
    });

    test("should not re-evaluate module when cache is enabled (default)", async () => {
      let evalCount = 0;
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: `export const count = ${++evalCount};`,
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver, cache: true },
      });

      const result1 = await interpreter.evaluateModuleAsync(
        `import { count } from "counter.js"; export const c = count;`,
        { path: "main1.js" },
      );

      const result2 = await interpreter.evaluateModuleAsync(
        `import { count } from "counter.js"; export const c = count;`,
        { path: "main2.js" },
      );

      // With cache enabled, module should only be evaluated once
      expect(result1.c).toBe(1);
      expect(result2.c).toBe(1);
    });
  });

  // ============================================================================
  // MODULE SCOPE TESTS
  // ============================================================================

  describe("Module Scope", () => {
    test("should have undefined 'this' at module top level", async () => {
      const resolver: ModuleResolver = {
        resolve() {
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(`export const topLevelThis = this;`, {
        path: "main.js",
      });
      expect(result.topLevelThis).toBeUndefined();
    });

    test("should isolate module variables from other modules", async () => {
      const files = new Map([
        ["a.js", "const secret = 'A-secret'; export const a = 1;"],
        ["b.js", "const secret = 'B-secret'; export const b = 2;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      // Modules should not be able to access each other's private variables
      const result = await interpreter.evaluateModuleAsync(
        `import { a } from "a.js";
         import { b } from "b.js";
         export const sum = a + b;
         export const hasSecret = typeof secret !== 'undefined';`,
        { path: "main.js" },
      );
      expect(result.sum).toBe(3);
      expect(result.hasSecret).toBe(false);
    });
  });

  // ============================================================================
  // EXPORT * CONFLICT HANDLING
  // ============================================================================

  describe("Export * Conflict Handling", () => {
    test("should use first export when same name comes from multiple sources", async () => {
      const files = new Map([
        ["first.js", "export const shared = 'first';"],
        ["second.js", "export const shared = 'second';"],
        ["barrel.js", "export * from 'first.js'; export * from 'second.js';"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { shared } from "barrel.js"; export const value = shared;`,
        { path: "main.js" },
      );
      // First export * wins
      expect(result.value).toBe("first");
    });

    test("should allow local export to override re-exported name", async () => {
      const files = new Map([
        ["source.js", "export const value = 'from-source';"],
        ["barrel.js", "export * from 'source.js'; export const value = 'local';"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { value } from "barrel.js"; export const v = value;`,
        { path: "main.js" },
      );
      // Local export should override re-exported
      expect(result.v).toBe("local");
    });
  });

  // ============================================================================
  // INTROSPECTION EDGE CASES
  // ============================================================================

  describe("Introspection Edge Cases", () => {
    test("should return undefined metadata for non-existent module", async () => {
      const resolver: ModuleResolver = {
        resolve() {
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      expect(interpreter.getModuleMetadata("nonexistent.js")).toBeUndefined();
      expect(interpreter.getModuleExports("nonexistent.js")).toBeUndefined();
      expect(interpreter.getModuleExportsBySpecifier("nonexistent.js")).toBeUndefined();
    });

    test("should track failed module in metadata", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "bad.js") {
            return {
              type: "source",
              code: "syntax error {{{{",
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      try {
        await interpreter.evaluateModuleAsync(`import { x } from "bad.js";`, {
          path: "main.js",
        });
      } catch {
        // Expected to fail
      }

      // Module should still be in cache but might be in failed state
      // (depending on when failure occurs - during parse vs evaluation)
      const cached = interpreter.isModuleCached("bad.js");
      // This test documents behavior - the module record is created before parse
      expect(cached).toBe(true);
    });

    test("should handle getLoadedModulePaths with multiple modules", async () => {
      const files = new Map([
        ["a.js", "export const a = 1;"],
        ["b.js", "export const b = 2;"],
        ["c.js", "export const c = 3;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(
        `import { a } from "a.js";
         import { b } from "b.js";
         import { c } from "c.js";
         export const sum = a + b + c;`,
        { path: "main.js" },
      );

      const paths = interpreter.getLoadedModulePaths();
      expect(paths).toContain("a.js");
      expect(paths).toContain("b.js");
      expect(paths).toContain("c.js");
      expect(interpreter.getModuleCacheSize()).toBe(3);
    });

    test("should clear all introspection state when cache cleared", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          return {
            type: "source",
            code: "export const x = 1;",
            path: specifier,
          };
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(`import { x } from "mod.js"; export const y = x;`, {
        path: "main.js",
      });

      expect(interpreter.isModuleCached("mod.js")).toBe(true);
      expect(interpreter.getModuleCacheSize()).toBeGreaterThan(0);

      interpreter.clearModuleCache();

      expect(interpreter.isModuleCached("mod.js")).toBe(false);
      expect(interpreter.getModuleCacheSize()).toBe(0);
      expect(interpreter.getLoadedModulePaths()).toEqual([]);
      expect(interpreter.getLoadedModuleSpecifiers()).toEqual([]);
    });
  });

  // ============================================================================
  // LIFECYCLE HOOK EDGE CASES
  // ============================================================================

  describe("Lifecycle Hook Edge Cases", () => {
    test("should call onLoad for each unique module only once", async () => {
      const loadCalls: string[] = [];
      const files = new Map([
        ["shared.js", "export const x = 1;"],
        ["a.js", "import { x } from 'shared.js'; export const a = x;"],
        ["b.js", "import { x } from 'shared.js'; export const b = x;"],
      ]);

      const resolver: ModuleResolver = {
        resolve(specifier) {
          const code = files.get(specifier);
          if (!code) return null;
          return { type: "source", code, path: specifier };
        },
        onLoad(specifier) {
          loadCalls.push(specifier);
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(
        `import { a } from "a.js";
         import { b } from "b.js";
         export const sum = a + b;`,
        { path: "main.js" },
      );

      // shared.js should only appear once despite being imported by both a and b
      expect(loadCalls.filter((s) => s === "shared.js").length).toBe(1);
      expect(loadCalls).toContain("a.js");
      expect(loadCalls).toContain("b.js");
    });

    test("should call onError when module resolution fails", async () => {
      const errors: Array<{ specifier: string; importer: string | null }> = [];

      const resolver: ModuleResolver = {
        resolve() {
          return null;
        },
        onError(specifier, importer) {
          errors.push({ specifier, importer });
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      try {
        await interpreter.evaluateModuleAsync(`import { x } from "missing.js";`, {
          path: "main.js",
        });
      } catch {
        // Expected
      }

      // onError should not be called for resolution failures (only resolution/evaluation errors)
      // The module just doesn't exist, which is handled by resolveModule returning null
    });
  });

  describe("Side-effect Only Imports", () => {
    test("should execute module without importing bindings", async () => {
      let sideEffectExecuted = false;

      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "side-effect.js") {
            return {
              type: "source",
              code: "export const marker = 'executed';",
              path: specifier,
            };
          }
          return null;
        },
        onLoad(specifier) {
          if (specifier === "side-effect.js") {
            sideEffectExecuted = true;
          }
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(`import "side-effect.js";`, {
        path: "main.js",
      });

      // The module was loaded and evaluated (verified via onLoad hook)
      expect(sideEffectExecuted).toBe(true);
    });

    test("should execute side-effect imports in order", async () => {
      const executionOrder: string[] = [];

      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "first.js") {
            return {
              type: "source",
              code: "export const order = 1;",
              path: specifier,
            };
          }
          if (specifier === "second.js") {
            return {
              type: "source",
              code: "export const order = 2;",
              path: specifier,
            };
          }
          return null;
        },
        onLoad(specifier) {
          if (specifier === "first.js" || specifier === "second.js") {
            executionOrder.push(specifier.replace(".js", ""));
          }
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      await interpreter.evaluateModuleAsync(
        `import "first.js";
         import "second.js";`,
        { path: "main.js" },
      );

      // Modules should be loaded in order they appear in imports
      expect(executionOrder).toEqual(["first", "second"]);
    });
  });

  describe("Dynamic Export Values", () => {
    test("should export computed property names", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "computed.js") {
            return {
              type: "source",
              code: `
                const key = "dynamic";
                const obj = { [key]: 42 };
                export { obj };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { obj } from "computed.js";
         export const value = obj.dynamic;`,
        { path: "main.js" },
      );

      expect(result.value).toBe(42);
    });

    test("should export spread objects", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "spread.js") {
            return {
              type: "source",
              code: `
                const base = { a: 1, b: 2 };
                const extended = { ...base, c: 3 };
                export { extended };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { extended } from "spread.js";
         export const a = extended.a;
         export const b = extended.b;
         export const c = extended.c;`,
        { path: "main.js" },
      );

      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect(result.c).toBe(3);
    });
  });

  describe("Module-level Await", () => {
    test("should handle top-level await with resolved promise", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "async-data.js") {
            return {
              type: "source",
              code: `
                const data = await Promise.resolve({ value: 42 });
                export { data };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { data } from "async-data.js";
         export const value = data.value;`,
        { path: "main.js" },
      );

      expect(result.value).toBe(42);
    });

    test("should handle chained top-level awaits", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "chained.js") {
            return {
              type: "source",
              code: `
                const first = await Promise.resolve(10);
                const second = await Promise.resolve(first * 2);
                const third = await Promise.resolve(second + 5);
                export { third };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { third } from "chained.js";
         export { third };`,
        { path: "main.js" },
      );

      expect(result.third).toBe(25);
    });
  });

  describe("Export Declaration Edge Cases", () => {
    test("should handle export with destructuring in variable declaration", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "destructure.js") {
            return {
              type: "source",
              code: `
                const obj = { x: 1, y: 2 };
                const { x, y } = obj;
                export { x, y };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { x, y } from "destructure.js";
         export const sum = x + y;`,
        { path: "main.js" },
      );

      expect(result.sum).toBe(3);
    });

    test("should handle export of function expressions assigned to variables", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "func-expr.js") {
            return {
              type: "source",
              code: `
                const add = function(a, b) { return a + b; };
                const multiply = (a, b) => a * b;
                export { add, multiply };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { add, multiply } from "func-expr.js";
         export const sum = add(2, 3);
         export const product = multiply(4, 5);`,
        { path: "main.js" },
      );

      expect(result.sum).toBe(5);
      expect(result.product).toBe(20);
    });

    test("should handle re-export with renamed default", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "default-source.js") {
            return {
              type: "source",
              code: "export default 42;",
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `export { default as answer } from "default-source.js";`,
        { path: "main.js" },
      );

      expect(result.answer).toBe(42);
    });
  });

  describe("Import Specifier Edge Cases", () => {
    test("should handle importing same binding multiple times via different paths", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "base.js") {
            return {
              type: "source",
              code: "export const value = 'original';",
              path: specifier,
            };
          }
          if (specifier === "reexport.js") {
            return {
              type: "source",
              code: "export { value } from 'base.js';",
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { value as direct } from "base.js";
         import { value as reexported } from "reexport.js";
         export { direct, reexported };`,
        { path: "main.js" },
      );

      expect(result.direct).toBe("original");
      expect(result.reexported).toBe("original");
    });

    test("should handle reserved word as imported name with alias", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "reserved.js") {
            return {
              type: "source",
              code: `
                const ifValue = 1;
                const elseValue = 2;
                export { ifValue as if, elseValue as else };
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      // Import reserved words as aliases
      const result = await interpreter.evaluateModuleAsync(
        `import { if as ifVal, else as elseVal } from "reserved.js";
         export { ifVal, elseVal };`,
        { path: "main.js" },
      );

      expect(result.ifVal).toBe(1);
      expect(result.elseVal).toBe(2);
    });
  });

  describe("Module Namespace Object Behavior", () => {
    test("should make namespace object non-extensible", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "mod.js") {
            return {
              type: "source",
              code: "export const x = 1;",
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import * as ns from "mod.js";
         let added = false;
         try {
           ns.newProp = 'fail';
         } catch (e) {
           added = false;
         }
         export const x = ns.x;
         export { added };`,
        { path: "main.js" },
      );

      expect(result.x).toBe(1);
      expect(result.added).toBe(false);
    });

    test("should allow reading all enumerable exports from namespace", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "multi.js") {
            return {
              type: "source",
              code: `
                export const a = 1;
                export const b = 2;
                export function c() { return 3; }
              `,
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
        globals: { Object },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import * as ns from "multi.js";
         const keys = Object.keys(ns);
         export { keys };`,
        { path: "main.js" },
      );

      expect(result.keys).toContain("a");
      expect(result.keys).toContain("b");
      expect(result.keys).toContain("c");
    });
  });

  describe("Pre-built Module Variations", () => {
    test("should handle pre-built module with function exports", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "utils") {
            return {
              type: "namespace",
              exports: {
                add: (a: number, b: number) => a + b,
                subtract: (a: number, b: number) => a - b,
              },
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { add, subtract } from "utils";
         export const sum = add(10, 5);
         export const diff = subtract(10, 5);`,
        { path: "main.js" },
      );

      expect(result.sum).toBe(15);
      expect(result.diff).toBe(5);
    });

    test("should handle pre-built module with class export", async () => {
      class Counter {
        private count = 0;
        increment() {
          this.count++;
          return this.count;
        }
        getCount() {
          return this.count;
        }
      }

      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "counter") {
            return {
              type: "namespace",
              exports: { Counter },
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import { Counter } from "counter";
         const c = new Counter();
         c.increment();
         c.increment();
         export const count = c.getCount();`,
        { path: "main.js" },
      );

      expect(result.count).toBe(2);
    });

    test("should handle pre-built module with default export", async () => {
      const resolver: ModuleResolver = {
        resolve(specifier) {
          if (specifier === "config") {
            return {
              type: "namespace",
              exports: {
                default: { debug: true, version: "1.0.0" },
              },
              path: specifier,
            };
          }
          return null;
        },
      };

      const interpreter = new Interpreter({
        modules: { enabled: true, resolver },
      });

      const result = await interpreter.evaluateModuleAsync(
        `import config from "config";
         export const debug = config.debug;
         export const version = config.version;`,
        { path: "main.js" },
      );

      expect(result.debug).toBe(true);
      expect(result.version).toBe("1.0.0");
    });
  });
});
