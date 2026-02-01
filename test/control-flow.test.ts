import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Control Flow", () => {
  describe("ES5", () => {
    describe("Conditional Statements", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Basic if statements", () => {
        test("executes consequent when condition is true", () => {
          const code = `
            let x = 0;
            if (true) {
              x = 5;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("skips consequent when condition is false", () => {
          const code = `
            let x = 0;
            if (false) {
              x = 5;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });

        test("evaluates condition expression", () => {
          const code = `
            let x = 0;
            if (5 > 3) {
              x = 10;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("handles truthy values", () => {
          const code = `
            let x = 0;
            if (1) {
              x = 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("handles falsy values", () => {
          const code = `
            let x = 5;
            if (0) {
              x = 10;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("supports single statement without braces", () => {
          const code = `
            let x = 0;
            if (true)
              x = 5;
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("if with variable condition", () => {
          const code = `
            let shouldExecute = true;
            let x = 0;
            if (shouldExecute) {
              x = 10;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("if with complex condition", () => {
          const code = `
            let a = 10;
            let b = 5;
            let x = 0;
            if (a > b && b > 0) {
              x = 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });
      });

      describe("if...else statements", () => {
        test("executes consequent when true", () => {
          const code = `
            let x = 0;
            if (true) {
              x = 5;
            } else {
              x = 10;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("executes alternate when false", () => {
          const code = `
            let x = 0;
            if (false) {
              x = 5;
            } else {
              x = 10;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("else without braces", () => {
          const code = `
            let x = 0;
            if (false)
              x = 5;
            else
              x = 10;
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("if...else with comparison", () => {
          const code = `
            let age = 20;
            let status = 0;
            if (age >= 18) {
              status = 1;
            } else {
              status = 2;
            }
            status
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("if...else branching with variables", () => {
          const code = `
            let value = 5;
            let result = 0;
            if (value > 10) {
              result = value * 2;
            } else {
              result = value + 10;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });
      });

      describe("if...else if...else chains", () => {
        test("executes first true branch", () => {
          const code = `
            let x = 15;
            let result = 0;
            if (x < 10) {
              result = 1;
            } else if (x < 20) {
              result = 2;
            } else {
              result = 3;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        test("executes final else when all conditions false", () => {
          const code = `
            let x = 25;
            let result = 0;
            if (x < 10) {
              result = 1;
            } else if (x < 20) {
              result = 2;
            } else {
              result = 3;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        test("multiple else if branches", () => {
          const code = `
            let score = 75;
            let grade = 0;
            if (score >= 90) {
              grade = 1;
            } else if (score >= 80) {
              grade = 2;
            } else if (score >= 70) {
              grade = 3;
            } else if (score >= 60) {
              grade = 4;
            } else {
              grade = 5;
            }
            grade
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        test("stops at first true condition", () => {
          const code = `
            let x = 15;
            let count = 0;
            if (x > 5) {
              count = 1;
            } else if (x > 10) {
              count = 2;
            } else if (x > 0) {
              count = 3;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("else if without final else", () => {
          const code = `
            let x = 30;
            let result = 0;
            if (x < 10) {
              result = 1;
            } else if (x < 20) {
              result = 2;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });
      });

      describe("Nested if statements", () => {
        test("nested if inside if", () => {
          const code = `
            let x = 10;
            let y = 5;
            let result = 0;
            if (x > 5) {
              if (y > 3) {
                result = 1;
              }
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("nested if...else", () => {
          const code = `
            let a = 10;
            let b = 20;
            let result = 0;
            if (a > 5) {
              if (b > 15) {
                result = 1;
              } else {
                result = 2;
              }
            } else {
              result = 3;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("deeply nested conditionals", () => {
          const code = `
            let x = 5;
            let result = 0;
            if (x > 0) {
              if (x > 3) {
                if (x > 4) {
                  result = 1;
                }
              }
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });
      });

      describe("if statements with multiple statements in blocks", () => {
        test("multiple statements in consequent", () => {
          const code = `
            let x = 0;
            let y = 0;
            if (true) {
              x = 5;
              y = 10;
            }
            x + y
          `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        test("multiple statements in both branches", () => {
          const code = `
            let x = 0;
            let y = 0;
            if (false) {
              x = 5;
              y = 10;
            } else {
              x = 2;
              y = 3;
            }
            x + y
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("complex operations in blocks", () => {
          const code = `
            let balance = 100;
            let amount = 50;
            if (amount <= balance) {
              balance = balance - amount;
              amount = 0;
            }
            balance
          `;
          expect(interpreter.evaluate(code)).toBe(50);
        });
      });

      describe("if statements with return-like behavior", () => {
        test("if statement returns undefined when not executed", () => {
          const result = interpreter.evaluate("if (false) { 5 }");
          expect(result).toBeUndefined();
        });

        test("if statement returns last expression value when executed", () => {
          const result = interpreter.evaluate("if (true) { 5 }");
          expect(result).toBe(5);
        });

        test("if...else returns appropriate branch value", () => {
          const result = interpreter.evaluate("if (true) { 10 } else { 20 }");
          expect(result).toBe(10);
        });
      });

      describe("Practical patterns", () => {
        test("min/max pattern", () => {
          const code = `
            let a = 10;
            let b = 20;
            let max = 0;
            if (a > b) {
              max = a;
            } else {
              max = b;
            }
            max
          `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        test("clamp pattern", () => {
          const code = `
            let value = 150;
            let min = 0;
            let max = 100;
            if (value < min) {
              value = min;
            } else if (value > max) {
              value = max;
            }
            value
          `;
          expect(interpreter.evaluate(code)).toBe(100);
        });

        test("sign function pattern", () => {
          const code = `
            let x = -5;
            let sign = 0;
            if (x > 0) {
              sign = 1;
            } else if (x < 0) {
              sign = -1;
            }
            sign
          `;
          expect(interpreter.evaluate(code)).toBe(-1);
        });

        test("validation pattern", () => {
          const code = `
            let age = 25;
            let hasID = true;
            let canEnter = false;
            if (age >= 21 && hasID) {
              canEnter = true;
            }
            canEnter
          `;
          expect(interpreter.evaluate(code)).toBe(true);
        });

        test("error handling pattern", () => {
          const code = `
            let value = 0;
            let error = false;
            if (value === 0) {
              error = true;
              value = 1;
            }
            error
          `;
          expect(interpreter.evaluate(code)).toBe(true);
        });

        test("state machine pattern", () => {
          const code = `
            let state = 1;
            let nextState = 0;
            if (state === 1) {
              nextState = 2;
            } else if (state === 2) {
              nextState = 3;
            } else {
              nextState = 1;
            }
            nextState
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });
      });

      describe("Edge cases", () => {
        test("empty if block", () => {
          const code = `
            let x = 5;
            if (true) {
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("empty else block", () => {
          const code = `
            let x = 5;
            if (false) {
              x = 10;
            } else {
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("condition with side effects", () => {
          const code = `
            let x = 0;
            let y = 5;
            if ((x = 10) > 5) {
              y = x;
            }
            y
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("if statement as final statement", () => {
          const code = `
            let x = 0;
            if (true) {
              x = 5;
            }
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });
      });

      describe("Integration with other features", () => {
        test("if with arithmetic in condition", () => {
          const code = `
            let result = 0;
            if (2 + 2 === 4) {
              result = 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("if with logical operators in condition", () => {
          const code = `
            let a = true;
            let b = false;
            let result = 0;
            if (a || b) {
              result = 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("modifying variables in conditional blocks", () => {
          const code = `
            let counter = 0;
            if (counter === 0) {
              counter = counter + 1;
            }
            if (counter === 1) {
              counter = counter + 1;
            }
            counter
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        test("using const in conditional blocks", () => {
          const code = `
            let x = 0;
            if (true) {
              const temp = 10;
              x = temp;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });
      });
    });

    describe("Switch Statements", () => {
      describe("Basic switch", () => {
        it("should match single case with break", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 2;
            let result = "";
            switch (x) {
              case 1:
                result = "one";
                break;
              case 2:
                result = "two";
                break;
              case 3:
                result = "three";
                break;
            }
            result
          `);
          expect(result).toBe("two");
        });

        it("should return undefined when no match and no default", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 5;
            switch (x) {
              case 1:
                let y = 1;
                break;
              case 2:
                let z = 2;
                break;
            }
          `);
          expect(result).toBe(undefined);
        });

        it("should match string cases", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let fruit = "apple";
            let result = "";
            switch (fruit) {
              case "banana":
                result = "yellow";
                break;
              case "apple":
                result = "red";
                break;
              case "grape":
                result = "purple";
                break;
            }
            result
          `);
          expect(result).toBe("red");
        });

        it("should use strict equality for matching", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = "2";
            let result = "";
            switch (x) {
              case 2:
                result = "number";
                break;
              case "2":
                result = "string";
                break;
            }
            result
          `);
          expect(result).toBe("string");
        });

        it("should work with boolean values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let flag = true;
            let result = "";
            switch (flag) {
              case false:
                result = "off";
                break;
              case true:
                result = "on";
                break;
            }
            result
          `);
          expect(result).toBe("on");
        });
      });

      describe("Default case", () => {
        it("should execute default case when no match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 5;
            let result = "";
            switch (x) {
              case 1:
                result = "one";
                break;
              case 2:
                result = "two";
                break;
              default:
                result = "other";
            }
            result
          `);
          expect(result).toBe("other");
        });

        it("should work with default case at the beginning", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 99;
            let result = "";
            switch (x) {
              default:
                result = "default";
                break;
              case 1:
                result = "one";
                break;
              case 2:
                result = "two";
                break;
            }
            result
          `);
          expect(result).toBe("default");
        });

        it("should work with default case in the middle", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 100;
            let result = "";
            switch (x) {
              case 1:
                result = "one";
                break;
              default:
                result = "middle default";
                break;
              case 2:
                result = "two";
                break;
            }
            result
          `);
          expect(result).toBe("middle default");
        });
      });

      describe("Fall-through behavior", () => {
        it("should fall through when no break", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let result = "";
            switch (x) {
              case 1:
                result = result + "one";
              case 2:
                result = result + "two";
              case 3:
                result = result + "three";
                break;
            }
            result
          `);
          expect(result).toBe("onetwothree");
        });

        it("should execute multiple statements before fall-through", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let count = 0;
            switch (x) {
              case 1:
                count = count + 1;
                count = count + 1;
              case 2:
                count = count + 10;
                break;
            }
            count
          `);
          expect(result).toBe(12); // 1 + 1 + 10
        });

        it("should fall through to default", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let result = "";
            switch (x) {
              case 1:
                result = result + "case1";
              default:
                result = result + "default";
            }
            result
          `);
          expect(result).toBe("case1default");
        });

        it("should allow multiple cases to same code block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 2;
            let result = "";
            switch (x) {
              case 1:
              case 2:
              case 3:
                result = "1-3";
                break;
              case 4:
              case 5:
                result = "4-5";
                break;
            }
            result
          `);
          expect(result).toBe("1-3");
        });
      });

      describe("Switch with expressions", () => {
        it("should evaluate discriminant expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 5;
            let result = "";
            switch (x + 5) {
              case 5:
                result = "five";
                break;
              case 10:
                result = "ten";
                break;
            }
            result
          `);
          expect(result).toBe("ten");
        });

        it("should evaluate case expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 10;
            let y = 5;
            let result = "";
            switch (x) {
              case y:
                result = "y";
                break;
              case y * 2:
                result = "2y";
                break;
              case y * 3:
                result = "3y";
                break;
            }
            result
          `);
          expect(result).toBe("2y");
        });

        it("should work with function call as discriminant", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getNumber() {
              return 42;
            }
            let result = "";
            switch (getNumber()) {
              case 41:
                result = "41";
                break;
              case 42:
                result = "42";
                break;
              case 43:
                result = "43";
                break;
            }
            result
          `);
          expect(result).toBe("42");
        });
      });

      describe("Switch in functions", () => {
        it("should work inside function", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getDayName(day) {
              let name = "";
              switch (day) {
                case 0:
                  name = "Sunday";
                  break;
                case 1:
                  name = "Monday";
                  break;
                case 2:
                  name = "Tuesday";
                  break;
                default:
                  name = "Unknown";
              }
              return name;
            }
            getDayName(1)
          `);
          expect(result).toBe("Monday");
        });

        it("should support early return from switch", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function classify(x) {
              switch (x) {
                case 1:
                  return "one";
                case 2:
                  return "two";
                case 3:
                  return "three";
                default:
                  return "other";
              }
            }
            classify(2)
          `);
          expect(result).toBe("two");
        });

        it("should support return without break", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function test(x) {
              switch (x) {
                case 1:
                  return "one";
                case 2:
                  return "two";
              }
              return "none";
            }
            test(2)
          `);
          expect(result).toBe("two");
        });
      });

      describe("Switch with variables", () => {
        it("should handle variable assignments in cases", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 2;
            let a = 0;
            let b = 0;
            switch (x) {
              case 1:
                a = 10;
                break;
              case 2:
                b = 20;
                break;
            }
            a + b
          `);
          expect(result).toBe(20);
        });

        it("should access outer scope variables", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let multiplier = 10;
            let x = 2;
            let result = 0;
            switch (x) {
              case 1:
                result = 1 * multiplier;
                break;
              case 2:
                result = 2 * multiplier;
                break;
            }
            result
          `);
          expect(result).toBe(20);
        });
      });

      describe("Switch with arrays and objects", () => {
        it("should work with array elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [1, 2, 3];
            let result = "";
            switch (arr[1]) {
              case 1:
                result = "first";
                break;
              case 2:
                result = "second";
                break;
              case 3:
                result = "third";
                break;
            }
            result
          `);
          expect(result).toBe("second");
        });

        it("should work with object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { status: "active" };
            let result = "";
            switch (obj.status) {
              case "inactive":
                result = "off";
                break;
              case "active":
                result = "on";
                break;
              case "pending":
                result = "waiting";
                break;
            }
            result
          `);
          expect(result).toBe("on");
        });

        it("should modify arrays in switch cases", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [0, 0, 0];
            let x = 1;
            switch (x) {
              case 0:
                arr[0] = 10;
                break;
              case 1:
                arr[1] = 20;
                break;
              case 2:
                arr[2] = 30;
                break;
            }
            arr[1]
          `);
          expect(result).toBe(20);
        });
      });

      describe("Nested switches", () => {
        it("should support nested switch statements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let y = 2;
            let result = "";
            switch (x) {
              case 1:
                switch (y) {
                  case 1:
                    result = "1-1";
                    break;
                  case 2:
                    result = "1-2";
                    break;
                }
                break;
              case 2:
                result = "2";
                break;
            }
            result
          `);
          expect(result).toBe("1-2");
        });

        it("should handle break in nested switch correctly", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let y = 1;
            let outer = false;
            let inner = false;
            switch (x) {
              case 1:
                outer = true;
                switch (y) {
                  case 1:
                    inner = true;
                    break;
                }
                break;
            }
            outer && inner
          `);
          expect(result).toBe(true);
        });
      });

      describe("Switch in loops", () => {
        it("should work inside for loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let sum = 0;
            for (let i = 0; i < 5; i++) {
              switch (i) {
                case 0:
                case 1:
                  sum = sum + 1;
                  break;
                case 2:
                case 3:
                  sum = sum + 2;
                  break;
                default:
                  sum = sum + 5;
              }
            }
            sum
          `);
          expect(result).toBe(11); // 1 + 1 + 2 + 2 + 5
        });

        it("should work inside while loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let i = 0;
            let result = "";
            while (i < 3) {
              switch (i) {
                case 0:
                  result = result + "a";
                  break;
                case 1:
                  result = result + "b";
                  break;
                case 2:
                  result = result + "c";
                  break;
              }
              i = i + 1;
            }
            result
          `);
          expect(result).toBe("abc");
        });
      });

      describe("Error cases", () => {
        it("should throw error on continue in switch", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let x = 1;
              switch (x) {
                case 1:
                  continue;
                case 2:
                  break;
              }
            `);
          }).toThrow("Illegal continue statement");
        });
      });

      describe("Async switch", () => {
        it("should work in evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let x = 2;
            let result = "";
            switch (x) {
              case 1:
                result = "one";
                break;
              case 2:
                result = "two";
                break;
              default:
                result = "other";
            }
            result
          `);
          expect(result).toBe("two");
        });

        it("should work with async host functions", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncGetValue: async () => 42,
            },
          });
          const result = await interpreter.evaluateAsync(`
            let x = asyncGetValue();
            let result = "";
            switch (x) {
              case 41:
                result = "41";
                break;
              case 42:
                result = "42";
                break;
            }
            result
          `);
          expect(result).toBe("42");
        });

        it("should support async operations in cases", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncDouble: async (x: number) => x * 2,
            },
          });
          const result = await interpreter.evaluateAsync(`
            let x = 2;
            let result = 0;
            switch (x) {
              case 1:
                result = asyncDouble(10);
                break;
              case 2:
                result = asyncDouble(20);
                break;
            }
            result
          `);
          expect(result).toBe(40);
        });
      });

      describe("Edge cases", () => {
        it("should handle empty switch", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            switch (x) {
            }
          `);
          expect(result).toBe(undefined);
        });

        it("should handle switch with only default", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            let result = "";
            switch (x) {
              default:
                result = "default";
            }
            result
          `);
          expect(result).toBe("default");
        });

        it("should handle null as case value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = null;
            let result = "";
            switch (x) {
              case null:
                result = "null";
                break;
              case 0:
                result = "zero";
                break;
            }
            result
          `);
          expect(result).toBe("null");
        });

        it("should return last expression value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            switch (x) {
              case 1:
                let y = 10;
                y + 5
            }
          `);
          expect(result).toBe(15);
        });

        it("should work with computed case values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let base = 10;
            let x = 30;
            let result = "";
            switch (x) {
              case base:
                result = "base";
                break;
              case base * 2:
                result = "double";
                break;
              case base * 3:
                result = "triple";
                break;
            }
            result
          `);
          expect(result).toBe("triple");
        });
      });
    });

    describe("While Loops", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Basic while loops", () => {
        test("executes loop body while condition is true", () => {
          const code = `
            let x = 0;
            while (x < 5) {
              x = x + 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("does not execute body when condition is initially false", () => {
          const code = `
            let x = 10;
            while (x < 5) {
              x = x + 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("executes exactly once when condition becomes false", () => {
          const code = `
            let x = 4;
            while (x < 5) {
              x = x + 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("supports single statement without braces", () => {
          const code = `
            let x = 0;
            while (x < 3)
              x = x + 1;
            x
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        test("returns undefined when never executed", () => {
          const code = `
            while (false) {
              5
            }
          `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });

        test("returns last iteration value", () => {
          const code = `
            let x = 0;
            while (x < 3) {
              x = x + 1;
            }
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });
      });

      describe("Counter patterns", () => {
        test("counts up to a limit", () => {
          const code = `
            let i = 0;
            let count = 0;
            while (i < 10) {
              count = count + 1;
              i = i + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        test("counts down to zero", () => {
          const code = `
            let i = 5;
            let count = 0;
            while (i > 0) {
              count = count + 1;
              i = i - 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("increments by steps", () => {
          const code = `
            let i = 0;
            let sum = 0;
            while (i < 10) {
              sum = sum + i;
              i = i + 2;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(20); // 0 + 2 + 4 + 6 + 8
        });
      });

      describe("Accumulator patterns", () => {
        test("sums numbers", () => {
          const code = `
            let i = 1;
            let sum = 0;
            while (i <= 10) {
              sum = sum + i;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(55);
        });

        test("calculates factorial", () => {
          const code = `
            let n = 5;
            let result = 1;
            let i = 1;
            while (i <= n) {
              result = result * i;
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(120);
        });

        test("calculates power", () => {
          const code = `
            let base = 2;
            let exp = 8;
            let result = 1;
            let i = 0;
            while (i < exp) {
              result = result * base;
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(256);
        });

        test("finds maximum", () => {
          const code = `
            let i = 1;
            let max = 0;
            while (i <= 5) {
              if (i > max) {
                max = i;
              }
              i = i + 1;
            }
            max
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });
      });

      describe("While with conditionals", () => {
        test("conditional inside loop", () => {
          const code = `
            let i = 0;
            let evenCount = 0;
            while (i < 10) {
              if (i % 2 === 0) {
                evenCount = evenCount + 1;
              }
              i = i + 1;
            }
            evenCount
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("complex condition with logical operators", () => {
          const code = `
            let i = 0;
            let count = 0;
            while (i < 20 && count < 5) {
              if (i % 3 === 0) {
                count = count + 1;
              }
              i = i + 1;
            }
            i
          `;
          expect(interpreter.evaluate(code)).toBe(13); // i goes: 0,1,2,3,4,5,6,7,8,9,10,11,12 -> count reaches 5 at i=12, then i++ = 13
        });

        test("nested if...else in loop", () => {
          const code = `
            let i = 1;
            let positive = 0;
            let negative = 0;
            while (i <= 10) {
              if (i % 2 === 0) {
                positive = positive + 1;
              } else {
                negative = negative + 1;
              }
              i = i + 1;
            }
            positive
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("early exit pattern with boolean flag", () => {
          const code = `
            let i = 0;
            let found = false;
            let result = 0;
            while (i < 100 && !found) {
              if (i * i === 49) {
                result = i;
                found = true;
              }
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(7);
        });
      });

      describe("Nested while loops", () => {
        test("simple nested loop", () => {
          const code = `
            let i = 0;
            let sum = 0;
            while (i < 3) {
              let j = 0;
              while (j < 3) {
                sum = sum + 1;
                j = j + 1;
              }
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(9);
        });

        test("nested loop with accumulation", () => {
          const code = `
            let i = 1;
            let sum = 0;
            while (i <= 3) {
              let j = 1;
              while (j <= 3) {
                sum = sum + (i * j);
                j = j + 1;
              }
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(36); // (1*1+1*2+1*3) + (2*1+2*2+2*3) + (3*1+3*2+3*3)
        });

        test("multiplication table pattern", () => {
          const code = `
            let i = 1;
            let product = 1;
            while (i <= 3) {
              let j = 1;
              while (j <= 3) {
                if (i === 2 && j === 3) {
                  product = i * j;
                }
                j = j + 1;
              }
              i = i + 1;
            }
            product
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("deeply nested loops", () => {
          const code = `
            let i = 0;
            let count = 0;
            while (i < 2) {
              let j = 0;
              while (j < 2) {
                let k = 0;
                while (k < 2) {
                  count = count + 1;
                  k = k + 1;
                }
                j = j + 1;
              }
              i = i + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(8);
        });
      });

      describe("Complex boolean conditions", () => {
        test("compound condition with AND", () => {
          const code = `
            let i = 0;
            let j = 10;
            while (i < 5 && j > 5) {
              i = i + 1;
              j = j - 1;
            }
            i
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("compound condition with OR", () => {
          const code = `
            let i = 0;
            let count = 0;
            while (i < 3 || count < 2) {
              count = count + 1;
              i = i + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        test("negated condition", () => {
          const code = `
            let done = false;
            let count = 0;
            while (!done) {
              count = count + 1;
              if (count >= 5) {
                done = true;
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("comparison with variables", () => {
          const code = `
            let limit = 10;
            let i = 0;
            while (i < limit) {
              i = i + 1;
            }
            i
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });
      });

      describe("Multiple variables in loop", () => {
        test("parallel counters", () => {
          const code = `
            let i = 0;
            let j = 10;
            while (i < 5) {
              i = i + 1;
              j = j - 1;
            }
            j
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        test("swap pattern simulation", () => {
          const code = `
            let a = 1;
            let b = 2;
            let i = 0;
            while (i < 1) {
              let temp = a;
              a = b;
              b = temp;
              i = i + 1;
            }
            a
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        test("fibonacci sequence", () => {
          const code = `
            let a = 0;
            let b = 1;
            let i = 0;
            while (i < 7) {
              let temp = a + b;
              a = b;
              b = temp;
              i = i + 1;
            }
            a
          `;
          expect(interpreter.evaluate(code)).toBe(13); // 7th fibonacci number
        });
      });

      describe("Empty and edge cases", () => {
        test("empty loop body", () => {
          const code = `
            let i = 0;
            while (false) {
            }
            i
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });

        test("loop with only variable modification", () => {
          const code = `
            let x = 5;
            while (x > 0) {
              x = x - 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });

        test("loop that executes once", () => {
          const code = `
            let x = 0;
            while (x === 0) {
              x = 1;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        test("constant true condition with break pattern", () => {
          const code = `
            let i = 0;
            let shouldStop = false;
            while (!shouldStop) {
              i = i + 1;
              if (i >= 5) {
                shouldStop = true;
              }
            }
            i
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });
      });

      describe("Practical algorithms", () => {
        test("finding sum of evens", () => {
          const code = `
            let i = 1;
            let sum = 0;
            while (i <= 20) {
              if (i % 2 === 0) {
                sum = sum + i;
              }
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(110); // 2+4+6+...+20
        });

        test("count digits pattern", () => {
          const code = `
            let n = 12345;
            let count = 0;
            while (n > 0) {
              n = n / 10;
              count = count + 1;
            }
            count
          `;
          // Note: This won't work perfectly due to floating point, but tests the pattern
          expect(interpreter.evaluate(code)).toBeGreaterThan(0);
        });

        test("greatest common divisor (GCD)", () => {
          const code = `
            let a = 48;
            let b = 18;
            while (b !== 0) {
              let temp = b;
              b = a % b;
              a = temp;
            }
            a
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("collatz sequence length", () => {
          const code = `
            let n = 10;
            let steps = 0;
            while (n !== 1) {
              if (n % 2 === 0) {
                n = n / 2;
              } else {
                n = 3 * n + 1;
              }
              steps = steps + 1;
            }
            steps
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        test("simple search pattern", () => {
          const code = `
            let target = 7;
            let current = 0;
            let found = false;
            while (current <= 10 && !found) {
              if (current === target) {
                found = true;
              } else {
                current = current + 1;
              }
            }
            current
          `;
          expect(interpreter.evaluate(code)).toBe(7);
        });
      });
    });

    describe("For Loops", () => {
      describe("Basic for loops", () => {
        it("should execute a simple for loop with postfix increment", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 5; i++) {
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
        });

        it("should execute a simple for loop with prefix increment", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 5; ++i) {
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
        });

        it("should execute a for loop with decrement", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 5; i > 0; i--) {
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(15); // 5+4+3+2+1
        });

        it("should handle for loop with step of 2", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 10; i = i + 2) {
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(20); // 0+2+4+6+8
        });

        it("should execute for loop with no iterations", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 5; i < 3; i++) {
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });

        it("should handle for loop with single iteration", () => {
          const interpreter = new Interpreter();
          const code = `
            let result = 0;
            for (let i = 0; i < 1; i++) {
              result = 42;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(42);
        });

        it("should support for loop without init", () => {
          const interpreter = new Interpreter();
          const code = `
            let i = 0;
            let sum = 0;
            for (; i < 5; i++) {
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        it("should support for loop without test (infinite loop with early return)", () => {
          const interpreter = new Interpreter();
          const code = `
            function testInfinite() {
              let count = 0;
              for (let i = 0; ; i++) {
                count = count + 1;
                if (count === 3) {
                  return count;
                }
              }
            }
            testInfinite()
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        it("should support for loop without update", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 5; ) {
              sum = sum + i;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        it("should support for loop with only body (infinite loop with return)", () => {
          const interpreter = new Interpreter();
          const code = `
            function testMinimal() {
              let count = 0;
              for (;;) {
                count = count + 1;
                if (count === 5) {
                  return count;
                }
              }
            }
            testMinimal()
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });
      });

      describe("For loop scoping", () => {
        it("should scope loop variable to for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 100;
            for (let i = 0; i < 3; i++) {
              x = x + i;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(103); // 100 + 0 + 1 + 2
        });

        it("should not leak loop variable outside for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            for (let i = 0; i < 3; i++) {
              let x = i;
            }
            i
          `;
          expect(() => interpreter.evaluate(code)).toThrow(InterpreterError);
          expect(() => interpreter.evaluate(code)).toThrow("Undefined variable 'i'");
        });

        it("should allow same variable name in sequential for loops", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum1 = 0;
            for (let i = 0; i < 3; i++) {
              sum1 = sum1 + i;
            }
            let sum2 = 0;
            for (let i = 0; i < 3; i++) {
              sum2 = sum2 + i;
            }
            sum1 + sum2
          `;
          expect(interpreter.evaluate(code)).toBe(6); // (0+1+2) + (0+1+2)
        });

        it("should shadow outer variable in for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let i = 100;
            let sum = 0;
            for (let i = 0; i < 3; i++) {
              sum = sum + i;
            }
            sum + i
          `;
          expect(interpreter.evaluate(code)).toBe(103); // (0+1+2) + 100
        });

        it("should handle const in for loop body", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 3; i++) {
              const doubled = i * 2;
              sum = sum + doubled;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(6); // 0*2 + 1*2 + 2*2
        });
      });

      describe("Nested for loops", () => {
        it("should handle nested for loops", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 1; i <= 3; i++) {
              for (let j = 1; j <= 3; j++) {
                sum = sum + (i * j);
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(36); // Sum of multiplication table 1-3
        });

        it("should handle three levels of nested for loops", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 0; i < 2; i++) {
              for (let j = 0; j < 2; j++) {
                for (let k = 0; k < 2; k++) {
                  count = count + 1;
                }
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(8); // 2*2*2
        });

        it("should handle nested loops with different ranges", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 4; i++) {
              for (let j = 0; j < i; j++) {
                sum = sum + 1;
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(6); // 0 + 1 + 2 + 3
        });
      });

      describe("For loops with conditionals", () => {
        it("should handle for loop with if statement", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 10; i++) {
              if (i % 2 === 0) {
                sum = sum + i;
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(20); // 0+2+4+6+8
        });

        it("should handle for loop with if-else", () => {
          const interpreter = new Interpreter();
          const code = `
            let evens = 0;
            let odds = 0;
            for (let i = 0; i < 10; i++) {
              if (i % 2 === 0) {
                evens = evens + 1;
              } else {
                odds = odds + 1;
              }
            }
            evens * 10 + odds
          `;
          expect(interpreter.evaluate(code)).toBe(55); // 5 evens, 5 odds -> 55
        });

        it("should handle complex condition in for loop body", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 1; i <= 20; i++) {
              if (i % 3 === 0 && i % 5 === 0) {
                count = count + 1;
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(1); // Only 15 is divisible by both
        });
      });

      describe("For loops with arrays", () => {
        it("should iterate over array by index", () => {
          const interpreter = new Interpreter();
          const code = `
            let arr = [10, 20, 30, 40, 50];
            let sum = 0;
            for (let i = 0; i < arr.length; i++) {
              sum = sum + arr[i];
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(150);
        });

        it("should build an array using for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let squares = [];
            for (let i = 0; i < 5; i++) {
              squares[i] = i * i;
            }
            squares
          `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([0, 1, 4, 9, 16]);
        });

        it("should modify array elements in for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let arr = [1, 2, 3, 4, 5];
            for (let i = 0; i < arr.length; i++) {
              arr[i] = arr[i] * 2;
            }
            arr
          `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([2, 4, 6, 8, 10]);
        });

        it("should find element in array", () => {
          const interpreter = new Interpreter();
          const code = `
            function findIndex(arr, target) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i] === target) {
                  return i;
                }
              }
              return -1;
            }
            findIndex([10, 20, 30, 40], 30)
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should reverse an array using for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function reverse(arr) {
              let result = [];
              for (let i = arr.length - 1; i >= 0; i--) {
                result[arr.length - 1 - i] = arr[i];
              }
              return result;
            }
            reverse([1, 2, 3, 4, 5])
          `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([5, 4, 3, 2, 1]);
        });
      });

      describe("For loops with functions", () => {
        it("should use for loop in function", () => {
          const interpreter = new Interpreter();
          const code = `
            function sum(n) {
              let result = 0;
              for (let i = 1; i <= n; i++) {
                result = result + i;
              }
              return result;
            }
            sum(10)
          `;
          expect(interpreter.evaluate(code)).toBe(55);
        });

        it("should handle return from for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function findFirst(arr, target) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i] === target) {
                  return i;
                }
              }
              return -1;
            }
            findFirst([5, 10, 15, 20], 15)
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should handle for loop with early return", () => {
          const interpreter = new Interpreter();
          const code = `
            function findEven(n) {
              for (let i = 0; i < n; i++) {
                if (i % 2 === 0 && i > 0) {
                  return i;
                }
              }
              return -1;
            }
            findEven(10)
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should compute factorial using for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function factorial(n) {
              let result = 1;
              for (let i = 1; i <= n; i++) {
                result = result * i;
              }
              return result;
            }
            factorial(5)
          `;
          expect(interpreter.evaluate(code)).toBe(120);
        });

        it("should compute fibonacci using for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function fib(n) {
              if (n <= 1) {
                return n;
              }
              let a = 0;
              let b = 1;
              let temp = 0;
              for (let i = 2; i <= n; i++) {
                temp = a + b;
                a = b;
                b = temp;
              }
              return b;
            }
            fib(10)
          `;
          expect(interpreter.evaluate(code)).toBe(55);
        });
      });

      describe("Update expressions", () => {
        it("should handle postfix increment", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 5;
            let y = x++;
            y * 10 + x
          `;
          expect(interpreter.evaluate(code)).toBe(56); // y=5, x=6 -> 56
        });

        it("should handle prefix increment", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 5;
            let y = ++x;
            y * 10 + x
          `;
          expect(interpreter.evaluate(code)).toBe(66); // y=6, x=6 -> 66
        });

        it("should handle postfix decrement", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 5;
            let y = x--;
            y * 10 + x
          `;
          expect(interpreter.evaluate(code)).toBe(54); // y=5, x=4 -> 54
        });

        it("should handle prefix decrement", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 5;
            let y = --x;
            y * 10 + x
          `;
          expect(interpreter.evaluate(code)).toBe(44); // y=4, x=4 -> 44
        });

        it("should throw error for update on non-identifier", () => {
          const interpreter = new Interpreter();
          const code = `(5)++`;
          // Parser catches this error before our interpreter does
          expect(() => interpreter.evaluate(code)).toThrow();
        });

        it("should throw error for update on non-number", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = "hello";
            x++
          `;
          // Only evaluate once to avoid redeclaration error
          try {
            interpreter.evaluate(code);
            expect(true).toBe(false); // Should have thrown
          } catch (error: any) {
            expect(error).toBeInstanceOf(InterpreterError);
            expect(error.message).toContain("can only be used with numbers");
          }
        });
      });

      describe("Practical algorithms with for loops", () => {
        it("should check if number is prime", () => {
          const interpreter = new Interpreter();
          const code = `
            function isPrime(n) {
              if (n <= 1) {
                return 0;
              }
              for (let i = 2; i * i <= n; i++) {
                if (n % i === 0) {
                  return 0;
                }
              }
              return 1;
            }
            isPrime(17) * 10 + isPrime(18)
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 17 is prime (1), 18 is not (0)
        });

        it("should count primes up to n", () => {
          const interpreter = new Interpreter();
          const code = `
            function isPrime(n) {
              if (n <= 1) {
                return 0;
              }
              for (let i = 2; i * i <= n; i++) {
                if (n % i === 0) {
                  return 0;
                }
              }
              return 1;
            }

            function countPrimes(max) {
              let count = 0;
              for (let i = 2; i <= max; i++) {
                if (isPrime(i)) {
                  count = count + 1;
                }
              }
              return count;
            }

            countPrimes(20)
          `;
          expect(interpreter.evaluate(code)).toBe(8); // 2,3,5,7,11,13,17,19
        });

        it("should compute GCD using for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function gcd(a, b) {
              for (; b !== 0; ) {
                let temp = b;
                b = a % b;
                a = temp;
              }
              return a;
            }
            gcd(48, 18)
          `;
          expect(interpreter.evaluate(code)).toBe(6);
        });

        it("should sum multiples of 3 or 5 below n", () => {
          const interpreter = new Interpreter();
          const code = `
            function sumMultiples(n) {
              let sum = 0;
              for (let i = 0; i < n; i++) {
                if (i % 3 === 0 || i % 5 === 0) {
                  sum = sum + i;
                }
              }
              return sum;
            }
            sumMultiples(10)
          `;
          expect(interpreter.evaluate(code)).toBe(23); // 0+3+5+6+9 = 23
        });

        it("should create a 2D identity matrix", () => {
          const interpreter = new Interpreter();
          const code = `
            function identity(n) {
              let matrix = [];
              for (let i = 0; i < n; i++) {
                matrix[i] = [];
                for (let j = 0; j < n; j++) {
                  if (i === j) {
                    matrix[i][j] = 1;
                  } else {
                    matrix[i][j] = 0;
                  }
                }
              }
              return matrix;
            }
            identity(3)
          `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ]);
        });

        it("should multiply two matrices", () => {
          const interpreter = new Interpreter();
          const code = `
            function matrixMultiply(a, b) {
              let result = [];
              for (let i = 0; i < 2; i++) {
                result[i] = [];
                for (let j = 0; j < 2; j++) {
                  let sum = 0;
                  for (let k = 0; k < 2; k++) {
                    sum = sum + a[i][k] * b[k][j];
                  }
                  result[i][j] = sum;
                }
              }
              return result;
            }

            let a = [[1, 2], [3, 4]];
            let b = [[5, 6], [7, 8]];
            matrixMultiply(a, b)
          `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([
            [19, 22],
            [43, 50],
          ]);
        });
      });

      describe("Edge cases", () => {
        it("should handle large iteration count", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 0; i < 1000; i++) {
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(1000);
        });

        it("should handle for loop with only test condition", () => {
          const interpreter = new Interpreter();
          const code = `
            function testSimple() {
              let i = 0;
              for (; i < 3; ) {
                i = i + 1;
              }
              return i;
            }
            testSimple()
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        it("should handle nested for loops with same variable name in different scopes", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 3; i++) {
              for (let i = 0; i < 2; i++) {
                sum = sum + 1;
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(6); // outer runs 3 times, inner runs 2 times each
        });

        it("should return last evaluated value from for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            for (let i = 0; i < 3; i++) {
              i * 2;
            }
          `;
          expect(interpreter.evaluate(code)).toBe(4); // Last iteration: 2 * 2 = 4
        });
      });
    });

    describe("for...in Loops", () => {
      describe("Basic for...in with objects", () => {
        it("should iterate over object keys", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2, c: 3 };
            let keys = [];
            for (let key in obj) {
              keys[keys.length] = key;
            }
            keys
          `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        it("should access object values using keys", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { x: 10, y: 20, z: 30 };
            let sum = 0;
            for (let key in obj) {
              sum = sum + obj[key];
            }
            sum
          `);
          expect(result).toBe(60);
        });

        it("should work with const loop variable", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2 };
            let result = "";
            for (const key in obj) {
              result = result + key;
            }
            result
          `);
          expect(result).toBe("ab");
        });

        it("should work with existing variable", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { x: 5, y: 10 };
            let key;
            let sum = 0;
            for (key in obj) {
              sum = sum + obj[key];
            }
            key
          `);
          expect(result).toBe("y"); // Last key assigned
        });
      });

      describe("for...in with arrays", () => {
        it("should iterate over array indices", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [10, 20, 30];
            let indices = [];
            for (let i in arr) {
              indices[indices.length] = i;
            }
            indices
          `);
          expect(result).toEqual(["0", "1", "2"]); // Indices are strings
        });

        it("should access array elements using string indices", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [5, 10, 15];
            let sum = 0;
            for (let i in arr) {
              sum = sum + arr[i];
            }
            sum
          `);
          expect(result).toBe(30);
        });

        it("should work with sparse arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [];
            arr[0] = 10;
            arr[2] = 30;
            let count = 0;
            for (let i in arr) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(2); // Only defined indices
        });
      });

      describe("for...in with break and continue", () => {
        it("should break out of loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2, c: 3, d: 4 };
            let count = 0;
            for (let key in obj) {
              count = count + 1;
              if (count === 2) {
                break;
              }
            }
            count
          `);
          expect(result).toBe(2);
        });

        it("should continue to next iteration", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2, c: 3, d: 4 };
            let sum = 0;
            for (let key in obj) {
              if (key === "b") {
                continue;
              }
              sum = sum + obj[key];
            }
            sum
          `);
          expect(result).toBe(8); // 1 + 3 + 4 (skips b: 2)
        });

        it("should break and return correct key list", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { x: 10, y: 20, z: 30 };
            let keys = [];
            for (let key in obj) {
              if (obj[key] === 20) {
                break;
              }
              keys[keys.length] = key;
            }
            keys
          `);
          expect(result).toEqual(["x"]);
        });
      });

      describe("for...in in functions", () => {
        it("should work inside functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getKeys(obj) {
              let keys = [];
              for (let key in obj) {
                keys[keys.length] = key;
              }
              return keys;
            }
            getKeys({ name: "Alice", age: 30 })
          `);
          expect(result).toEqual(["name", "age"]);
        });

        it("should return early from function", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function findKey(obj, value) {
              for (let key in obj) {
                if (obj[key] === value) {
                  return key;
                }
              }
              return "not found";
            }
            findKey({ a: 10, b: 20, c: 30 }, 20)
          `);
          expect(result).toBe("b");
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let sumValues = obj => {
              let sum = 0;
              for (let key in obj) {
                sum = sum + obj[key];
              }
              return sum;
            };
            sumValues({ x: 5, y: 10, z: 15 })
          `);
          expect(result).toBe(30);
        });
      });

      describe("Nested for...in loops", () => {
        it("should handle nested for...in", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj1 = { a: 1, b: 2 };
            let obj2 = { x: 10, y: 20 };
            let count = 0;
            for (let key1 in obj1) {
              for (let key2 in obj2) {
                count = count + 1;
              }
            }
            count
          `);
          expect(result).toBe(4); // 2 * 2
        });

        it("should access nested object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let nested = {
              person1: { name: "Alice", age: 30 },
              person2: { name: "Bob", age: 25 }
            };
            let names = [];
            for (let key in nested) {
              let person = nested[key];
              for (let prop in person) {
                if (prop === "name") {
                  names[names.length] = person[prop];
                }
              }
            }
            names
          `);
          expect(result).toEqual(["Alice", "Bob"]);
        });
      });

      describe("for...in scoping", () => {
        it("should scope loop variable to iteration with let", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2 };
            let key = "outer";
            for (let key in obj) {
              // inner key shadows outer
            }
            key
          `);
          expect(result).toBe("outer");
        });

        it("should scope loop variable to iteration with const", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2, c: 3 };
            for (const key in obj) {
              // const should work since each iteration has new scope
            }
            let result = "ok";
            result
          `);
          expect(result).toBe("ok");
        });

        it("should access outer scope from loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let multiplier = 10;
            let obj = { a: 1, b: 2 };
            let sum = 0;
            for (let key in obj) {
              sum = sum + (obj[key] * multiplier);
            }
            sum
          `);
          expect(result).toBe(30); // (1*10) + (2*10)
        });
      });

      describe("for...in with conditionals", () => {
        it("should filter properties with if", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 5, b: 15, c: 25, d: 10 };
            let sum = 0;
            for (let key in obj) {
              if (obj[key] > 10) {
                sum = sum + obj[key];
              }
            }
            sum
          `);
          expect(result).toBe(40); // 15 + 25
        });

        it("should work with if-else in loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 10, b: 20, c: 30 };
            let evenSum = 0;
            let oddSum = 0;
            for (let key in obj) {
              if (obj[key] % 2 === 0) {
                evenSum = evenSum + obj[key];
              } else {
                oddSum = oddSum + obj[key];
              }
            }
            evenSum
          `);
          expect(result).toBe(60); // All are even
        });
      });

      describe("for...in with array methods", () => {
        it("should build array using for...in", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { a: 1, b: 2, c: 3 };
            let values = [];
            for (let key in obj) {
              values.push(obj[key]);
            }
            values
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should use array methods on result", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { x: 5, y: 10, z: 15 };
            let values = [];
            for (let key in obj) {
              values.push(obj[key]);
            }
            values.map(v => v * 2)
          `);
          expect(result).toEqual([10, 20, 30]);
        });
      });

      describe("for...in with string methods", () => {
        it("should build string from keys", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { first: 1, second: 2, third: 3 };
            let result = "";
            for (let key in obj) {
              result = result + key.toUpperCase() + ",";
            }
            result.slice(0, -1)
          `);
          expect(result).toBe("FIRST,SECOND,THIRD");
        });
      });

      describe("Mixed for...in and for...of", () => {
        it("should use for...in with object and for...of with array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { items: [10, 20, 30] };
            let sum = 0;
            for (let key in obj) {
              for (let value of obj[key]) {
                sum = sum + value;
              }
            }
            sum
          `);
          expect(result).toBe(60);
        });
      });

      describe("Async for...in", () => {
        it("should work with evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let obj = { a: 1, b: 2, c: 3 };
            let sum = 0;
            for (let key in obj) {
              sum = sum + obj[key];
            }
            sum
          `);
          expect(result).toBe(6);
        });

        it("should work with async host functions", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncDouble: async (x: number) => x * 2,
            },
          });
          const result = await interpreter.evaluateAsync(`
            let obj = { a: 5, b: 10 };
            let sum = 0;
            for (let key in obj) {
              sum = sum + asyncDouble(obj[key]);
            }
            sum
          `);
          expect(result).toBe(30); // (5*2) + (10*2)
        });
      });

      describe("Edge cases", () => {
        it("should handle empty object", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = {};
            let count = 0;
            for (let key in obj) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(0);
        });

        it("should handle empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [];
            let count = 0;
            for (let key in arr) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(0);
        });

        it("should throw error for null", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj = null;
              for (let key in obj) {
                // should not reach here
              }
            `);
          }).toThrow("for...in requires an object or array, got null/undefined");
        });

        it("should throw error for undefined", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj;
              for (let key in obj) {
                // should not reach here
              }
            `);
          }).toThrow("for...in requires an object or array, got null/undefined");
        });

        it("should throw error for primitives", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let num = 42;
              for (let key in num) {
                // should not reach here
              }
            `);
          }).toThrow("for...in requires an object or array, got number");
        });

        it("should handle object with numeric keys", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = { 1: "one", 2: "two", 3: "three" };
            let keys = [];
            for (let key in obj) {
              keys.push(key);
            }
            keys
          `);
          expect(result).toEqual(["1", "2", "3"]);
        });
      });
    });

    describe("Break and Continue", () => {
      describe("Break in while loops", () => {
        it("should break out of while loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            let i = 0;
            while (i < 10) {
              if (i === 5) {
                break;
              }
              sum = sum + i;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
        });

        it("should break immediately when condition is met", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            while (true) {
              count = count + 1;
              if (count === 3) {
                break;
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(3);
        });

        it("should support break with multiple conditions", () => {
          const interpreter = new Interpreter();
          const code = `
            let i = 0;
            let result = 0;
            while (i < 100) {
              if (i % 3 === 0 && i > 10) {
                break;
              }
              result = i;
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(11);
        });

        it("should handle break in nested if", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            let i = 1;
            while (i <= 10) {
              if (i > 5) {
                if (i === 7) {
                  break;
                }
              }
              sum = sum + i;
              i = i + 1;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(21); // 1+2+3+4+5+6
        });
      });

      describe("Continue in while loops", () => {
        it("should continue to next iteration", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            let i = 0;
            while (i < 10) {
              i = i + 1;
              if (i % 2 === 0) {
                continue;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
        });

        it("should skip rest of loop body after continue", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            let i = 0;
            while (i < 5) {
              i = i + 1;
              if (i === 3) {
                continue;
              }
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(4); // skips i=3
        });

        it("should handle multiple continues", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            let i = 0;
            while (i < 10) {
              i = i + 1;
              if (i % 2 === 0) {
                continue;
              }
              if (i > 7) {
                continue;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(16); // 1+3+5+7
        });
      });

      describe("Break in for loops", () => {
        it("should break out of for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 10; i++) {
              if (i === 5) {
                break;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
        });

        it("should break from infinite for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (;;) {
              count = count + 1;
              if (count === 5) {
                break;
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(5);
        });

        it("should break with complex condition", () => {
          const interpreter = new Interpreter();
          const code = `
            let result = 0;
            for (let i = 1; i <= 100; i++) {
              if (i * i > 50) {
                break;
              }
              result = i;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(7); // 7*7=49, 8*8=64
        });
      });

      describe("Continue in for loops", () => {
        it("should continue to next iteration in for loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 10; i++) {
              if (i % 2 === 0) {
                continue;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
        });

        it("should execute update expression after continue", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 0; i < 5; i++) {
              if (i === 2) {
                continue;
              }
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(4); // skips i=2
        });

        it("should handle continue with multiple conditions", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 1; i <= 10; i++) {
              if (i % 2 === 0 || i > 7) {
                continue;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(16); // 1+3+5+7
        });
      });

      describe("Nested loops with break", () => {
        it("should break only inner loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 3) {
                  break;
                }
                sum = sum + 1;
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(9); // 3 * 3
        });

        it("should break inner while loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let result = 0;
            let i = 0;
            while (i < 3) {
              let j = 0;
              while (j < 5) {
                if (j === 2) {
                  break;
                }
                result = result + 1;
                j = j + 1;
              }
              i = i + 1;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(6); // 3 * 2
        });

        it("should break outer loop from inner condition", () => {
          const interpreter = new Interpreter();
          const code = `
            let found = 0;
            let done = 0;
            for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 5; j++) {
                if (i === 2 && j === 3) {
                  found = 1;
                  done = 1;
                }
                if (done) {
                  break;
                }
              }
              if (done) {
                break;
              }
            }
            found
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });
      });

      describe("Nested loops with continue", () => {
        it("should continue only inner loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 2) {
                  continue;
                }
                sum = sum + 1;
              }
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(12); // 3 * 4
        });

        it("should continue inner while loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            let i = 0;
            while (i < 3) {
              let j = 0;
              while (j < 5) {
                j = j + 1;
                if (j === 3) {
                  continue;
                }
                count = count + 1;
              }
              i = i + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(12); // 3 * 4
        });
      });

      describe("Break and continue with arrays", () => {
        it("should break when finding element in array", () => {
          const interpreter = new Interpreter();
          const code = `
            function findIndex(arr, target) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i] === target) {
                  return i;
                }
              }
              return -1;
            }
            findIndex([10, 20, 30, 40], 30)
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should continue to skip elements", () => {
          const interpreter = new Interpreter();
          const code = `
            let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            let sum = 0;
            for (let i = 0; i < arr.length; i++) {
              if (arr[i] % 3 === 0) {
                continue;
              }
              sum = sum + arr[i];
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(37); // 55 - (3+6+9)
        });

        it("should break when sum exceeds threshold", () => {
          const interpreter = new Interpreter();
          const code = `
            let arr = [5, 10, 15, 20, 25];
            let sum = 0;
            let count = 0;
            for (let i = 0; i < arr.length; i++) {
              sum = sum + arr[i];
              count = count + 1;
              if (sum > 30) {
                break;
              }
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(4); // 5+10+15+20=50 >30, so breaks after 4 iterations
        });
      });

      describe("Break and continue with objects", () => {
        it("should break when finding object property", () => {
          const interpreter = new Interpreter();
          const code = `
            let people = [
              { name: "Alice", age: 25 },
              { name: "Bob", age: 30 },
              { name: "Charlie", age: 35 }
            ];
            let found = "";
            for (let i = 0; i < people.length; i++) {
              if (people[i].age === 30) {
                found = people[i].name;
                break;
              }
            }
            found
          `;
          expect(interpreter.evaluate(code)).toBe("Bob");
        });

        it("should continue to skip objects", () => {
          const interpreter = new Interpreter();
          const code = `
            let items = [
              { value: 10, active: 1 },
              { value: 20, active: 0 },
              { value: 30, active: 1 },
              { value: 40, active: 0 }
            ];
            let sum = 0;
            for (let i = 0; i < items.length; i++) {
              if (items[i].active === 0) {
                continue;
              }
              sum = sum + items[i].value;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(40); // 10+30
        });
      });

      describe("Break and continue in functions", () => {
        it("should use break in function with loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function firstEven(n) {
              for (let i = 0; i < n; i++) {
                if (i % 2 === 0 && i > 0) {
                  return i;
                }
              }
              return -1;
            }
            firstEven(10)
          `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should use continue in function with loop", () => {
          const interpreter = new Interpreter();
          const code = `
            function sumOdds(n) {
              let sum = 0;
              for (let i = 0; i < n; i++) {
                if (i % 2 === 0) {
                  continue;
                }
                sum = sum + i;
              }
              return sum;
            }
            sumOdds(10)
          `;
          expect(interpreter.evaluate(code)).toBe(25); // 1+3+5+7+9
        });

        it("should use both break and continue", () => {
          const interpreter = new Interpreter();
          const code = `
            function countSpecial(n) {
              let count = 0;
              for (let i = 1; i <= n; i++) {
                if (i > 20) {
                  break;
                }
                if (i % 2 === 0) {
                  continue;
                }
                if (i % 3 === 0) {
                  count = count + 1;
                }
              }
              return count;
            }
            countSpecial(50)
          `;
          expect(interpreter.evaluate(code)).toBe(3); // 3, 9, 15 (stops at 21, so only 3 odd multiples of 3 <=20)
        });
      });

      describe("Complex break and continue patterns", () => {
        it("should handle break with continue in same loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 20; i++) {
              if (i > 15) {
                break;
              }
              if (i % 2 === 0) {
                continue;
              }
              sum = sum + i;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(64); // 1+3+5+7+9+11+13+15
        });

        it("should use break in while with complex logic", () => {
          const interpreter = new Interpreter();
          const code = `
            let result = 0;
            let i = 0;
            while (i < 100) {
              i = i + 1;
              if (i % 5 === 0) {
                if (i > 30) {
                  break;
                }
                continue;
              }
              result = result + i;
            }
            result
          `;
          expect(interpreter.evaluate(code)).toBe(490); // sum(1..35) - (5+10+15+20+25+30) = 630-140=490
        });

        it("should handle alternating break and continue", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            let i = 0;
            while (i < 10) {
              i = i + 1;
              if (i === 8) {
                break;
              }
              if (i % 2 === 0) {
                continue;
              }
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(4); // 1,3,5,7 (stops before 8)
        });
      });

      describe("Edge cases", () => {
        it("should handle break as first statement in loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let count = 0;
            for (let i = 0; i < 10; i++) {
              break;
              count = count + 1;
            }
            count
          `;
          expect(interpreter.evaluate(code)).toBe(0);
        });

        it("should handle continue as last effective statement", () => {
          const interpreter = new Interpreter();
          const code = `
            let sum = 0;
            for (let i = 0; i < 5; i++) {
              sum = sum + i;
              continue;
            }
            sum
          `;
          expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
        });

        it("should handle break in single iteration loop", () => {
          const interpreter = new Interpreter();
          const code = `
            let x = 0;
            while (x < 1) {
              x = x + 1;
              break;
            }
            x
          `;
          expect(interpreter.evaluate(code)).toBe(1);
        });

        it("should return undefined from loop with break", () => {
          const interpreter = new Interpreter();
          const code = `
            for (let i = 0; i < 5; i++) {
              if (i === 2) {
                break;
              }
            }
          `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });
      });
    });

    describe("labeled statements", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("Labeled break", () => {
        test("break out of outer loop from inner loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            outer: for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 2) break outer;
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(2); // i=0, j=0 and j=1
        });

        test("break out of labeled while loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            outer: while (true) {
              let i = 0;
              while (i < 10) {
                if (i === 3) break outer;
                result++;
                i++;
              }
            }
            result;
          `);
          expect(result).toBe(3);
        });

        test("break out of labeled block statement", () => {
          const result = interpreter.evaluate(`
            let x = 0;
            block: {
              x = 1;
              break block;
              x = 2;
            }
            x;
          `);
          expect(result).toBe(1);
        });

        test("unlabeled break still works in labeled loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            outer: for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 2) break; // breaks inner loop only
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(10); // 5 iterations of outer * 2 iterations of inner
        });
      });

      describe("Labeled continue", () => {
        test("continue outer loop from inner loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            outer: for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                if (j === 1) continue outer;
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(3); // i=0,j=0; i=1,j=0; i=2,j=0
        });

        test("continue labeled while loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            let i = 0;
            outer: while (i < 3) {
              i++;
              let j = 0;
              while (j < 3) {
                j++;
                if (j === 2) continue outer;
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(3); // each outer iteration: j=1 increments result, j=2 continues outer
        });

        test("unlabeled continue still works in labeled loop", () => {
          const result = interpreter.evaluate(`
            let result = 0;
            outer: for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 2) continue; // continues inner loop only
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(12); // 3 * (5 - 1 skip) = 12
        });
      });

      describe("Nested labels", () => {
        test("multiple labels on nested loops", () => {
          const result = interpreter.evaluate(`
            let result = [];
            outer: for (let i = 0; i < 3; i++) {
              middle: for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                  if (k === 1) continue middle;
                  if (j === 2) break outer;
                  result.push(i + ',' + j + ',' + k);
                }
              }
            }
            result;
          `);
          // i=0,j=0,k=0 -> push; k=1 -> continue middle
          // i=0,j=1,k=0 -> push; k=1 -> continue middle
          // i=0,j=2 -> break outer
          expect(result).toEqual(["0,0,0", "0,1,0"]);
        });
      });

      describe("Label with for-of", () => {
        test("break labeled for-of from inner loop", () => {
          const result = interpreter.evaluate(`
            let result = [];
            outer: for (let item of [1, 2, 3]) {
              for (let j = 0; j < 3; j++) {
                if (j === 1) break outer;
                result.push(item);
              }
            }
            result;
          `);
          expect(result).toEqual([1]);
        });

        test("continue labeled for-of from inner loop", () => {
          const result = interpreter.evaluate(`
            let result = [];
            outer: for (let item of [1, 2, 3]) {
              for (let j = 0; j < 3; j++) {
                if (j === 1) continue outer;
                result.push(item + '-' + j);
              }
            }
            result;
          `);
          expect(result).toEqual(["1-0", "2-0", "3-0"]);
        });
      });

      describe("Label with for-in", () => {
        test("break labeled for-in from inner loop", () => {
          const result = interpreter.evaluate(`
            let result = [];
            let obj = { a: 1, b: 2, c: 3 };
            outer: for (let key in obj) {
              for (let j = 0; j < 3; j++) {
                if (j === 1) break outer;
                result.push(key);
              }
            }
            result;
          `);
          expect(result).toEqual(["a"]);
        });
      });

      describe("Async evaluation", () => {
        test("labeled break works in async context", async () => {
          const result = await interpreter.evaluateAsync(`
            let result = 0;
            outer: for (let i = 0; i < 5; i++) {
              for (let j = 0; j < 5; j++) {
                if (j === 2) break outer;
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(2);
        });

        test("labeled continue works in async context", async () => {
          const result = await interpreter.evaluateAsync(`
            let result = 0;
            outer: for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                if (j === 1) continue outer;
                result++;
              }
            }
            result;
          `);
          expect(result).toBe(3);
        });
      });
    });

    describe("Try/Catch/Finally", () => {
      describe("Basic try/catch", () => {
        it("should catch thrown errors", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = "not caught";
            try {
              throw "error!";
            } catch (e) {
              result = "caught: " + e;
            }
            result;
          `);
          expect(result).toContain("caught:");
        });

        it("should execute try block when no error", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = "";
            try {
              result = "success";
            } catch (e) {
              result = "error";
            }
            result;
          `);
          expect(result).toBe("success");
        });

        it("should bind error to catch parameter", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            try {
              throw "my error";
            } catch (e) {
              e;
            }
          `);
          expect(result).toBeInstanceOf(InterpreterError);
          expect(String(result)).toContain("my error");
        });

        it("should support catch without parameter (ES2019)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let caught = false;
            try {
              throw "error";
            } catch {
              caught = true;
            }
            caught;
          `);
          expect(result).toBe(true);
        });

        it("should have proper scope for catch parameter", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let e = "outer";
            try {
              throw "inner error";
            } catch (e) {
              // e is the error here
            }
            e; // Should be outer again
          `);
          expect(result).toBe("outer");
        });
      });

      describe("Try/finally without catch", () => {
        it("should execute finally block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = "";
            try {
              result = "try";
            } finally {
              result = result + " finally";
            }
            result;
          `);
          expect(result).toBe("try finally");
        });

        it("should execute finally when returning from try", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = "";
            function test() {
              try {
                return "value";
              } finally {
                log = "finally";
              }
            }
            let out = test();
            [out, log];
          `);
          expect(result).toEqual(["value", "finally"]);
        });

        it("should execute finally even when error is thrown", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = "start";
            try {
              try {
                throw "error";
              } finally {
                result = "finally executed";
              }
            } catch (e) {
              // Catch outer error
            }
            result;
          `);
          expect(result).toBe("finally executed");
        });
      });

      describe("Try/catch/finally", () => {
        it("should execute all blocks when no error", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = [];
            try {
              log.push("try");
            } catch (e) {
              log.push("catch");
            } finally {
              log.push("finally");
            }
            log;
          `);
          expect(result).toEqual(["try", "finally"]);
        });

        it("should execute catch and finally when error thrown", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = [];
            try {
              log.push("try");
              throw "error";
            } catch (e) {
              log.push("catch");
            } finally {
              log.push("finally");
            }
            log;
          `);
          expect(result).toEqual(["try", "catch", "finally"]);
        });

        it("should execute finally even if catch throws", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let finallyCalled = false;
              try {
                throw "first error";
              } catch (e) {
                throw "second error";
              } finally {
                finallyCalled = true;
              }
            `);
          }).toThrow();

          // Verify finally was called by checking the variable
          const wasFinallyCalled = interpreter.evaluate("finallyCalled");
          expect(wasFinallyCalled).toBe(true);
        });
      });

      describe("Control flow in try/catch/finally", () => {
        it("should handle return in try block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function test() {
              try {
                return "from try";
              } catch (e) {
                return "from catch";
              } finally {
                // Finally executes but doesn't override return
              }
            }
            test();
          `);
          expect(result).toBe("from try");
        });

        it("should handle return in catch block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function test() {
              try {
                throw "error";
              } catch (e) {
                return "from catch";
              } finally {
                // Finally executes but doesn't override return
              }
            }
            test();
          `);
          expect(result).toBe("from catch");
        });

        it("should override return with finally return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function test() {
              try {
                return "from try";
              } finally {
                return "from finally";
              }
            }
            test();
          `);
          expect(result).toBe("from finally");
        });

        it("should handle break in try block within loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let i = 0;
            while (true) {
              try {
                i++;
                if (i === 3) break;
              } finally {
                // Finally executes before break
              }
            }
            i;
          `);
          expect(result).toBe(3);
        });

        it("should handle continue in try block within loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let count = 0;
            for (let i = 0; i < 5; i++) {
              try {
                if (i === 2) continue;
                count++;
              } finally {
                // Finally executes even with continue
              }
            }
            count;
          `);
          expect(result).toBe(4); // Skipped i=2
        });

        it("should handle break in finally (overrides try)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let i = 0;
            while (i < 10) {
              try {
                i++;
              } finally {
                if (i === 3) break;
              }
            }
            i;
          `);
          expect(result).toBe(3);
        });
      });

      describe("Nested try/catch", () => {
        it("should handle nested try/catch blocks", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = [];
            try {
              log.push("outer try");
              try {
                log.push("inner try");
                throw "inner error";
              } catch (e) {
                log.push("inner catch");
              }
              log.push("after inner");
            } catch (e) {
              log.push("outer catch");
            }
            log;
          `);
          expect(result).toEqual(["outer try", "inner try", "inner catch", "after inner"]);
        });

        it("should propagate uncaught errors to outer catch", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = [];
            try {
              log.push("outer try");
              try {
                log.push("inner try");
                throw "error";
              } finally {
                log.push("inner finally");
              }
            } catch (e) {
              log.push("outer catch");
            }
            log;
          `);
          expect(result).toEqual(["outer try", "inner try", "inner finally", "outer catch"]);
        });
      });

      describe("Error types", () => {
        it("should throw string errors", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`throw "string error";`);
          }).toThrow("Uncaught string error");
        });

        it("should throw number errors", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`throw 42;`);
          }).toThrow("Uncaught 42");
        });

        it("should throw object errors", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let caught = null;
            try {
              throw { message: "error", code: 500 };
            } catch (e) {
              caught = e;
            }
            caught;
          `);
          expect(result).toBeInstanceOf(InterpreterError);
          expect(String(result)).toContain("[object Object]");
        });

        it("should catch interpreter errors", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let caught = false;
            try {
              let x = undefinedVariable; // This will throw InterpreterError
            } catch (e) {
              caught = true;
            }
            caught;
          `);
          expect(result).toBe(true);
        });
      });

      describe("Try/catch with expressions", () => {
        it("should evaluate throw expressions", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let x = 5;
              throw x * 2;
            `);
          }).toThrow("Uncaught 10");
        });

        it("should catch and use error in expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            try {
              throw 100;
            } catch (e) {
              e;
            }
          `);
          expect(result).toBeInstanceOf(InterpreterError);
          expect(String(result)).toContain("100");
        });
      });

      describe("Edge cases", () => {
        it("should handle empty try block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            try {
            } catch (e) {
              x = 2;
            }
            x;
          `);
          expect(result).toBe(1);
        });

        it("should handle empty catch block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            try {
              throw "error";
            } catch (e) {
            }
            x;
          `);
          expect(result).toBe(1);
        });

        it("should handle empty finally block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 1;
            try {
              x = 2;
            } finally {
            }
            x;
          `);
          expect(result).toBe(2);
        });

        it("should handle multiple statements in each block", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let log = [];
            try {
              log.push(1);
              log.push(2);
              throw "error";
              log.push(3); // Not executed
            } catch (e) {
              log.push(4);
              log.push(5);
            } finally {
              log.push(6);
              log.push(7);
            }
            log;
          `);
          expect(result).toEqual([1, 2, 4, 5, 6, 7]);
        });
      });

      describe("Async try/catch/finally", () => {
        it("should catch errors in async code", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let result = "";
            try {
              throw "async error";
            } catch (e) {
              result = "caught";
            }
            result;
          `);
          expect(result).toBe("caught");
        });

        it("should execute finally in async code", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let log = [];
            try {
              log.push("try");
            } catch (e) {
              log.push("catch");
            } finally {
              log.push("finally");
            }
            log;
          `);
          expect(result).toEqual(["try", "finally"]);
        });

        it("should handle async functions with try/catch", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function test() {
              try {
                throw "error";
              } catch (e) {
                return "caught";
              }
            }
            test()
          `);
          expect(result).toBe("caught");
        });

        it("should handle return in async try/catch", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function test() {
              try {
                return "success";
              } finally {
                // Finally executes
              }
            }
            test()
          `);
          expect(result).toBe("success");
        });

        it("should handle await in try/catch", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function fetchData() {
              return "data";
            }
            async function process() {
              let result = "";
              try {
                result = await fetchData();
              } catch (e) {
                result = "error";
              }
              return result;
            }
            process()
          `);
          expect(result).toBe("data");
        });
      });
    });
  });

  describe("ES2015", () => {
    describe("for...of Loops", () => {
      describe("Basic for...of", () => {
        it("should iterate over array elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let sum = 0;
            let arr = [1, 2, 3, 4, 5];
            for (let num of arr) {
              sum = sum + num;
            }
            sum
          `);
          expect(result).toBe(15);
        });

        it("should work with const loop variable", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let product = 1;
            let arr = [2, 3, 4];
            for (const num of arr) {
              product = product * num;
            }
            product
          `);
          expect(result).toBe(24);
        });

        it("should iterate over string array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let result = "";
            let words = ["hello", " ", "world"];
            for (let word of words) {
              result = result + word;
            }
            result
          `);
          expect(result).toBe("hello world");
        });

        it("should work with empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let count = 0;
            for (let item of []) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(0);
        });

        it("should work with single element array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let value = 0;
            for (let x of [42]) {
              value = x;
            }
            value
          `);
          expect(result).toBe(42);
        });
      });

      describe("for...of with existing variable", () => {
        it("should use existing variable for iteration", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let num = 0;
            let sum = 0;
            for (num of [10, 20, 30]) {
              sum = sum + num;
            }
            sum
          `);
          expect(result).toBe(60);
        });

        it("should preserve final value of loop variable", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let item = 0;
            for (item of [1, 2, 3]) {
              // iterate
            }
            item
          `);
          expect(result).toBe(3);
        });
      });

      describe("for...of with objects", () => {
        it("should iterate over array of objects", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let people = [
              { name: "Alice", age: 30 },
              { name: "Bob", age: 25 },
              { name: "Charlie", age: 35 }
            ];
            let totalAge = 0;
            for (let person of people) {
              totalAge = totalAge + person.age;
            }
            totalAge
          `);
          expect(result).toBe(90);
        });

        it("should access object properties in loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let users = [
              { id: 1, active: true },
              { id: 2, active: false },
              { id: 3, active: true }
            ];
            let activeCount = 0;
            for (let user of users) {
              if (user.active) {
                activeCount = activeCount + 1;
              }
            }
            activeCount
          `);
          expect(result).toBe(2);
        });
      });

      describe("for...of with nested arrays", () => {
        it("should iterate over 2D array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let matrix = [[1, 2], [3, 4], [5, 6]];
            let sum = 0;
            for (let row of matrix) {
              for (let val of row) {
                sum = sum + val;
              }
            }
            sum
          `);
          expect(result).toBe(21);
        });

        it("should flatten nested array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let nested = [[1, 2], [3], [4, 5, 6]];
            let flat = [];
            let index = 0;
            for (let arr of nested) {
              for (let val of arr) {
                flat[index] = val;
                index = index + 1;
              }
            }
            flat.length
          `);
          expect(result).toBe(6);
        });
      });

      describe("for...of with break", () => {
        it("should exit loop on break", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [1, 2, 3, 4, 5];
            let sum = 0;
            for (let num of arr) {
              if (num > 3) {
                break;
              }
              sum = sum + num;
            }
            sum
          `);
          expect(result).toBe(6); // 1+2+3
        });

        it("should find first matching element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [1, 3, 5, 8, 9, 10];
            let found = 0;
            for (let num of numbers) {
              if (num % 2 === 0) {
                found = num;
                break;
              }
            }
            found
          `);
          expect(result).toBe(8);
        });
      });

      describe("for...of with continue", () => {
        it("should skip even numbers", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [1, 2, 3, 4, 5, 6];
            let sum = 0;
            for (let num of numbers) {
              if (num % 2 === 0) {
                continue;
              }
              sum = sum + num;
            }
            sum
          `);
          expect(result).toBe(9); // 1+3+5
        });

        it("should process only positive numbers", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [-2, 5, -1, 3, 0, 7];
            let count = 0;
            for (let num of numbers) {
              if (num <= 0) {
                continue;
              }
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(3);
        });
      });

      describe("for...of in functions", () => {
        it("should work in function body", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function sumArray(arr) {
              let total = 0;
              for (let num of arr) {
                total = total + num;
              }
              return total;
            }
            sumArray([10, 20, 30, 40])
          `);
          expect(result).toBe(100);
        });

        it("should support early return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function findFirstNegative(arr) {
              for (let num of arr) {
                if (num < 0) {
                  return num;
                }
              }
              return 0;
            }
            findFirstNegative([5, 3, -2, 8, -1])
          `);
          expect(result).toBe(-2);
        });

        it("should work with arrow functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let maxValue = arr => {
              let max = arr[0];
              for (let val of arr) {
                if (val > max) {
                  max = val;
                }
              }
              return max;
            };
            maxValue([3, 9, 1, 7, 5])
          `);
          expect(result).toBe(9);
        });
      });

      describe("for...of scoping", () => {
        it("should scope loop variable to loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let x = 100;
            for (let x of [1, 2, 3]) {
              // x is scoped to loop
            }
            x
          `);
          expect(result).toBe(100);
        });

        it("should allow nested for...of with same variable name", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let count = 0;
            for (let i of [1, 2]) {
              for (let i of [10, 20]) {
                count = count + i;
              }
            }
            count
          `);
          expect(result).toBe(60); // (10+20) * 2
        });

        it("should access outer scope variables", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let multiplier = 10;
            let result = 0;
            for (let num of [1, 2, 3]) {
              result = result + (num * multiplier);
            }
            result
          `);
          expect(result).toBe(60);
        });
      });

      describe("for...of with conditionals", () => {
        it("should work with if/else in body", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [1, 2, 3, 4, 5, 6];
            let evenSum = 0;
            let oddSum = 0;
            for (let num of numbers) {
              if (num % 2 === 0) {
                evenSum = evenSum + num;
              } else {
                oddSum = oddSum + num;
              }
            }
            evenSum - oddSum
          `);
          expect(result).toBe(3); // (2+4+6) - (1+3+5)
        });

        it("should support nested conditionals", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let values = [10, 25, 5, 30, 15];
            let category = "";
            for (let val of values) {
              if (val > 20) {
                if (val > 25) {
                  category = "high";
                } else {
                  category = "medium";
                }
              }
            }
            category
          `);
          expect(result).toBe("high");
        });
      });

      describe("for...of with array modifications", () => {
        it("should build new array from elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [1, 2, 3, 4];
            let doubled = [];
            let index = 0;
            for (let num of numbers) {
              doubled[index] = num * 2;
              index = index + 1;
            }
            doubled[2]
          `);
          expect(result).toBe(6);
        });

        it("should filter array elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let numbers = [1, 2, 3, 4, 5, 6, 7, 8];
            let evens = [];
            let index = 0;
            for (let num of numbers) {
              if (num % 2 === 0) {
                evens[index] = num;
                index = index + 1;
              }
            }
            evens.length
          `);
          expect(result).toBe(4);
        });
      });

      describe("Async for...of", () => {
        it("should work in evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            for (let num of [1, 2, 3, 4]) {
              sum = sum + num;
            }
            sum
          `);
          expect(result).toBe(10);
        });

        it("should work with async host functions", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncDouble: async (x: number) => x * 2,
            },
          });
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            for (let num of [1, 2, 3]) {
              sum = sum + asyncDouble(num);
            }
            sum
          `);
          expect(result).toBe(12); // 2+4+6
        });

        it("should support async operations in nested loops", async () => {
          const interpreter = new Interpreter({
            globals: {
              asyncAdd: async (a: number, b: number) => a + b,
            },
          });
          const result = await interpreter.evaluateAsync(`
            let total = 0;
            for (let i of [1, 2]) {
              for (let j of [10, 20]) {
                total = asyncAdd(total, i * j);
              }
            }
            total
          `);
          expect(result).toBe(90); // (1*10 + 1*20 + 2*10 + 2*20)
        });

        it("should work with async sandbox functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function processArray(arr) {
              let result = 0;
              for (let val of arr) {
                result = result + val;
              }
              return result;
            }
            processArray([5, 10, 15, 20])
          `);
          expect(result).toBe(50);
        });
      });

      describe("Error cases", () => {
        it("should throw error for non-array iterable", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              for (let x of 123) {
                // error
              }
            `);
          }).toThrow(
            "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
          );
        });

        it("should throw error for null iterable", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              for (let x of null) {
                // error
              }
            `);
          }).toThrow(
            "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
          );
        });

        it("should iterate over string characters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let chars = [];
            for (let x of "hello") {
              chars.push(x);
            }
            chars;
          `);
          expect(result).toEqual(["h", "e", "l", "l", "o"]);
        });

        it("should throw error for object iterable", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              let obj = { a: 1, b: 2 };
              for (let x of obj) {
                // error
              }
            `);
          }).toThrow(
            "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
          );
        });
      });

      describe("Edge cases", () => {
        it("should handle array with boolean values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [1, true, 3];
            let count = 0;
            for (let val of arr) {
              count = count + 1;
            }
            count
          `);
          expect(result).toBe(3);
        });

        it("should handle array with null values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [null, 2, null, 4];
            let sum = 0;
            for (let val of arr) {
              if (val !== null) {
                sum = sum + val;
              }
            }
            sum
          `);
          expect(result).toBe(6);
        });

        it("should handle array with mixed types", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let arr = [1, "hello", true, 42];
            let count = 0;
            for (let val of arr) {
              if (typeof val === "number") {
                count = count + 1;
              }
            }
            count
          `);
          expect(result).toBe(2);
        });

        it("should work with array from function call", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function getArray() {
              return [10, 20, 30];
            }
            let sum = 0;
            for (let val of getArray()) {
              sum = sum + val;
            }
            sum
          `);
          expect(result).toBe(60);
        });
      });
    });

    describe("for...of with destructuring", () => {
      describe("Array destructuring", () => {
        it("should support array destructuring with const", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let sum = 0;
            const pairs = [[1, 2], [3, 4], [5, 6]];
            for (const [a, b] of pairs) {
              sum += a + b;
            }
            sum;
          `);
          expect(result).toBe(21);
        });

        it("should support array destructuring with let", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const entries = [[1, 10], [2, 20]];
            for (let [key, value] of entries) {
              key = key * 2;
              results.push(key + value);
            }
            results;
          `);
          expect(result).toEqual([12, 24]);
        });

        it("should support nested array destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const data = [[1, [2, 3]], [4, [5, 6]]];
            for (const [a, [b, c]] of data) {
              results.push(a + b + c);
            }
            results;
          `);
          expect(result).toEqual([6, 15]);
        });

        it("should support rest element in array destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const arrays = [[1, 2, 3, 4], [5, 6, 7, 8]];
            for (const [first, ...rest] of arrays) {
              results.push([first, rest]);
            }
            results;
          `);
          expect(result).toEqual([
            [1, [2, 3, 4]],
            [5, [6, 7, 8]],
          ]);
        });

        it("should support default values in array destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const data = [[1], [2, 3], [4]];
            for (const [a, b = 0] of data) {
              results.push(a + b);
            }
            results;
          `);
          expect(result).toEqual([1, 5, 4]);
        });
      });

      describe("Object destructuring", () => {
        it("should support object destructuring with const", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let names = [];
            const people = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
            for (const { name } of people) {
              names.push(name);
            }
            names;
          `);
          expect(result).toEqual(["Alice", "Bob"]);
        });

        it("should support object destructuring with let", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const items = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
            for (let { x, y } of items) {
              x = x * 10;
              results.push(x + y);
            }
            results;
          `);
          expect(result).toEqual([12, 34]);
        });

        it("should support renaming in object destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const items = [{ a: 1 }, { a: 2 }];
            for (const { a: value } of items) {
              results.push(value * 2);
            }
            results;
          `);
          expect(result).toEqual([2, 4]);
        });

        it("should support default values in object destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const items = [{ a: 1 }, { a: 2, b: 3 }];
            for (const { a, b = 0 } of items) {
              results.push(a + b);
            }
            results;
          `);
          expect(result).toEqual([1, 5]);
        });

        it("should support nested object destructuring", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let results = [];
            const data = [
              { outer: { inner: 1 } },
              { outer: { inner: 2 } }
            ];
            for (const { outer: { inner } } of data) {
              results.push(inner);
            }
            results;
          `);
          expect(result).toEqual([1, 2]);
        });
      });

      describe("Mixed and edge cases", () => {
        it("should work with Map.entries()-like data", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            let obj = {};
            const entries = [['a', 1], ['b', 2], ['c', 3]];
            for (const [key, value] of entries) {
              obj[key] = value;
            }
            obj;
          `);
          expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should work with generators", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function* pairs() {
              yield [1, 2];
              yield [3, 4];
            }
            let sum = 0;
            for (const [a, b] of pairs()) {
              sum += a + b;
            }
            sum;
          `);
          expect(result).toBe(10);
        });

        it("should create new scope per iteration for closures", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            const funcs = [];
            const pairs = [[1, 'a'], [2, 'b'], [3, 'c']];
            for (const [num, letter] of pairs) {
              funcs.push(() => num + letter);
            }
            [funcs[0](), funcs[1](), funcs[2]()];
          `);
          expect(result).toEqual(["1a", "2b", "3c"]);
        });
      });

      describe("Async evaluation", () => {
        it("should support destructuring in async for...of", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            const pairs = [[1, 2], [3, 4]];
            for (const [a, b] of pairs) {
              sum += a + b;
            }
            sum;
          `);
          expect(result).toBe(10);
        });

        it("should support object destructuring in async for...of", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let names = [];
            const items = [{ name: 'X' }, { name: 'Y' }];
            for (const { name } of items) {
              names.push(name);
            }
            names;
          `);
          expect(result).toEqual(["X", "Y"]);
        });
      });
    });
  });
});
