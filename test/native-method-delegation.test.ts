import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Native Method Delegation", () => {
  describe("API", () => {
    describe("String methods (delegated)", () => {
      it("should support replaceAll", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"aabbcc".replaceAll("b", "x")`);
        expect(result).toBe("aaxxcc");
      });

      it("should support charCodeAt", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"A".charCodeAt(0)`);
        expect(result).toBe(65);
      });

      it("should support codePointAt", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"A".codePointAt(0)`);
        expect(result).toBe(65);
      });

      it("should support concat", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"hello".concat(" ", "world")`);
        expect(result).toBe("hello world");
      });

      it("should support search", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"hello world".search("world")`);
        expect(result).toBe(6);
      });

      it("should support at", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"hello".at(-1)`);
        expect(result).toBe("o");
      });

      it("should support normalize", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"hello".normalize()`);
        expect(result).toBe("hello");
      });

      it("should support localeCompare", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`"a".localeCompare("b")`);
        expect(result).toBe(-1);
      });
    });

    describe("Array methods (delegated)", () => {
      it("should support copyWithin", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
        const arr = [1, 2, 3, 4, 5];
        arr.copyWithin(0, 3);
        arr;
      `);
        expect(result).toEqual([4, 5, 3, 4, 5]);
      });
    });

    describe("Other primitives (delegated)", () => {
      it("should support number prototype methods", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`(123.456).toFixed(1)`);
        expect(result).toBe("123.5");
      });

      it("should support computed number prototype methods", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`(123.456)["toFixed"](2)`);
        expect(result).toBe("123.46");
      });

      it("should allow safe symbol properties", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
        const sym = Symbol("token");
        sym.description;
      `);
        expect(result).toBe("token");
      });

      it("should block dangerous primitive properties", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`(1n)["toString"]()`)).toThrow();
        expect(() => interpreter.evaluate(`(true)["valueOf"]()`)).toThrow();
        expect(() => interpreter.evaluate(`(Symbol("x"))["toString"]()`)).toThrow();
      });
    });

    describe("Injected globals (delegated)", () => {
      it("should allow prototype methods on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        const result = interpreter.evaluate(`date.getUTCFullYear()`);
        expect(result).toBe(2020);
      });

      it("should allow computed method access on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        const result = interpreter.evaluate(`date["getUTCFullYear"]()`);
        expect(result).toBe(2020);
      });

      it("should allow own properties on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z") as Date & {
          label?: string;
        };
        date.label = "release";
        const interpreter = new Interpreter({ globals: { date } });
        const result = interpreter.evaluate(`date.label`);
        expect(result).toBe("release");
      });

      it("should block dangerous properties on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        expect(() => interpreter.evaluate(`date.constructor`)).toThrow();
      });
    });

    describe("User-created objects (security)", () => {
      it("should block prototype access on plain objects", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`({}).toString`)).toThrow();
      });

      it("should allow own properties on plain objects", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
        const obj = { custom: () => 42 };
        obj.custom();
      `);
        expect(result).toBe(42);
      });
    });

    describe("Optional chaining with safe targets", () => {
      it("should allow optional chaining on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        const result = interpreter.evaluate(`date?.getUTCFullYear()`);
        expect(result).toBe(2020);
      });

      it("should allow optional chaining with computed access on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        const result = interpreter.evaluate(`date?.["getUTCFullYear"]()`);
        expect(result).toBe(2020);
      });

      it("should allow optional chaining on primitives", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`(123.4)?.toFixed(0)`);
        expect(result).toBe("123");
      });

      it("should allow optional chaining with computed access on primitives", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`(123.4)?.["toFixed"](1)`);
        expect(result).toBe("123.4");
      });

      it("should short-circuit optional chaining on undefined", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`undefined?.toString`);
        expect(result).toBeUndefined();
      });
    });

    describe("Security", () => {
      it("should block dangerous symbol properties on injected instances", () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        expect(() => interpreter.evaluate(`date[Symbol.toStringTag]`)).toThrow();
      });

      it("should block dangerous symbol properties on primitives", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`(Symbol("x"))[Symbol.toStringTag]`)).toThrow();
      });

      it("should block dangerous properties on strings", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`"hello".constructor`)).toThrow();
      });

      it("should block dangerous properties on arrays", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`[1,2,3].constructor`)).toThrow();
      });

      it("should block __proto__ on strings", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`"hello".__proto__`)).toThrow();
      });

      it("should block __proto__ on arrays", () => {
        const interpreter = new Interpreter();
        expect(() => interpreter.evaluate(`[1,2,3].__proto__`)).toThrow();
      });
    });

    describe("Explicit methods still work", () => {
      it("should still use explicit string methods", () => {
        const interpreter = new Interpreter();
        expect(interpreter.evaluate(`"hello".toUpperCase()`)).toBe("HELLO");
        expect(interpreter.evaluate(`"hello world".split(" ")`)).toEqual(["hello", "world"]);
        expect(interpreter.evaluate(`"  hello  ".trim()`)).toBe("hello");
      });

      it("should still use explicit array methods with callbacks", () => {
        const interpreter = new Interpreter();
        expect(interpreter.evaluate(`[1,2,3].map(x => x * 2)`)).toEqual([2, 4, 6]);
        expect(interpreter.evaluate(`[1,2,3].filter(x => x > 1)`)).toEqual([2, 3]);
        expect(interpreter.evaluate(`[1,2,3].reduce((a, b) => a + b, 0)`)).toBe(6);
      });

      it("should still use explicit methods via computed access", () => {
        const interpreter = new Interpreter();
        expect(interpreter.evaluate(`"hi"["split"]("i")`)).toEqual(["h", ""]);
        expect(() => interpreter.evaluate(`[1,2,3]["map"](x => x * 2)`)).toThrow(
          "Array index must be a number",
        );
      });
    });

    describe("Async evaluation parity", () => {
      it("should support injected instance methods with evaluateAsync", async () => {
        const date = new Date("2020-01-01T00:00:00.000Z");
        const interpreter = new Interpreter({ globals: { date } });
        const result = await interpreter.evaluateAsync(`date.getUTCFullYear()`);
        expect(result).toBe(2020);
      });

      it("should support primitive methods with evaluateAsync", async () => {
        const interpreter = new Interpreter();
        const result = await interpreter.evaluateAsync(`(123.4).toFixed(1)`);
        expect(result).toBe("123.4");
      });
    });
  });
});
