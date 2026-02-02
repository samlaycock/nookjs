import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5, ES2015 } from "../src/presets";

describe("RegExp", () => {
  describe("ES5", () => {
    describe("basic regex creation", () => {
      test("creates a simple regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/`);
        expect(result).toBeInstanceOf(RegExp);
        expect(result.source).toBe("hello");
        expect(result.flags).toBe("");
      });

      test("creates a regex with flags", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/gi`);
        expect(result).toBeInstanceOf(RegExp);
        expect(result.source).toBe("hello");
        expect(result.flags).toBe("gi");
      });

      test("creates a regex with dot pattern", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/a.b/`);
        expect(result.test("acb")).toBe(true);
        expect(result.test("ab")).toBe(false);
      });
    });

    describe("regex patterns", () => {
      test("character class", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/[abc]/`);
        expect(result.test("a")).toBe(true);
        expect(result.test("d")).toBe(false);
      });

      test("negated character class", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/[^abc]/`);
        expect(result.test("d")).toBe(true);
        expect(result.test("a")).toBe(false);
      });

      test("character class with slash inside", () => {
        const interpreter = new Interpreter(ES5);
        // /[/]/ — the `/` inside [...] should not end the regex
        const result = interpreter.evaluate(`/[/]/`);
        expect(result.test("/")).toBe(true);
      });

      test("escaped characters", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/\\d+/`);
        expect(result.test("123")).toBe(true);
        expect(result.test("abc")).toBe(false);
      });

      test("escaped forward slash", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/a\\/b/`);
        expect(result.test("a/b")).toBe(true);
      });

      test("anchors", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/^hello$/`);
        expect(result.test("hello")).toBe(true);
        expect(result.test("say hello")).toBe(false);
      });

      test("alternation", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/cat|dog/`);
        expect(result.test("cat")).toBe(true);
        expect(result.test("dog")).toBe(true);
        expect(result.test("bird")).toBe(false);
      });

      test("quantifiers", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/a{2,4}/`);
        expect(result.test("aa")).toBe(true);
        expect(result.test("aaaa")).toBe(true);
        expect(result.test("a")).toBe(false);
      });

      test("groups", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/(foo)(bar)/`);
        const match = "foobar".match(result);
        expect(match).not.toBeNull();
        expect(match![1]).toBe("foo");
        expect(match![2]).toBe("bar");
      });
    });

    describe("regex used in expressions", () => {
      test("regex.test()", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/.test("hello world")`);
        expect(result).toBe(true);
      });

      test("non-global regex does not advance lastIndex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`
          var re = /a/;
          re.test("a");
          re.lastIndex;
        `);
        expect(result).toBe(0);
      });

      test("global regex test advances lastIndex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`
          var re = /a/g;
          re.test("a");
          re.lastIndex;
        `);
        expect(result).toBe(1);
      });

      test("regex.test() with no match", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/xyz/.test("hello world")`);
        expect(result).toBe(false);
      });

      test("regex.exec() advances lastIndex for global regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`
          var re = /a/g;
          var str = "aba";
          var first = re.exec(str)[0];
          var second = re.exec(str)[0];
          [first, second, re.lastIndex];
        `);
        expect(result).toEqual(["a", "a", 3]);
      });
    });

    describe("regex vs division disambiguation", () => {
      test("division after number", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`10 / 2`);
        expect(result).toBe(5);
      });

      test("division in complex expression", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`(10 + 2) / 3`);
        expect(result).toBe(4);
      });
    });

    describe("regex properties", () => {
      test("source property", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/g.source`);
        expect(result).toBe("hello");
      });

      test("flags property", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/gi.flags`);
        expect(result).toBe("gi");
      });

      test("global flag", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/g.global`);
        expect(result).toBe(true);
      });

      test("ignoreCase flag", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/hello/i.ignoreCase`);
        expect(result).toBe(true);
      });
    });

    describe("regex with string methods", () => {
      test("String.replace with regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`"hello world".replace(/world/, "there")`);
        expect(result).toBe("hello there");
      });

      test("String.split with regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`"a1b2c3".split(/\\d/)`);
        expect(result).toEqual(["a", "b", "c", ""]);
      });

      test("String.match with capturing group", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`
          var match = "foo1bar2".match(/(\\d)/);
          [match[0], match[1], match.index];
        `);
        expect(result).toEqual(["1", "1", 3]);
      });

      test("String.match with global regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`"a1b2c3".match(/\\d/g)`);
        expect(result).toEqual(["1", "2", "3"]);
      });

      test("String.replace with capture groups", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(
          `"2020-12-31".replace(/(\\d{4})-(\\d{2})-(\\d{2})/, "$2/$3/$1")`,
        );
        expect(result).toBe("12/31/2020");
      });
    });

    describe("edge cases", () => {
      test("empty regex", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate(`/(?:)/`);
        expect(result).toBeInstanceOf(RegExp);
      });

      test("regex with special chars in character class", () => {
        const interpreter = new Interpreter(ES5);
        const result = interpreter.evaluate("/[.*+?]/");
        expect(result).toBeInstanceOf(RegExp);
        expect(result.test("*")).toBe(true);
      });
    });
  });

  describe("ES2015", () => {
    describe("basic regex creation", () => {
      test("creates a regex with all common flags", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`/test/gimsuy`);
        expect(result).toBeInstanceOf(RegExp);
      });
    });

    describe("regex used in expressions", () => {
      test("regex assigned to variable", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const re = /\\d+/g;
          re.test("123")
        `);
        expect(result).toBe(true);
      });

      test("regex in conditional", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const str = "hello123";
          /\\d/.test(str) ? "has digits" : "no digits"
        `);
        expect(result).toBe("has digits");
      });

      test("regex as function argument", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const check = (re, str) => re.test(str);
          check(/^foo/, "foobar")
        `);
        expect(result).toBe(true);
      });

      test("regex in array", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const patterns = [/foo/, /bar/];
          patterns[0].test("foo")
        `);
        expect(result).toBe(true);
      });

      test("regex in object", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const obj = { pattern: /hello/i };
          obj.pattern.test("HELLO")
        `);
        expect(result).toBe(true);
      });
    });

    describe("regex vs division disambiguation", () => {
      test("division after identifier", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const x = 10;
          x / 2
        `);
        expect(result).toBe(5);
      });

      test("regex after assignment", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const re = /test/;
          re.test("testing")
        `);
        expect(result).toBe(true);
      });

      test("regex after return", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const fn = () => /pattern/;
          fn().test("pattern")
        `);
        expect(result).toBe(true);
      });

      test("regex after semicolon", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          let x = 1;
          /test/.test("test")
        `);
        expect(result).toBe(true);
      });
    });

    describe("edge cases", () => {
      test("multiple regex literals in same expression", () => {
        const interpreter = new Interpreter(ES2015);
        const result = interpreter.evaluate(`
          const a = /foo/.test("foo");
          const b = /bar/.test("baz");
          a && !b
        `);
        expect(result).toBe(true);
      });
    });
  });
});
