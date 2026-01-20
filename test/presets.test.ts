import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import {
  ES5,
  ES6,
  ES2015,
  ES2016,
  ES2017,
  ES2018,
  ES2019,
  ES2020,
  ES2021,
  ES2022,
  ES2023,
  ES2024,
  ESNext,
  getPreset,
  PRESET_NAMES,
} from "../src/presets";

describe("ECMAScript Presets", () => {
  describe("ES5", () => {
    test("allows ES5 features", () => {
      const interp = new Interpreter(ES5);

      // Function declarations
      const result1 = interp.evaluate(`
        function add(a, b) {
          return a + b;
        }
        add(2, 3);
      `);
      expect(result1).toBe(5);

      // For loops with var
      const result2 = interp.evaluate(`
        var sum = 0;
        for (var i = 0; i < 5; i++) {
          sum = sum + i;
        }
        sum;
      `);
      expect(result2).toBe(10);

      // Objects and arrays
      const result3 = interp.evaluate(`
        var obj = { x: 10, y: 20 };
        var arr = [1, 2, 3];
        obj.x + arr[1];
      `);
      expect(result3).toBe(12);
    });

    test("blocks ES6+ features", () => {
      const interp = new Interpreter(ES5);

      // let/const blocked (ES5 only has var)
      expect(() => {
        interp.evaluate("let x = 5;");
      }).toThrow("LetConst is not enabled");

      expect(() => {
        interp.evaluate("const x = 5;");
      }).toThrow("LetConst is not enabled");

      // Arrow functions blocked
      expect(() => {
        interp.evaluate("var add = (a, b) => a + b;");
      }).toThrow("ArrowFunctions is not enabled");

      // Template literals blocked
      expect(() => {
        interp.evaluate("var msg = `Hello`;");
      }).toThrow("TemplateLiterals is not enabled");

      // For-of blocked
      expect(() => {
        interp.evaluate("for (var x of [1, 2, 3]) {}");
      }).toThrow("ForOfStatement is not enabled");

      // Destructuring blocked
      expect(() => {
        interp.evaluate("var a, b; [a, b] = [1, 2];");
      }).toThrow("Destructuring is not enabled");
    });

    test("includes ES5 globals", () => {
      const interp = new Interpreter(ES5);

      expect(interp.evaluate("Array")).toBeDefined();
      expect(interp.evaluate("Object")).toBeDefined();
      expect(interp.evaluate("Math")).toBeDefined();
      expect(interp.evaluate("JSON")).toBeDefined();
      expect(interp.evaluate("parseInt('42')")).toBe(42);
      expect(interp.evaluate("Math.PI > 3")).toBe(true);
    });

    test("excludes ES6+ globals", () => {
      const interp = new Interpreter(ES5);

      // Promise not available
      expect(() => {
        interp.evaluate("Promise");
      }).toThrow("Undefined variable");

      // Symbol not available
      expect(() => {
        interp.evaluate("Symbol");
      }).toThrow("Undefined variable");

      // Map not available
      expect(() => {
        interp.evaluate("Map");
      }).toThrow("Undefined variable");
    });
  });

  describe("ES2015 / ES6", () => {
    test("ES6 is alias for ES2015", () => {
      expect(ES6).toBe(ES2015);
    });

    test("allows ES6 features", () => {
      const interp = new Interpreter(ES2015);

      // Arrow functions
      const result1 = interp.evaluate(`
        const double = x => x * 2;
        double(5);
      `);
      expect(result1).toBe(10);

      // Template literals
      const result2 = interp.evaluate(`
        const name = "World";
        const msg = \`Hello \${name}!\`;
        msg;
      `);
      expect(result2).toBe("Hello World!");

      // For-of
      const result3 = interp.evaluate(`
        const numbers = [1, 2, 3];
        let total = 0;
        for (const x of numbers) {
          total = total + x;
        }
        total;
      `);
      expect(result3).toBe(6);

      // Destructuring
      const result4 = interp.evaluate(`
        const [a, b] = [10, 20];
        a + b;
      `);
      expect(result4).toBe(30);

      // Spread operator
      const result5 = interp.evaluate(`
        const arr1 = [1, 2];
        const arr2 = [...arr1, 3, 4];
        arr2;
      `);
      expect(result5).toEqual([1, 2, 3, 4]);

      // Rest parameters
      const result6 = interp.evaluate(`
        const sumAll = (...nums) => {
          let result = 0;
          for (const n of nums) {
            result = result + n;
          }
          return result;
        };
        sumAll(1, 2, 3, 4);
      `);
      expect(result6).toBe(10);
    });

    test("includes ES6 globals", () => {
      const interp = new Interpreter(ES2015);

      // ES5 globals still available
      expect(interp.evaluate("Math")).toBeDefined();

      // ES6 globals now available
      expect(interp.evaluate("Promise")).toBeDefined();
      expect(interp.evaluate("Symbol")).toBeDefined();
      expect(interp.evaluate("Map")).toBeDefined();
      expect(interp.evaluate("Set")).toBeDefined();
    });

    test("blocks async/await (ES2017)", () => {
      const interp = new Interpreter(ES2015);

      expect(() => {
        interp.evaluate("async function foo() {}");
      }).toThrow("AsyncAwait is not enabled");
    });
  });

  describe("ES2016", () => {
    test("includes all ES2015 features", () => {
      const interp = new Interpreter(ES2016);

      // Arrow functions work
      expect(interp.evaluate("const double = x => x * 2; double(5);")).toBe(10);

      // Template literals work
      expect(interp.evaluate("`Hello ${'World'}`")).toBe("Hello World");
    });

    test("supports exponentiation operator", () => {
      const interp = new Interpreter(ES2016);

      expect(interp.evaluate("2 ** 3")).toBe(8);
      expect(interp.evaluate("5 ** 2")).toBe(25);
    });
  });

  describe("ES2017", () => {
    test("allows async/await", async () => {
      const interp = new Interpreter(ES2017);

      // Async function declaration
      await expect(
        interp.evaluateAsync(`
          async function getData() {
            return 42;
          }
          getData();
        `),
      ).resolves.toBe(42);

      // Async arrow function
      await expect(
        interp.evaluateAsync(`
          const asyncDouble = async (x) => x * 2;
          asyncDouble(21);
        `),
      ).resolves.toBe(42);

      // Await expression with async function
      const interp2 = new Interpreter({
        ...ES2017,
        globals: {
          ...ES2017.globals,
          asyncGetValue: async () => 10,
        },
      });
      const result3 = await interp2.evaluateAsync(`
        async function process() {
          const val = await asyncGetValue();
          return val * 2;
        }
        process();
      `);
      expect(result3).toBe(20);
    });

    test("includes all ES2016 features", () => {
      const interp = new Interpreter(ES2017);

      expect(interp.evaluate("const add = (a, b) => a + b; add(2, 3);")).toBe(5);
      expect(interp.evaluate("2 ** 10")).toBe(1024);
    });
  });

  describe("ES2018", () => {
    test("includes all ES2017 features", async () => {
      const interp = new Interpreter(ES2018);

      // Async/await works
      await expect(interp.evaluateAsync("async () => 42")).resolves.toBeDefined();

      // Rest/spread works
      expect(interp.evaluate("const arr = [1, ...[2, 3]]; arr;")).toEqual([1, 2, 3]);
    });

    test("supports object spread", () => {
      const interp = new Interpreter(ES2018);

      const result = interp.evaluate(`
        const obj1 = { x: 1, y: 2 };
        const obj2 = { ...obj1, z: 3 };
        obj2;
      `);
      expect(result).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe("ES2019-ES2024", () => {
    test("ES2019 includes all ES2018 features", () => {
      const interp = new Interpreter(ES2019);
      expect(interp.evaluate("const x = (a, b) => a + b; x(1, 2);")).toBe(3);
    });

    test("ES2020 includes BigInt global", () => {
      const interp = new Interpreter(ES2020);
      expect(interp.evaluate("BigInt")).toBeDefined();
      expect(interp.evaluate("typeof BigInt")).toBe("function");
    });

    test("ES2020 includes globalThis", () => {
      const interp = new Interpreter(ES2020);
      expect(interp.evaluate("globalThis")).toBeDefined();
    });

    test("ES2021 includes WeakRef if available", () => {
      const interp = new Interpreter(ES2021);
      if (typeof WeakRef !== "undefined") {
        expect(interp.evaluate("WeakRef")).toBeDefined();
      }
    });

    test("ES2022 includes all previous features", () => {
      const interp = new Interpreter(ES2022);
      expect(interp.evaluate("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    test("ES2023 includes all previous features", () => {
      const interp = new Interpreter(ES2023);
      expect(interp.evaluate("const arr = [1, 2]; arr;")).toEqual([1, 2]);
    });

    test("ES2024 includes all previous features", () => {
      const interp = new Interpreter(ES2024);
      expect(interp.evaluate("1 + 2")).toBe(3);
    });
  });

  describe("ESNext", () => {
    test("allows all features", () => {
      const interp = new Interpreter(ESNext);

      // Everything should work
      expect(interp.evaluate("const x = 10; x;")).toBe(10);
      expect(interp.evaluate("const add = (a, b) => a + b; add(2, 3);")).toBe(5);
      expect(interp.evaluate("`Hello ${'World'}`")).toBe("Hello World");
      expect(interp.evaluate("const [a] = [42]; a;")).toBe(42);
    });

    test("has no feature restrictions", () => {
      const interp = new Interpreter(ESNext);

      // No feature control means everything is enabled
      expect(interp.evaluate("for (let i = 0; i < 1; i++) {}")).toBeUndefined();
      expect(interp.evaluate("for (const x of [1]) {}")).toBeUndefined();
    });
  });

  describe("getPreset", () => {
    test("returns correct preset by name", () => {
      expect(getPreset("ES5")).toBe(ES5);
      expect(getPreset("ES6")).toBe(ES6);
      expect(getPreset("ES2015")).toBe(ES2015);
      expect(getPreset("ES2017")).toBe(ES2017);
      expect(getPreset("ES2020")).toBe(ES2020);
      expect(getPreset("ESNext")).toBe(ESNext);
    });

    test("all preset names are valid", () => {
      for (const name of PRESET_NAMES) {
        expect(() => getPreset(name)).not.toThrow();
        expect(getPreset(name)).toBeDefined();
      }
    });
  });

  describe("Real-world scenarios", () => {
    test("ES5: Classic JavaScript patterns", () => {
      const interp = new Interpreter(ES5);

      const result = interp.evaluate(`
        function createCounter() {
          var count = 0;
          return {
            increment: function() {
              count = count + 1;
              return count;
            },
            decrement: function() {
              count = count - 1;
              return count;
            },
            getCount: function() {
              return count;
            }
          };
        }
        var counter = createCounter();
        counter.increment();
        counter.increment();
        counter.decrement();
        counter.getCount();
      `);
      expect(result).toBe(1);
    });

    test("ES2015: Modern functional programming", () => {
      const interp = new Interpreter(ES2015);

      const result = interp.evaluate(`
        const map = (arr, fn) => {
          const result = [];
          for (const item of arr) {
            result[result.length] = fn(item);
          }
          return result;
        };

        const filter = (arr, pred) => {
          const result = [];
          for (const item of arr) {
            if (pred(item)) {
              result[result.length] = item;
            }
          }
          return result;
        };

        const nums = [1, 2, 3, 4, 5];
        const doubled = map(nums, x => x * 2);
        const evens = filter(doubled, x => x % 4 === 0);
        evens;
      `);
      expect(result).toEqual([4, 8]);
    });

    test("ES2017: Async data processing", async () => {
      const interp = new Interpreter({
        ...ES2017,
        globals: {
          ...ES2017.globals,
          fetchUser: async (id: number) => ({ id, name: `User${id}` }),
        },
      });

      const result = await interp.evaluateAsync(`
        async function getUserName(id) {
          const user = await fetchUser(id);
          return user.name;
        }
        getUserName(42);
      `);
      expect(result).toBe("User42");
    });

    test("Mixing preset with custom globals", () => {
      const interp = new Interpreter({
        ...ES2015,
        globals: {
          ...ES2015.globals,
          customAPI: {
            version: "1.0.0",
            getValue: () => 42,
          },
        },
      });

      const result = interp.evaluate(`
        const processValue = () => customAPI.getValue() * 2;
        processValue();
      `);
      expect(result).toBe(84);
    });

    test("Upgrading from ES5 to ES2015", () => {
      // Start with ES5 code
      const es5Interp = new Interpreter(ES5);
      const es5Result = es5Interp.evaluate(`
        function double(x) {
          return x * 2;
        }
        double(5);
      `);
      expect(es5Result).toBe(10);

      // Same logic with ES2015
      const es2015Interp = new Interpreter(ES2015);
      const es2015Result = es2015Interp.evaluate(`
        const double = x => x * 2;
        double(5);
      `);
      expect(es2015Result).toBe(10);
    });
  });

  describe("Feature inheritance", () => {
    test("ES2015 is superset of ES5", () => {
      const es5Features = ES5.featureControl!.features as string[];
      const es2015Features = ES2015.featureControl!.features as string[];

      for (const feature of es5Features) {
        expect(es2015Features).toContain(feature);
      }
    });

    test("ES2017 is superset of ES2016", () => {
      const es2016Features = ES2016.featureControl!.features as string[];
      const es2017Features = ES2017.featureControl!.features as string[];

      for (const feature of es2016Features) {
        expect(es2017Features).toContain(feature);
      }
    });

    test("later versions include AsyncAwait", () => {
      const es2017Features = ES2017.featureControl!.features as string[];
      const es2018Features = ES2018.featureControl!.features as string[];
      const es2020Features = ES2020.featureControl!.features as string[];

      expect(es2017Features).toContain("AsyncAwait");
      expect(es2018Features).toContain("AsyncAwait");
      expect(es2020Features).toContain("AsyncAwait");
    });
  });
});
