import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Numeric separators", () => {
  it("should support underscores in decimal integers", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1_000")).toBe(1000);
    expect(interpreter.evaluate("1_000_000")).toBe(1000000);
    expect(interpreter.evaluate("1_234_567_890")).toBe(1234567890);
  });

  it("should support underscores in hexadecimal", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0xFF_FF")).toBe(0xffff);
    expect(interpreter.evaluate("0x00_FF_00_FF")).toBe(0x00ff00ff);
    expect(interpreter.evaluate("0xDEAD_BEEF")).toBe(0xdeadbeef);
  });

  it("should support underscores in binary", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0b1010_1010")).toBe(0b10101010);
    expect(interpreter.evaluate("0b1111_0000_1111_0000")).toBe(0b1111000011110000);
  });

  it("should support underscores in octal", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0o77_77")).toBe(0o7777);
    expect(interpreter.evaluate("0o12_34_56")).toBe(0o123456);
  });

  it("should support underscores in decimal floats", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1_000.5")).toBe(1000.5);
    expect(interpreter.evaluate("1_000.123_456")).toBe(1000.123456);
  });

  it("should work in expressions", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1_000 + 2_000")).toBe(3000);
    expect(interpreter.evaluate("0xFF_00 | 0x00_FF")).toBe(0xffff);
  });
});
