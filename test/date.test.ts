import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5 } from "../src/presets";

describe("Date", () => {
  describe("ES5", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES5);
    });

    describe("new Date()", () => {
      it("should create a new Date object", () => {
        expect(interpreter.evaluate("typeof new Date()")).toBe("object");
      });

      it("should create a Date from timestamp", () => {
        expect(interpreter.evaluate("new Date(0).toISOString()")).toBe("1970-01-01T00:00:00.000Z");
      });

      it("should create a Date from date string", () => {
        expect(interpreter.evaluate("new Date('2020-01-01').getFullYear()")).toBe(2020);
      });

      it("should create a Date from year, month", () => {
        expect(interpreter.evaluate("new Date(2020, 0, 1).getFullYear()")).toBe(2020);
      });
    });

    describe("Date.now()", () => {
      it("should return current timestamp as number", () => {
        expect(interpreter.evaluate("typeof Date.now()")).toBe("number");
      });

      it("should return a positive number", () => {
        expect(interpreter.evaluate("Date.now()")).toBeGreaterThan(0);
      });
    });

    describe("Date.parse()", () => {
      it("should parse ISO date string", () => {
        expect(interpreter.evaluate("Date.parse('2020-01-01')")).toBe(1577836800000);
      });
    });

    describe("Date.UTC()", () => {
      it("should return UTC timestamp", () => {
        expect(interpreter.evaluate("Date.UTC(2020, 0, 1)")).toBe(1577836800000);
      });
    });

    describe("Date instance methods", () => {
      it("getFullYear should return the full year", () => {
        expect(interpreter.evaluate("new Date(2020, 5, 15).getFullYear()")).toBe(2020);
      });

      it("getMonth should return month (0-11)", () => {
        expect(interpreter.evaluate("new Date(2020, 0, 1).getMonth()")).toBe(0);
        expect(interpreter.evaluate("new Date(2020, 11, 31).getMonth()")).toBe(11);
      });

      it("getDate should return day of month", () => {
        expect(interpreter.evaluate("new Date(2020, 0, 15).getDate()")).toBe(15);
      });

      it("getTime should return timestamp", () => {
        expect(interpreter.evaluate("new Date(0).getTime()")).toBe(0);
      });
    });

    describe("toISOString", () => {
      it("should return ISO format string", () => {
        expect(interpreter.evaluate("new Date(0).toISOString()")).toBe("1970-01-01T00:00:00.000Z");
      });
    });

    describe("Date comparison", () => {
      it("should compare dates with getTime", () => {
        expect(
          interpreter.evaluate(`
          var d1 = new Date(2020, 0, 1);
          var d2 = new Date(2020, 0, 2);
          d1.getTime() < d2.getTime()
        `),
        ).toBe(true);
      });
    });
  });
});
