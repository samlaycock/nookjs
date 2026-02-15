import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ReadOnlyProxy, sanitizeErrorStack } from "../src/readonly-proxy";

describe("Security", () => {
  describe("Security: Prototype Pollution Prevention", () => {
    describe("__proto__ access blocking", () => {
      it("should prevent __proto__ assignment via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj["__proto__"]["polluted"] = "hacked";
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent __proto__ assignment via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj.__proto__ = {};
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent __proto__ access via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let proto = obj["__proto__"];
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent __proto__ access via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let proto = obj.__proto__;
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent __proto__ in object literals", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {
              "__proto__": { polluted: true }
            };
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent __proto__ pollution through nested objects", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = { nested: {} };
            obj.nested["__proto__"] = { evil: true };
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });
    });

    describe("constructor access blocking", () => {
      it("should prevent constructor assignment via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj["constructor"] = null;
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });

      it("should prevent constructor assignment via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj.constructor = null;
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });

      it("should prevent constructor access via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let ctor = obj["constructor"];
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });

      it("should prevent constructor access via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let ctor = obj.constructor;
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });

      it("should prevent constructor in object literals", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {
              constructor: null
            };
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });
    });

    describe("prototype access blocking", () => {
      it("should prevent prototype assignment via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj["prototype"] = {};
          `);
        }).toThrow("Property name 'prototype' is not allowed for security reasons");
      });

      it("should prevent prototype assignment via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj.prototype = {};
          `);
        }).toThrow("Property name 'prototype' is not allowed for security reasons");
      });

      it("should prevent prototype access via computed property", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let proto = obj["prototype"];
          `);
        }).toThrow("Property name 'prototype' is not allowed for security reasons");
      });

      it("should prevent prototype access via dot notation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let proto = obj.prototype;
          `);
        }).toThrow("Property name 'prototype' is not allowed for security reasons");
      });

      it("should prevent prototype in object literals", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {
              prototype: {}
            };
          `);
        }).toThrow("Property name 'prototype' is not allowed for security reasons");
      });
    });

    describe("other dangerous properties blocking", () => {
      const dangerousProps = [
        "__defineGetter__",
        "__defineSetter__",
        "__lookupGetter__",
        "__lookupSetter__",
      ];

      dangerousProps.forEach((prop) => {
        it(`should prevent ${prop} assignment via computed property`, () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj = {};
              obj["${prop}"] = null;
            `);
          }).toThrow(`Property name '${prop}' is not allowed for security reasons`);
        });

        it(`should prevent ${prop} access via computed property`, () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj = {};
              let val = obj["${prop}"];
            `);
          }).toThrow(`Property name '${prop}' is not allowed for security reasons`);
        });

        it(`should prevent ${prop} in object literals`, () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj = {
                "${prop}": null
              };
            `);
          }).toThrow(`Property name '${prop}' is not allowed for security reasons`);
        });
      });
    });

    describe("complex attack scenarios", () => {
      it("should prevent pollution through function returns", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            function getObject() {
              return {};
            }
            let obj = getObject();
            obj["__proto__"]["polluted"] = true;
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent pollution through array of objects", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let arr = [{}];
            arr[0]["__proto__"] = { evil: true };
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent pollution through nested property chains", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = { a: { b: { c: {} } } };
            obj.a.b.c["__proto__"] = { bad: true };
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent pollution through computed property with string concatenation", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let key = "__" + "proto" + "__";
            obj[key] = { polluted: true };
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent constructor access through method calls", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {
              getData: function() {
                return this;
              }
            };
            let self = obj.getData();
            let ctor = self["constructor"];
          `);
        }).toThrow("Property name 'constructor' is not allowed for security reasons");
      });

      it("should prevent prototype pollution through loops", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let props = ["__proto__"];
            for (let i = 0; i < props.length; i++) {
              let obj = {};
              obj[props[i]] = { evil: true };
            }
          `);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });
    });

    describe("safe operations still work", () => {
      it("should allow normal property assignment", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {};
          obj.normalProp = "safe";
          obj.normalProp
        `);
        expect(result).toBe("safe");
      });

      it("should allow normal property access", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = { key: "value" };
          obj.key
        `);
        expect(result).toBe("value");
      });

      it("should allow computed property with safe names", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {};
          let key = "safe" + "Key";
          obj[key] = 42;
          obj[key]
        `);
        expect(result).toBe(42);
      });

      it("should allow object literals with safe properties", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {
            name: "test",
            value: 123,
            nested: { inner: true }
          };
          obj.name + obj.value
        `);
        expect(result).toBe("test123");
      });

      it("should allow property names that contain dangerous words but aren't exact matches", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {
            myConstructor: "safe",
            proto: "also safe",
            __protoCustom: "still safe"
          };
          obj.myConstructor + obj.proto
        `);
        expect(result).toBe("safealso safe");
      });

      it("should allow .length property access", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let arr = [1, 2, 3];
          let str = "hello";
          arr.length + str.length
        `);
        expect(result).toBe(8);
      });
    });

    describe("host function protection", () => {
      it("should allow calling host functions passed as globals", () => {
        const hostFunction = (x: number) => x * 2;
        const interpreter = new Interpreter({
          globals: { myFunc: hostFunction },
        });

        // Host functions CAN now be called
        expect(interpreter.evaluate("myFunc(5)")).toBe(10);
      });

      it("should prevent accessing properties on host functions", () => {
        const hostFunction = (x: number) => x * 2;
        const interpreter = new Interpreter({
          globals: { myFunc: hostFunction },
        });

        // Cannot access properties on host functions
        expect(() => {
          interpreter.evaluate("myFunc.name");
        }).toThrow("Cannot access properties on host functions");
      });

      it("should allow accessing host object properties", () => {
        const hostObject = {
          value: 100,
          name: "test",
          nested: {
            inner: 42,
          },
        };
        const interpreter = new Interpreter({
          globals: { obj: hostObject },
        });

        // Can access object properties
        expect(interpreter.evaluate("obj.value")).toBe(100);
        expect(interpreter.evaluate("obj.name")).toBe("test");
        expect(interpreter.evaluate("obj.nested.inner")).toBe(42);
      });

      it("should wrap and allow calling methods on host objects", () => {
        const hostObject = {
          value: 100,
          method: function () {
            return this.value * 2;
          },
        };
        const interpreter = new Interpreter({
          globals: { obj: hostObject },
        });

        // With ReadOnlyProxy architecture, methods on host objects ARE wrapped as HostFunctionValue
        // This is necessary to support Math.floor(), console.log(), etc.
        const result = interpreter.evaluate("obj.method()");
        expect(result).toBe(200);
      });

      it("should allow calling interpreter-created functions", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          function myFunc(x) {
            return x * 2;
          }
          myFunc(5)
        `);
        expect(result).toBe(10);
      });

      it("should allow calling arrow functions in globals (created in sandbox)", () => {
        const interpreter = new Interpreter();
        // First create a function in the sandbox
        interpreter.evaluate(`
          let myFunc = x => x * 2;
        `);
        // Then call it
        const result = interpreter.evaluate("myFunc(5)");
        expect(result).toBe(10);
      });
    });

    describe("strict prototype access policy", () => {
      it("should block inherited Object.prototype access", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = { a: 1 };
            obj.toString
          `);
        }).toThrow("Property name 'toString' is not allowed for security reasons");
      });

      it("should block inherited Array.prototype access", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let arr = [1, 2, 3];
            arr.toString
          `);
        }).toThrow("Property name 'toString' is not allowed for security reasons");
      });

      it("should block inherited Function.prototype access on sandbox functions", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            function foo() { return 1; }
            foo.call
          `);
        }).toThrow("Property name 'call' is not allowed for security reasons");
      });
    });

    describe("symbol access blocking", () => {
      it("should block dangerous symbol access on objects", () => {
        const sym = Symbol.toStringTag;
        const interpreter = new Interpreter({
          globals: { sym },
        });
        expect(() => {
          interpreter.evaluate(`
            const obj = { a: 1 };
            obj[sym];
          `);
        }).toThrow("Symbol 'Symbol(Symbol.toStringTag)' is not allowed for security reasons");
      });

      it("should block dangerous symbol assignment on objects", () => {
        const sym = Symbol.toPrimitive;
        const interpreter = new Interpreter({
          globals: { sym },
        });
        expect(() => {
          interpreter.evaluate(`
            const obj = { a: 1 };
            obj[sym] = 1;
          `);
        }).toThrow("Symbol 'Symbol(Symbol.toPrimitive)' is not allowed for security reasons");
      });
    });

    describe("host function bypass prevention", () => {
      it("should block access to hostFunc on host functions", () => {
        const interpreter = new Interpreter({
          globals: {
            getData: () => ({ value: 1 }),
          },
        });

        expect(() => {
          interpreter.evaluate("getData.hostFunc");
        }).toThrow("Cannot access properties on host functions");
      });

      it("should block calling hostFunc directly", () => {
        const interpreter = new Interpreter({
          globals: {
            getData: () => ({ value: 1 }),
          },
        });

        expect(() => {
          interpreter.evaluate("getData.hostFunc()");
        }).toThrow("Cannot access properties on host functions");
      });
    });

    describe("global sanitization", () => {
      it("should reject Function constructor in globals", () => {
        expect(() => {
          new Interpreter({
            globals: { Function },
          });
        }).toThrow("Global 'Function' is not allowed for security reasons");
      });

      it("should reject eval in globals", () => {
        expect(() => {
          new Interpreter({
            globals: { eval },
          });
        }).toThrow("Global 'eval' is not allowed for security reasons");
      });

      it("should reject Proxy and Reflect by value even with alias", () => {
        expect(() => {
          new Interpreter({
            globals: { P: Proxy, R: Reflect },
          });
        }).toThrow("Global 'P' is not allowed for security reasons");
      });
    });

    describe("internal object access protection", () => {
      it("should block access to FunctionValue internals", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            function foo() { return 1; }
            foo.closure
          `);
        }).toThrow();
      });

      it("should block access to Generator internals", () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            function *gen() { yield 1; }
            const g = gen();
            g.state
          `);
        }).toThrow();
      });
    });

    describe("host constructor return isolation", () => {
      it("should prevent mutation of host object returned from constructor", () => {
        const hostInstance = { secret: "CONFIDENTIAL" };
        const interpreter = new Interpreter({
          globals: {
            HostCtor: function () {
              return hostInstance;
            },
          },
        });

        expect(() => {
          interpreter.evaluate(`
            const obj = new HostCtor();
            obj.secret = "HACKED";
          `);
        }).toThrow();

        expect(hostInstance.secret).toBe("CONFIDENTIAL");
      });
    });

    describe("edge cases", () => {
      it("should handle empty property name differently from dangerous ones", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {};
          obj[""] = "empty key is allowed";
          obj[""]
        `);
        expect(result).toBe("empty key is allowed");
      });

      it("should handle numeric property names", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let obj = {};
          obj[123] = "numeric key";
          obj["123"]
        `);
        expect(result).toBe("numeric key");
      });

      it("should prevent dangerous properties even with injected globals", () => {
        const interpreter = new Interpreter({
          globals: { data: { value: 100 } },
        });
        expect(() => {
          interpreter.evaluate(`data["__proto__"] = { evil: true }`);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });

      it("should prevent pollution across multiple evaluate calls", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(`let obj = { safe: true }`);

        expect(() => {
          interpreter.evaluate(`obj["__proto__"] = { bad: true }`);
        }).toThrow("Property name '__proto__' is not allowed for security reasons");
      });
    });
  });

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
      it("should have access to Promise constructor for async/await support", async () => {
        const interpreter = new Interpreter();
        const result = await interpreter.evaluateAsync(`
          async function test() {
            return Promise;
          }
          test()
        `);
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
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

      it("should have access to globalThis", async () => {
        const interpreter = new Interpreter();
        const result = await interpreter.evaluateAsync(`
          async function test() {
            return globalThis;
          }
          test()
        `);
        expect(result).toBeDefined();
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

  describe("Security Options", () => {
    describe("Error Stack Sanitization", () => {
      it("should sanitize error stacks by default", async () => {
        const interpreter = new Interpreter({
          globals: { Error },
        });

        const stack = await interpreter.evaluateAsync(`
          const e = new Error('test');
          e.stack
        `);

        // Should not contain host file paths
        expect(stack).not.toContain("/Users/");
        expect(stack).not.toContain("interpreter.ts");
        expect(stack).not.toContain("readonly-proxy.ts");

        // Should contain sanitized markers
        expect(stack).toContain("[native code]");
      });

      it("should allow disabling error stack sanitization", async () => {
        const interpreter = new Interpreter({
          globals: { Error },
          security: { sanitizeErrors: false },
        });

        const stack = await interpreter.evaluateAsync(`
          const e = new Error('test');
          e.stack
        `);

        // Should contain actual file paths when disabled
        expect(stack).toContain("interpreter.ts");
      });

      it("should respect sanitizeErrors=false for static properties on host functions", () => {
        const hostFunction = () => "ok";
        const hostError = new Error("static property error");
        hostError.stack =
          "Error: static property error\n    at staticFn (/tmp/static-host.ts:12:34)";
        (hostFunction as any).meta = { error: hostError };

        const interpreter = new Interpreter({
          globals: { hostFunction },
          security: { sanitizeErrors: false },
        });

        const stack = interpreter.evaluate("hostFunction.meta.error.stack");
        expect(stack).toContain("/tmp/static-host.ts");
        expect(stack).not.toContain("[native code]");
      });

      it("should respect sanitizeErrors=false for static properties on interpreter-created host functions", () => {
        const hostError = new Error("array method static property error");
        hostError.stack =
          "Error: array method static property error\n    at arrayMapStatic (/tmp/array-map-static.ts:9:21)";

        const originalMeta = (Function.prototype as any).nookMeta;
        (Function.prototype as any).nookMeta = { error: hostError };

        try {
          const interpreter = new Interpreter({
            security: { sanitizeErrors: false },
          });

          const stack = interpreter.evaluate("[1, 2, 3].map.nookMeta.error.stack");
          expect(stack).toContain("/tmp/array-map-static.ts");
          expect(stack).not.toContain("[native code]");
        } finally {
          if (originalMeta === undefined) {
            delete (Function.prototype as any).nookMeta;
          } else {
            (Function.prototype as any).nookMeta = originalMeta;
          }
        }
      });

      it("should sanitize stacks from errors created in sandbox", async () => {
        const interpreter = new Interpreter({
          globals: { Error },
        });

        // Create error and access stack - the stack should be sanitized
        const stack = await interpreter.evaluateAsync(`
          const e = new Error('created in sandbox');
          e.stack
        `);

        expect(stack).not.toContain("/Users/");
        expect(stack).toContain("[native code]");
      });
    });

    describe("Cross-Interpreter Security Isolation", () => {
      it("should maintain interpreter A's sanitizeErrors setting after creating interpreter B", () => {
        const err = new Error("x");
        err.stack = "Error: x\n    at fn (/tmp/foo.ts:1:1)";

        const a = new Interpreter({
          security: { sanitizeErrors: true },
          globals: { err },
        });

        const beforeStack = a.evaluate("err.stack");
        expect(beforeStack).toContain("[native code]");
        expect(beforeStack).not.toContain("/tmp/foo.ts");

        const b = new Interpreter({
          security: { sanitizeErrors: false },
        });
        void b;

        const afterStack = a.evaluate("err.stack");
        expect(afterStack).toContain("[native code]");
        expect(afterStack).not.toContain("/tmp/foo.ts");
      });

      it("should allow mixed sanitizeErrors on/off interpreters to behave independently", () => {
        const err = new Error("test");
        err.stack = "Error: test\n    at fn (/var/log/app.js:10:20)";

        const sanitizingInterpreter = new Interpreter({
          security: { sanitizeErrors: true },
          globals: { err },
        });

        const nonSanitizingInterpreter = new Interpreter({
          security: { sanitizeErrors: false },
          globals: { err },
        });

        const sanitizedStack = sanitizingInterpreter.evaluate("err.stack");
        expect(sanitizedStack).toContain("[native code]");
        expect(sanitizedStack).not.toContain("/var/log/app.js");

        const unsanitizedStack = nonSanitizingInterpreter.evaluate("err.stack");
        expect(unsanitizedStack).toContain("/var/log/app.js");
        expect(unsanitizedStack).not.toContain("[native code]");
      });

      it("should maintain independent security settings across multiple interpreter instances", () => {
        const err1 = new Error("leak1");
        err1.stack = "Error: leak1\n    at test (/etc/passwd:1:1)";

        const err2 = new Error("leak2");
        err2.stack = "Error: leak2\n    at test (/root/secret:1:1)";

        const sanitizing = new Interpreter({
          security: { sanitizeErrors: true },
          globals: { err: err1 },
        });

        const nonSanitizing = new Interpreter({
          security: { sanitizeErrors: false },
          globals: { err: err2 },
        });

        const stack1 = sanitizing.evaluate("err.stack");
        expect(stack1).toContain("[native code]");
        expect(stack1).not.toContain("/etc/passwd");

        const stack2 = nonSanitizing.evaluate("err.stack");
        expect(stack2).toContain("/root/secret");
        expect(stack2).not.toContain("[native code]");
      });
    });

    describe("Host Error Message Hiding", () => {
      it("should hide host error messages by default", () => {
        const interpreter = new Interpreter({
          globals: {
            throwError: () => {
              throw new Error("sensitive information here");
            },
          },
        });

        expect(() => {
          interpreter.evaluate("throwError()");
        }).toThrow("[error details hidden]");
      });

      it("should show host error messages when configured", () => {
        const interpreter = new Interpreter({
          globals: {
            throwError: () => {
              throw new Error("sensitive information here");
            },
          },
          security: { hideHostErrorMessages: false },
        });

        expect(() => {
          interpreter.evaluate("throwError()");
        }).toThrow("sensitive information here");
      });

      it("should hide constructor error messages when configured", async () => {
        const interpreter = new Interpreter({
          globals: {
            BadClass: class {
              constructor() {
                throw new Error("secret constructor error");
              }
            },
          },
          security: { hideHostErrorMessages: true },
        });

        return expect(interpreter.evaluateAsync("new BadClass()")).rejects.toThrow(
          "[error details hidden]",
        );
      });

      it("should hide async host function errors when configured", async () => {
        const interpreter = new Interpreter({
          globals: {
            asyncThrow: async () => {
              throw new Error("async secret");
            },
          },
          security: { hideHostErrorMessages: true },
        });

        return expect(
          interpreter.evaluateAsync(`
          async function run() {
            return await asyncThrow();
          }
          run()
        `),
        ).rejects.toThrow("[error details hidden]");
      });
    });

    describe("valueOf Security", () => {
      it("should not call custom valueOf on host objects", () => {
        let customCalled = false;
        const interpreter = new Interpreter({
          globals: {
            obj: {
              valueOf: () => {
                customCalled = true;
                return "leaked!";
              },
            },
          },
        });

        interpreter.evaluate("obj.valueOf()");
        expect(customCalled).toBe(false);
      });

      it("should return wrapped proxy from valueOf", () => {
        const secret = { password: "admin123" };
        const interpreter = new Interpreter({
          globals: {
            obj: {
              valueOf: () => secret,
            },
          },
        });

        // The result should be a wrapped proxy of obj, not the secret
        const result = interpreter.evaluate("obj.valueOf()");

        // Should not be the secret object
        expect(result).not.toBe(secret);

        // Should be read-only
        expect(() => {
          interpreter.evaluate("obj.valueOf().x = 1");
        }).toThrow("read-only");
      });

      it("should correctly handle valueOf for Number wrapper", () => {
        const interpreter = new Interpreter({
          globals: {
            num: new Number(42),
          },
        });

        const result = interpreter.evaluate("num.valueOf()");
        expect(result).toBe(42);
      });

      it("should correctly handle valueOf for String wrapper", () => {
        const interpreter = new Interpreter({
          globals: {
            str: new String("hello"),
          },
        });

        const result = interpreter.evaluate("str.valueOf()");
        expect(result).toBe("hello");
      });

      it("should correctly handle valueOf for Boolean wrapper", () => {
        const interpreter = new Interpreter({
          globals: {
            bool: new Boolean(true),
          },
        });

        const result = interpreter.evaluate("bool.valueOf()");
        expect(result).toBe(true);
      });

      it("should correctly handle valueOf for Date", () => {
        const date = new Date("2024-01-01T00:00:00Z");
        const interpreter = new Interpreter({
          globals: { date },
        });

        const result = interpreter.evaluate("date.valueOf()");
        expect(result).toBe(date.getTime());
      });
    });

    describe("sanitizeErrorStack function", () => {
      it("should remove Unix absolute paths", () => {
        const input = `Error: test
      at foo (/home/user/project/file.ts:123:45)
      at bar (/Users/dev/code/app.js:10:5)`;

        const result = sanitizeErrorStack(input);

        expect(result).not.toContain("/home/user");
        expect(result).not.toContain("/Users/dev");
        expect(result).toContain("[native code]");
      });

      it("should remove file:// URLs", () => {
        const input = `Error: test
      at foo (file:///home/user/project/file.ts:123:45)`;

        const result = sanitizeErrorStack(input);

        expect(result).not.toContain("file://");
        expect(result).toContain("[native code]");
      });

      it("should preserve the error message line", () => {
        const input = `Error: my error message
      at foo (/path/to/file.ts:1:1)`;

        const result = sanitizeErrorStack(input);

        expect(result).toContain("Error: my error message");
      });

      it("should handle empty/undefined input", () => {
        expect(sanitizeErrorStack(undefined)).toBe("");
        expect(sanitizeErrorStack("")).toBe("");
      });
    });
  });

  describe("ReadOnlyProxy Security", () => {
    describe("Prototype chain protection", () => {
      it("should block Object.getPrototypeOf from returning the real prototype", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const proto = Object.getPrototypeOf(wrapped);
        expect(proto).toBe(null);
      });

      it("should prevent prototype pollution via Object.getPrototypeOf", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const proto = Object.getPrototypeOf(wrapped);

        // proto is null, so attempting to add properties should fail
        expect(() => {
          (proto as any).evil = "EVIL";
        }).toThrow();

        // Verify the wrapped object is not affected
        expect((wrapped as any).evil).toBeUndefined();
      });

      it("should prevent prototype pollution in interpreter context", () => {
        const testObj = { value: 42 };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        // Accessing obj in the interpreter should return a proxied version
        expect(interpreter.evaluate("obj.value")).toBe(42);

        // Verify the original object is not polluted
        expect((testObj as any).evil).toBeUndefined();
      });
    });

    describe("Dangerous property access via proxy", () => {
      it("should block __proto__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).__proto__;
        }).toThrow("Cannot access __proto__ on global 'obj'");
      });

      it("should block constructor access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).constructor;
        }).toThrow("Cannot access constructor on global 'obj'");
      });

      it("should block prototype access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).prototype;
        }).toThrow("Cannot access prototype on global 'obj'");
      });

      it("should block __defineGetter__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).__defineGetter__;
        }).toThrow("Cannot access __defineGetter__ on global 'obj'");
      });

      it("should block __defineSetter__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).__defineSetter__;
        }).toThrow("Cannot access __defineSetter__ on global 'obj'");
      });

      it("should block __lookupGetter__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).__lookupGetter__;
        }).toThrow("Cannot access __lookupGetter__ on global 'obj'");
      });

      it("should block __lookupSetter__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).__lookupSetter__;
        }).toThrow("Cannot access __lookupSetter__ on global 'obj'");
      });

      it("should allow valueOf for primitive coercion but return wrapped value", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        // valueOf is allowed for arithmetic operations, but returns a wrapped proxy
        const valueOfFn = (wrapped as any).valueOf;
        expect(typeof valueOfFn).toBe("function");
        // The function should return a wrapped proxy, not the raw object
        const result = valueOfFn();
        expect(result).not.toBe(testObj); // Returns a wrapped proxy, not the raw target
        expect(result.value).toBe(42); // Properties are still accessible (read-only)
      });

      it("should block toLocaleString access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).toLocaleString;
        }).toThrow("Cannot access toLocaleString on global 'obj'");
      });

      it("should block hasOwnProperty access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).hasOwnProperty;
        }).toThrow("Cannot access hasOwnProperty on global 'obj'");
      });

      it("should block isPrototypeOf access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).isPrototypeOf;
        }).toThrow("Cannot access isPrototypeOf on global 'obj'");
      });

      it("should block propertyIsEnumerable access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).propertyIsEnumerable;
        }).toThrow("Cannot access propertyIsEnumerable on global 'obj'");
      });

      it("should block apply access in interpreter context", () => {
        const testFunc = () => 42;
        const testObj = { method: testFunc };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.method.apply");
        }).toThrow("'apply' is not allowed");
      });

      it("should block call access in interpreter context", () => {
        const testFunc = () => 42;
        const testObj = { method: testFunc };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.method.call");
        }).toThrow("'call' is not allowed");
      });

      it("should block bind access in interpreter context", () => {
        const testFunc = () => 42;
        const testObj = { method: testFunc };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.method.bind");
        }).toThrow("'bind' is not allowed");
      });

      it("should block arguments access in interpreter context", () => {
        const testFunc = () => 42;
        const testObj = { method: testFunc };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.method.arguments");
        }).toThrow("'arguments' is not allowed");
      });

      it("should block caller access in interpreter context", () => {
        const testFunc = () => 42;
        const testObj = { method: testFunc };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.method.caller");
        }).toThrow("'caller' is not allowed");
      });
    });

    describe("Property modification protection via proxy", () => {
      it("should block setting properties", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          (wrapped as any).value = 100;
        }).toThrow("Cannot modify property 'value' on global 'obj' (read-only)");
      });

      it("should block adding new properties", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          (wrapped as any).newProp = "test";
        }).toThrow("Cannot modify property 'newProp' on global 'obj' (read-only)");
      });

      it("should block deleting properties", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          delete (wrapped as any).value;
        }).toThrow("Cannot delete property 'value' from global 'obj' (read-only)");
      });

      it("should block Object.defineProperty", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Object.defineProperty(wrapped, "newProp", { value: 100 });
        }).toThrow("Cannot define property 'newProp' on global 'obj' (read-only)");
      });

      it("should block Object.setPrototypeOf", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Object.setPrototypeOf(wrapped, {});
        }).toThrow("Cannot set prototype of global 'obj' (read-only)");
      });
    });

    describe("Nested object protection", () => {
      it("should recursively protect nested objects", () => {
        const testObj = {
          level1: {
            level2: {
              value: 42,
            },
          },
        };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        // Can read nested values
        expect((wrapped as any).level1.level2.value).toBe(42);

        // Cannot modify nested values
        expect(() => {
          (wrapped as any).level1.level2.value = 100;
        }).toThrow("Cannot modify property 'value' on global 'obj.level1.level2' (read-only)");
      });

      it("should block __proto__ on nested objects", () => {
        const testObj = {
          nested: { value: 42 },
        };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any).nested.__proto__;
        }).toThrow("Cannot access __proto__ on global 'obj.nested'");
      });

      it("should block Object.getPrototypeOf on nested objects", () => {
        const testObj = {
          nested: { value: 42 },
        };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const nested = (wrapped as any).nested;
        const proto = Object.getPrototypeOf(nested);
        expect(proto).toBe(null);
      });
    });

    describe("Array protection", () => {
      it("should protect array elements from modification", () => {
        const arr = [1, 2, 3];
        const wrapped = ReadOnlyProxy.wrap(arr, "arr");

        expect(() => {
          (wrapped as any)[0] = 999;
        }).toThrow("Cannot modify property '0' on global 'arr' (read-only)");
      });

      it("should block __proto__ on arrays", () => {
        const arr = [1, 2, 3];
        const wrapped = ReadOnlyProxy.wrap(arr, "arr");

        expect(() => {
          void (wrapped as any).__proto__;
        }).toThrow("Cannot access __proto__ on global 'arr'");
      });
    });

    describe("Symbol access protection", () => {
      // Note: Symbol.toPrimitive is intentionally allowed (returns undefined) for arithmetic operations
      const symbolCases: Array<{ symbol: symbol; name: string }> = [
        { symbol: Symbol.toStringTag, name: "Symbol(Symbol.toStringTag)" },
        { symbol: Symbol.hasInstance, name: "Symbol(Symbol.hasInstance)" },
        { symbol: Symbol.unscopables, name: "Symbol(Symbol.unscopables)" },
        { symbol: Symbol.species, name: "Symbol(Symbol.species)" },
        { symbol: Symbol.match, name: "Symbol(Symbol.match)" },
        { symbol: Symbol.matchAll, name: "Symbol(Symbol.matchAll)" },
        { symbol: Symbol.replace, name: "Symbol(Symbol.replace)" },
        { symbol: Symbol.search, name: "Symbol(Symbol.search)" },
        { symbol: Symbol.split, name: "Symbol(Symbol.split)" },
        {
          symbol: Symbol.isConcatSpreadable,
          name: "Symbol(Symbol.isConcatSpreadable)",
        },
      ];

      it("should block Symbol.toStringTag access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any)[Symbol.toStringTag];
        }).toThrow("Cannot access Symbol(Symbol.toStringTag) on global 'obj'");
      });

      it("should allow Symbol.toPrimitive for primitive coercion", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        // Symbol.toPrimitive returns undefined, which tells JS to use valueOf/toString
        // This is safe and necessary for arithmetic operations to work
        const toPrimitive = (wrapped as any)[Symbol.toPrimitive];
        expect(toPrimitive).toBeUndefined();
      });

      it("should block Symbol.hasInstance access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any)[Symbol.hasInstance];
        }).toThrow("Cannot access Symbol(Symbol.hasInstance) on global 'obj'");
      });

      symbolCases.forEach(({ symbol, name }) => {
        it(`should block ${name} access`, () => {
          const testObj = { value: 42 };
          const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

          expect(() => {
            void (wrapped as any)[symbol];
          }).toThrow(`Cannot access ${name} on global 'obj'`);
        });
      });
    });

    describe("Iterator wrapping", () => {
      it("should wrap values yielded by iterators", () => {
        const arr = [{ secret: "TOP" }];
        const wrapped = ReadOnlyProxy.wrap(arr, "arr");

        const iterator = (wrapped as any)[Symbol.iterator]();
        const first = iterator.next().value;

        expect(() => {
          first.secret = "HACKED";
        }).toThrow("Cannot modify property 'secret' on global 'arr[]' (read-only)");
      });

      it("should wrap values when iterating inside interpreter", () => {
        const interpreter = new Interpreter({
          globals: { arr: [{ secret: "TOP" }] },
        });

        expect(() => {
          interpreter.evaluate(`
            const obj = [...arr][0];
            obj.secret = "HACKED";
          `);
        }).toThrow("Cannot modify property 'secret' on global 'arr[]' (read-only)");
      });

      it("should wrap values yielded by async iterators", async () => {
        async function* gen() {
          yield { secret: "TOP" };
        }

        const wrapped = ReadOnlyProxy.wrap(gen(), "gen");
        const iterator = (wrapped as any)[Symbol.asyncIterator]();
        const result = await iterator.next();

        expect(() => {
          result.value.secret = "HACKED";
        }).toThrow("Cannot modify property 'secret' on global 'gen[]' (read-only)");
      });
    });

    describe("Reflect API bypass prevention", () => {
      it("should block Reflect.set", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Reflect.set(wrapped, "value", 100);
        }).toThrow("Cannot modify property 'value' on global 'obj' (read-only)");
      });

      it("should block Reflect.get with dangerous properties", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Reflect.get(wrapped, "__proto__");
        }).toThrow("Cannot access __proto__ on global 'obj'");
      });

      it("should block Reflect.defineProperty", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Reflect.defineProperty(wrapped, "newProp", { value: 100 });
        }).toThrow("Cannot define property 'newProp' on global 'obj' (read-only)");
      });

      it("should block Reflect.setPrototypeOf", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          Reflect.setPrototypeOf(wrapped, {});
        }).toThrow("Cannot set prototype of global 'obj' (read-only)");
      });

      it("should return null for Reflect.getPrototypeOf", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const proto = Reflect.getPrototypeOf(wrapped);
        expect(proto).toBe(null);
      });
    });

    describe("Computed property access", () => {
      it("should block computed __proto__ access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const propName = "__proto__";
        expect(() => {
          void (wrapped as any)[propName];
        }).toThrow("Cannot access __proto__ on global 'obj'");
      });

      it("should block computed constructor access", () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        const propName = "constructor";
        expect(() => {
          void (wrapped as any)[propName];
        }).toThrow("Cannot access constructor on global 'obj'");
      });
    });

    describe("valueOf() exploit prevention", () => {
      it("should allow valueOf() but return wrapped value that cannot bypass proxy", () => {
        const testObj = { secret: "CONFIDENTIAL" };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        // valueOf() is allowed for primitive coercion but returns a wrapped proxy
        const valueOfFn = (wrapped as any).valueOf;
        expect(typeof valueOfFn).toBe("function");
        const result = valueOfFn();
        // Result should be wrapped - not the raw testObj
        expect(result).not.toBe(testObj);
        // But should have the same property accessible (read-only)
        expect(result.secret).toBe("CONFIDENTIAL");
      });

      it("should prevent modification via valueOf() - result is wrapped", () => {
        const testObj = { secret: "CONFIDENTIAL" };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        // valueOf() returns a wrapped object, modifications are blocked
        expect(() => {
          interpreter.evaluate("obj.valueOf().secret = 'HACKED'");
        }).toThrow();

        // Original object should remain unmodified
        expect(testObj.secret).toBe("CONFIDENTIAL");
      });

      it("should block hasOwnProperty() which could probe internal state", () => {
        const testObj = { secret: "CONFIDENTIAL" };
        const interpreter = new Interpreter({ globals: { obj: testObj } });

        expect(() => {
          interpreter.evaluate("obj.hasOwnProperty('secret')");
        }).toThrow("Cannot access hasOwnProperty on global 'obj'");
      });
    });

    describe("unwrapForNative security - host object immutability", () => {
      class SecretClass {
        value = 1;
      }

      it("should prevent Object.defineProperty from mutating wrapped host instance", () => {
        const secret = new SecretClass();
        const interpreter = new Interpreter({ globals: { secret } });

        expect(() => {
          interpreter.evaluate('Object.defineProperty(secret, "value", { value: 99 })');
        }).toThrow();

        expect(secret.value).toBe(1);
      });

      it("should prevent Object.defineProperty from adding new properties to wrapped host instance", () => {
        const secret = { existing: "value" };
        const interpreter = new Interpreter({ globals: { secret } });

        expect(() => {
          interpreter.evaluate('Object.defineProperty(secret, "newProp", { value: "hacked" })');
        }).toThrow();

        expect((secret as any).newProp).toBeUndefined();
      });

      it("should prevent Object.assign from mutating wrapped host instance", () => {
        const target = { a: 1 };
        const interpreter = new Interpreter({ globals: { target } });

        expect(() => {
          interpreter.evaluate("Object.assign(target, { b: 2 })");
        }).toThrow();

        expect((target as any).b).toBeUndefined();
      });

      it("should prevent Object.setPrototypeOf from mutating wrapped host instance", () => {
        const secret = new SecretClass();
        const interpreter = new Interpreter({ globals: { secret } });

        expect(() => {
          interpreter.evaluate("Object.setPrototypeOf(secret, null)");
        }).toThrow();

        expect(Object.getPrototypeOf(secret)).toBe(SecretClass.prototype);
      });

      it("should prevent Object.defineProperties from mutating wrapped host instance", () => {
        const secret = { a: 1 };
        const interpreter = new Interpreter({ globals: { secret } });

        expect(() => {
          interpreter.evaluate("Object.defineProperties(secret, { b: { value: 2 } })");
        }).toThrow();

        expect((secret as any).b).toBeUndefined();
      });
    });

    describe("unwrapForNative compatibility - TypedArray/ArrayBuffer", () => {
      it("should allow TextDecoder to decode Uint8Array", () => {
        const encoder = new TextEncoder();
        const encoded = encoder.encode("hello");
        const decoder = new TextDecoder();

        const interpreter = new Interpreter({ globals: { encoded, decoder } });
        const result = interpreter.evaluate("decoder.decode(encoded)");

        expect(result).toBe("hello");
      });

      it("should allow Uint8Array methods to work through proxy", () => {
        const arr = new Uint8Array([1, 2, 3]);
        const interpreter = new Interpreter({ globals: { arr } });

        const result = interpreter.evaluate("arr.slice(1)");
        expect(Array.from(result)).toEqual([2, 3]);
      });

      it("should allow ArrayBuffer to be used with typed arrays", () => {
        const buffer = new ArrayBuffer(16);
        const Uint8ArrayConstructor = Uint8Array;
        const interpreter = new Interpreter({
          globals: { buffer, Uint8Array: Uint8ArrayConstructor },
        });

        const view = interpreter.evaluate("new Uint8Array(buffer)");
        expect(view.byteLength).toBe(16);
      });
    });
  });
});
