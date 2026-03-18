export type EcmaPresetVersion = number;

export const ESNEXT_ECMA_VERSION = Number.MAX_SAFE_INTEGER;
export const ECMA_PRESET_VERSION = Symbol("nookjs.ecmaPresetVersion");

const ES5 = 5;
const ES2015 = 2015;
const ES2016 = 2016;
const ES2017 = 2017;
const ES2018 = 2018;
const ES2019 = 2019;
const ES2020 = 2020;
const ES2021 = 2021;
const ES2022 = 2022;
const ES2023 = 2023;
const ES2024 = 2024;
const PROMISE_THEN = "then";

const STATIC_PROPERTY_MIN_VERSION: Record<string, Record<string, EcmaPresetVersion>> = {
  Array: {
    isArray: ES5,
    from: ES2015,
    of: ES2015,
  },
  Math: {
    E: ES5,
    LN10: ES5,
    LN2: ES5,
    LOG10E: ES5,
    LOG2E: ES5,
    PI: ES5,
    SQRT1_2: ES5,
    SQRT2: ES5,
    abs: ES5,
    acos: ES5,
    asin: ES5,
    atan: ES5,
    atan2: ES5,
    ceil: ES5,
    cos: ES5,
    exp: ES5,
    floor: ES5,
    log: ES5,
    max: ES5,
    min: ES5,
    pow: ES5,
    random: ES5,
    round: ES5,
    sin: ES5,
    sqrt: ES5,
    tan: ES5,
    acosh: ES2015,
    asinh: ES2015,
    atanh: ES2015,
    cbrt: ES2015,
    clz32: ES2015,
    cosh: ES2015,
    expm1: ES2015,
    fround: ES2015,
    hypot: ES2015,
    imul: ES2015,
    log1p: ES2015,
    log10: ES2015,
    log2: ES2015,
    sign: ES2015,
    sinh: ES2015,
    tanh: ES2015,
    trunc: ES2015,
  },
  Number: {
    MAX_VALUE: ES5,
    MIN_VALUE: ES5,
    NaN: ES5,
    NEGATIVE_INFINITY: ES5,
    POSITIVE_INFINITY: ES5,
    EPSILON: ES2015,
    MAX_SAFE_INTEGER: ES2015,
    MIN_SAFE_INTEGER: ES2015,
    isFinite: ES2015,
    isInteger: ES2015,
    isNaN: ES2015,
    isSafeInteger: ES2015,
    parseFloat: ES2015,
    parseInt: ES2015,
  },
  Object: {
    create: ES5,
    defineProperties: ES5,
    defineProperty: ES5,
    freeze: ES5,
    getOwnPropertyDescriptor: ES5,
    getOwnPropertyNames: ES5,
    getPrototypeOf: ES5,
    isExtensible: ES5,
    isFrozen: ES5,
    isSealed: ES5,
    keys: ES5,
    preventExtensions: ES5,
    seal: ES5,
    assign: ES2015,
    getOwnPropertySymbols: ES2015,
    is: ES2015,
    setPrototypeOf: ES2015,
    entries: ES2017,
    getOwnPropertyDescriptors: ES2017,
    values: ES2017,
    fromEntries: ES2019,
    hasOwn: ES2022,
    groupBy: ES2024,
  },
  Promise: {
    all: ES5,
    race: ES5,
    reject: ES5,
    resolve: ES5,
    allSettled: ES2020,
    any: ES2021,
    withResolvers: ES2024,
  },
  String: {
    fromCharCode: ES5,
    fromCodePoint: ES2015,
    raw: ES2015,
  },
  Map: {
    groupBy: ES2024,
  },
};

