import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("String.prototype RegExp Methods", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe("String.prototype.match", () => {
    test("works with global regex", () => {
      const result = interpreter.evaluate(`"hello".match(/l/g)`);
      expect(result).toEqual(["l", "l"]);
    });

    test("works with non-global regex", () => {
      const result = interpreter.evaluate(`"hello".match(/l/)`);
      expect(result).not.toBeNull();
      expect(result![0]).toBe("l");
      expect(result!.index).toBe(2);
      expect(result!.input).toBe("hello");
    });

    test("returns null when no match", () => {
      const result = interpreter.evaluate(`"hello".match(/x/)`);
      expect(result).toBeNull();
    });

    test("works with capturing groups", () => {
      const result = interpreter.evaluate(`"foobar".match(/(foo)(bar)/)`);
      expect(result![0]).toBe("foobar");
      expect(result![1]).toBe("foo");
      expect(result![2]).toBe("bar");
    });
  });

  describe("String.prototype.matchAll", () => {
    test("returns iterator for global regex", () => {
      const result = interpreter.evaluate(`"test".matchAll(/t/g)`);
      expect(result).not.toBeNull();
      expect(typeof result).toBe("object");
      expect(Symbol.iterator in result!).toBe(true);
    });

    test("iterator can be spread", () => {
      const result = interpreter.evaluate(`
        const iter = "test".matchAll(/t/g);
        [...iter].map(m => m[0])
      `);
      expect(result).toEqual(["t", "t"]);
    });

    test("matches include index and input", () => {
      const result = interpreter.evaluate(`
        const matches = [..."test".matchAll(/t/g)];
        matches[0].index
      `);
      expect(result).toBe(0);
    });

    test("returns empty array when no match", () => {
      const result = interpreter.evaluate(`
        [..."hello".matchAll(/x/g)]
      `);
      expect(result).toEqual([]);
    });
  });

  describe("String.prototype.search", () => {
    test("returns index of match", () => {
      const result = interpreter.evaluate(`"hello".search(/l/)`);
      expect(result).toBe(2);
    });

    test("returns -1 when not found", () => {
      const result = interpreter.evaluate(`"hello".search(/x/)`);
      expect(result).toBe(-1);
    });

    test("works at start of string", () => {
      const result = interpreter.evaluate(`"hello".search(/h/)`);
      expect(result).toBe(0);
    });

    test("works at end of string", () => {
      const result = interpreter.evaluate(`"hello".search(/o/)`);
      expect(result).toBe(4);
    });
  });

  describe("String.prototype.replace", () => {
    test("replaces first match with string", () => {
      const result = interpreter.evaluate(`"hello".replace(/l/, "x")`);
      expect(result).toBe("hexlo");
    });

    test("replaces all with global flag", () => {
      const result = interpreter.evaluate(`"hello".replace(/l/g, "x")`);
      expect(result).toBe("hexxo");
    });

    test("works with string pattern", () => {
      const result = interpreter.evaluate(`"hello hello".replace("hello", "world")`);
      expect(result).toBe("world hello");
    });

    test("replaces all with string pattern and replaceAll", () => {
      const result = interpreter.evaluate(`"hello hello".replaceAll("hello", "world")`);
      expect(result).toBe("world world");
    });

    test("calls replacement function with match", () => {
      const result = interpreter.evaluate(`"3+3".replace(/\\d/g, (m) => m + m)`);
      expect(result).toBe("33+33");
    });

    test("calls replacement function with all arguments", () => {
      const result = interpreter.evaluate(`
        "a1b2".replace(/\\d/g, (match, offset, string) => "[" + offset + ":" + string.length + "]")
      `);
      expect(result).toBe("a[1:4]b[3:4]");
    });

    test("replacement function receives captured groups", () => {
      const result = interpreter.evaluate(`
        "foo bar".replace(/(foo) (bar)/, (match, foo, bar) => bar + " " + foo)
      `);
      expect(result).toBe("bar foo");
    });
  });

  describe("String.prototype.replaceAll", () => {
    test("replaces all occurrences with string", () => {
      const result = interpreter.evaluate(`"foo bar foo".replaceAll("foo", "baz")`);
      expect(result).toBe("baz bar baz");
    });

    test("throws with non-global regex", () => {
      expect(() => {
        interpreter.evaluate(`"foo".replaceAll(/foo/, "bar")`);
      }).toThrow();
    });

    test("works with global regex", () => {
      const result = interpreter.evaluate(`"foo foo".replaceAll(/foo/g, "bar")`);
      expect(result).toBe("bar bar");
    });
  });
});
