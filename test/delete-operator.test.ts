import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("delete operator", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Deleting object properties", () => {
    test("delete existing property returns true", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          delete obj.a;
        `),
      ).toBe(true);
    });

    test("property is removed after delete", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          delete obj.a;
          obj.a;
        `),
      ).toBe(undefined);
    });

    test("other properties remain after delete", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          delete obj.a;
          obj.b;
        `),
      ).toBe(2);
    });

    test("delete non-existing property returns true", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1 };
          delete obj.b;
        `),
      ).toBe(true);
    });

    test("delete with computed property", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          let key = 'a';
          delete obj[key];
          obj.a;
        `),
      ).toBe(undefined);
    });

    test("delete with string literal computed property", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2 };
          delete obj['a'];
          'a' in obj;
        `),
      ).toBe(false);
    });

    test("delete with numeric index on array", () => {
      expect(
        interpreter.evaluate(`
          let arr = [1, 2, 3];
          delete arr[1];
          arr[1];
        `),
      ).toBe(undefined);
    });

    test("array length unchanged after delete", () => {
      expect(
        interpreter.evaluate(`
          let arr = [1, 2, 3];
          delete arr[1];
          arr.length;
        `),
      ).toBe(3);
    });

    test("delete nested property", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: { b: 1 } };
          delete obj.a.b;
          obj.a.b;
        `),
      ).toBe(undefined);
    });

    test("delete preserves parent object", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: { b: 1 } };
          delete obj.a.b;
          typeof obj.a;
        `),
      ).toBe("object");
    });
  });

  describe("Delete on non-object targets", () => {
    test("delete on null throws", () => {
      expect(() => {
        interpreter.evaluate(`
          let obj = null;
          delete obj.a;
        `);
      }).toThrow();
    });

    test("delete on undefined throws", () => {
      expect(() => {
        interpreter.evaluate(`
          let obj = undefined;
          delete obj.a;
        `);
      }).toThrow();
    });
  });

  describe("Delete on identifiers", () => {
    test("delete on variable returns true", () => {
      expect(
        interpreter.evaluate(`
          let x = 5;
          delete x;
        `),
      ).toBe(true);
    });

    test("variable still exists after delete (non-strict)", () => {
      expect(
        interpreter.evaluate(`
          let x = 5;
          delete x;
          x;
        `),
      ).toBe(5);
    });
  });

  describe("Delete on literals", () => {
    test("delete on number literal returns true", () => {
      expect(interpreter.evaluate("delete 5")).toBe(true);
    });

    test("delete on string literal returns true", () => {
      expect(interpreter.evaluate("delete 'hello'")).toBe(true);
    });

    test("delete on boolean literal returns true", () => {
      expect(interpreter.evaluate("delete true")).toBe(true);
    });
  });

  describe("Delete with in operator", () => {
    test("in operator returns false after delete", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2, c: 3 };
          delete obj.b;
          'b' in obj;
        `),
      ).toBe(false);
    });

    test("in operator returns true for remaining properties", () => {
      expect(
        interpreter.evaluate(`
          let obj = { a: 1, b: 2, c: 3 };
          delete obj.b;
          'a' in obj && 'c' in obj;
        `),
      ).toBe(true);
    });
  });

  describe("Async evaluation", () => {
    test("delete works in async context", async () => {
      const result = await interpreter.evaluateAsync(`
        let obj = { a: 1, b: 2 };
        delete obj.a;
        'a' in obj;
      `);
      expect(result).toBe(false);
    });
  });
});
