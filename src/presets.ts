import type { InterpreterOptions, LanguageFeature } from "./interpreter";

/**
 * Preset configurations for different ECMAScript versions.
 *
 * These presets configure the interpreter to support specific ECMAScript language versions
 * by whitelisting the appropriate language features and providing era-appropriate globals.
 *
 * Usage:
 * ```typescript
 * import { Interpreter } from "./interpreter";
 * import { ES2015, ES2020 } from "./presets";
 *
 * const es2015Interpreter = new Interpreter(ES2015);
 * const es2020Interpreter = new Interpreter(ES2020);
 * ```
 */

/**
 * ES5 (ECMAScript 5) - December 2009
 *
 * The baseline JavaScript standard. Includes:
 * - Function declarations and expressions
 * - var declarations (function-scoped)
 * - for/while/for-in loops
 * - Arrays and objects
 * - Basic operators and control flow
 * - try/catch/throw error handling
 * - switch statements
 *
 * Excludes:
 * - let/const (added in ES2015)
 * - Arrow functions (ES2015)
 * - Classes (ES2015)
 * - Promises (ES2015)
 * - Template literals (ES2015)
 * - Destructuring (ES2015)
 * - Spread/rest operators (ES2015)
 * - for-of loops (ES2015)
 * - async/await (ES2017)
 */
export const ES5: InterpreterOptions = {
  featureControl: {
    mode: "whitelist",
    features: [
      // Control flow
      "IfStatement",
      "WhileStatement",
      "DoWhileStatement",
      "ForStatement",
      "ForInStatement",
      "SwitchStatement",
      "TryCatchStatement",

      // Functions
      "FunctionDeclarations",
      "FunctionExpressions",
      "CallExpression",
      "NewExpression",
      "ReturnStatement",

      // Variables (only var in ES5)
      "VariableDeclarations",

      // Expressions
      "BinaryOperators",
      "UnaryOperators",
      "LogicalOperators",
      "UpdateExpression",
      "ConditionalExpression",
      "MemberExpression",
      "ThisExpression",

      // Literals and data structures
      "ObjectLiterals",
      "ArrayLiterals",

      // Control statements
      "BreakStatement",
      "ContinueStatement",
      "ThrowStatement",
    ],
  },
  globals: {
    // ES5 globals
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
    JSON,
    Error,
    TypeError,
    ReferenceError,
    SyntaxError,
    RangeError,
    URIError,
    EvalError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,
  },
};

/**
 * ES6 / ES2015 (ECMAScript 2015) - June 2015
 *
 * Major update that introduced:
 * - let and const (block-scoped variables)
 * - Arrow functions
 * - Template literals
 * - Destructuring (arrays and objects)
 * - Spread operator (arrays, objects, calls)
 * - Rest parameters
 * - for-of loops
 * - Default parameters
 * - Promises
 * - Symbol
 * - Map, Set, WeakMap, WeakSet
 * - Classes
 * - Modules (not applicable to interpreter)
 * - Generators
 */
export const ES2015: InterpreterOptions = {
  featureControl: {
    mode: "whitelist",
    features: [
      // All ES5 features
      ...(ES5.featureControl!.features as LanguageFeature[]),

      // ES2015 additions
      "LetConst",
      "ArrowFunctions",
      "TemplateLiterals",
      "Destructuring",
      "SpreadOperator",
      "RestParameters",
      "ForOfStatement",
      "DefaultParameters",
      "Generators",
      "YieldExpression",
      "Classes",
    ],
  },
  globals: {
    // ES5 globals
    ...ES5.globals,
    // ES6 additions
    Promise,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
  },
};

/**
 * ES6 alias for ES2015
 */
export const ES6 = ES2015;

/**
 * ES2016 (ECMAScript 2016) - June 2016
 *
 * Small update that added:
 * - Array.prototype.includes (on prototype, automatically available)
 * - Exponentiation operator (**)
 *
 * Note: The interpreter's BinaryOperators feature includes ** (exponentiation),
 * which was technically added in ES2016, but for simplicity it's bundled with
 * all other binary operators from ES5. To strictly enforce ES2016 semantics,
 * you would need to use a custom validator to check for ** usage.
 */
