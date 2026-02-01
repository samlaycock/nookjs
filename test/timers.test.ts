import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024, TimersAPI } from "../src/presets";

describe("Timers", () => {
  describe("API", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter({ ...ES2024, ...TimersAPI });
    });

    describe("setTimeout", () => {
      it("should be defined", () => {
        expect(interpreter.evaluate("typeof setTimeout")).toBe("function");
      });

      it("should be callable with function and delay", () => {
        expect(interpreter.evaluate("typeof setTimeout(() => {}, 100)")).toBe("object");
      });
    });

    describe("clearTimeout", () => {
      it("should be defined", () => {
        expect(interpreter.evaluate("typeof clearTimeout")).toBe("function");
      });

      it("should be callable with timeout ID", () => {
        expect(interpreter.evaluate("clearTimeout(setTimeout(() => {}, 100))")).toBeUndefined();
      });
    });

    describe("setInterval", () => {
      it("should be defined", () => {
        expect(interpreter.evaluate("typeof setInterval")).toBe("function");
      });

      it("should be callable with function and delay", () => {
        expect(interpreter.evaluate("typeof setInterval(() => {}, 100)")).toBe("object");
      });
    });

    describe("clearInterval", () => {
      it("should be defined", () => {
        expect(interpreter.evaluate("typeof clearInterval")).toBe("function");
      });

      it("should be callable with interval ID", () => {
        expect(interpreter.evaluate("clearInterval(setInterval(() => {}, 100))")).toBeUndefined();
      });
    });

    describe("Timers with async/await", () => {
      it("should work with Promise-based delay", async () => {
        const result = await interpreter.evaluateAsync(`
          new Promise(resolve => setTimeout(resolve, 10))
        `);
        expect(result).toBeUndefined();
      });

      it("should resolve with value", async () => {
        const result = await interpreter.evaluateAsync(`
          new Promise(resolve => setTimeout(() => resolve(42), 10))
        `);
        expect(result).toBe(42);
      });

      it("should clear timeout before execution", async () => {
        const result = await interpreter.evaluateAsync(`
          let executed = false;
          const timeoutId = setTimeout(() => { executed = true; }, 10);
          clearTimeout(timeoutId);
          await new Promise(resolve => setTimeout(resolve, 20));
          executed
        `);
        expect(result).toBe(false);
      });
    });
  });
});
