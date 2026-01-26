import { describe, expect, it } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Security: Async/Await Features", () => {
  describe("Host function protection", () => {
    it("should block awaiting host functions directly", async () => {
      const hostFunc = () => "secret";
      const interpreter = new Interpreter({
        globals: { hostFunc },
      });
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return await hostFunc;
          }
          test()
        `),
      ).rejects.toThrow("Cannot await a host function");
    });

    it("should allow awaiting host function call results", async () => {
      const asyncHost = async () => "data";
      const interpreter = new Interpreter({
        globals: { asyncHost },
      });
      const result = await interpreter.evaluateAsync(`
        async function test() {
          return await asyncHost();
        }
        test()
      `);
      expect(result).toBe("data");
    });

    it("should block property access on host functions in async", async () => {
      const hostFunc = () => "secret";
      const interpreter = new Interpreter({
        globals: { hostFunc },
      });
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return hostFunc.name;
          }
          test()
        `),
      ).rejects.toThrow("Cannot access properties on host functions");
    });

    it("should block calling async host functions in sync mode", () => {
      const asyncHost = async () => "data";
      const interpreter = new Interpreter({
        globals: { asyncHost },
      });
      expect(() => {
        interpreter.evaluate("asyncHost()");
      }).toThrow("Cannot call async host function");
    });
  });

  describe("Sandbox function security", () => {
    it("should allow returning sandbox functions from async", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function makeFunc() {
          return function inner() {
            return 42;
          };
        }
        async function test() {
          let func = await makeFunc();
          return func();
        }
        test()
      `);
      expect(result).toBe(42);
    });

    it("should block calling async sandbox functions in sync mode", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync(`
        async function asyncFunc() {
          return 42;
        }
      `);
      expect(() => {
        interpreter.evaluate("asyncFunc()");
      }).toThrow("Cannot call async function in synchronous evaluate()");
    });
  });

  describe("Prototype pollution protection", () => {
    it("should block __proto__ assignment in async", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function pollute() {
            let obj = {};
            obj["__proto__"]["evil"] = true;
            return obj;
          }
          pollute()
        `),
      ).rejects.toThrow("Property name '__proto__' is not allowed");
    });

    it("should block constructor access in async", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function exploit() {
            let obj = {};
            obj["constructor"]["evil"] = true;
            return obj;
          }
          exploit()
        `),
      ).rejects.toThrow("Property name 'constructor' is not allowed");
    });

    it("should block prototype property in async", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function exploit() {
            let obj = {};
            obj["prototype"] = { evil: true };
            return obj;
          }
          exploit()
        `),
      ).rejects.toThrow("Property name 'prototype' is not allowed");
    });
  });

  describe("Built-in object access", () => {
    it("should not have access to Promise constructor", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return Promise;
          }
          test()
        `),
      ).rejects.toThrow("Undefined variable 'Promise'");
    });

    it("should not have access to Function constructor", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return Function;
          }
          test()
        `),
      ).rejects.toThrow("Undefined variable 'Function'");
    });

    it("should not have access to eval", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return eval;
          }
          test()
        `),
      ).rejects.toThrow("Undefined variable 'eval'");
    });

    it("should not have access to globalThis", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return globalThis;
          }
          test()
        `),
      ).rejects.toThrow("Undefined variable 'globalThis'");
    });
  });

  describe("Environment isolation", () => {
    it("should maintain separate interpreter instances", async () => {
      const interpreter1 = new Interpreter();
      const interpreter2 = new Interpreter();

      await interpreter1.evaluateAsync("let secret = 'interpreter1'");
      await interpreter2.evaluateAsync("let secret = 'interpreter2'");

      const result1 = await interpreter1.evaluateAsync("secret");
      const result2 = await interpreter2.evaluateAsync("secret");

      expect(result1).toBe("interpreter1");
      expect(result2).toBe("interpreter2");
    });

    it("should not leak variables between evaluate calls", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let temp = 'exists'", {
        globals: { external: "data" },
      });

      // Per-call globals should be cleaned up
      return expect(interpreter.evaluateAsync("external")).rejects.toThrow(
        "Undefined variable 'external'",
      );

      // But variables declared in code persist (stateful by design)
      const result = await interpreter.evaluateAsync("temp");
      expect(result).toBe("exists");
    });
  });

  describe("Error handling", () => {
    it("should propagate errors from async host functions", async () => {
      const errorHost = async () => {
        throw new Error("Host error");
      };
      const interpreter = new Interpreter({
        globals: { errorHost },
        security: { hideHostErrorMessages: false },
      });
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return await errorHost();
          }
          test()
        `),
      ).rejects.toThrow("Host function 'errorHost' threw error: Host error");
    });

    it("should propagate errors from async sandbox functions", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function throwError() {
            let x = undefinedVariable;
            return x;
          }
          throwError()
        `),
      ).rejects.toThrow("Undefined variable 'undefinedVariable'");
    });

    it("should handle errors in await expressions", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          async function test() {
            return await nonExistentFunc();
          }
          test()
        `),
      ).rejects.toThrow("Undefined variable 'nonExistentFunc'");
    });
  });

  describe("State management", () => {
    it("should maintain state across async calls", async () => {
      const interpreter = new Interpreter();
      await interpreter.evaluateAsync("let counter = 0");
      await interpreter.evaluateAsync(`
        async function increment() {
          counter = counter + 1;
        }
        increment()
      `);
      const result = await interpreter.evaluateAsync("counter");
      expect(result).toBe(1);
    });

    it("should respect const immutability in async", async () => {
      const interpreter = new Interpreter();
      return expect(
        interpreter.evaluateAsync(`
          const PI = 3.14;
          async function change() {
            PI = 3;
          }
          change()
        `),
      ).rejects.toThrow("Cannot assign to const variable 'PI'");
    });
  });

  describe("Closure security", () => {
    it("should maintain closure scope in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function makeCounter() {
          let count = 0;
          return async function() {
            count = count + 1;
            return count;
          };
        }
        async function test() {
          let counter = await makeCounter();
          let a = await counter();
          let b = await counter();
          return b;
        }
        test()
      `);
      expect(result).toBe(2);
    });

    it("should maintain closure scope across async boundaries", async () => {
      const interpreter = new Interpreter();

      const result = await interpreter.evaluateAsync(`
        let secret = "confidential";
        async function makeAccessor() {
          return function() {
            return secret;
          };
        }
        async function test() {
          let accessor = await makeAccessor();
          return accessor();
        }
        test()
      `);

      expect(result).toBe("confidential");
      // Note: The host can inspect returned functions (by design)
      // The security boundary is preventing SANDBOX code from escaping
    });
  });
});
