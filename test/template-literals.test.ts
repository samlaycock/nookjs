import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

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
