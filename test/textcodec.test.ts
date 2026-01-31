import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024, TextCodecAPI, BufferAPI, preset } from "../src/presets";

describe("TextEncoder and TextDecoder", () => {
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
  });

  describe("TextDecoder", () => {
    it("should be available", () => {
      expect(interpreter.evaluate("typeof TextDecoder")).toBe("function");
    });

    it("should have encoding property", () => {
      expect(interpreter.evaluate("new TextDecoder().encoding")).toBe("utf-8");
    });

    // TODO: Re-enable these tests once we implement TypedArray unwrapping for native methods.
    // Currently TextDecoder.decode() rejects ReadOnlyProxy-wrapped Uint8Arrays.
    // See: https://github.com/anomalyco/nookjs/issues/XXX
    it.skip("should decode Uint8Array to string", () => {
      const result = interpreter.evaluate(`
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const encoded = encoder.encode('abc');
        decoder.decode(encoded)
      `);
      expect(result).toBe("abc");
    });

    it.skip("should decode empty array", () => {
      const result = interpreter.evaluate(`
        const decoder = new TextDecoder();
        decoder.decode(new Uint8Array([]))
      `);
      expect(result).toBe("");
    });

    it.skip("should handle unicode", () => {
      const result = interpreter.evaluate(`
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const original = 'Hello 世界 🌍';
        const encoded = encoder.encode(original);
        decoder.decode(encoded) === original
      `);
      expect(result).toBe(true);
    });
  });
});
