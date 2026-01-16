import { describe, it, expect } from "bun:test";
import { Interpreter } from "../src/interpreter";

describe("String Methods", () => {
  describe("substring", () => {
    it("should extract substring with start and end", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.substring(0, 5)
      `);
      expect(result).toBe("Hello");
    });

    it("should extract substring with only start", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.substring(6)
      `);
      expect(result).toBe("World");
    });

    it("should handle negative indices", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello".substring(-1, 3)
      `);
      expect(result).toBe("Hel");
    });

    it("should swap indices if start > end", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello".substring(3, 1)
      `);
      expect(result).toBe("el");
    });
  });

  describe("slice", () => {
    it("should extract slice with start and end", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.slice(0, 5)
      `);
      expect(result).toBe("Hello");
    });

    it("should extract slice with only start", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.slice(6)
      `);
      expect(result).toBe("World");
    });

    it("should handle negative indices", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".slice(-5)
      `);
      expect(result).toBe("World");
    });

    it("should handle negative start and end", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".slice(-5, -1)
      `);
      expect(result).toBe("Worl");
    });
  });

  describe("charAt", () => {
    it("should return character at index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello";
        str.charAt(0)
      `);
      expect(result).toBe("H");
    });

    it("should return character at middle index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello".charAt(2)
      `);
      expect(result).toBe("l");
    });

    it("should return empty string for out of bounds", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello".charAt(10)
      `);
      expect(result).toBe("");
    });

    it("should return empty string for negative index", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello".charAt(-1)
      `);
      expect(result).toBe("");
    });
  });

  describe("indexOf", () => {
    it("should find first occurrence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.indexOf("o")
      `);
      expect(result).toBe(4);
    });

    it("should return -1 when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".indexOf("x")
      `);
      expect(result).toBe(-1);
    });

    it("should work with fromIndex", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".indexOf("o", 5)
      `);
      expect(result).toBe(7);
    });

    it("should find substring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".indexOf("World")
      `);
      expect(result).toBe(6);
    });
  });

  describe("lastIndexOf", () => {
    it("should find last occurrence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.lastIndexOf("o")
      `);
      expect(result).toBe(7);
    });

    it("should return -1 when not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".lastIndexOf("x")
      `);
      expect(result).toBe(-1);
    });

    it("should work with fromIndex", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".lastIndexOf("o", 5)
      `);
      expect(result).toBe(4);
    });
  });

  describe("includes", () => {
    it("should return true when substring exists", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.includes("World")
      `);
      expect(result).toBe(true);
    });

    it("should return false when substring doesn't exist", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".includes("xyz")
      `);
      expect(result).toBe(false);
    });

    it("should work with position", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".includes("Hello", 1)
      `);
      expect(result).toBe(false);
    });

    it("should be case sensitive", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".includes("hello")
      `);
      expect(result).toBe(false);
    });
  });

  describe("startsWith", () => {
    it("should return true when string starts with substring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.startsWith("Hello")
      `);
      expect(result).toBe(true);
    });

    it("should return false when string doesn't start with substring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".startsWith("World")
      `);
      expect(result).toBe(false);
    });

    it("should work with position", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".startsWith("World", 6)
      `);
      expect(result).toBe(true);
    });

    it("should be case sensitive", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".startsWith("hello")
      `);
      expect(result).toBe(false);
    });
  });

  describe("endsWith", () => {
    it("should return true when string ends with substring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "Hello World";
        str.endsWith("World")
      `);
      expect(result).toBe(true);
    });

    it("should return false when string doesn't end with substring", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".endsWith("Hello")
      `);
      expect(result).toBe(false);
    });

    it("should work with length", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".endsWith("Hello", 5)
      `);
      expect(result).toBe(true);
    });

    it("should be case sensitive", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".endsWith("world")
      `);
      expect(result).toBe(false);
    });
  });

  describe("toUpperCase", () => {
    it("should convert to uppercase", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "hello world";
        str.toUpperCase()
      `);
      expect(result).toBe("HELLO WORLD");
    });

    it("should not modify original string", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        let str = "hello";
        str.toUpperCase();
      `);
      const original = interpreter.evaluate("str");
      expect(original).toBe("hello");
    });

    it("should work with mixed case", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "HeLLo WoRLd".toUpperCase()
      `);
      expect(result).toBe("HELLO WORLD");
    });
  });

  describe("toLowerCase", () => {
    it("should convert to lowercase", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "HELLO WORLD";
        str.toLowerCase()
      `);
      expect(result).toBe("hello world");
    });

    it("should not modify original string", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`
        let str = "HELLO";
        str.toLowerCase();
      `);
      const original = interpreter.evaluate("str");
      expect(original).toBe("HELLO");
    });

    it("should work with mixed case", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "HeLLo WoRLd".toLowerCase()
      `);
      expect(result).toBe("hello world");
    });
  });

  describe("trim", () => {
    it("should remove leading and trailing whitespace", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "  hello  ";
        str.trim()
      `);
      expect(result).toBe("hello");
    });

    it("should not modify middle whitespace", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "  hello world  ".trim()
      `);
      expect(result).toBe("hello world");
    });

    it("should handle tabs and newlines", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "\\t\\nhello\\t\\n".trim()
      `);
      expect(result).toBe("hello");
    });
  });

  describe("trimStart / trimLeft", () => {
    it("should remove leading whitespace", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "  hello  ";
        str.trimStart()
      `);
      expect(result).toBe("hello  ");
    });

    it("should work with trimLeft alias", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "  hello  ".trimLeft()
      `);
      expect(result).toBe("hello  ");
    });
  });

  describe("trimEnd / trimRight", () => {
    it("should remove trailing whitespace", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "  hello  ";
        str.trimEnd()
      `);
      expect(result).toBe("  hello");
    });

    it("should work with trimRight alias", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "  hello  ".trimRight()
      `);
      expect(result).toBe("  hello");
    });
  });

  describe("split", () => {
    it("should split by separator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "a,b,c";
        str.split(",")
      `);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should split by space", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello world foo".split(" ")
      `);
      expect(result).toEqual(["hello", "world", "foo"]);
    });

    it("should work with limit", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "a,b,c,d".split(",", 2)
      `);
      expect(result).toEqual(["a", "b"]);
    });

    it("should split every character with empty separator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".split("")
      `);
      expect(result).toEqual(["h", "e", "l", "l", "o"]);
    });

    it("should return array with whole string when separator not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".split("x")
      `);
      expect(result).toEqual(["hello"]);
    });
  });

  describe("replace", () => {
    it("should replace first occurrence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "hello world";
        str.replace("world", "there")
      `);
      expect(result).toBe("hello there");
    });

    it("should only replace first occurrence", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "foo foo foo".replace("foo", "bar")
      `);
      expect(result).toBe("bar foo foo");
    });

    it("should return original if not found", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello world".replace("xyz", "abc")
      `);
      expect(result).toBe("hello world");
    });

    it("should be case sensitive", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "Hello World".replace("hello", "Hi")
      `);
      expect(result).toBe("Hello World");
    });
  });

  describe("repeat", () => {
    it("should repeat string n times", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "abc";
        str.repeat(3)
      `);
      expect(result).toBe("abcabcabc");
    });

    it("should return empty string for 0", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "abc".repeat(0)
      `);
      expect(result).toBe("");
    });

    it("should work with single character", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "-".repeat(5)
      `);
      expect(result).toBe("-----");
    });
  });

  describe("padStart", () => {
    it("should pad start with spaces", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "5";
        str.padStart(3)
      `);
      expect(result).toBe("  5");
    });

    it("should pad start with custom string", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "5".padStart(3, "0")
      `);
      expect(result).toBe("005");
    });

    it("should not pad if already long enough", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".padStart(3, "0")
      `);
      expect(result).toBe("hello");
    });

    it("should repeat pad string if needed", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "x".padStart(5, "ab")
      `);
      expect(result).toBe("ababx");
    });
  });

  describe("padEnd", () => {
    it("should pad end with spaces", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "5";
        str.padEnd(3)
      `);
      expect(result).toBe("5  ");
    });

    it("should pad end with custom string", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "5".padEnd(3, "0")
      `);
      expect(result).toBe("500");
    });

    it("should not pad if already long enough", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".padEnd(3, "0")
      `);
      expect(result).toBe("hello");
    });

    it("should repeat pad string if needed", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "x".padEnd(5, "ab")
      `);
      expect(result).toBe("xabab");
    });
  });

  describe("Method chaining", () => {
    it("should chain multiple string methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "  Hello World  ";
        str.trim().toLowerCase().replace("world", "there")
      `);
      expect(result).toBe("hello there");
    });

    it("should chain with split", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello,world".toUpperCase().split(",")
      `);
      expect(result).toEqual(["HELLO", "WORLD"]);
    });

    it("should chain slice and toUpperCase", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello world".slice(0, 5).toUpperCase()
      `);
      expect(result).toBe("HELLO");
    });
  });

  describe("String methods with variables and functions", () => {
    it("should work in functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function capitalize(str) {
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
        capitalize("hELLO")
      `);
      expect(result).toBe("Hello");
    });

    it("should work in loops", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let words = ["hello", "world"];
        let result = [];
        for (let i = 0; i < words.length; i++) {
          result[i] = words[i].toUpperCase();
        }
        result
      `);
      expect(result).toEqual(["HELLO", "WORLD"]);
    });

    it("should work with array methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let words = ["hello", "world"];
        words.map(w => w.toUpperCase())
      `);
      expect(result).toEqual(["HELLO", "WORLD"]);
    });
  });

  describe("Async string methods", () => {
    it("should work with evaluateAsync", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        let str = "hello";
        str.toUpperCase()
      `);
      expect(result).toBe("HELLO");
    });

    it("should chain in async mode", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        "  hello  ".trim().toUpperCase()
      `);
      expect(result).toBe("HELLO");
    });
  });

  describe("Edge cases", () => {
    it("should work with empty string", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let str = "";
        str.toUpperCase()
      `);
      expect(result).toBe("");
    });

    it("should handle indexOf with empty string", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".indexOf("")
      `);
      expect(result).toBe(0);
    });

    it("should split empty string", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "".split(",")
      `);
      expect(result).toEqual([""]);
    });

    it("should work with string literals directly", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        "hello".toUpperCase()
      `);
      expect(result).toBe("HELLO");
    });
  });
});