const INSTANCE_PROPERTY_MIN_VERSION: Record<string, Record<string, EcmaPresetVersion>> = {
  "Array.prototype": {
    concat: ES5,
    every: ES5,
    filter: ES5,
    forEach: ES5,
    indexOf: ES5,
    join: ES5,
    lastIndexOf: ES5,
    map: ES5,
    pop: ES5,
    push: ES5,
    reduce: ES5,
    reduceRight: ES5,
    reverse: ES5,
    shift: ES5,
    slice: ES5,
    some: ES5,
    sort: ES5,
    splice: ES5,
    toLocaleString: ES5,
    toString: ES5,
    unshift: ES5,
    copyWithin: ES2015,
    entries: ES2015,
    fill: ES2015,
    find: ES2015,
    findIndex: ES2015,
    keys: ES2015,
    values: ES2015,
    includes: ES2016,
    flat: ES2019,
    flatMap: ES2019,
    at: ES2022,
    findLast: ES2023,
    findLastIndex: ES2023,
    toReversed: ES2023,
    toSorted: ES2023,
    toSpliced: ES2023,
    with: ES2023,
  },
  "Promise.prototype": {
    [PROMISE_THEN]: ES5,
    catch: ES5,
    finally: ES2018,
  },
  "String.prototype": {
    charAt: ES5,
    charCodeAt: ES5,
    concat: ES5,
    indexOf: ES5,
    lastIndexOf: ES5,
    localeCompare: ES5,
    match: ES5,
    replace: ES5,
    search: ES5,
    slice: ES5,
    split: ES5,
    substring: ES5,
    toLocaleLowerCase: ES5,
    toLocaleUpperCase: ES5,
    toLowerCase: ES5,
    toUpperCase: ES5,
    trim: ES5,
    valueOf: ES5,
    codePointAt: ES2015,
    endsWith: ES2015,
    includes: ES2015,
    normalize: ES2015,
    repeat: ES2015,
    startsWith: ES2015,
    padEnd: ES2017,
    padStart: ES2017,
    trimEnd: ES2019,
    trimLeft: ES2019,
    trimRight: ES2019,
    trimStart: ES2019,
    matchAll: ES2020,
    replaceAll: ES2021,
    at: ES2022,
  },
};

const STRICT_STATIC_ROOTS = new Set(Object.keys(STATIC_PROPERTY_MIN_VERSION));
const STRICT_INSTANCE_KINDS = new Set(Object.keys(INSTANCE_PROPERTY_MIN_VERSION));

export function attachEcmaPresetVersion<T extends object>(
  preset: T,
  version: EcmaPresetVersion,
): T {
  Object.defineProperty(preset, ECMA_PRESET_VERSION, {
    value: version,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return preset;
}

export function getEcmaPresetVersion(value: unknown): EcmaPresetVersion | undefined {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return undefined;
  }
  return (value as Record<typeof ECMA_PRESET_VERSION, EcmaPresetVersion | undefined>)[
    ECMA_PRESET_VERSION
  ];
}

export function applyMergedEcmaPresetVersion(
  target: object,
  sources: readonly unknown[],
): EcmaPresetVersion | undefined {
  let mergedVersion: EcmaPresetVersion | undefined;

  for (const source of sources) {
    const version = getEcmaPresetVersion(source);
    if (version === undefined) {
      continue;
    }
    if (mergedVersion === undefined || version > mergedVersion) {
      mergedVersion = version;
    }
  }

  if (mergedVersion !== undefined) {
    attachEcmaPresetVersion(target, mergedVersion);
  }

  return mergedVersion;
}

export function isEcmaBuiltinStaticPropertyAvailable(
  rootName: string,
  target: unknown,
  property: PropertyKey,
  version?: EcmaPresetVersion,
): boolean {
  if (!isVersionedAccess(version) || typeof property !== "string") {
    return true;
  }
  if (version === undefined) {
    return true;
  }
  const effectiveVersion = version;
  if (!isBuiltinRootIdentity(rootName, target)) {
    return true;
  }

  const propertyVersions = STATIC_PROPERTY_MIN_VERSION[rootName];
  if (!propertyVersions) {
    return true;
  }

  const minVersion = propertyVersions[property];
  if (minVersion !== undefined) {
    return effectiveVersion >= minVersion;
  }

  return !STRICT_STATIC_ROOTS.has(rootName);
}

export function isEcmaBuiltinInstancePropertyAvailable(
  kind: string,
  property: PropertyKey,
  version?: EcmaPresetVersion,
): boolean {
  if (!isVersionedAccess(version) || typeof property !== "string") {
    return true;
  }
  if (version === undefined) {
    return true;
  }
  const effectiveVersion = version;

  const propertyVersions = INSTANCE_PROPERTY_MIN_VERSION[kind];
  if (!propertyVersions) {
    return true;
  }

  const minVersion = propertyVersions[property];
  if (minVersion !== undefined) {
    return effectiveVersion >= minVersion;
  }

  return !STRICT_INSTANCE_KINDS.has(kind);
}

function isVersionedAccess(version?: EcmaPresetVersion): boolean {
  return version !== undefined && version < ESNEXT_ECMA_VERSION;
}

function isBuiltinRootIdentity(rootName: string, target: unknown): boolean {
  switch (rootName) {
    case "Array":
      return target === Array;
    case "Map":
      return typeof Map !== "undefined" && target === Map;
    case "Math":
      return target === Math;
    case "Number":
      return target === Number;
    case "Object":
      return target === Object;
    case "Promise":
      return target === Promise;
    case "String":
      return target === String;
    default:
      return false;
  }
}
