import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Destructuring", () => {
  describe("Array Destructuring - Basic", () => {
    it("should destructure simple array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, b] = [1, 2];
        a + b
      `);
      expect(result).toBe(3);
    });

    it("should handle missing elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, b, c] = [1, 2];
        c
      `);
      expect(result).toBeUndefined();
    });

    it("should handle extra elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, b] = [1, 2, 3, 4];
        a + b
      `);
      expect(result).toBe(3);
    });

    it("should support holes in pattern", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, , c] = [1, 2, 3];
        a + c
      `);
      expect(result).toBe(4);
    });
  });

  describe("Array Destructuring - Nested", () => {
    it("should destructure nested arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, [b, c]] = [1, [2, 3]];
        a + b + c
      `);
      expect(result).toBe(6);
    });

    it("should handle deeply nested arrays", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a, [b, [c, d]]] = [1, [2, [3, 4]]];
        a + b + c + d
      `);
      expect(result).toBe(10);
    });
  });

  describe("Array Destructuring - Defaults", () => {
    it("should use default values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a = 5, b = 10] = [];
        a + b
      `);
      expect(result).toBe(15);
    });

    it("should only use default when undefined", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [a = 5, b = 10] = [1];
        a + b
      `);
      expect(result).toBe(11);
    });

    it("should evaluate default expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 5;
        let [a = x * 2] = [];
        a
      `);
      expect(result).toBe(10);
    });
  });

  describe("Object Destructuring - Basic", () => {
    it("should destructure simple object", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x, y} = {x: 1, y: 2};
        x + y
      `);
      expect(result).toBe(3);
    });

    it("should handle missing properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x, y, z} = {x: 1, y: 2};
        z
      `);
      expect(result).toBeUndefined();
    });

    it("should handle property renaming", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x: newName} = {x: 5};
        newName
      `);
      expect(result).toBe(5);
    });

    it("should ignore extra properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x} = {x: 1, y: 2, z: 3};
        x
      `);
      expect(result).toBe(1);
    });
  });

  describe("Object Destructuring - Nested", () => {
    it("should destructure nested objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {a: {b}} = {a: {b: 5}};
        b
      `);
      expect(result).toBe(5);
    });

    it("should handle deeply nested objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {a: {b: {c}}} = {a: {b: {c: 10}}};
        c
      `);
      expect(result).toBe(10);
    });
  });

  describe("Object Destructuring - Defaults", () => {
    it("should use default values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x = 5, y = 10} = {};
        x + y
      `);
      expect(result).toBe(15);
    });

    it("should only use default when undefined", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {x = 5, y = 10} = {x: 1};
        x + y
      `);
      expect(result).toBe(11);
    });
  });

  describe("Mixed Destructuring", () => {
    it("should handle array of objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let [{x}, {y}] = [{x: 1}, {y: 2}];
        x + y
      `);
      expect(result).toBe(3);
    });

    it("should handle object with array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let {arr: [a, b]} = {arr: [1, 2]};
        a + b
      `);
      expect(result).toBe(3);
    });
  });

  describe("Destructuring Assignments", () => {
    it("should assign to existing variables (array)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let a = 0, b = 0;
        [a, b] = [1, 2];
        a + b
      `);
      expect(result).toBe(3);
    });

    it("should assign to existing variables (object)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 0, y = 0;
        ({x, y} = {x: 1, y: 2});
        x + y
      `);
      expect(result).toBe(3);
    });
  });

  describe("Error Cases", () => {
    it("should throw on non-array destructuring", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`let [a, b] = "string";`);
      }).toThrow("Cannot destructure non-array value");
    });

    it("should throw on non-object destructuring", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`let {x} = 42;`);
      }).toThrow("Cannot destructure non-object value");
    });

    it("should require initializer", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`let [a, b];`);
      }).toThrow(/initializer/);
    });
  });

  describe("Const Destructuring", () => {
    it("should work with const", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const [a, b] = [1, 2];
        a + b
      `);
      expect(result).toBe(3);
    });

    it("should prevent reassignment", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          const [a, b] = [1, 2];
          a = 10;
        `);
      }).toThrow();
    });
  });

  describe("Async Destructuring", () => {
    it("should work with async", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let [a, b] = [1, 2];
        a + b
      `);
      expect(result).toBe(3);
    });

    it("should handle object destructuring in async", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let {x, y} = {x: 5, y: 10};
        x * y
      `);
      expect(result).toBe(50);
    });
  });
});
