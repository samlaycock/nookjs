import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";
import { sanitizeErrorStack } from "../src/readonly-proxy";

describe("Security Options", () => {
  describe("Error Stack Sanitization", () => {
    it("should sanitize error stacks by default", async () => {
      const interpreter = new Interpreter({
        globals: { Error },
      });

      const stack = await interpreter.evaluateAsync(`
        const e = new Error('test');
        e.stack
      `);

      // Should not contain host file paths
      expect(stack).not.toContain("/Users/");
      expect(stack).not.toContain("interpreter.ts");
      expect(stack).not.toContain("readonly-proxy.ts");

      // Should contain sanitized markers
      expect(stack).toContain("[native code]");
    });

    it("should allow disabling error stack sanitization", async () => {
      const interpreter = new Interpreter({
        globals: { Error },
        security: { sanitizeErrors: false },
      });

      const stack = await interpreter.evaluateAsync(`
        const e = new Error('test');
        e.stack
      `);

      // Should contain actual file paths when disabled
      expect(stack).toContain("interpreter.ts");
    });

    it("should sanitize stacks from errors created in sandbox", async () => {
      const interpreter = new Interpreter({
        globals: { Error },
      });

      // Create error and access stack - the stack should be sanitized
      const stack = await interpreter.evaluateAsync(`
        const e = new Error('created in sandbox');
        e.stack
      `);

      expect(stack).not.toContain("/Users/");
      expect(stack).toContain("[native code]");
    });
  });

  describe("Host Error Message Hiding", () => {
    it("should hide host error messages by default", () => {
      const interpreter = new Interpreter({
        globals: {
          throwError: () => {
            throw new Error("sensitive information here");
          },
        },
      });

      expect(() => {
        interpreter.evaluate("throwError()");
      }).toThrow("[error details hidden]");
    });

    it("should show host error messages when configured", () => {
      const interpreter = new Interpreter({
        globals: {
          throwError: () => {
            throw new Error("sensitive information here");
          },
        },
        security: { hideHostErrorMessages: false },
      });

      expect(() => {
        interpreter.evaluate("throwError()");
      }).toThrow("sensitive information here");
    });

    it("should hide constructor error messages when configured", async () => {
      const interpreter = new Interpreter({
        globals: {
          BadClass: class {
            constructor() {
              throw new Error("secret constructor error");
            }
          },
        },
        security: { hideHostErrorMessages: true },
      });

      await expect(interpreter.evaluateAsync("new BadClass()")).rejects.toThrow(
        "[error details hidden]",
      );
    });

    it("should hide async host function errors when configured", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncThrow: async () => {
            throw new Error("async secret");
          },
        },
        security: { hideHostErrorMessages: true },
      });

      await expect(
        interpreter.evaluateAsync("await asyncThrow()"),
      ).rejects.toThrow("[error details hidden]");
    });
  });

  describe("valueOf Security", () => {
    it("should not call custom valueOf on host objects", () => {
      let customCalled = false;
      const interpreter = new Interpreter({
        globals: {
          obj: {
            valueOf: () => {
              customCalled = true;
              return "leaked!";
            },
          },
        },
      });

      interpreter.evaluate("obj.valueOf()");
      expect(customCalled).toBe(false);
    });

    it("should return wrapped proxy from valueOf", () => {
      const secret = { password: "admin123" };
      const interpreter = new Interpreter({
        globals: {
          obj: {
            valueOf: () => secret,
          },
        },
      });

      // The result should be a wrapped proxy of obj, not the secret
      const result = interpreter.evaluate("obj.valueOf()");

      // Should not be the secret object
      expect(result).not.toBe(secret);

      // Should be read-only
      expect(() => {
        interpreter.evaluate("obj.valueOf().x = 1");
      }).toThrow("read-only");
    });

    it("should correctly handle valueOf for Number wrapper", () => {
      const interpreter = new Interpreter({
        globals: {
          num: new Number(42),
        },
      });

      const result = interpreter.evaluate("num.valueOf()");
      expect(result).toBe(42);
    });

    it("should correctly handle valueOf for String wrapper", () => {
      const interpreter = new Interpreter({
        globals: {
          str: new String("hello"),
        },
      });

      const result = interpreter.evaluate("str.valueOf()");
      expect(result).toBe("hello");
    });

    it("should correctly handle valueOf for Boolean wrapper", () => {
      const interpreter = new Interpreter({
        globals: {
          bool: new Boolean(true),
        },
      });

      const result = interpreter.evaluate("bool.valueOf()");
      expect(result).toBe(true);
    });

    it("should correctly handle valueOf for Date", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const interpreter = new Interpreter({
        globals: { date },
      });

      const result = interpreter.evaluate("date.valueOf()");
      expect(result).toBe(date.getTime());
    });
  });

  describe("sanitizeErrorStack function", () => {
    it("should remove Unix absolute paths", () => {
      const input = `Error: test
    at foo (/home/user/project/file.ts:123:45)
    at bar (/Users/dev/code/app.js:10:5)`;

      const result = sanitizeErrorStack(input);

      expect(result).not.toContain("/home/user");
      expect(result).not.toContain("/Users/dev");
      expect(result).toContain("[native code]");
    });

    it("should remove file:// URLs", () => {
      const input = `Error: test
    at foo (file:///home/user/project/file.ts:123:45)`;

      const result = sanitizeErrorStack(input);

      expect(result).not.toContain("file://");
      expect(result).toContain("[native code]");
    });

    it("should preserve the error message line", () => {
      const input = `Error: my error message
    at foo (/path/to/file.ts:1:1)`;

      const result = sanitizeErrorStack(input);

      expect(result).toContain("Error: my error message");
    });

    it("should handle empty/undefined input", () => {
      expect(sanitizeErrorStack(undefined)).toBe("");
      expect(sanitizeErrorStack("")).toBe("");
    });
  });
});
