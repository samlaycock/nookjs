import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Error Subclasses", () => {
  describe("ES2024", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("TypeError", () => {
      it("should create a TypeError", () => {
        expect(interpreter.evaluate("new TypeError('test').message")).toBe("test");
      });

      it("should have correct name", () => {
        expect(interpreter.evaluate("new TypeError('test').name")).toBe("TypeError");
      });

      it("should be throwable and catchable", () => {
        expect(
          interpreter.evaluate(`
        try {
          throw new TypeError('type error');
        } catch (e) {
          typeof e
        }
      `),
        ).toBe("object");
      });

      it("should be instance of Error", () => {
        expect(interpreter.evaluate("new TypeError() instanceof Error")).toBe(true);
      });
    });

    describe("Error", () => {
      it("should create an Error with a message", () => {
        expect(interpreter.evaluate("new Error('boom').message")).toBe("boom");
      });

      it("should have correct name", () => {
        expect(interpreter.evaluate("new Error().name")).toBe("Error");
      });

      it("should be instance of Error", () => {
        expect(interpreter.evaluate("new Error() instanceof Error")).toBe(true);
      });

      it("should default message to empty string", () => {
        expect(interpreter.evaluate("new Error().message")).toBe("");
      });
    });

    describe("ReferenceError", () => {
      it("should create a ReferenceError", () => {
        expect(interpreter.evaluate("new ReferenceError('undefined var').message")).toBe(
          "undefined var",
        );
      });

      it("should have correct name", () => {
        expect(interpreter.evaluate("new ReferenceError().name")).toBe("ReferenceError");
      });
    });

    describe("SyntaxError", () => {
      it("should create a SyntaxError", () => {
        expect(interpreter.evaluate("new SyntaxError('bad syntax').message")).toBe("bad syntax");
      });

      it("should have correct name", () => {
        expect(interpreter.evaluate("new SyntaxError().name")).toBe("SyntaxError");
      });
    });

    describe("RangeError", () => {
      it("should create a RangeError", () => {
        expect(interpreter.evaluate("new RangeError('out of range').message")).toBe("out of range");
      });

      it("should have correct name", () => {
        expect(interpreter.evaluate("new RangeError().name")).toBe("RangeError");
      });
    });

    describe("Error.stack", () => {
      it("should have stack property", () => {
        expect(interpreter.evaluate("typeof new Error().stack")).toBe("string");
      });
    });

    describe("Error instanceof checks", () => {
      it("TypeError should be instance of Error", () => {
        expect(interpreter.evaluate("new TypeError() instanceof Error")).toBe(true);
      });

      it("ReferenceError should be instance of Error", () => {
        expect(interpreter.evaluate("new ReferenceError() instanceof Error")).toBe(true);
      });

      it("SyntaxError should be instance of Error", () => {
        expect(interpreter.evaluate("new SyntaxError() instanceof Error")).toBe(true);
      });

      it("RangeError should be instance of Error", () => {
        expect(interpreter.evaluate("new RangeError() instanceof Error")).toBe(true);
      });
    });
  });
});
