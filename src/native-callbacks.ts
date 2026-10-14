/**
 * Tracks native functions that invoke their callbacks synchronously and use the
 * returned value (e.g. String.prototype.replace, Array.from, JSON.parse).
 *
 * In async evaluation, sandbox callbacks are normally handed to the host as
 * async functions so that they can await host promises. Those wrappers return
 * Promises, which corrupts the result of natives that consume callback return
 * values synchronously, so callbacks for these natives must stay synchronous.
 */

// Maps interpreter-created wrapper functions to the native function they call.
const nativeSources = new WeakMap<Function, Function>();

let syncCallbackNatives: WeakSet<Function> | undefined;

const ITERATION_METHODS = [
  "every",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flatMap",
  "forEach",
  "map",
  "reduce",
  "reduceRight",
  "some",
  "sort",
  "toSorted",
] as const;

const ITERATOR_HELPER_METHODS = [
  "every",
  "filter",
  "find",
  "flatMap",
  "forEach",
  "map",
  "reduce",
  "some",
] as const;

function getSyncCallbackNatives(): WeakSet<Function> {
  if (syncCallbackNatives) {
    return syncCallbackNatives;
  }

  const typedArray = Object.getPrototypeOf(Uint8Array) as { prototype: object };
  const iteratorPrototype = (globalThis as { Iterator?: { prototype: object } }).Iterator
    ?.prototype;

  // Look methods up by name so they are referenced as values rather than unbound calls
  const sources: [object | undefined, readonly string[]][] = [
    [String.prototype, ["replace", "replaceAll"]],
    [Array, ["from"]],
    [Array.prototype, ITERATION_METHODS],
    [typedArray, ["from"]],
    [typedArray.prototype, ITERATION_METHODS],
    [JSON, ["parse", "stringify"]],
    [Object, ["groupBy"]],
    [Map, ["groupBy"]],
    [Map.prototype, ["forEach"]],
    [Set.prototype, ["forEach"]],
    [Reflect, ["apply"]],
    [iteratorPrototype, ITERATOR_HELPER_METHODS],
  ];

  syncCallbackNatives = new WeakSet();
  for (const [owner, methods] of sources) {
    for (const method of methods) {
      const candidate: unknown = owner ? Reflect.get(owner, method) : undefined;
      if (typeof candidate === "function") {
        syncCallbackNatives.add(candidate);
      }
    }
  }
  return syncCallbackNatives;
}

/**
 * Records that `wrapper` forwards its calls to the native function `source`.
 */
export function recordNativeSource(wrapper: Function, source: Function): void {
  nativeSources.set(wrapper, nativeSources.get(source) ?? source);
}

/**
 * Returns true when `fn` (or the native it wraps) calls its callbacks
 * synchronously and depends on their return values.
 */
export function invokesCallbacksSynchronously(fn: Function): boolean {
  return getSyncCallbackNatives().has(nativeSources.get(fn) ?? fn);
}
