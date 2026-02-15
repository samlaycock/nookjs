import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Async", () => {
  describe("ES2017", () => {
    describe("evaluateAsync()", () => {
      describe("Async host functions", () => {
        it("should call async host function and await result", async () => {
          const asyncFunc = async () => {
            return 42;
          };
          const interpreter = new Interpreter({
            globals: { asyncFunc },
          });
          const result = await interpreter.evaluateAsync("asyncFunc()");
          expect(result).toBe(42);
        });

        it("should call async host function with arguments", async () => {
          const asyncAdd = async (a: number, b: number) => {
            return a + b;
          };
          const interpreter = new Interpreter({
            globals: { asyncAdd },
          });
          const result = await interpreter.evaluateAsync("asyncAdd(10, 20)");
          expect(result).toBe(30);
        });

        it("should handle async host function that returns promise", async () => {
          const fetchData = async () => {
            return new Promise((resolve) => {
              setTimeout(() => resolve("data"), 10);
            });
          };
          const interpreter = new Interpreter({
            globals: { fetchData },
          });
          const result = await interpreter.evaluateAsync("fetchData()");
          expect(result).toBe("data");
        });

        it("should propagate errors from async host functions", async () => {
          const asyncError = async () => {
            throw new Error("Async error");
          };
          const interpreter = new Interpreter({
            globals: { asyncError },
            security: { hideHostErrorMessages: false },
          });
          return expect(interpreter.evaluateAsync("asyncError()")).rejects.toThrow(
            "Host function 'asyncError' threw error: Async error",
          );
        });

        it("should handle multiple async host function calls", async () => {
          const asyncDouble = async (x: number) => x * 2;
          const asyncTriple = async (x: number) => x * 3;
          const interpreter = new Interpreter({
            globals: { asyncDouble, asyncTriple },
          });
          const result = await interpreter.evaluateAsync("asyncDouble(5) + asyncTriple(4)");
          expect(result).toBe(22); // 10 + 12
        });

        it("should handle nested async host function calls", async () => {
          const asyncAdd = async (a: number, b: number) => a + b;
          const asyncDouble = async (x: number) => x * 2;
          const interpreter = new Interpreter({
            globals: { asyncAdd, asyncDouble },
          });
          const result = await interpreter.evaluateAsync("asyncDouble(asyncAdd(3, 7))");
          expect(result).toBe(20); // double(10) = 20
        });
      });

      describe("Sync host functions in async mode", () => {
        it("should call sync host functions in evaluateAsync()", async () => {
          const syncFunc = (x: number) => x * 2;
          const interpreter = new Interpreter({
            globals: { syncFunc },
          });
          const result = await interpreter.evaluateAsync("syncFunc(5)");
          expect(result).toBe(10);
        });

        it("should mix sync and async host functions", async () => {
          const syncAdd = (a: number, b: number) => a + b;
          const asyncDouble = async (x: number) => x * 2;
          const interpreter = new Interpreter({
            globals: { syncAdd, asyncDouble },
          });
          const result = await interpreter.evaluateAsync("asyncDouble(syncAdd(3, 7))");
          expect(result).toBe(20);
        });
      });

      describe("Basic async operations", () => {
        it("should evaluate binary expressions", async () => {
          const interpreter = new Interpreter();
          expect(await interpreter.evaluateAsync("5 + 3")).toBe(8);
          expect(await interpreter.evaluateAsync("10 - 4")).toBe(6);
          expect(await interpreter.evaluateAsync("6 * 7")).toBe(42);
          expect(await interpreter.evaluateAsync("20 / 4")).toBe(5);
        });

        it("should evaluate unary expressions", async () => {
          const interpreter = new Interpreter();
          expect(await interpreter.evaluateAsync("-5")).toBe(-5);
          expect(await interpreter.evaluateAsync("+10")).toBe(10);
          expect(await interpreter.evaluateAsync("!true")).toBe(false);
          expect(await interpreter.evaluateAsync("!false")).toBe(true);
        });

        it("should evaluate logical expressions", async () => {
          const interpreter = new Interpreter();
          expect(await interpreter.evaluateAsync("true && true")).toBe(true);
          expect(await interpreter.evaluateAsync("true && false")).toBe(false);
          expect(await interpreter.evaluateAsync("true || false")).toBe(true);
          expect(await interpreter.evaluateAsync("false || false")).toBe(false);
        });

        it("should evaluate update expressions", async () => {
          const interpreter = new Interpreter();
          expect(await interpreter.evaluateAsync("let x = 5; x++; x")).toBe(6);
          expect(await interpreter.evaluateAsync("let y = 5; ++y")).toBe(6);
          expect(await interpreter.evaluateAsync("let z = 5; z--; z")).toBe(4);
        });

        it("should evaluate variable declarations and assignments", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync("let x = 10");
          expect(await interpreter.evaluateAsync("x")).toBe(10);
          await interpreter.evaluateAsync("x = 20");
          expect(await interpreter.evaluateAsync("x")).toBe(20);
        });

        it("should evaluate const declarations", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync("const PI = 3.14159");
          expect(await interpreter.evaluateAsync("PI")).toBe(3.14159);
        });

        it("should evaluate arrays", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("[1, 2, 3, 4, 5]");
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should evaluate objects", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("({ name: 'Alice', age: 30 })");
          expect(result).toEqual({ name: "Alice", age: 30 });
        });

        it("should evaluate member expressions", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync("let obj = { x: 10, y: 20 }");
          expect(await interpreter.evaluateAsync("obj.x")).toBe(10);
          expect(await interpreter.evaluateAsync("obj['y']")).toBe(20);
        });
      });

      describe("Async control flow", () => {
        it("should evaluate if statements", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let x = 10;
            if (x > 5) {
              x = 100;
            }
            x
          `);
          expect(result).toBe(100);
        });

        it("should evaluate if-else statements", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let x = 3;
            let result;
            if (x > 5) {
              result = 'big';
            } else {
              result = 'small';
            }
            result
          `);
          expect(result).toBe("small");
        });

        it("should evaluate while loops", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            let i = 1;
            while (i <= 5) {
              sum = sum + i;
              i++;
            }
            sum
          `);
          expect(result).toBe(15); // 1+2+3+4+5
        });

        it("should evaluate for loops", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            for (let i = 1; i <= 5; i++) {
              sum = sum + i;
            }
            sum
          `);
          expect(result).toBe(15);
        });

        it("should evaluate nested loops", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let total = 0;
            for (let i = 1; i <= 3; i++) {
              for (let j = 1; j <= 2; j++) {
                total = total + i * j;
              }
            }
            total
          `);
          expect(result).toBe(18); // (1*1 + 1*2) + (2*1 + 2*2) + (3*1 + 3*2)
        });
      });

      describe("Async sandbox functions", () => {
        it("should evaluate sandbox function declarations", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync(`
            function double(x) {
              return x * 2;
            }
          `);
          const result = await interpreter.evaluateAsync("double(5)");
          expect(result).toBe(10);
        });

        it("should evaluate sandbox function expressions", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync(`
            let triple = function(x) {
              return x * 3;
            };
          `);
          const result = await interpreter.evaluateAsync("triple(4)");
          expect(result).toBe(12);
        });

        it("should evaluate arrow functions", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync("let square = (x) => x * x");
          const result = await interpreter.evaluateAsync("square(7)");
          expect(result).toBe(49);
        });

        it("should handle closures", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            function makeCounter() {
              let count = 0;
              return function() {
                count = count + 1;
                return count;
              };
            }
            let counter = makeCounter();
            counter();
            counter();
            counter()
          `);
          expect(result).toBe(3);
        });

        it("should handle recursive functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            function factorial(n) {
              if (n <= 1) return 1;
              return n * factorial(n - 1);
            }
            factorial(5)
          `);
          expect(result).toBe(120);
        });
      });

      describe("Async with host functions in control flow", () => {
        it("should call async host function in if condition", async () => {
          const asyncIsPositive = async (x: number) => x > 0;
          const interpreter = new Interpreter({
            globals: { asyncIsPositive },
          });
          const result = await interpreter.evaluateAsync(`
            let x = 10;
            let result;
            if (asyncIsPositive(x)) {
              result = 'positive';
            } else {
              result = 'negative';
            }
            result
          `);
          expect(result).toBe("positive");
        });

        it("should call async host function in loop", async () => {
          const asyncDouble = async (x: number) => x * 2;
          const interpreter = new Interpreter({
            globals: { asyncDouble },
          });
          const result = await interpreter.evaluateAsync(`
            let sum = 0;
            for (let i = 1; i <= 3; i++) {
              sum = sum + asyncDouble(i);
            }
            sum
          `);
          expect(result).toBe(12); // 2 + 4 + 6
        });

        it("should call async host function with array elements", async () => {
          const asyncIncrement = async (x: number) => x + 1;
          const interpreter = new Interpreter({
            globals: { asyncIncrement },
          });
          const result = await interpreter.evaluateAsync(`
            [asyncIncrement(1), asyncIncrement(2), asyncIncrement(3)]
          `);
          expect(result).toEqual([2, 3, 4]);
        });

        it("should call async host function in object properties", async () => {
          const asyncGetName = async () => "Alice";
          const asyncGetAge = async () => 30;
          const interpreter = new Interpreter({
            globals: { asyncGetName, asyncGetAge },
          });
          const result = await interpreter.evaluateAsync(`
            ({ name: asyncGetName(), age: asyncGetAge() })
          `);
          expect(result).toEqual({ name: "Alice", age: 30 });
        });
      });

      describe("Complex async scenarios", () => {
        it("should handle deeply nested async calls", async () => {
          const asyncAdd = async (a: number, b: number) => a + b;
          const asyncMult = async (a: number, b: number) => a * b;
          const interpreter = new Interpreter({
            globals: { asyncAdd, asyncMult },
          });
          const result = await interpreter.evaluateAsync(`
            asyncMult(asyncAdd(2, 3), asyncAdd(4, 6))
          `);
          expect(result).toBe(50); // (2+3) * (4+6) = 5 * 10
        });

        it("should handle async functions returning complex objects", async () => {
          const asyncGetUser = async (id: number) => ({
            id,
            name: `User${id}`,
            active: true,
          });
          const interpreter = new Interpreter({
            globals: { asyncGetUser },
          });
          const result = await interpreter.evaluateAsync(`
            let user = asyncGetUser(42);
            user.name
          `);
          expect(result).toBe("User42");
        });

        it("should handle async functions with complex logic", async () => {
          const asyncProcessData = async (data: number[]) => {
            let sum = 0;
            for (const num of data) {
              sum += num;
            }
            return sum / data.length;
          };
          const interpreter = new Interpreter({
            globals: { asyncProcessData },
          });
          const result = await interpreter.evaluateAsync("asyncProcessData([10, 20, 30, 40, 50])");
          expect(result).toBe(30);
        });
      });

      describe("Per-call globals in async mode", () => {
        it("should support per-call globals with async", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("x + y", {
            globals: { x: 10, y: 20 },
          });
          expect(result).toBe(30);
        });

        it("should support async host functions as per-call globals", async () => {
          const asyncFunc = async () => 42;
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync("asyncFunc()", {
            globals: { asyncFunc },
          });
          expect(result).toBe(42);
        });

        it("should clean up per-call globals after async execution", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync("let result = x", {
            globals: { x: 10 },
          });
          return expect(interpreter.evaluateAsync("x")).rejects.toThrow("Undefined variable 'x'");
        });
      });

      describe("Error handling in async mode", () => {
        it("should handle errors in async expressions", async () => {
          const interpreter = new Interpreter();
          return expect(interpreter.evaluateAsync("undefinedVar")).rejects.toThrow(
            "Undefined variable 'undefinedVar'",
          );
        });

        it("should handle errors in async control flow", async () => {
          const interpreter = new Interpreter();
          return expect(
            interpreter.evaluateAsync(`
              if (unknownVar > 5) {
                let x = 10;
              }
            `),
          ).rejects.toThrow("Undefined variable 'unknownVar'");
        });

        it("should handle const reassignment errors in async", async () => {
          const interpreter = new Interpreter();
          return expect(
            interpreter.evaluateAsync(`
              const PI = 3.14159;
              PI = 3.14;
            `),
          ).rejects.toThrow("Cannot assign to const variable 'PI'");
        });
      });

      describe("Return statements in async mode", () => {
        it("should handle return statements in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            function getValue() {
              return 42;
            }
            getValue()
          `);
          expect(result).toBe(42);
        });

        it("should handle early returns in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            function checkValue(x) {
              if (x > 10) {
                return 'big';
              }
              return 'small';
            }
            checkValue(15)
          `);
          expect(result).toBe("big");
        });
      });
    });

    describe("Async/Await Syntax", () => {
      describe("Async function declarations", () => {
        it("should declare async functions", async () => {
          const interpreter = new Interpreter();
          await interpreter.evaluateAsync(`
            async function test() {
              return 42;
            }
          `);
          // Function should be declared
          const result = await interpreter.evaluateAsync("test()");
          expect(result).toBe(42);
        });

        it("should handle async functions with parameters", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function add(a, b) {
              return a + b;
            }
            add(10, 20)
          `);
          expect(result).toBe(30);
        });

        it("should handle async functions with local variables", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function calculate() {
              let x = 10;
              let y = 20;
              return x + y;
            }
            calculate()
          `);
          expect(result).toBe(30);
        });
      });

      describe("Async function expressions", () => {
        it("should handle async function expressions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let func = async function() {
              return 100;
            };
            func()
          `);
          expect(result).toBe(100);
        });

        it("should handle async function expressions with params", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let multiply = async function(a, b) {
              return a * b;
            };
            multiply(6, 7)
          `);
          expect(result).toBe(42);
        });
      });

      describe("Async arrow functions", () => {
        it("should handle async arrow functions with expression body", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let double = async (x) => x * 2;
            double(21)
          `);
          expect(result).toBe(42);
        });

        it("should handle async arrow functions with block body", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            let calculate = async (x) => {
              let result = x * 2;
              return result + 10;
            };
            calculate(5)
          `);
          expect(result).toBe(20);
        });
      });

      describe("Await expressions", () => {
        it("should await async host functions", async () => {
          const asyncGetValue = async () => 42;
          const interpreter = new Interpreter({
            globals: { asyncGetValue },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              let value = await asyncGetValue();
              return value;
            }
            test()
          `);
          expect(result).toBe(42);
        });

        it("should await async host functions with arguments", async () => {
          const asyncAdd = async (a: number, b: number) => a + b;
          const interpreter = new Interpreter({
            globals: { asyncAdd },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              let result = await asyncAdd(10, 20);
              return result;
            }
            test()
          `);
          expect(result).toBe(30);
        });

        it("should await multiple async host functions", async () => {
          const asyncDouble = async (x: number) => x * 2;
          const asyncTriple = async (x: number) => x * 3;
          const interpreter = new Interpreter({
            globals: { asyncDouble, asyncTriple },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              let a = await asyncDouble(5);
              let b = await asyncTriple(4);
              return a + b;
            }
            test()
          `);
          expect(result).toBe(22); // 10 + 12
        });

        it("should await async sandbox functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function getData() {
              return 100;
            }
            async function process() {
              let data = await getData();
              return data * 2;
            }
            process()
          `);
          expect(result).toBe(200);
        });

        it("should handle nested async calls", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function getBase() {
              return 10;
            }
            async function double(x) {
              return x * 2;
            }
            async function calculate() {
              let base = await getBase();
              let result = await double(base);
              return result;
            }
            calculate()
          `);
          expect(result).toBe(20);
        });

        it("should await in expressions", async () => {
          const asyncGetValue = async (x: number) => x;
          const interpreter = new Interpreter({
            globals: { asyncGetValue },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              return (await asyncGetValue(10)) + (await asyncGetValue(20));
            }
            test()
          `);
          expect(result).toBe(30);
        });
      });

      describe("Async functions in control flow", () => {
        it("should use await in if statements", async () => {
          const asyncCheck = async (x: number) => x > 10;
          const interpreter = new Interpreter({
            globals: { asyncCheck },
          });
          const result = await interpreter.evaluateAsync(`
            async function test(val) {
              if (await asyncCheck(val)) {
                return "big";
              } else {
                return "small";
              }
            }
            test(15)
          `);
          expect(result).toBe("big");
        });

        it("should use await in loops", async () => {
          const asyncIncrement = async (x: number) => x + 1;
          const interpreter = new Interpreter({
            globals: { asyncIncrement },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              let sum = 0;
              for (let i = 0; i < 3; i++) {
                sum = sum + (await asyncIncrement(i));
              }
              return sum;
            }
            test()
          `);
          expect(result).toBe(6); // 1 + 2 + 3
        });

        it("should use await in while loops", async () => {
          const asyncGetNext = async (x: number) => x + 1;
          const interpreter = new Interpreter({
            globals: { asyncGetNext },
          });
          const result = await interpreter.evaluateAsync(`
            async function test() {
              let i = 0;
              let sum = 0;
              while (i < 3) {
                sum = sum + i;
                i = await asyncGetNext(i);
              }
              return sum;
            }
            test()
          `);
          expect(result).toBe(3); // 0 + 1 + 2
        });
      });

      describe("Mixed sync and async functions", () => {
        it("should call sync functions from async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            function syncDouble(x) {
              return x * 2;
            }
            async function asyncProcess() {
              let value = syncDouble(10);
              return value + 5;
            }
            asyncProcess()
          `);
          expect(result).toBe(25);
        });

        it("should call async functions from async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function asyncDouble(x) {
              return x * 2;
            }
            async function asyncProcess() {
              let value = await asyncDouble(10);
              return value + 5;
            }
            asyncProcess()
          `);
          expect(result).toBe(25);
        });

        it("should mix sync host functions and async sandbox functions", async () => {
          const syncAdd = (a: number, b: number) => a + b;
          const interpreter = new Interpreter({
            globals: { syncAdd },
          });
          const result = await interpreter.evaluateAsync(`
            async function process() {
              let a = syncAdd(5, 10);
              let b = syncAdd(3, 7);
              return a + b;
            }
            process()
          `);
          expect(result).toBe(25);
        });
      });

      describe("Error handling with async/await", () => {
        it("should throw error when calling async function in sync mode", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              async function test() {
                return 42;
              }
              test()
            `);
          }).toThrow(
            "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
          );
        });

        it("should throw error when calling async sandbox function in sync mode", () => {
          const interpreter = new Interpreter();
          // First declare the async function in async mode
          void interpreter.evaluateAsync(`
            async function asyncFunc() {
              return 42;
            }
          `);
          // Then try to call it in sync mode
          expect(() => {
            interpreter.evaluate("asyncFunc()");
          }).toThrow(
            "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
          );
        });

        it("should propagate errors from async sandbox functions", async () => {
          const interpreter = new Interpreter();
          expect(
            interpreter.evaluateAsync(`
              async function throwError() {
                let x = undefinedVar;
                return x;
              }
              throwError()
            `),
          ).rejects.toThrow("Undefined variable 'undefinedVar'");
        });
      });

      describe("Async function closures", () => {
        it("should handle closures in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function makeCounter() {
              let count = 0;
              return async function() {
                count = count + 1;
                return count;
              };
            }
            async function test() {
              let counter = await makeCounter();
              let a = await counter();
              let b = await counter();
              let c = await counter();
              return c;
            }
            test()
          `);
          expect(result).toBe(3);
        });
      });

      describe("Async function return values", () => {
        it("should handle early returns in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function check(x) {
              if (x > 10) {
                return "big";
              }
              return "small";
            }
            check(15)
          `);
          expect(result).toBe("big");
        });

        it("should handle no explicit return in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function noReturn() {
              let x = 10;
            }
            noReturn()
          `);
          expect(result).toBeUndefined();
        });

        it("should handle returning objects from async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function getUser() {
              return { name: "Alice", age: 30 };
            }
            async function test() {
              let user = await getUser();
              return user.name;
            }
            test()
          `);
          expect(result).toBe("Alice");
        });
      });
    });

    describe("Promise Static Methods", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter(ES2024);
      });

      describe("Promise.resolve", () => {
        it("should return a resolved promise with value", async () => {
          const result = await interpreter.evaluateAsync("Promise.resolve(42)");
          expect(result).toBe(42);
        });

        it("should return a resolved promise with undefined", async () => {
          const result = await interpreter.evaluateAsync("Promise.resolve()");
          expect(result).toBeUndefined();
        });

        it("should return a resolved promise with object", async () => {
          const result = await interpreter.evaluateAsync("Promise.resolve({ a: 1 })");
          expect(result).toEqual({ a: 1 });
        });
      });

      describe("Promise.reject", () => {
        it("should return a rejected promise", async () => {
          try {
            await interpreter.evaluateAsync("Promise.reject('error')");
            expect(true).toBe(false);
          } catch (e) {
            expect(String(e)).toContain("error");
          }
        });
      });

      describe("Promise.all", () => {
        it("should resolve with all values when all promises resolve", async () => {
          const result = await interpreter.evaluateAsync(`
            Promise.all([
              Promise.resolve(1),
              Promise.resolve(2),
              Promise.resolve(3)
            ])
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should handle empty array", async () => {
          const result = await interpreter.evaluateAsync("Promise.all([])");
          expect(result).toEqual([]);
        });
      });

      describe("Promise.race", () => {
        it("should return first resolved promise", async () => {
          const result = await interpreter.evaluateAsync(`
            Promise.race([
              Promise.resolve(1),
              Promise.resolve(2)
            ])
          `);
          expect(result).toBe(1);
        });
      });

      describe("Promise.allSettled", () => {
        it("should resolve with all results", async () => {
          const result = await interpreter.evaluateAsync(`
            Promise.allSettled([
              Promise.resolve(1),
              Promise.resolve(2)
            ])
          `);
          expect(result).toBeInstanceOf(Array);
          expect(result.length).toBe(2);
        });

        it("should handle empty array", async () => {
          const result = await interpreter.evaluateAsync("Promise.allSettled([])");
          expect(result).toEqual([]);
        });
      });

      describe("Promise.withResolvers", () => {
        it("should return object with promise, resolve, and reject", async () => {
          const result = await interpreter.evaluateAsync(`
            const { promise, resolve } = Promise.withResolvers();
            resolve(42);
            promise
          `);
          expect(result).toBe(42);
        });
      });
    });
  });

  describe("ES2018", () => {
    describe("for await...of", () => {
      describe("async generators", () => {
        test("iterates over async generator values", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              async function* gen() {
                yield 1;
                yield 2;
                yield 3;
              }
              let sum = 0;
              for await (const val of gen()) {
                sum = sum + val;
              }
              return sum;
            }
            run()
          `);
          expect(result).toBe(6);
        });

        test("collects async generator values into array", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              async function* gen() {
                yield "a";
                yield "b";
                yield "c";
              }
              const items = [];
              for await (const val of gen()) {
                items.push(val);
              }
              return items;
            }
            run()
          `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        test("break in for await...of", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              async function* gen() {
                yield 1;
                yield 2;
                yield 3;
                yield 4;
              }
              let last = 0;
              for await (const val of gen()) {
                last = val;
                if (val === 2) break;
              }
              return last;
            }
            run()
          `);
          expect(result).toBe(2);
        });
      });

      describe("sync iterables with for await", () => {
        test("for await...of over regular array", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              const items = [];
              for await (const val of [10, 20, 30]) {
                items.push(val);
              }
              return items;
            }
            run()
          `);
          expect(result).toEqual([10, 20, 30]);
        });

        test("for await...of over sync generator", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              function* gen() {
                yield 1;
                yield 2;
              }
              let sum = 0;
              for await (const val of gen()) {
                sum = sum + val;
              }
              return sum;
            }
            run()
          `);
          expect(result).toBe(3);
        });
      });

      describe("destructuring in for await", () => {
        test("for await with let declaration", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
            async function run() {
              async function* gen() {
                yield 1;
                yield 2;
              }
              let total = 0;
              for await (let val of gen()) {
                total = total + val;
              }
              return total;
            }
            run()
          `);
          expect(result).toBe(3);
        });
      });

      describe("error handling", () => {
        test("rejects for await...of in sync evaluate", () => {
          const interpreter = new Interpreter();
          expect(() =>
            interpreter.evaluate(`
              for await (const val of [1, 2, 3]) {}
            `),
          ).toThrow("Unexpected token: await");
        });
      });

      describe("with host async iterables", () => {
        test("iterates host async generator", async () => {
          async function* hostGen() {
            yield 100;
            yield 200;
          }
          const interpreter = new Interpreter({ globals: { hostGen } });
          const result = await interpreter.evaluateAsync(`
            async function run() {
              const items = [];
              for await (const val of hostGen()) {
                items.push(val);
              }
              return items;
            }
            run()
          `);
          expect(result).toEqual([100, 200]);
        });
      });
    });
  });

  describe("ES2020", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Promise.allSettled", () => {
      it("should resolve with all results", async () => {
        const result = await interpreter.evaluateAsync(`
                  Promise.allSettled([
                    Promise.resolve(1),
                    Promise.resolve(2)
                  ])
                `);
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(2);
      });
    });
  });
});
