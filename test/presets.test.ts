import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import {
  preset,
  ES5,
  ES2022,
  FetchAPI,
  ConsoleAPI,
  TimersAPI,
  TextCodecAPI,
  CryptoAPI,
  RegExpAPI,
  IntlAPI,
  BufferAPI,
  StreamsAPI,
  BlobAPI,
  PerformanceAPI,
  EventAPI,
} from "../src/presets";

describe("preset() function", () => {
  describe("globals merging", () => {
    it("should merge globals from multiple presets", () => {
      const result = preset({ globals: { a: 1 } }, { globals: { b: 2 } });

      expect(result.globals).toEqual({ a: 1, b: 2 });
    });

    it("should allow later presets to override earlier globals", () => {
      const result = preset({ globals: { x: 1 } }, { globals: { x: 2 } });

      expect(result.globals).toEqual({ x: 2 });
    });

    it("should preserve globals when preset has no globals", () => {
      const result = preset(
        { globals: { a: 1 } },
        { featureControl: { mode: "whitelist", features: [] } },
      );

      expect(result.globals).toEqual({ a: 1 });
    });
  });

  describe("featureControl merging", () => {
    it("should union features when both are whitelists", () => {
      const result = preset(
        {
          featureControl: {
            mode: "whitelist",
            features: ["IfStatement", "WhileStatement"],
          },
        },
        {
          featureControl: {
            mode: "whitelist",
            features: ["ForStatement", "IfStatement"],
          },
        },
      );

      expect(result.featureControl?.mode).toBe("whitelist");
      expect(result.featureControl?.features).toContain("IfStatement");
      expect(result.featureControl?.features).toContain("WhileStatement");
      expect(result.featureControl?.features).toContain("ForStatement");
      // Should deduplicate
      expect(result.featureControl?.features.filter((f) => f === "IfStatement").length).toBe(1);
    });

    it("should union features when both are blacklists", () => {
      const result = preset(
        { featureControl: { mode: "blacklist", features: ["Classes"] } },
        { featureControl: { mode: "blacklist", features: ["Generators"] } },
      );

      expect(result.featureControl?.mode).toBe("blacklist");
      expect(result.featureControl?.features).toContain("Classes");
      expect(result.featureControl?.features).toContain("Generators");
    });

    it("should use whitelist when modes differ (whitelist is more restrictive)", () => {
      const result = preset(
        {
          featureControl: {
            mode: "whitelist",
            features: ["IfStatement", "WhileStatement", "Classes"],
          },
        },
        { featureControl: { mode: "blacklist", features: ["Classes"] } },
      );

      expect(result.featureControl?.mode).toBe("whitelist");
      // Classes should be removed because it's blacklisted
      expect(result.featureControl?.features).toContain("IfStatement");
      expect(result.featureControl?.features).toContain("WhileStatement");
      expect(result.featureControl?.features).not.toContain("Classes");
    });

    it("should preserve featureControl when preset has no featureControl", () => {
      const result = preset(
        { featureControl: { mode: "whitelist", features: ["IfStatement"] } },
        { globals: { x: 1 } },
      );

      expect(result.featureControl?.mode).toBe("whitelist");
      expect(result.featureControl?.features).toContain("IfStatement");
    });
  });

  describe("security merging", () => {
    it("should merge security options", () => {
      const result = preset(
        { security: { sanitizeErrors: true } },
        { security: { hideHostErrorMessages: false } },
      );

      expect(result.security?.sanitizeErrors).toBe(true);
      expect(result.security?.hideHostErrorMessages).toBe(false);
    });

    it("should allow later presets to override security options", () => {
      const result = preset(
        { security: { sanitizeErrors: true, hideHostErrorMessages: true } },
        { security: { hideHostErrorMessages: false } },
      );

      expect(result.security?.sanitizeErrors).toBe(true);
      expect(result.security?.hideHostErrorMessages).toBe(false);
    });
  });

  describe("validator merging", () => {
    it("should use the last validator", () => {
      const validator1 = (() => true) as any;
      const validator2 = (() => true) as any;

      const result = preset({ validator: validator1 }, { validator: validator2 });

      expect(result.validator).toBe(validator2);
    });
  });

  describe("combining ES presets with addon presets", () => {
    it("should combine ES2022 with FetchAPI", () => {
      const result = preset(ES2022, FetchAPI);

      // Should have ES2022 features
      expect(result.featureControl?.features).toContain("AsyncAwait");
      expect(result.featureControl?.features).toContain("Classes");

      // Should have ES2022 globals
      expect(result.globals?.Promise).toBe(Promise);
      expect(result.globals?.Map).toBe(Map);

      // Should have FetchAPI globals
      expect(result.globals?.fetch).toBe(fetch);
      expect(result.globals?.Request).toBe(Request);
      expect(result.globals?.Response).toBe(Response);
    });

    it("should combine multiple addon presets", () => {
      const result = preset(ES2022, FetchAPI, ConsoleAPI, TimersAPI);

      // Should have all globals
      expect(result.globals?.fetch).toBe(fetch);
      expect(result.globals?.console).toBe(console);
      expect(result.globals?.setTimeout).toBe(setTimeout);
    });

    it("should allow custom options after presets", () => {
      const result = preset(ES2022, FetchAPI, {
        security: { hideHostErrorMessages: false },
      });

      expect(result.globals?.fetch).toBe(fetch);
      expect(result.security?.hideHostErrorMessages).toBe(false);
    });
  });
});