export const ES2016: InterpreterOptions = {
  ...ES2015,
  globals: {
    ...ES2015.globals,
    // ES2016 additions (Array.prototype.includes is on the prototype)
  },
};

/**
 * ES2017 (ECMAScript 2017) - June 2017
 *
 * Added:
 * - async/await
 * - Object.values() / Object.entries() (via globals)
 * - String padding methods (on prototype)
 * - Shared memory and atomics (not applicable)
 */
export const ES2017: InterpreterOptions = {
  featureControl: {
    mode: "whitelist",
    features: [
      // All ES2016 features
      ...(ES2016.featureControl!.features as LanguageFeature[]),
      // ES2017 additions
      "AsyncAwait",
    ],
  },
  globals: {
    ...ES2016.globals,
    // ES2017 additions (Object.values/entries are on Object prototype)
  },
};

/**
 * ES2018 (ECMAScript 2018) - June 2018
 *
 * Added:
 * - Rest/spread properties for objects (already supported)
 * - Async iteration (supported via async generators and Symbol.asyncIterator)
 * - Promise.finally() (on prototype)
 * - RegExp improvements (on prototype)
 */
export const ES2018: InterpreterOptions = {
  ...ES2017,
  featureControl: {
    mode: "whitelist" as const,
    features: [...(ES2017.featureControl!.features as LanguageFeature[]), "AsyncGenerators"],
  },
};

/**
 * ES2019 (ECMAScript 2019) - June 2019
 *
 * Added:
 * - Array.prototype.flat() / flatMap() (on prototype)
 * - Object.fromEntries() (on Object)
 * - String.prototype.trimStart() / trimEnd() (on prototype)
 * - Optional catch binding (parser-level, automatically supported)
 * - Symbol.description (on Symbol prototype)
 */
export const ES2019: InterpreterOptions = {
  ...ES2018,
  // No new language features at interpreter level
};

/**
 * ES2020 (ECMAScript 2020) - June 2020
 *
 * Added:
 * - Nullish coalescing (??) (supported via LogicalOperators)
 * - Optional chaining (?.)
 * - BigInt (via globals)
 * - Promise.allSettled() (on Promise)
 * - globalThis (via globals)
 * - Dynamic import (not applicable)
 *
 * Note: Nullish coalescing is included under LogicalOperators in all presets.
 */
export const ES2020: InterpreterOptions = {
  ...ES2019,
  featureControl: {
    mode: "whitelist" as const,
    features: [
      ...(ES2019.featureControl!.features as LanguageFeature[]),
      "OptionalChaining",
      "BigIntLiteral",
    ],
  },
  globals: {
    ...ES2019.globals,
    // ES2020 additions
    BigInt,
    globalThis: typeof globalThis !== "undefined" ? globalThis : global,
  },
};

/**
 * ES2021 (ECMAScript 2021) - June 2021
 *
 * Added:
 * - String.prototype.replaceAll() (on prototype)
 * - Promise.any() (on Promise)
 * - WeakRef (via globals)
 * - FinalizationRegistry (via globals)
 * - Logical assignment operators (||=, &&=, ??=)
 * - Numeric separators (parser-level, automatically supported)
 */
export const ES2021: InterpreterOptions = {
  ...ES2020,
  featureControl: {
    mode: "whitelist" as const,
    features: [...(ES2020.featureControl!.features as LanguageFeature[]), "LogicalAssignment"],
  },
  globals: {
    ...ES2020.globals,
    // ES2021 additions
    WeakRef: typeof WeakRef !== "undefined" ? WeakRef : undefined,
    FinalizationRegistry:
      typeof FinalizationRegistry !== "undefined" ? FinalizationRegistry : undefined,
  },
};

/**
 * ES2022 (ECMAScript 2022) - June 2022
 *
 * Added:
 * - Top-level await (module-level, not applicable)
 * - Class fields (public instance and static fields)
 * - Private methods and fields (#privateField, #privateMethod)
 * - Static initialization blocks (static { })
 * - RegExp match indices (on RegExp)
 * - Array.prototype.at() (on prototype)
 * - Object.hasOwn() (on Object)
 * - Error.cause (on Error)
 */
