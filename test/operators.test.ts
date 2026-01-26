import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Comparison and Logical Operators", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Boolean Literals", () => {
    test("evaluates true", () => {
      expect(interpreter.evaluate("true")).toBe(true);
    });

    test("evaluates false", () => {
      expect(interpreter.evaluate("false")).toBe(false);
    });

    test("can store booleans in variables", () => {
      interpreter.evaluate("let x = true");
      expect(interpreter.evaluate("x")).toBe(true);
    });
  });

  describe("Comparison Operators - Equality", () => {
    test("strict equality with same numbers", () => {
      expect(interpreter.evaluate("5 === 5")).toBe(true);
    });

    test("strict equality with different numbers", () => {
      expect(interpreter.evaluate("5 === 3")).toBe(false);
    });

    test("strict equality with booleans", () => {
      expect(interpreter.evaluate("true === true")).toBe(true);
      expect(interpreter.evaluate("true === false")).toBe(false);
    });

    test("strict inequality with different numbers", () => {
      expect(interpreter.evaluate("5 !== 3")).toBe(true);
    });

    test("strict inequality with same numbers", () => {
      expect(interpreter.evaluate("5 !== 5")).toBe(false);
    });

    test("equality with expressions", () => {
      expect(interpreter.evaluate("2 + 3 === 5")).toBe(true);
      expect(interpreter.evaluate("2 * 3 === 5")).toBe(false);
    });

    test("equality with variables", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let y = 5");
      expect(interpreter.evaluate("x === y")).toBe(true);
    });

    test("loose equality with same types", () => {
      expect(interpreter.evaluate("5 == 5")).toBe(true);
      expect(interpreter.evaluate("5 == 3")).toBe(false);
      expect(interpreter.evaluate("'hello' == 'hello'")).toBe(true);
    });

    test("loose equality with type coercion", () => {
      expect(interpreter.evaluate("5 == '5'")).toBe(true);
      expect(interpreter.evaluate("0 == ''")).toBe(true);
      expect(interpreter.evaluate("0 == '0'")).toBe(true);
      expect(interpreter.evaluate("1 == true")).toBe(true);
      expect(interpreter.evaluate("0 == false")).toBe(true);
    });

    test("loose equality with null and undefined", () => {
      expect(interpreter.evaluate("null == undefined")).toBe(true);
      expect(interpreter.evaluate("undefined == null")).toBe(true);
      expect(interpreter.evaluate("null == null")).toBe(true);
      expect(interpreter.evaluate("undefined == undefined")).toBe(true);
      expect(interpreter.evaluate("null == 0")).toBe(false);
      expect(interpreter.evaluate("undefined == 0")).toBe(false);
    });

    test("loose inequality with same types", () => {
      expect(interpreter.evaluate("5 != 3")).toBe(true);
      expect(interpreter.evaluate("5 != 5")).toBe(false);
    });

    test("loose inequality with type coercion", () => {
      expect(interpreter.evaluate("5 != '5'")).toBe(false);
      expect(interpreter.evaluate("5 != '6'")).toBe(true);
      expect(interpreter.evaluate("1 != true")).toBe(false);
      expect(interpreter.evaluate("2 != true")).toBe(true);
    });

    test("loose inequality with null and undefined", () => {
      expect(interpreter.evaluate("null != undefined")).toBe(false);
      expect(interpreter.evaluate("null != 0")).toBe(true);
    });
  });

  describe("Comparison Operators - Less Than", () => {
    test("less than with numbers", () => {
      expect(interpreter.evaluate("3 < 5")).toBe(true);
      expect(interpreter.evaluate("5 < 3")).toBe(false);
      expect(interpreter.evaluate("5 < 5")).toBe(false);
    });

    test("less than or equal", () => {
      expect(interpreter.evaluate("3 <= 5")).toBe(true);
      expect(interpreter.evaluate("5 <= 5")).toBe(true);
      expect(interpreter.evaluate("7 <= 5")).toBe(false);
    });

    test("less than with negative numbers", () => {
      expect(interpreter.evaluate("-5 < -3")).toBe(true);
      expect(interpreter.evaluate("-3 < -5")).toBe(false);
    });

    test("less than with expressions", () => {
      expect(interpreter.evaluate("2 + 1 < 5")).toBe(true);
      expect(interpreter.evaluate("3 * 2 < 5")).toBe(false);
    });
  });

  describe("Comparison Operators - Greater Than", () => {
    test("greater than with numbers", () => {
      expect(interpreter.evaluate("5 > 3")).toBe(true);
      expect(interpreter.evaluate("3 > 5")).toBe(false);
      expect(interpreter.evaluate("5 > 5")).toBe(false);
    });

    test("greater than or equal", () => {
      expect(interpreter.evaluate("5 >= 3")).toBe(true);
      expect(interpreter.evaluate("5 >= 5")).toBe(true);
      expect(interpreter.evaluate("5 >= 7")).toBe(false);
    });

    test("greater than with negative numbers", () => {
      expect(interpreter.evaluate("-3 > -5")).toBe(true);
      expect(interpreter.evaluate("-5 > -3")).toBe(false);
    });

    test("greater than with variables", () => {
      interpreter.evaluate("let x = 10");
      interpreter.evaluate("let y = 5");
      expect(interpreter.evaluate("x > y")).toBe(true);
    });
  });

  describe("Logical Operator - NOT (!)", () => {
    test("negates true", () => {
      expect(interpreter.evaluate("!true")).toBe(false);
    });

    test("negates false", () => {
      expect(interpreter.evaluate("!false")).toBe(true);
    });

    test("double negation", () => {
      expect(interpreter.evaluate("!!true")).toBe(true);
      expect(interpreter.evaluate("!!false")).toBe(false);
    });

    test("negates truthy number", () => {
      expect(interpreter.evaluate("!5")).toBe(false);
      expect(interpreter.evaluate("!0")).toBe(true);
    });

    test("negates comparison result", () => {
      expect(interpreter.evaluate("!(5 > 3)")).toBe(false);
      expect(interpreter.evaluate("!(3 > 5)")).toBe(true);
    });

    test("negates variable", () => {
      interpreter.evaluate("let x = true");
      expect(interpreter.evaluate("!x")).toBe(false);
    });
  });

  describe("Logical Operator - AND (&&)", () => {
    test("both true", () => {
      expect(interpreter.evaluate("true && true")).toBe(true);
    });

    test("first false", () => {
      expect(interpreter.evaluate("false && true")).toBe(false);
    });

    test("second false", () => {
      expect(interpreter.evaluate("true && false")).toBe(false);
    });

    test("both false", () => {
      expect(interpreter.evaluate("false && false")).toBe(false);
    });

    test("with comparison expressions", () => {
      expect(interpreter.evaluate("5 > 3 && 10 > 7")).toBe(true);
      expect(interpreter.evaluate("5 > 3 && 10 < 7")).toBe(false);
    });

    test("with variables", () => {
      interpreter.evaluate("let x = true");
      interpreter.evaluate("let y = false");
      expect(interpreter.evaluate("x && y")).toBe(false);
    });

    test("short-circuit evaluation - returns first falsy", () => {
      expect(interpreter.evaluate("0 && 5")).toBe(0);
      expect(interpreter.evaluate("false && 5")).toBe(false);
    });

    test("short-circuit evaluation - returns last if all truthy", () => {
      expect(interpreter.evaluate("5 && 10")).toBe(10);
      expect(interpreter.evaluate("true && 42")).toBe(42);
    });

    test("chains multiple AND operations", () => {
      expect(interpreter.evaluate("true && true && true")).toBe(true);
      expect(interpreter.evaluate("true && true && false")).toBe(false);
    });
  });

  describe("Logical Operator - OR (||)", () => {
    test("both true", () => {
      expect(interpreter.evaluate("true || true")).toBe(true);
    });

    test("first true", () => {
      expect(interpreter.evaluate("true || false")).toBe(true);
    });

    test("second true", () => {
      expect(interpreter.evaluate("false || true")).toBe(true);
    });

    test("both false", () => {
      expect(interpreter.evaluate("false || false")).toBe(false);
    });

    test("with comparison expressions", () => {
      expect(interpreter.evaluate("5 > 3 || 10 < 7")).toBe(true);
      expect(interpreter.evaluate("5 < 3 || 10 < 7")).toBe(false);
    });

    test("with variables", () => {
      interpreter.evaluate("let x = true");
      interpreter.evaluate("let y = false");
      expect(interpreter.evaluate("x || y")).toBe(true);
    });

    test("short-circuit evaluation - returns first truthy", () => {
      expect(interpreter.evaluate("5 || 0")).toBe(5);
      expect(interpreter.evaluate("true || false")).toBe(true);
    });

    test("short-circuit evaluation - returns last if all falsy", () => {
      expect(interpreter.evaluate("0 || false")).toBe(false);
      expect(interpreter.evaluate("false || 0")).toBe(0);
    });

    test("chains multiple OR operations", () => {
      expect(interpreter.evaluate("false || false || true")).toBe(true);
      expect(interpreter.evaluate("false || false || false")).toBe(false);
    });
  });

  describe("Complex Logical Expressions", () => {
    test("combines AND and OR", () => {
      expect(interpreter.evaluate("true && true || false")).toBe(true);
      expect(interpreter.evaluate("false && true || true")).toBe(true);
      expect(interpreter.evaluate("false && false || false")).toBe(false);
    });

    test("AND has higher precedence than OR", () => {
      expect(interpreter.evaluate("true || false && false")).toBe(true);
      expect(interpreter.evaluate("false || true && true")).toBe(true);
    });

    test("uses parentheses to override precedence", () => {
      expect(interpreter.evaluate("(true || false) && false")).toBe(false);
      expect(interpreter.evaluate("true || (false && false)")).toBe(true);
    });

    test("combines with NOT", () => {
      expect(interpreter.evaluate("!true && false")).toBe(false);
      expect(interpreter.evaluate("!false || false")).toBe(true);
      expect(interpreter.evaluate("!(true && false)")).toBe(true);
    });

    test("complex expression with comparisons", () => {
      expect(interpreter.evaluate("5 > 3 && 10 < 20 || false")).toBe(true);
      expect(interpreter.evaluate("!(5 > 10) && (3 < 5)")).toBe(true);
    });

    test("nested logical expressions", () => {
      expect(interpreter.evaluate("(true && true) && (false || true)")).toBe(true);
      expect(interpreter.evaluate("(true || false) && (true || false)")).toBe(true);
    });
  });

  describe("Comparison with Variables", () => {
    test("compare numeric variables", () => {
      interpreter.evaluate("let x = 10");
      interpreter.evaluate("let y = 5");
      expect(interpreter.evaluate("x > y")).toBe(true);
      expect(interpreter.evaluate("x < y")).toBe(false);
      expect(interpreter.evaluate("x === y")).toBe(false);
    });

    test("compare boolean variables", () => {
      interpreter.evaluate("let a = true");
      interpreter.evaluate("let b = false");
      expect(interpreter.evaluate("a && b")).toBe(false);
      expect(interpreter.evaluate("a || b")).toBe(true);
      expect(interpreter.evaluate("a === b")).toBe(false);
    });

    test("store comparison result in variable", () => {
      interpreter.evaluate("let x = 10");
      interpreter.evaluate("let y = 5");
      interpreter.evaluate("let isGreater = x > y");
      expect(interpreter.evaluate("isGreater")).toBe(true);
    });

    test("use comparison in assignment", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let isPositive = x > 0");
      expect(interpreter.evaluate("isPositive")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("comparing zero", () => {
      expect(interpreter.evaluate("0 === 0")).toBe(true);
      expect(interpreter.evaluate("0 < 1")).toBe(true);
      expect(interpreter.evaluate("0 > -1")).toBe(true);
    });

    test("comparing negative numbers", () => {
      expect(interpreter.evaluate("-5 < -3")).toBe(true);
      expect(interpreter.evaluate("-5 > -3")).toBe(false);
      expect(interpreter.evaluate("-5 === -5")).toBe(true);
    });

    test("comparing floating point", () => {
      expect(interpreter.evaluate("3.14 > 3")).toBe(true);
      expect(interpreter.evaluate("3.14 === 3.14")).toBe(true);
    });

    test("truthy and falsy values in logical operations", () => {
      expect(interpreter.evaluate("0 || 5")).toBe(5);
      expect(interpreter.evaluate("0 && 5")).toBe(0);
      expect(interpreter.evaluate("1 && 2")).toBe(2);
      expect(interpreter.evaluate("1 || 2")).toBe(1);
    });

    test("comparison with expression results", () => {
      expect(interpreter.evaluate("(2 + 3) === (1 + 4)")).toBe(true);
      expect(interpreter.evaluate("(10 / 2) > (3 * 1)")).toBe(true);
    });
  });

  describe("Practical Examples", () => {
    test("range check", () => {
      interpreter.evaluate("let x = 15");
      expect(interpreter.evaluate("x > 10 && x < 20")).toBe(true);
      expect(interpreter.evaluate("x < 10 || x > 20")).toBe(false);
    });

    test("validation logic", () => {
      interpreter.evaluate("let age = 25");
      interpreter.evaluate("let hasLicense = true");
      interpreter.evaluate("let canDrive = age >= 18 && hasLicense");
      expect(interpreter.evaluate("canDrive")).toBe(true);
    });

    test("default value pattern", () => {
      interpreter.evaluate("let x = 0");
      interpreter.evaluate("let value = x || 10");
      expect(interpreter.evaluate("value")).toBe(10);
    });

    test("guard pattern", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("let result = x > 0 && x * 2");
      expect(interpreter.evaluate("result")).toBe(10);
    });

    test("toggle pattern", () => {
      interpreter.evaluate("let flag = true");
      interpreter.evaluate("flag = !flag");
      expect(interpreter.evaluate("flag")).toBe(false);
    });
  });

  describe("Operator Precedence", () => {
    test("comparison before logical AND", () => {
      expect(interpreter.evaluate("5 > 3 && 10 > 7")).toBe(true);
    });

    test("comparison before logical OR", () => {
      expect(interpreter.evaluate("5 > 10 || 3 < 5")).toBe(true);
    });

    test("NOT before AND", () => {
      expect(interpreter.evaluate("!false && true")).toBe(true);
    });

    test("NOT before OR", () => {
      expect(interpreter.evaluate("!false || false")).toBe(true);
    });

    test("arithmetic before comparison", () => {
      expect(interpreter.evaluate("2 + 3 > 4")).toBe(true);
      expect(interpreter.evaluate("10 - 5 === 5")).toBe(true);
    });
  });

  describe("Bitwise Operators", () => {
    describe("Bitwise AND (&)", () => {
      test("basic AND operation", () => {
        expect(interpreter.evaluate("5 & 3")).toBe(1); // 0101 & 0011 = 0001
        expect(interpreter.evaluate("12 & 10")).toBe(8); // 1100 & 1010 = 1000
      });

      test("AND with zero", () => {
        expect(interpreter.evaluate("255 & 0")).toBe(0);
        expect(interpreter.evaluate("0 & 0")).toBe(0);
      });

      test("AND with all ones", () => {
        expect(interpreter.evaluate("255 & 255")).toBe(255);
      });

      test("AND with variables", () => {
        interpreter.evaluate("let x = 15");
        interpreter.evaluate("let y = 9");
        expect(interpreter.evaluate("x & y")).toBe(9); // 1111 & 1001 = 1001
      });
    });

    describe("Bitwise OR (|)", () => {
      test("basic OR operation", () => {
        expect(interpreter.evaluate("5 | 3")).toBe(7); // 0101 | 0011 = 0111
        expect(interpreter.evaluate("12 | 10")).toBe(14); // 1100 | 1010 = 1110
      });

      test("OR with zero", () => {
        expect(interpreter.evaluate("255 | 0")).toBe(255);
        expect(interpreter.evaluate("0 | 0")).toBe(0);
      });

      test("OR with variables", () => {
        interpreter.evaluate("let x = 4");
        interpreter.evaluate("let y = 1");
        expect(interpreter.evaluate("x | y")).toBe(5); // 0100 | 0001 = 0101
      });
    });

    describe("Bitwise XOR (^)", () => {
      test("basic XOR operation", () => {
        expect(interpreter.evaluate("5 ^ 3")).toBe(6); // 0101 ^ 0011 = 0110
        expect(interpreter.evaluate("12 ^ 10")).toBe(6); // 1100 ^ 1010 = 0110
      });

      test("XOR with same values", () => {
        expect(interpreter.evaluate("7 ^ 7")).toBe(0);
      });

      test("XOR with zero", () => {
        expect(interpreter.evaluate("42 ^ 0")).toBe(42);
      });

      test("XOR swap pattern", () => {
        interpreter.evaluate("let a = 5");
        interpreter.evaluate("let b = 10");
        interpreter.evaluate("a = a ^ b");
        interpreter.evaluate("b = a ^ b");
        interpreter.evaluate("a = a ^ b");
        expect(interpreter.evaluate("a")).toBe(10);
        expect(interpreter.evaluate("b")).toBe(5);
      });
    });

    describe("Left Shift (<<)", () => {
      test("basic left shift", () => {
        expect(interpreter.evaluate("1 << 0")).toBe(1);
        expect(interpreter.evaluate("1 << 1")).toBe(2);
        expect(interpreter.evaluate("1 << 2")).toBe(4);
        expect(interpreter.evaluate("1 << 3")).toBe(8);
      });

      test("left shift multiplies by powers of 2", () => {
        expect(interpreter.evaluate("5 << 1")).toBe(10);
        expect(interpreter.evaluate("5 << 2")).toBe(20);
        expect(interpreter.evaluate("3 << 3")).toBe(24);
      });

      test("left shift with variables", () => {
        interpreter.evaluate("let x = 1");
        expect(interpreter.evaluate("x << 4")).toBe(16);
      });
    });

    describe("Right Shift (>>)", () => {
      test("basic right shift", () => {
        expect(interpreter.evaluate("8 >> 0")).toBe(8);
        expect(interpreter.evaluate("8 >> 1")).toBe(4);
        expect(interpreter.evaluate("8 >> 2")).toBe(2);
        expect(interpreter.evaluate("8 >> 3")).toBe(1);
      });

      test("right shift divides by powers of 2", () => {
        expect(interpreter.evaluate("20 >> 1")).toBe(10);
        expect(interpreter.evaluate("20 >> 2")).toBe(5);
      });

      test("right shift preserves sign", () => {
        expect(interpreter.evaluate("-8 >> 1")).toBe(-4);
        expect(interpreter.evaluate("-8 >> 2")).toBe(-2);
      });
    });

    describe("Unsigned Right Shift (>>>)", () => {
      test("basic unsigned right shift", () => {
        expect(interpreter.evaluate("8 >>> 1")).toBe(4);
        expect(interpreter.evaluate("8 >>> 2")).toBe(2);
      });

      test("unsigned right shift with negative numbers", () => {
        expect(interpreter.evaluate("-1 >>> 0")).toBe(4294967295);
      });

      test("difference from signed right shift", () => {
        expect(interpreter.evaluate("-8 >> 1")).toBe(-4);
        expect(interpreter.evaluate("-8 >>> 1")).toBe(2147483644);
      });
    });

    describe("Bitwise Operator Precedence", () => {
      test("shift before comparison", () => {
        expect(interpreter.evaluate("1 << 2 > 2")).toBe(true); // (1 << 2) > 2 = 4 > 2
      });

      test("bitwise AND before bitwise OR", () => {
        expect(interpreter.evaluate("1 | 2 & 3")).toBe(3); // 1 | (2 & 3) = 1 | 2 = 3
      });

      test("bitwise XOR between AND and OR", () => {
        expect(interpreter.evaluate("1 | 2 ^ 3")).toBe(1); // 1 | (2 ^ 3) = 1 | 1 = 1
      });

      test("combined with arithmetic", () => {
        expect(interpreter.evaluate("2 + 3 << 1")).toBe(10); // (2 + 3) << 1 = 5 << 1 = 10
      });
    });

    describe("Practical Bitwise Examples", () => {
      test("check if number is even", () => {
        expect(interpreter.evaluate("4 & 1")).toBe(0); // even
        expect(interpreter.evaluate("5 & 1")).toBe(1); // odd
      });

      test("power of 2 check", () => {
        interpreter.evaluate(
          "let isPowerOf2 = function(n) { return n > 0 && (n & (n - 1)) === 0; }",
        );
        expect(interpreter.evaluate("isPowerOf2(8)")).toBe(true);
        expect(interpreter.evaluate("isPowerOf2(16)")).toBe(true);
        expect(interpreter.evaluate("isPowerOf2(10)")).toBe(false);
      });

      test("bit flags", () => {
        interpreter.evaluate("const READ = 1");
        interpreter.evaluate("const WRITE = 2");
        interpreter.evaluate("const EXECUTE = 4");
        interpreter.evaluate("let permissions = READ | WRITE");
        expect(interpreter.evaluate("(permissions & READ) !== 0")).toBe(true);
        expect(interpreter.evaluate("(permissions & EXECUTE) !== 0")).toBe(false);
      });

      test("clear lowest set bit", () => {
        expect(interpreter.evaluate("12 & (12 - 1)")).toBe(8); // 1100 & 1011 = 1000
      });
    });
  });
});
