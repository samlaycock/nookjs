import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5, ES2015, ES2021 } from "../src/presets";

describe("Numbers", () => {
  describe("ES5", () => {
    describe("parseInt", () => {
      it("should parse integer from string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('42')")).toBe(42);
      });

      it("should coerce number input to string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt(42)")).toBe(42);
      });

      it("should parse with radix", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('10', 2)")).toBe(2);
        expect(interpreter.evaluate("parseInt('10', 16)")).toBe(16);
      });

      it("should parse base-36 values", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('z', 36)")).toBe(35);
      });

      it("should parse hex with 0x prefix", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('0x10')")).toBe(16);
      });

      it("should parse up to first non-digit", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('10px')")).toBe(10);
      });

      it("should stop parsing at exponent marker", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('1e2')")).toBe(1);
      });

      it("should ignore leading whitespace", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('   42')")).toBe(42);
      });

      it("should return NaN for invalid input", () => {
        const interpreter = new Interpreter(ES5);
        expect(Number.isNaN(interpreter.evaluate("parseInt('abc')"))).toBe(true);
      });

      it("should handle negative numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('-42')")).toBe(-42);
      });

      it("should handle leading plus sign", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('+42')")).toBe(42);
      });

      it("should parse decimal strings with leading zeros", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseInt('08')")).toBe(8);
        expect(interpreter.evaluate("parseInt('010')")).toBe(10);
      });

      it("should return NaN for empty string", () => {
        const interpreter = new Interpreter(ES5);
        expect(Number.isNaN(interpreter.evaluate("parseInt('')"))).toBe(true);
      });
    });

    describe("parseFloat", () => {
      it("should parse float from string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('3.14')")).toBeCloseTo(3.14, 2);
      });

      it("should coerce number input to string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat(3.14)")).toBeCloseTo(3.14, 2);
      });

      it("should parse leading decimal point", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('.5')")).toBeCloseTo(0.5, 2);
      });

      it("should parse trailing decimal point", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('3.')")).toBe(3);
      });

      it("should handle leading plus sign", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('+3.5')")).toBeCloseTo(3.5, 2);
      });

      it("should parse integer", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('42')")).toBe(42);
      });

      it("should parse scientific notation", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('1e2')")).toBe(100);
      });

      it("should parse float up to first non-digit", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('3.14px')")).toBeCloseTo(3.14, 2);
      });

      it("should stop parsing at second decimal point", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('1.2.3')")).toBeCloseTo(1.2, 2);
      });

      it("should ignore leading whitespace", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("parseFloat('   2.5')")).toBeCloseTo(2.5, 2);
      });

      it("should return NaN for invalid input", () => {
        const interpreter = new Interpreter(ES5);
        expect(Number.isNaN(interpreter.evaluate("parseFloat('abc')"))).toBe(true);
      });

      it("should return NaN for empty string", () => {
        const interpreter = new Interpreter(ES5);
        expect(Number.isNaN(interpreter.evaluate("parseFloat('')"))).toBe(true);
      });
    });

    describe("Number", () => {
      it("should convert numeric strings to numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number('42')")).toBe(42);
      });

      it("should ignore surrounding whitespace in numeric strings", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number('  42  ')")).toBe(42);
      });

      it("should convert booleans to numbers", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number(true)")).toBe(1);
        expect(interpreter.evaluate("Number(false)")).toBe(0);
      });

      it("should parse hex string with 0x prefix", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number('0x10')")).toBe(16);
      });

      it("should parse scientific notation string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number('1e2')")).toBe(100);
      });

      it("should convert empty string to 0", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number('')")).toBe(0);
      });

      it("should convert null to 0", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number(null)")).toBe(0);
      });

      it("should convert undefined to NaN", () => {
        const interpreter = new Interpreter(ES5);
        expect(Number.isNaN(interpreter.evaluate("Number(undefined)"))).toBe(true);
      });
    });

    describe("Number formatting", () => {
      it("should format with toFixed", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("(1.2).toFixed(2)")).toBe("1.20");
        expect(interpreter.evaluate("(10).toFixed(0)")).toBe("10");
      });

      it("should format with toPrecision", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("(1.2345).toPrecision(3)")).toBe("1.23");
        expect(interpreter.evaluate("(123.45).toPrecision(4)")).toBe("123.5");
      });

      it("should format with toExponential", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("(1234).toExponential(2)")).toBe("1.23e+3");
      });
    });

    describe("Number constants", () => {
      it("should expose Number.MAX_VALUE", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number.MAX_VALUE")).toBe(Number.MAX_VALUE);
      });

      it("should expose Number.MIN_VALUE", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("Number.MIN_VALUE")).toBe(Number.MIN_VALUE);
      });
    });

    describe("isNaN", () => {
      it("should return true for NaN", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN(NaN)")).toBe(true);
      });

      it("should return true for non-numeric string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN('foo')")).toBe(true);
      });

      it("should return true for undefined", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN(undefined)")).toBe(true);
      });

      it("should return false for number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN(42)")).toBe(false);
      });

      it("should return false for numeric string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN('123')")).toBe(false);
      });

      it("should return false for boolean true", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN(true)")).toBe(false);
      });

      it("should return false for null", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isNaN(null)")).toBe(false);
      });
    });

    describe("isFinite", () => {
      it("should return false for Infinity", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(Infinity)")).toBe(false);
      });

      it("should return false for NaN", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(NaN)")).toBe(false);
      });

      it("should return false for -Infinity", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(-Infinity)")).toBe(false);
      });

      it("should return false for undefined", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(undefined)")).toBe(false);
      });

      it("should return false for non-numeric string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite('foo')")).toBe(false);
      });

      it("should return true for regular number", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(42)")).toBe(true);
      });

      it("should return true for null", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(null)")).toBe(true);
      });

      it("should return true for numeric string", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite('42')")).toBe(true);
      });

      it("should return true for zero", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(0)")).toBe(true);
      });

      it("should return true for booleans", () => {
        const interpreter = new Interpreter(ES5);
        expect(interpreter.evaluate("isFinite(true)")).toBe(true);
        expect(interpreter.evaluate("isFinite(false)")).toBe(true);
      });
    });
  });

  describe("ES2015", () => {
    describe("Number.isNaN", () => {
      it("should return true for NaN", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isNaN(NaN)")).toBe(true);
      });

      it("should return false for number", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isNaN(42)")).toBe(false);
      });

      it("should return false for numeric string", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isNaN('NaN')")).toBe(false);
      });
    });

    describe("Number.isFinite", () => {
      it("should return true for finite number", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isFinite(42)")).toBe(true);
      });

      it("should return false for Infinity", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isFinite(Infinity)")).toBe(false);
      });

      it("should return false for numeric string", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isFinite('42')")).toBe(false);
      });
    });

    describe("Number.isInteger", () => {
      it("should return true for integer", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isInteger(42)")).toBe(true);
      });

      it("should return true for -0", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isInteger(-0)")).toBe(true);
      });

      it("should return false for float", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isInteger(3.14)")).toBe(false);
      });

      it("should return false for numeric string", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isInteger('42')")).toBe(false);
      });
    });

    describe("Number.isSafeInteger", () => {
      it("should return true for safe integers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isSafeInteger(42)")).toBe(true);
      });

      it("should return false for unsafe integers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isSafeInteger(9007199254740992)")).toBe(false);
      });

      it("should return false for non-integers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isSafeInteger(3.14)")).toBe(false);
      });
    });

    describe("Number.parseInt", () => {
      it("should parse integer", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseInt('42')")).toBe(42);
      });

      it("should parse hex", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseInt('FF', 16)")).toBe(255);
      });

      it("should parse up to first non-digit", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseInt('10px')")).toBe(10);
      });
    });

    describe("Number.parseFloat", () => {
      it("should parse float", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseFloat('3.14')")).toBeCloseTo(3.14, 2);
      });
    });

    describe("Number.MAX_SAFE_INTEGER", () => {
      it("should have correct value", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.MAX_SAFE_INTEGER")).toBe(9007199254740991);
      });
    });

    describe("Number.MIN_SAFE_INTEGER", () => {
      it("should have correct value", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.MIN_SAFE_INTEGER")).toBe(-9007199254740991);
      });
    });

    describe("Number.EPSILON", () => {
      it("should be a small positive number", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.EPSILON > 0 && Number.EPSILON < 1")).toBe(true);
      });
    });

    describe("Number constructors and methods", () => {
      it("Number.isNaN should return true only for NaN", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isNaN(NaN)")).toBe(true);
        expect(interpreter.evaluate("Number.isNaN(42)")).toBe(false);
      });

      it("Number.isFinite should return true only for finite numbers", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isFinite(42)")).toBe(true);
        expect(interpreter.evaluate("Number.isFinite(Infinity)")).toBe(false);
      });

      it("Number.isInteger should check if value is integer", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.isInteger(42)")).toBe(true);
        expect(interpreter.evaluate("Number.isInteger(3.14)")).toBe(false);
      });

      it("Number.parseInt should parse integer", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseInt('42')")).toBe(42);
      });

      it("Number.parseFloat should parse float", () => {
        const interpreter = new Interpreter(ES2015);
        expect(interpreter.evaluate("Number.parseFloat('3.14')")).toBeCloseTo(3.14, 2);
      });
    });
  });

  describe("ES2021", () => {
    describe("Numeric separators", () => {
      it("should support numeric separators", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("1_000_000")).toBe(1000000);
      });

      it("should support in hex", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("0x1_000")).toBe(4096);
      });

      it("should support underscores in decimal integers", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("1_000")).toBe(1000);
        expect(interpreter.evaluate("1_000_000")).toBe(1000000);
        expect(interpreter.evaluate("1_234_567_890")).toBe(1234567890);
      });

      it("should support underscores in hexadecimal", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("0xFF_FF")).toBe(0xffff);
        expect(interpreter.evaluate("0x00_FF_00_FF")).toBe(0x00ff00ff);
        expect(interpreter.evaluate("0xDEAD_BEEF")).toBe(0xdeadbeef);
      });

      it("should support underscores in binary", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("0b1010_1010")).toBe(0b10101010);
        expect(interpreter.evaluate("0b1111_0000_1111_0000")).toBe(0b1111000011110000);
      });

      it("should support underscores in octal", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("0o77_77")).toBe(0o7777);
        expect(interpreter.evaluate("0o12_34_56")).toBe(0o123456);
      });

      it("should support underscores in decimal floats", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("1_000.5")).toBe(1000.5);
        expect(interpreter.evaluate("1_000.123_456")).toBe(1000.123456);
      });

      it("should work in expressions", () => {
        const interpreter = new Interpreter(ES2021);
        expect(interpreter.evaluate("1_000 + 2_000")).toBe(3000);
        expect(interpreter.evaluate("0xFF_00 | 0x00_FF")).toBe(0xffff);
      });
    });
  });
});
