import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("instanceof operator", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("With host constructors", () => {
    test("returns true for array instanceof Array", () => {
      expect(
        interpreter.evaluate("[1, 2, 3] instanceof Array", {
          globals: { Array },
        }),
      ).toBe(true);
    });

    test("returns false for non-instance", () => {
      expect(interpreter.evaluate("({}) instanceof Array", { globals: { Array } })).toBe(false);
    });

    test("works with Object", () => {
      expect(
        interpreter.evaluate("({a: 1}) instanceof Object", {
          globals: { Object },
        }),
      ).toBe(true);
    });

    test("arrays are also instances of Object", () => {
      expect(interpreter.evaluate("[] instanceof Object", { globals: { Object } })).toBe(true);
    });

    test("works with Date", () => {
      expect(
        interpreter.evaluate("new Date() instanceof Date", {
          globals: { Date },
        }),
      ).toBe(true);
    });

    test("works with Error", () => {
      expect(
        interpreter.evaluate("new Error('test') instanceof Error", {
          globals: { Error },
        }),
      ).toBe(true);
    });
  });

  describe("Primitives", () => {
    test("number is not instanceof Number", () => {
      expect(interpreter.evaluate("5 instanceof Number", { globals: { Number } })).toBe(false);
    });

    test("string is not instanceof String", () => {
      expect(
        interpreter.evaluate("'hello' instanceof String", {
          globals: { String },
        }),
      ).toBe(false);
    });

    test("boolean is not instanceof Boolean", () => {
      expect(
        interpreter.evaluate("true instanceof Boolean", {
          globals: { Boolean },
        }),
      ).toBe(false);
    });

    test("null is not instanceof Object", () => {
      expect(interpreter.evaluate("null instanceof Object", { globals: { Object } })).toBe(false);
    });

    test("undefined is not instanceof Object", () => {
      expect(
        interpreter.evaluate("undefined instanceof Object", {
          globals: { Object },
        }),
      ).toBe(false);
    });
  });

  describe("Error cases", () => {
    test("throws when right side is not a function (number)", () => {
      expect(() => {
        interpreter.evaluate("[] instanceof 5");
      }).toThrow("Right-hand side of 'instanceof' is not callable");
    });

    test("throws when right side is an object", () => {
      expect(() => {
        interpreter.evaluate("[] instanceof ({})");
      }).toThrow("Right-hand side of 'instanceof' is not callable");
    });

    test("throws when right side is null", () => {
      expect(() => {
        interpreter.evaluate("[] instanceof null");
      }).toThrow("Right-hand side of 'instanceof' is not callable");
    });

    test("throws when right side is undefined", () => {
      expect(() => {
        interpreter.evaluate("[] instanceof undefined");
      }).toThrow("Right-hand side of 'instanceof' is not callable");
    });

    test("throws when right side is a string", () => {
      expect(() => {
        interpreter.evaluate("[] instanceof 'string'");
      }).toThrow("Right-hand side of 'instanceof' is not callable");
    });
  });

  describe("Practical examples", () => {
    test("type checking in conditionals", () => {
      const result = interpreter.evaluate(
        `
        let arr = [1, 2, 3];
        if (arr instanceof Array) {
          'is an array';
        } else {
          'not an array';
        }
      `,
        { globals: { Array } },
      );
      expect(result).toBe("is an array");
    });

    test("works with logical operators", () => {
      expect(
        interpreter.evaluate("[] instanceof Array || ({}) instanceof Array", {
          globals: { Array },
        }),
      ).toBe(true);
      expect(
        interpreter.evaluate("[] instanceof Array && ({}) instanceof Array", {
          globals: { Array },
        }),
      ).toBe(false);
    });

    test("works with negation", () => {
      expect(interpreter.evaluate("!(5 instanceof Number)", { globals: { Number } })).toBe(true);
    });

    test("chained instanceof checks", () => {
      const result = interpreter.evaluate(
        `
        let val = [];
        val instanceof Array && val instanceof Object;
      `,
        { globals: { Array, Object } },
      );
      expect(result).toBe(true);
    });
  });

  describe("Async evaluation", () => {
    test("works with async evaluation", async () => {
      const result = await interpreter.evaluateAsync("[1,2,3] instanceof Array", {
        globals: { Array },
      });
      expect(result).toBe(true);
    });

    test("async with object check", async () => {
      const result = await interpreter.evaluateAsync("({a:1}) instanceof Object", {
        globals: { Object },
      });
      expect(result).toBe(true);
    });
  });

  describe("Edge cases", () => {
    test("works with arrow functions as constructor check", () => {
      // Arrow functions are not constructors but are still functions
      // instanceof should still accept them on the right side
      expect(interpreter.evaluate("[] instanceof (() => {})", { globals: {} })).toBe(false);
    });

    test("works with nested arrays", () => {
      expect(
        interpreter.evaluate("[[1, 2], [3, 4]][0] instanceof Array", {
          globals: { Array },
        }),
      ).toBe(true);
    });

    test("works with new expression result", () => {
      expect(
        interpreter.evaluate("new Date() instanceof Date", {
          globals: { Date },
        }),
      ).toBe(true);
    });
  });
});
