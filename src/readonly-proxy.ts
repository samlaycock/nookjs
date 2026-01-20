import { isDangerousProperty } from "./constants";
import { InterpreterError, HostFunctionValue } from "./interpreter";

/**
 * ReadOnlyProxy - Wraps global objects to make them read-only and secure
 *
 * Features:
 * - Makes all properties read-only (no set, no delete)
 * - Blocks access to dangerous properties (defined in constants.ts)
 * - Wraps functions as HostFunctionValue for proper sandbox execution
 * - Recursively wraps nested objects
 * - Preserves 'this' binding for method calls
 */
export class ReadOnlyProxy {
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

    // If the value itself is a function (not an object with function properties),
    // wrap it directly as HostFunctionValue instead of proxying it
    if (typeof value === "function") {
      const isAsync = value.constructor.name === "AsyncFunction";
      return new HostFunctionValue((...args: any[]) => value(...args), name, isAsync);
    }

    // Create a proxy that intercepts all operations (for objects like Math, console, etc.)
    return new Proxy(value, {
      get(target, prop, receiver) {
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
        // Enforce read-only for ALL properties on globals
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
      setPrototypeOf(target) {
        throw new InterpreterError(`Cannot set prototype of global '${name}' (read-only)`);
      },

      // Block getPrototypeOf to prevent accessing the underlying object's prototype
      // This prevents attackers from modifying the prototype and affecting the wrapped object
      getPrototypeOf(target) {
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
