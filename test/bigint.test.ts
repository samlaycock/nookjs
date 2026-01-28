import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2019, ES2020 } from "../src/presets";

describe("BigInt literals", () => {
  it("should parse basic BigInt literals", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("10n")).toBe(10n);
    expect(interpreter.evaluate("0n")).toBe(0n);
    expect(interpreter.evaluate("123456789n")).toBe(123456789n);
  });

  it("should parse large BigInt values beyond Number.MAX_SAFE_INTEGER", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("9007199254740993n")).toBe(9007199254740993n);
    expect(interpreter.evaluate("99999999999999999999n")).toBe(
      99999999999999999999n,
    );
  });

  it("should parse hexadecimal BigInt", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0xFFn")).toBe(0xffn);
    expect(interpreter.evaluate("0XDEADBEEFn")).toBe(0xdeadbeefn);
  });

  it("should parse binary BigInt", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0b1010n")).toBe(0b1010n);
    expect(interpreter.evaluate("0B11111111n")).toBe(0b11111111n);
  });

  it("should parse octal BigInt", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0o77n")).toBe(0o77n);
    expect(interpreter.evaluate("0O123n")).toBe(0o123n);
  });

  it("should support numeric separators in BigInt", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1_000_000n")).toBe(1_000_000n);
    expect(interpreter.evaluate("0xFF_FFn")).toBe(0xff_ffn);
    expect(interpreter.evaluate("0b1010_1010n")).toBe(0b1010_1010n);
  });
});

describe("BigInt arithmetic", () => {
  it("should support addition", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("10n + 20n")).toBe(30n);
  });

  it("should support subtraction", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("100n - 30n")).toBe(70n);
  });

  it("should support multiplication", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("10n * 5n")).toBe(50n);
  });

  it("should support division (truncating)", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("100n / 3n")).toBe(33n);
    expect(interpreter.evaluate("10n / 3n")).toBe(3n);
  });

  it("should support modulo", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("100n % 7n")).toBe(2n);
  });

  it("should support exponentiation", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("2n ** 10n")).toBe(1024n);
  });

  it("should support unary negation", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("-10n")).toBe(-10n);
  });
});

describe("BigInt comparison", () => {
  it("should support comparison operators", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("10n > 5n")).toBe(true);
    expect(interpreter.evaluate("10n < 5n")).toBe(false);
    expect(interpreter.evaluate("10n >= 10n")).toBe(true);
    expect(interpreter.evaluate("10n <= 10n")).toBe(true);
  });

  it("should support equality operators", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("10n === 10n")).toBe(true);
    expect(interpreter.evaluate("10n !== 5n")).toBe(true);
  });
});

describe("BigInt bitwise operations", () => {
  it("should support bitwise AND", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0xFFn & 0x0Fn")).toBe(0x0fn);
  });

  it("should support bitwise OR", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0xF0n | 0x0Fn")).toBe(0xffn);
  });

  it("should support bitwise XOR", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("0xFFn ^ 0x0Fn")).toBe(0xf0n);
  });

  it("should support left shift", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1n << 10n")).toBe(1024n);
  });

  it("should support right shift", () => {
    const interpreter = new Interpreter();
    expect(interpreter.evaluate("1024n >> 2n")).toBe(256n);
  });
});

describe("BigInt in expressions", () => {
  it("should work in variable assignments", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      const x = 100n;
      const y = 200n;
      x + y;
    `);
    expect(result).toBe(300n);
  });

  it("should work in function returns", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      function factorial(n) {
        if (n <= 1n) return 1n;
        return n * factorial(n - 1n);
      }
      factorial(20n);
    `);
    expect(result).toBe(2432902008176640000n);
  });

  it("should work in arrays", () => {
    const interpreter = new Interpreter();
    const result = interpreter.evaluate(`
      const arr = [1n, 2n, 3n];
      arr[0] + arr[1] + arr[2];
    `);
    expect(result).toBe(6n);
  });
});

describe("BigInt feature control", () => {
  it("should be enabled in ES2020 preset", () => {
    const interpreter = new Interpreter(ES2020);
    expect(interpreter.evaluate("10n")).toBe(10n);
  });

  it("should be disabled in ES2019 preset", () => {
    const interpreter = new Interpreter(ES2019);
    expect(() => interpreter.evaluate("10n")).toThrow(
      "BigIntLiteral is not enabled",
    );
  });

  it("can be explicitly disabled via blacklist", () => {
    const interpreter = new Interpreter({
      featureControl: {
        mode: "blacklist",
        features: ["BigIntLiteral"],
      },
    });
    expect(() => interpreter.evaluate("10n")).toThrow(
      "BigIntLiteral is not enabled",
    );
  });

  it("can be explicitly enabled via whitelist", () => {
    const interpreter = new Interpreter({
      featureControl: {
        mode: "whitelist",
        features: ["BigIntLiteral", "BinaryOperators"],
      },
    });
    expect(interpreter.evaluate("10n + 5n")).toBe(15n);
  });
});
