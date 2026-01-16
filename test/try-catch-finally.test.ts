import { describe, it, expect } from "bun:test";
import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Try/Catch/Finally", () => {
  describe("Basic try/catch", () => {
    it("should catch thrown errors", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = "not caught";
        try {
          throw "error!";
        } catch (e) {
          result = "caught: " + e;
        }
        result;
      `);
      expect(result).toContain("caught:");
    });

    it("should execute try block when no error", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = "";
        try {
          result = "success";
        } catch (e) {
          result = "error";
        }
        result;
      `);
      expect(result).toBe("success");
    });

    it("should bind error to catch parameter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        try {
          throw "my error";
        } catch (e) {
          e;
        }
      `);
      expect(result).toBeInstanceOf(InterpreterError);
      expect(String(result)).toContain("my error");
    });

    it("should support catch without parameter (ES2019)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let caught = false;
        try {
          throw "error";
        } catch {
          caught = true;
        }
        caught;
      `);
      expect(result).toBe(true);
    });

    it("should have proper scope for catch parameter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let e = "outer";
        try {
          throw "inner error";
        } catch (e) {
          // e is the error here
        }
        e; // Should be outer again
      `);
      expect(result).toBe("outer");
    });
  });

  describe("Try/finally without catch", () => {
    it("should execute finally block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = "";
        try {
          result = "try";
        } finally {
          result = result + " finally";
        }
        result;
      `);
      expect(result).toBe("try finally");
    });

    it("should execute finally even when error is thrown", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let result = "start";
        try {
          try {
            throw "error";
          } finally {
            result = "finally executed";
          }
        } catch (e) {
          // Catch outer error
        }
        result;
      `);
      expect(result).toBe("finally executed");
    });
  });

  describe("Try/catch/finally", () => {
    it("should execute all blocks when no error", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let log = [];
        try {
          log.push("try");
        } catch (e) {
          log.push("catch");
        } finally {
          log.push("finally");
        }
        log;
      `);
      expect(result).toEqual(["try", "finally"]);
    });

    it("should execute catch and finally when error thrown", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let log = [];
        try {
          log.push("try");
          throw "error";
        } catch (e) {
          log.push("catch");
        } finally {
          log.push("finally");
        }
        log;
      `);
      expect(result).toEqual(["try", "catch", "finally"]);
    });

    it("should execute finally even if catch throws", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let finallyCalled = false;
          try {
            throw "first error";
          } catch (e) {
            throw "second error";
          } finally {
            finallyCalled = true;
          }
        `);
      }).toThrow();

      // Verify finally was called by checking the variable
      const wasFinallyCalled = interpreter.evaluate("finallyCalled");
      expect(wasFinallyCalled).toBe(true);
    });
  });

  describe("Control flow in try/catch/finally", () => {
    it("should handle return in try block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          try {
            return "from try";
          } catch (e) {
            return "from catch";
          } finally {
            // Finally executes but doesn't override return
          }
        }
        test();
      `);
      expect(result).toBe("from try");
    });

    it("should handle return in catch block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          try {
            throw "error";
          } catch (e) {
            return "from catch";
          } finally {
            // Finally executes but doesn't override return
          }
        }
        test();
      `);
      expect(result).toBe("from catch");
    });

    it("should override return with finally return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function test() {
          try {
            return "from try";
          } finally {
            return "from finally";
          }
        }
        test();
      `);
      expect(result).toBe("from finally");
    });

    it("should handle break in try block within loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let i = 0;
        while (true) {
          try {
            i++;
            if (i === 3) break;
          } finally {
            // Finally executes before break
          }
        }
        i;
      `);
      expect(result).toBe(3);
    });

    it("should handle continue in try block within loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        for (let i = 0; i < 5; i++) {
          try {
            if (i === 2) continue;
            count++;
          } finally {
            // Finally executes even with continue
          }
        }
        count;
      `);
      expect(result).toBe(4); // Skipped i=2
    });

    it("should handle break in finally (overrides try)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let i = 0;
        while (i < 10) {
          try {
            i++;
          } finally {
            if (i === 3) break;
          }
        }
        i;
      `);
      expect(result).toBe(3);
    });
  });

  describe("Nested try/catch", () => {
    it("should handle nested try/catch blocks", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let log = [];
        try {
          log.push("outer try");
          try {
            log.push("inner try");
            throw "inner error";
          } catch (e) {
            log.push("inner catch");
          }
          log.push("after inner");
        } catch (e) {
          log.push("outer catch");
        }
        log;
      `);
      expect(result).toEqual([
        "outer try",
        "inner try",
        "inner catch",
        "after inner",
      ]);
    });

    it("should propagate uncaught errors to outer catch", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let log = [];
        try {
          log.push("outer try");
          try {
            log.push("inner try");
            throw "error";
          } finally {
            log.push("inner finally");
          }
        } catch (e) {
          log.push("outer catch");
        }
        log;
      `);
      expect(result).toEqual([
        "outer try",
        "inner try",
        "inner finally",
        "outer catch",
      ]);
    });
  });

  describe("Error types", () => {
    it("should throw string errors", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`throw "string error";`);
      }).toThrow("Uncaught string error");
    });

    it("should throw number errors", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`throw 42;`);
      }).toThrow("Uncaught 42");
    });

    it("should throw object errors", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let caught = null;
        try {
          throw { message: "error", code: 500 };
        } catch (e) {
          caught = e;
        }
        caught;
      `);
      expect(result).toBeInstanceOf(InterpreterError);
      expect(String(result)).toContain("[object Object]");
    });

    it("should catch interpreter errors", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let caught = false;
        try {
          let x = undefinedVariable; // This will throw InterpreterError
        } catch (e) {
          caught = true;
        }
        caught;
      `);
      expect(result).toBe(true);
    });
  });

  describe("Try/catch with expressions", () => {
    it("should evaluate throw expressions", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let x = 5;
          throw x * 2;
        `);
      }).toThrow("Uncaught 10");
    });

    it("should catch and use error in expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        try {
          throw 100;
        } catch (e) {
          e;
        }
      `);
      expect(result).toBeInstanceOf(InterpreterError);
      expect(String(result)).toContain("100");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty try block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 1;
        try {
        } catch (e) {
          x = 2;
        }
        x;
      `);
      expect(result).toBe(1);
    });

    it("should handle empty catch block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 1;
        try {
          throw "error";
        } catch (e) {
        }
        x;
      `);
      expect(result).toBe(1);
    });

    it("should handle empty finally block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let x = 1;
        try {
          x = 2;
        } finally {
        }
        x;
      `);
      expect(result).toBe(2);
    });

    it("should handle multiple statements in each block", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let log = [];
        try {
          log.push(1);
          log.push(2);
          throw "error";
          log.push(3); // Not executed
        } catch (e) {
          log.push(4);
          log.push(5);
        } finally {
          log.push(6);
          log.push(7);
        }
        log;
      `);
      expect(result).toEqual([1, 2, 4, 5, 6, 7]);
    });
  });

  describe("Async try/catch/finally", () => {
    it("should catch errors in async code", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let result = "";
        try {
          throw "async error";
        } catch (e) {
          result = "caught";
        }
        result;
      `);
      expect(result).toBe("caught");
    });

    it("should execute finally in async code", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let log = [];
        try {
          log.push("try");
        } catch (e) {
          log.push("catch");
        } finally {
          log.push("finally");
        }
        log;
      `);
      expect(result).toEqual(["try", "finally"]);
    });

    it("should handle async functions with try/catch", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function test() {
          try {
            throw "error";
          } catch (e) {
            return "caught";
          }
        }
        test()
      `);
      expect(result).toBe("caught");
    });

    it("should handle return in async try/catch", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function test() {
          try {
            return "success";
          } finally {
            // Finally executes
          }
        }
        test()
      `);
      expect(result).toBe("success");
    });

    it("should handle await in try/catch", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function fetchData() {
          return "data";
        }
        async function process() {
          let result = "";
          try {
            result = await fetchData();
          } catch (e) {
            result = "error";
          }
          return result;
        }
        process()
      `);
      expect(result).toBe("data");
    });
  });
});