describe("Addon Presets", () => {
  describe("FetchAPI", () => {
    it("should provide fetch globals", () => {
      expect(FetchAPI.globals?.fetch).toBe(fetch);
      expect(FetchAPI.globals?.Request).toBe(Request);
      expect(FetchAPI.globals?.Response).toBe(Response);
      expect(FetchAPI.globals?.Headers).toBe(Headers);
      expect(FetchAPI.globals?.AbortController).toBe(AbortController);
      expect(FetchAPI.globals?.URL).toBe(URL);
      expect(FetchAPI.globals?.URLSearchParams).toBe(URLSearchParams);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, FetchAPI));

      // Test URL construction
      const result = await interpreter.evaluateAsync(`
        const url = new URL('https://example.com/path');
        url.pathname
      `);
      expect(result).toBe("/path");
    });
  });

  describe("ConsoleAPI", () => {
    it("should provide console global", () => {
      expect(ConsoleAPI.globals?.console).toBe(console);
    });

    it("should work with interpreter", () => {
      const logs: any[] = [];
      const mockConsole = { log: (...args: any[]) => logs.push(args) };

      const interpreter = new Interpreter(preset(ES2022, { globals: { console: mockConsole } }));
      interpreter.evaluate(`console.log('hello', 42)`);

      expect(logs).toEqual([["hello", 42]]);
    });
  });

  describe("TimersAPI", () => {
    it("should provide timer globals", () => {
      expect(TimersAPI.globals?.setTimeout).toBe(setTimeout);
      expect(TimersAPI.globals?.clearTimeout).toBe(clearTimeout);
      expect(TimersAPI.globals?.setInterval).toBe(setInterval);
      expect(TimersAPI.globals?.clearInterval).toBe(clearInterval);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, TimersAPI));

      const start = Date.now();
      await interpreter.evaluateAsync(`
        await new Promise(resolve => setTimeout(resolve, 50));
      `);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some timing variance
    });
  });

  describe("TextCodecAPI", () => {
    it("should provide TextEncoder/TextDecoder globals", () => {
      expect(TextCodecAPI.globals?.TextEncoder).toBe(TextEncoder);
      expect(TextCodecAPI.globals?.TextDecoder).toBe(TextDecoder);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, TextCodecAPI));

      const result = await interpreter.evaluateAsync(`
        const encoder = new TextEncoder();
        const bytes = encoder.encode('hello');
        bytes.length
      `);
      expect(result).toBe(5);
    });
  });

  describe("CryptoAPI", () => {
    it("should provide crypto global", () => {
      expect(CryptoAPI.globals?.crypto).toBe(crypto);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, CryptoAPI));

      const result = await interpreter.evaluateAsync(`
        const uuid = crypto.randomUUID();
        typeof uuid === 'string' && uuid.length === 36
      `);
      expect(result).toBe(true);
    });
  });

  describe("RegExpAPI", () => {
    it("should provide RegExp global", () => {
      expect(RegExpAPI.globals?.RegExp).toBe(RegExp);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, RegExpAPI));

      const result = await interpreter.evaluateAsync(`
        const pattern = new RegExp('hello', 'i');
        pattern.test('Hello World')
      `);
      expect(result).toBe(true);
    });
  });

  describe("IntlAPI", () => {
    it("should provide Intl global", () => {
      expect(IntlAPI.globals?.Intl).toBe(Intl);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, IntlAPI));

      // Test that Intl object is accessible and has expected properties
      const result = await interpreter.evaluateAsync(`
        typeof Intl === 'object' && typeof Intl.DateTimeFormat === 'function'
      `);
      expect(result).toBe(true);
    });
  });

  describe("BufferAPI", () => {
    it("should provide ArrayBuffer and typed array globals", () => {
      expect(BufferAPI.globals?.ArrayBuffer).toBe(ArrayBuffer);
      expect(BufferAPI.globals?.DataView).toBe(DataView);
      expect(BufferAPI.globals?.Uint8Array).toBe(Uint8Array);
      expect(BufferAPI.globals?.Int32Array).toBe(Int32Array);
      expect(BufferAPI.globals?.Float64Array).toBe(Float64Array);
    });

    it("should work with interpreter - ArrayBuffer", async () => {
      const interpreter = new Interpreter(preset(ES2022, BufferAPI));

      const result = await interpreter.evaluateAsync(`
        const buffer = new ArrayBuffer(16);
        buffer.byteLength
      `);
      expect(result).toBe(16);
    });

    it("should support typed arrays", async () => {
      const interpreter = new Interpreter(preset(ES2022, BufferAPI));

      const result = await interpreter.evaluateAsync(`
        const arr = new Uint8Array(5);
        arr.length
      `);
      expect(result).toBe(5);
    });
  });

  describe("StreamsAPI", () => {
    it("should provide stream globals", () => {
      expect(StreamsAPI.globals?.ReadableStream).toBe(ReadableStream);
      expect(StreamsAPI.globals?.WritableStream).toBe(WritableStream);
      expect(StreamsAPI.globals?.TransformStream).toBe(TransformStream);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, StreamsAPI));

      // Test that stream constructors are available
      const result = await interpreter.evaluateAsync(`
        typeof ReadableStream === 'function' && typeof WritableStream === 'function'
      `);
      expect(result).toBe(true);
    });
  });

  describe("BlobAPI", () => {
    it("should provide Blob and File globals", () => {
      expect(BlobAPI.globals?.Blob).toBe(Blob);
      expect(BlobAPI.globals?.File).toBe(File);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, BlobAPI));

      const result = await interpreter.evaluateAsync(`
        const blob = new Blob(['hello'], { type: 'text/plain' });
        blob.size
      `);
      expect(result).toBe(5);
    });
  });

  describe("PerformanceAPI", () => {
    it("should provide performance global", () => {
      expect(PerformanceAPI.globals?.performance).toBe(performance);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, PerformanceAPI));

      const result = await interpreter.evaluateAsync(`
        const start = performance.now();
        typeof start === 'number' && start > 0
      `);
      expect(result).toBe(true);
    });
  });

  describe("EventAPI", () => {
    it("should provide event globals", () => {
      expect(EventAPI.globals?.Event).toBe(Event);
      expect(EventAPI.globals?.EventTarget).toBe(EventTarget);
      expect(EventAPI.globals?.CustomEvent).toBe(CustomEvent);
    });

    it("should work with interpreter", async () => {
      const interpreter = new Interpreter(preset(ES2022, EventAPI));

      // Test that Event can be constructed
      const result = await interpreter.evaluateAsync(`
        const event = new Event('test');
        event.type
      `);
      expect(result).toBe("test");
    });
  });
});

