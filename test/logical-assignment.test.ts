import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Logical Assignment Operators", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("Nullish Coalescing Operator (??)", () => {
    test("returns left when left is truthy", () => {
      expect(interpreter.evaluate("5 ?? 10")).toBe(5);
      expect(interpreter.evaluate("'hello' ?? 'world'")).toBe("hello");
      expect(interpreter.evaluate("true ?? false")).toBe(true);
    });

    test("returns left when left is falsy but not nullish", () => {
      expect(interpreter.evaluate("0 ?? 10")).toBe(0);
      expect(interpreter.evaluate("'' ?? 'default'")).toBe("");
      expect(interpreter.evaluate("false ?? true")).toBe(false);
    });

    test("returns right when left is null", () => {
      expect(interpreter.evaluate("null ?? 'default'")).toBe("default");
      expect(interpreter.evaluate("null ?? 42")).toBe(42);
    });

    test("returns right when left is undefined", () => {
      interpreter.evaluate("let x");
      expect(interpreter.evaluate("x ?? 'default'")).toBe("default");
      expect(interpreter.evaluate("undefined ?? 42")).toBe(42);
    });

    test("short-circuits evaluation", () => {
      interpreter.evaluate("let counter = 0");
      interpreter.evaluate(
        "let getValue = function() { counter = counter + 1; return 'evaluated'; }",
      );
      interpreter.evaluate("let result = 'existing' ?? getValue()");
      expect(interpreter.evaluate("counter")).toBe(0);
      expect(interpreter.evaluate("result")).toBe("existing");
    });

    test("chains correctly", () => {
      expect(interpreter.evaluate("null ?? undefined ?? 'final'")).toBe(
        "final",
      );
      expect(interpreter.evaluate("null ?? 'middle' ?? 'final'")).toBe(
        "middle",
      );
    });

    test("works with variables", () => {
      interpreter.evaluate("let a = null");
      interpreter.evaluate("let b = 'value'");
      expect(interpreter.evaluate("a ?? b")).toBe("value");
    });
  });

  describe("Logical OR Assignment (||=)", () => {
    test("assigns when variable is falsy", () => {
      interpreter.evaluate("let x = 0");
      interpreter.evaluate("x ||= 10");
      expect(interpreter.evaluate("x")).toBe(10);
    });

    test("does not assign when variable is truthy", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("x ||= 10");
      expect(interpreter.evaluate("x")).toBe(5);
    });

    test("assigns when variable is null", () => {
      interpreter.evaluate("let x = null");
      interpreter.evaluate("x ||= 'default'");
      expect(interpreter.evaluate("x")).toBe("default");
    });

    test("assigns when variable is undefined", () => {
      interpreter.evaluate("let x");
      interpreter.evaluate("x ||= 'default'");
      expect(interpreter.evaluate("x")).toBe("default");
    });

    test("assigns when variable is empty string", () => {
      interpreter.evaluate("let x = ''");
      interpreter.evaluate("x ||= 'default'");
      expect(interpreter.evaluate("x")).toBe("default");
    });

    test("assigns when variable is false", () => {
      interpreter.evaluate("let x = false");
      interpreter.evaluate("x ||= true");
      expect(interpreter.evaluate("x")).toBe(true);
    });

    test("short-circuits when truthy", () => {
      interpreter.evaluate("let counter = 0");
      interpreter.evaluate(
        "let getValue = function() { counter = counter + 1; return 'new'; }",
      );
      interpreter.evaluate("let x = 'existing'");
      interpreter.evaluate("x ||= getValue()");
      expect(interpreter.evaluate("counter")).toBe(0);
      expect(interpreter.evaluate("x")).toBe("existing");
    });

    test("returns the assigned value", () => {
      interpreter.evaluate("let x = 0");
      expect(interpreter.evaluate("x ||= 42")).toBe(42);
    });

    test("returns existing value when not assigned", () => {
      interpreter.evaluate("let x = 5");
      expect(interpreter.evaluate("x ||= 42")).toBe(5);
    });

    test("works with object properties", () => {
      interpreter.evaluate("let obj = { a: 0, b: 5 }");
      interpreter.evaluate("obj.a ||= 10");
      interpreter.evaluate("obj.b ||= 10");
      expect(interpreter.evaluate("obj.a")).toBe(10);
      expect(interpreter.evaluate("obj.b")).toBe(5);
    });

    test("works with computed properties", () => {
      interpreter.evaluate("let obj = { x: null }");
      interpreter.evaluate("obj['x'] ||= 'default'");
      expect(interpreter.evaluate("obj.x")).toBe("default");
    });

    test("works with array elements", () => {
      interpreter.evaluate("let arr = [0, 5, null]");
      interpreter.evaluate("arr[0] ||= 10");
      interpreter.evaluate("arr[1] ||= 10");
      interpreter.evaluate("arr[2] ||= 'default'");
      expect(interpreter.evaluate("arr[0]")).toBe(10);
      expect(interpreter.evaluate("arr[1]")).toBe(5);
      expect(interpreter.evaluate("arr[2]")).toBe("default");
    });
  });

  describe("Logical AND Assignment (&&=)", () => {
    test("assigns when variable is truthy", () => {
      interpreter.evaluate("let x = 5");
      interpreter.evaluate("x &&= 10");
      expect(interpreter.evaluate("x")).toBe(10);
    });

    test("does not assign when variable is falsy", () => {
      interpreter.evaluate("let x = 0");
      interpreter.evaluate("x &&= 10");
      expect(interpreter.evaluate("x")).toBe(0);
    });

    test("does not assign when variable is null", () => {
      interpreter.evaluate("let x = null");
      interpreter.evaluate("x &&= 'value'");
      expect(interpreter.evaluate("x")).toBe(null);
    });

    test("does not assign when variable is undefined", () => {
      interpreter.evaluate("let x");
      interpreter.evaluate("x &&= 'value'");
      expect(interpreter.evaluate("x")).toBe(undefined);
    });

    test("does not assign when variable is false", () => {
      interpreter.evaluate("let x = false");
      interpreter.evaluate("x &&= true");
      expect(interpreter.evaluate("x")).toBe(false);
    });

    test("short-circuits when falsy", () => {
      interpreter.evaluate("let counter = 0");
      interpreter.evaluate(
        "let getValue = function() { counter = counter + 1; return 'new'; }",
      );
      interpreter.evaluate("let x = null");
      interpreter.evaluate("x &&= getValue()");
      expect(interpreter.evaluate("counter")).toBe(0);
      expect(interpreter.evaluate("x")).toBe(null);
    });

    test("returns the assigned value", () => {
      interpreter.evaluate("let x = 5");
      expect(interpreter.evaluate("x &&= 42")).toBe(42);
    });

    test("returns existing value when not assigned", () => {
      interpreter.evaluate("let x = 0");
      expect(interpreter.evaluate("x &&= 42")).toBe(0);
    });

    test("works with object properties", () => {
      interpreter.evaluate("let obj = { a: 5, b: 0 }");
      interpreter.evaluate("obj.a &&= 10");
      interpreter.evaluate("obj.b &&= 10");
      expect(interpreter.evaluate("obj.a")).toBe(10);
      expect(interpreter.evaluate("obj.b")).toBe(0);
    });

    test("works with computed properties", () => {
      interpreter.evaluate("let obj = { x: 'value' }");
      interpreter.evaluate("obj['x'] &&= 'updated'");
      expect(interpreter.evaluate("obj.x")).toBe("updated");
    });

    test("works with array elements", () => {
      interpreter.evaluate("let arr = [5, 0, 'hello']");
      interpreter.evaluate("arr[0] &&= 10");
      interpreter.evaluate("arr[1] &&= 10");
      interpreter.evaluate("arr[2] &&= 'world'");
      expect(interpreter.evaluate("arr[0]")).toBe(10);
      expect(interpreter.evaluate("arr[1]")).toBe(0);
      expect(interpreter.evaluate("arr[2]")).toBe("world");
    });
  });

  describe("Nullish Coalescing Assignment (??=)", () => {
    test("assigns when variable is null", () => {
      interpreter.evaluate("let x = null");
      interpreter.evaluate("x ??= 'default'");
      expect(interpreter.evaluate("x")).toBe("default");
    });

    test("assigns when variable is undefined", () => {
      interpreter.evaluate("let x");
      interpreter.evaluate("x ??= 'default'");
      expect(interpreter.evaluate("x")).toBe("default");
    });

    test("does not assign when variable is 0", () => {
      interpreter.evaluate("let x = 0");
      interpreter.evaluate("x ??= 10");
      expect(interpreter.evaluate("x")).toBe(0);
    });

    test("does not assign when variable is empty string", () => {
      interpreter.evaluate("let x = ''");
      interpreter.evaluate("x ??= 'default'");
      expect(interpreter.evaluate("x")).toBe("");
    });

    test("does not assign when variable is false", () => {
      interpreter.evaluate("let x = false");
      interpreter.evaluate("x ??= true");
      expect(interpreter.evaluate("x")).toBe(false);
    });

    test("does not assign when variable has a value", () => {
      interpreter.evaluate("let x = 'existing'");
      interpreter.evaluate("x ??= 'default'");
      expect(interpreter.evaluate("x")).toBe("existing");
    });

    test("short-circuits when not nullish", () => {
      interpreter.evaluate("let counter = 0");
      interpreter.evaluate(
        "let getValue = function() { counter = counter + 1; return 'new'; }",
      );
      interpreter.evaluate("let x = 0"); // falsy but not nullish
      interpreter.evaluate("x ??= getValue()");
      expect(interpreter.evaluate("counter")).toBe(0);
      expect(interpreter.evaluate("x")).toBe(0);
    });

    test("returns the assigned value", () => {
      interpreter.evaluate("let x = null");
      expect(interpreter.evaluate("x ??= 42")).toBe(42);
    });

    test("returns existing value when not assigned", () => {
      interpreter.evaluate("let x = 0");
      expect(interpreter.evaluate("x ??= 42")).toBe(0);
    });

    test("works with object properties", () => {
      interpreter.evaluate("let obj = { a: null, b: 0 }");
      interpreter.evaluate("obj.a ??= 'default'");
      interpreter.evaluate("obj.b ??= 'default'");
      expect(interpreter.evaluate("obj.a")).toBe("default");
      expect(interpreter.evaluate("obj.b")).toBe(0);
    });

    test("works with computed properties", () => {
      interpreter.evaluate("let obj = { x: undefined }");
      interpreter.evaluate("obj['x'] ??= 'default'");
      expect(interpreter.evaluate("obj.x")).toBe("default");
    });

    test("works with array elements", () => {
      interpreter.evaluate("let arr = [null, 0, undefined]");
      interpreter.evaluate("arr[0] ??= 'a'");
      interpreter.evaluate("arr[1] ??= 'b'");
      interpreter.evaluate("arr[2] ??= 'c'");
      expect(interpreter.evaluate("arr[0]")).toBe("a");
      expect(interpreter.evaluate("arr[1]")).toBe(0);
      expect(interpreter.evaluate("arr[2]")).toBe("c");
    });
  });

  describe("Practical Examples", () => {
    test("default value initialization with ??=", () => {
      interpreter.evaluate(`
        let config = { timeout: null, retries: 3 };
        config.timeout ??= 5000;
        config.retries ??= 5;
      `);
      expect(interpreter.evaluate("config.timeout")).toBe(5000);
      expect(interpreter.evaluate("config.retries")).toBe(3);
    });

    test("lazy initialization with ||=", () => {
      interpreter.evaluate(`
        let cache = {};
        function getOrCompute(key, compute) {
          cache[key] ||= compute();
          return cache[key];
        }
      `);
      interpreter.evaluate(
        "let result1 = getOrCompute('a', function() { return 42; })",
      );
      interpreter.evaluate(
        "let result2 = getOrCompute('a', function() { return 99; })",
      );
      expect(interpreter.evaluate("result1")).toBe(42);
      expect(interpreter.evaluate("result2")).toBe(42);
    });

    test("conditional update with &&=", () => {
      interpreter.evaluate(`
        let user = { name: 'Alice', permissions: null };
        user.name &&= user.name + ' (verified)';
        user.permissions &&= 'admin';
      `);
      expect(interpreter.evaluate("user.name")).toBe("Alice (verified)");
      expect(interpreter.evaluate("user.permissions")).toBe(null);
    });

    test("combining with other operators", () => {
      interpreter.evaluate("let a = null");
      interpreter.evaluate("let b = 0");
      interpreter.evaluate("let c = 5");

      interpreter.evaluate("a ??= b || c");
      expect(interpreter.evaluate("a")).toBe(5);
    });
  });
});

describe("Logical Assignment Operators (Async)", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  test("||= works with async evaluation", async () => {
    interpreter.evaluate("let x = 0");
    await interpreter.evaluateAsync("x ||= 10");
    expect(interpreter.evaluate("x")).toBe(10);
  });

  test("&&= works with async evaluation", async () => {
    interpreter.evaluate("let x = 5");
    await interpreter.evaluateAsync("x &&= 10");
    expect(interpreter.evaluate("x")).toBe(10);
  });

  test("??= works with async evaluation", async () => {
    interpreter.evaluate("let x = null");
    await interpreter.evaluateAsync("x ??= 'default'");
    expect(interpreter.evaluate("x")).toBe("default");
  });

  test("?? works with async evaluation", async () => {
    const result = await interpreter.evaluateAsync("null ?? 'default'");
    expect(result).toBe("default");
  });

  test("async short-circuit with ||=", async () => {
    interpreter.evaluate("let counter = 0");
    interpreter.evaluate("let x = 'existing'");
    await interpreter.evaluateAsync(`
      x ||= (function() { counter = counter + 1; return 'new'; })()
    `);
    expect(interpreter.evaluate("counter")).toBe(0);
    expect(interpreter.evaluate("x")).toBe("existing");
  });
});