export const ES2022: InterpreterOptions = {
  ...ES2021,
  featureControl: {
    mode: "whitelist" as const,
    features: [
      ...(ES2021.featureControl!.features as LanguageFeature[]),
      "ClassFields",
      "PrivateFields",
      "StaticBlocks",
    ],
  },
};

/**
 * ES2023 (ECMAScript 2023) - June 2023
 *
 * Added:
 * - Array.prototype.findLast() / findLastIndex() (on prototype)
 * - Array.prototype.toReversed() / toSorted() / toSpliced() / with() (on prototype)
 * - Hashbang grammar (parser-level, automatically supported)
 * - Symbols as WeakMap keys (runtime behavior)
 */
export const ES2023: InterpreterOptions = {
  ...ES2022,
  // No new language features at interpreter level
};

/**
 * ES2024 (ECMAScript 2024) - June 2024
 *
 * Added:
 * - Promise.withResolvers() (on Promise)
 * - Object.groupBy() / Map.groupBy() (on Object/Map)
 * - ArrayBuffer transfer methods (on ArrayBuffer)
 * - RegExp v flag (on RegExp)
 */
export const ES2024: InterpreterOptions = {
  ...ES2023,
  // No new language features at interpreter level
};

/**
 * ESNext - Latest features
 *
 * Includes all features currently supported by the interpreter,
 * regardless of standardization status.
 */
export const ESNext: InterpreterOptions = {
  // No feature control - allow everything
  globals: {
    ...ES2024.globals,
    // Add any experimental globals here
  },
};

/**
 * Helper to get all available preset names
 */
export const PRESET_NAMES = [
  "ES5",
  "ES6",
  "ES2015",
  "ES2016",
  "ES2017",
  "ES2018",
  "ES2019",
  "ES2020",
  "ES2021",
  "ES2022",
  "ES2023",
  "ES2024",
  "ESNext",
] as const;

export type PresetName = (typeof PRESET_NAMES)[number];

/**
 * Get a preset by name
 */
export function getPreset(name: PresetName): InterpreterOptions {
  const presets: Record<PresetName, InterpreterOptions> = {
    ES5,
    ES6,
    ES2015,
    ES2016,
    ES2017,
    ES2018,
    ES2019,
    ES2020,
    ES2021,
    ES2022,
    ES2023,
    ES2024,
    ESNext,
  };
  return presets[name];
}

// =============================================================================
// Preset Combination
// =============================================================================

/**
 * Combines multiple presets and option overrides into a single InterpreterOptions object.
 *
 * This function intelligently merges:
 * - `globals`: Later presets override earlier ones (shallow merge)
 * - `featureControl`: Features are unioned if modes are compatible
 * - `security`: Later presets override earlier ones (shallow merge)
 * - `validator`: Later presets override earlier ones
 *
 * @param presets - One or more presets or partial InterpreterOptions to combine
 * @returns A merged InterpreterOptions object
 *
 * @example
 * ```typescript
 * // Combine ES2022 with Fetch API support
 * const interpreter = new Interpreter(preset(ES2022, FetchAPI));
 *
 * // Combine with custom options
 * const interpreter = new Interpreter(preset(ES2022, FetchAPI, {
 *   security: { hideHostErrorMessages: false }
 * }));
 *
 * // Combine multiple addons
 * const interpreter = new Interpreter(preset(ES2022, FetchAPI, ConsoleAPI, TimersAPI));
 * ```
 */
