import { describe, it, expect } from "bun:test";

import { createSandbox, parse, run } from "../src/sandbox";

describe("Simplified API", () => {
  it("run() should evaluate code", async () => {
    const value = await run("1 + 2");
    expect(value).toBe(3);
  });

  it("createSandbox() should reuse globals and env", async () => {
    const sandbox = createSandbox({ env: "es2022", globals: { answer: 40 } });

    const value = await sandbox.run("answer + 2");
    expect(value).toBe(42);
  });

  it("runSync() should return structured result when requested", () => {
    const sandbox = createSandbox({ env: "es2022" });

    const result = sandbox.runSync("3 * 4", { result: "full" });

    expect(result.value).toBe(12);
    expect(result.stats.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("run() should return resource stats when tracking is enabled", async () => {
    const sandbox = createSandbox({ env: "es2022", trackResources: true });

    const result = await sandbox.run("1 + 2", { result: "full" });

    expect(result.value).toBe(3);
    expect(result.resources?.evaluations).toBeGreaterThanOrEqual(1);
  });

  it("parse() should return an AST", () => {
    const ast = parse("const x = 1 + 2;");

    expect(ast.type).toBe("Program");
    expect(ast.body[0]?.type).toBe("VariableDeclaration");
  });

  it("parse() should respect validators", () => {
    expect(() => parse("const x = 1", { validator: () => false })).toThrow(
      "AST validation failed",
    );
  });

  it("parse() should respect sandbox validators", () => {
    expect(() =>
      parse("const x = 1", {
        sandbox: { env: "es2022", validator: () => false },
      }),
    ).toThrow("AST validation failed");
  });

  it("sandbox.parse() should use sandbox validators by default", () => {
    const sandbox = createSandbox({
      env: "es2022",
      validator: () => false,
    });

    expect(() => sandbox.parse("const x = 1")).toThrow("AST validation failed");
  });

  it("runModule() should return structured result when requested", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        files: {
          "math.js": "export const add = (a, b) => a + b;",
        },
      },
    });

    const result = await sandbox.runModule(
      'import { add } from "math.js"; export const value = add(2, 3);',
      { path: "main.js", result: "full" },
    );

    expect(result.value.value).toBe(5);
    expect(result.stats.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("runModule() should resolve modules from files", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        files: {
          "math.js": "export const add = (a, b) => a + b;",
        },
      },
    });

    const exports = await sandbox.runModule(
      'import { add } from "math.js"; export const result = add(1, 2);',
      { path: "main.js" },
    );

    expect(exports.result).toBe(3);
  });

  it("runModule() should resolve modules from AST", async () => {
    const moduleAst = parse("export const value = 21;");
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        ast: {
          "value.js": moduleAst,
        },
      },
    });

    const exports = await sandbox.runModule(
      'import { value } from "value.js"; export const result = value * 2;',
      { path: "main.js" },
    );

    expect(exports.result).toBe(42);
  });

  it("runModule() should resolve modules from externals", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        externals: {
          math: {
            add: (a: number, b: number) => a + b,
          },
        },
      },
    });

    const exports = await sandbox.runModule(
      'import { add } from "math"; export const result = add(4, 5);',
      { path: "main.js" },
    );

    expect(exports.result).toBe(9);
  });

  it("runModule() should use custom resolver", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        resolver: {
          resolve(specifier) {
            if (specifier === "answer") {
              return {
                type: "source",
                code: "export const value = 42;",
                path: specifier,
              };
            }
            return null;
          },
        },
      },
    });

    const exports = await sandbox.runModule(
      'import { value } from "answer"; export const result = value;',
      { path: "main.js" },
    );

    expect(exports.result).toBe(42);
  });

  it("runModule() should respect cache settings", async () => {
    const files: Record<string, string> = {
      "value.js": "export const value = 1;",
    };
    const sandbox = createSandbox({
      env: "es2022",
      modules: {
        files,
        cache: false,
      },
    });

    const first = await sandbox.runModule(
      'import { value } from "value.js"; export const result = value;',
      { path: "main.js" },
    );
    files["value.js"] = "export const value = 2;";
    const second = await sandbox.runModule(
      'import { value } from "value.js"; export const result = value;',
      { path: "main.js" },
    );

    expect(first.result).toBe(1);
    expect(second.result).toBe(2);
  });

  it("runModule() should use per-run globals", async () => {
    const sandbox = createSandbox({ env: "es2022", modules: {} });

    const exports = await sandbox.runModule(
      "export const value = answer + 1;",
      {
        path: "main.js",
        globals: { answer: 41 },
      },
    );

    expect(exports.value).toBe(42);

    expect(
      sandbox.runModule("export const value = answer;", { path: "second.js" }),
    ).rejects.toThrow("Undefined variable 'answer'");
  });

  it("runModule() should enforce per-run limits", async () => {
    const sandbox = createSandbox({ env: "es2022", modules: {} });

    expect(
      sandbox.runModule(
        `
        let total = 0;
        for (let i = 0; i < 10; i++) {
          total += i;
        }
        export const value = total;
        `,
        { path: "main.js", limits: { loops: 1 } },
      ),
    ).rejects.toThrow("Maximum loop iterations exceeded");
  });

  it("run() should reject top-level await in scripts", async () => {
    const sandbox = createSandbox({ env: "es2022" });

    expect(sandbox.run("await Promise.resolve(1)")).rejects.toThrow();
  });

  it("runModule() should allow top-level await", async () => {
    const sandbox = createSandbox({ env: "es2022", modules: {} });

    const exports = await sandbox.runModule(
      `
      const value = await Promise.resolve(3);
      export const result = value + 1;
      `,
      { path: "main.js" },
    );

    expect(exports.result).toBe(4);
  });

  it("should support env aliases", async () => {
    const sandbox = createSandbox({ env: "ES2022" });

    const value = await sandbox.run("1 + 1");
    expect(value).toBe(2);
  });

  it("should throw for unknown env preset", () => {
    expect(() =>
      createSandbox({ env: "unknown" as unknown as "es2022" }),
    ).toThrow("Unknown env preset");
  });

  it("should throw for unknown API preset", () => {
    expect(() =>
      createSandbox({ env: "es2022", apis: ["unknown" as unknown as "fetch"] }),
    ).toThrow("Unknown API preset");
  });

  it("should allow enabling additional features", async () => {
    const sandbox = createSandbox({
      env: "es5",
      features: { enable: ["LetConst"] },
    });

    const value = await sandbox.run("let x = 10; x + 1;");
    expect(value).toBe(11);
  });

  it("should allow disabling features", () => {
    const sandbox = createSandbox({
      env: "es2022",
      features: { disable: ["ArrowFunctions"] },
    });

    expect(() => sandbox.runSync("(() => 1)()")).toThrow(
      "ArrowFunctions is not enabled",
    );
  });

  it("should enforce per-run loop limits", () => {
    const sandbox = createSandbox({
      env: "es2022",
      limits: { perRun: { loops: 2 } },
    });

    expect(() => sandbox.runSync("for (let i = 0; i < 3; i++) {}")).toThrow(
      "Maximum loop iterations exceeded",
    );
  });

  it("should apply safe default per-run call depth limits", () => {
    const sandbox = createSandbox({ env: "es2022" });

    expect(() =>
      sandbox.runSync(`
      function dive(n) {
        if (n <= 0) {
          return 0;
        }
        return dive(n - 1) + 1;
      }
      dive(300);
    `),
    ).toThrow("Maximum call stack depth exceeded");
  });

  it("should allow overriding default per-run limits", () => {
    const sandbox = createSandbox({
      env: "es2022",
      limits: { perRun: { callDepth: 500 } },
    });

    const value = sandbox.runSync(`
      function dive(n) {
        if (n <= 0) {
          return 0;
        }
        return dive(n - 1) + 1;
      }
      dive(300);
    `);

    expect(value).toBe(300);
  });

  it("run() should support timeoutMs for async execution", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      globals: {
        pause: () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
      },
    });

    const timeoutRun = sandbox.run(
      `
      async function spin() {
        while (true) {
          await pause();
        }
      }
      spin();
    `,
      { timeoutMs: 10 },
    );

    const guard = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Guard timeout exceeded")), 200);
    });

    try {
      await Promise.race([timeoutRun, guard]);
      expect.unreachable("Expected async timeout to abort execution");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Execution aborted");
    }
  });

  it("createSandbox() timeoutMs should apply as default", async () => {
    const sandbox = createSandbox({
      env: "es2022",
      timeoutMs: 10,
      globals: {
        pause: () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
      },
    });

    const timeoutRun = sandbox.run(`
      async function spin() {
        while (true) {
          await pause();
        }
      }
      spin();
    `);

    const guard = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Guard timeout exceeded")), 200);
    });

    try {
      await Promise.race([timeoutRun, guard]);
      expect.unreachable("Expected sandbox default timeout to abort execution");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Execution aborted");
    }
  });

  it("runSync() should reject timeoutMs", () => {
    const sandbox = createSandbox({ env: "es2022" });

    expect(() => sandbox.runSync("1 + 1", { timeoutMs: 10 })).toThrow(
      "timeoutMs is only supported for async execution",
    );
  });

  it("should enforce total evaluation limits", () => {
    const sandbox = createSandbox({
      env: "es2022",
      limits: { total: { evaluations: 1 } },
    });

    sandbox.runSync("1 + 1");
    expect(() => sandbox.runSync("2 + 2")).toThrow("Resource limit exceeded");
  });

  it("resources() should return undefined when tracking is disabled", () => {
    const sandbox = createSandbox({ env: "es2022" });

    expect(sandbox.resources()).toBeUndefined();
  });

  it("policy.errors should control host error detail", () => {
    const safeSandbox = createSandbox({
      env: "es2022",
      globals: {
        fail() {
          throw new Error("boom");
        },
      },
    });

    expect(() => safeSandbox.runSync("fail()")).toThrow("error details hidden");

    const fullSandbox = createSandbox({
      env: "es2022",
      policy: { errors: "full" },
      globals: {
        fail() {
          throw new Error("boom");
        },
      },
    });

    expect(() => fullSandbox.runSync("fail()")).toThrow("boom");
  });

  describe("Concurrency", () => {
    it("should not leak globals between concurrent runs", async () => {
      const sandbox = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const runA = sandbox.run(
        "async function f(){ await sleep(20); return secret; } f()",
        {
          globals: { secret: "A", sleep },
        },
      );
      const runB = sandbox.run(
        "async function g(){ await sleep(1); return secret; } g()",
        {
          globals: { secret: "B", sleep },
        },
      );

      const [a, b] = await Promise.all([runA, runB]);
      expect(a).toBe("A");
      expect(b).toBe("B");
    });

    it("should not have leftover globals after concurrent runs complete", async () => {
      const sandbox = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      await Promise.all([
        sandbox.run(
          "async function f(){ await sleep(20); return secret; } f()",
          {
            globals: { secret: "A", sleep },
          },
        ),
        sandbox.run(
          "async function g(){ await sleep(1); return secret; } g()",
          {
            globals: { secret: "B", sleep },
          },
        ),
      ]);

      expect(sandbox.run("secret")).rejects.toThrow(
        "Undefined variable 'secret'",
      );
    });

    it("should handle one run failing without corrupting another run's globals", async () => {
      const sandbox = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const runA = sandbox.run("throw new Error('fail');", {
        globals: { sleep },
      });
      const runB = sandbox.run("secret;", { globals: { secret: "B" } });

      const [, resultB] = await Promise.all([
        runA.catch((e) => e.message),
        runB,
      ]);
      expect(resultB).toBe("B");
    });

    it("should serialize concurrent runs deterministically", async () => {
      const sandbox = createSandbox({ env: "es2022" });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const promises = Array.from({ length: 10 }, async (_, i) => {
        await sandbox.run(
          `async function f${i}(){ await sleep(${10 - i}); return value; } f${i}()`,
          { globals: { value: String(i), sleep } },
        );
      });

      await Promise.all(promises);

      expect(sandbox.run("value")).rejects.toThrow(
        "Undefined variable 'value'",
      );
    });

    it("should serialize runModule() calls with run() calls", async () => {
      const sandbox = createSandbox({
        env: "es2022",
        modules: { files: { "mod.js": "export const value = 42;" } },
      });

      const [scriptResult, moduleResult] = await Promise.all([
        sandbox.run("secret", { globals: { secret: "script" } }),
        sandbox.runModule(
          'import { value } from "mod.js"; export const result = value;',
          {
            path: "main.js",
          },
        ),
      ]);

      expect(scriptResult).toBe("script");
      expect(moduleResult.result).toBe(42);
    });

    it("should not allow concurrent evaluations to interfere with feature control", async () => {
      const sandbox = createSandbox({
        env: "es2022",
        features: { disable: ["ArrowFunctions"] },
      });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const runWithArrows = sandbox.run("(() => 1)()", {
        features: { enable: ["ArrowFunctions"] },
      });
      const runWithoutArrows = sandbox.run("function f() { return 1; } f()", {
        globals: { sleep },
      });

      const [arrowResult, normalResult] = await Promise.all([
        runWithArrows.catch((e) => e.message),
        runWithoutArrows,
      ]);
      expect(arrowResult).toBe(1);
      expect(normalResult).toBe(1);
    });
  });
});
