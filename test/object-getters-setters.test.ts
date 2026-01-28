import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Object getters and setters", () => {
  describe("Getters", () => {
    it("should support a basic getter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          get name() { return "hello"; }
        };
        obj.name;
      `);
      expect(result).toBe("hello");
    });

    it("should support a getter that uses this", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          _x: 10,
          get x() { return this._x; }
        };
        obj.x;
      `);
      expect(result).toBe(10);
    });

    it("should support a getter with computed logic", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          first: "John",
          last: "Doe",
          get fullName() { return this.first + " " + this.last; }
        };
        obj.fullName;
      `);
      expect(result).toBe("John Doe");
    });

    it("should call getter each time the property is accessed", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let count = 0;
        const obj = {
          get value() { return ++count; }
        };
        const a = obj.value;
        const b = obj.value;
        const c = obj.value;
        [a, b, c];
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("Setters", () => {
    it("should support a basic setter", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let stored = 0;
        const obj = {
          set val(v) { stored = v; }
        };
        obj.val = 42;
        stored;
      `);
      expect(result).toBe(42);
    });

    it("should support a setter that uses this", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          _data: null,
          set data(v) { this._data = v; }
        };
        obj.data = "test";
        obj._data;
      `);
      expect(result).toBe("test");
    });

    it("should support a setter with transformation", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          _val: 0,
          set val(v) { this._val = v * 2; }
        };
        obj.val = 5;
        obj._val;
      `);
      expect(result).toBe(10);
    });
  });

  describe("Combined getters and setters", () => {
    it("should support getter and setter on the same property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          _val: 0,
          get val() { return this._val; },
          set val(v) { this._val = v * 2; }
        };
        obj.val = 5;
        obj.val;
      `);
      expect(result).toBe(10);
    });

    it("should support multiple getter/setter pairs", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          _x: 0,
          _y: 0,
          get x() { return this._x; },
          set x(v) { this._x = v; },
          get y() { return this._y; },
          set y(v) { this._y = v; }
        };
        obj.x = 10;
        obj.y = 20;
        obj.x + obj.y;
      `);
      expect(result).toBe(30);
    });

    it("should work alongside regular properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = {
          normal: "hello",
          _backing: 0,
          get computed() { return this._backing + 1; },
          set computed(v) { this._backing = v; }
        };
        obj.computed = 10;
        obj.normal + ":" + obj.computed;
      `);
      expect(result).toBe("hello:11");
    });
  });

  describe("Computed property getters/setters", () => {
    it("should support computed getter names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const key = "value";
        const obj = {
          get [key]() { return 42; }
        };
        obj.value;
      `);
      expect(result).toBe(42);
    });

    it("should support computed setter names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const key = "value";
        let stored = 0;
        const obj = {
          set [key](v) { stored = v; }
        };
        obj.value = 99;
        stored;
      `);
      expect(result).toBe(99);
    });
  });

  describe("Async evaluation", () => {
    it("should support getters in async evaluation", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        const obj = {
          _x: 5,
          get x() { return this._x * 2; }
        };
        obj.x;
      `);
      expect(result).toBe(10);
    });

    it("should support setters in async evaluation", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        const obj = {
          _val: 0,
          get val() { return this._val; },
          set val(v) { this._val = v + 1; }
        };
        obj.val = 10;
        obj.val;
      `);
      expect(result).toBe(11);
    });
  });
});
