import { describe, test, expect, beforeEach } from "bun:test";
import { Interpreter, InterpreterError } from "../src/interpreter";

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
        "Undefined variable 'x'",
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
        "Cannot assign to const variable",
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
        "Undefined variable 'x'",
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
        "Undefined variable 'temp'",
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
        "Cannot assign to const variable",
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
        "Variable 'x' has already been declared",
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
