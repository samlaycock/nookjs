import { isDangerousProperty } from "./constants";
import { InterpreterError, HostFunctionValue, FunctionValue, ClassValue } from "./interpreter";

/**
 * Symbol used to retrieve the underlying target from a ReadOnlyProxy.
 * This is needed for operations like `instanceof` that must inspect
 * the real prototype chain of the wrapped object.
 */
export const PROXY_TARGET = Symbol("ReadOnlyProxy.target");

/**
 * TypedArray constructors that need unwrapping when passed to native methods.
 * Native methods like TextDecoder.decode() require actual TypedArray instances,
 * not Proxy objects wrapping them.
 */
const TYPED_ARRAY_CONSTRUCTORS = [
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
] as const;

/**
 * Check if a value is a TypedArray instance.
 */
function isTypedArray(value: unknown): value is ArrayBufferView {
  if (value === null || typeof value !== "object") {
    return false;
  }
  for (const TypedArrayCtor of TYPED_ARRAY_CONSTRUCTORS) {
    if (value instanceof TypedArrayCtor) {
      return true;
    }
  }
  return false;
}

/**
 * Unwrap a value for passing to native host functions.
 *
 * Native methods like TextDecoder.decode() require actual TypedArray instances,
 * not Proxy objects. This function extracts the underlying target from
 * ReadOnlyProxy-wrapped values ONLY for types that require raw-instance
 * compatibility:
 * - TypedArrays: Required for TextDecoder.decode() and similar APIs
 * - ArrayBuffer: Required for typed array constructors
 * - Timeout: Required for clearTimeout/clearInterval to work with timer IDs
 *
 * SECURITY: All other proxy types (plain objects, class instances, etc.)
 * remain wrapped to prevent sandbox code from mutating host-owned objects
 * through host APIs like Object.defineProperty.
 *
 * @param value - The value to potentially unwrap
 * @returns The unwrapped value if it was a proxy wrapping a permitted type, otherwise the original proxy
 */
export function unwrapForNative(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  // Check if this is a proxy by attempting to access PROXY_TARGET
  const target = (value as any)[PROXY_TARGET];
  if (target === undefined) {
    // Not a ReadOnlyProxy, return as-is
    return value;
  }

  // Unwrap TypedArrays for native method compatibility.
  // TypedArray methods like TextDecoder.decode() require actual TypedArray instances.
  if (isTypedArray(target)) {
    return target;
  }

  // Unwrap ArrayBuffer for native method compatibility.
  // ArrayBuffer is needed for compatibility with APIs that expect raw buffers.
  if (target instanceof ArrayBuffer) {
    return target;
  }

  // Unwrap Timeout objects for timer API compatibility.
  // clearTimeout/clearInterval require the actual Timeout object, not a proxy.
  // Timeout objects are returned by setTimeout/setInterval and need to be passed
  // back to the timer APIs for cancellation to work.
  if (isTimerObject(target)) {
    return target;
  }

  // For all other proxy types (plain objects, arrays, class instances, etc.),
  // return the proxy to maintain read-only security guarantees.
  return value;
}

/**
 * Check if a value is a Timer object (Timeout/Interval).
 * Timer objects are returned by setTimeout/setInterval and need to be
 * unwrapped for clearTimeout/clearInterval to work properly.
 */
function isTimerObject(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }

  // Check constructor name - Timeout is consistent across Node.js and Bun
  // Use Object.prototype.hasOwnProperty to safely check for constructor
  // without triggering the proxy's dangerous property blocking
  try {
    const hasConstructor = Object.prototype.hasOwnProperty.call(value, "constructor");
    const constructor = hasConstructor ? (value as any).constructor : undefined;
    if (constructor && typeof constructor === "function") {
      return constructor.name === "Timeout";
    }
    // Also check prototype chain for Timeout
    const proto = Object.getPrototypeOf(value);
    if (proto && typeof proto === "object") {
      const protoConstructor = proto.constructor;
      if (protoConstructor && typeof protoConstructor === "function") {
        return protoConstructor.name === "Timeout";
      }
    }
  } catch {
    // If accessing constructor throws (e.g., proxy blocks it), it's not a Timeout
  }

  return false;
}

/**
 * Security options for ReadOnlyProxy
 */
export interface SecurityOptions {
  /**
   * When true, sanitizes error stack traces to remove host file paths.
   * This prevents untrusted code from learning about the host environment.
   * Default: true
   */
  sanitizeErrors?: boolean;
}

// Global security options - can be set by the Interpreter
// NOTE: This is a fallback for backwards compatibility. Prefer passing security
// options directly to ReadOnlyProxy.wrap() for instance-scoped security.
let globalSecurityOptions: SecurityOptions = {
  sanitizeErrors: true,
};

