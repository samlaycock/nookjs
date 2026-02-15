import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024, TextCodecAPI, BufferAPI, preset } from "../src/presets";

describe("TextCodec", () => {
  describe("API", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(preset(ES2024, TextCodecAPI, BufferAPI));
    });

    describe("TextEncoder", () => {
      it("should be available", () => {
        expect(interpreter.evaluate("typeof TextEncoder")).toBe("function");
      });

      it("should have encoding property", () => {
        expect(interpreter.evaluate("new TextEncoder().encoding")).toBe("utf-8");
      });

      it("should encode string to Uint8Array", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          encoder.encode('abc').length
        `);
        expect(result).toBe(3);
      });

      it("should encode single character", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          encoder.encode('A')[0]
        `);
        expect(result).toBe(65);
      });

      it("should encode and return correct byte values", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const bytes = encoder.encode('Hello');
          [bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]]
        `);
        expect(result).toEqual([72, 101, 108, 108, 111]); // 'H', 'e', 'l', 'l', 'o'
      });

      it("should encode into existing Uint8Array with encodeInto", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const buffer = new Uint8Array(10);
          const result = encoder.encodeInto('Hello', buffer);
          [result.read, result.written, buffer[0], buffer[4]]
        `);
        expect(result).toEqual([5, 5, 72, 111]); // 'H' = 72, 'o' = 111
      });
    });

    describe("TextDecoder", () => {
      it("should be available", () => {
        expect(interpreter.evaluate("typeof TextDecoder")).toBe("function");
      });

      it("should have encoding property", () => {
        expect(interpreter.evaluate("new TextDecoder().encoding")).toBe("utf-8");
      });

      it("should decode Uint8Array to string", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const encoded = encoder.encode('abc');
          decoder.decode(encoded)
        `);
        expect(result).toBe("abc");
      });

      it("should decode empty array", () => {
        const result = interpreter.evaluate(`
          const decoder = new TextDecoder();
          decoder.decode(new Uint8Array([]))
        `);
        expect(result).toBe("");
      });

      it("should handle unicode", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const original = 'Hello 世界 🌍';
          const encoded = encoder.encode(original);
          decoder.decode(encoded) === original
        `);
        expect(result).toBe(true);
      });

      it("should decode ArrayBuffer directly", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const encoded = encoder.encode('test');
          decoder.decode(encoded.buffer)
        `);
        expect(result).toBe("test");
      });

      it("should decode Int8Array", () => {
        const result = interpreter.evaluate(`
          const decoder = new TextDecoder();
          const arr = new Int8Array([72, 105]); // 'Hi'
          decoder.decode(arr)
        `);
        expect(result).toBe("Hi");
      });

      it("should roundtrip various strings", () => {
        const result = interpreter.evaluate(`
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const strings = ['', 'a', 'hello', '你好', '🎉🎊', 'mixed 混合 🔥'];
          strings.every(s => decoder.decode(encoder.encode(s)) === s)
        `);
        expect(result).toBe(true);
      });
    });
  });
});

describe("BufferAPI", () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter(preset(ES2024, BufferAPI));
  });

  describe("TypedArray creation and reading", () => {
    it("should create and read Int32Array", () => {
      const result = interpreter.evaluate(`
        const arr = new Int32Array([1, 2, 3, 4]);
        [arr.length, arr[0], arr[3]]
      `);
      expect(result).toEqual([4, 1, 4]);
    });

    it("should create and read Float64Array", () => {
      const result = interpreter.evaluate(`
        const arr = new Float64Array([1.5, 2.5, 3.5]);
        [arr.length, arr[0], arr[2]]
      `);
      expect(result).toEqual([3, 1.5, 3.5]);
    });

    it("should create and read BigInt64Array", () => {
      const result = interpreter.evaluate(`
        const arr = new BigInt64Array([1n, 2n, 9007199254740993n]);
        [arr.length, arr[0], arr[2]]
      `);
      expect(result).toEqual([3, 1n, 9007199254740993n]);
    });

    it("should create Uint8ClampedArray", () => {
      const result = interpreter.evaluate(`
        const arr = new Uint8ClampedArray([0, 128, 255]);
        [arr.length, arr[0], arr[1], arr[2]]
      `);
      expect(result).toEqual([3, 0, 128, 255]);
    });

    it("should slice TypedArray (creates copy)", () => {
      const result = interpreter.evaluate(`
        const arr = new Uint8Array([1, 2, 3, 4, 5]);
        const sliced = arr.slice(1, 4);
        [sliced.length, sliced[0], sliced[2]]
      `);
      expect(result).toEqual([3, 2, 4]);
    });

    it("should get subarray view", () => {
      const result = interpreter.evaluate(`
        const arr = new Uint8Array([1, 2, 3, 4, 5]);
        const sub = arr.subarray(1, 4);
        [sub.length, sub[0], sub[2]]
      `);
      expect(result).toEqual([3, 2, 4]);
    });

    it("should write to TypedArray elements", () => {
      const result = interpreter.evaluate(`
        const arr = new Uint8Array(3);
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;
        [arr[0], arr[1], arr[2]]
      `);
      expect(result).toEqual([10, 20, 30]);
    });

    it("should create TypedArray from ArrayBuffer and write to it", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(8);
        const view = new Uint8Array(buffer);
        view[0] = 255;
        view[7] = 128;
        [view.length, view[0], view[7]]
      `);
      expect(result).toEqual([8, 255, 128]);
    });

    it("should share underlying buffer between views", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(4);
        const uint8 = new Uint8Array(buffer);
        const uint32 = new Uint32Array(buffer);
        uint32[0] = 0x04030201;
        [uint8[0], uint8[1], uint8[2], uint8[3]]
      `);
      // Little-endian: 0x04030201 stored as [0x01, 0x02, 0x03, 0x04]
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should allow subarray mutation to affect original", () => {
      const result = interpreter.evaluate(`
        const arr = new Uint8Array([1, 2, 3, 4, 5]);
        const sub = arr.subarray(1, 4);
        sub[0] = 99;
        [arr[1], sub[0], sub.length]
      `);
      expect(result).toEqual([99, 99, 3]);
    });

    it("should access TypedArray properties", () => {
      const result = interpreter.evaluate(`
        const arr = new Int16Array([1, 2, 3]);
        [arr.byteLength, arr.byteOffset, arr.BYTES_PER_ELEMENT]
      `);
      expect(result).toEqual([6, 0, 2]); // 3 elements * 2 bytes each
    });
  });

  describe("ArrayBuffer operations", () => {
    it("should create ArrayBuffer with specified size", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(16);
        buffer.byteLength
      `);
      expect(result).toBe(16);
    });

    it("should slice ArrayBuffer from encoded data", () => {
      const interpreter = new Interpreter(preset(ES2024, BufferAPI, TextCodecAPI));
      const result = interpreter.evaluate(`
        const encoder = new TextEncoder();
        const encoded = encoder.encode('Hello World');
        const sliced = encoded.buffer.slice(0, 5);
        sliced.byteLength
      `);
      expect(result).toBe(5);
    });

    it("should check ArrayBuffer.isView", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(8);
        const arr = new Uint8Array([1, 2, 3]);
        [ArrayBuffer.isView(buffer), ArrayBuffer.isView(arr)]
      `);
      expect(result).toEqual([false, true]);
    });
  });

  describe("DataView operations", () => {
    it("should create DataView from ArrayBuffer", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        [view.byteLength, view.byteOffset]
      `);
      expect(result).toEqual([8, 0]);
    });

    it("should create DataView with offset and length", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer, 4, 8);
        [view.byteLength, view.byteOffset]
      `);
      expect(result).toEqual([8, 4]);
    });

    it("should read and write integers", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setInt32(0, 12345, true);  // little-endian
        view.setInt32(4, -6789, false); // big-endian
        [view.getInt32(0, true), view.getInt32(4, false)]
      `);
      expect(result).toEqual([12345, -6789]);
    });

    it("should read and write floats", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, 3.14159265359, true);
        Math.abs(view.getFloat64(0, true) - 3.14159265359) < 0.0000001
      `);
      expect(result).toBe(true);
    });

    it("should handle BigInt types", () => {
      const result = interpreter.evaluate(`
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        view.setBigInt64(0, 9007199254740993n, true);
        view.setBigUint64(8, 18446744073709551615n, true);
        [view.getBigInt64(0, true), view.getBigUint64(8, true)]
      `);
      expect(result).toEqual([9007199254740993n, 18446744073709551615n]);
    });
  });

  describe("TypedArray static methods", () => {
    it("should use Uint8Array.from", () => {
      const result = interpreter.evaluate(`
        const arr = Uint8Array.from([1, 2, 3]);
        [arr.length, arr[0], arr[2]]
      `);
      expect(result).toEqual([3, 1, 3]);
    });

    it("should use Uint8Array.of", () => {
      const result = interpreter.evaluate(`
        const arr = Uint8Array.of(10, 20, 30);
        [arr.length, arr[0], arr[2]]
      `);
      expect(result).toEqual([3, 10, 30]);
    });

    it("should use Int32Array.from with mapping function", () => {
      const result = interpreter.evaluate(`
        const arr = Int32Array.from([1, 2, 3], x => x * 2);
        [arr.length, arr[0], arr[1], arr[2]]
      `);
      expect(result).toEqual([3, 2, 4, 6]);
    });

    it("should use Float64Array.of", () => {
      const result = interpreter.evaluate(`
        const arr = Float64Array.of(1.5, 2.5, 3.5);
        [arr.length, arr[0], arr[2]]
      `);
      expect(result).toEqual([3, 1.5, 3.5]);
    });
  });
});
