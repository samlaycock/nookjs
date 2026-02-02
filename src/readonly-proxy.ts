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
 * ReadOnlyProxy-wrapped values when necessary.
 *
 * @param value - The value to potentially unwrap
 * @returns The unwrapped value if it was a proxy wrapping a TypedArray/ArrayBuffer, otherwise the original value
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

  // It's a proxy - check if the target needs unwrapping
  // TypedArrays and ArrayBuffers must be unwrapped for native methods
  if (isTypedArray(target) || target instanceof ArrayBuffer) {
    return target;
  }

  // For other proxy types, return the original proxy
  return value;
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
let globalSecurityOptions: SecurityOptions = {
  sanitizeErrors: true,
};

/**
 * Set global security options for ReadOnlyProxy
 * Called by Interpreter constructor to configure security behavior
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

  // Split into lines and process each
  const lines = stack.split("\n");
  const sanitizedLines: string[] = [];

  for (const line of lines) {
    // Keep the first line (error message)
    if (!line.includes("    at ")) {
      sanitizedLines.push(line);
      continue;
    }

    // For stack frame lines, remove file paths
    // Typical format: "    at functionName (file:///path/to/file.ts:123:45)"
    // or: "    at file:///path/to/file.ts:123:45"
    // or: "    at functionName (/path/to/file.ts:123:45)"

    // Replace paths with [native code] or [sandbox] marker
    const sanitized = line
      // Remove file:// URLs with line numbers
      .replace(/\(file:\/\/[^)]+\)/g, "([native code])")
      // Remove absolute paths with line numbers (Unix)
      .replace(/\(\/[^)]+\)/g, "([native code])")
      // Remove absolute paths with line numbers (Windows)
      .replace(/\([A-Za-z]:\\[^)]+\)/g, "([native code])")
      // Remove bare file:// URLs (no parens)
      .replace(/file:\/\/\S+/g, "[native code]")
      // Remove bare absolute paths (Unix) at end of line
      .replace(/\/\S+\.[jt]s:\d+:\d+$/g, "[native code]")
      // Remove bare absolute paths (Windows) at end of line
      .replace(/[A-Za-z]:\\\S+\.[jt]s:\d+:\d+$/g, "[native code]");

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
  ): any {
    return new Proxy(iterator as any, {
      get(target, prop, receiver) {
        if (prop === "next") {
          if (isAsync) {
            return async (value?: any) => {
              const result = await (target as AsyncIterator<any>).next(value);
              if (result && typeof result === "object" && "value" in result) {
                result.value = ReadOnlyProxy.wrap(result.value, `${name}[]`);
              }
              return result;
            };
          }
          return (value?: any) => {
            const result = (target as Iterator<any>).next(value);
            if (result && typeof result === "object" && "value" in result) {
              result.value = ReadOnlyProxy.wrap(result.value, `${name}[]`);
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
   * @returns Proxied value that's safe to use in sandbox
   */
  static wrap(value: any, name: string): any {
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
      return new HostFunctionValue(value, name, isAsync);
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
            return ReadOnlyProxy.wrap(target, name);
          };
        }

        // Special handling for Error.stack - sanitize to remove host paths
        if (isError && prop === "stack") {
          const stack = Reflect.get(target, prop, target);
          if (globalSecurityOptions.sanitizeErrors) {
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
          );
        }

        // If it's an object (including arrays), recursively wrap it
        if (typeof val === "object" && val !== null) {
          return ReadOnlyProxy.wrap(val, `${name}.${String(prop)}`);
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
