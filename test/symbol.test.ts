import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2015 } from "../src/presets";

describe("Symbol", () => {
  describe("ES2015", () => {
    describe("Symbol creation", () => {
      it("should expose Symbol as a global", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol")).toBe("function");
      });

      it("should create symbols with Symbol()", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol()")).toBe("symbol");
        expect(interpreter.evaluate("typeof Symbol('test')")).toBe("symbol");
      });

      it("should create unique symbols", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Symbol() === Symbol()")).toBe(false);
        expect(interpreter.evaluate("Symbol('a') === Symbol('a')")).toBe(false);
      });
    });

    describe("Symbol.for and Symbol.keyFor", () => {
      it("should support Symbol.for for global symbol registry", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Symbol.for('shared') === Symbol.for('shared')")).toBe(true);
      });

      it("should support Symbol.keyFor to retrieve key", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Symbol.keyFor(Symbol.for('myKey'))")).toBe("myKey");
      });

      it("should return undefined for non-global symbols", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Symbol.keyFor(Symbol('local'))")).toBe(undefined);
      });
    });

    describe("Well-known symbols", () => {
      it("should expose Symbol.iterator", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol.iterator")).toBe("symbol");
      });

      it("should allow accessing Symbol.iterator on arrays", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof [1,2,3][Symbol.iterator]")).toBe("function");
      });

      it("should expose Symbol.asyncIterator", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol.asyncIterator")).toBe("symbol");
      });

      it("should be Symbol.hasInstance", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Symbol.hasInstance")).toBe(Symbol.hasInstance);
      });

      it("should work with instanceof", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("[] instanceof Array")).toBe(true);
      });

      it("should expose Symbol.toStringTag", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol.toStringTag")).toBe("symbol");
      });

      it("should exist", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol.toStringTag")).toBe("symbol");
      });
    });

    describe("Symbols as object keys", () => {
      it("should allow symbols as object property keys", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const key = Symbol('myKey');
          const obj = {};
          obj[key] = 'value';
          obj[key];
        `);
        expect(result).toBe("value");
      });

      it("should keep symbol properties separate from string properties", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const sym = Symbol('name');
          const obj = { name: 'string', [sym]: 'symbol' };
          obj.name + ':' + obj[sym];
        `);
        expect(result).toBe("string:symbol");
      });
    });

    describe("Symbol in expressions", () => {
      it("should work in typeof expressions", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("typeof Symbol('test')")).toBe("symbol");
      });

      it("should work in equality comparisons", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const s1 = Symbol('a');
          const s2 = s1;
          s1 === s2;
        `);
        expect(result).toBe(true);
      });
    });
  });
});