describe("ES Presets include Error types", () => {
  it("ES5 should include Error constructors", () => {
    expect(ES5.globals?.Error).toBe(Error);
    expect(ES5.globals?.TypeError).toBe(TypeError);
    expect(ES5.globals?.ReferenceError).toBe(ReferenceError);
    expect(ES5.globals?.SyntaxError).toBe(SyntaxError);
    expect(ES5.globals?.RangeError).toBe(RangeError);
  });

  it("ES2022 should inherit Error constructors", () => {
    expect(ES2022.globals?.Error).toBe(Error);
    expect(ES2022.globals?.TypeError).toBe(TypeError);
  });

  it("should allow creating errors", async () => {
    const interpreter = new Interpreter(preset(ES2022));

    const result = await interpreter.evaluateAsync(`
      const err = new TypeError('test error');
      [err.name, err.message]
    `);
    expect(result).toEqual(["TypeError", "test error"]);
  });
});

describe("Integration: Full preset combinations", () => {
  it("should create a fully-featured interpreter", async () => {
    const interpreter = new Interpreter(
      preset(ES2022, FetchAPI, ConsoleAPI, TextCodecAPI, CryptoAPI),
    );

    // Test that all globals are available
    const result = await interpreter.evaluateAsync(`
      const checks = [
        typeof fetch === 'function',
        typeof console === 'object',
        typeof TextEncoder === 'function',
        typeof crypto === 'object',
        typeof Promise === 'function',
        typeof Map === 'function',
        typeof Error === 'function',
      ];
      checks.every(c => c === true)
    `);
    expect(result).toBe(true);
  });

  it("should respect security overrides", async () => {
    const interpreter = new Interpreter(
      preset(ES2022, {
        globals: {
          throwError: () => {
            throw new Error("secret");
          },
        },
        security: { hideHostErrorMessages: false },
      }),
    );

    return expect(interpreter.evaluateAsync("throwError()")).rejects.toThrow("secret");
  });
});
