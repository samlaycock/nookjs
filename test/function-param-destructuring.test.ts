import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Function parameter destructuring", () => {
  describe("Object destructuring", () => {
    it("should destructure object params in function declarations", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo({ a, b }) { return a + b; }
        foo({ a: 1, b: 2 });
      `);
      expect(result).toBe(3);
    });

    it("should destructure with renaming", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo({ name: n, age: a }) { return n + ":" + a; }
        foo({ name: "Alice", age: 30 });
      `);
      expect(result).toBe("Alice:30");
    });

    it("should destructure with defaults", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo({ x = 5, y = 10 }) { return x + y; }
        foo({ x: 1 });
      `);
      expect(result).toBe(11);
    });

    it("should destructure with default for entire param", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo({ x, y } = { x: 1, y: 2 }) { return x + y; }
        foo();
      `);
      expect(result).toBe(3);
    });
  });

  describe("Array destructuring", () => {
    it("should destructure array params", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo([a, b, c]) { return a + b + c; }
        foo([1, 2, 3]);
      `);
      expect(result).toBe(6);
    });

    it("should destructure with rest in array param", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo([first, ...rest]) { return first + ":" + rest; }
        foo([1, 2, 3]);
      `);
      expect(result).toBe("1:2,3");
    });
  });

  describe("Arrow functions", () => {
    it("should destructure in arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const add = ({ a, b }) => a + b;
        add({ a: 10, b: 20 });
      `);
      expect(result).toBe(30);
    });

    it("should destructure arrays in arrow functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const sum = ([x, y]) => x + y;
        sum([5, 7]);
      `);
      expect(result).toBe(12);
    });
  });

  describe("Function expressions", () => {
    it("should destructure in function expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const fn = function({ key, value }) { return key + "=" + value; };
        fn({ key: "x", value: 42 });
      `);
      expect(result).toBe("x=42");
    });
  });

  describe("Class methods", () => {
    it("should destructure in class methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Foo {
          bar({ x, y }) { return x * y; }
        }
        const f = new Foo();
        f.bar({ x: 3, y: 4 });
      `);
      expect(result).toBe(12);
    });
  });

  describe("Mixed parameters", () => {
    it("should mix regular and destructured params", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function greet(greeting, { name, age }) {
          return greeting + " " + name + ", age " + age;
        }
        greet("Hello", { name: "Bob", age: 25 });
      `);
      expect(result).toBe("Hello Bob, age 25");
    });

    it("should mix destructured and rest params", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function foo({ a }, ...rest) {
          return a + ":" + rest;
        }
        foo({ a: 1 }, 2, 3);
      `);
      expect(result).toBe("1:2,3");
    });
  });

  describe("Async functions", () => {
    it("should destructure in async functions", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function foo({ x, y }) { return x + y; }
        await foo({ x: 10, y: 5 });
      `);
      expect(result).toBe(15);
    });
  });
});
