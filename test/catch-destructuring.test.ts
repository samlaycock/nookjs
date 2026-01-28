import { describe, it, expect } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Destructuring in catch clauses", () => {
  describe("Object destructuring", () => {
    it("should destructure error object properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let msg = "";
        try {
          throw { message: "oops", code: 42 };
        } catch ({ message, code }) {
          msg = message + ":" + code;
        }
        msg;
      `);
      expect(result).toBe("oops:42");
    });

    it("should destructure with renaming", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw { message: "fail", status: 500 };
        } catch ({ message: msg, status: s }) {
          out = msg + ":" + s;
        }
        out;
      `);
      expect(result).toBe("fail:500");
    });

    it("should destructure with default values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw { message: "err" };
        } catch ({ message, code = 0 }) {
          out = message + ":" + code;
        }
        out;
      `);
      expect(result).toBe("err:0");
    });

    it("should destructure nested objects", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw { error: { message: "deep", code: 1 } };
        } catch ({ error: { message, code } }) {
          out = message + ":" + code;
        }
        out;
      `);
      expect(result).toBe("deep:1");
    });
  });

  describe("Array destructuring", () => {
    it("should destructure error as array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw ["a", "b", "c"];
        } catch ([first, second, third]) {
          out = first + second + third;
        }
        out;
      `);
      expect(result).toBe("abc");
    });

    it("should destructure with skipped elements", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw [1, 2, 3];
        } catch ([, second]) {
          out = "" + second;
        }
        out;
      `);
      expect(result).toBe("2");
    });

    it("should destructure with rest element", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let first, rest;
        try {
          throw [1, 2, 3, 4];
        } catch ([f, ...r]) {
          first = f;
          rest = r;
        }
        "" + first + ":" + rest;
      `);
      expect(result).toBe("1:2,3,4");
    });
  });

  describe("Async catch destructuring", () => {
    it("should destructure in async catch clause", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let msg = "";
        try {
          throw { message: "async-err", code: 99 };
        } catch ({ message, code }) {
          msg = message + ":" + code;
        }
        msg;
      `);
      expect(result).toBe("async-err:99");
    });

    it("should destructure array in async catch clause", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let out = "";
        try {
          throw ["x", "y"];
        } catch ([a, b]) {
          out = a + b;
        }
        out;
      `);
      expect(result).toBe("xy");
    });
  });

  describe("Edge cases", () => {
    it("should still work with simple identifier catch param", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "";
        try {
          throw "simple";
        } catch (e) {
          out = e;
        }
        out;
      `);
      // Simple identifier catch param receives the InterpreterError wrapper
      expect(result).toBeInstanceOf(InterpreterError);
      expect(String(result)).toContain("simple");
    });

    it("should still work with no catch param", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let out = "before";
        try {
          throw "ignored";
        } catch {
          out = "caught";
        }
        out;
      `);
      expect(result).toBe("caught");
    });
  });
});
