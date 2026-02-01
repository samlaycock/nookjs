import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Host Constructors", () => {
  describe("API", () => {
    describe("Basic constructor invocation with new", () => {
      it("should call host constructor with new operator", () => {
        class MyClass {
          value: number;
          constructor(value: number) {
            this.value = value;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        const result = interpreter.evaluate(`
        const instance = new MyClass(42);
        instance.value
      `);
        expect(result).toBe(42);
      });

      it("should call host constructor with multiple arguments", () => {
        class Point {
          x: number;
          y: number;
          constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Point,
          },
        });

        const result = interpreter.evaluate(`
        const p = new Point(10, 20);
        p.x + p.y
      `);
        expect(result).toBe(30);
      });

      it("should call host constructor with no arguments", () => {
        class Counter {
          count: number;
          constructor() {
            this.count = 0;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Counter,
          },
        });

        const result = interpreter.evaluate(`
        const c = new Counter();
        c.count
      `);
        expect(result).toBe(0);
      });

      it("should create independent instances from host constructor", () => {
        class Box {
          value: number;
          constructor(value: number) {
            this.value = value;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Box,
          },
        });

        const result = interpreter.evaluate(`
        const a = new Box(1);
        const b = new Box(2);
        a.value + b.value
      `);
        expect(result).toBe(3);
      });

      it("should work with native JavaScript constructors", () => {
        const interpreter = new Interpreter({
          globals: {
            Map: Map,
          },
        });

        const result = interpreter.evaluate(`
        const m = new Map();
        m.set('key', 'value');
        m.get('key')
      `);
        expect(result).toBe("value");
      });

      it("should work with Set constructor", () => {
        const interpreter = new Interpreter({
          globals: {
            Set: Set,
          },
        });

        const result = interpreter.evaluate(`
        const s = new Set();
        s.add(1);
        s.add(2);
        s.add(1);
        s.size
      `);
        expect(result).toBe(2);
      });

      it("should work with Date constructor", () => {
        const interpreter = new Interpreter({
          globals: {
            Date: Date,
          },
        });

        const result = interpreter.evaluate(`
        const d = new Date(2024, 0, 15);
        d.getFullYear()
      `);
        expect(result).toBe(2024);
      });

      it("should work with RegExp constructor", () => {
        const interpreter = new Interpreter({
          globals: {
            RegExp: RegExp,
          },
        });

        const result = interpreter.evaluate(`
        const re = new RegExp('hello', 'i');
        re.test('Hello World')
      `);
        expect(result).toBe(true);
      });
    });

    describe("Host constructor with methods", () => {
      it("should access methods on instances created from host constructor", () => {
        class Calculator {
          value: number;
          constructor(initial: number) {
            this.value = initial;
          }
          add(n: number) {
            return this.value + n;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Calculator,
          },
        });

        const result = interpreter.evaluate(`
        const calc = new Calculator(10);
        calc.add(5)
      `);
        expect(result).toBe(15);
      });

      it("should chain method calls on host constructor instances", () => {
        class Builder {
          parts: string[];
          constructor() {
            this.parts = [];
          }
          add(part: string) {
            this.parts.push(part);
            return this;
          }
          build() {
            return this.parts.join("-");
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Builder,
          },
        });

        const result = interpreter.evaluate(`
        const b = new Builder();
        b.add('a').add('b').add('c').build()
      `);
        expect(result).toBe("a-b-c");
      });
    });

    describe("Host constructor return value isolation", () => {
      it("should protect returned instance from property modification", () => {
        class Data {
          value: number;
          constructor(value: number) {
            this.value = value;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Data,
          },
        });

        expect(() => {
          interpreter.evaluate(`
          const d = new Data(42);
          d.value = 100;
        `);
        }).toThrow();
      });

      it("should protect nested objects in constructor instances", () => {
        class Config {
          settings: { debug: boolean };
          constructor() {
            this.settings = { debug: false };
          }
        }

        const interpreter = new Interpreter({
          globals: {
            Config,
          },
        });

        expect(() => {
          interpreter.evaluate(`
          const c = new Config();
          c.settings.debug = true;
        `);
        }).toThrow();
      });
    });

    describe("Async host constructors", () => {
      it("should work with host constructors in async mode", async () => {
        class AsyncData {
          value: number;
          constructor(value: number) {
            this.value = value;
          }
        }

        const interpreter = new Interpreter({
          globals: {
            AsyncData,
          },
        });

        const result = await interpreter.evaluateAsync(`
        const d = new AsyncData(42);
        d.value
      `);
        expect(result).toBe(42);
      });
    });

    describe("Promise constructor support", () => {
      it("should support new Promise() with resolve", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        // Use await inside sandbox to get resolved value
        const result = await interpreter.evaluateAsync(`
        async function test() {
          return await new Promise((resolve) => {
            resolve(42);
          });
        }
        test()
      `);
        expect(result).toBe(42);
      });

      it("should support new Promise() with reject", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
            Error, // Need Error constructor for rejection
          },
        });

        return expect(
          interpreter.evaluateAsync(`
          async function test() {
            return await new Promise((resolve, reject) => {
              reject(new Error('test error'));
            });
          }
          test()
        `),
        ).rejects.toThrow("test error");
      });

      it("should support Promise.resolve()", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          return await Promise.resolve(42);
        }
        test()
      `);
        expect(result).toBe(42);
      });

      it("should support Promise.reject()", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
            Error,
          },
        });

        return expect(
          interpreter.evaluateAsync(`
          async function test() {
            return await Promise.reject(new Error('rejected'));
          }
          test()
        `),
        ).rejects.toThrow("rejected");
      });

      it("should support await with Promise", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          const value = await Promise.resolve(42);
          return value * 2;
        }
        test()
      `);
        expect(result).toBe(84);
      });

      it("should support try/catch with rejected Promise", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
            Error,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          try {
            await Promise.reject(new Error('fail'));
            return 'should not reach';
          } catch (e) {
            return 'caught: ' + e.message;
          }
        }
        test()
      `);
        expect(result).toBe("caught: fail");
      });

      it("should support Promise.all() with await", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          return await Promise.all([
            Promise.resolve(1),
            Promise.resolve(2),
            Promise.resolve(3)
          ]);
        }
        test()
      `);
        expect(result).toEqual([1, 2, 3]);
      });

      it("should support Promise.race() with await", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          return await Promise.race([
            Promise.resolve('first'),
            Promise.resolve('second')
          ]);
        }
        test()
      `);
        expect(result).toBe("first");
      });

      it("should support Promise with async host callback", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
            asyncDouble: async (x: number) => x * 2,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          const doubled = await asyncDouble(21);
          return doubled;
        }
        test()
      `);
        expect(result).toBe(42);
      });

      it("should support chained awaits with Promise", async () => {
        const interpreter = new Interpreter({
          globals: {
            Promise,
          },
        });

        const result = await interpreter.evaluateAsync(`
        async function test() {
          const a = await Promise.resolve(10);
          const b = await Promise.resolve(20);
          const c = await Promise.resolve(12);
          return a + b + c;
        }
        test()
      `);
        expect(result).toBe(42);
      });
    });

    describe("Static method access on host constructors", () => {
      it("should access Array.isArray()", () => {
        const interpreter = new Interpreter({
          globals: {
            Array,
          },
        });

        expect(interpreter.evaluate("Array.isArray([1, 2, 3])")).toBe(true);
        expect(interpreter.evaluate("Array.isArray('not array')")).toBe(false);
      });

      it("should access Array.from()", () => {
        const interpreter = new Interpreter({
          globals: {
            Array,
            Set,
          },
        });

        const result = interpreter.evaluate(`
        const s = new Set([1, 2, 3]);
        Array.from(s)
      `);
        expect(result).toEqual([1, 2, 3]);
      });

      it("should access Object.keys()", () => {
        const interpreter = new Interpreter({
          globals: {
            Object,
          },
        });

        const result = interpreter.evaluate(`
        Object.keys({ a: 1, b: 2, c: 3 })
      `);
        expect(result).toEqual(["a", "b", "c"]);
      });

      it("should access Object.values()", () => {
        const interpreter = new Interpreter({
          globals: {
            Object,
          },
        });

        const result = interpreter.evaluate(`
        Object.values({ a: 1, b: 2, c: 3 })
      `);
        expect(result).toEqual([1, 2, 3]);
      });

      it("should access Object.entries()", () => {
        const interpreter = new Interpreter({
          globals: {
            Object,
          },
        });

        const result = interpreter.evaluate(`
        Object.entries({ a: 1, b: 2 })
      `);
        expect(result).toEqual([
          ["a", 1],
          ["b", 2],
        ]);
      });

      it("should access Number.isInteger()", () => {
        const interpreter = new Interpreter({
          globals: {
            Number,
          },
        });

        expect(interpreter.evaluate("Number.isInteger(42)")).toBe(true);
        expect(interpreter.evaluate("Number.isInteger(42.5)")).toBe(false);
      });

      it("should access Number.isNaN()", () => {
        const interpreter = new Interpreter({
          globals: {
            Number,
          },
        });

        expect(interpreter.evaluate("Number.isNaN(NaN)")).toBe(true);
        expect(interpreter.evaluate("Number.isNaN(42)")).toBe(false);
      });

      it("should access String.fromCharCode()", () => {
        const interpreter = new Interpreter({
          globals: {
            String,
          },
        });

        const result = interpreter.evaluate("String.fromCharCode(65, 66, 67)");
        expect(result).toBe("ABC");
      });

      it("should access JSON.stringify()", () => {
        const interpreter = new Interpreter({
          globals: {
            JSON,
          },
        });

        const result = interpreter.evaluate("JSON.stringify({ a: 1, b: 'test' })");
        expect(result).toBe('{"a":1,"b":"test"}');
      });

      it("should access JSON.parse()", () => {
        const interpreter = new Interpreter({
          globals: {
            JSON,
          },
        });

        const result = interpreter.evaluate('JSON.parse(\'{"a":1,"b":"test"}\')');
        expect(result).toEqual({ a: 1, b: "test" });
      });
    });

    describe("Security: host constructor protections", () => {
      it("should block __proto__ access on host constructor instances", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`
          const instance = new MyClass();
          instance.__proto__
        `);
        }).toThrow("__proto__");
      });

      it("should block constructor property access on host constructor instances", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`
          const instance = new MyClass();
          instance.constructor
        `);
        }).toThrow("constructor");
      });

      it("should block prototype access on host constructor", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`MyClass.prototype`);
        }).toThrow("prototype");
      });

      it("should block toString access on host constructor", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`MyClass.toString`);
        }).toThrow("toString");
      });

      it("should block apply/call/bind on host constructor", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`MyClass.apply`);
        }).toThrow("apply");

        expect(() => {
          interpreter.evaluate(`MyClass.call`);
        }).toThrow("call");

        expect(() => {
          interpreter.evaluate(`MyClass.bind`);
        }).toThrow("bind");
      });

      it("should not allow modifying host constructor", () => {
        class MyClass {
          value = 42;
        }

        const interpreter = new Interpreter({
          globals: {
            MyClass,
          },
        });

        expect(() => {
          interpreter.evaluate(`MyClass.newProp = 123`);
        }).toThrow();
      });
    });
  });
});
