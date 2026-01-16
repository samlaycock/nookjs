import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("Global Objects (via ReadOnlyProxy)", () => {
  describe("Math object", () => {
    describe("Basic math methods", () => {
      it("should use Math.floor", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.floor(4.7)");
        expect(result).toBe(4);
      });

      it("should use Math.ceil", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.ceil(4.3)");
        expect(result).toBe(5);
      });

      it("should use Math.round", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.round(4.5)");
        expect(result).toBe(5);
      });

      it("should use Math.abs", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.abs(-42)");
        expect(result).toBe(42);
      });

      it("should use Math.sqrt", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.sqrt(16)");
        expect(result).toBe(4);
      });

      it("should use Math.pow", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.pow(2, 8)");
        expect(result).toBe(256);
      });

      it("should use Math.max", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.max(10, 20, 5, 15)");
        expect(result).toBe(20);
      });

      it("should use Math.min", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.min(10, 20, 5, 15)");
        expect(result).toBe(5);
      });
    });

    describe("Math constants", () => {
      it("should access Math.PI", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.PI");
        expect(result).toBe(Math.PI);
      });

      it("should access Math.E", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.E");
        expect(result).toBe(Math.E);
      });

      it("should use Math.PI in calculations", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate(`
          let radius = 10;
          Math.PI * radius * radius
        `);
        expect(result).toBeCloseTo(314.159, 2);
      });
    });

    describe("Math.random", () => {
      it("should call Math.random", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.random()");
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });

      it("should get different random values", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result1 = interpreter.evaluate("Math.random()");
        const result2 = interpreter.evaluate("Math.random()");
        // Extremely unlikely to be equal
        expect(result1).not.toBe(result2);
      });
    });

    describe("Trigonometric functions", () => {
      it("should use Math.sin", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.sin(0)");
        expect(result).toBe(0);
      });

      it("should use Math.cos", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.cos(0)");
        expect(result).toBe(1);
      });

      it("should use Math.tan", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate("Math.tan(0)");
        expect(result).toBe(0);
      });
    });

    describe("Math in expressions", () => {
      it("should use Math methods in complex expressions", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate(`
          let x = 4.7;
          let y = 3.2;
          Math.floor(x) + Math.ceil(y)
        `);
        expect(result).toBe(8); // 4 + 4
      });

      it("should use Math in functions", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate(`
          function circleArea(radius) {
            return Math.PI * Math.pow(radius, 2);
          }
          circleArea(5)
        `);
        expect(result).toBeCloseTo(78.539, 2);
      });

      it("should use Math in loops", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        const result = interpreter.evaluate(`
          let values = [1.2, 2.7, 3.1, 4.9];
          let sum = 0;
          for (let i = 0; i < values.length; i++) {
            sum = sum + Math.floor(values[i]);
          }
          sum
        `);
        expect(result).toBe(10); // 1 + 2 + 3 + 4
      });
    });

    describe("Security - Math object protection", () => {
      it("should block modification of Math properties", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        expect(() => {
          interpreter.evaluate("Math.PI = 3");
        }).toThrow("Cannot modify property 'PI' on global 'Math'");
      });

      it("should block deletion of Math properties", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        expect(() => {
          interpreter.evaluate("delete Math.floor");
        }).toThrow("Unsupported unary operator: delete");
      });

      it("should block access to __proto__", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        expect(() => {
          interpreter.evaluate("Math.__proto__");
        }).toThrow(
          "Property name '__proto__' is not allowed for security reasons",
        );
      });

      it("should block access to constructor", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        expect(() => {
          interpreter.evaluate("Math.constructor");
        }).toThrow(
          "Property name 'constructor' is not allowed for security reasons",
        );
      });

      it("should block access to prototype", () => {
        const interpreter = new Interpreter({ globals: { Math } });
        expect(() => {
          interpreter.evaluate("Math.prototype");
        }).toThrow(
          "Property name 'prototype' is not allowed for security reasons",
        );
      });
    });
  });

  describe("console object", () => {
    describe("console.log", () => {
      it("should call console.log", () => {
        let logged: any[] = [];
        const mockConsole = {
          log: (...args: any[]) => {
            logged.push(args);
          },
        };

        const interpreter = new Interpreter({
          globals: { console: mockConsole },
        });
        interpreter.evaluate('console.log("Hello", "World")');

        expect(logged).toEqual([["Hello", "World"]]);
      });

      it("should log numbers", () => {
        let logged: any[] = [];
        const mockConsole = {
          log: (...args: any[]) => {
            logged.push(args);
          },
        };

        const interpreter = new Interpreter({
          globals: { console: mockConsole },
        });
        interpreter.evaluate("console.log(42, 100)");

        expect(logged).toEqual([[42, 100]]);
      });

      it("should work in loops", () => {
        let logged: any[] = [];
        const mockConsole = {
          log: (...args: any[]) => {
            logged.push(args);
          },
        };

        const interpreter = new Interpreter({
          globals: { console: mockConsole },
        });
        interpreter.evaluate(`
          for (let i = 0; i < 3; i++) {
            console.log(i);
          }
        `);

        expect(logged).toEqual([[0], [1], [2]]);
      });
    });

    describe("Security - console object protection", () => {
      it("should block modification of non-writable console properties", () => {
        // Create a console-like object with non-writable properties
        const protectedConsole = Object.create(null);
        Object.defineProperty(protectedConsole, "log", {
          value: () => {},
          writable: false,
          enumerable: true,
          configurable: false,
        });

        const interpreter = new Interpreter({
          globals: { console: protectedConsole },
        });
        expect(() => {
          interpreter.evaluate("console.log = null");
        }).toThrow("Cannot modify property 'log' on global 'console'");
      });

      it("should block access to __proto__", () => {
        const interpreter = new Interpreter({ globals: { console } });
        expect(() => {
          interpreter.evaluate("console.__proto__");
        }).toThrow(
          "Property name '__proto__' is not allowed for security reasons",
        );
      });
    });
  });

  describe("Custom global objects", () => {
    it("should work with custom objects", () => {
      const myAPI = {
        add: (a: number, b: number) => a + b,
        multiply: (a: number, b: number) => a * b,
      };

      const interpreter = new Interpreter({ globals: { myAPI } });
      const result = interpreter.evaluate("myAPI.add(10, 20)");
      expect(result).toBe(30);
    });

    it("should work with nested custom objects", () => {
      const config = {
        server: {
          port: 3000,
          host: "localhost",
        },
        database: {
          name: "mydb",
          timeout: 5000,
        },
      };

      const interpreter = new Interpreter({ globals: { config } });
      const result = interpreter.evaluate("config.server.port");
      expect(result).toBe(3000);
    });

    it("should recursively protect nested properties (read-only)", () => {
      const config = {
        level1: {
          level2: {
            level3: {
              value: 42,
            },
          },
        },
      };

      const interpreter = new Interpreter({ globals: { config } });

      // Can read deeply nested properties
      expect(interpreter.evaluate("config.level1.level2.level3.value")).toBe(
        42,
      );

      // Cannot modify deeply nested properties
      expect(() => {
        interpreter.evaluate("config.level1.level2.level3.value = 100");
      }).toThrow(
        "Cannot modify property 'value' on global 'config.level1.level2.level3'",
      );

      // Cannot add properties at intermediate levels
      expect(() => {
        interpreter.evaluate("config.level1.newProp = 'test'");
      }).toThrow("Cannot modify property 'newProp' on global 'config.level1'");
    });

    it("should block modifying properties of custom objects (read-only)", () => {
      const myAPI = {
        value: 100,
      };

      const interpreter = new Interpreter({ globals: { myAPI } });
      // All globals are strictly read-only, regardless of internal descriptors
      expect(() => {
        interpreter.evaluate("myAPI.value = 200");
      }).toThrow("Cannot modify property 'value' on global 'myAPI'");
    });

    it("should work with arrays as globals", () => {
      const data = [10, 20, 30, 40];

      const interpreter = new Interpreter({ globals: { data } });
      const result = interpreter.evaluate("data[2]");
      expect(result).toBe(30);
    });

    it("should block modifying array elements (read-only)", () => {
      const data = [10, 20, 30];

      const interpreter = new Interpreter({ globals: { data } });
      // All globals are strictly read-only, including array elements
      expect(() => {
        interpreter.evaluate("data[0] = 999");
      }).toThrow("Cannot modify property '0' on global 'data'");
    });
  });

  describe("Multiple globals", () => {
    it("should support multiple global objects simultaneously", () => {
      const interpreter = new Interpreter({
        globals: {
          Math,
          console: { log: () => {} },
        },
      });

      const result = interpreter.evaluate(`
        console.log("Testing");
        Math.floor(4.7)
      `);
      expect(result).toBe(4);
    });

    it("should work with mix of primitives and objects", () => {
      const interpreter = new Interpreter({
        globals: {
          VERSION: "1.0.0",
          MAX_SIZE: 1000,
          Math,
          config: { debug: true },
        },
      });

      const result = interpreter.evaluate(`
        let size = Math.min(MAX_SIZE, 500);
        size
      `);
      expect(result).toBe(500);
    });
  });

  describe("Async support", () => {
    it("should work with async evaluation", async () => {
      const interpreter = new Interpreter({ globals: { Math } });
      const result = await interpreter.evaluateAsync("Math.floor(4.7)");
      expect(result).toBe(4);
    });

    it("should work with async host functions in globals", async () => {
      const api = {
        fetchData: async (id: number) => `Data${id}`,
      };

      const interpreter = new Interpreter({ globals: { api, Math } });
      const result = await interpreter.evaluateAsync(`
        let id = Math.floor(4.7);
        api.fetchData(id)
      `);
      expect(result).toBe("Data4");
    });
  });

  describe("Edge cases", () => {
    it("should handle null in globals", () => {
      const interpreter = new Interpreter({
        globals: { nullValue: null },
      });
      const result = interpreter.evaluate("nullValue");
      expect(result).toBe(null);
    });

    it("should handle undefined in globals", () => {
      const interpreter = new Interpreter({
        globals: { undefinedValue: undefined },
      });
      const result = interpreter.evaluate("undefinedValue");
      expect(result).toBe(undefined);
    });

    it("should handle booleans in globals", () => {
      const interpreter = new Interpreter({
        globals: { isProduction: true },
      });
      const result = interpreter.evaluate("isProduction");
      expect(result).toBe(true);
    });

    it("should handle strings in globals", () => {
      const interpreter = new Interpreter({
        globals: { API_URL: "https://api.example.com" },
      });
      const result = interpreter.evaluate("API_URL");
      expect(result).toBe("https://api.example.com");
    });

    it("should handle numbers in globals", () => {
      const interpreter = new Interpreter({
        globals: { MAX_RETRIES: 3 },
      });
      const result = interpreter.evaluate("MAX_RETRIES");
      expect(result).toBe(3);
    });
  });
});
