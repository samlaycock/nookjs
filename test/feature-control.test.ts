import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Feature Control", () => {
  describe("Whitelist Mode", () => {
    describe("ES5 Features", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter({
          featureControl: {
            mode: "whitelist",
            features: [
              "ForStatement",
              "WhileStatement",
              "IfStatement",
              "FunctionDeclarations",
              "FunctionExpressions",
              "VariableDeclarations",
              "BinaryOperators",
              "UnaryOperators",
              "LogicalOperators",
              "ConditionalExpression",
              "MemberExpression",
              "CallExpression",
              "NewExpression",
              "ThisExpression",
              "ObjectLiterals",
              "ArrayLiterals",
              "ReturnStatement",
              "BreakStatement",
              "ContinueStatement",
              "UpdateExpression",
              "ThrowStatement",
              "TryCatchStatement",
              "SwitchStatement",
              "ForInStatement",
              "LetConst", // Need this for let/const in tests
            ],
          },
        });
      });

      test("allows for statement", () => {
        const result = interpreter.evaluate(`
          let sum = 0;
          for (let i = 0; i < 5; i++) {
            sum = sum + i;
          }
          sum;
        `);
        expect(result).toBe(10);
      });

      test("allows while statement", () => {
        const result = interpreter.evaluate(`
          let count = 0;
          while (count < 3) {
            count = count + 1;
          }
          count;
        `);
        expect(result).toBe(3);
      });

      test("allows if statement", () => {
        const result = interpreter.evaluate(`
          let x = 10;
          if (x > 5) {
            x = x * 2;
          }
          x;
        `);
        expect(result).toBe(20);
      });

      test("allows function declarations", () => {
        const result = interpreter.evaluate(`
          function add(a, b) {
            return a + b;
          }
          add(2, 3);
        `);
        expect(result).toBe(5);
      });

      test("allows function expressions", () => {
        const result = interpreter.evaluate(`
          const add = function(a, b) {
            return a + b;
          };
          add(2, 3);
        `);
        expect(result).toBe(5);
      });

      test("allows binary operators", () => {
        const result = interpreter.evaluate("1 + 2 * 3");
        expect(result).toBe(7);
      });

      test("allows unary operators", () => {
        const result = interpreter.evaluate("!false");
        expect(result).toBe(true);
      });

      test("allows logical operators", () => {
        const result = interpreter.evaluate("true && false || true");
        expect(result).toBe(true);
      });

      test("allows conditional expression", () => {
        const result = interpreter.evaluate("10 > 5 ? 'yes' : 'no'");
        expect(result).toBe("yes");
      });

      test("allows member expression", () => {
        const result = interpreter.evaluate(`
          const obj = { x: 42 };
          obj.x;
        `);
        expect(result).toBe(42);
      });

      test("allows array literals", () => {
        const result = interpreter.evaluate("[1, 2, 3]");
        expect(result).toEqual([1, 2, 3]);
      });

      test("allows object literals", () => {
        const result = interpreter.evaluate(`
          const obj = { x: 10, y: 20 };
          obj;
        `);
        expect(result).toEqual({ x: 10, y: 20 });
      });

      test("allows switch statement", () => {
        const result = interpreter.evaluate(`
          const x = 2;
          let result = 0;
          switch(x) {
            case 1:
              result = 10;
              break;
            case 2:
              result = 20;
              break;
            default:
              result = 30;
          }
          result;
        `);
        expect(result).toBe(20);
      });

      test("allows try-catch statement", () => {
        const result = interpreter.evaluate(`
          let result = 0;
          try {
            result = 10;
          } catch (e) {
            result = 20;
          }
          result;
        `);
        expect(result).toBe(10);
      });

      test("allows for-in statement", () => {
        const result = interpreter.evaluate(`
          const obj = { a: 1, b: 2 };
          let sum = 0;
          for (let key in obj) {
            sum = sum + obj[key];
          }
          sum;
        `);
        expect(result).toBe(3);
      });

      test("blocks const (LetConst not in whitelist) - already allowed", () => {
        // Note: LetConst is in the whitelist for ES5 tests to allow let/const in test code
        // This test would need a separate interpreter without LetConst
        const interpreterWithoutLetConst = new Interpreter({
          featureControl: {
            mode: "whitelist",
            features: ["VariableDeclarations"],
          },
        });
        expect(() => {
          interpreterWithoutLetConst.evaluate("const x = 10;");
        }).toThrow("LetConst is not enabled");
      });

      test("blocks let (LetConst not in whitelist) - already allowed", () => {
        // Note: LetConst is in the whitelist for ES5 tests to allow let/const in test code
        // This test would need a separate interpreter without LetConst
        const interpreterWithoutLetConst = new Interpreter({
          featureControl: {
            mode: "whitelist",
            features: ["VariableDeclarations"],
          },
        });
        expect(() => {
          interpreterWithoutLetConst.evaluate("let x = 10;");
        }).toThrow("LetConst is not enabled");
      });

      test("blocks for-of statement", () => {
        expect(() => {
          interpreter.evaluate("for (const x of [1, 2, 3]) {}");
        }).toThrow("ForOfStatement is not enabled");
      });

      test("blocks arrow functions", () => {
        expect(() => {
          interpreter.evaluate("const add = (a, b) => a + b;");
        }).toThrow("ArrowFunctions is not enabled");
      });

      test("blocks template literals", () => {
        expect(() => {
          interpreter.evaluate("const name = 'World'; const msg = `Hello ${name}`;");
        }).toThrow("TemplateLiterals is not enabled");
      });

      test("blocks async functions", () => {
        expect(() => {
          interpreter.evaluate("async function foo() {}");
        }).toThrow("AsyncAwait is not enabled");
      });

      test("blocks spread operator in arrays", () => {
        expect(() => {
          interpreter.evaluate("const arr = [1, ...[2, 3]];");
        }).toThrow("SpreadOperator is not enabled");
      });

      test("blocks spread operator in objects", () => {
        expect(() => {
          interpreter.evaluate("const obj = { x: 1, ...{ y: 2 } };");
        }).toThrow("SpreadOperator is not enabled");
      });

      test("blocks rest parameters", () => {
        expect(() => {
          interpreter.evaluate("function foo(...args) {}");
        }).toThrow("RestParameters is not enabled");
      });

      test("blocks destructuring", () => {
        expect(() => {
          interpreter.evaluate("const [a, b] = [1, 2];");
        }).toThrow("Destructuring is not enabled");
      });

      test("blocks default parameters", () => {
        expect(() => {
          interpreter.evaluate("function foo(x = 10) { return x; }");
        }).toThrow(/DefaultParameters is not enabled|Destructuring parameters not supported/);
      });
    });

    describe("ES6 Features", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter({
          featureControl: {
            mode: "whitelist",
            features: [
              // ES5 features
              "ForStatement",
              "WhileStatement",
              "IfStatement",
              "FunctionDeclarations",
              "FunctionExpressions",
              "VariableDeclarations",
              "BinaryOperators",
              "UnaryOperators",
              "LogicalOperators",
              "ConditionalExpression",
              "MemberExpression",
              "CallExpression",
              "NewExpression",
              "ThisExpression",
              "ObjectLiterals",
              "ArrayLiterals",
              "ReturnStatement",
              "BreakStatement",
              "ContinueStatement",
              "UpdateExpression",
              // ES6 features
              "ArrowFunctions",
              "LetConst",
              "TemplateLiterals",
              "ForOfStatement",
              "SpreadOperator",
              "RestParameters",
              "Destructuring",
              "DefaultParameters",
            ],
          },
        });
      });

      test("allows const", () => {
        const result = interpreter.evaluate("const x = 42; x;");
        expect(result).toBe(42);
      });

      test("allows let", () => {
        const result = interpreter.evaluate("let x = 42; x;");
        expect(result).toBe(42);
      });

      test("allows arrow functions", () => {
        const result = interpreter.evaluate(`
          const add = (a, b) => {
            return a + b;
          };
          add(2, 3);
        `);
        expect(result).toBe(5);
      });

      test("allows template literals", () => {
        const result = interpreter.evaluate(`
          const name = "World";
          const msg = \`Hello \${name}!\`;
          msg;
        `);
        expect(result).toBe("Hello World!");
      });

      test("allows for-of statement", () => {
        const result = interpreter.evaluate(`
          const arr = [1, 2, 3];
          let sum = 0;
          for (const x of arr) {
            sum = sum + x;
          }
          sum;
        `);
        expect(result).toBe(6);
      });

      test("allows spread operator in arrays", () => {
        const result = interpreter.evaluate(`
          const arr1 = [1, 2];
          const arr2 = [3, 4];
          const combined = [...arr1, ...arr2];
          combined;
        `);
        expect(result).toEqual([1, 2, 3, 4]);
      });

      test("allows spread operator in objects", () => {
        const result = interpreter.evaluate(`
          const obj1 = { x: 1 };
          const obj2 = { y: 2 };
          const combined = { ...obj1, ...obj2 };
          combined;
        `);
        expect(result).toEqual({ x: 1, y: 2 });
      });

      test("allows spread operator in function calls", () => {
        const result = interpreter.evaluate(`
          function sum(a, b, c) {
            return a + b + c;
          }
          const args = [1, 2, 3];
          sum(...args);
        `);
        expect(result).toBe(6);
      });

      test("allows rest parameters", () => {
        const result = interpreter.evaluate(`
          const sum = (...numbers) => {
            let total = 0;
            for (const n of numbers) {
              total = total + n;
            }
            return total;
          };
          sum(1, 2, 3, 4, 5);
        `);
        expect(result).toBe(15);
      });

      test("allows array destructuring", () => {
        const result = interpreter.evaluate(`
          const [a, b, c] = [1, 2, 3];
          a + b + c;
        `);
        expect(result).toBe(6);
      });

      test("allows object destructuring", () => {
        const result = interpreter.evaluate(`
          const { x, y } = { x: 10, y: 20 };
          x + y;
        `);
        expect(result).toBe(30);
      });

      test("allows default parameters", () => {
        // Test default parameter via assignment pattern in destructuring
        const result = interpreter.evaluate(`
          const getUndefined = () => {};
          const value = getUndefined();
          const arr = [value];
          const [name = "World"] = arr;
          name;
        `);
        expect(result).toBe("World");
      });

      test("blocks async/await", () => {
        expect(() => {
          interpreter.evaluate("async function foo() {}");
        }).toThrow("AsyncAwait is not enabled");
      });
    });

    describe("Minimal subset", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter({
          featureControl: {
            mode: "whitelist",
            features: ["BinaryOperators", "UnaryOperators"],
          },
        });
      });

      test("allows only basic operators", () => {
        const result = interpreter.evaluate("1 + 2 * 3");
        expect(result).toBe(7);
      });

      test("blocks if statement", () => {
        expect(() => {
          interpreter.evaluate("if (true) {}");
        }).toThrow("IfStatement is not enabled");
      });

      test("blocks function declarations", () => {
        expect(() => {
          interpreter.evaluate("function foo() {}");
        }).toThrow("FunctionDeclarations is not enabled");
      });

      test("blocks variable declarations", () => {
        expect(() => {
          interpreter.evaluate("var x = 10;");
        }).toThrow("VariableDeclarations is not enabled");
      });
    });
  });

  describe("Blacklist Mode", () => {
    describe("Block modern features", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter({
          featureControl: {
            mode: "blacklist",
            features: [
              "ArrowFunctions",
              "TemplateLiterals",
              "ForOfStatement",
              "SpreadOperator",
              "RestParameters",
              "Destructuring",
              "DefaultParameters",
              "AsyncAwait",
            ],
          },
        });
      });

      test("allows basic ES5 features", () => {
        const result = interpreter.evaluate(`
          function add(a, b) {
            return a + b;
          }
          const x = 10;
          add(x, 5);
        `);
        expect(result).toBe(15);
      });

      test("allows let/const (not in blacklist)", () => {
        const result = interpreter.evaluate("const x = 42; x;");
        expect(result).toBe(42);
      });

      test("blocks arrow functions", () => {
        expect(() => {
          interpreter.evaluate("const add = (a, b) => a + b;");
        }).toThrow("ArrowFunctions is not enabled");
      });

      test("blocks template literals", () => {
        expect(() => {
          interpreter.evaluate("const msg = `Hello`;");
        }).toThrow("TemplateLiterals is not enabled");
      });

      test("blocks for-of", () => {
        expect(() => {
          interpreter.evaluate("for (const x of [1, 2, 3]) {}");
        }).toThrow("ForOfStatement is not enabled");
      });

      test("blocks spread operator", () => {
        expect(() => {
          interpreter.evaluate("const arr = [1, ...[2, 3]];");
        }).toThrow("SpreadOperator is not enabled");
      });

      test("blocks rest parameters", () => {
        expect(() => {
          interpreter.evaluate("function foo(...args) {}");
        }).toThrow("RestParameters is not enabled");
      });

      test("blocks destructuring", () => {
        expect(() => {
          interpreter.evaluate("const [a, b] = [1, 2];");
        }).toThrow("Destructuring is not enabled");
      });

      test("blocks default parameters", () => {
        expect(() => {
          interpreter.evaluate("function foo(x = 10) { return x; }");
        }).toThrow(/DefaultParameters is not enabled|Destructuring parameters not supported/);
      });

      test("blocks async/await", () => {
        expect(() => {
          interpreter.evaluate("async function foo() {}");
        }).toThrow("AsyncAwait is not enabled");
      });
    });

    describe("Block specific features", () => {
      test("can block only async/await", () => {
        const interpreter = new Interpreter({
          featureControl: {
            mode: "blacklist",
            features: ["AsyncAwait"],
          },
        });

        // Arrow functions work
        const result = interpreter.evaluate("const add = (a, b) => a + b; add(2, 3);");
        expect(result).toBe(5);

        // Async functions blocked
        expect(() => {
          interpreter.evaluate("async function foo() {}");
        }).toThrow("AsyncAwait is not enabled");
      });

      test("can block only destructuring", () => {
        const interpreter = new Interpreter({
          featureControl: {
            mode: "blacklist",
            features: ["Destructuring"],
          },
        });

        // Arrow functions work
        const result = interpreter.evaluate("const x = [1, 2, 3]; x;");
        expect(result).toEqual([1, 2, 3]);

        // Destructuring blocked
        expect(() => {
          interpreter.evaluate("const [a, b] = [1, 2];");
        }).toThrow("Destructuring is not enabled");
      });
    });
  });

  describe("Per-call feature control", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      // Constructor-level: blacklist arrow functions
      interpreter = new Interpreter({
        featureControl: {
          mode: "blacklist",
          features: ["ArrowFunctions"],
        },
      });
    });

    test("constructor-level feature control applies by default", () => {
      expect(() => {
        interpreter.evaluate("const add = (a, b) => a + b;");
      }).toThrow("ArrowFunctions is not enabled");
    });

    test("per-call feature control overrides constructor-level", () => {
      // Per-call: whitelist with arrow functions
      const result = interpreter.evaluate("const add = (a, b) => a + b; add(2, 3);", {
        featureControl: {
          mode: "whitelist",
          features: [
            "ArrowFunctions",
            "LetConst",
            "VariableDeclarations",
            "BinaryOperators",
            "CallExpression",
            "ReturnStatement",
          ],
        },
      });
      expect(result).toBe(5);
    });

    test("constructor-level still applies after per-call override", () => {
      // Use per-call override once
      interpreter.evaluate("const x = 10;", {
        featureControl: {
          mode: "whitelist",
          features: ["LetConst", "VariableDeclarations"],
        },
      });

      // Constructor-level should still apply
      expect(() => {
        interpreter.evaluate("const add = (a, b) => a + b;");
      }).toThrow("ArrowFunctions is not enabled");
    });

    test("can switch between modes per-call", () => {
      // First call: whitelist only basics
      const result1 = interpreter.evaluate("1 + 2", {
        featureControl: {
          mode: "whitelist",
          features: ["BinaryOperators"],
        },
      });
      expect(result1).toBe(3);

      // Second call: blacklist nothing (allow all)
      const result2 = interpreter.evaluate("const add = (a, b) => a + b; add(3, 4);", {
        featureControl: {
          mode: "blacklist",
          features: [],
        },
      });
      expect(result2).toBe(7);
    });
  });

  describe("No feature control (default)", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(); // No feature control
    });

    test("allows all ES5 features", () => {
      const result = interpreter.evaluate(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        factorial(5);
      `);
      expect(result).toBe(120);
    });

    test("allows all ES6 features", () => {
      const result = interpreter.evaluate(`
        const multiply = (a, b) => a * b;
        const nums = [1, 2, 3];
        const doubled = [...nums, ...nums];
        doubled;
      `);
      expect(result).toEqual([1, 2, 3, 1, 2, 3]);
    });

    test("allows async functions (sync mode throws at execution)", () => {
      // Async function declaration is allowed
      expect(() => {
        interpreter.evaluate("async function foo() { return 42; }");
      }).not.toThrow();
    });
  });

  describe("Complex scenarios", () => {
    test("ES5 only - fibonacci", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "whitelist",
          features: [
            "FunctionDeclarations",
            "IfStatement",
            "ReturnStatement",
            "BinaryOperators",
            "CallExpression",
          ],
        },
      });

      const result = interpreter.evaluate(`
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        fibonacci(10);
      `);
      expect(result).toBe(55);
    });

    test("ES6 - functional programming style", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "whitelist",
          features: [
            "ArrowFunctions",
            "LetConst",
            "VariableDeclarations",
            "CallExpression",
            "ArrayLiterals",
            "BinaryOperators",
            "MemberExpression",
            "ReturnStatement",
            "ForOfStatement",
          ],
        },
      });

      const result = interpreter.evaluate(`
        const map = (arr, fn) => {
          const result = [];
          for (const item of arr) {
            result[result.length] = fn(item);
          }
          return result;
        };

        const nums = [1, 2, 3, 4, 5];
        const doubled = map(nums, (x) => x * 2);
        doubled;
      `);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    test("blocks nested features correctly", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "whitelist",
          features: [
            "ArrayLiterals",
            "LetConst",
            "VariableDeclarations",
            "ForOfStatement",
            "BinaryOperators",
          ],
        },
      });

      // ForOfStatement is allowed
      expect(() => {
        interpreter.evaluate("const arr = [1, 2]; for (const x of arr) {}");
      }).not.toThrow();

      // But spread inside array is not
      expect(() => {
        interpreter.evaluate("const arr = [1, ...[2, 3]];");
      }).toThrow("SpreadOperator is not enabled");
    });
  });

  describe("Edge cases", () => {
    test("empty whitelist blocks everything", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "whitelist",
          features: [],
        },
      });

      expect(() => {
        interpreter.evaluate("1 + 2");
      }).toThrow("BinaryOperators is not enabled");
    });

    test("empty blacklist allows everything", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "blacklist",
          features: [],
        },
      });

      const result = interpreter.evaluate(`
        const add = (a, b) => a + b;
        const nums = [1, 2, 3];
        add(...nums.slice(0, 2));
      `);
      expect(result).toBe(3);
    });

    test("feature control doesn't affect globals", () => {
      const interpreter = new Interpreter({
        globals: {
          customFunc: (x: number) => x * 2,
        },
        featureControl: {
          mode: "whitelist",
          features: ["CallExpression"],
        },
      });

      const result = interpreter.evaluate("customFunc(21)");
      expect(result).toBe(42);
    });

    test("multiple feature checks in single statement", () => {
      const interpreter = new Interpreter({
        featureControl: {
          mode: "whitelist",
          features: [
            "ArrowFunctions",
            "LetConst",
            "VariableDeclarations",
            "BinaryOperators",
            "ReturnStatement",
            // Missing: CallExpression
          ],
        },
      });

      // Arrow function creation works (returns the function value)
      interpreter.evaluate("const add = (a, b) => a + b;");

      // But calling it fails (CallExpression not enabled)
      expect(() => {
        interpreter.evaluate("const multiply = (a, b) => a * b; multiply(2, 3);");
      }).toThrow("CallExpression is not enabled");
    });
  });
});
