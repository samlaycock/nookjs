import { describe, test, expect, beforeEach } from 'bun:test';
import { Interpreter, InterpreterError } from './interpreter';

describe('Strings', () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe('String literals', () => {
    test('single-quoted string', () => {
      expect(interpreter.evaluate("'hello'")).toBe('hello');
    });

    test('double-quoted string', () => {
      expect(interpreter.evaluate('"hello"')).toBe('hello');
    });

    test('empty string', () => {
      expect(interpreter.evaluate('""')).toBe('');
    });

    test('string with spaces', () => {
      expect(interpreter.evaluate('"hello world"')).toBe('hello world');
    });

    test('string with numbers', () => {
      expect(interpreter.evaluate('"123"')).toBe('123');
    });

    test('string with special characters', () => {
      expect(interpreter.evaluate('"hello!@#"')).toBe('hello!@#');
    });
  });

  describe('String in variables', () => {
    test('assign string to let variable', () => {
      const code = `
        let message = "hello";
        message
      `;
      expect(interpreter.evaluate(code)).toBe('hello');
    });

    test('assign string to const variable', () => {
      const code = `
        const greeting = "hi";
        greeting
      `;
      expect(interpreter.evaluate(code)).toBe('hi');
    });

    test('reassign string variable', () => {
      const code = `
        let text = "first";
        text = "second";
        text
      `;
      expect(interpreter.evaluate(code)).toBe('second');
    });
  });

  describe('String concatenation', () => {
    test('concatenate two strings', () => {
      expect(interpreter.evaluate('"hello" + " world"')).toBe('hello world');
    });

    test('concatenate multiple strings', () => {
      expect(interpreter.evaluate('"a" + "b" + "c"')).toBe('abc');
    });

    test('concatenate string with empty string', () => {
      expect(interpreter.evaluate('"hello" + ""')).toBe('hello');
    });

    test('concatenate strings with variables', () => {
      const code = `
        let first = "hello";
        let second = " world";
        first + second
      `;
      expect(interpreter.evaluate(code)).toBe('hello world');
    });

    test('concatenate string with number', () => {
      expect(interpreter.evaluate('"number: " + 42')).toBe('number: 42');
    });

    test('concatenate number with string', () => {
      expect(interpreter.evaluate('42 + " is the answer"')).toBe('42 is the answer');
    });

    test('build string with multiple concatenations', () => {
      const code = `
        let name = "Alice";
        let greeting = "Hello, " + name + "!";
        greeting
      `;
      expect(interpreter.evaluate(code)).toBe('Hello, Alice!');
    });
  });

  describe('String comparison', () => {
    test('equal strings', () => {
      expect(interpreter.evaluate('"hello" === "hello"')).toBe(true);
    });

    test('different strings', () => {
      expect(interpreter.evaluate('"hello" === "world"')).toBe(false);
    });

    test('not equal strings', () => {
      expect(interpreter.evaluate('"hello" !== "world"')).toBe(true);
    });

    test('string equality with variables', () => {
      const code = `
        let a = "test";
        let b = "test";
        a === b
      `;
      expect(interpreter.evaluate(code)).toBe(true);
    });

    test('case sensitive comparison', () => {
      expect(interpreter.evaluate('"Hello" === "hello"')).toBe(false);
    });

    test('empty string comparison', () => {
      expect(interpreter.evaluate('"" === ""')).toBe(true);
    });

    test('lexicographic less than', () => {
      expect(interpreter.evaluate('"a" < "b"')).toBe(true);
    });

    test('lexicographic greater than', () => {
      expect(interpreter.evaluate('"z" > "a"')).toBe(true);
    });

    test('string length affects comparison', () => {
      expect(interpreter.evaluate('"short" < "shortlong"')).toBe(true);
    });

    test('compare string with number (coercion)', () => {
      expect(interpreter.evaluate('"5" === 5')).toBe(false);
    });
  });

  describe('String length property', () => {
    test('length of non-empty string', () => {
      expect(interpreter.evaluate('"hello".length')).toBe(5);
    });

    test('length of empty string', () => {
      expect(interpreter.evaluate('"".length')).toBe(0);
    });

    test('length with spaces', () => {
      expect(interpreter.evaluate('"hello world".length')).toBe(11);
    });

    test('length in variable', () => {
      const code = `
        let text = "testing";
        text.length
      `;
      expect(interpreter.evaluate(code)).toBe(7);
    });

    test('length in expression', () => {
      expect(interpreter.evaluate('"abc".length + "de".length')).toBe(5);
    });

    test('use length in conditional', () => {
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

  describe('Strings in functions', () => {
    test('function returns string', () => {
      const code = `
        function getMessage() {
          return "Hello!";
        }
        getMessage()
      `;
      expect(interpreter.evaluate(code)).toBe('Hello!');
    });

    test('function with string parameter', () => {
      const code = `
        function greet(name) {
          return "Hello, " + name;
        }
        greet("Alice")
      `;
      expect(interpreter.evaluate(code)).toBe('Hello, Alice');
    });

    test('function with multiple string parameters', () => {
      const code = `
        function concat(a, b, c) {
          return a + b + c;
        }
        concat("one", "two", "three")
      `;
      expect(interpreter.evaluate(code)).toBe('onetwothree');
    });

    test('function manipulates string', () => {
      const code = `
        function addExclamation(text) {
          return text + "!";
        }
        addExclamation("wow")
      `;
      expect(interpreter.evaluate(code)).toBe('wow!');
    });
  });

  describe('Strings with loops', () => {
    test('build string in loop', () => {
      const code = `
        let result = "";
        let i = 0;
        while (i < 3) {
          result = result + "a";
          i = i + 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe('aaa');
    });

    test('concatenate numbers as strings in loop', () => {
      const code = `
        let result = "";
        let i = 1;
        while (i <= 3) {
          result = result + i;
          i = i + 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe('123');
    });

    test('check string length in loop condition', () => {
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

  describe('Strings with conditionals', () => {
    test('string comparison in if', () => {
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

    test('check empty string', () => {
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

    test('string length in condition', () => {
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

  describe('Complex string operations', () => {
    test('string builder pattern', () => {
      const code = `
        function buildMessage(name, age) {
          let msg = "Name: " + name;
          msg = msg + ", Age: " + age;
          return msg;
        }
        buildMessage("Bob", 25)
      `;
      expect(interpreter.evaluate(code)).toBe('Name: Bob, Age: 25');
    });

    test('repeat string n times', () => {
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
      expect(interpreter.evaluate(code)).toBe('hahaha');
    });

    test('count specific character (approximation)', () => {
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

    test('format number with prefix', () => {
      const code = `
        function formatMoney(amount) {
          return "$" + amount;
        }
        formatMoney(100)
      `;
      expect(interpreter.evaluate(code)).toBe('$100');
    });
  });

  describe('Edge cases', () => {
    test('concatenate with boolean', () => {
      expect(interpreter.evaluate('"value: " + true')).toBe('value: true');
    });

    test('empty string concatenation chain', () => {
      expect(interpreter.evaluate('"" + "" + ""')).toBe('');
    });

    test('string with only spaces', () => {
      expect(interpreter.evaluate('"   ".length')).toBe(3);
    });

    test('string in closure', () => {
      const code = `
        let prefix = "Mr. ";
        function addPrefix(name) {
          return prefix + name;
        }
        addPrefix("Smith")
      `;
      expect(interpreter.evaluate(code)).toBe('Mr. Smith');
    });

    test('modify string variable in loop', () => {
      const code = `
        let s = "start";
        let i = 0;
        while (i < 2) {
          s = s + i;
          i = i + 1;
        }
        s
      `;
      expect(interpreter.evaluate(code)).toBe('start01');
    });
  });

  describe('Strings in recursion', () => {
    test('recursive string building', () => {
      const code = `
        function addChars(n) {
          if (n <= 0) {
            return "";
          }
          return "x" + addChars(n - 1);
        }
        addChars(4)
      `;
      expect(interpreter.evaluate(code)).toBe('xxxx');
    });

    test('reverse-like concatenation', () => {
      const code = `
        function buildReverse(n) {
          if (n <= 0) {
            return "";
          }
          return buildReverse(n - 1) + n;
        }
        buildReverse(3)
      `;
      expect(interpreter.evaluate(code)).toBe('123');
    });
  });
});
