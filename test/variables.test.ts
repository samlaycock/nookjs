import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Variables", () => {
  describe("ES5", () => {
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
  });

  describe("ES2015", () => {
    describe("Variables and Assignments", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Variable Declarations - let", () => {
        test("declares and initializes a let variable", () => {
          interpreter.evaluate("let x = 5");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("declares multiple variables in one statement", () => {
          interpreter.evaluate("let x = 5, y = 10");
          expect(interpreter.evaluate("x")).toBe(5);
          expect(interpreter.evaluate("y")).toBe(10);
        });

        test("declares variable with expression", () => {
          interpreter.evaluate("let x = 2 + 3");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("declares variable without initializer (undefined)", () => {
          interpreter.evaluate("let x");
          expect(interpreter.evaluate("x")).toBeUndefined();
        });

        test("throws error on duplicate declaration", () => {
          interpreter.evaluate("let x = 5");
          expect(() => interpreter.evaluate("let x = 10")).toThrow(
            InterpreterError
          );
          expect(() => interpreter.evaluate("let x = 10")).toThrow(
            "Variable 'x' has already been declared"
          );
        });

        test("can reassign let variable", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("x = 10");
          expect(interpreter.evaluate("x")).toBe(10);
        });

        test("can use variable in expressions", () => {
          interpreter.evaluate("let x = 5");
          expect(interpreter.evaluate("x + 3")).toBe(8);
          expect(interpreter.evaluate("x * 2")).toBe(10);
        });
      });

      describe("Variable Declarations - const", () => {
        test("declares and initializes a const variable", () => {
          interpreter.evaluate("const x = 5");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("throws error on const without initializer", () => {
          expect(() => interpreter.evaluate("const x")).toThrow(
            "Missing initializer in const declaration"
          );
        });

        test("throws error on const reassignment", () => {
          interpreter.evaluate("const x = 5");
          expect(() => interpreter.evaluate("x = 10")).toThrow(
            InterpreterError
          );
          expect(() => interpreter.evaluate("x = 10")).toThrow(
            "Cannot assign to const variable 'x'"
          );
        });

        test("can use const in expressions", () => {
          interpreter.evaluate("const x = 5");
          expect(interpreter.evaluate("x + 3")).toBe(8);
        });

        test("throws error on duplicate const declaration", () => {
          interpreter.evaluate("const x = 5");
          expect(() => interpreter.evaluate("const x = 10")).toThrow(
            InterpreterError
          );
        });

        test("allows keywords like set as identifiers", () => {
          interpreter.evaluate("const set = 5");
          expect(interpreter.evaluate("set")).toBe(5);
        });
      });

      describe("Variable Access", () => {
        test("throws error on undefined variable", () => {
          expect(() => interpreter.evaluate("x")).toThrow(InterpreterError);
          expect(() => interpreter.evaluate("x")).toThrow(
            "Undefined variable 'x'"
          );
        });

        test("throws error on assignment to undefined variable", () => {
          expect(() => interpreter.evaluate("x = 5")).toThrow(InterpreterError);
          expect(() => interpreter.evaluate("x = 5")).toThrow(
            "Undefined variable 'x'"
          );
        });

        test("can reference variable in same statement after declaration", () => {
          expect(interpreter.evaluate("let x = 5; x")).toBe(5);
        });
      });

      describe("Assignment Expressions", () => {
        test("simple assignment returns the assigned value", () => {
          interpreter.evaluate("let x = 5");
          expect(interpreter.evaluate("x = 10")).toBe(10);
        });

        test("can chain assignments (right-to-left)", () => {
          interpreter.evaluate("let x = 0; let y = 0");
          interpreter.evaluate("x = y = 5");
          expect(interpreter.evaluate("x")).toBe(5);
          expect(interpreter.evaluate("y")).toBe(5);
        });

        test("assignment with expression", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("x = x + 3");
          expect(interpreter.evaluate("x")).toBe(8);
        });

        test("assignment with complex expression", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("x = (x + 3) * 2");
          expect(interpreter.evaluate("x")).toBe(16);
        });

        test("throws error on invalid assignment target", () => {
          expect(() => interpreter.evaluate("5 = 10")).toThrow(
            "Invalid left-hand side in assignment"
          );
        });
      });

      describe("Complex Variable Usage", () => {
        test("multiple variables in expression", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("let y = 10");
          expect(interpreter.evaluate("x + y")).toBe(15);
          expect(interpreter.evaluate("x * y")).toBe(50);
        });

        test("variable references variable", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("let y = x + 3");
          expect(interpreter.evaluate("y")).toBe(8);
        });

        test("sequential assignments", () => {
          interpreter.evaluate("let x = 1");
          interpreter.evaluate("x = x + 1");
          interpreter.evaluate("x = x * 2");
          expect(interpreter.evaluate("x")).toBe(4);
        });

        test("multiple variables with same value", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("let y = 5");
          expect(interpreter.evaluate("x")).toBe(5);
          expect(interpreter.evaluate("y")).toBe(5);
        });

        test("update one variable does not affect others", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("let y = x");
          interpreter.evaluate("x = 10");
          expect(interpreter.evaluate("x")).toBe(10);
          expect(interpreter.evaluate("y")).toBe(5);
        });
      });

      describe("Variable Shadowing Prevention", () => {
        test("cannot redeclare with let", () => {
          interpreter.evaluate("let x = 5");
          expect(() => interpreter.evaluate("let x = 10")).toThrow(
            InterpreterError
          );
        });

        test("cannot redeclare with const", () => {
          interpreter.evaluate("const x = 5");
          expect(() => interpreter.evaluate("const x = 10")).toThrow(
            InterpreterError
          );
        });

        test("cannot mix let and const with same name", () => {
          interpreter.evaluate("let x = 5");
          expect(() => interpreter.evaluate("const x = 10")).toThrow(
            InterpreterError
          );
        });
      });

      describe("Integration with Arithmetic", () => {
        test("complex calculation with variables", () => {
          interpreter.evaluate("let a = 10");
          interpreter.evaluate("let b = 5");
          interpreter.evaluate("let c = a * b + (a - b) / 2");
          expect(interpreter.evaluate("c")).toBe(52.5);
        });

        test("using variables in nested expressions", () => {
          interpreter.evaluate("let x = 2");
          interpreter.evaluate("let y = 3");
          expect(interpreter.evaluate("(x + y) * (x - y)")).toBe(-5);
        });

        test("fibonacci-like sequence", () => {
          interpreter.evaluate("let a = 1");
          interpreter.evaluate("let b = 1");
          interpreter.evaluate("let c = a + b");
          expect(interpreter.evaluate("c")).toBe(2);
          interpreter.evaluate("a = b");
          interpreter.evaluate("b = c");
          interpreter.evaluate("c = a + b");
          expect(interpreter.evaluate("c")).toBe(3);
        });

        test("accumulator pattern", () => {
          interpreter.evaluate("let sum = 0");
          interpreter.evaluate("sum = sum + 1");
          interpreter.evaluate("sum = sum + 2");
          interpreter.evaluate("sum = sum + 3");
          expect(interpreter.evaluate("sum")).toBe(6);
        });
      });

      describe("Edge Cases", () => {
        test("variable with number-like name", () => {
          interpreter.evaluate("let x1 = 5");
          expect(interpreter.evaluate("x1")).toBe(5);
        });

        test("variable with underscore", () => {
          interpreter.evaluate("let _private = 42");
          expect(interpreter.evaluate("_private")).toBe(42);
        });

        test("variable with dollar sign", () => {
          interpreter.evaluate("let $value = 100");
          expect(interpreter.evaluate("$value")).toBe(100);
        });

        test("multiple statements on separate lines", () => {
          const code = `
            let x = 5;
            let y = 10;
            x + y
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        test("declaration returns the initialized value", () => {
          expect(interpreter.evaluate("let x = 42")).toBe(42);
        });

        test("const declaration returns the initialized value", () => {
          expect(interpreter.evaluate("const x = 42")).toBe(42);
        });
      });
    });

    describe("Block Scoping", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Basic block scoping", () => {
        test("variables in block are isolated", () => {
          const code = `
            let x = 10;
            {
              let y = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("cannot access block-scoped variable outside block", () => {
          const code = `
            {
              let x = 10;
            }
            x
          `;
          expect(() => interpreter.evaluate(code)).toThrow(InterpreterError);
          expect(() => interpreter.evaluate(code)).toThrow(
            "Undefined variable 'x'"
          );
        });

        test("can access outer variable from inner block", () => {
          const code = `
            let x = 10;
            {
              x = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("can shadow outer variable", () => {
          const code = `
            let x = 10;
            {
              let x = 20;
              x
            }
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("shadowing does not affect outer variable", () => {
          const code = `
            let x = 10;
            {
              let x = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("can modify outer variable from block", () => {
          const code = `
            let x = 10;
            {
              x = x + 5;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        test("const in block cannot be reassigned", () => {
          const code = `
            {
              const x = 10;
              x = 20;
            }
          `;
          expect(() => interpreter.evaluate(code)).toThrow(InterpreterError);
          expect(() => interpreter.evaluate(code)).toThrow(
            "Cannot assign to const variable"
          );
        });

        test("multiple variables in block", () => {
          const code = `
            let result = 0;
            {
              let a = 10;
              let b = 20;
              result = a + b;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(30);
        });
      });

      describe("Nested blocks", () => {
        test("nested block can access outer block variable", () => {
          const code = `
            let x = 10;
            {
              let y = 20;
              {
                let z = x + y;
                z
              }
            }
          `;
          expect(interpreter.evaluate(code)).toBe(30);
        });

        test("nested block shadowing", () => {
          const code = `
            let x = 10;
            {
              let x = 20;
              {
                let x = 30;
                x
              }
            }
          `;
          expect(interpreter.evaluate(code)).toBe(30);
        });

        test("each nesting level maintains its own scope", () => {
          const code = `
            let x = 1;
            {
              let x = 2;
              {
                let x = 3;
              }
              x
            }
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        test("deeply nested blocks", () => {
          const code = `
            let result = 0;
            {
              let a = 1;
              {
                let b = 2;
                {
                  let c = 3;
                  result = a + b + c;
                }
              }
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("sibling blocks are isolated", () => {
          const code = `
            let result = 0;
            {
              let x = 10;
              result = x;
            }
            {
              let x = 20;
              result = result + x;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(30);
        });
      });

      describe("Block scoping with conditionals", () => {
        test("if block creates new scope", () => {
          const code = `
            let x = 10;
            if (true) {
              let x = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("variables in if block are not accessible outside", () => {
          const code = `
            if (true) {
              let x = 10;
            }
            x
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Undefined variable 'x'"
          );
        });

        test("else block creates separate scope", () => {
          const code = `
            let result = 0;
            if (false) {
              let x = 10;
            } else {
              let x = 20;
              result = x;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("if and else blocks have separate scopes", () => {
          const code = `
            let x = 5;
            if (x > 3) {
              let y = 10;
            } else {
              let y = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("nested if with block scoping", () => {
          const code = `
            let result = 0;
            if (true) {
              let x = 10;
              if (true) {
                let x = 20;
                result = x;
              }
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });
      });

      describe("Block scoping with loops", () => {
        test("while loop body creates new scope each iteration", () => {
          const code = `
            let i = 0;
            let sum = 0;
            while (i < 3) {
              let j = i * 10;
              sum = sum + j;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(30); // 0 + 10 + 20
        });

        test("loop variable declared in block", () => {
          const code = `
            let i = 0;
            let sum = 0;
            while (i < 5) {
              let temp = i * 2;
              sum = sum + temp;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(20); // 0 + 2 + 4 + 6 + 8
        });

        test("nested loop with block-scoped variables", () => {
          const code = `
            let i = 0;
            let sum = 0;
            while (i < 3) {
              let j = 0;
              while (j < 3) {
                let product = i * j;
                sum = sum + product;
                j = j + 1;
              }
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(9); // (0*0+0*1+0*2) + (1*0+1*1+1*2) + (2*0+2*1+2*2) = 0 + 3 + 6
        });

        test("variable shadowing in loop", () => {
          const code = `
            let x = 100;
            let i = 0;
            let result = 0;
            while (i < 3) {
              let x = i;
              result = result + x;
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(3); // 0 + 1 + 2
        });

        test("block variable not accessible after loop", () => {
          const code = `
            let i = 0;
            while (i < 1) {
              let temp = 10;
              i = i + 1;
            }
            temp
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Undefined variable 'temp'"
          );
        });
      });

      describe("Block scoping with const", () => {
        test("const in block is scoped to block", () => {
          const code = `
            let x = 0;
            {
              const y = 10;
              x = y;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("cannot reassign const in block", () => {
          const code = `
            {
              const x = 10;
              x = 20;
            }
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Cannot assign to const variable"
          );
        });

        test("const shadowing outer let", () => {
          const code = `
            let x = 10;
            {
              const x = 20;
              x
            }
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("outer variable unaffected by inner const shadow", () => {
          const code = `
            let x = 10;
            {
              const x = 20;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });
      });

      describe("Complex scoping scenarios", () => {
        test("multiple levels of shadowing", () => {
          const code = `
            let x = 1;
            {
              let x = 2;
              {
                let x = 3;
                {
                  let x = 4;
                  x
                }
              }
            }
          `;
          expect(interpreter.evaluate(code)).toBe(4);
        });

        test("accessing variables from different scope levels", () => {
          const code = `
            let a = 1;
            {
              let b = 2;
              {
                let c = 3;
                a + b + c
              }
            }
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("modifying variables at different scope levels", () => {
          const code = `
            let x = 10;
            let y = 20;
            {
              x = 15;
              {
                y = 25;
                {
                  x = x + y;
                }
              }
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(40);
        });

        test("blocks in sequence maintain isolation", () => {
          const code = `
            let result = 0;
            {
              let x = 10;
              result = x;
            }
            {
              let x = 20;
              result = result + x;
            }
            {
              let x = 30;
              result = result + x;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(60);
        });

        test("complex nesting with loops and conditionals", () => {
          const code = `
            let total = 0;
            let i = 0;
            while (i < 3) {
              let multiplier = i + 1;
              if (multiplier > 1) {
                let bonus = 10;
                total = total + (multiplier * bonus);
              }
              i = i + 1;
            }
            total
          `;
          expect(interpreter.evaluate(code)).toBe(50); // (2*10) + (3*10)
        });
      });

      describe("Edge cases", () => {
        test("empty block", () => {
          const code = `
            let x = 10;
            {
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("block with only declarations", () => {
          const code = `
            let outer = 0;
            {
              let inner = 10;
              outer = inner;
            }
            outer
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("redeclaration in same block scope fails", () => {
          const code = `
            {
              let x = 10;
              let x = 20;
            }
          `;
          expect(() => interpreter.evaluate(code)).toThrow(
            "Variable 'x' has already been declared"
          );
        });

        test("can redeclare in sibling scope", () => {
          const code = `
            {
              let x = 10;
            }
            {
              let x = 20;
            }
          `;
          expect(() => interpreter.evaluate(code)).not.toThrow();
        });
      });
    });

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

    describe("Destructuring in catch clauses", () => {
      describe("Object destructuring", () => {
        it("should destructure error object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let msg = "";
            try {
              throw { message: "oops", code: 42 };
            } catch ({ message, code }) {
              msg = message + ":" + code;
            }
            msg;
          `);
          expect(result).toBe("oops:42");
        });

        it("should destructure with renaming", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw { message: "fail", status: 500 };
            } catch ({ message: msg, status: s }) {
              out = msg + ":" + s;
            }
            out;
          `);
          expect(result).toBe("fail:500");
        });

        it("should destructure with default values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw { message: "err" };
            } catch ({ message, code = 0 }) {
              out = message + ":" + code;
            }
            out;
          `);
          expect(result).toBe("err:0");
        });

        it("should destructure nested objects", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw { error: { message: "deep", code: 1 } };
            } catch ({ error: { message, code } }) {
              out = message + ":" + code;
            }
            out;
          `);
          expect(result).toBe("deep:1");
        });
      });

      describe("Array destructuring", () => {
        it("should destructure error as array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw ["a", "b", "c"];
            } catch ([first, second, third]) {
              out = first + second + third;
            }
            out;
          `);
          expect(result).toBe("abc");
        });

        it("should destructure with skipped elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw [1, 2, 3];
            } catch ([, second]) {
              out = "" + second;
            }
            out;
          `);
          expect(result).toBe("2");
        });

        it("should destructure with rest element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let first, rest;
            try {
              throw [1, 2, 3, 4];
            } catch ([f, ...r]) {
              first = f;
              rest = r;
            }
            "" + first + ":" + rest;
          `);
          expect(result).toBe("1:2,3,4");
        });
      });

      describe("Async catch destructuring", () => {
        it("should destructure in async catch clause", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let msg = "";
            try {
              throw { message: "async-err", code: 99 };
            } catch ({ message, code }) {
              msg = message + ":" + code;
            }
            msg;
          `);
          expect(result).toBe("async-err:99");
        });

        it("should destructure array in async catch clause", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let out = "";
            try {
              throw ["x", "y"];
            } catch ([a, b]) {
              out = a + b;
            }
            out;
          `);
          expect(result).toBe("xy");
        });
      });

      describe("Edge cases", () => {
        it("should still work with simple identifier catch param", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "";
            try {
              throw "simple";
            } catch (e) {
              out = e;
            }
            out;
          `);
          // Simple identifier catch param receives the InterpreterError wrapper
          expect(result).toBeInstanceOf(InterpreterError);
          expect(String(result)).toContain("simple");
        });

        it("should still work with no catch param", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let out = "before";
            try {
              throw "ignored";
            } catch {
              out = "caught";
            }
            out;
          `);
          expect(result).toBe("caught");
        });
      });
    });

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

    describe("Spread and Rest Operators", () => {
      describe("Array Spread in Literals", () => {
        it("should spread array elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [1, 2, 3];
            [...arr];
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should spread array with additional elements before", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [2, 3];
            [1, ...arr];
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should spread array with additional elements after", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [1, 2];
            [...arr, 3];
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should spread array with elements before and after", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [2, 3];
            [1, ...arr, 4];
          `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should handle multiple spreads", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr1 = [1, 2];
            const arr2 = [3, 4];
            [...arr1, ...arr2];
          `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should handle nested spreads", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [1, 2];
            [...[...arr, 3]];
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should spread empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [];
            [1, ...arr, 2];
          `);
          expect(result).toEqual([1, 2]);
        });

        it("should throw error when spreading non-iterable (number)", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`[...5]`);
          }).toThrow("Spread syntax requires an iterable");
        });

        it("should throw error when spreading non-iterable (object)", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`[...{a: 1}]`);
          }).toThrow("Spread syntax requires an iterable");
        });

        it("should throw error when spreading null", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`[...null]`);
          }).toThrow("Spread syntax requires an iterable");
        });

        it("should throw error when spreading undefined", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let x;
              [...x];
            `);
          }).toThrow("Spread syntax requires an iterable");
        });

        it("should spread array from function return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getArray() {
              return [1, 2, 3];
            }
            [...getArray()];
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should spread array with undefined elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x;
            const arr = [1, x, 3];
            [...arr];
          `);
          expect(result).toEqual([1, undefined, 3]);
        });

        it("should handle spread with holes", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [1, , 3];
            [...arr];
          `);
          expect(result).toEqual([1, undefined, 3]);
        });
      });

      describe("Object Spread in Literals", () => {
        it("should spread object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1, b: 2};
            ({...obj});
          `);
          expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should spread object with additional properties before", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {b: 2, c: 3};
            ({a: 1, ...obj});
          `);
          expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should spread object with additional properties after", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1, b: 2};
            ({...obj, c: 3});
          `);
          expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should override properties when spread comes first", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1, b: 2};
            ({...obj, b: 99});
          `);
          expect(result).toEqual({ a: 1, b: 99 });
        });

        it("should be overridden when spread comes after", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1, b: 99};
            ({b: 2, ...obj});
          `);
          expect(result).toEqual({ a: 1, b: 99 });
        });

        it("should handle multiple spreads", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj1 = {a: 1, b: 2};
            const obj2 = {c: 3, d: 4};
            ({...obj1, ...obj2});
          `);
          expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        });

        it("should handle nested spreads", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1};
            ({...{...obj, b: 2}});
          `);
          expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should spread empty object", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {};
            ({a: 1, ...obj, b: 2});
          `);
          expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should throw error when spreading array", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`({...[1, 2, 3]})`);
          }).toThrow("Spread syntax in objects requires an object");
        });

        it("should throw error when spreading null", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`({...null})`);
          }).toThrow("Spread syntax in objects requires an object");
        });

        it("should throw error when spreading undefined", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let x;
              ({...x});
            `);
          }).toThrow("Spread syntax in objects requires an object");
        });

        it("should throw error when spreading primitive (number)", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`({...5})`);
          }).toThrow("Spread syntax in objects requires an object");
        });

        it("should spread object from function return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getObject() {
              return {a: 1, b: 2};
            }
            ({...getObject()});
          `);
          expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should handle spreading objects with undefined values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x;
            const obj = {a: 1, b: x};
            ({...obj});
          `);
          expect(result).toEqual({ a: 1, b: undefined });
        });

        it("should handle multiple overlapping spreads", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj1 = {a: 1, b: 2};
            const obj2 = {b: 99, c: 3};
            ({...obj1, ...obj2});
          `);
          expect(result).toEqual({ a: 1, b: 99, c: 3 });
        });
      });

      describe("Call Spread for Function Arguments", () => {
        it("should spread array as function arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(a, b, c) {
              return a + b + c;
            }
            const args = [1, 2, 3];
            sum(...args);
          `);
          expect(result).toBe(6);
        });

        it("should spread with additional arguments before", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(a, b, c, d) {
              return a + b + c + d;
            }
            const args = [2, 3, 4];
            sum(1, ...args);
          `);
          expect(result).toBe(10);
        });

        it("should spread with additional arguments after", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(a, b, c, d) {
              return a + b + c + d;
            }
            const args = [1, 2, 3];
            sum(...args, 4);
          `);
          expect(result).toBe(10);
        });

        it("should handle multiple spreads in call", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(a, b, c, d) {
              return a + b + c + d;
            }
            const args1 = [1, 2];
            const args2 = [3, 4];
            sum(...args1, ...args2);
          `);
          expect(result).toBe(10);
        });

        it("should spread empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(a, b) {
              return a + b;
            }
            const args = [];
            sum(1, ...args, 2);
          `);
          expect(result).toBe(3);
        });

        it("should throw error when spreading non-array in call", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function fn(a) { return a; }
              fn(...5);
            `);
          }).toThrow("Spread syntax in function calls requires an array");
        });

        it("should throw error when spreading object in call", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function fn(a) { return a; }
              fn(...{a: 1});
            `);
          }).toThrow("Spread syntax in function calls requires an array");
        });

        it("should work with rest parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function collect(...args) {
              return args;
            }
            const arr = [1, 2, 3];
            collect(...arr);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const sum = (a, b, c) => a + b + c;
            const args = [1, 2, 3];
            sum(...args);
          `);
          expect(result).toBe(6);
        });

        it("should spread into host function", () => {
          const interpreter = new Interpreter();
          // Use a custom function since Math is not available
          const result = interpreter.evaluate(`
            const max = function(...args) {
              let m = args[0];
              for (let i = 1; i < args.length; i++) {
                if (args[i] > m) m = args[i];
              }
              return m;
            };
            const args = [1, 2, 3];
            max(...args);
          `);
          expect(result).toBe(3);
        });

        it("should handle nested array spreads in calls", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(...args) {
              let total = 0;
              for (const n of args) {
                total = total + n;
              }
              return total;
            }
            const arr = [[1, 2], [3, 4]];
            sum(...arr[0], ...arr[1]);
          `);
          expect(result).toBe(10);
        });
      });

      describe("Array Rest in Destructuring", () => {
        it("should collect remaining array elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a, ...rest] = [1, 2, 3, 4];
            rest;
          `);
          expect(result).toEqual([2, 3, 4]);
        });

        it("should collect with multiple elements before rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a, b, ...rest] = [1, 2, 3, 4, 5];
            rest;
          `);
          expect(result).toEqual([3, 4, 5]);
        });

        it("should create empty array when no remaining elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a, b, ...rest] = [1, 2];
            rest;
          `);
          expect(result).toEqual([]);
        });

        it("should handle rest as only element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [...rest] = [1, 2, 3];
            rest;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should work with let declaration", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let [a, ...rest] = [1, 2, 3];
            rest;
          `);
          expect(result).toEqual([2, 3]);
        });

        it("should work with assignment pattern", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let a, rest;
            [a, ...rest] = [1, 2, 3];
            rest;
          `);
          expect(result).toEqual([2, 3]);
        });

        it("should work with defaults before rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a = 10, b = 20, ...rest] = [1];
            rest;
          `);
          expect(result).toEqual([]);
        });

        it("should handle nested destructuring with rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [[a], ...rest] = [[1], 2, 3];
            rest;
          `);
          expect(result).toEqual([2, 3]);
        });

        it("should collect undefined elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x;
            const [a, ...rest] = [1, x, 3];
            rest;
          `);
          expect(result).toEqual([undefined, 3]);
        });

        it("should handle rest with holes", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a, ...rest] = [1, , 3];
            rest;
          `);
          expect(result).toEqual([undefined, 3]);
        });

        it("should collect empty when array too short", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const [a, b, c, ...rest] = [1, 2];
            rest;
          `);
          expect(result).toEqual([]);
        });
      });

      describe("Object Rest in Destructuring", () => {
        it("should collect remaining object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a, ...rest} = {a: 1, b: 2, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });

        it("should collect with multiple properties before rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a, b, ...rest} = {a: 1, b: 2, c: 3, d: 4};
            rest;
          `);
          expect(result).toEqual({ c: 3, d: 4 });
        });

        it("should create empty object when no remaining properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a, b, ...rest} = {a: 1, b: 2};
            rest;
          `);
          expect(result).toEqual({});
        });

        it("should handle rest as only element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {...rest} = {a: 1, b: 2};
            rest;
          `);
          expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should work with let declaration", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let {a, ...rest} = {a: 1, b: 2, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });

        it("should work with assignment pattern", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let a, rest;
            ({a, ...rest} = {a: 1, b: 2, c: 3});
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });

        it("should work with defaults before rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a = 10, b = 20, ...rest} = {a: 1, c: 3};
            rest;
          `);
          expect(result).toEqual({ c: 3 });
        });

        it("should handle nested destructuring with rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a: {x}, ...rest} = {a: {x: 1}, b: 2, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });

        it("should collect undefined values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x;
            const {a, ...rest} = {a: 1, b: x, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: undefined, c: 3 });
        });

        it("should work with renamed properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const {a: x, ...rest} = {a: 1, b: 2, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });

        it("should handle computed property names", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const key = "a";
            const {[key]: x, ...rest} = {a: 1, b: 2, c: 3};
            rest;
          `);
          expect(result).toEqual({ b: 2, c: 3 });
        });
      });

      describe("Rest Parameters in Functions", () => {
        it("should collect rest parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(...args) {
              return args;
            }
            fn(1, 2, 3);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should collect with regular parameters before rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(a, b, ...rest) {
              return rest;
            }
            fn(1, 2, 3, 4, 5);
          `);
          expect(result).toEqual([3, 4, 5]);
        });

        it("should create empty array when no rest arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(a, b, ...rest) {
              return rest;
            }
            fn(1, 2);
          `);
          expect(result).toEqual([]);
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const fn = (...args) => args;
            fn(1, 2, 3);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should work with function expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const fn = function(...args) {
              return args;
            };
            fn(1, 2, 3);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should allow accessing rest parameter multiple times", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(...args) {
              return args.length + args[0];
            }
            fn(10, 20, 30);
          `);
          expect(result).toBe(13);
        });

        it("should work with spread in call", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(...args) {
              return args;
            }
            const arr = [1, 2, 3];
            fn(...arr);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should handle rest with regular params and spread", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(a, ...rest) {
              return [a, rest];
            }
            const arr = [2, 3, 4];
            fn(1, ...arr);
          `);
          expect(result).toEqual([1, [2, 3, 4]]);
        });

        it("should throw error when too few arguments", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function fn(a, b, ...rest) {
                return rest;
              }
              fn(1);
            `);
          }).toThrow("Expected at least 2 arguments but got 1");
        });

        it("should allow zero arguments when only rest parameter", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(...args) {
              return args;
            }
            fn();
          `);
          expect(result).toEqual([]);
        });

        it("should work in async functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluateAsync(`
            async function fn(...args) {
              return args;
            }
            fn(1, 2, 3);
          `);
          expect(result).resolves.toEqual([1, 2, 3]);
        });

        it("should work in async arrow functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluateAsync(`
            const fn = async (...args) => args;
            fn(1, 2, 3);
          `);
          expect(result).resolves.toEqual([1, 2, 3]);
        });

        it("should handle complex rest parameter usage", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(...numbers) {
              let total = 0;
              for (const n of numbers) {
                total = total + n;
              }
              return total;
            }
            sum(1, 2, 3, 4, 5);
          `);
          expect(result).toBe(15);
        });

        it("should work with closures", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function makeAdder(...base) {
              return function(...args) {
                let sum = 0;
                for (const n of base) {
                  sum = sum + n;
                }
                for (const n of args) {
                  sum = sum + n;
                }
                return sum;
              };
            }
            const addTo10 = makeAdder(1, 2, 3, 4);
            addTo10(5, 6);
          `);
          expect(result).toBe(21);
        });
      });

      describe("Integration Tests", () => {
        it("should combine spread and rest in same expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function collect(...args) {
              return args;
            }
            const arr = [1, 2, 3];
            collect(...arr, 4, 5);
          `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should destructure spread result", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr1 = [1, 2];
            const arr2 = [3, 4];
            const [a, b, ...rest] = [...arr1, ...arr2];
            rest;
          `);
          expect(result).toEqual([3, 4]);
        });

        it("should spread in object and array simultaneously", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {a: 1, b: 2};
            const arr = [3, 4];
            ({...obj, arr: [...arr]});
          `);
          expect(result).toEqual({ a: 1, b: 2, arr: [3, 4] });
        });

        it("should use rest in nested functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function outer(...args1) {
              function inner(...args2) {
                return [...args1, ...args2];
              }
              return inner(4, 5);
            }
            outer(1, 2, 3);
          `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should handle complex destructuring with spread", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const data = {
              arr: [1, 2, 3, 4],
              obj: {x: 10, y: 20}
            };
            const {arr: [first, ...restArr], obj: {...restObj}} = data;
            [restArr, restObj];
          `);
          expect(result).toEqual([[2, 3, 4], { x: 10, y: 20 }]);
        });

        it("should spread multiple times in single call", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function fn(...args) {
              return args;
            }
            fn(...[1, 2], 3, ...[4, 5]);
          `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should handle rest in method calls", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = {
              method(...args) {
                return args;
              }
            };
            obj.method(1, 2, 3);
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should work with recursive functions using rest", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sum(...nums) {
              if (nums.length === 0) return 0;
              const [first, ...rest] = nums;
              return first + sum(...rest);
            }
            sum(1, 2, 3, 4, 5);
          `);
          expect(result).toBe(15);
        });

        it("should handle array spread in returned object", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function process(...nums) {
              return {
                original: nums,
                doubled: [...nums.map(n => n * 2)]
              };
            }
            process(1, 2, 3);
          `);
          expect(result).toEqual({
            original: [1, 2, 3],
            doubled: [2, 4, 6],
          });
        });

        it("should combine all features in complex scenario", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function transform(obj, arr) {
              const {a, ...objRest} = obj;
              const [...arrRest] = arr;
              return function(...fnRest) {
                return {
                  obj: {...objRest, new: a},
                  arr: [...arrRest, ...fnRest]
                };
              };
            }
            const fn = transform({a: 1, b: 2, c: 3}, [10, 20, 30]);
            fn(100, 200);
          `);
          expect(result).toEqual({
            obj: { b: 2, c: 3, new: 1 },
            arr: [10, 20, 30, 100, 200],
          });
        });
      });
    });
  });

  describe("ES2020", () => {
    describe("Optional Chaining", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Optional property access (?.)", () => {
        test("returns property value when object exists", () => {
          interpreter.evaluate("let obj = { a: 1 }");
          expect(interpreter.evaluate("obj?.a")).toBe(1);
        });

        test("returns undefined when object is null", () => {
          interpreter.evaluate("let obj = null");
          expect(interpreter.evaluate("obj?.a")).toBe(undefined);
        });

        test("returns undefined when object is undefined", () => {
          interpreter.evaluate("let obj = undefined");
          expect(interpreter.evaluate("obj?.a")).toBe(undefined);
        });

        test("works with nested optional access", () => {
          interpreter.evaluate("let obj = { a: { b: { c: 42 } } }");
          expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(42);
        });

        test("short-circuits on first null in chain", () => {
          interpreter.evaluate("let obj = { a: null }");
          expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(undefined);
        });

        test("short-circuits on first undefined in chain", () => {
          interpreter.evaluate("let obj = { a: undefined }");
          expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(undefined);
        });

        test("works with non-optional access after optional", () => {
          interpreter.evaluate("let obj = { a: { b: 1 } }");
          expect(interpreter.evaluate("obj?.a.b")).toBe(1);
        });

        test("returns undefined for missing nested property", () => {
          interpreter.evaluate("let obj = { a: 1 }");
          expect(interpreter.evaluate("obj?.b?.c")).toBe(undefined);
        });
      });

      describe("Optional computed property access (?.[key])", () => {
        test("returns property value when object exists", () => {
          interpreter.evaluate("let obj = { a: 1 }");
          expect(interpreter.evaluate("obj?.['a']")).toBe(1);
        });

        test("returns undefined when object is null", () => {
          interpreter.evaluate("let obj = null");
          expect(interpreter.evaluate("obj?.['a']")).toBe(undefined);
        });

        test("returns undefined when object is undefined", () => {
          interpreter.evaluate("let obj = undefined");
          expect(interpreter.evaluate("obj?.['a']")).toBe(undefined);
        });

        test("works with dynamic keys", () => {
          interpreter.evaluate("let obj = { foo: 'bar' }");
          interpreter.evaluate("let key = 'foo'");
          expect(interpreter.evaluate("obj?.[key]")).toBe("bar");
        });

        test("works with array indexing", () => {
          interpreter.evaluate("let arr = [1, 2, 3]");
          expect(interpreter.evaluate("arr?.[1]")).toBe(2);
        });

        test("returns undefined for null array", () => {
          interpreter.evaluate("let arr = null");
          expect(interpreter.evaluate("arr?.[0]")).toBe(undefined);
        });
      });

      describe("Optional method call (?.())", () => {
        test("calls method when it exists", () => {
          interpreter.evaluate("let obj = { fn: function() { return 42; } }");
          expect(interpreter.evaluate("obj.fn?.()")).toBe(42);
        });

        test("returns undefined when method is null", () => {
          interpreter.evaluate("let obj = { fn: null }");
          expect(interpreter.evaluate("obj.fn?.()")).toBe(undefined);
        });

        test("returns undefined when method is undefined", () => {
          interpreter.evaluate("let obj = {}");
          expect(interpreter.evaluate("obj.fn?.()")).toBe(undefined);
        });

        test("works with optional object and method call", () => {
          interpreter.evaluate(
            "let obj = { fn: function() { return 'hello'; } }"
          );
          expect(interpreter.evaluate("obj?.fn?.()")).toBe("hello");
        });

        test("short-circuits when object is null", () => {
          interpreter.evaluate("let obj = null");
          expect(interpreter.evaluate("obj?.fn?.()")).toBe(undefined);
        });

        test("passes arguments correctly", () => {
          interpreter.evaluate(
            "let obj = { add: function(a, b) { return a + b; } }"
          );
          expect(interpreter.evaluate("obj.add?.(2, 3)")).toBe(5);
        });
      });

      describe("Mixed optional chaining", () => {
        test("combines property access and method calls", () => {
          interpreter.evaluate(`
            let obj = {
              nested: {
                getValue: function() { return 100; }
              }
            }
          `);
          expect(interpreter.evaluate("obj?.nested?.getValue?.()")).toBe(100);
        });

        test("short-circuits entire chain on null", () => {
          interpreter.evaluate("let obj = { nested: null }");
          expect(interpreter.evaluate("obj?.nested?.getValue?.()")).toBe(
            undefined
          );
        });

        test("works with computed and dot access mixed", () => {
          interpreter.evaluate("let obj = { a: { b: [1, 2, 3] } }");
          expect(interpreter.evaluate("obj?.a?.b?.[2]")).toBe(3);
        });

        test("works with method returning object", () => {
          interpreter.evaluate(`
            let obj = {
              getInner: function() {
                return { value: 42 };
              }
            }
          `);
          expect(interpreter.evaluate("obj?.getInner?.()?.value")).toBe(42);
        });
      });

      describe("Edge cases", () => {
        test("works with falsy but non-nullish values", () => {
          interpreter.evaluate("let obj = { a: 0 }");
          expect(interpreter.evaluate("obj?.a")).toBe(0);

          interpreter.evaluate("let obj2 = { a: '' }");
          expect(interpreter.evaluate("obj2?.a")).toBe("");

          interpreter.evaluate("let obj3 = { a: false }");
          expect(interpreter.evaluate("obj3?.a")).toBe(false);
        });

        test("does not short-circuit on falsy non-nullish values", () => {
          // 0 is falsy but not nullish, so optional chaining should NOT short-circuit
          interpreter.evaluate("let obj = { a: { value: 0 } }");
          expect(interpreter.evaluate("obj?.a?.value")).toBe(0);

          // Empty string is falsy but not nullish
          interpreter.evaluate("let obj2 = { a: { value: '' } }");
          expect(interpreter.evaluate("obj2?.a?.value")).toBe("");

          // false is falsy but not nullish
          interpreter.evaluate("let obj3 = { a: { value: false } }");
          expect(interpreter.evaluate("obj3?.a?.value")).toBe(false);
        });

        test("works in conditional expressions", () => {
          interpreter.evaluate("let obj = null");
          expect(interpreter.evaluate("obj?.a ? 'yes' : 'no'")).toBe("no");

          interpreter.evaluate("let obj2 = { a: true }");
          expect(interpreter.evaluate("obj2?.a ? 'yes' : 'no'")).toBe("yes");
        });

        test("works with nullish coalescing", () => {
          interpreter.evaluate("let obj = null");
          expect(interpreter.evaluate("obj?.a ?? 'default'")).toBe("default");

          interpreter.evaluate("let obj2 = { a: null }");
          expect(interpreter.evaluate("obj2?.a ?? 'default'")).toBe("default");

          interpreter.evaluate("let obj3 = { a: 'value' }");
          expect(interpreter.evaluate("obj3?.a ?? 'default'")).toBe("value");
        });

        test("works with logical OR assignment", () => {
          interpreter.evaluate("let obj = { a: null }");
          interpreter.evaluate("obj.a ||= 'default'");
          expect(interpreter.evaluate("obj?.a")).toBe("default");
        });
      });

      describe("Practical examples", () => {
        test("safe property access in config objects", () => {
          interpreter.evaluate(`
            let config = {
              database: {
                host: 'localhost',
                port: 5432
              }
            }
          `);
          expect(interpreter.evaluate("config?.database?.host")).toBe(
            "localhost"
          );
          expect(interpreter.evaluate("config?.cache?.host")).toBe(undefined);
        });

        test("safe method calls on potentially undefined objects", () => {
          interpreter.evaluate(`
            let user = null;
            let result = user?.getName?.() ?? 'Anonymous';
          `);
          expect(interpreter.evaluate("result")).toBe("Anonymous");
        });

        test("accessing deeply nested optional data", () => {
          interpreter.evaluate(`
            let response = {
              data: {
                users: [
                  { name: 'Alice', profile: { age: 30 } },
                  { name: 'Bob', profile: null }
                ]
              }
            }
          `);
          expect(
            interpreter.evaluate("response?.data?.users?.[0]?.profile?.age")
          ).toBe(30);
          expect(
            interpreter.evaluate("response?.data?.users?.[1]?.profile?.age")
          ).toBe(undefined);
          expect(
            interpreter.evaluate("response?.data?.users?.[2]?.profile?.age")
          ).toBe(undefined);
        });
      });

      describe("Async", () => {
        test("returns undefined for null in async context", async () => {
          await interpreter.evaluateAsync("let obj = null");
          const result = await interpreter.evaluateAsync("obj?.a?.b");
          expect(result).toBe(undefined);
        });

        test("works with async method calls", async () => {
          await interpreter.evaluateAsync(`
            let obj = {
              getValue: function() { return 100; }
            }
          `);
          const result = await interpreter.evaluateAsync("obj?.getValue?.()");
          expect(result).toBe(100);
        });

        test("short-circuits in async context", async () => {
          await interpreter.evaluateAsync("let obj = { a: null }");
          const result = await interpreter.evaluateAsync("obj?.a?.b?.c");
          expect(result).toBe(undefined);
        });
      });
    });
  });
});