export function preset(
  ...presets: (InterpreterOptions | Partial<InterpreterOptions>)[]
): InterpreterOptions {
  const result: InterpreterOptions = {};

  for (const p of presets) {
    // Merge globals
    if (p.globals) {
      result.globals = { ...result.globals, ...p.globals };
    }

    // Merge feature control
    if (p.featureControl) {
      if (!result.featureControl) {
        // First feature control, copy it
        result.featureControl = {
          mode: p.featureControl.mode,
          features: [...p.featureControl.features],
        };
      } else {
        // Merge feature controls
        result.featureControl = mergeFeatureControls(result.featureControl, p.featureControl);
      }
    }

    // Merge security options
    if (p.security) {
      result.security = { ...result.security, ...p.security };
    }

    // Override validator (last one wins)
    if (p.validator) {
      result.validator = p.validator;
    }
  }

  return result;
}

/**
 * Merges two feature control configurations.
 *
 * Rules:
 * - If both are whitelists: union the features
 * - If both are blacklists: intersect the features (block if either blocks)
 * - If modes differ: whitelist takes precedence (more restrictive)
 */
function mergeFeatureControls(
  a: NonNullable<InterpreterOptions["featureControl"]>,
  b: NonNullable<InterpreterOptions["featureControl"]>,
): NonNullable<InterpreterOptions["featureControl"]> {
  if (a.mode === "whitelist" && b.mode === "whitelist") {
    // Union: allow features from both
    const features = new Set([...a.features, ...b.features]);
    return { mode: "whitelist", features: [...features] as LanguageFeature[] };
  }

  if (a.mode === "blacklist" && b.mode === "blacklist") {
    // Union: block features from both
    const features = new Set([...a.features, ...b.features]);
    return { mode: "blacklist", features: [...features] as LanguageFeature[] };
  }

  // Mixed modes: whitelist is more restrictive, use it
  // Only allow features that are in the whitelist
  const whitelist = a.mode === "whitelist" ? a : b;
  const blacklist = a.mode === "blacklist" ? a : b;

  // Remove blacklisted features from the whitelist
  const blacklistSet = new Set(blacklist.features);
  const features = whitelist.features.filter((f) => !blacklistSet.has(f));

  return { mode: "whitelist", features: features as LanguageFeature[] };
}

// =============================================================================
// Addon Presets
// =============================================================================

/**
 * Fetch API addon preset.
 *
 * Provides access to the Fetch API for making HTTP requests.
 * Requires async/await support (ES2017+).
 *
 * Includes:
 * - fetch
 * - Request
 * - Response
 * - Headers
 * - AbortController
 * - AbortSignal
 * - URL
 * - URLSearchParams
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, FetchAPI));
 * await interpreter.evaluateAsync(`
 *   const response = await fetch('https://api.example.com/data');
 *   const data = await response.json();
 * `);
 * ```
 */
export const FetchAPI: InterpreterOptions = {
  globals: {
    fetch,
    Request,
    Response,
    Headers,
    AbortController,
    AbortSignal,
    URL,
    URLSearchParams,
  },
};

/**
 * Console API addon preset.
 *
 * Provides access to console methods for logging.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, ConsoleAPI));
 * interpreter.evaluate(`console.log('Hello, world!')`);
 * ```
 */
export const ConsoleAPI: InterpreterOptions = {
  globals: {
    console,
  },
};

/**
 * Timers API addon preset.
 *
 * Provides access to timer functions.
 * Note: These are async operations and require evaluateAsync().
 *
 * Includes:
 * - setTimeout
 * - clearTimeout
 * - setInterval
 * - clearInterval
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, TimersAPI));
 * await interpreter.evaluateAsync(`
 *   await new Promise(resolve => setTimeout(resolve, 100));
 * `);
 * ```
 */
export const TimersAPI: InterpreterOptions = {
  globals: {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  },
};

/**
 * TextEncoder/TextDecoder API addon preset.
 *
 * Provides access to text encoding/decoding utilities.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, TextCodecAPI));
 * interpreter.evaluate(`
 *   const encoder = new TextEncoder();
 *   const bytes = encoder.encode('Hello');
 * `);
 * ```
 */
export const TextCodecAPI: InterpreterOptions = {
  globals: {
    TextEncoder,
    TextDecoder,
  },
};

/**
 * Crypto API addon preset.
 *
 * Provides access to cryptographic functions.
 * Note: Only includes the global crypto object, not subtle crypto.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, CryptoAPI));
 * interpreter.evaluate(`
 *   const uuid = crypto.randomUUID();
 * `);
 * ```
 */
