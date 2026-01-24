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
 * - Generators (not yet supported by interpreter)
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
      "Classes",
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
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,
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
 * - Async iteration (not yet supported)
 * - Promise.finally() (on prototype)
 * - RegExp improvements (on prototype)
 */
export const ES2018: InterpreterOptions = {
  ...ES2017,
  // No new language features needed (rest/spread already in ES2015)
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
 * - Nullish coalescing (??) (not yet supported by interpreter)
 * - Optional chaining (?.) (not yet supported by interpreter)
 * - BigInt (via globals)
 * - Promise.allSettled() (on Promise)
 * - globalThis (via globals)
 * - Dynamic import (not applicable)
 *
 * Note: Nullish coalescing and optional chaining require parser support.
 * The interpreter's parser (Meriyah) supports these, but the evaluator doesn't yet.
 */
export const ES2020: InterpreterOptions = {
  ...ES2019,
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
 * - Logical assignment operators (||=, &&=, ??=) (not yet supported)
 * - Numeric separators (parser-level, automatically supported)
 */
export const ES2021: InterpreterOptions = {
  ...ES2020,
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