/**
 * Set global security options for ReadOnlyProxy
 * Called by Interpreter constructor to configure security behavior
 * @deprecated Use ReadOnlyProxy.wrap() with securityOptions parameter instead
 */
export function setSecurityOptions(options: SecurityOptions): void {
  globalSecurityOptions = { ...globalSecurityOptions, ...options };
}

/**
 * Get current security options
 */
export function getSecurityOptions(): SecurityOptions {
  return globalSecurityOptions;
}

/**
 * Sanitize an error stack trace to remove host implementation details.
 * Replaces file paths with generic location markers.
 */
export function sanitizeErrorStack(stack: string | undefined): string {
  if (!stack) return "";

  const stackFramePattern = /^\s*at\s+/;
  const absolutePathPattern =
    /(^|[\s(,])((?:file:\/\/\/?|[A-Za-z]:\\|\/)[^),\n]+(?::\d+:\d+)?)(?=$|[),])/g;

  // Split into lines and process each.
  const lines = stack.split("\n");
  const sanitizedLines: string[] = [];

  for (const line of lines) {
    if (!stackFramePattern.test(line)) {
      sanitizedLines.push(line);
      continue;
    }

    const sanitized = line.replace(absolutePathPattern, "$1[native code]");

    sanitizedLines.push(sanitized);
  }

  return sanitizedLines.join("\n");
}

/**
 * ReadOnlyProxy - Wraps global objects to make them read-only and secure
 *
 * Features:
 * - Makes all properties read-only (no set, no delete)
 * - Blocks access to dangerous properties (defined in constants.ts)
 * - Wraps functions as HostFunctionValue for proper sandbox execution
 * - Recursively wraps nested objects
 * - Preserves 'this' binding for method calls
 * - Sanitizes Error stack traces to prevent host path leakage
 */
export class ReadOnlyProxy {
  private static wrapIterator(
    iterator: Iterator<any> | AsyncIterator<any>,
    name: string,
    isAsync: boolean,
    securityOptions?: SecurityOptions,
  ): any {
    return new Proxy(iterator as any, {
      get(target, prop, receiver) {
        if (prop === "next") {
          if (isAsync) {
            return async (value?: any) => {
              const result = await (target as AsyncIterator<any>).next(value);
              if (result && typeof result === "object" && "value" in result) {
                result.value = ReadOnlyProxy.wrap(result.value, `${name}[]`, securityOptions);
              }
              return result;
            };
          }
          return (value?: any) => {
            const result = (target as Iterator<any>).next(value);
            if (result && typeof result === "object" && "value" in result) {
              result.value = ReadOnlyProxy.wrap(result.value, `${name}[]`, securityOptions);
            }
            return result;
          };
        }

        return Reflect.get(target, prop, receiver);
      },
    });
  }

  /**
   * Wrap a value to make it read-only and secure
   * @param value - The value to wrap (object, function, or primitive)
   * @param name - The name of the global (for error messages)
   * @param securityOptions - Security options for this specific wrapping instance
   * @returns Proxied value that's safe to use in sandbox
   */
  static wrap(value: any, name: string, securityOptions?: SecurityOptions): any {
    // Use provided options, fall back to global for backwards compatibility
    const effectiveOptions = securityOptions ?? globalSecurityOptions;

    // Primitives pass through unchanged
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== "object" && typeof value !== "function") {
      return value;
    }

    // Already wrapped as HostFunctionValue - don't double wrap
    if (value instanceof HostFunctionValue) {
      return value;
    }

    // FunctionValue is an interpreter-internal function - pass through unchanged
    if (value instanceof FunctionValue) {
      return value;
    }

    // ClassValue is an interpreter-internal class - pass through unchanged
    if (value instanceof ClassValue) {
      return value;
    }

    // Pass Promises through unwrapped - they are safe (just hold values) and
    // wrapping breaks the thenable protocol that await relies on
    if (value instanceof Promise) {
      return value;
    }

    // If the value itself is a function (not an object with function properties),
    // wrap it directly as HostFunctionValue instead of proxying it
    if (typeof value === "function") {
      const isAsync = value.constructor.name === "AsyncFunction";
      // Preserve constructability for native classes/functions (e.g., Error, Response).
      return new HostFunctionValue(value, name, isAsync, false, false, securityOptions);
    }

    // Check if this is an Error instance - needs special handling for stack sanitization
    const isError = value instanceof Error;

