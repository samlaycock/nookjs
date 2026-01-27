import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Regex Literals", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("basic regex creation", () => {
    test("creates a simple regex", () => {
      const result = interpreter.evaluate(`/hello/`);
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe("hello");
      expect(result.flags).toBe("");
    });

    test("creates a regex with flags", () => {
      const result = interpreter.evaluate(`/hello/gi`);
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe("hello");
      expect(result.flags).toBe("gi");
    });

    test("creates a regex with all common flags", () => {
      const result = interpreter.evaluate(`/test/gimsuy`);
      expect(result).toBeInstanceOf(RegExp);
    });

    test("creates a regex with dot pattern", () => {
      const result = interpreter.evaluate(`/a.b/`);
      expect(result.test("acb")).toBe(true);
      expect(result.test("ab")).toBe(false);
    });
  });

  describe("regex patterns", () => {
    test("character class", () => {
      const result = interpreter.evaluate(`/[abc]/`);
      expect(result.test("a")).toBe(true);
      expect(result.test("d")).toBe(false);
    });

    test("negated character class", () => {
      const result = interpreter.evaluate(`/[^abc]/`);
      expect(result.test("d")).toBe(true);
      expect(result.test("a")).toBe(false);
    });

    test("character class with slash inside", () => {
      // /[/]/ — the `/` inside [...] should not end the regex
      const result = interpreter.evaluate(`/[/]/`);
      expect(result.test("/")).toBe(true);
    });

    test("escaped characters", () => {
      const result = interpreter.evaluate(`/\\d+/`);
      expect(result.test("123")).toBe(true);
      expect(result.test("abc")).toBe(false);
    });

    test("escaped forward slash", () => {
      const result = interpreter.evaluate(`/a\\/b/`);
      expect(result.test("a/b")).toBe(true);
    });

    test("anchors", () => {
      const result = interpreter.evaluate(`/^hello$/`);
      expect(result.test("hello")).toBe(true);
      expect(result.test("say hello")).toBe(false);
    });

    test("alternation", () => {
      const result = interpreter.evaluate(`/cat|dog/`);
      expect(result.test("cat")).toBe(true);
      expect(result.test("dog")).toBe(true);
      expect(result.test("bird")).toBe(false);
    });

    test("quantifiers", () => {
      const result = interpreter.evaluate(`/a{2,4}/`);
      expect(result.test("aa")).toBe(true);
      expect(result.test("aaaa")).toBe(true);
      expect(result.test("a")).toBe(false);
    });

    test("groups", () => {
      const result = interpreter.evaluate(`/(foo)(bar)/`);
      const match = "foobar".match(result);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("foo");
      expect(match![2]).toBe("bar");
    });
  });

  describe("regex used in expressions", () => {
    test("regex.test()", () => {
      const result = interpreter.evaluate(`/hello/.test("hello world")`);
      expect(result).toBe(true);
    });

    test("regex.test() with no match", () => {
      const result = interpreter.evaluate(`/xyz/.test("hello world")`);
      expect(result).toBe(false);
    });

    test("regex assigned to variable", () => {
      const result = interpreter.evaluate(`
        const re = /\\d+/g;
        re.test("123")
      `);
      expect(result).toBe(true);
    });

    test("regex in conditional", () => {
      const result = interpreter.evaluate(`
        const str = "hello123";
        /\\d/.test(str) ? "has digits" : "no digits"
      `);
      expect(result).toBe("has digits");
    });

    test("regex as function argument", () => {
      const result = interpreter.evaluate(`
        const check = (re, str) => re.test(str);
        check(/^foo/, "foobar")
      `);
      expect(result).toBe(true);
    });

    test("regex in array", () => {
      const result = interpreter.evaluate(`
        const patterns = [/foo/, /bar/];
        patterns[0].test("foo")
      `);
      expect(result).toBe(true);
    });

    test("regex in object", () => {
      const result = interpreter.evaluate(`
        const obj = { pattern: /hello/i };
        obj.pattern.test("HELLO")
      `);
      expect(result).toBe(true);
    });
  });

  describe("regex vs division disambiguation", () => {
    test("division after number", () => {
      const result = interpreter.evaluate(`10 / 2`);
      expect(result).toBe(5);
    });

    test("division after identifier", () => {
      const result = interpreter.evaluate(`
        const x = 10;
        x / 2
      `);
      expect(result).toBe(5);
    });

    test("regex after assignment", () => {
      const result = interpreter.evaluate(`
        const re = /test/;
        re.test("testing")
      `);
      expect(result).toBe(true);
    });

    test("regex after return", () => {
      const result = interpreter.evaluate(`
        const fn = () => /pattern/;
        fn().test("pattern")
      `);
      expect(result).toBe(true);
    });

    test("regex after semicolon", () => {
      const result = interpreter.evaluate(`
        let x = 1;
        /test/.test("test")
      `);
      expect(result).toBe(true);
    });

    test("division in complex expression", () => {
      const result = interpreter.evaluate(`(10 + 2) / 3`);
      expect(result).toBe(4);
    });
  });

  describe("regex properties", () => {
    test("source property", () => {
      const result = interpreter.evaluate(`/hello/g.source`);
      expect(result).toBe("hello");
    });

    test("flags property", () => {
      const result = interpreter.evaluate(`/hello/gi.flags`);
      expect(result).toBe("gi");
    });

    test("global flag", () => {
      const result = interpreter.evaluate(`/hello/g.global`);
      expect(result).toBe(true);
    });

    test("ignoreCase flag", () => {
      const result = interpreter.evaluate(`/hello/i.ignoreCase`);
      expect(result).toBe(true);
    });
  });

  describe("regex with string methods", () => {
    test("String.replace with regex", () => {
      const result = interpreter.evaluate(`"hello world".replace(/world/, "there")`);
      expect(result).toBe("hello there");
    });

    test("String.split with regex", () => {
      const result = interpreter.evaluate(`"a1b2c3".split(/\\d/)`);
      expect(result).toEqual(["a", "b", "c", ""]);
    });
  });

  describe("edge cases", () => {
    test("empty regex", () => {
      const result = interpreter.evaluate(`/(?:)/`);
      expect(result).toBeInstanceOf(RegExp);
    });

    test("regex with special chars in character class", () => {
      const result = interpreter.evaluate("/[.*+?]/");
      expect(result).toBeInstanceOf(RegExp);
      expect(result.test("*")).toBe(true);
    });

    test("multiple regex literals in same expression", () => {
      const result = interpreter.evaluate(`
        const a = /foo/.test("foo");
        const b = /bar/.test("baz");
        a && !b
      `);
      expect(result).toBe(true);
    });
  });
});
