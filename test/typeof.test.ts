import { describe, expect, it } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("typeof Operator", () => {
  describe("Primitive types", () => {
    it("should return 'number' for numbers", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof 42")).toBe("number");
      expect(interpreter.evaluate("typeof 3.14")).toBe("number");
      expect(interpreter.evaluate("typeof 0")).toBe("number");
      expect(interpreter.evaluate("typeof -5")).toBe("number");
    });

    it("should return 'string' for strings", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate('typeof "hello"')).toBe("string");
      expect(interpreter.evaluate('typeof ""')).toBe("string");
      expect(interpreter.evaluate("typeof 'world'")).toBe("string");
    });

    it("should return 'boolean' for booleans", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof true")).toBe("boolean");
      expect(interpreter.evaluate("typeof false")).toBe("boolean");
    });

    it("should return 'undefined' for undefined", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x");
      expect(interpreter.evaluate("typeof x")).toBe("undefined");
    });

    it("should return 'object' for null", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = null");
      // This matches JavaScript behavior (typeof null === "object")
      expect(interpreter.evaluate("typeof x")).toBe("object");
    });
  });

  describe("Complex types", () => {
    it("should return 'object' for objects", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let obj = { a: 1 }");
      expect(interpreter.evaluate("typeof obj")).toBe("object");
    });

    it("should return 'object' for arrays", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let arr = [1, 2, 3]");
      expect(interpreter.evaluate("typeof arr")).toBe("object");
    });

    it("should return 'function' for functions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("function test() { return 42; }");
      expect(interpreter.evaluate("typeof test")).toBe("function");
    });

    it("should return 'function' for arrow functions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let arrow = x => x * 2");
      expect(interpreter.evaluate("typeof arrow")).toBe("function");
    });
  });

  describe("With variables", () => {
    it("should work with declared variables", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let num = 42");
      interpreter.evaluate('let str = "hello"');
      interpreter.evaluate("let bool = true");
      expect(interpreter.evaluate("typeof num")).toBe("number");
      expect(interpreter.evaluate("typeof str")).toBe("string");
      expect(interpreter.evaluate("typeof bool")).toBe("boolean");
    });

    it("should work with undefined variables", () => {
      const interpreter = new Interpreter();
      // typeof on undefined variable should return "undefined", not throw
      expect(interpreter.evaluate("typeof undefinedVar")).toBe("undefined");
      expect(interpreter.evaluate("typeof neverDeclared")).toBe("undefined");
    });

    it("should work with const variables", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("const PI = 3.14");
      expect(interpreter.evaluate("typeof PI")).toBe("number");
    });
  });

  describe("With expressions", () => {
    it("should work with arithmetic expressions", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof (5 + 3)")).toBe("number");
      expect(interpreter.evaluate("typeof (10 - 2)")).toBe("number");
      expect(interpreter.evaluate("typeof (3 * 4)")).toBe("number");
    });

    it("should work with comparison expressions", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof (5 > 3)")).toBe("boolean");
      expect(interpreter.evaluate("typeof (10 === 10)")).toBe("boolean");
    });

    it("should work with logical expressions", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof (true && false)")).toBe("boolean");
      expect(interpreter.evaluate("typeof (true || false)")).toBe("boolean");
    });

    it("should work with string concatenation", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate('typeof ("hello" + " world")')).toBe("string");
    });

    it("should work with ternary expressions", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("typeof (true ? 42 : 'string')")).toBe("number");
      expect(interpreter.evaluate('typeof (false ? 42 : "string")')).toBe("string");
    });
  });

  describe("With function calls", () => {
    it("should work with function return values", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("function getNumber() { return 42; }");
      interpreter.evaluate('function getString() { return "hello"; }');
      expect(interpreter.evaluate("typeof getNumber()")).toBe("number");
      expect(interpreter.evaluate("typeof getString()")).toBe("string");
    });

    it("should work with function expressions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let fn = function() { return true; }");
      expect(interpreter.evaluate("typeof fn()")).toBe("boolean");
    });

    it("should work with arrow function returns", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let double = x => x * 2");
      expect(interpreter.evaluate("typeof double(5)")).toBe("number");
    });
  });

  describe("With host functions", () => {
    it("should return 'function' for host functions", () => {
      const hostFunc = () => 42;
      const interpreter = new Interpreter({
        globals: { hostFunc },
      });
      expect(interpreter.evaluate("typeof hostFunc")).toBe("function");
    });

    it("should work with host function return values", () => {
      const getNumber = () => 42;
      const getString = () => "hello";
      const interpreter = new Interpreter({
        globals: { getNumber, getString },
      });
      expect(interpreter.evaluate("typeof getNumber()")).toBe("number");
      expect(interpreter.evaluate("typeof getString()")).toBe("string");
    });
  });

  describe("In control flow", () => {
    it("should work in if statements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 42;
        let result;
        if (typeof x === "number") {
          result = "is number";
        } else {
          result = "not number";
        }
        result
      `);
      expect(result).toBe("is number");
    });

    it("should work in loops", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let values = [42, "hello", true, null];
        let types = [];
        for (let i = 0; i < values.length; i++) {
          types[i] = typeof values[i];
        }
        types
      `);
      expect(result).toEqual(["number", "string", "boolean", "object"]);
    });

    it("should work in ternary expressions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 42");
      const result = interpreter.evaluate('typeof x === "number" ? "numeric" : "non-numeric"');
      expect(result).toBe("numeric");
    });
  });

  describe("In return statements", () => {
    it("should work in function returns", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        function getType(val) {
          return typeof val;
        }
      `);
      expect(interpreter.evaluate("getType(42)")).toBe("number");
      expect(interpreter.evaluate('getType("hello")')).toBe("string");
      expect(interpreter.evaluate("getType(true)")).toBe("boolean");
    });

    it("should work with arrow functions", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let getType = val => typeof val");
      expect(interpreter.evaluate("getType(42)")).toBe("number");
    });
  });

  describe("Type guards", () => {
    it("should enable type checking patterns", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function safeAdd(a, b) {
          if (typeof a === "number" && typeof b === "number") {
            return a + b;
          }
          return 0;
        }
        safeAdd(5, 3)
      `);
      expect(result).toBe(8);
    });

    it("should work with string type guards", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function isString(val) {
          return typeof val === "string";
        }
        isString("hello")
      `);
      expect(result).toBe(true);
    });

    it("should work with function detection", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function isFunction(val) {
          return typeof val === "function";
        }
        let fn = x => x * 2;
        isFunction(fn)
      `);
      expect(result).toBe(true);
    });
  });

  describe("Async support", () => {
    it("should work with evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("typeof 42");
      expect(result).toBe("number");
    });

    it("should work with async host functions", async () => {
      const asyncGetNumber = async () => 42;
      const interpreter = new Interpreter({
        globals: { asyncGetNumber },
      });
      const result = await interpreter.evaluateAsync("typeof asyncGetNumber()");
      expect(result).toBe("number");
    });

    it("should work in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function checkType(val) {
          return typeof val;
        }
        checkType(42)
      `);
      expect(result).toBe("number");
    });

    it("should work with undefined in async", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync("typeof undefinedVar");
      expect(result).toBe("undefined");
    });
  });

  describe("Edge cases", () => {
    it("should handle typeof typeof", () => {
      const interpreter = new Interpreter();
      // typeof always returns a string, so typeof (typeof x) is always "string"
      expect(interpreter.evaluate("typeof (typeof 42)")).toBe("string");
    });

    it("should work with property access", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let obj = { num: 42, str: 'hello' }");
      expect(interpreter.evaluate("typeof obj.num")).toBe("number");
      expect(interpreter.evaluate("typeof obj.str")).toBe("string");
    });

    it("should work with array elements", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let arr = [42, 'hello', true]");
      expect(interpreter.evaluate("typeof arr[0]")).toBe("number");
      expect(interpreter.evaluate("typeof arr[1]")).toBe("string");
      expect(interpreter.evaluate("typeof arr[2]")).toBe("boolean");
    });

    it("should work as function argument", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        function logType(type) {
          return type;
        }
      `);
      expect(interpreter.evaluate("logType(typeof 42)")).toBe("number");
    });

    it("should work in object literals", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 42");
      const result = interpreter.evaluate("let obj = { type: typeof x }; obj");
      expect(result).toEqual({ type: "number" });
    });

    it("should work in array literals", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 42");
      interpreter.evaluate('let y = "hello"');
      const result = interpreter.evaluate("[typeof x, typeof y]");
      expect(result).toEqual(["number", "string"]);
    });
  });
});
