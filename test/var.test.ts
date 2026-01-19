import { describe, test, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("var declarations", () => {
  describe("basic var functionality", () => {
    test("declares and assigns var", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var x = 10;
        x;
      `);
      expect(result).toBe(10);
    });

    test("var allows re-declaration", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var x = 10;
        var x = 20;
        x;
      `);
      expect(result).toBe(20);
    });

    test("var can be updated", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var x = 10;
        x = 20;
        x;
      `);
      expect(result).toBe(20);
    });

    test("multiple var declarations in one statement", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var a = 1, b = 2, c = 3;
        a + b + c;
      `);
      expect(result).toBe(6);
    });
  });

  describe("function scope", () => {
    test("var is function-scoped, not block-scoped", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          if (true) {
            var x = 10;
          }
          return x; // x is accessible outside the if block
        }
        test();
      `);
      expect(result).toBe(10);
    });

    test("var in nested blocks hoists to function", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          if (true) {
            if (true) {
              var x = 42;
            }
          }
          return x;
        }
        test();
      `);
      expect(result).toBe(42);
    });

    test("var in loop is function-scoped", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          for (let i = 0; i < 1; i++) {
            var x = 100;
          }
          return x;
        }
        test();
      `);
      expect(result).toBe(100);
    });

    test("var in different functions are separate", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function f1() {
          var x = 10;
          return x;
        }
        function f2() {
          var x = 20;
          return x;
        }
        f1() + f2();
      `);
      expect(result).toBe(30);
    });
  });

  describe("var vs let/const", () => {
    test("cannot redeclare let as var", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let x = 10;
          var x = 20;
        `);
      }).toThrow("Identifier 'x' has already been declared");
    });

    test("cannot redeclare const as var", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          const x = 10;
          var x = 20;
        `);
      }).toThrow("Identifier 'x' has already been declared");
    });

    test("let is block-scoped, var is function-scoped", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          let results = [];
          if (true) {
            let blockScoped = 10;
            var functionScoped = 20;
          }
          // blockScoped is not accessible here
          // functionScoped is accessible
          return functionScoped;
        }
        test();
      `);
      expect(result).toBe(20);
    });
  });

  describe("var re-declaration in same scope", () => {
    test("var can be re-declared in same function scope", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          var x = 1;
          if (true) {
            var x = 2; // re-declaration in nested block
          }
          return x;
        }
        test();
      `);
      expect(result).toBe(2);
    });

    test("var re-declaration updates existing variable", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          var x = 10;
          var x = 20;
          var x = 30;
          return x;
        }
        test();
      `);
      expect(result).toBe(30);
    });
  });

  describe("global var", () => {
    test("var in global scope", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var globalVar = 100;
        function test() {
          return globalVar;
        }
        test();
      `);
      expect(result).toBe(100);
    });

    test("var can be re-declared in global scope", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        var x = 10;
        var x = 20;
        var x = 30;
        x;
      `);
      expect(result).toBe(30);
    });
  });

  describe("var in loops", () => {
    test("var in for loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let sum = 0;
        for (var i = 0; i < 5; i++) {
          sum = sum + i;
        }
        sum;
      `);
      expect(result).toBe(10);
    });

    test("var in for loop is accessible after loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        for (var i = 0; i < 5; i++) {
          // loop body
        }
        i; // i is still accessible
      `);
      expect(result).toBe(5);
    });

    test("var in while loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        while (count < 3) {
          var x = count;
          count = count + 1;
        }
        x; // x is accessible after loop
      `);
      expect(result).toBe(2);
    });
  });

  describe("var with async", () => {
    test("var in async function", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function test() {
          var x = 42;
          return x;
        }
        test();
      `);
      expect(result).toBe(42);
    });

    test("var in async function with block scope", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function test() {
          if (true) {
            var x = 100;
          }
          return x;
        }
        test();
      `);
      expect(result).toBe(100);
    });
  });
});