    // Create a proxy that intercepts all operations (for objects like Math, console, etc.)
    return new Proxy(value, {
      get(target, prop, _receiver) {
        // Allow retrieving the underlying target for instanceof checks
        if (prop === PROXY_TARGET) {
          return target;
        }

        if (prop === Symbol.iterator || prop === Symbol.asyncIterator) {
          const iterator = Reflect.get(target, prop, target);
          if (typeof iterator === "function") {
            return () =>
              ReadOnlyProxy.wrapIterator(
                iterator.call(target),
                name,
                prop === Symbol.asyncIterator,
                securityOptions,
              );
          }
          return iterator;
        }

        // Allow Symbol.toPrimitive to return undefined - this tells JS to use valueOf/toString
        // which we handle below. This is necessary for arithmetic operations to work.
        if (prop === Symbol.toPrimitive) {
          return undefined;
        }

        // Allow valueOf for primitive coercion with a SAFE implementation
        // SECURITY: We do NOT call target.valueOf() because host objects may have
        // custom valueOf implementations that could leak sensitive data or have side effects.
        // Instead, we provide a safe generic implementation.
        if (prop === "valueOf") {
          return () => {
            // For primitive wrapper objects (Number, String, Boolean), return the primitive
            if (target instanceof Number || target instanceof String || target instanceof Boolean) {
              // These are safe to call - they just return the wrapped primitive
              return target.valueOf();
            }
            // For Date objects, return the timestamp (standard behavior)
            if (target instanceof Date) {
              return target.valueOf();
            }
            // For all other objects, return the wrapped object itself
            // This is the standard Object.prototype.valueOf behavior
            return ReadOnlyProxy.wrap(target, name, securityOptions);
          };
        }

        // Special handling for Error.stack - sanitize to remove host paths
        if (isError && prop === "stack") {
          const stack = Reflect.get(target, prop, target);
          if (effectiveOptions.sanitizeErrors) {
            return sanitizeErrorStack(stack);
          }
          return stack;
        }

        // Block dangerous properties that could break out of sandbox
        if (isDangerousProperty(prop)) {
          throw new InterpreterError(`Cannot access ${String(prop)} on global '${name}'`);
        }

        // Get the actual value
        const val = Reflect.get(target, prop, target); // Use target as receiver to preserve 'this'

        // If it's a function, wrap it as HostFunctionValue
        if (typeof val === "function") {
          // Detect if it's an async function
          const isAsync = val.constructor.name === "AsyncFunction";

          return new HostFunctionValue(
            (...args: any[]) => {
              // Call with target as 'this' to preserve method binding
              // Example: Math.floor.call(Math, 4.7) should work
              return val.apply(target, args);
            },
            `${name}.${String(prop)}`,
            isAsync,
            false,
            false,
            securityOptions,
          );
        }

        // If it's an object (including arrays), recursively wrap it
        if (typeof val === "object" && val !== null) {
          return ReadOnlyProxy.wrap(val, `${name}.${String(prop)}`, securityOptions);
        }

        // Primitives and undefined pass through
        return val;
      },

      set(target, prop, value) {
        // Allow element mutation on TypedArrays via numeric indices
        // TypedArrays need to be writable for common use cases like encoder.encodeInto()
        if (isTypedArray(target)) {
          // Allow numeric index writes (element mutation)
          const index = typeof prop === "string" ? Number(prop) : prop;
          if (typeof index === "number" && Number.isInteger(index) && index >= 0) {
            (target as any)[prop] = value;
            return true;
          }
        }

        // Enforce read-only for all other properties on globals
        // This prevents any modification to global objects, regardless of their internal descriptors
        throw new InterpreterError(
          `Cannot modify property '${String(prop)}' on global '${name}' (read-only)`,
        );
      },

      deleteProperty(target, prop) {
        throw new InterpreterError(
          `Cannot delete property '${String(prop)}' from global '${name}' (read-only)`,
        );
      },

      // Block defineProperty to prevent property descriptor manipulation
      defineProperty(target, prop) {
        throw new InterpreterError(
          `Cannot define property '${String(prop)}' on global '${name}' (read-only)`,
        );
      },

      // Block setPrototypeOf to prevent prototype chain manipulation
      setPrototypeOf(_target) {
        throw new InterpreterError(`Cannot set prototype of global '${name}' (read-only)`);
      },

      // Block getPrototypeOf to prevent accessing the underlying object's prototype
      // This prevents attackers from modifying the prototype and affecting the wrapped object
      getPrototypeOf(_target) {
        // Return null to indicate no prototype chain access
        return null;
      },

      // Allow getOwnPropertyDescriptor (needed for Object.keys, etc.)
      getOwnPropertyDescriptor(target, prop) {
        // Block dangerous properties even in descriptor access
        if (isDangerousProperty(prop)) {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },

      // Allow has operator (prop in obj)
      has(target, prop) {
        // Block dangerous properties
        if (isDangerousProperty(prop)) {
          return false;
        }
        return Reflect.has(target, prop);
      },

      // Allow ownKeys (Object.keys, Object.getOwnPropertyNames, etc.)
      ownKeys(target) {
        const keys = Reflect.ownKeys(target);
        // Filter out dangerous properties
        return keys.filter((key) => !isDangerousProperty(key));
      },
    });
  }
}
