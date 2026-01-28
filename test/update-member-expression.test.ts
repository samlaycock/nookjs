import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Update expressions on member expressions", () => {
  describe("Postfix increment (obj.prop++)", () => {
    it("should increment object property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        obj.x++;
        obj.x;
      `);
      expect(result).toBe(6);
    });

    it("should return old value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        obj.x++;
      `);
      expect(result).toBe(5);
    });
  });

  describe("Postfix decrement (obj.prop--)", () => {
    it("should decrement object property", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        obj.x--;
        obj.x;
      `);
      expect(result).toBe(4);
    });

    it("should return old value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        obj.x--;
      `);
      expect(result).toBe(5);
    });
  });

  describe("Prefix increment (++obj.prop)", () => {
    it("should increment and return new value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        ++obj.x;
      `);
      expect(result).toBe(6);
    });
  });

  describe("Prefix decrement (--obj.prop)", () => {
    it("should decrement and return new value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { x: 5 };
        --obj.x;
      `);
      expect(result).toBe(4);
    });
  });

  describe("Computed member expressions", () => {
    it("should support arr[index]++", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const arr = [10, 20, 30];
        arr[1]++;
        arr[1];
      `);
      expect(result).toBe(21);
    });

    it("should support obj[key]++", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { a: 1 };
        const k = "a";
        obj[k]++;
        obj.a;
      `);
      expect(result).toBe(2);
    });
  });

  describe("Nested member expressions", () => {
    it("should support nested obj.a.b++", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const obj = { a: { b: 10 } };
        obj.a.b++;
        obj.a.b;
      `);
      expect(result).toBe(11);
    });
  });
});
