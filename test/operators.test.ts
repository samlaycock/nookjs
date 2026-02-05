import { describe, test, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Operators", () => {
  describe("ES5", () => {
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

        test("NaN is not equal to itself", () => {
          expect(interpreter.evaluate("NaN === NaN")).toBe(false);
          expect(interpreter.evaluate("NaN !== NaN")).toBe(true);
          expect(interpreter.evaluate("NaN == NaN")).toBe(false);
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

        test("truthy objects in logical operations", () => {
          const result = interpreter.evaluate("({} || 5) === {}");
          expect(result).toBe(false);
          expect(interpreter.evaluate("[] || 5")).toEqual([]);
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

        test("default value pattern with empty string", () => {
          interpreter.evaluate("let x = ''");
          interpreter.evaluate("let value = x || 'default'");
          expect(interpreter.evaluate("value")).toBe("default");
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

        describe("Bitwise NOT (~)", () => {
          test("bitwise NOT of 0", () => {
            expect(interpreter.evaluate("~0")).toBe(-1);
          });

          test("bitwise NOT of positive number", () => {
            expect(interpreter.evaluate("~5")).toBe(-6);
          });

          test("bitwise NOT of negative number", () => {
            expect(interpreter.evaluate("~-1")).toBe(0);
          });

          test("double bitwise NOT truncates to integer", () => {
            expect(interpreter.evaluate("~~3.7")).toBe(3);
            expect(interpreter.evaluate("~~-3.7")).toBe(-3);
          });

          test("bitwise NOT of -1", () => {
            expect(interpreter.evaluate("~-1")).toBe(0);
          });

          test("bitwise NOT combined with other operators", () => {
            expect(interpreter.evaluate("~5 & 0xFF")).toBe(250); // ~5 = -6, -6 & 0xFF = 250
          });

          test("bitwise NOT in expressions", () => {
            interpreter.evaluate("let x = 10");
            expect(interpreter.evaluate("~x")).toBe(-11);
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

    describe("typeof Operator", () => {
      describe("Primitive types", () => {
        it("should return 'number' for numbers", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof 42")).toBe("number");
          expect(interpreter.evaluate("typeof 3.14")).toBe("number");
          expect(interpreter.evaluate("typeof 0")).toBe("number");
          expect(interpreter.evaluate("typeof -5")).toBe("number");
          expect(interpreter.evaluate("typeof NaN")).toBe("number");
        });

        it("should return 'string' for strings", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate('typeof "hello"')).toBe("string");
          expect(interpreter.evaluate('typeof ""')).toBe("string");
          expect(interpreter.evaluate("typeof 'world'")).toBe("string");
        });

        it("should return 'boolean' for booleans", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof true")).toBe("boolean");
          expect(interpreter.evaluate("typeof false")).toBe("boolean");
        });

        it("should return 'undefined' for undefined", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x");
          expect(interpreter.evaluate("typeof x")).toBe("undefined");
        });

        it("should return 'object' for null", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = null");
          // This matches JavaScript behavior (typeof null === "object")
          expect(interpreter.evaluate("typeof x")).toBe("object");
        });
      });

      describe("Complex types", () => {
        it("should return 'object' for objects", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let obj = { a: 1 }");
          expect(interpreter.evaluate("typeof obj")).toBe("object");
        });

        it("should return 'object' for arrays", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let arr = [1, 2, 3]");
          expect(interpreter.evaluate("typeof arr")).toBe("object");
        });

        it("should return 'function' for functions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("function test() { return 42; }");
          expect(interpreter.evaluate("typeof test")).toBe("function");
        });

        it("should return 'function' for arrow functions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let arrow = x => x * 2");
          expect(interpreter.evaluate("typeof arrow")).toBe("function");
        });
      });

      describe("With variables", () => {
        it("should work with declared variables", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let num = 42");
          interpreter.evaluate('let str = "hello"');
          interpreter.evaluate("let bool = true");
          expect(interpreter.evaluate("typeof num")).toBe("number");
          expect(interpreter.evaluate("typeof str")).toBe("string");
          expect(interpreter.evaluate("typeof bool")).toBe("boolean");
        });

        it("should work with undefined variables", () => {
          const interpreter = new Interpreter();
          // typeof on undefined variable should return "undefined", not throw
          expect(interpreter.evaluate("typeof undefinedVar")).toBe("undefined");
          expect(interpreter.evaluate("typeof neverDeclared")).toBe("undefined");
        });

        it("should work with const variables", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("const PI = 3.14");
          expect(interpreter.evaluate("typeof PI")).toBe("number");
        });
      });

      describe("With expressions", () => {
        it("should work with arithmetic expressions", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof (5 + 3)")).toBe("number");
          expect(interpreter.evaluate("typeof (10 - 2)")).toBe("number");
          expect(interpreter.evaluate("typeof (3 * 4)")).toBe("number");
        });

        it("should work with comparison expressions", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof (5 > 3)")).toBe("boolean");
          expect(interpreter.evaluate("typeof (10 === 10)")).toBe("boolean");
        });

        it("should work with logical expressions", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof (true && false)")).toBe("boolean");
          expect(interpreter.evaluate("typeof (true || false)")).toBe("boolean");
        });

        it("should work with string concatenation", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate('typeof ("hello" + " world")')).toBe("string");
        });

        it("should work with ternary expressions", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("typeof (true ? 42 : 'string')")).toBe("number");
          expect(interpreter.evaluate('typeof (false ? 42 : "string")')).toBe("string");
        });
      });

      describe("With function calls", () => {
        it("should work with function return values", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("function getNumber() { return 42; }");
          interpreter.evaluate('function getString() { return "hello"; }');
          expect(interpreter.evaluate("typeof getNumber()")).toBe("number");
          expect(interpreter.evaluate("typeof getString()")).toBe("string");
        });

        it("should work with function expressions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let fn = function() { return true; }");
          expect(interpreter.evaluate("typeof fn()")).toBe("boolean");
        });

        it("should work with arrow function returns", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let double = x => x * 2");
          expect(interpreter.evaluate("typeof double(5)")).toBe("number");
        });
      });

      describe("With host functions", () => {
        it("should return 'function' for host functions", () => {
          const hostFunc = () => 42;
          const interpreter = new Interpreter({
            globals: { hostFunc },
          });
          expect(interpreter.evaluate("typeof hostFunc")).toBe("function");
        });

        it("should work with host function return values", () => {
          const getNumber = () => 42;
          const getString = () => "hello";
          const interpreter = new Interpreter({
            globals: { getNumber, getString },
          });
          expect(interpreter.evaluate("typeof getNumber()")).toBe("number");
          expect(interpreter.evaluate("typeof getString()")).toBe("string");
        });
      });

      describe("In control flow", () => {
        it("should work in if statements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 42;
            let result;
            if (typeof x === "number") {
              result = "is number";
            } else {
              result = "not number";
            }
            result
          `);
          expect(result).toBe("is number");
        });

        it("should work in loops", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let values = [42, "hello", true, null];
            let types = [];
            for (let i = 0; i < values.length; i++) {
              types[i] = typeof values[i];
            }
            types
          `);
          expect(result).toEqual(["number", "string", "boolean", "object"]);
        });

        it("should work in ternary expressions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = 42");
          const result = interpreter.evaluate('typeof x === "number" ? "numeric" : "non-numeric"');
          expect(result).toBe("numeric");
        });
      });

      describe("In return statements", () => {
        it("should work in function returns", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate(`
            function getType(val) {
              return typeof val;
            }
          `);
          expect(interpreter.evaluate("getType(42)")).toBe("number");
          expect(interpreter.evaluate('getType("hello")')).toBe("string");
          expect(interpreter.evaluate("getType(true)")).toBe("boolean");
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let getType = val => typeof val");
          expect(interpreter.evaluate("getType(42)")).toBe("number");
        });
      });

      describe("Type guards", () => {
        it("should enable type checking patterns", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function safeAdd(a, b) {
              if (typeof a === "number" && typeof b === "number") {
                return a + b;
              }
              return 0;
            }
            safeAdd(5, 3)
          `);
          expect(result).toBe(8);
        });

        it("should work with string type guards", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function isString(val) {
              return typeof val === "string";
            }
            isString("hello")
          `);
          expect(result).toBe(true);
        });

        it("should work with function detection", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function isFunction(val) {
              return typeof val === "function";
            }
            let fn = x => x * 2;
            isFunction(fn)
          `);
          expect(result).toBe(true);
        });
      });

      describe("Async support", () => {
        it("should work with evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("typeof 42");
          expect(result).toBe("number");
        });

        it("should work with async host functions", async () => {
          const asyncGetNumber = async () => 42;
          const interpreter = new Interpreter({
            globals: { asyncGetNumber },
          });
          const result = await interpreter.evaluateAsync("typeof asyncGetNumber()");
          expect(result).toBe("number");
        });

        it("should work in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function checkType(val) {
              return typeof val;
            }
            checkType(42)
          `);
          expect(result).toBe("number");
        });

        it("should work with undefined in async", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("typeof undefinedVar");
          expect(result).toBe("undefined");
        });
      });

      describe("Edge cases", () => {
        it("should handle typeof typeof", () => {
          const interpreter = new Interpreter();
          // typeof always returns a string, so typeof (typeof x) is always "string"
          expect(interpreter.evaluate("typeof (typeof 42)")).toBe("string");
        });

        it("should work with property access", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let obj = { num: 42, str: 'hello' }");
          expect(interpreter.evaluate("typeof obj.num")).toBe("number");
          expect(interpreter.evaluate("typeof obj.str")).toBe("string");
        });

        it("should work with array elements", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let arr = [42, 'hello', true]");
          expect(interpreter.evaluate("typeof arr[0]")).toBe("number");
          expect(interpreter.evaluate("typeof arr[1]")).toBe("string");
          expect(interpreter.evaluate("typeof arr[2]")).toBe("boolean");
        });

        it("should work as function argument", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate(`
            function logType(type) {
              return type;
            }
          `);
          expect(interpreter.evaluate("logType(typeof 42)")).toBe("number");
        });

        it("should work in object literals", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = 42");
          const result = interpreter.evaluate("let obj = { type: typeof x }; obj");
          expect(result).toEqual({ type: "number" });
        });

        it("should work in array literals", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = 42");
          interpreter.evaluate('let y = "hello"');
          const result = interpreter.evaluate("[typeof x, typeof y]");
          expect(result).toEqual(["number", "string"]);
        });
      });
    });

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
          expect(
            interpreter.evaluate("({}) instanceof Array", {
              globals: { Array },
            }),
          ).toBe(false);
        });

        test("works with Object", () => {
          expect(
            interpreter.evaluate("({a: 1}) instanceof Object", {
              globals: { Object },
            }),
          ).toBe(true);
        });

        test("arrays are also instances of Object", () => {
          expect(
            interpreter.evaluate("[] instanceof Object", {
              globals: { Object },
            }),
          ).toBe(true);
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
          expect(
            interpreter.evaluate("null instanceof Object", {
              globals: { Object },
            }),
          ).toBe(false);
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
          expect(
            interpreter.evaluate("!(5 instanceof Number)", {
              globals: { Number },
            }),
          ).toBe(true);
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

    describe("in operator", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Object properties", () => {
        test("returns true for existing property", () => {
          expect(interpreter.evaluate("'a' in {a: 1}")).toBe(true);
        });

        test("returns false for non-existing property", () => {
          expect(interpreter.evaluate("'b' in {a: 1}")).toBe(false);
        });

        test("works with variables", () => {
          interpreter.evaluate("let obj = {x: 10, y: 20}");
          expect(interpreter.evaluate("'x' in obj")).toBe(true);
          expect(interpreter.evaluate("'z' in obj")).toBe(false);
        });

        test("works with computed property names", () => {
          interpreter.evaluate("let key = 'foo'");
          interpreter.evaluate("let obj = {foo: 'bar'}");
          expect(interpreter.evaluate("key in obj")).toBe(true);
        });

        test("checks for property existence, not value", () => {
          interpreter.evaluate("let obj = {a: undefined}");
          expect(interpreter.evaluate("'a' in obj")).toBe(true);
        });

        test("works with nested objects", () => {
          interpreter.evaluate("let obj = {outer: {inner: 1}}");
          expect(interpreter.evaluate("'outer' in obj")).toBe(true);
          expect(interpreter.evaluate("'inner' in obj")).toBe(false);
        });
      });

      describe("Array indices", () => {
        test("returns true for existing index", () => {
          expect(interpreter.evaluate("0 in [1, 2, 3]")).toBe(true);
          expect(interpreter.evaluate("2 in [1, 2, 3]")).toBe(true);
        });

        test("returns false for out of bounds index", () => {
          expect(interpreter.evaluate("5 in [1, 2, 3]")).toBe(false);
        });

        test("works with string indices", () => {
          expect(interpreter.evaluate("'0' in [1, 2, 3]")).toBe(true);
          expect(interpreter.evaluate("'length' in [1, 2, 3]")).toBe(true);
        });

        test("works with negative indices (treated as property names)", () => {
          expect(interpreter.evaluate("-1 in [1, 2, 3]")).toBe(false);
        });
      });

      describe("Error cases", () => {
        test("throws for non-object right operand (number)", () => {
          expect(() => {
            interpreter.evaluate("'a' in 5");
          }).toThrow("Cannot use 'in' operator");
        });

        test("throws for non-object right operand (string)", () => {
          expect(() => {
            interpreter.evaluate("'a' in 'hello'");
          }).toThrow("Cannot use 'in' operator");
        });

        test("throws for null", () => {
          expect(() => {
            interpreter.evaluate("'a' in null");
          }).toThrow("Cannot use 'in' operator");
        });

        test("throws for undefined", () => {
          expect(() => {
            interpreter.evaluate("'a' in undefined");
          }).toThrow("Cannot use 'in' operator");
        });
      });

      describe("Practical examples", () => {
        test("property existence check", () => {
          interpreter.evaluate(`
            let user = {name: 'Alice', age: 30};
            let hasEmail = 'email' in user;
            let hasName = 'name' in user;
          `);
          expect(interpreter.evaluate("hasEmail")).toBe(false);
          expect(interpreter.evaluate("hasName")).toBe(true);
        });

        test("works in conditionals", () => {
          const result = interpreter.evaluate(`
            let obj = {a: 1};
            if ('a' in obj) {
              'found';
            } else {
              'not found';
            }
          `);
          expect(result).toBe("found");
        });

        test("works with logical operators", () => {
          interpreter.evaluate("let obj = {a: 1, b: 2}");
          expect(interpreter.evaluate("'a' in obj && 'b' in obj")).toBe(true);
          expect(interpreter.evaluate("'a' in obj && 'c' in obj")).toBe(false);
          expect(interpreter.evaluate("'c' in obj || 'a' in obj")).toBe(true);
        });
      });

      describe("Async evaluation", () => {
        test("works with async evaluation", async () => {
          const result = await interpreter.evaluateAsync("'a' in {a: 1}");
          expect(result).toBe(true);
        });
      });
    });

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

    describe("void operator", () => {
      it("should return undefined for void 0", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate("void 0");
        expect(result).toBe(undefined);
      });

      it("should return undefined for any literal", () => {
        const interpreter = new Interpreter();
        expect(interpreter.evaluate("void 1")).toBe(undefined);
        expect(interpreter.evaluate("void 'hello'")).toBe(undefined);
        expect(interpreter.evaluate("void true")).toBe(undefined);
        expect(interpreter.evaluate("void null")).toBe(undefined);
      });

      it("should return undefined for expressions", () => {
        const interpreter = new Interpreter();
        expect(interpreter.evaluate("void (1 + 2)")).toBe(undefined);
        expect(interpreter.evaluate("void (2 * 3 + 4)")).toBe(undefined);
      });

      it("should evaluate the operand for side effects", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let x = 0;
          void (x = 5);
          x;
        `);
        expect(result).toBe(5);
      });

      it("should evaluate function calls for side effects", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          let called = false;
          function f() { called = true; return 42; }
          void f();
          called;
        `);
        expect(result).toBe(true);
      });

      it("should work in larger expressions", () => {
        const interpreter = new Interpreter();
        // void 0 is undefined, so (void 0 || 2) is 2
        const result = interpreter.evaluate("1 + (void 0 || 2)");
        expect(result).toBe(3);
      });

      it("should work with variables", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
          const x = 42;
          void x;
        `);
        expect(result).toBe(undefined);
      });

      it("should work in async evaluation", async () => {
        const interpreter = new Interpreter();
        const result = await interpreter.evaluateAsync("void (1 + 2)");
        expect(result).toBe(undefined);
      });
    });

    describe("Update expressions on member expressions", () => {
      describe("Postfix increment (obj.prop++)", () => {
        it("should increment object property", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            obj.x++;
            obj.x;
          `);
          expect(result).toBe(6);
        });

        it("should return old value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            obj.x++;
          `);
          expect(result).toBe(5);
        });
      });

      describe("Postfix decrement (obj.prop--)", () => {
        it("should decrement object property", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            obj.x--;
            obj.x;
          `);
          expect(result).toBe(4);
        });

        it("should return old value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            obj.x--;
          `);
          expect(result).toBe(5);
        });
      });

      describe("Prefix increment (++obj.prop)", () => {
        it("should increment and return new value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            ++obj.x;
          `);
          expect(result).toBe(6);
        });
      });

      describe("Prefix decrement (--obj.prop)", () => {
        it("should decrement and return new value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { x: 5 };
            --obj.x;
          `);
          expect(result).toBe(4);
        });
      });

      describe("Computed member expressions", () => {
        it("should support arr[index]++", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const arr = [10, 20, 30];
            arr[1]++;
            arr[1];
          `);
          expect(result).toBe(21);
        });

        it("should support obj[key]++", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { a: 1 };
            const k = "a";
            obj[k]++;
            obj.a;
          `);
          expect(result).toBe(2);
        });
      });

      describe("Nested member expressions", () => {
        it("should support nested obj.a.b++", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const obj = { a: { b: 10 } };
            obj.a.b++;
            obj.a.b;
          `);
          expect(result).toBe(11);
        });
      });
    });

    describe("Compound Assignment Operators", () => {
      describe("Arithmetic operators", () => {
        test("+= addition assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 5; x += 3; x`)).toBe(8);
        });

        test("-= subtraction assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 10; x -= 3; x`)).toBe(7);
        });

        test("*= multiplication assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 4; x *= 3; x`)).toBe(12);
        });

        test("/= division assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 20; x /= 4; x`)).toBe(5);
        });

        test("%= modulo assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 17; x %= 5; x`)).toBe(2);
        });

        test("**= exponentiation assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 2; x **= 3; x`)).toBe(8);
        });
      });

      describe("Bitwise operators", () => {
        test("<<= left shift assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 5; x <<= 2; x`)).toBe(20);
        });

        test(">>= right shift assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 20; x >>= 2; x`)).toBe(5);
        });

        test(">>>= unsigned right shift assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = -8; x >>>= 2; x`)).toBe(1073741822);
        });

        test("&= bitwise AND assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 15; x &= 9; x`)).toBe(9);
        });

        test("|= bitwise OR assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 5; x |= 3; x`)).toBe(7);
        });

        test("^= bitwise XOR assignment", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 15; x ^= 5; x`)).toBe(10);
        });
      });

      describe("String concatenation", () => {
        test("+= string concatenation", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let s = "hello"; s += " world"; s`)).toBe("hello world");
        });

        test("+= mixed string and number", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let s = "count: "; s += 42; s`)).toBe("count: 42");
        });
      });

      describe("Array element assignment", () => {
        test("+= on array element", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let arr = [1, 2, 3]; arr[1] += 10; arr[1]`)).toBe(12);
        });

        test("-= on array element", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let arr = [10, 20, 30]; arr[0] -= 5; arr[0]`)).toBe(5);
        });

        test("*= on array element with computed index", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let arr = [1, 2, 3]; let i = 2; arr[i] *= 4; arr[2]`)).toBe(
            12,
          );
        });
      });

      describe("Object property assignment", () => {
        test("+= on object property", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let obj = { x: 5 }; obj.x += 3; obj.x`)).toBe(8);
        });

        test("-= on object property", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let obj = { value: 100 }; obj.value -= 25; obj.value`)).toBe(
            75,
          );
        });

        test("+= on computed object property", () => {
          const interpreter = new Interpreter();
          expect(
            interpreter.evaluate(
              `let obj = { key: 10 }; let prop = "key"; obj[prop] += 5; obj.key`,
            ),
          ).toBe(15);
        });

        test("*= on nested object property", () => {
          const interpreter = new Interpreter();
          expect(
            interpreter.evaluate(
              `let obj = { inner: { value: 7 } }; obj.inner.value *= 3; obj.inner.value`,
            ),
          ).toBe(21);
        });
      });

      describe("Class instance properties", () => {
        test("+= on class instance property", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            class Counter {
              constructor() {
                this.count = 0;
              }
              increment(n) {
                this.count += n;
                return this.count;
              }
            }
            const c = new Counter();
            c.increment(5);
            c.increment(3);
          `);
          expect(result).toBe(8);
        });

        test("-= on class instance property", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            class Balance {
              constructor(initial) {
                this.amount = initial;
              }
              withdraw(n) {
                this.amount -= n;
                return this.amount;
              }
            }
            const b = new Balance(100);
            b.withdraw(30);
          `);
          expect(result).toBe(70);
        });
      });

      describe("Private fields", () => {
        test("+= on private field", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            class Counter {
              #count = 0;
              add(n) {
                this.#count += n;
                return this.#count;
              }
            }
            const c = new Counter();
            c.add(5);
            c.add(10);
          `);
          expect(result).toBe(15);
        });
      });

      describe("Return value", () => {
        test("compound assignment returns the new value", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 5; (x += 3)`)).toBe(8);
        });

        test("compound assignment in expression context", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate(`let x = 5; let y = (x += 3) * 2; y`)).toBe(16);
        });
      });

      describe("Async evaluation", () => {
        test("+= works in async context", async () => {
          const interpreter = new Interpreter({ globals: { Promise } });
          const result = await interpreter.evaluateAsync(`
            let x = 5;
            x += 3;
            x;
          `);
          expect(result).toBe(8);
        });

        test("+= on object property in async context", async () => {
          const interpreter = new Interpreter({ globals: { Promise } });
          const result = await interpreter.evaluateAsync(`
            async function run() {
              let obj = { value: 10 };
              await Promise.resolve();
              obj.value += 5;
              return obj.value;
            }
            run()
          `);
          expect(result).toBe(15);
        });
      });

      describe("Chained operations", () => {
        test("multiple compound assignments in sequence", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 10;
            x += 5;
            x *= 2;
            x -= 10;
            x /= 5;
            x;
          `);
          expect(result).toBe(4);
        });

        test("compound assignment in loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let sum = 0;
            for (let i = 1; i <= 5; i++) {
              sum += i;
            }
            sum;
          `);
          expect(result).toBe(15);
        });
      });
    });

    describe("Sequence Expression (Comma Operator)", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("basic comma operator", () => {
        test("returns the last value", () => {
          const result = interpreter.evaluate(`(1, 2, 3)`);
          expect(result).toBe(3);
        });

        test("two operands", () => {
          const result = interpreter.evaluate(`(10, 20)`);
          expect(result).toBe(20);
        });

        test("evaluates all expressions for side effects", () => {
          const result = interpreter.evaluate(`
            let x = 0;
            (x = 1, x = x + 10, x = x * 2);
            x;
          `);
          expect(result).toBe(22);
        });

        test("works with different types", () => {
          const result = interpreter.evaluate(`("hello", true, 42)`);
          expect(result).toBe(42);
        });
      });

      describe("comma operator in for loops", () => {
        test("multiple update expressions", () => {
          const result = interpreter.evaluate(`
            let a = 0;
            let b = 10;
            for (let i = 0; i < 3; i++, a++, b--) {}
            [a, b];
          `);
          expect(result).toEqual([3, 7]);
        });

        test("multiple init expressions via comma in for update", () => {
          const result = interpreter.evaluate(`
            let sum = 0;
            for (let i = 0, j = 10; i < j; i++, j--) {
              sum = sum + 1;
            }
            sum;
          `);
          expect(result).toBe(5);
        });
      });

      describe("comma operator in expressions", () => {
        test("in parenthesized expression", () => {
          const result = interpreter.evaluate(`
            let x = (1, 2, 3);
            x;
          `);
          expect(result).toBe(3);
        });

        test("function calls as operands", () => {
          const result = interpreter.evaluate(`
            let log = [];
            function a() { log.push("a"); return 1; }
            function b() { log.push("b"); return 2; }
            function c() { log.push("c"); return 3; }
            const result = (a(), b(), c());
            [result, log];
          `);
          expect(result).toEqual([3, ["a", "b", "c"]]);
        });

        test("in return statement", () => {
          const result = interpreter.evaluate(`
            function foo() {
              return (1, 2, 42);
            }
            foo();
          `);
          expect(result).toBe(42);
        });

        test("does not affect function arguments", () => {
          const result = interpreter.evaluate(`
            function add(a, b) { return a + b; }
            add(1, 2);
          `);
          expect(result).toBe(3);
        });

        test("does not affect array literals", () => {
          const result = interpreter.evaluate(`[1, 2, 3]`);
          expect(result).toEqual([1, 2, 3]);
        });

        test("does not affect object literals", () => {
          const result = interpreter.evaluate(`
            const obj = { a: 1, b: 2 };
            obj.a + obj.b;
          `);
          expect(result).toBe(3);
        });
      });
    });

    describe("Ternary Operator", () => {
      describe("Basic ternary expressions", () => {
        it("should evaluate true condition", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("true ? 10 : 20")).toBe(10);
        });

        it("should evaluate false condition", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("false ? 10 : 20")).toBe(20);
        });

        it("should work with numbers", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("5 > 3 ? 100 : 200")).toBe(100);
          expect(interpreter.evaluate("2 > 5 ? 100 : 200")).toBe(200);
        });

        it("should work with strings", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate('true ? "yes" : "no"')).toBe("yes");
          expect(interpreter.evaluate('false ? "yes" : "no"')).toBe("no");
        });
      });

      describe("Ternary with variables", () => {
        it("should work with variable in condition", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = 10");
          expect(interpreter.evaluate("x > 5 ? 'big' : 'small'")).toBe("big");
        });

        it("should work with variables in branches", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let a = 10");
          interpreter.evaluate("let b = 20");
          expect(interpreter.evaluate("true ? a : b")).toBe(10);
          expect(interpreter.evaluate("false ? a : b")).toBe(20);
        });

        it("should assign ternary result to variable", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let age = 25");
          interpreter.evaluate('let status = age >= 18 ? "adult" : "minor"');
          expect(interpreter.evaluate("status")).toBe("adult");
        });
      });

      describe("Nested ternary expressions", () => {
        it("should handle nested ternary in consequent", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let a = 5");
          interpreter.evaluate("let b = 3");
          const result = interpreter.evaluate(
            'a > 0 ? (b > 0 ? "both positive" : "a positive") : "a negative"',
          );
          expect(result).toBe("both positive");
        });

        it("should handle nested ternary in alternate", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let a = -1");
          interpreter.evaluate("let b = 3");
          const result = interpreter.evaluate(
            'a > 0 ? "a positive" : (b > 0 ? "only b positive" : "both negative")',
          );
          expect(result).toBe("only b positive");
        });

        it("should handle multiple levels of nesting", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let score = 85");
          const result = interpreter.evaluate(
            'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"',
          );
          expect(result).toBe("B");
        });
      });

      describe("Ternary with expressions", () => {
        it("should evaluate arithmetic in branches", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("true ? 5 + 3 : 10 - 2")).toBe(8);
          expect(interpreter.evaluate("false ? 5 + 3 : 10 - 2")).toBe(8);
        });

        it("should evaluate function calls in branches", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate(`
            function double(x) { return x * 2; }
            function triple(x) { return x * 3; }
          `);
          expect(interpreter.evaluate("true ? double(5) : triple(5)")).toBe(10);
          expect(interpreter.evaluate("false ? double(5) : triple(5)")).toBe(15);
        });

        it("should evaluate complex condition", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = 10");
          interpreter.evaluate("let y = 20");
          expect(interpreter.evaluate("x > 5 && y < 30 ? 100 : 200")).toBe(100);
          expect(interpreter.evaluate("x > 15 || y < 10 ? 100 : 200")).toBe(200);
        });
      });

      describe("Ternary with objects and arrays", () => {
        it("should return object from ternary", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate('true ? { name: "Alice" } : { name: "Bob" }');
          expect(result).toEqual({ name: "Alice" });
        });

        it("should return array from ternary", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("false ? [1, 2] : [3, 4]");
          expect(result).toEqual([3, 4]);
        });

        it("should access properties on ternary result", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let isAdmin = true");
          const result = interpreter.evaluate(
            '(isAdmin ? { role: "admin" } : { role: "user" }).role',
          );
          expect(result).toBe("admin");
        });
      });

      describe("Ternary with falsy values", () => {
        it("should handle 0 as falsy", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("0 ? 'truthy' : 'falsy'")).toBe("falsy");
        });

        it("should handle empty string as falsy", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("\"\" ? 'truthy' : 'falsy'")).toBe("falsy");
        });

        it("should handle null as falsy", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x = null");
          expect(interpreter.evaluate("x ? 'truthy' : 'falsy'")).toBe("falsy");
        });

        it("should handle undefined as falsy", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let x");
          expect(interpreter.evaluate("x ? 'truthy' : 'falsy'")).toBe("falsy");
        });

        it("should handle truthy values correctly", () => {
          const interpreter = new Interpreter();
          expect(interpreter.evaluate("1 ? 'truthy' : 'falsy'")).toBe("truthy");
          expect(interpreter.evaluate("\"hello\" ? 'truthy' : 'falsy'")).toBe("truthy");
          interpreter.evaluate("let arr = []");
          expect(interpreter.evaluate("arr ? 'truthy' : 'falsy'")).toBe("truthy");
          interpreter.evaluate("let obj = {}");
          expect(interpreter.evaluate("obj ? 'truthy' : 'falsy'")).toBe("truthy");
        });
      });

      describe("Ternary in return statements", () => {
        it("should return ternary result from function", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate(`
            function getMax(a, b) {
              return a > b ? a : b;
            }
          `);
          expect(interpreter.evaluate("getMax(10, 5)")).toBe(10);
          expect(interpreter.evaluate("getMax(3, 7)")).toBe(7);
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let isEven = x => x % 2 === 0 ? true : false");
          expect(interpreter.evaluate("isEven(4)")).toBe(true);
          expect(interpreter.evaluate("isEven(5)")).toBe(false);
        });
      });

      describe("Ternary in loops", () => {
        it("should work in for loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = [];
            for (let i = 0; i < 5; i++) {
              result[i] = i % 2 === 0 ? "even" : "odd";
            }
            result
          `);
          expect(result).toEqual(["even", "odd", "even", "odd", "even"]);
        });

        it("should work in while loop condition", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let count = 0;
            let limit = 5;
            while (count < (count > 2 ? 4 : limit)) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(4);
        });
      });

      describe("Async ternary expressions", () => {
        it("should work with evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("true ? 100 : 200");
          expect(result).toBe(100);
        });

        it("should work with async host functions in branches", async () => {
          const asyncDouble = async (x: number) => x * 2;
          const asyncTriple = async (x: number) => x * 3;
          const interpreter = new Interpreter({
            globals: { asyncDouble, asyncTriple },
          });
          const result1 = await interpreter.evaluateAsync("true ? asyncDouble(5) : asyncTriple(5)");
          expect(result1).toBe(10);

          const result2 = await interpreter.evaluateAsync(
            "false ? asyncDouble(5) : asyncTriple(5)",
          );
          expect(result2).toBe(15);
        });

        it("should work in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function classify(num) {
              return num > 0 ? "positive" : num < 0 ? "negative" : "zero";
            }
            classify(-5)
          `);
          expect(result).toBe("negative");
        });

        it("should work with await in ternary branches", async () => {
          const asyncGetValue = async (x: number) => x * 10;
          const interpreter = new Interpreter({
            globals: { asyncGetValue },
          });
          const result = await interpreter.evaluateAsync(`
            async function test(condition) {
              return condition ? await asyncGetValue(1) : await asyncGetValue(2);
            }
            test(true)
          `);
          expect(result).toBe(10);
        });
      });

      describe("Edge cases", () => {
        it("should not evaluate alternate if condition is true", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let sideEffect = 0");
          interpreter.evaluate("true ? 1 : (sideEffect = 1)");
          expect(interpreter.evaluate("sideEffect")).toBe(0);
        });

        it("should not evaluate consequent if condition is false", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("let sideEffect = 0");
          interpreter.evaluate("false ? (sideEffect = 1) : 2");
          expect(interpreter.evaluate("sideEffect")).toBe(0);
        });

        it("should work with ternary as function argument", () => {
          const interpreter = new Interpreter();
          interpreter.evaluate("function add(a, b) { return a + b; }");
          expect(interpreter.evaluate("add(true ? 5 : 10, false ? 3 : 7)")).toBe(12);
        });

        it("should work with ternary in array literal", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("let arr = [true ? 1 : 2, false ? 3 : 4]; arr");
          expect(result).toEqual([1, 4]);
        });

        it("should work with ternary in object literal", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(
            'let obj = { a: true ? 10 : 20, b: false ? "x" : "y" }; obj',
          );
          expect(result).toEqual({ a: 10, b: "y" });
        });
      });
    });
  });

  describe("ES2016", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Exponentiation Operator", () => {
      it("should compute power", () => {
        expect(interpreter.evaluate("2 ** 3")).toBe(8);
      });

      it("should use **=", () => {
        expect(
          interpreter.evaluate(`
                  let x = 2;
                  x **= 3;
                  x
                `),
        ).toBe(8);
      });

      it("should be right-associative", () => {
        expect(interpreter.evaluate("2 ** 3 ** 2")).toBe(512);
      });
    });
  });

  describe("ES2021", () => {
    describe("Logical Assignment Operators", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Nullish Coalescing Operator (??)", () => {
        test("returns left when left is truthy", () => {
          expect(interpreter.evaluate("5 ?? 10")).toBe(5);
          expect(interpreter.evaluate("'hello' ?? 'world'")).toBe("hello");
          expect(interpreter.evaluate("true ?? false")).toBe(true);
        });

        test("returns left when left is falsy but not nullish", () => {
          expect(interpreter.evaluate("0 ?? 10")).toBe(0);
          expect(interpreter.evaluate("'' ?? 'default'")).toBe("");
          expect(interpreter.evaluate("false ?? true")).toBe(false);
        });

        test("returns right when left is null", () => {
          expect(interpreter.evaluate("null ?? 'default'")).toBe("default");
          expect(interpreter.evaluate("null ?? 42")).toBe(42);
        });

        test("returns right when left is undefined", () => {
          interpreter.evaluate("let x");
          expect(interpreter.evaluate("x ?? 'default'")).toBe("default");
          expect(interpreter.evaluate("undefined ?? 42")).toBe(42);
        });

        test("short-circuits evaluation", () => {
          interpreter.evaluate("let counter = 0");
          interpreter.evaluate(
            "let getValue = function() { counter = counter + 1; return 'evaluated'; }",
          );
          interpreter.evaluate("let result = 'existing' ?? getValue()");
          expect(interpreter.evaluate("counter")).toBe(0);
          expect(interpreter.evaluate("result")).toBe("existing");
        });

        test("chains correctly", () => {
          expect(interpreter.evaluate("null ?? undefined ?? 'final'")).toBe("final");
          expect(interpreter.evaluate("null ?? 'middle' ?? 'final'")).toBe("middle");
        });

        test("works with variables", () => {
          interpreter.evaluate("let a = null");
          interpreter.evaluate("let b = 'value'");
          expect(interpreter.evaluate("a ?? b")).toBe("value");
        });
      });

      describe("Logical OR Assignment (||=)", () => {
        test("should use ||=", () => {
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x ||= 5");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("assigns when variable is falsy", () => {
          interpreter.evaluate("let x = 0");
          interpreter.evaluate("x ||= 10");
          expect(interpreter.evaluate("x")).toBe(10);
        });

        test("does not assign when variable is truthy", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("x ||= 10");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("assigns when variable is null", () => {
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x ||= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("assigns when variable is undefined", () => {
          interpreter.evaluate("let x");
          interpreter.evaluate("x ||= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("assigns when variable is empty string", () => {
          interpreter.evaluate("let x = ''");
          interpreter.evaluate("x ||= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("assigns when variable is false", () => {
          interpreter.evaluate("let x = false");
          interpreter.evaluate("x ||= true");
          expect(interpreter.evaluate("x")).toBe(true);
        });

        test("short-circuits when truthy", () => {
          interpreter.evaluate("let counter = 0");
          interpreter.evaluate(
            "let getValue = function() { counter = counter + 1; return 'new'; }",
          );
          interpreter.evaluate("let x = 'existing'");
          interpreter.evaluate("x ||= getValue()");
          expect(interpreter.evaluate("counter")).toBe(0);
          expect(interpreter.evaluate("x")).toBe("existing");
        });

        test("returns the assigned value", () => {
          interpreter.evaluate("let x = 0");
          expect(interpreter.evaluate("x ||= 42")).toBe(42);
        });

        test("returns existing value when not assigned", () => {
          interpreter.evaluate("let x = 5");
          expect(interpreter.evaluate("x ||= 42")).toBe(5);
        });

        test("works with object properties", () => {
          interpreter.evaluate("let obj = { a: 0, b: 5 }");
          interpreter.evaluate("obj.a ||= 10");
          interpreter.evaluate("obj.b ||= 10");
          expect(interpreter.evaluate("obj.a")).toBe(10);
          expect(interpreter.evaluate("obj.b")).toBe(5);
        });

        test("works with computed properties", () => {
          interpreter.evaluate("let obj = { x: null }");
          interpreter.evaluate("obj['x'] ||= 'default'");
          expect(interpreter.evaluate("obj.x")).toBe("default");
        });

        test("works with array elements", () => {
          interpreter.evaluate("let arr = [0, 5, null]");
          interpreter.evaluate("arr[0] ||= 10");
          interpreter.evaluate("arr[1] ||= 10");
          interpreter.evaluate("arr[2] ||= 'default'");
          expect(interpreter.evaluate("arr[0]")).toBe(10);
          expect(interpreter.evaluate("arr[1]")).toBe(5);
          expect(interpreter.evaluate("arr[2]")).toBe("default");
        });
      });

      describe("Logical AND Assignment (&&=)", () => {
        test("should use &&=", () => {
          interpreter.evaluate("let x = 10");
          interpreter.evaluate("x &&= 5");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("assigns when variable is truthy", () => {
          interpreter.evaluate("let x = 5");
          interpreter.evaluate("x &&= 10");
          expect(interpreter.evaluate("x")).toBe(10);
        });

        test("does not assign when variable is falsy", () => {
          interpreter.evaluate("let x = 0");
          interpreter.evaluate("x &&= 10");
          expect(interpreter.evaluate("x")).toBe(0);
        });

        test("does not assign when variable is null", () => {
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x &&= 'value'");
          expect(interpreter.evaluate("x")).toBe(null);
        });

        test("does not assign when variable is undefined", () => {
          interpreter.evaluate("let x");
          interpreter.evaluate("x &&= 'value'");
          expect(interpreter.evaluate("x")).toBe(undefined);
        });

        test("does not assign when variable is false", () => {
          interpreter.evaluate("let x = false");
          interpreter.evaluate("x &&= true");
          expect(interpreter.evaluate("x")).toBe(false);
        });

        test("short-circuits when falsy", () => {
          interpreter.evaluate("let counter = 0");
          interpreter.evaluate(
            "let getValue = function() { counter = counter + 1; return 'new'; }",
          );
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x &&= getValue()");
          expect(interpreter.evaluate("counter")).toBe(0);
          expect(interpreter.evaluate("x")).toBe(null);
        });

        test("returns the assigned value", () => {
          interpreter.evaluate("let x = 5");
          expect(interpreter.evaluate("x &&= 42")).toBe(42);
        });

        test("returns existing value when not assigned", () => {
          interpreter.evaluate("let x = 0");
          expect(interpreter.evaluate("x &&= 42")).toBe(0);
        });

        test("works with object properties", () => {
          interpreter.evaluate("let obj = { a: 5, b: 0 }");
          interpreter.evaluate("obj.a &&= 10");
          interpreter.evaluate("obj.b &&= 10");
          expect(interpreter.evaluate("obj.a")).toBe(10);
          expect(interpreter.evaluate("obj.b")).toBe(0);
        });

        test("works with computed properties", () => {
          interpreter.evaluate("let obj = { x: 'value' }");
          interpreter.evaluate("obj['x'] &&= 'updated'");
          expect(interpreter.evaluate("obj.x")).toBe("updated");
        });

        test("works with array elements", () => {
          interpreter.evaluate("let arr = [5, 0, 'hello']");
          interpreter.evaluate("arr[0] &&= 10");
          interpreter.evaluate("arr[1] &&= 10");
          interpreter.evaluate("arr[2] &&= 'world'");
          expect(interpreter.evaluate("arr[0]")).toBe(10);
          expect(interpreter.evaluate("arr[1]")).toBe(0);
          expect(interpreter.evaluate("arr[2]")).toBe("world");
        });
      });

      describe("Nullish Coalescing Assignment (??=)", () => {
        test("should use ??=", () => {
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x ??= 5");
          expect(interpreter.evaluate("x")).toBe(5);
        });

        test("assigns when variable is null", () => {
          interpreter.evaluate("let x = null");
          interpreter.evaluate("x ??= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("assigns when variable is undefined", () => {
          interpreter.evaluate("let x");
          interpreter.evaluate("x ??= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("does not assign when variable is 0", () => {
          interpreter.evaluate("let x = 0");
          interpreter.evaluate("x ??= 10");
          expect(interpreter.evaluate("x")).toBe(0);
        });

        test("does not assign when variable is empty string", () => {
          interpreter.evaluate("let x = ''");
          interpreter.evaluate("x ??= 'default'");
          expect(interpreter.evaluate("x")).toBe("");
        });

        test("does not assign when variable is false", () => {
          interpreter.evaluate("let x = false");
          interpreter.evaluate("x ??= true");
          expect(interpreter.evaluate("x")).toBe(false);
        });

        test("does not assign when variable has a value", () => {
          interpreter.evaluate("let x = 'existing'");
          interpreter.evaluate("x ??= 'default'");
          expect(interpreter.evaluate("x")).toBe("existing");
        });

        test("short-circuits when not nullish", () => {
          interpreter.evaluate("let counter = 0");
          interpreter.evaluate(
            "let getValue = function() { counter = counter + 1; return 'new'; }",
          );
          interpreter.evaluate("let x = 0"); // falsy but not nullish
          interpreter.evaluate("x ??= getValue()");
          expect(interpreter.evaluate("counter")).toBe(0);
          expect(interpreter.evaluate("x")).toBe(0);
        });

        test("returns the assigned value", () => {
          interpreter.evaluate("let x = null");
          expect(interpreter.evaluate("x ??= 42")).toBe(42);
        });

        test("returns existing value when not assigned", () => {
          interpreter.evaluate("let x = 0");
          expect(interpreter.evaluate("x ??= 42")).toBe(0);
        });

        test("works with object properties", () => {
          interpreter.evaluate("let obj = { a: null, b: 0 }");
          interpreter.evaluate("obj.a ??= 'default'");
          interpreter.evaluate("obj.b ??= 'default'");
          expect(interpreter.evaluate("obj.a")).toBe("default");
          expect(interpreter.evaluate("obj.b")).toBe(0);
        });

        test("works with computed properties", () => {
          interpreter.evaluate("let obj = { x: undefined }");
          interpreter.evaluate("obj['x'] ??= 'default'");
          expect(interpreter.evaluate("obj.x")).toBe("default");
        });

        test("works with array elements", () => {
          interpreter.evaluate("let arr = [null, 0, undefined]");
          interpreter.evaluate("arr[0] ??= 'a'");
          interpreter.evaluate("arr[1] ??= 'b'");
          interpreter.evaluate("arr[2] ??= 'c'");
          expect(interpreter.evaluate("arr[0]")).toBe("a");
          expect(interpreter.evaluate("arr[1]")).toBe(0);
          expect(interpreter.evaluate("arr[2]")).toBe("c");
        });
      });

      describe("Practical Examples", () => {
        test("default value initialization with ??=", () => {
          interpreter.evaluate(`
            let config = { timeout: null, retries: 3 };
            config.timeout ??= 5000;
            config.retries ??= 5;
          `);
          expect(interpreter.evaluate("config.timeout")).toBe(5000);
          expect(interpreter.evaluate("config.retries")).toBe(3);
        });

        test("lazy initialization with ||=", () => {
          interpreter.evaluate(`
            let cache = {};
            function getOrCompute(key, compute) {
              cache[key] ||= compute();
              return cache[key];
            }
          `);
          interpreter.evaluate("let result1 = getOrCompute('a', function() { return 42; })");
          interpreter.evaluate("let result2 = getOrCompute('a', function() { return 99; })");
          expect(interpreter.evaluate("result1")).toBe(42);
          expect(interpreter.evaluate("result2")).toBe(42);
        });

        test("conditional update with &&=", () => {
          interpreter.evaluate(`
            let user = { name: 'Alice', permissions: null };
            user.name &&= user.name + ' (verified)';
            user.permissions &&= 'admin';
          `);
          expect(interpreter.evaluate("user.name")).toBe("Alice (verified)");
          expect(interpreter.evaluate("user.permissions")).toBe(null);
        });

        test("combining with other operators", () => {
          interpreter.evaluate("let a = null");
          interpreter.evaluate("let b = 0");
          interpreter.evaluate("let c = 5");

          interpreter.evaluate("a ??= b || c");
          expect(interpreter.evaluate("a")).toBe(5);
        });
      });

      describe("Async evaluation", () => {
        test("||= works with async evaluation", async () => {
          interpreter.evaluate("let x = 0");
          await interpreter.evaluateAsync("x ||= 10");
          expect(interpreter.evaluate("x")).toBe(10);
        });

        test("&&= works with async evaluation", async () => {
          interpreter.evaluate("let x = 5");
          await interpreter.evaluateAsync("x &&= 10");
          expect(interpreter.evaluate("x")).toBe(10);
        });

        test("??= works with async evaluation", async () => {
          interpreter.evaluate("let x = null");
          await interpreter.evaluateAsync("x ??= 'default'");
          expect(interpreter.evaluate("x")).toBe("default");
        });

        test("?? works with async evaluation", async () => {
          const result = await interpreter.evaluateAsync("null ?? 'default'");
          expect(result).toBe("default");
        });

        test("async short-circuit with ||=", async () => {
          interpreter.evaluate("let counter = 0");
          interpreter.evaluate("let x = 'existing'");
          await interpreter.evaluateAsync(`
            x ||= (function() { counter = counter + 1; return 'new'; })()
          `);
          expect(interpreter.evaluate("counter")).toBe(0);
          expect(interpreter.evaluate("x")).toBe("existing");
        });
      });
    });
  });
});
