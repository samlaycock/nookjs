import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Strings", () => {
  describe("ES5", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter();
    });

    describe("String literals", () => {
      test("single-quoted string", () => {
        expect(interpreter.evaluate("'hello'")).toBe("hello");
      });

      test("double-quoted string", () => {
        expect(interpreter.evaluate('"hello"')).toBe("hello");
      });

      test("empty string", () => {
        expect(interpreter.evaluate('""')).toBe("");
      });

      test("string with spaces", () => {
        expect(interpreter.evaluate('"hello world"')).toBe("hello world");
      });

      test("string with numbers", () => {
        expect(interpreter.evaluate('"123"')).toBe("123");
      });

      test("string with special characters", () => {
        expect(interpreter.evaluate('"hello!@#"')).toBe("hello!@#");
      });
    });

    describe("String in variables", () => {
      test("assign string to let variable", () => {
        const code = `
            let message = "hello";
            message
          `;
        expect(interpreter.evaluate(code)).toBe("hello");
      });

      test("assign string to const variable", () => {
        const code = `
            const greeting = "hi";
            greeting
          `;
        expect(interpreter.evaluate(code)).toBe("hi");
      });

      test("reassign string variable", () => {
        const code = `
            let text = "first";
            text = "second";
            text
          `;
        expect(interpreter.evaluate(code)).toBe("second");
      });
    });

    describe("String concatenation", () => {
      test("concatenate two strings", () => {
        expect(interpreter.evaluate('"hello" + " world"')).toBe("hello world");
      });

      test("concatenate multiple strings", () => {
        expect(interpreter.evaluate('"a" + "b" + "c"')).toBe("abc");
      });

      test("concatenate string with empty string", () => {
        expect(interpreter.evaluate('"hello" + ""')).toBe("hello");
      });

      test("concatenate strings with variables", () => {
        const code = `
            let first = "hello";
            let second = " world";
            first + second
          `;
        expect(interpreter.evaluate(code)).toBe("hello world");
      });

      test("concatenate string with number", () => {
        expect(interpreter.evaluate('"number: " + 42')).toBe("number: 42");
      });

      test("concatenate number with string", () => {
        expect(interpreter.evaluate('42 + " is the answer"')).toBe("42 is the answer");
      });

      test("build string with multiple concatenations", () => {
        const code = `
            let name = "Alice";
            let greeting = "Hello, " + name + "!";
            greeting
          `;
        expect(interpreter.evaluate(code)).toBe("Hello, Alice!");
      });
    });

    describe("String comparison", () => {
      test("equal strings", () => {
        expect(interpreter.evaluate('"hello" === "hello"')).toBe(true);
      });

      test("different strings", () => {
        expect(interpreter.evaluate('"hello" === "world"')).toBe(false);
      });

      test("not equal strings", () => {
        expect(interpreter.evaluate('"hello" !== "world"')).toBe(true);
      });

      test("string equality with variables", () => {
        const code = `
            let a = "test";
            let b = "test";
            a === b
          `;
        expect(interpreter.evaluate(code)).toBe(true);
      });

      test("case sensitive comparison", () => {
        expect(interpreter.evaluate('"Hello" === "hello"')).toBe(false);
      });

      test("empty string comparison", () => {
        expect(interpreter.evaluate('"" === ""')).toBe(true);
      });

      test("lexicographic less than", () => {
        expect(interpreter.evaluate('"a" < "b"')).toBe(true);
      });

      test("lexicographic greater than", () => {
        expect(interpreter.evaluate('"z" > "a"')).toBe(true);
      });

      test("string length affects comparison", () => {
        expect(interpreter.evaluate('"short" < "shortlong"')).toBe(true);
      });

      test("compare string with number (coercion)", () => {
        expect(interpreter.evaluate('"5" === 5')).toBe(false);
      });
    });

    describe("String length property", () => {
      test("length of non-empty string", () => {
        expect(interpreter.evaluate('"hello".length')).toBe(5);
      });

      test("length of empty string", () => {
        expect(interpreter.evaluate('"".length')).toBe(0);
      });

      test("length with spaces", () => {
        expect(interpreter.evaluate('"hello world".length')).toBe(11);
      });

      test("length in variable", () => {
        const code = `
            let text = "testing";
            text.length
          `;
        expect(interpreter.evaluate(code)).toBe(7);
      });

      test("length in expression", () => {
        expect(interpreter.evaluate('"abc".length + "de".length')).toBe(5);
      });

      test("use length in conditional", () => {
        const code = `
            let message = "hello";
            if (message.length > 3) {
              1
            } else {
              0
            }
          `;
        expect(interpreter.evaluate(code)).toBe(1);
      });
    });

    describe("Strings in functions", () => {
      test("function returns string", () => {
        const code = `
            function getMessage() {
              return "Hello!";
            }
            getMessage()
          `;
        expect(interpreter.evaluate(code)).toBe("Hello!");
      });

      test("function with string parameter", () => {
        const code = `
            function greet(name) {
              return "Hello, " + name;
            }
            greet("Alice")
          `;
        expect(interpreter.evaluate(code)).toBe("Hello, Alice");
      });

      test("function with multiple string parameters", () => {
        const code = `
            function concat(a, b, c) {
              return a + b + c;
            }
            concat("one", "two", "three")
          `;
        expect(interpreter.evaluate(code)).toBe("onetwothree");
      });

      test("function manipulates string", () => {
        const code = `
            function addExclamation(text) {
              return text + "!";
            }
            addExclamation("wow")
          `;
        expect(interpreter.evaluate(code)).toBe("wow!");
      });
    });

    describe("Strings with loops", () => {
      test("build string in loop", () => {
        const code = `
            let result = "";
            let i = 0;
            while (i < 3) {
              result = result + "a";
              i = i + 1;
            }
            result
          `;
        expect(interpreter.evaluate(code)).toBe("aaa");
      });

      test("concatenate numbers as strings in loop", () => {
        const code = `
            let result = "";
            let i = 1;
            while (i <= 3) {
              result = result + i;
              i = i + 1;
            }
            result
          `;
        expect(interpreter.evaluate(code)).toBe("123");
      });

      test("check string length in loop condition", () => {
        const code = `
            let text = "";
            let count = 0;
            while (text.length < 5) {
              text = text + "x";
              count = count + 1;
            }
            count
          `;
        expect(interpreter.evaluate(code)).toBe(5);
      });
    });

    describe("Strings with conditionals", () => {
      test("string comparison in if", () => {
        const code = `
            let word = "hello";
            if (word === "hello") {
              1
            } else {
              0
            }
          `;
        expect(interpreter.evaluate(code)).toBe(1);
      });

      test("check empty string", () => {
        const code = `
            let text = "";
            if (text === "") {
              1
            } else {
              0
            }
          `;
        expect(interpreter.evaluate(code)).toBe(1);
      });

      test("string length in condition", () => {
        const code = `
            function isLongString(s) {
              if (s.length > 10) {
                return 1;
              }
              return 0;
            }
            isLongString("short")
          `;
        expect(interpreter.evaluate(code)).toBe(0);
      });
    });

    describe("Complex string operations", () => {
      test("string builder pattern", () => {
        const code = `
            function buildMessage(name, age) {
              let msg = "Name: " + name;
              msg = msg + ", Age: " + age;
              return msg;
            }
            buildMessage("Bob", 25)
          `;
        expect(interpreter.evaluate(code)).toBe("Name: Bob, Age: 25");
      });

      test("repeat string n times", () => {
        const code = `
            function repeat(str, n) {
              let result = "";
              let i = 0;
              while (i < n) {
                result = result + str;
                i = i + 1;
              }
              return result;
            }
            repeat("ha", 3)
          `;
        expect(interpreter.evaluate(code)).toBe("hahaha");
      });

      test("count specific character (approximation)", () => {
        const code = `
            function countA(text) {
              let count = 0;
              let i = 0;
              while (i < text.length) {
                count = count + 1;
                i = i + 1;
              }
              return count;
            }
            countA("banana")
          `;
        expect(interpreter.evaluate(code)).toBe(6); // counts all chars, not just 'a'
      });

      test("format number with prefix", () => {
        const code = `
            function formatMoney(amount) {
              return "$" + amount;
            }
            formatMoney(100)
          `;
        expect(interpreter.evaluate(code)).toBe("$100");
      });
    });

    describe("Edge cases", () => {
      test("concatenate with boolean", () => {
        expect(interpreter.evaluate('"value: " + true')).toBe("value: true");
      });

      test("empty string concatenation chain", () => {
        expect(interpreter.evaluate('"" + "" + ""')).toBe("");
      });

      test("string with only spaces", () => {
        expect(interpreter.evaluate('"   ".length')).toBe(3);
      });

      test("string in closure", () => {
        const code = `
            let prefix = "Mr. ";
            function addPrefix(name) {
              return prefix + name;
            }
            addPrefix("Smith")
          `;
        expect(interpreter.evaluate(code)).toBe("Mr. Smith");
      });

      test("modify string variable in loop", () => {
        const code = `
            let s = "start";
            let i = 0;
            while (i < 2) {
              s = s + i;
              i = i + 1;
            }
            s
          `;
        expect(interpreter.evaluate(code)).toBe("start01");
      });
    });

    describe("Strings in recursion", () => {
      test("recursive string building", () => {
        const code = `
            function addChars(n) {
              if (n <= 0) {
                return "";
              }
              return "x" + addChars(n - 1);
            }
            addChars(4)
          `;
        expect(interpreter.evaluate(code)).toBe("xxxx");
      });

      test("reverse-like concatenation", () => {
        const code = `
            function buildReverse(n) {
              if (n <= 0) {
                return "";
              }
              return buildReverse(n - 1) + n;
            }
            buildReverse(3)
          `;
        expect(interpreter.evaluate(code)).toBe("123");
      });
    });

    describe("String Methods", () => {
      describe("concat", () => {
        it("should concatenate multiple strings", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"hello".concat(" ", "world")`);
          expect(result).toBe("hello world");
        });
      });

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

        it("should clamp end index to string length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello".substring(2, 100)
                `);
          expect(result).toBe("llo");
        });

        it("should treat NaN as 0", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello".substring(NaN, 2)
                `);
          expect(result).toBe("He");
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

        it("should return empty string when start > end", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello".slice(4, 2)
                `);
          expect(result).toBe("");
        });

        it("should treat NaN as 0", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello".slice(NaN, 2)
                `);
          expect(result).toBe("He");
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

      describe("charCodeAt", () => {
        it("should return code of first character", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "ABC".charCodeAt(0)
                `);
          expect(result).toBe(65);
        });

        it("should return NaN for out of bounds", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "ABC".charCodeAt(10)
                `);
          expect(Number.isNaN(result)).toBe(true);
        });

        it("should return NaN for negative index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "ABC".charCodeAt(-1)
                `);
          expect(Number.isNaN(result)).toBe(true);
        });

        it("should return NaN for empty string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "".charCodeAt(0)
                `);
          expect(Number.isNaN(result)).toBe(true);
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

        it("should find empty string at position 0", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"Hello".indexOf("")`);
          expect(result).toBe(0);
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

        it("should clamp negative fromIndex to 0", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "abc".indexOf("b", -5)
                `);
          expect(result).toBe(1);
        });

        it("should return -1 when fromIndex exceeds length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "abc".indexOf("a", 5)
                `);
          expect(result).toBe(-1);
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

        it("should return string length for empty search string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello".lastIndexOf("")
                `);
          expect(result).toBe(5);
        });

        it("should work with fromIndex", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "Hello World".lastIndexOf("o", 5)
                `);
          expect(result).toBe(4);
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

        it("should return same string when no whitespace", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"hello".trim()`);
          expect(result).toBe("hello");
        });

        it("should handle empty string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"".trim()`);
          expect(result).toBe("");
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

      describe("split", () => {
        it("should split by separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  let str = "a,b,c";
                  str.split(",")
                `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        it("should return empty array when limit is 0", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"a,b".split(",", 0)`);
          expect(result).toEqual([]);
        });

        it("should treat undefined as missing separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"aundefinedb".split(undefined)`);
          expect(result).toEqual(["aundefinedb"]);
        });

        it("should split by space", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "hello world foo".split(" ")
                `);
          expect(result).toEqual(["hello", "world", "foo"]);
        });

        it("should respect split limit", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`"a,b,c".split(",", 1)`);
          expect(result).toEqual(["a"]);
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

        it("should split with regex separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "a  b   c".split(/\\s+/)
                `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        it("should split with empty regex", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "abc".split(/(?:)/)
                `);
          expect(result).toEqual(["a", "b", "c"]);
        });

        it("should honor limit when using regex separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "a1b2c3".split(/\\d/, 2)
                `);
          expect(result).toEqual(["a", "b"]);
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

        it("should treat string pattern as literal, not regex", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "a.b".replace(".", "-")
                `);
          expect(result).toBe("a-b");
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

        it("should support replacement with capture groups", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "John Doe".replace(/(\\w+)\\s(\\w+)/, "$2, $1")
                `);
          expect(result).toBe("Doe, John");
        });

        it("should support $& replacement token", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                  "abc".replace("b", "$&$&")
                `);
          expect(result).toBe("abbc");
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

    describe("String.prototype RegExp Methods", () => {
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
    });
  });

  describe("ES2015", () => {
    describe("String Methods", () => {
      describe("includes", () => {
        it("should return true when substring exists", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              let str = "Hello World";
              str.includes("World")
            `);
          expect(result).toBe(true);
        });

        it("should return true for empty search string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              "Hello".includes("")
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

        it("should return true for empty search string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              "Hello".startsWith("")
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

        it("should return false when position exceeds length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              "Hello".startsWith("Hello", 10)
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

        it("should return true for empty search string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              "Hello".endsWith("")
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

        it("should return false when length exceeds string length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
              "Hello".endsWith("Hello", 10)
            `);
          expect(result).toBe(true);
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
    });
    describe("Template Literals", () => {
      describe("Basic Template Literals", () => {
        it("should evaluate simple template literal", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("`hello`");
          expect(result).toBe("hello");
        });

        it("should evaluate template with single expression", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let name = "World";
        \`Hello \${name}!\`
      `);
          expect(result).toBe("Hello World!");
        });

        it("should evaluate template with multiple expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let x = 5;
        let y = 10;
        \`\${x} + \${y} = \${x + y}\`
      `);
          expect(result).toBe("5 + 10 = 15");
        });

        it("should handle template with no expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("`just text`");
          expect(result).toBe("just text");
        });
      });

      describe("Expressions in Templates", () => {
        it("should evaluate arithmetic expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let a = 3;
        let b = 4;
        \`Sum: \${a + b}, Product: \${a * b}\`
      `);
          expect(result).toBe("Sum: 7, Product: 12");
        });

        it("should evaluate function calls", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        function double(x) {
          return x * 2;
        }
        let num = 5;
        \`Double of \${num} is \${double(num)}\`
      `);
          expect(result).toBe("Double of 5 is 10");
        });

        it("should evaluate object property access", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let person = { name: "Alice", age: 30 };
        \`Name: \${person.name}, Age: \${person.age}\`
      `);
          expect(result).toBe("Name: Alice, Age: 30");
        });

        it("should evaluate array access", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        \`First: \${arr[0]}, Last: \${arr[2]}\`
      `);
          expect(result).toBe("First: 1, Last: 3");
        });

        it("should evaluate conditional expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let x = 5;
        \`x is \${x > 3 ? "big" : "small"}\`
      `);
          expect(result).toBe("x is big");
        });
      });

      describe("Type Coercion", () => {
        it("should convert numbers to strings", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let num = 42;
        \`The answer is \${num}\`
      `);
          expect(result).toBe("The answer is 42");
        });

        it("should convert booleans to strings", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let flag = true;
        \`Flag: \${flag}\`
      `);
          expect(result).toBe("Flag: true");
        });

        it("should convert undefined to string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let x;
        \`Value: \${x}\`
      `);
          expect(result).toBe("Value: undefined");
        });

        it("should convert objects to string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let obj = {x: 1};
        \`Object: \${obj}\`
      `);
          expect(result).toBe("Object: [object Object]");
        });

        it("should convert arrays to string", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        \`Array: \${arr}\`
      `);
          expect(result).toBe("Array: 1,2,3");
        });
      });

      describe("Nested Templates", () => {
        it("should handle nested template literals", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let x = 5;
        \`outer \${\`inner \${x}\`} end\`
      `);
          expect(result).toBe("outer inner 5 end");
        });

        it("should handle deeply nested templates", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let a = 1;
        \`a=\${\`b=\${\`c=\${a}\`}\`}\`
      `);
          expect(result).toBe("a=b=c=1");
        });
      });

      describe("Multiline Templates", () => {
        it("should preserve newlines", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("`line1\nline2\nline3`");
          expect(result).toBe("line1\nline2\nline3");
        });

        it("should handle expressions in multiline templates", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let name = "Alice";
        \`Hello
\${name}
Goodbye\`
      `);
          expect(result).toBe("Hello\nAlice\nGoodbye");
        });
      });

      describe("Edge Cases", () => {
        it("should handle empty template", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("``");
          expect(result).toBe("");
        });

        it("should handle template with only expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let a = 1, b = 2;
        \`\${a}\${b}\`
      `);
          expect(result).toBe("12");
        });

        it("should handle consecutive expressions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        \`\${1}\${2}\${3}\`
      `);
          expect(result).toBe("123");
        });

        it("should handle special characters in template", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate("`test\\t\\n\\r`");
          expect(result).toContain("test");
        });
      });

      describe("Complex Use Cases", () => {
        it("should work in variable declarations", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let name = "Bob";
        let greeting = \`Hello, \${name}!\`;
        greeting
      `);
          expect(result).toBe("Hello, Bob!");
        });

        it("should work in function returns", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        function greet(name) {
          return \`Hello, \${name}!\`;
        }
        greet("Charlie")
      `);
          expect(result).toBe("Hello, Charlie!");
        });

        it("should work in array literals", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let x = 5;
        let arr = [\`value: \${x}\`, \`double: \${x * 2}\`];
        arr[0] + ", " + arr[1]
      `);
          expect(result).toBe("value: 5, double: 10");
        });

        it("should work in object literals", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
        let name = "Alice";
        let age = 30;
        let obj = {
          info: \`\${name} is \${age} years old\`
        };
        obj.info
      `);
          expect(result).toBe("Alice is 30 years old");
        });
      });

      describe("Async Template Literals", () => {
        it("should work with async evaluation", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
        let name = "World";
        \`Hello \${name}!\`
      `);
          expect(result).toBe("Hello World!");
        });

        it("should handle promise values in templates", async () => {
          const interpreter = new Interpreter({
            globals: {
              getAsyncValue: async () => 42,
            },
          });
          const result = await interpreter.evaluateAsync(`
        let val = getAsyncValue();
        \`The value is \${val}\`
      `);
          expect(result).toBe("The value is 42");
        });
      });
    });
    describe("Tagged Template Literals", () => {
      let interpreter: Interpreter;

      beforeEach(() => {
        interpreter = new Interpreter();
      });

      describe("sandbox tag functions", () => {
        test("basic tag function receives strings and values", () => {
          const result = interpreter.evaluate(`
        function tag(strings, ...values) {
          return strings[0] + values[0] + strings[1];
        }
        tag\`hello \${42} world\`;
      `);
          expect(result).toBe("hello 42 world");
        });

        test("tag function receives correct number of strings and values", () => {
          const result = interpreter.evaluate(`
        function tag(strings, ...values) {
          return [strings.length, values.length];
        }
        tag\`a\${1}b\${2}c\`;
      `);
          expect(result).toEqual([3, 2]);
        });

        test("tag function with no interpolations", () => {
          const result = interpreter.evaluate(`
        function tag(strings) {
          return strings[0];
        }
        tag\`hello world\`;
      `);
          expect(result).toBe("hello world");
        });

        test("tag function can return non-string values", () => {
          const result = interpreter.evaluate(`
        function tag(strings, ...values) {
          return values.reduce((sum, v) => sum + v, 0);
        }
        tag\`\${10}\${20}\${30}\`;
      `);
          expect(result).toBe(60);
        });

        test("tag function receives frozen strings array", () => {
          const interp = new Interpreter({ globals: { Object } });
          const result = interp.evaluate(`
        function tag(strings) {
          return Object.isFrozen(strings);
        }
        tag\`hello\`;
      `);
          expect(result).toBe(true);
        });
      });

      describe("raw strings", () => {
        test("strings array has raw property", () => {
          const result = interpreter.evaluate(`
        function tag(strings) {
          return typeof strings.raw !== "undefined";
        }
        tag\`hello\`;
      `);
          expect(result).toBe(true);
        });

        test("raw property contains raw string values", () => {
          const result = interpreter.evaluate(`
        function tag(strings) {
          return strings.raw[0];
        }
        tag\`hello\`;
      `);
          expect(result).toBe("hello");
        });

        test("raw strings array is frozen", () => {
          const interp = new Interpreter({ globals: { Object } });
          const result = interp.evaluate(`
        function tag(strings) {
          return Object.isFrozen(strings.raw);
        }
        tag\`hello\`;
      `);
          expect(result).toBe(true);
        });
      });

      describe("host tag functions", () => {
        test("host function as tag", () => {
          const myTag = (strings: TemplateStringsArray, ...values: any[]) => {
            return strings.join("") + ":" + values.join(",");
          };
          const interp = new Interpreter({ globals: { myTag } });
          const result = interp.evaluate("myTag`hello ${1} world ${2}`");
          expect(result).toBe("hello  world :1,2");
        });

        test("host tag function receives values", () => {
          const collect = (_strings: TemplateStringsArray, ...values: any[]) => values;
          const interp = new Interpreter({ globals: { collect } });
          const result = interp.evaluate("collect`a${10}b${20}c`");
          expect(result).toEqual([10, 20]);
        });
      });

      describe("expressions in tagged templates", () => {
        test("variable interpolation", () => {
          const result = interpreter.evaluate(`
        function tag(strings, ...values) {
          return values[0];
        }
        const x = 42;
        tag\`\${x}\`;
      `);
          expect(result).toBe(42);
        });

        test("expression interpolation", () => {
          const result = interpreter.evaluate(`
        function tag(strings, ...values) {
          return values[0];
        }
        tag\`\${2 + 3}\`;
      `);
          expect(result).toBe(5);
        });

        test("function call interpolation", () => {
          const result = interpreter.evaluate(`
        function double(n) { return n * 2; }
        function tag(strings, ...values) {
          return values[0];
        }
        tag\`\${double(5)}\`;
      `);
          expect(result).toBe(10);
        });
      });

      describe("tag as expression", () => {
        test("method as tag function", () => {
          const result = interpreter.evaluate(`
        const obj = {
          tag: function(strings, ...values) {
            return strings.length;
          }
        };
        obj.tag\`a\${1}b\`;
      `);
          expect(result).toBe(2);
        });

        test("returned function as tag", () => {
          const result = interpreter.evaluate(`
        function makeTag() {
          return function(strings, ...values) {
            return "tagged:" + values[0];
          };
        }
        makeTag()\`hello \${42}\`;
      `);
          expect(result).toBe("tagged:42");
        });
      });

      describe("custom string building", () => {
        test("html-like escaping tag", () => {
          const result = interpreter.evaluate(`
        function html(strings, ...values) {
          let result = "";
          for (let i = 0; i < strings.length; i++) {
            result = result + strings[i];
            if (i < values.length) {
              const val = "" + values[i];
              result = result + val.replace("<", "&lt;").replace(">", "&gt;");
            }
          }
          return result;
        }
        html\`<div>\${"<script>alert(1)</script>"}</div>\`;
      `);
          expect(result).toBe("<div>&lt;script&gt;alert(1)</script></div>");
        });

        test("highlight tag wraps values", () => {
          const result = interpreter.evaluate(`
        function highlight(strings, ...values) {
          let result = "";
          for (let i = 0; i < strings.length; i++) {
            result = result + strings[i];
            if (i < values.length) {
              result = result + "[" + values[i] + "]";
            }
          }
          return result;
        }
        const name = "world";
        highlight\`hello \${name}!\`;
      `);
          expect(result).toBe("hello [world]!");
        });
      });
    });
  });

  describe("ES2017", () => {
    describe("String Methods", () => {
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
    });
  });

  describe("ES2019", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("String Methods", () => {
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
    });

    describe("String.prototype.trimStart", () => {
      it("should trim leading whitespace", () => {
        expect(interpreter.evaluate('"  hello".trimStart()')).toBe("hello");
      });
    });

    describe("String.prototype.trimEnd", () => {
      it("should trim trailing whitespace", () => {
        expect(interpreter.evaluate('"hello  ".trimEnd()')).toBe("hello");
      });
    });
  });

  describe("ES2020", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter();
    });
    describe("String.prototype RegExp Methods", () => {
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
    });
  });

  describe("ES2021", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("String.prototype RegExp Methods", () => {
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

    describe("String.prototype.replaceAll", () => {
      it("should replace all occurrences", () => {
        expect(interpreter.evaluate('"foo foo foo".replaceAll("foo", "bar")')).toBe("bar bar bar");
      });

      it("should replace with empty string", () => {
        expect(interpreter.evaluate('"a,b,c".replaceAll(",", "")')).toBe("abc");
      });

      it("should work with global regex", () => {
        expect(interpreter.evaluate('"a1b2c3".replaceAll(/\\d/g, "-")')).toBe("a-b-c-");
      });
    });
  });
});
