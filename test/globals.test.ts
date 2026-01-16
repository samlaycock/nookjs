import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Injected Globals", () => {
  describe("Constructor globals", () => {
    it("should access constructor globals", () => {
      const interpreter = new Interpreter({ globals: { x: 10, y: 20 } });
      expect(interpreter.evaluate("x + y")).toBe(30);
    });

    it("should access single constructor global", () => {
      const interpreter = new Interpreter({ globals: { message: "hello" } });
      expect(interpreter.evaluate("message")).toBe("hello");
    });

    it("should access multiple constructor globals", () => {
      const interpreter = new Interpreter({
        globals: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
        },
      });
      expect(interpreter.evaluate("a + b + c + d")).toBe(10);
    });

    it("should not allow reassigning const globals", () => {
      const interpreter = new Interpreter({ globals: { x: 10 } });
      expect(() => interpreter.evaluate("x = 20")).toThrow(
        "Cannot assign to const variable 'x'",
      );
    });

    it("should allow using globals in expressions", () => {
      const interpreter = new Interpreter({ globals: { PI: 3.14159 } });
      expect(interpreter.evaluate("PI * 2")).toBeCloseTo(6.28318, 4);
    });

    it("should support object globals", () => {
      const interpreter = new Interpreter({
        globals: {
          config: { debug: true, max: 100, name: "test" },
        },
      });
      expect(interpreter.evaluate("config.max")).toBe(100);
      expect(interpreter.evaluate("config.debug")).toBe(true);
      expect(interpreter.evaluate("config.name")).toBe("test");
    });

    it("should support nested object globals", () => {
      const interpreter = new Interpreter({
        globals: {
          settings: {
            user: { name: "Alice", age: 30 },
            system: { version: "1.0" },
          },
        },
      });
      expect(interpreter.evaluate("settings.user.name")).toBe("Alice");
      expect(interpreter.evaluate("settings.user.age")).toBe(30);
      expect(interpreter.evaluate("settings.system.version")).toBe("1.0");
    });

    it("should support array globals", () => {
      const interpreter = new Interpreter({
        globals: {
          numbers: [1, 2, 3, 4, 5],
        },
      });
      expect(interpreter.evaluate("numbers[0]")).toBe(1);
      expect(interpreter.evaluate("numbers[4]")).toBe(5);
      expect(interpreter.evaluate("numbers.length")).toBe(5);
    });

    it("should block modifying properties of global objects (read-only)", () => {
      const interpreter = new Interpreter({
        globals: {
          obj: { count: 0 },
        },
      });
      expect(() => {
        interpreter.evaluate("obj.count = obj.count + 1");
      }).toThrow("Cannot modify property 'count' on global 'obj'");
    });

    it("should block modifying elements of global arrays (read-only)", () => {
      const interpreter = new Interpreter({
        globals: {
          arr: [1, 2, 3],
        },
      });
      expect(() => {
        interpreter.evaluate("arr[0] = 10");
      }).toThrow("Cannot modify property '0' on global 'arr'");
    });

    it("should work with boolean globals", () => {
      const interpreter = new Interpreter({
        globals: {
          isDebug: true,
          isProduction: false,
        },
      });
      expect(interpreter.evaluate("isDebug")).toBe(true);
      expect(interpreter.evaluate("isProduction")).toBe(false);
      expect(interpreter.evaluate("isDebug && !isProduction")).toBe(true);
    });

    it("should work with string globals", () => {
      const interpreter = new Interpreter({
        globals: {
          greeting: "Hello",
          name: "World",
        },
      });
      expect(interpreter.evaluate("greeting + ' ' + name")).toBe("Hello World");
    });

    it("should work without any globals", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("5 + 3")).toBe(8);
    });

    it("should work with empty globals object", () => {
      const interpreter = new Interpreter({});
      expect(interpreter.evaluate("10 * 2")).toBe(20);
    });
  });

  describe("evaluate() options globals", () => {
    it("should access per-call globals", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("a + b", { globals: { a: 5, b: 3 } })).toBe(
        8,
      );
    });

    it("should access single per-call global", () => {
      const interpreter = new Interpreter();
      expect(interpreter.evaluate("value * 2", { globals: { value: 7 } })).toBe(
        14,
      );
    });

    it("should use per-call globals in complex expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("(a + b) * c", {
        globals: { a: 2, b: 3, c: 4 },
      });
      expect(result).toBe(20);
    });

    it("should support object per-call globals", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("data.x + data.y", {
        globals: { data: { x: 10, y: 20 } },
      });
      expect(result).toBe(30);
    });

    it("should support array per-call globals", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate("nums[0] + nums[1]", {
        globals: { nums: [100, 200] },
      });
      expect(result).toBe(300);
    });
  });

  describe("Merge behavior", () => {
    it("should merge constructor and evaluate() globals", () => {
      const interpreter = new Interpreter({ globals: { x: 10 } });
      expect(interpreter.evaluate("x + y", { globals: { y: 5 } })).toBe(15);
    });

    it("should allow evaluate() globals to override constructor globals", () => {
      const interpreter = new Interpreter({ globals: { x: 10 } });
      expect(interpreter.evaluate("x", { globals: { x: 20 } })).toBe(20);
    });

    it("should restore constructor globals after per-call override", () => {
      const interpreter = new Interpreter({ globals: { x: 10 } });
      const duringOverride = interpreter.evaluate("x", { globals: { x: 20 } });
      expect(duringOverride).toBe(20);
      // After the override, x should be restored to constructor value (10)
      expect(interpreter.evaluate("x")).toBe(10);
    });

    it("should merge multiple globals from both sources", () => {
      const interpreter = new Interpreter({ globals: { a: 1, b: 2 } });
      const result = interpreter.evaluate("a + b + c + d", {
        globals: { c: 3, d: 4 },
      });
      expect(result).toBe(10);
    });

    it("should handle complex merge scenarios", () => {
      const interpreter = new Interpreter({
        globals: {
          x: 10,
          config: { debug: true },
        },
      });
      const code = `
        let bonus = 0;
        if (config.debug) {
          bonus = 1;
        }
        x + y + bonus
      `;
      const result = interpreter.evaluate(code, { globals: { y: 5 } });
      expect(result).toBe(16);
    });
  });

  describe("Stateful behavior", () => {
    it("should persist globals across calls", () => {
      const interpreter = new Interpreter({ globals: { x: 10 } });
      interpreter.evaluate("let y = x + 5");
      expect(interpreter.evaluate("y")).toBe(15);
    });

    it("should persist constructor globals across multiple calls", () => {
      const interpreter = new Interpreter({ globals: { PI: 3.14159 } });
      expect(interpreter.evaluate("PI * 2")).toBeCloseTo(6.28318, 4);
      expect(interpreter.evaluate("PI * 10")).toBeCloseTo(31.4159, 4);
      expect(interpreter.evaluate("PI")).toBeCloseTo(3.14159, 4);
    });

    it("should NOT persist per-call globals after execution", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let a = x", { globals: { x: 100 } });
      // x should NOT be accessible in the next call (per-call globals are cleaned up)
      expect(() => interpreter.evaluate("x")).toThrow("Undefined variable 'x'");
      // But the user variable 'a' should still exist with the captured value
      expect(interpreter.evaluate("a")).toBe(100);
    });

    it("should not overwrite user-declared variables with late globals", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate("let x = 100");
      // This evaluate() call's globals should NOT overwrite the user's x
      expect(interpreter.evaluate("x", { globals: { x: 200 } })).toBe(100);
    });

    it("should not overwrite user variables even with constructor globals", () => {
      const interpreter = new Interpreter({ globals: { y: 50 } });
      interpreter.evaluate("let x = 100");
      // New globals in evaluate() shouldn't overwrite x
      expect(interpreter.evaluate("x + y", { globals: { x: 999 } })).toBe(150);
    });

    it("should allow using globals with user-declared variables", () => {
      const interpreter = new Interpreter({ globals: { base: 10 } });
      interpreter.evaluate("let multiplier = 5");
      expect(interpreter.evaluate("base * multiplier")).toBe(50);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined global values", () => {
      const interpreter = new Interpreter({ globals: { x: undefined } });
      expect(interpreter.evaluate("x")).toBe(undefined);
    });

    it("should handle null global values", () => {
      const interpreter = new Interpreter({ globals: { x: null } });
      expect(interpreter.evaluate("x")).toBe(null);
    });

    it("should handle zero global values", () => {
      const interpreter = new Interpreter({ globals: { x: 0 } });
      expect(interpreter.evaluate("x")).toBe(0);
      expect(interpreter.evaluate("x + 5")).toBe(5);
    });

    it("should handle empty string global values", () => {
      const interpreter = new Interpreter({ globals: { x: "" } });
      expect(interpreter.evaluate("x")).toBe("");
      expect(interpreter.evaluate("x + 'test'")).toBe("test");
    });

    it("should handle false boolean global values", () => {
      const interpreter = new Interpreter({ globals: { x: false } });
      expect(interpreter.evaluate("x")).toBe(false);
      expect(interpreter.evaluate("!x")).toBe(true);
    });

    it("should handle negative number globals", () => {
      const interpreter = new Interpreter({ globals: { x: -10, y: -5 } });
      expect(interpreter.evaluate("x + y")).toBe(-15);
      expect(interpreter.evaluate("x * y")).toBe(50);
    });

    it("should handle floating point globals", () => {
      const interpreter = new Interpreter({
        globals: { pi: 3.14159, e: 2.71828 },
      });
      expect(interpreter.evaluate("pi + e")).toBeCloseTo(5.85987, 4);
    });

    it("should handle globals with special characters in strings", () => {
      const interpreter = new Interpreter({
        globals: {
          message: "Hello\nWorld\t!",
        },
      });
      expect(interpreter.evaluate("message")).toBe("Hello\nWorld\t!");
    });

    it("should handle large objects as globals", () => {
      const interpreter = new Interpreter({
        globals: {
          data: {
            a: 1,
            b: 2,
            c: 3,
            nested: { x: 10, y: 20, z: 30 },
            arr: [1, 2, 3, 4, 5],
          },
        },
      });
      expect(interpreter.evaluate("data.a + data.nested.x")).toBe(11);
      expect(interpreter.evaluate("data.arr[2]")).toBe(3);
    });

    it("should handle globals used in functions", () => {
      const interpreter = new Interpreter({ globals: { multiplier: 3 } });
      const code = `
        function multiply(x) {
          return x * multiplier;
        }
        multiply(10)
      `;
      expect(interpreter.evaluate(code)).toBe(30);
    });

    it("should handle globals used in closures", () => {
      const interpreter = new Interpreter({ globals: { base: 100 } });
      const code = `
        function makeAdder(x) {
          return function(y) {
            return base + x + y;
          };
        }
        let add10 = makeAdder(10);
        add10(5)
      `;
      expect(interpreter.evaluate(code)).toBe(115);
    });

    it("should handle globals in loops", () => {
      const interpreter = new Interpreter({ globals: { max: 5 } });
      const code = `
        let sum = 0;
        for (let i = 0; i < max; i++) {
          sum = sum + i;
        }
        sum
      `;
      expect(interpreter.evaluate(code)).toBe(10); // 0+1+2+3+4
    });

    it("should handle globals in conditionals", () => {
      const interpreter = new Interpreter({ globals: { threshold: 10 } });
      const code = `
        let value = 15;
        if (value > threshold) {
          value = threshold;
        }
        value
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should handle empty options object", () => {
      const interpreter = new Interpreter({ globals: { x: 5 } });
      expect(interpreter.evaluate("x + 3", {})).toBe(8);
    });

    it("should handle options with undefined globals", () => {
      const interpreter = new Interpreter({ globals: { x: 5 } });
      expect(interpreter.evaluate("x + 3", { globals: undefined })).toBe(8);
    });

    it("should handle options with empty globals object", () => {
      const interpreter = new Interpreter({ globals: { x: 5 } });
      expect(interpreter.evaluate("x + 3", { globals: {} })).toBe(8);
    });
  });

  describe("Practical use cases", () => {
    it("should work for mathematical constants", () => {
      const interpreter = new Interpreter({
        globals: {
          PI: 3.14159,
          E: 2.71828,
          GOLDEN_RATIO: 1.61803,
        },
      });
      const circleArea = interpreter.evaluate(`
        let radius = 10;
        PI * radius * radius
      `);
      expect(circleArea).toBeCloseTo(314.159, 2);
    });

    it("should work for configuration objects", () => {
      const interpreter = new Interpreter({
        globals: {
          config: {
            maxIterations: 1000,
            tolerance: 0.001,
            debug: false,
          },
        },
      });
      const result = interpreter.evaluate(`
        let iterations = 0;
        let value = 1;
        while (iterations < config.maxIterations && value > config.tolerance) {
          value = value / 2;
          iterations = iterations + 1;
        }
        iterations
      `);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1000);
    });

    it("should work for data processing", () => {
      const interpreter = new Interpreter({
        globals: {
          data: [10, 20, 30, 40, 50],
          threshold: 25,
        },
      });
      const result = interpreter.evaluate(`
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > threshold) {
            count = count + 1;
          }
        }
        count
      `);
      expect(result).toBe(3); // 30, 40, 50 are > 25
    });

    it("should work for accumulating values", () => {
      const interpreter = new Interpreter({
        globals: {
          prices: [10.99, 25.5, 15.75, 30.0],
          taxRate: 0.08,
        },
      });
      const result = interpreter.evaluate(`
        let total = 0;
        for (let i = 0; i < prices.length; i++) {
          total = total + prices[i];
        }
        total * (1 + taxRate)
      `);
      expect(result).toBeCloseTo(88.8192, 1);
    });

    it("should work for templating with string globals", () => {
      const interpreter = new Interpreter({
        globals: {
          firstName: "John",
          lastName: "Doe",
          separator: " ",
        },
      });
      const result = interpreter.evaluate("firstName + separator + lastName");
      expect(result).toBe("John Doe");
    });
  });
});
