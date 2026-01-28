import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Computed property names", () => {
  describe("Object literals", () => {
    it("should support variable as computed key", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const key = "hello";
        const obj = { [key]: "world" };
        obj.hello;
      `);
      expect(result).toBe("world");
    });

    it("should support expression as computed key", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { ["a" + "b"]: 42 };
        obj.ab;
      `);
      expect(result).toBe(42);
    });

    it("should support number expression as computed key", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const i = 0;
        const obj = { [i]: "zero", [i + 1]: "one" };
        obj[0] + ":" + obj[1];
      `);
      expect(result).toBe("zero:one");
    });

    it("should support function call as computed key", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function getKey() { return "dynamic"; }
        const obj = { [getKey()]: true };
        obj.dynamic;
      `);
      expect(result).toBe(true);
    });

    it("should mix computed and static keys", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const k = "x";
        const obj = { a: 1, [k]: 2, b: 3 };
        obj.a + obj.x + obj.b;
      `);
      expect(result).toBe(6);
    });

    it("should support template literal as computed key", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(
        'const prefix = `item`; const obj = { [`${prefix}_1`]: "first" }; obj.item_1;',
      );
      expect(result).toBe("first");
    });

    it("should allow computed key to override earlier property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { a: 1, ["a"]: 2 };
        obj.a;
      `);
      expect(result).toBe(2);
    });

    it("should evaluate computed keys in order", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let counter = 0;
        function next() { return "k" + counter++; }
        const obj = { [next()]: "a", [next()]: "b", [next()]: "c" };
        obj.k0 + obj.k1 + obj.k2;
      `);
      expect(result).toBe("abc");
    });
  });

  describe("Computed methods in classes", () => {
    it("should support computed method names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const method = "greet";
        class Foo {
          [method]() { return "hello"; }
        }
        const f = new Foo();
        f.greet();
      `);
      expect(result).toBe("hello");
    });

    it("should support computed static methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const name = "create";
        class Bar {
          static [name]() { return "created"; }
        }
        Bar.create();
      `);
      expect(result).toBe("created");
    });
  });

  describe("Async computed properties", () => {
    it("should support computed keys in async evaluation", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        const key = "value";
        const obj = { [key]: 99 };
        obj.value;
      `);
      expect(result).toBe(99);
    });
  });
});