export const CryptoAPI: InterpreterOptions = {
  globals: {
    crypto,
  },
};

/**
 * RegExp API addon preset.
 *
 * Provides access to regular expression functionality.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, RegExpAPI));
 * interpreter.evaluate(`
 *   const pattern = new RegExp('hello', 'i');
 *   pattern.test('Hello World'); // true
 * `);
 * ```
 */
export const RegExpAPI: InterpreterOptions = {
  globals: {
    RegExp,
  },
};

/**
 * Intl API addon preset.
 *
 * Provides access to internationalization functionality.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, IntlAPI));
 * interpreter.evaluate(`
 *   const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
 *   formatter.format(1234.56); // "$1,234.56"
 * `);
 * ```
 */
export const IntlAPI: InterpreterOptions = {
  globals: {
    Intl,
  },
};

/**
 * Buffer API addon preset.
 *
 * Provides access to binary data handling with ArrayBuffer, DataView, and typed arrays.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, BufferAPI));
 * interpreter.evaluate(`
 *   const buffer = new ArrayBuffer(16);
 *   const view = new DataView(buffer);
 *   view.setInt32(0, 42);
 *   const arr = new Uint8Array(buffer);
 * `);
 * ```
 */
export const BufferAPI: InterpreterOptions = {
  globals: {
    ArrayBuffer,
    SharedArrayBuffer: typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : undefined,
    DataView,
    // Typed arrays
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  },
};

/**
 * Streams API addon preset.
 *
 * Provides access to the Streams API for handling streaming data.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, StreamsAPI));
 * await interpreter.evaluateAsync(`
 *   const stream = new ReadableStream({
 *     start(controller) {
 *       controller.enqueue('hello');
 *       controller.close();
 *     }
 *   });
 * `);
 * ```
 */
export const StreamsAPI: InterpreterOptions = {
  globals: {
    ReadableStream,
    WritableStream,
    TransformStream,
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
  },
};

/**
 * Blob/File API addon preset.
 *
 * Provides access to Blob and File handling.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, BlobAPI));
 * interpreter.evaluate(`
 *   const blob = new Blob(['hello'], { type: 'text/plain' });
 *   blob.size; // 5
 * `);
 * ```
 */
export const BlobAPI: InterpreterOptions = {
  globals: {
    Blob,
    File,
  },
};

/**
 * Performance API addon preset.
 *
 * Provides access to performance measurement utilities.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, PerformanceAPI));
 * interpreter.evaluate(`
 *   const start = performance.now();
 *   // ... do work ...
 *   const elapsed = performance.now() - start;
 * `);
 * ```
 */
export const PerformanceAPI: InterpreterOptions = {
  globals: {
    performance,
  },
};

/**
 * Event API addon preset.
 *
 * Provides access to event-related classes.
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(preset(ES2022, EventAPI));
 * interpreter.evaluate(`
 *   const target = new EventTarget();
 *   target.addEventListener('custom', (e) => console.log(e.type));
 *   target.dispatchEvent(new Event('custom'));
 * `);
 * ```
 */
export const EventAPI: InterpreterOptions = {
  globals: {
    Event,
    EventTarget,
    CustomEvent,
  },
};

// =============================================================================
// Environment Preset Groups
// =============================================================================

/**
 * Browser environment preset.
 *
 * Combines ES2024 language features with common browser APIs.
 * This provides a comprehensive browser-like environment.
 *
 * Includes:
 * - All ES2024 language features
 * - Fetch API (fetch, Request, Response, Headers)
 * - URL/URLSearchParams
 * - AbortController/AbortSignal
 * - Blob/File
 * - Performance API
 * - Console API
 * - Timers (setTimeout, setInterval)
 * - TextEncoder/TextDecoder
 * - Event/EventTarget/CustomEvent
 * - Crypto API
 * - Streams API
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(Browser);
 * await interpreter.evaluateAsync(`
 *   const response = await fetch('https://api.example.com/data');
 *   console.log(await response.json());
 * `);
 * ```
 */
