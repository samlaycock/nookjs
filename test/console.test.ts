import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024, ConsoleAPI, preset } from "../src/presets";

describe("Console", () => {
  describe("API", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(preset(ES2024, ConsoleAPI));
    });

    describe("console.log", () => {
      it("should log a string", () => {
        expect(interpreter.evaluate("console.log('hello')")).toBeUndefined();
      });

      it("should log multiple arguments", () => {
        expect(
          interpreter.evaluate("console.log('a', 'b', 'c')"),
        ).toBeUndefined();
      });

      it("should log numbers", () => {
        expect(interpreter.evaluate("console.log(42)")).toBeUndefined();
      });

      it("should log objects", () => {
        expect(interpreter.evaluate("console.log({ a: 1 })")).toBeUndefined();
      });
    });

    describe("console.error", () => {
      it("should log error message", () => {
        expect(
          interpreter.evaluate("console.error('error message')"),
        ).toBeUndefined();
      });
    });

    describe("console.warn", () => {
      it("should log warning message", () => {
        expect(interpreter.evaluate("console.warn('warning')")).toBeUndefined();
      });
    });

    describe("console.info", () => {
      it("should log info message", () => {
        expect(interpreter.evaluate("console.info('info')")).toBeUndefined();
      });
    });

    describe("console.debug", () => {
      it("should log debug message", () => {
        expect(interpreter.evaluate("console.debug('debug')")).toBeUndefined();
      });
    });

    describe("console.assert", () => {
      it("should not log when assertion passes", () => {
        expect(
          interpreter.evaluate("console.assert(true, 'message')"),
        ).toBeUndefined();
      });

      it("should log when assertion fails", () => {
        expect(
          interpreter.evaluate("console.assert(false, 'assertion failed')"),
        ).toBeUndefined();
      });
    });

    describe("console.count", () => {
      it("should count with default label", () => {
        interpreter.evaluate("console.count()");
        expect(interpreter.evaluate("console.count()")).toBeUndefined();
      });
    });

    describe("console.countReset", () => {
      it("should reset counter", () => {
        interpreter.evaluate("console.count('test')");
        expect(
          interpreter.evaluate("console.countReset('test')"),
        ).toBeUndefined();
      });
    });

    describe("console.time", () => {
      it("should start timer", () => {
        expect(interpreter.evaluate("console.time('timer')")).toBeUndefined();
      });
    });

    describe("console.timeEnd", () => {
      it("should end timer", () => {
        interpreter.evaluate("console.time('timer')");
        expect(
          interpreter.evaluate("console.timeEnd('timer')"),
        ).toBeUndefined();
      });
    });

    describe("console.table", () => {
      it("should table array", () => {
        expect(
          interpreter.evaluate("console.table([1, 2, 3])"),
        ).toBeUndefined();
      });

      it("should table object", () => {
        expect(
          interpreter.evaluate("console.table({ a: 1, b: 2 })"),
        ).toBeUndefined();
      });
    });

    describe("console.trace", () => {
      it("should log trace", () => {
        expect(
          interpreter.evaluate("console.trace('trace message')"),
        ).toBeUndefined();
      });
    });
  });
});
