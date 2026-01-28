import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";

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