export const Browser: InterpreterOptions = preset(
  ES2024,
  FetchAPI,
  ConsoleAPI,
  TimersAPI,
  TextCodecAPI,
  CryptoAPI,
  BlobAPI,
  StreamsAPI,
  PerformanceAPI,
  EventAPI,
);

/**
 * WinterCG (Web-interoperable Runtimes Community Group) preset.
 *
 * Provides the minimum common API surface defined by WinterCG for
 * web-interoperable JavaScript runtimes like Cloudflare Workers,
 * Deno Deploy, and Vercel Edge Functions.
 *
 * See: https://wintercg.org/
 *
 * Includes:
 * - All ES2024 language features
 * - Fetch API (fetch, Request, Response, Headers)
 * - URL/URLSearchParams
 * - AbortController/AbortSignal
 * - TextEncoder/TextDecoder
 * - Crypto API
 * - Console API
 * - Streams API
 * - Performance API
 * - Event/EventTarget
 *
 * Does NOT include (browser-specific):
 * - DOM APIs
 * - localStorage/sessionStorage
 * - Timers (may not be available in all edge runtimes)
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(WinterCG);
 * await interpreter.evaluateAsync(`
 *   const encoder = new TextEncoder();
 *   const data = encoder.encode('hello');
 *   const hash = await crypto.subtle.digest('SHA-256', data);
 * `);
 * ```
 */
export const WinterCG: InterpreterOptions = preset(
  ES2024,
  FetchAPI,
  ConsoleAPI,
  TextCodecAPI,
  CryptoAPI,
  StreamsAPI,
  PerformanceAPI,
  EventAPI,
);

/**
 * Node.js environment preset.
 *
 * Combines ES2024 language features with APIs commonly available in Node.js.
 * Note: This provides the Web-standard APIs that Node.js supports,
 * not Node.js-specific APIs like `fs`, `path`, etc. which would need
 * to be injected separately.
 *
 * Includes:
 * - All ES2024 language features
 * - Fetch API (available in Node.js 18+)
 * - URL/URLSearchParams
 * - AbortController/AbortSignal
 * - TextEncoder/TextDecoder
 * - Console API
 * - Timers (setTimeout, setInterval)
 * - Performance API
 * - Crypto API
 * - Buffer API (ArrayBuffer, TypedArrays)
 * - Streams API
 * - Blob/File (Node.js 18+)
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(NodeJS);
 * interpreter.evaluate(`
 *   const buffer = new ArrayBuffer(16);
 *   const view = new DataView(buffer);
 *   view.setInt32(0, 42);
 * `);
 * ```
 */
export const NodeJS: InterpreterOptions = preset(
  ES2024,
  FetchAPI,
  ConsoleAPI,
  TimersAPI,
  TextCodecAPI,
  CryptoAPI,
  BufferAPI,
  StreamsAPI,
  PerformanceAPI,
  BlobAPI,
);

/**
 * Minimal secure preset.
 *
 * A minimal preset with only language features and no external APIs.
 * Useful for sandboxing untrusted code where you want to restrict
 * access to any host environment.
 *
 * Includes:
 * - All ES2024 language features
 * - Basic globals (undefined, NaN, Infinity, Symbol)
 *
 * Does NOT include:
 * - console
 * - fetch or any network APIs
 * - Timers
 * - File system access
 * - Any host-provided APIs
 *
 * @example
 * ```typescript
 * const interpreter = new Interpreter(Minimal);
 * interpreter.evaluate(`
 *   // Pure computation only
 *   const result = [1, 2, 3].map(x => x * 2);
 * `);
 * ```
 */
export const Minimal: InterpreterOptions = {
  ...ES2024,
  globals: {
    // Only the most basic globals
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
    JSON,
    Error,
    TypeError,
    ReferenceError,
    SyntaxError,
    RangeError,
    URIError,
    EvalError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,
    // ES6+ basics
    Promise,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
    BigInt,
    // ES2020+
    globalThis: typeof globalThis !== "undefined" ? globalThis : global,
  },
};
