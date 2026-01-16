/**
 * Security constants for the JavaScript interpreter
 */

/**
 * List of dangerous property names that could be used to break out of the sandbox
 *
 * These properties provide access to:
 * - Prototype chain manipulation (__proto__, constructor, prototype)
 * - Legacy property descriptor methods (__defineGetter__, __defineSetter__, etc.)
 * - Object.prototype methods that return unwrapped objects (valueOf, toLocaleString)
 * - Object.prototype methods that expose internal state (hasOwnProperty, isPrototypeOf, propertyIsEnumerable)
 * - Function.prototype methods that could be used for sandbox escape (apply, call, bind, arguments, caller)
 *
 * All access to these properties is blocked for security reasons.
 */
export const DANGEROUS_PROPERTIES = [
  // Prototype chain access
  "__proto__",
  "constructor",
  "prototype",

  // Legacy getter/setter methods
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",

  // Object.prototype methods that can bypass proxy
  "valueOf",
  "toLocaleString",

  // Object.prototype methods that expose internal state
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",

  // Function.prototype methods (apply, call, bind)
  "apply",
  "call",
  "bind",

  // Function special properties
  "arguments",
  "caller",
] as const;

/**
 * Type-safe check if a property name is dangerous
 */
export function isDangerousProperty(prop: string | symbol): boolean {
  return typeof prop === "string" && DANGEROUS_PROPERTIES.includes(prop as any);
}
