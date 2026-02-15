import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { Browser, WinterCG, NodeJS, Minimal } from "../src/presets";

describe("Presets", () => {
  describe("API", () => {
    describe("Environment Presets", () => {
      describe("Browser preset", () => {
        it("should include ES2024 language features", () => {
          const interpreter = new Interpreter(Browser);

          // Test optional chaining
          const result = interpreter.evaluate(`
            const obj = { nested: { value: 42 } };
            obj?.nested?.value;
          `);
          expect(result).toBe(42);
        });

        it("should include console API", () => {
          const interpreter = new Interpreter(Browser);

          // console should be available
          expect(() => interpreter.evaluate("typeof console")).not.toThrow();
          expect(interpreter.evaluate("typeof console")).toBe("object");
        });

        it("should include fetch-related APIs", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof fetch")).toBe("function");
          expect(interpreter.evaluate("typeof Request")).toBe("function");
          expect(interpreter.evaluate("typeof Response")).toBe("function");
          expect(interpreter.evaluate("typeof Headers")).toBe("function");
        });

        it("should include URL APIs", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof URL")).toBe("function");
          expect(interpreter.evaluate("typeof URLSearchParams")).toBe(
            "function",
          );
        });

        it("should include AbortController", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof AbortController")).toBe(
            "function",
          );
          expect(interpreter.evaluate("typeof AbortSignal")).toBe("function");
        });

        it("should include Timer APIs", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof setTimeout")).toBe("function");
          expect(interpreter.evaluate("typeof setInterval")).toBe("function");
        });

        it("should include TextEncoder/TextDecoder", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof TextEncoder")).toBe("function");
          expect(interpreter.evaluate("typeof TextDecoder")).toBe("function");
        });

        it("should include Blob/File APIs", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof Blob")).toBe("function");
          expect(interpreter.evaluate("typeof File")).toBe("function");
        });

        it("should include performance API", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof performance")).toBe("object");
          expect(interpreter.evaluate("typeof performance.now")).toBe(
            "function",
          );
        });

        it("should include Event APIs", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof Event")).toBe("function");
          expect(interpreter.evaluate("typeof EventTarget")).toBe("function");
          expect(interpreter.evaluate("typeof CustomEvent")).toBe("function");
        });

        it("should include crypto API", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof crypto")).toBe("object");
        });

        it("should include Streams API", () => {
          const interpreter = new Interpreter(Browser);

          expect(interpreter.evaluate("typeof ReadableStream")).toBe(
            "function",
          );
          expect(interpreter.evaluate("typeof WritableStream")).toBe(
            "function",
          );
        });
      });

      describe("WinterCG preset", () => {
        it("should include ES2024 language features", () => {
          const interpreter = new Interpreter(WinterCG);

          const result = interpreter.evaluate(`
            const arr = [1, 2, 3];
            arr.at(-1);
          `);
          expect(result).toBe(3);
        });

        it("should include fetch API", () => {
          const interpreter = new Interpreter(WinterCG);

          expect(interpreter.evaluate("typeof fetch")).toBe("function");
          expect(interpreter.evaluate("typeof Request")).toBe("function");
          expect(interpreter.evaluate("typeof Response")).toBe("function");
        });

        it("should include console API", () => {
          const interpreter = new Interpreter(WinterCG);

          expect(interpreter.evaluate("typeof console")).toBe("object");
        });

        it("should include crypto API", () => {
          const interpreter = new Interpreter(WinterCG);

          expect(interpreter.evaluate("typeof crypto")).toBe("object");
        });

        it("should include TextEncoder/TextDecoder", () => {
          const interpreter = new Interpreter(WinterCG);

          expect(interpreter.evaluate("typeof TextEncoder")).toBe("function");
          expect(interpreter.evaluate("typeof TextDecoder")).toBe("function");
        });

        it("should NOT include Timer APIs by default", () => {
          const interpreter = new Interpreter(WinterCG);

          // WinterCG doesn't guarantee timers
          expect(interpreter.evaluate("typeof setTimeout")).toBe("undefined");
        });
      });

      describe("NodeJS preset", () => {
        it("should include ES2024 language features", () => {
          const interpreter = new Interpreter(NodeJS);

          const result = interpreter.evaluate(`
            const promise = Promise.resolve(42);
            typeof promise.then;
          `);
          expect(result).toBe("function");
        });

        it("should include fetch API", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof fetch")).toBe("function");
        });

        it("should include console API", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof console")).toBe("object");
        });

        it("should include Timer APIs", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof setTimeout")).toBe("function");
          expect(interpreter.evaluate("typeof setInterval")).toBe("function");
        });

        it("should include Buffer/TypedArray APIs", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof ArrayBuffer")).toBe("function");
          expect(interpreter.evaluate("typeof Uint8Array")).toBe("function");
          expect(interpreter.evaluate("typeof DataView")).toBe("function");
        });

        it("should include performance API", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof performance")).toBe("object");
        });

        it("should include Streams API", () => {
          const interpreter = new Interpreter(NodeJS);

          expect(interpreter.evaluate("typeof ReadableStream")).toBe(
            "function",
          );
        });
      });

      describe("Minimal preset", () => {
        it("should include ES2024 language features", () => {
          const interpreter = new Interpreter(Minimal);

          // Arrow functions, let/const, template literals
          const result = interpreter.evaluate(`
            const add = (a, b) => a + b;
            add(1, 2);
          `);
          expect(result).toBe(3);
        });

        it("should include basic built-in objects", () => {
          const interpreter = new Interpreter(Minimal);

          expect(interpreter.evaluate("typeof Array")).toBe("function");
          expect(interpreter.evaluate("typeof Object")).toBe("function");
          expect(interpreter.evaluate("typeof String")).toBe("function");
          expect(interpreter.evaluate("typeof Number")).toBe("function");
          expect(interpreter.evaluate("typeof Boolean")).toBe("function");
          expect(interpreter.evaluate("typeof Date")).toBe("function");
          expect(interpreter.evaluate("typeof Math")).toBe("object");
          expect(interpreter.evaluate("typeof JSON")).toBe("object");
        });

        it("should include ES6+ built-ins", () => {
          const interpreter = new Interpreter(Minimal);

          expect(interpreter.evaluate("typeof Promise")).toBe("function");
          expect(interpreter.evaluate("typeof Map")).toBe("function");
          expect(interpreter.evaluate("typeof Set")).toBe("function");
          expect(interpreter.evaluate("typeof WeakMap")).toBe("function");
          expect(interpreter.evaluate("typeof WeakSet")).toBe("function");
          expect(interpreter.evaluate("typeof BigInt")).toBe("function");
        });

        it("should NOT include console", () => {
          const interpreter = new Interpreter(Minimal);

          expect(interpreter.evaluate("typeof console")).toBe("undefined");
        });

        it("should NOT include fetch", () => {
          const interpreter = new Interpreter(Minimal);

          expect(interpreter.evaluate("typeof fetch")).toBe("undefined");
        });

        it("should NOT include Timer APIs", () => {
          const interpreter = new Interpreter(Minimal);

          expect(interpreter.evaluate("typeof setTimeout")).toBe("undefined");
        });

        it("should allow pure computation", () => {
          const interpreter = new Interpreter(Minimal);

          const result = interpreter.evaluate(`
            const numbers = [1, 2, 3, 4, 5];
            const doubled = numbers.map(x => x * 2);
            const sum = doubled.reduce((a, b) => a + b, 0);
            sum;
          `);
          expect(result).toBe(30);
        });
      });
    });
  });
});
