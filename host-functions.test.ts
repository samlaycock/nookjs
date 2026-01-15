import { describe, it, expect } from "bun:test";
import { Interpreter } from "./interpreter";

describe("Host Functions", () => {
  describe("Calling sync host functions", () => {
    it("should call host function with no arguments", () => {
      const interpreter = new Interpreter({
        globals: {
          getRandom: () => 42,
        },
      });
      expect(interpreter.evaluate("getRandom()")).toBe(42);
    });

    it("should call host function with single argument", () => {
      const interpreter = new Interpreter({
        globals: {
          double: (x: number) => x * 2,
        },
      });
      expect(interpreter.evaluate("double(5)")).toBe(10);
    });

    it("should call host function with multiple arguments", () => {
      const interpreter = new Interpreter({
        globals: {
          add: (a: number, b: number, c: number) => a + b + c,
        },
      });
      expect(interpreter.evaluate("add(1, 2, 3)")).toBe(6);
    });

    it("should pass sandbox values to host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          multiply: (a: number, b: number) => a * b,
        },
      });
      const result = interpreter.evaluate(`
        let x = 5;
        let y = 3;
        multiply(x, y)
      `);
      expect(result).toBe(15);
    });

    it("should handle various argument types", () => {
      const interpreter = new Interpreter({
        globals: {
          combine: (str: string, num: number, bool: boolean) =>
            `${str}-${num}-${bool}`,
        },
      });
      expect(interpreter.evaluate('combine("hello", 42, true)')).toBe(
        "hello-42-true"
      );
    });

    it("should return various types from host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          getNumber: () => 42,
          getString: () => "hello",
          getBoolean: () => true,
          getNull: () => null,
          getUndefined: () => undefined,
        },
      });
      expect(interpreter.evaluate("getNumber()")).toBe(42);
      expect(interpreter.evaluate("getString()")).toBe("hello");
      expect(interpreter.evaluate("getBoolean()")).toBe(true);
      expect(interpreter.evaluate("getNull()")).toBe(null);
      expect(interpreter.evaluate("getUndefined()")).toBe(undefined);
    });

    it("should return objects from host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          getData: () => ({ value: 100, name: "test" }),
        },
      });
      expect(interpreter.evaluate("getData().value")).toBe(100);
      expect(interpreter.evaluate("getData().name")).toBe("test");
    });

    it("should return arrays from host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          getArray: () => [1, 2, 3, 4, 5],
        },
      });
      expect(interpreter.evaluate("getArray()[0]")).toBe(1);
      expect(interpreter.evaluate("getArray().length")).toBe(5);
    });

    it("should use host function return value in expressions", () => {
      const interpreter = new Interpreter({
        globals: {
          getValue: () => 10,
        },
      });
      expect(interpreter.evaluate("getValue() + 5")).toBe(15);
      expect(interpreter.evaluate("getValue() * 2")).toBe(20);
    });

    it("should call host functions in loops", () => {
      let callCount = 0;
      const interpreter = new Interpreter({
        globals: {
          increment: () => ++callCount,
        },
      });
      interpreter.evaluate(`
        for (let i = 0; i < 5; i++) {
          increment();
        }
      `);
      expect(callCount).toBe(5);
    });

    it("should call host functions in conditionals", () => {
      const interpreter = new Interpreter({
        globals: {
          isPositive: (x: number) => x > 0,
        },
      });
      const result = interpreter.evaluate(`
        let value = 10;
        if (isPositive(value)) {
          value = value * 2;
        }
        value
      `);
      expect(result).toBe(20);
    });
  });

  describe("Host functions with closures", () => {
    it("should call host functions from within sandbox functions", () => {
      const interpreter = new Interpreter({
        globals: {
          multiply: (a: number, b: number) => a * b,
        },
      });
      const result = interpreter.evaluate(`
        function calculate(x) {
          return multiply(x, 2);
        }
        calculate(5)
      `);
      expect(result).toBe(10);
    });

    it("should capture host functions in closures", () => {
      const interpreter = new Interpreter({
        globals: {
          add: (a: number, b: number) => a + b,
        },
      });
      const result = interpreter.evaluate(`
        function makeAdder(x) {
          return function(y) {
            return add(x, y);
          };
        }
        let add5 = makeAdder(5);
        add5(3)
      `);
      expect(result).toBe(8);
    });
  });

  describe("Host functions in data structures", () => {
    it("should store host functions in arrays", () => {
      const interpreter = new Interpreter({
        globals: {
          double: (x: number) => x * 2,
          triple: (x: number) => x * 3,
        },
      });
      const result = interpreter.evaluate(`
        let funcs = [double, triple];
        funcs[0](5) + funcs[1](5)
      `);
      expect(result).toBe(25); // 10 + 15
    });

    it("should store host functions in objects", () => {
      const interpreter = new Interpreter({
        globals: {
          add: (a: number, b: number) => a + b,
          subtract: (a: number, b: number) => a - b,
        },
      });
      const result = interpreter.evaluate(`
        let math = { sum: add, diff: subtract };
        math.sum(10, 5)
      `);
      expect(result).toBe(15);
    });
  });

  describe("Error handling", () => {
    it("should catch errors thrown by host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          throwError: () => {
            throw new Error("Host error");
          },
        },
      });
      expect(() => {
        interpreter.evaluate("throwError()");
      }).toThrow("Host function 'throwError' threw error: Host error");
    });

    it("should include function name in error message", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunction: () => {
            throw new Error("Something went wrong");
          },
        },
      });
      expect(() => {
        interpreter.evaluate("myFunction()");
      }).toThrow("Host function 'myFunction' threw error");
    });
  });

  describe("Per-call host function globals", () => {
    it("should call per-call host functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("calculate(5, 3)", {
        globals: {
          calculate: (a: number, b: number) => a + b,
        },
      });
      expect(result).toBe(8);
    });

    it("should not persist per-call host functions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = getValue()", {
        globals: {
          getValue: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate("getValue()");
      }).toThrow("Undefined variable 'getValue'");
    });

    it("should merge constructor and per-call host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          add: (a: number, b: number) => a + b,
        },
      });
      const result = interpreter.evaluate("add(5, multiply(2, 3))", {
        globals: {
          multiply: (a: number, b: number) => a * b,
        },
      });
      expect(result).toBe(11); // 5 + 6
    });
  });

  describe("Async host function blocking (sync mode)", () => {
    it("should block calling async host functions in sync evaluate()", () => {
      const interpreter = new Interpreter({
        globals: {
          asyncFunc: async () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate("asyncFunc()");
      }).toThrow(
        "Cannot call async host function 'asyncFunc' in synchronous evaluate(). Use evaluateAsync() instead."
      );
    });

    it("should allow accessing async host function as value", () => {
      const asyncFunc = async () => 42;
      const interpreter = new Interpreter({
        globals: {
          myAsyncFunc: asyncFunc,
        },
      });
      // Can assign but not call
      interpreter.evaluate("let f = myAsyncFunc");
      expect(() => {
        interpreter.evaluate("f()");
      }).toThrow("Cannot call async host function");
    });
  });

  describe("Property access blocking", () => {
    it("should prevent accessing properties on host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunc: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate("myFunc.name");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should prevent accessing __proto__ on host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunc: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate('myFunc["__proto__"]');
      }).toThrow("Cannot access properties on host functions");
    });

    it("should prevent accessing constructor on host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunc: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate("myFunc.constructor");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should prevent assigning properties on host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunc: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate("myFunc.customProp = 123");
      }).toThrow("Cannot assign properties on host functions");
    });

    it("should prevent assigning __proto__ on host functions", () => {
      const interpreter = new Interpreter({
        globals: {
          myFunc: () => 42,
        },
      });
      expect(() => {
        interpreter.evaluate('myFunc["__proto__"] = {}');
      }).toThrow("Cannot assign properties on host functions");
    });
  });

  describe("Edge cases", () => {
    it("should handle host functions returning functions", () => {
      const interpreter = new Interpreter({
        globals: {
          makeMultiplier: (factor: number) => (x: number) => x * factor,
        },
      });
      // Returns a host function, but can't be called (not wrapped)
      const result = interpreter.evaluate("makeMultiplier(5)");
      expect(typeof result).toBe("function");
    });

    it("should handle host function with this context", () => {
      const obj = {
        value: 100,
        getValue: function () {
          return this.value;
        },
      };
      const interpreter = new Interpreter({
        globals: {
          getValue: obj.getValue.bind(obj),
        },
      });
      expect(interpreter.evaluate("getValue()")).toBe(100);
    });

    it("should handle host functions with default parameters", () => {
      const interpreter = new Interpreter({
        globals: {
          greet: (name = "World") => `Hello, ${name}!`,
        },
      });
      // Note: Interpreter doesn't support default params, so host must handle
      expect(interpreter.evaluate("greet()")).toBe("Hello, World!");
    });

    it("should handle host functions with rest parameters", () => {
      const interpreter = new Interpreter({
        globals: {
          sum: (...nums: number[]) => nums.reduce((a, b) => a + b, 0),
        },
      });
      expect(interpreter.evaluate("sum(1, 2, 3, 4)")).toBe(10);
    });

    it("should allow calling same host function multiple times", () => {
      let counter = 0;
      const interpreter = new Interpreter({
        globals: {
          increment: () => ++counter,
        },
      });
      expect(interpreter.evaluate("increment()")).toBe(1);
      expect(interpreter.evaluate("increment()")).toBe(2);
      expect(interpreter.evaluate("increment()")).toBe(3);
    });

    it("should handle host functions that modify external state", () => {
      const state = { count: 0 };
      const interpreter = new Interpreter({
        globals: {
          incrementState: () => ++state.count,
          getState: () => state.count,
        },
      });
      interpreter.evaluate("incrementState()");
      interpreter.evaluate("incrementState()");
      expect(interpreter.evaluate("getState()")).toBe(2);
    });
  });

  describe("Sandbox functions still work", () => {
    it("should still call sandbox functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function add(a, b) {
          return a + b;
        }
        add(5, 3)
      `);
      expect(result).toBe(8);
    });

    it("should mix host and sandbox functions", () => {
      const interpreter = new Interpreter({
        globals: {
          hostDouble: (x: number) => x * 2,
        },
      });
      const result = interpreter.evaluate(`
        function sandboxTriple(x) {
          return x * 3;
        }
        hostDouble(5) + sandboxTriple(5)
      `);
      expect(result).toBe(25); // 10 + 15
    });
  });
});
