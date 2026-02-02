import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5 } from "../src/presets";

describe("Global Utilities", () => {
  describe("ES5", () => {
    describe("encodeURI", () => {
      it("should encode URI components", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURI("hello world")')).toBe("hello%20world");
      });

      it("should preserve URI structure characters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURI("https://example.com")')).toContain("https://");
      });

      it("should preserve query string delimiters", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate('encodeURI("https://example.com?a=1&b=2")');
        expect(result).toContain("?a=1&b=2");
      });

      it("should preserve fragment identifiers", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate('encodeURI("https://example.com#section")');
        expect(result).toContain("#section");
      });

      it("should encode unicode characters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURI("✓")')).toBe("%E2%9C%93");
      });

      it("should round-trip through decodeURI", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate('decodeURI(encodeURI("https://example.com/a b"))');
        expect(result).toBe("https://example.com/a b");
      });
    });

    describe("decodeURI", () => {
      it("should decode URI components", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURI("hello%20world")')).toBe("hello world");
      });

      it("should decode spaces", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURI("a%20b")')).toBe("a b");
      });

      it("should leave encoded fragment identifiers intact", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate('decodeURI("https://example.com%23section")');
        expect(result).toBe("https://example.com%23section");
      });

      it("should decode unicode characters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURI("%E2%9C%93")')).toBe("✓");
      });
    });

    describe("encodeURIComponent", () => {
      it("should encode all special characters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("a:b/c")')).toBe("a%3Ab%2Fc");
      });

      it("should encode unicode characters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("✓")')).toBe("%E2%9C%93");
      });

      it("should encode spaces as %20", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("a b")')).toBe("a%20b");
      });

      it("should encode plus sign", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("a+b")')).toBe("a%2Bb");
      });

      it("should not encode tilde", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("~")')).toBe("~");
      });

      it("should encode query delimiters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('encodeURIComponent("a=b&c")')).toBe("a%3Db%26c");
      });
    });

    describe("decodeURIComponent", () => {
      it("should decode URI component", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURIComponent("a%3Ab%2Fc")')).toBe("a:b/c");
      });

      it("should decode plus sign", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURIComponent("%2B")')).toBe("+");
      });

      it("should decode spaces", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURIComponent("%20")')).toBe(" ");
      });

      it("should round-trip through encodeURIComponent", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURIComponent(encodeURIComponent("a+b=c"))')).toBe(
          "a+b=c",
        );
      });

      it("should decode encoded query delimiters", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate('decodeURIComponent("a%3Db%26c")')).toBe("a=b&c");
      });
    });
  });
});
