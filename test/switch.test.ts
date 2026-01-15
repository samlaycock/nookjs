import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

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
