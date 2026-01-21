import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Optional Chaining", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Optional property access (?.)", () => {
    test("returns property value when object exists", () => {
      interpreter.evaluate("let obj = { a: 1 }");
      expect(interpreter.evaluate("obj?.a")).toBe(1);
    });

    test("returns undefined when object is null", () => {
      interpreter.evaluate("let obj = null");
      expect(interpreter.evaluate("obj?.a")).toBe(undefined);
    });

    test("returns undefined when object is undefined", () => {
      interpreter.evaluate("let obj = undefined");
      expect(interpreter.evaluate("obj?.a")).toBe(undefined);
    });

    test("works with nested optional access", () => {
      interpreter.evaluate("let obj = { a: { b: { c: 42 } } }");
      expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(42);
    });

    test("short-circuits on first null in chain", () => {
      interpreter.evaluate("let obj = { a: null }");
      expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(undefined);
    });

    test("short-circuits on first undefined in chain", () => {
      interpreter.evaluate("let obj = { a: undefined }");
      expect(interpreter.evaluate("obj?.a?.b?.c")).toBe(undefined);
    });

    test("works with non-optional access after optional", () => {
      interpreter.evaluate("let obj = { a: { b: 1 } }");
      expect(interpreter.evaluate("obj?.a.b")).toBe(1);
    });

    test("returns undefined for missing nested property", () => {
      interpreter.evaluate("let obj = { a: 1 }");
      expect(interpreter.evaluate("obj?.b?.c")).toBe(undefined);
    });
  });

  describe("Optional computed property access (?.[key])", () => {
    test("returns property value when object exists", () => {
      interpreter.evaluate("let obj = { a: 1 }");
      expect(interpreter.evaluate("obj?.['a']")).toBe(1);
    });

    test("returns undefined when object is null", () => {
      interpreter.evaluate("let obj = null");
      expect(interpreter.evaluate("obj?.['a']")).toBe(undefined);
    });

    test("returns undefined when object is undefined", () => {
      interpreter.evaluate("let obj = undefined");
      expect(interpreter.evaluate("obj?.['a']")).toBe(undefined);
    });

    test("works with dynamic keys", () => {
      interpreter.evaluate("let obj = { foo: 'bar' }");
      interpreter.evaluate("let key = 'foo'");
      expect(interpreter.evaluate("obj?.[key]")).toBe("bar");
    });

    test("works with array indexing", () => {
      interpreter.evaluate("let arr = [1, 2, 3]");
      expect(interpreter.evaluate("arr?.[1]")).toBe(2);
    });

    test("returns undefined for null array", () => {
      interpreter.evaluate("let arr = null");
      expect(interpreter.evaluate("arr?.[0]")).toBe(undefined);
    });
  });

  describe("Optional method call (?.())", () => {
    test("calls method when it exists", () => {
      interpreter.evaluate("let obj = { fn: function() { return 42; } }");
      expect(interpreter.evaluate("obj.fn?.()")).toBe(42);
    });

    test("returns undefined when method is null", () => {
      interpreter.evaluate("let obj = { fn: null }");
      expect(interpreter.evaluate("obj.fn?.()")).toBe(undefined);
    });

    test("returns undefined when method is undefined", () => {
      interpreter.evaluate("let obj = {}");
      expect(interpreter.evaluate("obj.fn?.()")).toBe(undefined);
    });

    test("works with optional object and method call", () => {
      interpreter.evaluate("let obj = { fn: function() { return 'hello'; } }");
      expect(interpreter.evaluate("obj?.fn?.()")).toBe("hello");
    });

    test("short-circuits when object is null", () => {
      interpreter.evaluate("let obj = null");
      expect(interpreter.evaluate("obj?.fn?.()")).toBe(undefined);
    });

    test("passes arguments correctly", () => {
      interpreter.evaluate(
        "let obj = { add: function(a, b) { return a + b; } }",
      );
      expect(interpreter.evaluate("obj.add?.(2, 3)")).toBe(5);
    });
  });

  describe("Mixed optional chaining", () => {
    test("combines property access and method calls", () => {
      interpreter.evaluate(`
        let obj = {
          nested: {
            getValue: function() { return 100; }
          }
        }
      `);
      expect(interpreter.evaluate("obj?.nested?.getValue?.()")).toBe(100);
    });

    test("short-circuits entire chain on null", () => {
      interpreter.evaluate("let obj = { nested: null }");
      expect(interpreter.evaluate("obj?.nested?.getValue?.()")).toBe(undefined);
    });

    test("works with computed and dot access mixed", () => {
      interpreter.evaluate("let obj = { a: { b: [1, 2, 3] } }");
      expect(interpreter.evaluate("obj?.a?.b?.[2]")).toBe(3);
    });

    test("works with method returning object", () => {
      interpreter.evaluate(`
        let obj = {
          getInner: function() {
            return { value: 42 };
          }
        }
      `);
      expect(interpreter.evaluate("obj?.getInner?.()?.value")).toBe(42);
    });
  });

  describe("Edge cases", () => {
    test("works with falsy but non-nullish values", () => {
      interpreter.evaluate("let obj = { a: 0 }");
      expect(interpreter.evaluate("obj?.a")).toBe(0);

      interpreter.evaluate("let obj2 = { a: '' }");
      expect(interpreter.evaluate("obj2?.a")).toBe("");

      interpreter.evaluate("let obj3 = { a: false }");
      expect(interpreter.evaluate("obj3?.a")).toBe(false);
    });

    test("does not short-circuit on falsy non-nullish values", () => {
      // 0 is falsy but not nullish, so optional chaining should NOT short-circuit
      interpreter.evaluate("let obj = { a: { value: 0 } }");
      expect(interpreter.evaluate("obj?.a?.value")).toBe(0);

      // Empty string is falsy but not nullish
      interpreter.evaluate("let obj2 = { a: { value: '' } }");
      expect(interpreter.evaluate("obj2?.a?.value")).toBe("");

      // false is falsy but not nullish
      interpreter.evaluate("let obj3 = { a: { value: false } }");
      expect(interpreter.evaluate("obj3?.a?.value")).toBe(false);
    });

    test("works in conditional expressions", () => {
      interpreter.evaluate("let obj = null");
      expect(interpreter.evaluate("obj?.a ? 'yes' : 'no'")).toBe("no");

      interpreter.evaluate("let obj2 = { a: true }");
      expect(interpreter.evaluate("obj2?.a ? 'yes' : 'no'")).toBe("yes");
    });

    test("works with nullish coalescing", () => {
      interpreter.evaluate("let obj = null");
      expect(interpreter.evaluate("obj?.a ?? 'default'")).toBe("default");

      interpreter.evaluate("let obj2 = { a: null }");
      expect(interpreter.evaluate("obj2?.a ?? 'default'")).toBe("default");

      interpreter.evaluate("let obj3 = { a: 'value' }");
      expect(interpreter.evaluate("obj3?.a ?? 'default'")).toBe("value");
    });

    test("works with logical OR assignment", () => {
      interpreter.evaluate("let obj = { a: null }");
      interpreter.evaluate("obj.a ||= 'default'");
      expect(interpreter.evaluate("obj?.a")).toBe("default");
    });
  });

  describe("Practical examples", () => {
    test("safe property access in config objects", () => {
      interpreter.evaluate(`
        let config = {
          database: {
            host: 'localhost',
            port: 5432
          }
        }
      `);
      expect(interpreter.evaluate("config?.database?.host")).toBe("localhost");
      expect(interpreter.evaluate("config?.cache?.host")).toBe(undefined);
    });

    test("safe method calls on potentially undefined objects", () => {
      interpreter.evaluate(`
        let user = null;
        let result = user?.getName?.() ?? 'Anonymous';
      `);
      expect(interpreter.evaluate("result")).toBe("Anonymous");
    });

    test("accessing deeply nested optional data", () => {
      interpreter.evaluate(`
        let response = {
          data: {
            users: [
              { name: 'Alice', profile: { age: 30 } },
              { name: 'Bob', profile: null }
            ]
          }
        }
      `);
      expect(
        interpreter.evaluate("response?.data?.users?.[0]?.profile?.age"),
      ).toBe(30);
      expect(
        interpreter.evaluate("response?.data?.users?.[1]?.profile?.age"),
      ).toBe(undefined);
      expect(
        interpreter.evaluate("response?.data?.users?.[2]?.profile?.age"),
      ).toBe(undefined);
    });
  });
});

describe("Optional Chaining (Async)", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  test("works with async evaluation", async () => {
    await interpreter.evaluateAsync("let obj = { a: { b: 42 } }");
    const result = await interpreter.evaluateAsync("obj?.a?.b");
    expect(result).toBe(42);
  });

  test("returns undefined for null in async context", async () => {
    await interpreter.evaluateAsync("let obj = null");
    const result = await interpreter.evaluateAsync("obj?.a?.b");
    expect(result).toBe(undefined);
  });

  test("works with async method calls", async () => {
    await interpreter.evaluateAsync(`
      let obj = {
        getValue: function() { return 100; }
      }
    `);
    const result = await interpreter.evaluateAsync("obj?.getValue?.()");
    expect(result).toBe(100);
  });

  test("short-circuits in async context", async () => {
    await interpreter.evaluateAsync("let obj = { a: null }");
    const result = await interpreter.evaluateAsync("obj?.a?.b?.c");
    expect(result).toBe(undefined);
  });
});
