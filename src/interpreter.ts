/**
 * JavaScript Interpreter
 *
 * A secure, sandboxed JavaScript interpreter that evaluates a subset of JavaScript.
 * Uses Meriyah to parse code into an AST, then walks the AST to execute it.
 *
 * Key features:
 * - Lexical scoping with Environment chain
 * - Closure support (functions capture their defining environment)
 * - Support for async/await with evaluateAsync()
 * - Injectable globals from host environment
 * - Security protections against prototype pollution
 * - Control flow: if/else, while, for, for...of, break, continue, return
 */

import type { ESTree } from "./ast";

import { parseModule } from "./ast";
import { isDangerousProperty, isDangerousSymbol, isForbiddenGlobalName } from "./constants";
import {
  ReadOnlyProxy,
  PROXY_TARGET,
  setSecurityOptions,
  sanitizeErrorStack,
} from "./readonly-proxy";
import {
  InterpreterError,
  RuntimeError,
  SecurityError,
  FeatureError,
  ErrorCode,
  type StackFrame,
  type Location,
  formatError,
} from "./errors";

type ASTNode = ESTree.Node;

function getNodeLocation(node: ESTree.Node): Location | undefined {
  if (node.loc) {
    return node.loc;
  }
  if ("line" in node && typeof (node as any).line === "number") {
    return {
      start: { line: (node as any).line, column: 1 },
      end: { line: (node as any).line, column: 1 },
    };
  }
  return undefined;
}

function getLocationFromNode(node: ESTree.Node): { line: number; column: number } | undefined {
  const loc = getNodeLocation(node);
  if (loc) {
    return { line: loc.start.line, column: loc.start.column };
  }
  if ("line" in node && typeof (node as any).line === "number") {
    return { line: (node as any).line, column: 1 };
  }
  return undefined;
}

/**
 * Wrapper to prevent Promises from being auto-awaited when returned from async functions.
 * JavaScript automatically unwraps Promises returned from async functions, but we need
 * to return the Promise object itself (e.g., from `new Promise()`), not its resolved value.
 */
class RawValue {
  constructor(public value: any) {}
}

class GlobalThisSentinel {}

function validatePropertyName(name: string, node?: ESTree.Node): void {
  if (isDangerousProperty(name)) {
    const loc = getLocationFromNode(node);
    throw new SecurityError("Property access", name, {
      line: loc?.line,
      column: loc?.column,
      code: ErrorCode.PROPERTY_NAME_FORBIDDEN,
    });
  }
}

/**
 * Wrapper for return values to propagate them through nested scopes
 * When a function executes `return x`, we wrap x in ReturnValue so it can
 * bubble up through blocks, loops, and conditionals until caught by the function call handler
 */
class ReturnValue {
  constructor(public value: any) {}
}

/**
 * Marker class to signal a break statement
 * When a loop executes `break`, we return BreakValue to signal the loop to exit
 */
class BreakValue {
  constructor(public label: string | null = null) {}
}

/**
 * Marker class to signal a continue statement
 * When a loop executes `continue`, we return ContinueValue to signal skipping to next iteration
 */
class ContinueValue {
  constructor(public label: string | null = null) {}
}

/**
 * Marker class to signal optional chaining short-circuit
 * When optional chaining encounters null/undefined with ?., we return this to short-circuit
 * the entire chain expression and return undefined
 */
class OptionalChainShortCircuit {
  // Marker class to signal optional chaining short-circuit
}

// Reuse a single marker instance to avoid per-chain allocations.
const OPTIONAL_CHAIN_SHORT_CIRCUIT = new OptionalChainShortCircuit();

/**
 * Marker class to signal a yield expression in a generator
 * When a generator executes `yield value`, we return YieldValue to pause execution
 */
class YieldValue {
  constructor(
    public value: any,
    public delegate: boolean = false, // true for yield*, false for yield
  ) {}
}

/**
 * Represents a function defined in the sandbox (interpreted JavaScript)
 * Stores the function's parameters, body AST, and captured closure environment
 *
 * The closure is the environment where the function was defined, enabling proper closure semantics
 */
class FunctionValue {
  constructor(
    public params: string[],
    public body: ESTree.BlockStatement,
    public closure: Environment, // Captured environment for closures
    public isAsync: boolean = false,
    public restParamIndex: number | null = null, // Index where rest parameter starts, or null if no rest param
    public isGenerator: boolean = false, // true for function* or async function*
    public defaultValues: Map<number, ESTree.Expression> = new Map(), // Default values for parameters by index
    public homeClass: ClassValue | null = null, // Class this method belongs to (for super binding)
    public homeIsStatic: boolean = false, // Whether the method is static
    public destructuredParams: Map<number, ESTree.ObjectPattern | ESTree.ArrayPattern> = new Map(), // Destructuring patterns by param index
  ) {}
}

/**
 * Represents a class field initializer (for instance fields)
 * Stores the field name and initializer AST node for lazy evaluation at instantiation
 */
interface ClassFieldInitializer {
  name: string;
  initializer: ESTree.Expression | null;
  computed: boolean;
  keyNode: ESTree.Expression | ESTree.PrivateIdentifier | null;
  isPrivate: boolean;
}

/**
 * Represents a class defined in the sandbox (interpreted JavaScript)
 * Stores the class's constructor, methods, static members, and parent class
 */
class ClassValue {
  // WeakMap to store private instance field values per instance
  // Key is the instance object, value is a Map of private field name -> value
  public privateFieldStorage: WeakMap<object, Map<string, any>> = new WeakMap();

  constructor(
    public name: string | null,
    public constructorMethod: FunctionValue | null,
    public instanceMethods: Map<string, FunctionValue>,
    public staticMethods: Map<string, FunctionValue>,
    public instanceGetters: Map<string, FunctionValue>,
    public instanceSetters: Map<string, FunctionValue>,
    public staticGetters: Map<string, FunctionValue>,
    public staticSetters: Map<string, FunctionValue>,
    public parentClass: ClassValue | null,
    public closure: Environment,
    public instanceFields: ClassFieldInitializer[] = [], // Instance field initializers (evaluated at instantiation)
    public staticFields: Map<string, any> = new Map(), // Static field values (evaluated at class definition)
    public privateInstanceMethods: Map<string, FunctionValue> = new Map(), // Private instance methods
    public privateStaticMethods: Map<string, FunctionValue> = new Map(), // Private static methods
    public privateStaticFields: Map<string, any> = new Map(), // Private static field values
  ) {}
}

/**
 * Tracks super context for method calls within a class
 * Stored during class method execution to enable super.method() calls
 */
interface SuperBinding {
  readonly parentClass: ClassValue | null;
  readonly thisValue: any;
  readonly currentClass: ClassValue;
  readonly isStatic: boolean;
}

interface ConstructorExecutionResult {
  result: any;
  thisValue: any;
}

/**
 * Shared state type for generators
 */
type GeneratorState = "suspended-start" | "suspended-yield" | "executing" | "completed";

/**
 * Binds generator function parameters to the environment.
 * Shared between sync and async generators.
 */
function bindGeneratorParameters(fn: FunctionValue, args: any[], env: Environment): void {
  const regularParamCount = fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

  for (let i = 0; i < regularParamCount && i < args.length; i++) {
    env.declare(fn.params[i]!, args[i], "let");
  }

  if (fn.restParamIndex !== null) {
    const restArgs = args.slice(fn.restParamIndex);
    env.declare(fn.params[fn.restParamIndex]!, restArgs, "let");
  }
}

/**
 * Process a generator statement result and determine control flow.
 * Returns: { yielded: boolean, yieldValue?: any, delegate?: boolean, returned?: ReturnValue, shouldBreak?: boolean, shouldContinue?: boolean }
 */
function processGeneratorResult(result: any): {
  yielded: boolean;
  yieldValue?: any;
  delegate?: boolean;
  returned?: ReturnValue;
  shouldBreak?: boolean;
  shouldContinue?: boolean;
} {
  if (result instanceof YieldValue) {
    return {
      yielded: true,
      yieldValue: result.value,
      delegate: result.delegate,
    };
  }
  if (result instanceof ReturnValue) {
    return { yielded: false, returned: result };
  }
  if (result instanceof BreakValue) {
    return { yielded: false, shouldBreak: true };
  }
  if (result instanceof ContinueValue) {
    return { yielded: false, shouldContinue: true };
  }
  return { yielded: false };
}

/**
 * Represents a synchronous generator instance created by calling a generator function.
 * Implements the iterator protocol with next(), return(), and throw().
 */
class GeneratorValue {
  private state: GeneratorState = "suspended-start";
  private nativeGenerator: Generator<any, any, any> | null = null;

  constructor(
    private fn: FunctionValue,
    private args: any[],
    private interpreter: Interpreter,
    private thisValue: any,
    private featureEnabled: (feature: LanguageFeature) => boolean,
  ) {}

  /**
   * Execute a statement in generator context, yielding any yields recursively.
   */
  private *executeStatement(statement: ESTree.Statement): Generator<any, any, any> {
    if (statement.type === "ForStatement") {
      if (!this.featureEnabled("ForStatement")) {
        throw new InterpreterError("ForStatement is not enabled");
      }
      return yield* this.executeForStatement(statement as ESTree.ForStatement);
    }
    if (statement.type === "WhileStatement") {
      if (!this.featureEnabled("WhileStatement")) {
        throw new InterpreterError("WhileStatement is not enabled");
      }
      return yield* this.executeWhileStatement(statement as ESTree.WhileStatement);
    }
    if (statement.type === "DoWhileStatement") {
      if (!this.featureEnabled("DoWhileStatement")) {
        throw new InterpreterError("DoWhileStatement is not enabled");
      }
      return yield* this.executeDoWhileStatement(statement as ESTree.DoWhileStatement);
    }
    if (statement.type === "ForOfStatement") {
      if (!this.featureEnabled("ForOfStatement")) {
        throw new InterpreterError("ForOfStatement is not enabled");
      }
      return yield* this.executeForOfStatement(statement as ESTree.ForOfStatement);
    }
    if (statement.type === "ForInStatement") {
      if (!this.featureEnabled("ForInStatement")) {
        throw new InterpreterError("ForInStatement is not enabled");
      }
      return yield* this.executeForInStatement(statement as ESTree.ForInStatement);
    }
    if (statement.type === "TryStatement") {
      if (!this.featureEnabled("TryCatchStatement")) {
        throw new InterpreterError("TryCatchStatement is not enabled");
      }
      return yield* this.executeTryStatement(statement as ESTree.TryStatement);
    }

    const result = this.interpreter.evaluateNode(statement);
    const processed = processGeneratorResult(result);

    if (processed.yielded) {
      let received: any;
      if (processed.delegate) {
        // yield* delegation - iterate through the delegated iterator
        received = yield* this.delegateYield(processed.yieldValue);
      } else {
        received = yield processed.yieldValue;
      }

      // Store the received value and re-evaluate the statement
      // This allows yield expressions to return the received value
      this.interpreter.pendingYieldReceivedValue = {
        value: received,
        hasValue: true,
      };
      this.interpreter.isResumingFromYield = true;
      this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

      // Re-evaluate the statement - yield expression will now return the received value
      const resumeResult = this.interpreter.evaluateNode(statement);
      this.interpreter.isResumingFromYield = false; // Clear after statement completes
      const resumeProcessed = processGeneratorResult(resumeResult);

      if (resumeProcessed.yielded) {
        // Another yield in the same statement - handle it recursively
        // This supports expressions like (yield 1) + (yield 2)
        return yield* this.handleResumeYield(
          statement,
          resumeProcessed.yieldValue,
          resumeProcessed.delegate || false,
        );
      }
      if (resumeProcessed.returned) {
        return resumeProcessed.returned;
      }
      // Reset yield indices when statement completes
      this.interpreter.yieldResumeIndex = 0;
      this.interpreter.yieldCurrentIndex = 0;
      this.interpreter.yieldReceivedValues = [];
      return resumeResult;
    }
    if (processed.returned) {
      return processed.returned;
    }
    return result;
  }

  /**
   * Handle yields that occur during statement re-evaluation.
   * Supports multiple yields in one statement like (yield 1) + (yield 2).
   */
  private *handleResumeYield(
    statement: ESTree.Statement,
    yieldValue: any,
    delegate: boolean,
  ): Generator<any, any, any> {
    let received: any;
    if (delegate) {
      received = yield* this.delegateYield(yieldValue);
    } else {
      received = yield yieldValue;
    }

    this.interpreter.pendingYieldReceivedValue = {
      value: received,
      hasValue: true,
    };
    this.interpreter.isResumingFromYield = true;
    this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

    const resumeResult = this.interpreter.evaluateNode(statement);
    this.interpreter.isResumingFromYield = false; // Clear after statement completes
    const resumeProcessed = processGeneratorResult(resumeResult);

    if (resumeProcessed.yielded) {
      return yield* this.handleResumeYield(
        statement,
        resumeProcessed.yieldValue,
        resumeProcessed.delegate || false,
      );
    }
    if (resumeProcessed.returned) {
      return resumeProcessed.returned;
    }
    // Reset yield indices when statement completes
    this.interpreter.yieldResumeIndex = 0;
    this.interpreter.yieldCurrentIndex = 0;
    this.interpreter.yieldReceivedValues = [];
    return resumeResult;
  }

  /**
   * Handle yield* delegation - yield all values from the delegated iterator.
   */
  private *delegateYield(iterable: any): Generator<any, any, any> {
    // Get an iterator from the value
    let iterator: Iterator<any>;
    if (Array.isArray(iterable)) {
      iterator = iterable[Symbol.iterator]();
    } else if (iterable && typeof iterable[Symbol.iterator] === "function") {
      iterator = iterable[Symbol.iterator]();
    } else if (iterable && typeof iterable.next === "function") {
      // Already an iterator (e.g., generator)
      iterator = iterable;
    } else {
      throw new InterpreterError(
        "yield* requires an iterable (array, generator, or object with [Symbol.iterator])",
      );
    }

    // Iterate and yield each value
    let iterResult = iterator.next();
    while (!iterResult.done) {
      yield iterResult.value;
      iterResult = iterator.next();
    }

    // Return the final value (if any)
    return iterResult.value;
  }

  /**
   * Execute a block body in generator context, handling yields and control flow.
   */
  private *executeBlockBody(
    statements: ESTree.Statement[],
  ): Generator<any, { shouldBreak: boolean; shouldReturn: any; shouldContinue: boolean }, any> {
    for (const statement of statements) {
      const result = this.interpreter.evaluateNode(statement);
      const processed = processGeneratorResult(result);

      if (processed.yielded) {
        let received: any;
        if (processed.delegate) {
          // yield* delegation
          received = yield* this.delegateYield(processed.yieldValue);
        } else {
          received = yield processed.yieldValue;
        }

        // Store received value and re-evaluate
        this.interpreter.pendingYieldReceivedValue = {
          value: received,
          hasValue: true,
        };
        this.interpreter.isResumingFromYield = true;
        this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

        const resumeResult = this.interpreter.evaluateNode(statement);
        this.interpreter.isResumingFromYield = false; // Clear after statement completes
        const resumeProcessed = processGeneratorResult(resumeResult);

        if (resumeProcessed.yielded) {
          // Handle multiple yields in one statement
          const finalResult = yield* this.handleResumeYield(
            statement,
            resumeProcessed.yieldValue,
            resumeProcessed.delegate || false,
          );
          if (finalResult instanceof ReturnValue) {
            // Reset yield indices
            this.interpreter.yieldResumeIndex = 0;
            this.interpreter.yieldCurrentIndex = 0;
            this.interpreter.yieldReceivedValues = [];
            return {
              shouldBreak: false,
              shouldReturn: finalResult,
              shouldContinue: false,
            };
          }
          // Reset yield indices when statement completes
          this.interpreter.yieldResumeIndex = 0;
          this.interpreter.yieldCurrentIndex = 0;
          this.interpreter.yieldReceivedValues = [];
        } else if (resumeProcessed.returned) {
          // Reset yield indices
          this.interpreter.yieldResumeIndex = 0;
          this.interpreter.yieldCurrentIndex = 0;
          this.interpreter.yieldReceivedValues = [];
          return {
            shouldBreak: false,
            shouldReturn: resumeProcessed.returned,
            shouldContinue: false,
          };
        } else if (resumeProcessed.shouldBreak) {
          return {
            shouldBreak: true,
            shouldReturn: null,
            shouldContinue: false,
          };
        } else if (resumeProcessed.shouldContinue) {
          return {
            shouldBreak: false,
            shouldReturn: null,
            shouldContinue: true,
          };
        } else {
          // Statement completed without further yielding - reset yield indices
          this.interpreter.yieldResumeIndex = 0;
          this.interpreter.yieldCurrentIndex = 0;
          this.interpreter.yieldReceivedValues = [];
        }
      } else if (processed.returned) {
        return {
          shouldBreak: false,
          shouldReturn: processed.returned,
          shouldContinue: false,
        };
      } else if (processed.shouldBreak) {
        return { shouldBreak: true, shouldReturn: null, shouldContinue: false };
      } else if (processed.shouldContinue) {
        return { shouldBreak: false, shouldReturn: null, shouldContinue: true };
      }
    }
    return { shouldBreak: false, shouldReturn: null, shouldContinue: false };
  }

  /**
   * Execute a for loop in generator context.
   */
  private *executeForStatement(node: ESTree.ForStatement): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        this.interpreter.evaluateNode(node.init);
      }

      while (true) {
        if (node.test && !this.interpreter.evaluateNode(node.test)) {
          break;
        }

        if (node.body.type === "BlockStatement") {
          const {
            shouldBreak,
            shouldReturn,
            shouldContinue: _shouldContinue,
          } = yield* this.executeBlockBody((node.body as ESTree.BlockStatement).body);
          if (shouldReturn) return shouldReturn;
          if (shouldBreak) break;
          // shouldContinue falls through to update
        } else {
          const result = this.interpreter.evaluateNode(node.body);
          const processed = processGeneratorResult(result);
          if (processed.yielded) {
            if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
            else yield processed.yieldValue;
          } else if (processed.returned) return processed.returned;
          else if (processed.shouldBreak) break;
        }

        if (node.update) {
          this.interpreter.evaluateNode(node.update);
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a while loop in generator context.
   */
  private *executeWhileStatement(node: ESTree.WhileStatement): Generator<any, any, any> {
    while (this.interpreter.evaluateNode(node.test)) {
      if (node.body.type === "BlockStatement") {
        const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
          (node.body as ESTree.BlockStatement).body,
        );
        if (shouldReturn) return shouldReturn;
        if (shouldBreak) break;
      } else {
        const result = this.interpreter.evaluateNode(node.body);
        const processed = processGeneratorResult(result);
        if (processed.yielded) {
          if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
          else yield processed.yieldValue;
        } else if (processed.returned) return processed.returned;
        else if (processed.shouldBreak) break;
      }
    }
    return undefined;
  }

  /**
   * Execute a do-while loop in generator context.
   */
  private *executeDoWhileStatement(node: ESTree.DoWhileStatement): Generator<any, any, any> {
    do {
      if (node.body.type === "BlockStatement") {
        const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
          (node.body as ESTree.BlockStatement).body,
        );
        if (shouldReturn) return shouldReturn;
        if (shouldBreak) break;
      } else {
        const result = this.interpreter.evaluateNode(node.body);
        const processed = processGeneratorResult(result);
        if (processed.yielded) {
          if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
          else yield processed.yieldValue;
        } else if (processed.returned) return processed.returned;
        else if (processed.shouldBreak) break;
      }
    } while (this.interpreter.evaluateNode(node.test));
    return undefined;
  }

  /**
   * Execute a for...of loop in generator context.
   */
  private *executeForOfStatement(node: ESTree.ForOfStatement): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable
      const iterableValue = this.interpreter.evaluateNode(node.right);

      // Get an iterator from the value
      let iterator: Iterator<any>;
      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue[Symbol.iterator] === "function") {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue.next === "function") {
        iterator = iterableValue;
      } else {
        throw new InterpreterError(
          "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
        );
      }

      // Extract variable information from node.left
      const left = node.left;
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | "var" | undefined;

      if (left.type === "VariableDeclaration") {
        const decl = left as ESTree.VariableDeclaration;
        const declarator = decl.declarations[0];
        if (declarator?.id.type === "Identifier") {
          variableName = declarator.id.name;
          isDeclaration = true;
          variableKind = decl.kind as "let" | "const" | "var";
        } else {
          throw new InterpreterError("for...of only supports simple identifiers");
        }
      } else if (left.type === "Identifier") {
        variableName = (left as ESTree.Identifier).name;
      } else {
        throw new InterpreterError("Unsupported for...of left-hand side");
      }

      // Iterate using the iterator protocol
      let iterResult = iterator.next();
      while (!iterResult.done) {
        const currentValue = iterResult.value;

        if (isDeclaration) {
          const iterEnv = this.interpreter.environment;
          this.interpreter.environment = new Environment(iterEnv);
          this.interpreter.environment.declare(variableName, currentValue, variableKind!);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) {
              this.interpreter.environment = iterEnv;
              return shouldReturn;
            }
            if (shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          } else {
            const result = this.interpreter.evaluateNode(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) {
              this.interpreter.environment = iterEnv;
              return processed.returned;
            } else if (processed.shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          }

          this.interpreter.environment = iterEnv;
        } else {
          this.interpreter.environment.set(variableName, currentValue);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) return shouldReturn;
            if (shouldBreak) break;
          } else {
            const result = this.interpreter.evaluateNode(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) return processed.returned;
            else if (processed.shouldBreak) break;
          }
        }

        iterResult = iterator.next();
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a for...in loop in generator context.
   */
  private *executeForInStatement(node: ESTree.ForInStatement): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the object
      const obj = this.interpreter.evaluateNode(node.right);

      if (obj === null || obj === undefined) {
        throw new InterpreterError("for...in requires an object or array, got null/undefined");
      }
      if (typeof obj !== "object") {
        throw new InterpreterError(`for...in requires an object or array, got ${typeof obj}`);
      }

      // Extract variable information from node.left
      const left = node.left;
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | "var" | undefined;

      if (left.type === "VariableDeclaration") {
        const decl = left as ESTree.VariableDeclaration;
        const declarator = decl.declarations[0];
        if (declarator?.id.type === "Identifier") {
          variableName = declarator.id.name;
          isDeclaration = true;
          variableKind = decl.kind as "let" | "const" | "var";
        } else {
          throw new InterpreterError("for...in only supports simple identifiers");
        }
      } else if (left.type === "Identifier") {
        variableName = (left as ESTree.Identifier).name;
      } else {
        throw new InterpreterError("Unsupported for...in left-hand side");
      }

      // Iterate over object keys
      const keys = Object.keys(obj);

      for (const key of keys) {
        if (isDeclaration) {
          const iterEnv = this.interpreter.environment;
          this.interpreter.environment = new Environment(iterEnv);
          this.interpreter.environment.declare(variableName, key, variableKind!);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) {
              this.interpreter.environment = iterEnv;
              return shouldReturn;
            }
            if (shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          } else {
            const result = this.interpreter.evaluateNode(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) {
              this.interpreter.environment = iterEnv;
              return processed.returned;
            } else if (processed.shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          }

          this.interpreter.environment = iterEnv;
        } else {
          this.interpreter.environment.set(variableName, key);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) return shouldReturn;
            if (shouldBreak) break;
          } else {
            const result = this.interpreter.evaluateNode(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) return processed.returned;
            else if (processed.shouldBreak) break;
          }
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a try-catch-finally statement in generator context.
   * This properly handles yields inside try blocks, ensuring finally
   * blocks run at the right time (on completion or return()).
   */
  private *executeTryStatement(node: ESTree.TryStatement): Generator<any, any, any> {
    let tryResult: any = undefined;
    let caughtError: any = null;

    try {
      // Execute try block
      if (node.block.type === "BlockStatement") {
        const { shouldReturn } = yield* this.executeBlockBody(node.block.body);
        if (shouldReturn) {
          tryResult = shouldReturn;
        }
      }
    } catch (error) {
      caughtError = error;

      // If there's a catch clause, execute it
      if (node.handler) {
        const previousEnv = this.interpreter.environment;
        this.interpreter.environment = new Environment(previousEnv);

        try {
          // Bind error to catch parameter if provided
          if (node.handler.param && node.handler.param.type === "Identifier") {
            this.interpreter.environment.declare(node.handler.param.name, error, "let");
          }

          // Execute catch block
          if (node.handler.body.type === "BlockStatement") {
            const { shouldReturn } = yield* this.executeBlockBody(node.handler.body.body);
            if (shouldReturn) {
              tryResult = shouldReturn;
            }
          }
          caughtError = null; // Error was handled
        } finally {
          this.interpreter.environment = previousEnv;
        }
      }
    } finally {
      // Always execute finally block if present
      if (node.finalizer) {
        if (node.finalizer.type === "BlockStatement") {
          const { shouldReturn } = yield* this.executeBlockBody(node.finalizer.body);
          // If finally block has a return, it overrides try/catch result
          if (shouldReturn) {
            // eslint-disable-next-line no-unsafe-finally
            return shouldReturn;
          }
        }
      }
    }

    // Re-throw if error wasn't caught
    if (caughtError !== null) {
      throw caughtError;
    }

    // If tryResult is a ReturnValue, unwrap it for normal return
    if (tryResult instanceof ReturnValue) {
      return tryResult;
    }
    return tryResult;
  }

  /**
   * Create the native generator that wraps interpreter execution.
   */
  private *createExecutionGenerator(): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    const generatorEnv = new Environment(this.fn.closure, this.thisValue, true);
    this.interpreter.environment = generatorEnv;

    try {
      bindGeneratorParameters(this.fn, this.args, generatorEnv);

      for (const statement of this.fn.body.body) {
        const result = yield* this.executeStatement(statement);

        if (result instanceof ReturnValue) {
          return result.value;
        }
        if (result instanceof BreakValue || result instanceof ContinueValue) {
          throw new InterpreterError("Break/continue outside of loop in generator");
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  next(value?: any): IteratorResult<any> {
    if (this.state === "completed") {
      return { done: true, value: undefined };
    }
    if (this.state === "executing") {
      throw new InterpreterError("Generator is already executing");
    }

    try {
      this.state = "executing";
      if (!this.nativeGenerator) {
        this.nativeGenerator = this.createExecutionGenerator();
      }

      const result = this.nativeGenerator.next(value);
      this.state = result.done ? "completed" : "suspended-yield";
      return result;
    } catch (e) {
      this.state = "completed";
      throw e;
    }
  }

  return(value?: any): IteratorResult<any> {
    this.state = "completed";
    const result = this.nativeGenerator?.return?.(value) || {
      done: true,
      value,
    };
    if (result.value instanceof ReturnValue) {
      return { done: result.done, value: result.value.value };
    }
    return result;
  }

  throw(error?: any): IteratorResult<any> {
    if (this.nativeGenerator) {
      const result = this.nativeGenerator.throw?.(error) || {
        done: true,
        value: undefined,
      };
      // Update state based on result - if caught inside, generator continues
      this.state = result.done ? "completed" : "suspended-yield";
      return result;
    }
    this.state = "completed";
    throw error || new Error("Generator throw");
  }

  /**
   * Make generators iterable - they return themselves as the iterator.
   * This enables: for (const x of generator()) { ... }
   */
  [Symbol.iterator](): Generator<any, any, any> {
    return this as unknown as Generator<any, any, any>;
  }
}

/**
 * Represents an async generator instance created by calling an async generator function.
 * Implements the async iterator protocol with next(), return(), and throw().
 */
class AsyncGeneratorValue {
  private state: GeneratorState = "suspended-start";
  private nativeGenerator: AsyncGenerator<any, any, any> | null = null;

  constructor(
    private fn: FunctionValue,
    private args: any[],
    private interpreter: Interpreter,
    private thisValue: any,
    private featureEnabled: (feature: LanguageFeature) => boolean,
  ) {}

  /**
   * Execute a statement in async generator context, yielding any yields recursively.
   */
  private async *executeStatement(statement: ESTree.Statement): AsyncGenerator<any, any, any> {
    if (statement.type === "ForStatement") {
      if (!this.featureEnabled("ForStatement")) {
        throw new InterpreterError("ForStatement is not enabled");
      }
      return yield* this.executeForStatement(statement as ESTree.ForStatement);
    }
    if (statement.type === "WhileStatement") {
      if (!this.featureEnabled("WhileStatement")) {
        throw new InterpreterError("WhileStatement is not enabled");
      }
      return yield* this.executeWhileStatement(statement as ESTree.WhileStatement);
    }
    if (statement.type === "DoWhileStatement") {
      if (!this.featureEnabled("DoWhileStatement")) {
        throw new InterpreterError("DoWhileStatement is not enabled");
      }
      return yield* this.executeDoWhileStatement(statement as ESTree.DoWhileStatement);
    }
    if (statement.type === "ForOfStatement") {
      if (!this.featureEnabled("ForOfStatement")) {
        throw new InterpreterError("ForOfStatement is not enabled");
      }
      return yield* this.executeForOfStatement(statement as ESTree.ForOfStatement);
    }
    if (statement.type === "ForInStatement") {
      if (!this.featureEnabled("ForInStatement")) {
        throw new InterpreterError("ForInStatement is not enabled");
      }
      return yield* this.executeForInStatement(statement as ESTree.ForInStatement);
    }
    if (statement.type === "TryStatement") {
      if (!this.featureEnabled("TryCatchStatement")) {
        throw new InterpreterError("TryCatchStatement is not enabled");
      }
      return yield* this.executeTryStatement(statement as ESTree.TryStatement);
    }

    const result = await this.interpreter.evaluateNodeAsync(statement);
    const processed = processGeneratorResult(result);

    if (processed.yielded) {
      let received: any;
      if (processed.delegate) {
        // yield* delegation - iterate through the delegated iterator
        received = yield* this.delegateYield(processed.yieldValue);
      } else {
        received = yield processed.yieldValue;
      }

      // Store the received value and re-evaluate the statement
      // This allows yield expressions to return the received value
      this.interpreter.pendingYieldReceivedValue = {
        value: received,
        hasValue: true,
      };
      this.interpreter.isResumingFromYield = true;
      this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

      // Re-evaluate the statement - yield expression will now return the received value
      const resumeResult = await this.interpreter.evaluateNodeAsync(statement);
      this.interpreter.isResumingFromYield = false; // Clear after statement completes
      const resumeProcessed = processGeneratorResult(resumeResult);

      if (resumeProcessed.yielded) {
        // Another yield in the same statement - handle it recursively
        return yield* this.handleResumeYield(
          statement,
          resumeProcessed.yieldValue,
          resumeProcessed.delegate || false,
        );
      }
      if (resumeProcessed.returned) {
        return resumeProcessed.returned;
      }
      // Reset yield indices when statement completes
      this.interpreter.yieldResumeIndex = 0;
      this.interpreter.yieldCurrentIndex = 0;
      this.interpreter.yieldReceivedValues = [];
      return resumeResult;
    }
    if (processed.returned) {
      return processed.returned;
    }
    return result;
  }

  /**
   * Handle yields that occur during statement re-evaluation.
   * Supports multiple yields in one statement like (yield 1) + (yield 2).
   */
  private async *handleResumeYield(
    statement: ESTree.Statement,
    yieldValue: any,
    delegate: boolean,
  ): AsyncGenerator<any, any, any> {
    let received: any;
    if (delegate) {
      received = yield* this.delegateYield(yieldValue);
    } else {
      received = yield yieldValue;
    }

    this.interpreter.pendingYieldReceivedValue = {
      value: received,
      hasValue: true,
    };
    this.interpreter.isResumingFromYield = true;
    this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

    const resumeResult = await this.interpreter.evaluateNodeAsync(statement);
    this.interpreter.isResumingFromYield = false; // Clear after statement completes
    const resumeProcessed = processGeneratorResult(resumeResult);

    if (resumeProcessed.yielded) {
      return yield* this.handleResumeYield(
        statement,
        resumeProcessed.yieldValue,
        resumeProcessed.delegate || false,
      );
    }
    if (resumeProcessed.returned) {
      return resumeProcessed.returned;
    }
    // Reset yield indices after statement completes without yielding
    this.interpreter.yieldResumeIndex = 0;
    this.interpreter.yieldCurrentIndex = 0;
    this.interpreter.yieldReceivedValues = [];
    return resumeResult;
  }

  /**
   * Handle yield* delegation for async generators - yield all values from the delegated iterator.
   */
  private async *delegateYield(iterable: any): AsyncGenerator<any, any, any> {
    // Get an iterator from the value (support both sync and async iterators)
    let iterator: Iterator<any> | AsyncIterator<any>;
    let isAsync = false;

    if (Array.isArray(iterable)) {
      iterator = iterable[Symbol.iterator]();
    } else if (iterable && typeof iterable[Symbol.asyncIterator] === "function") {
      iterator = iterable[Symbol.asyncIterator]();
      isAsync = true;
    } else if (iterable && typeof iterable[Symbol.iterator] === "function") {
      iterator = iterable[Symbol.iterator]();
    } else if (iterable && typeof iterable.next === "function") {
      // Already an iterator (e.g., generator)
      iterator = iterable;
    } else {
      throw new InterpreterError(
        "yield* requires an iterable (array, generator, or object with [Symbol.iterator])",
      );
    }

    // Iterate and yield each value
    let iterResult = isAsync
      ? await (iterator as AsyncIterator<any>).next()
      : (iterator as Iterator<any>).next();

    while (!iterResult.done) {
      yield iterResult.value;
      iterResult = isAsync
        ? await (iterator as AsyncIterator<any>).next()
        : (iterator as Iterator<any>).next();
    }

    // Return the final value (if any)
    return iterResult.value;
  }

  /**
   * Execute a block body in async generator context, handling yields and control flow.
   */
  private async *executeBlockBody(
    statements: ESTree.Statement[],
  ): AsyncGenerator<
    any,
    { shouldBreak: boolean; shouldReturn: any; shouldContinue: boolean },
    any
  > {
    for (const statement of statements) {
      const result = await this.interpreter.evaluateNodeAsync(statement);
      const processed = processGeneratorResult(result);

      if (processed.yielded) {
        let received: any;
        if (processed.delegate) {
          // yield* delegation
          received = yield* this.delegateYield(processed.yieldValue);
        } else {
          received = yield processed.yieldValue;
        }

        // Store received value and re-evaluate
        this.interpreter.pendingYieldReceivedValue = {
          value: received,
          hasValue: true,
        };
        this.interpreter.isResumingFromYield = true;
        this.interpreter.yieldCurrentIndex = 0; // Reset for re-evaluation

        const resumeResult = await this.interpreter.evaluateNodeAsync(statement);
        this.interpreter.isResumingFromYield = false; // Clear after statement completes
        const resumeProcessed = processGeneratorResult(resumeResult);

        if (resumeProcessed.yielded) {
          // Handle multiple yields in one statement
          const finalResult = yield* this.handleResumeYield(
            statement,
            resumeProcessed.yieldValue,
            resumeProcessed.delegate || false,
          );
          if (finalResult instanceof ReturnValue) {
            return {
              shouldBreak: false,
              shouldReturn: finalResult,
              shouldContinue: false,
            };
          }
        } else if (resumeProcessed.returned) {
          return {
            shouldBreak: false,
            shouldReturn: resumeProcessed.returned,
            shouldContinue: false,
          };
        } else if (resumeProcessed.shouldBreak) {
          return {
            shouldBreak: true,
            shouldReturn: null,
            shouldContinue: false,
          };
        } else if (resumeProcessed.shouldContinue) {
          return {
            shouldBreak: false,
            shouldReturn: null,
            shouldContinue: true,
          };
        } else {
          // Statement completed without further yielding - reset yield indices
          this.interpreter.yieldResumeIndex = 0;
          this.interpreter.yieldCurrentIndex = 0;
          this.interpreter.yieldReceivedValues = [];
        }
      } else if (processed.returned) {
        return {
          shouldBreak: false,
          shouldReturn: processed.returned,
          shouldContinue: false,
        };
      } else if (processed.shouldBreak) {
        return { shouldBreak: true, shouldReturn: null, shouldContinue: false };
      } else if (processed.shouldContinue) {
        return { shouldBreak: false, shouldReturn: null, shouldContinue: true };
      }
    }
    return { shouldBreak: false, shouldReturn: null, shouldContinue: false };
  }

  /**
   * Execute a for loop in async generator context.
   */
  private async *executeForStatement(node: ESTree.ForStatement): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        await this.interpreter.evaluateNodeAsync(node.init);
      }

      while (true) {
        if (node.test && !(await this.interpreter.evaluateNodeAsync(node.test))) {
          break;
        }

        if (node.body.type === "BlockStatement") {
          const {
            shouldBreak,
            shouldReturn,
            shouldContinue: _shouldContinue,
          } = yield* this.executeBlockBody((node.body as ESTree.BlockStatement).body);
          if (shouldReturn) return shouldReturn;
          if (shouldBreak) break;
          // shouldContinue falls through to update
        } else {
          const result = await this.interpreter.evaluateNodeAsync(node.body);
          const processed = processGeneratorResult(result);
          if (processed.yielded) {
            if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
            else yield processed.yieldValue;
          } else if (processed.returned) return processed.returned;
          else if (processed.shouldBreak) break;
        }

        if (node.update) {
          await this.interpreter.evaluateNodeAsync(node.update);
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a while loop in async generator context.
   */
  private async *executeWhileStatement(node: ESTree.WhileStatement): AsyncGenerator<any, any, any> {
    while (await this.interpreter.evaluateNodeAsync(node.test)) {
      if (node.body.type === "BlockStatement") {
        const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
          (node.body as ESTree.BlockStatement).body,
        );
        if (shouldReturn) return shouldReturn;
        if (shouldBreak) break;
      } else {
        const result = await this.interpreter.evaluateNodeAsync(node.body);
        const processed = processGeneratorResult(result);
        if (processed.yielded) {
          if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
          else yield processed.yieldValue;
        } else if (processed.returned) return processed.returned;
        else if (processed.shouldBreak) break;
      }
    }
    return undefined;
  }

  /**
   * Execute a do-while loop in async generator context.
   */
  private async *executeDoWhileStatement(
    node: ESTree.DoWhileStatement,
  ): AsyncGenerator<any, any, any> {
    do {
      if (node.body.type === "BlockStatement") {
        const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
          (node.body as ESTree.BlockStatement).body,
        );
        if (shouldReturn) return shouldReturn;
        if (shouldBreak) break;
      } else {
        const result = await this.interpreter.evaluateNodeAsync(node.body);
        const processed = processGeneratorResult(result);
        if (processed.yielded) {
          if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
          else yield processed.yieldValue;
        } else if (processed.returned) return processed.returned;
        else if (processed.shouldBreak) break;
      }
    } while (await this.interpreter.evaluateNodeAsync(node.test));
    return undefined;
  }

  /**
   * Execute a for...of loop in async generator context.
   */
  private async *executeForOfStatement(node: ESTree.ForOfStatement): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable
      const iterableValue = await this.interpreter.evaluateNodeAsync(node.right);

      // Get an iterator from the value (support async iterators too)
      let iterator: Iterator<any> | AsyncIterator<any>;
      let isAsync = false;

      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue[Symbol.asyncIterator] === "function") {
        iterator = iterableValue[Symbol.asyncIterator]();
        isAsync = true;
      } else if (iterableValue && typeof iterableValue[Symbol.iterator] === "function") {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue.next === "function") {
        iterator = iterableValue;
      } else {
        throw new InterpreterError(
          "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
        );
      }

      // Extract variable information from node.left
      const left = node.left;
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | "var" | undefined;

      if (left.type === "VariableDeclaration") {
        const decl = left as ESTree.VariableDeclaration;
        const declarator = decl.declarations[0];
        if (declarator?.id.type === "Identifier") {
          variableName = declarator.id.name;
          isDeclaration = true;
          variableKind = decl.kind as "let" | "const" | "var";
        } else {
          throw new InterpreterError("for...of only supports simple identifiers");
        }
      } else if (left.type === "Identifier") {
        variableName = (left as ESTree.Identifier).name;
      } else {
        throw new InterpreterError("Unsupported for...of left-hand side");
      }

      // Iterate using the iterator protocol
      let iterResult = isAsync
        ? await (iterator as AsyncIterator<any>).next()
        : (iterator as Iterator<any>).next();

      while (!iterResult.done) {
        const currentValue = iterResult.value;

        if (isDeclaration) {
          const iterEnv = this.interpreter.environment;
          this.interpreter.environment = new Environment(iterEnv);
          this.interpreter.environment.declare(variableName, currentValue, variableKind!);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) {
              this.interpreter.environment = iterEnv;
              return shouldReturn;
            }
            if (shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          } else {
            const result = await this.interpreter.evaluateNodeAsync(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) {
              this.interpreter.environment = iterEnv;
              return processed.returned;
            } else if (processed.shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          }

          this.interpreter.environment = iterEnv;
        } else {
          this.interpreter.environment.set(variableName, currentValue);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) return shouldReturn;
            if (shouldBreak) break;
          } else {
            const result = await this.interpreter.evaluateNodeAsync(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) return processed.returned;
            else if (processed.shouldBreak) break;
          }
        }

        iterResult = isAsync
          ? await (iterator as AsyncIterator<any>).next()
          : (iterator as Iterator<any>).next();
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a for...in loop in async generator context.
   */
  private async *executeForInStatement(node: ESTree.ForInStatement): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the object
      const obj = await this.interpreter.evaluateNodeAsync(node.right);

      if (obj === null || obj === undefined) {
        throw new InterpreterError("for...in requires an object or array, got null/undefined");
      }
      if (typeof obj !== "object") {
        throw new InterpreterError(`for...in requires an object or array, got ${typeof obj}`);
      }

      // Extract variable information from node.left
      const left = node.left;
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | "var" | undefined;

      if (left.type === "VariableDeclaration") {
        const decl = left as ESTree.VariableDeclaration;
        const declarator = decl.declarations[0];
        if (declarator?.id.type === "Identifier") {
          variableName = declarator.id.name;
          isDeclaration = true;
          variableKind = decl.kind as "let" | "const" | "var";
        } else {
          throw new InterpreterError("for...in only supports simple identifiers");
        }
      } else if (left.type === "Identifier") {
        variableName = (left as ESTree.Identifier).name;
      } else {
        throw new InterpreterError("Unsupported for...in left-hand side");
      }

      // Iterate over object keys
      const keys = Object.keys(obj);

      for (const key of keys) {
        if (isDeclaration) {
          const iterEnv = this.interpreter.environment;
          this.interpreter.environment = new Environment(iterEnv);
          this.interpreter.environment.declare(variableName, key, variableKind!);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) {
              this.interpreter.environment = iterEnv;
              return shouldReturn;
            }
            if (shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          } else {
            const result = await this.interpreter.evaluateNodeAsync(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) {
              this.interpreter.environment = iterEnv;
              return processed.returned;
            } else if (processed.shouldBreak) {
              this.interpreter.environment = iterEnv;
              break;
            }
          }

          this.interpreter.environment = iterEnv;
        } else {
          this.interpreter.environment.set(variableName, key);

          if (node.body.type === "BlockStatement") {
            const { shouldBreak, shouldReturn } = yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
            if (shouldReturn) return shouldReturn;
            if (shouldBreak) break;
          } else {
            const result = await this.interpreter.evaluateNodeAsync(node.body);
            const processed = processGeneratorResult(result);
            if (processed.yielded) {
              if (processed.delegate) yield* this.delegateYield(processed.yieldValue);
              else yield processed.yieldValue;
            } else if (processed.returned) return processed.returned;
            else if (processed.shouldBreak) break;
          }
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
   * Execute a try-catch-finally statement in async generator context.
   * This properly handles yields inside try blocks, ensuring finally
   * blocks run at the right time (on completion or return()).
   */
  private async *executeTryStatement(node: ESTree.TryStatement): AsyncGenerator<any, any, any> {
    let tryResult: any = undefined;
    let caughtError: any = null;
    let finallyHasReturn = false;
    let finallyReturnValue: any = undefined;

    try {
      // Execute try block
      if (node.block.type === "BlockStatement") {
        const { shouldReturn } = yield* this.executeBlockBody(node.block.body);
        if (shouldReturn) {
          tryResult = shouldReturn;
        }
      }
    } catch (error) {
      caughtError = error;

      // If there's a catch clause, execute it
      if (node.handler) {
        const previousEnv = this.interpreter.environment;
        this.interpreter.environment = new Environment(previousEnv);

        try {
          // Bind error to catch parameter if provided
          if (node.handler.param && node.handler.param.type === "Identifier") {
            this.interpreter.environment.declare(node.handler.param.name, error, "let");
          }

          // Execute catch block
          if (node.handler.body.type === "BlockStatement") {
            const { shouldReturn } = yield* this.executeBlockBody(node.handler.body.body);
            if (shouldReturn) {
              tryResult = shouldReturn;
            }
          }
          caughtError = null; // Error was handled
        } finally {
          this.interpreter.environment = previousEnv;
        }
      }
    } finally {
      // Always execute finally block if present
      if (node.finalizer) {
        if (node.finalizer.type === "BlockStatement") {
          const { shouldReturn } = yield* this.executeBlockBody(node.finalizer.body);
          // If finally block has a return, it overrides try/catch result
          // Unwrap ReturnValue since we're returning directly from the generator
          if (shouldReturn) {
            finallyHasReturn = true;
            finallyReturnValue = shouldReturn;
          }
        }
      }
    }

    if (finallyHasReturn) {
      return finallyReturnValue;
    }

    // Re-throw if error wasn't caught
    if (caughtError !== null) {
      throw caughtError;
    }

    // If tryResult is a ReturnValue, propagate it
    if (tryResult instanceof ReturnValue) {
      return tryResult;
    }
    return tryResult;
  }

  /**
   * Create the native async generator that wraps interpreter execution.
   */
  private async *createExecutionGenerator(): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    const generatorEnv = new Environment(this.fn.closure, this.thisValue, true);
    this.interpreter.environment = generatorEnv;

    try {
      bindGeneratorParameters(this.fn, this.args, generatorEnv);

      for (const statement of this.fn.body.body) {
        const result = yield* this.executeStatement(statement);

        if (result instanceof ReturnValue) {
          return result.value;
        }
        if (result instanceof BreakValue || result instanceof ContinueValue) {
          throw new InterpreterError("Break/continue outside of loop in generator");
        }
      }
      return undefined;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  async next(value?: any): Promise<IteratorResult<any>> {
    if (this.state === "completed") {
      return { done: true, value: undefined };
    }
    if (this.state === "executing") {
      throw new InterpreterError("Generator is already executing");
    }

    try {
      this.state = "executing";
      if (!this.nativeGenerator) {
        this.nativeGenerator = this.createExecutionGenerator();
      }

      const result = await this.nativeGenerator.next(value);
      this.state = result.done ? "completed" : "suspended-yield";
      return result;
    } catch (e) {
      this.state = "completed";
      throw e;
    }
  }

  async return(value?: any): Promise<IteratorResult<any>> {
    this.state = "completed";
    const result = (await this.nativeGenerator?.return?.(value)) || {
      done: true,
      value,
    };
    if (result.value instanceof ReturnValue) {
      return { done: result.done, value: result.value.value };
    }
    return result;
  }

  async throw(error?: any): Promise<IteratorResult<any>> {
    if (this.nativeGenerator) {
      const result = (await this.nativeGenerator.throw?.(error)) || {
        done: true,
        value: undefined,
      };
      // Update state based on result - if caught inside, generator continues
      this.state = result.done ? "completed" : "suspended-yield";
      return result;
    }
    this.state = "completed";
    throw error || new Error("Generator throw");
  }

  /**
   * Make async generators async-iterable - they return themselves as the async iterator.
   * This enables: for await (const x of asyncGenerator()) { ... }
   */
  [Symbol.asyncIterator](): AsyncGenerator<any, any, any> {
    return this as unknown as AsyncGenerator<any, any, any>;
  }
}

/**
 * Wrapper for host functions (native TypeScript/JavaScript functions passed as globals)
 * Allows calling host functions from sandbox code while preventing property access for security
 */
export class HostFunctionValue {
  constructor(
    public hostFunc: Function,
    public name: string,
    public isAsync: boolean = false,
    public rethrowErrors: boolean = false,
    public skipArgWrapping: boolean = false, // When true, FunctionValue args are passed through without wrapping
  ) {
    // Return a Proxy that blocks dangerous property access on host functions
    // while allowing access to static methods (e.g., Promise.resolve, Array.isArray)
    return new Proxy(this, {
      get(target, prop) {
        // Allow access to our internal properties (needed by interpreter)
        // The interpreter validates sandbox access separately via validateHostFunctionPropertyAccess
        if (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors" ||
          prop === "skipArgWrapping"
        ) {
          return (target as any)[prop];
        }

        // Allow Symbol.toStringTag for proper type identification
        if (prop === Symbol.toStringTag) {
          return "HostFunctionValue";
        }

        // Allow .then property access (returns undefined) so await works correctly
        // When using async/await, JavaScript checks for .then to determine if something is a Promise
        if (prop === "then") {
          return undefined;
        }

        // Block dangerous properties (prototype chain, bind/call/apply, etc.)
        if (isDangerousProperty(prop)) {
          throw new InterpreterError(
            `Cannot access ${String(prop)} on host function '${target.name}'`,
          );
        }

        // Allow access to own properties on the underlying function (static methods)
        // e.g., Promise.resolve, Array.isArray, Object.keys
        if (Object.prototype.hasOwnProperty.call(target.hostFunc, prop)) {
          const val = (target.hostFunc as any)[prop];
          // For function properties (static methods), bind them to the parent
          // so that `Promise.resolve()` has correct `this` binding
          if (typeof val === "function") {
            const bound = val.bind(target.hostFunc);
            return ReadOnlyProxy.wrap(bound, `${target.name}.${String(prop)}`);
          }
          // Wrap non-function values through ReadOnlyProxy for security
          return ReadOnlyProxy.wrap(val, `${target.name}.${String(prop)}`);
        }

        // Block all other property access for security
        throw new InterpreterError(`Cannot access properties on host functions`);
      },

      set() {
        throw new InterpreterError(`Cannot modify host functions`);
      },

      has(target, prop) {
        // Don't report internal properties as existing (hide from sandbox)
        if (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors" ||
          prop === "skipArgWrapping"
        ) {
          return false;
        }
        if (isDangerousProperty(prop)) {
          return false;
        }
        return Object.prototype.hasOwnProperty.call(target.hostFunc, prop);
      },

      ownKeys(target) {
        // Only expose own properties of the underlying function, not internal properties
        const funcKeys = Object.getOwnPropertyNames(target.hostFunc).filter(
          (key) => !isDangerousProperty(key),
        );
        return funcKeys;
      },

      getOwnPropertyDescriptor(target, prop) {
        // Don't expose internal property descriptors
        if (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors"
        ) {
          return undefined;
        }
        if (isDangerousProperty(prop)) {
          return undefined;
        }
        if (Object.prototype.hasOwnProperty.call(target.hostFunc, prop)) {
          return Object.getOwnPropertyDescriptor(target.hostFunc, prop);
        }
        return undefined;
      },
    }) as any;
  }
}

/**
 * Environment represents a lexical scope (variable binding context)
 *
 * Each Environment forms a node in a chain (linked via parent pointer) that implements
 * lexical scoping. When a variable is accessed, we search this environment first,
 * then walk up the parent chain until found (or throw if not found).
 *
 * Key features:
 * - Variables track their kind (let/const) for immutability enforcement
 * - Variables track if they're globals (for override protection)
 * - Supports 'this' binding for method calls
 * - New environments are created for: blocks, functions, loops, for...of iterations
 */
class Environment {
  private variables: Map<
    string,
    { value: any; kind: "let" | "const" | "var"; isGlobal?: boolean }
  > = new Map();
  private parent: Environment | null = null;
  private thisValue: any = undefined;
  private isFunctionScope: boolean = false;

  constructor(
    parent: Environment | null = null,
    thisValue: any = undefined,
    isFunctionScope: boolean = false,
  ) {
    this.parent = parent;
    this.thisValue = thisValue;
    this.isFunctionScope = isFunctionScope;
  }

  declare(
    name: string,
    value: any,
    kind: "let" | "const" | "var",
    isGlobal: boolean = false,
  ): void {
    // var allows re-declaration
    if (kind === "var") {
      // var is function-scoped, so hoist to nearest function scope or global
      const targetEnv = this.findVarScope();

      // If variable already exists as var, just update it
      const existing = targetEnv.variables.get(name);
      if (existing) {
        if (existing.kind === "var") {
          // Re-declaration with var is allowed, just update the value
          existing.value = value;
          return;
        } else {
          // Cannot redeclare let/const as var
          throw new InterpreterError(`Identifier '${name}' has already been declared`);
        }
      }

      // Declare new var in function scope
      targetEnv.variables.set(name, { value, kind, isGlobal });
      return;
    }

    // let and const are block-scoped - check current scope only
    if (this.variables.has(name)) {
      throw new InterpreterError(`Variable '${name}' has already been declared`);
    }
    this.variables.set(name, { value, kind, isGlobal });
  }

  /**
   * Find the nearest function scope or global scope for var hoisting
   */
  private findVarScope(): Environment {
    if (this.isFunctionScope || this.parent === null) {
      return this;
    }
    // Walk up the chain iteratively to avoid deep recursion on nested blocks.
    let env: Environment | null = this.parent;
    let lastEnv = this.parent;
    if (!env || !lastEnv) {
      return this;
    }
    while (env && !env.isFunctionScope) {
      lastEnv = env;
      env = env.parent;
    }
    return env ?? lastEnv;
  }

  get(name: string): any {
    const entry = this.variables.get(name);
    if (entry) {
      return entry.value;
    }
    let env = this.parent;
    while (env) {
      const nextEntry = env.variables.get(name);
      if (nextEntry) {
        return nextEntry.value;
      }
      env = env.parent;
    }
    throw new InterpreterError(`Undefined variable '${name}'`);
  }

  set(name: string, value: any): void {
    const variable = this.variables.get(name);
    if (variable) {
      if (variable.kind === "const") {
        throw new InterpreterError(`Cannot assign to const variable '${name}'`);
      }
      variable.value = value;
      return;
    }
    let env = this.parent;
    while (env) {
      const nextVar = env.variables.get(name);
      if (nextVar) {
        if (nextVar.kind === "const") {
          throw new InterpreterError(`Cannot assign to const variable '${name}'`);
        }
        nextVar.value = value;
        return;
      }
      env = env.parent;
    }
    throw new InterpreterError(`Undefined variable '${name}'`);
  }

  /**
   * Force-set a variable's value, even if it's const.
   * This is used internally for:
   * 1. Generator yield resumption where we need to update a const variable
   *    that was initially assigned a YieldValue placeholder.
   * 2. Updating injected globals (allows per-call globals to override constructor globals)
   *
   * @param name - Variable name
   * @param value - New value
   * @param onlyGlobals - If true, only allows setting global variables (for security)
   * @returns true if the variable was set, false if onlyGlobals=true and variable is not global
   */
  forceSet(name: string, value: any, onlyGlobals: boolean = false): boolean {
    const variable = this.variables.get(name);
    if (variable) {
      if (onlyGlobals && !variable.isGlobal) {
        return false; // Don't override user variables when onlyGlobals is set
      }
      variable.value = value;
      return true;
    }
    let env = this.parent;
    while (env) {
      const nextVar = env.variables.get(name);
      if (nextVar) {
        if (onlyGlobals && !nextVar.isGlobal) {
          return false; // Don't override user variables when onlyGlobals is set
        }
        nextVar.value = value;
        return true;
      }
      env = env.parent;
    }
    if (onlyGlobals) {
      return false; // Variable doesn't exist
    }
    throw new InterpreterError(`Undefined variable '${name}'`);
  }

  has(name: string): boolean {
    if (this.variables.has(name)) {
      return true;
    }
    let env = this.parent;
    while (env) {
      if (env.variables.has(name)) {
        return true;
      }
      env = env.parent;
    }
    return false;
  }

  delete(name: string): boolean {
    // Delete a variable from this environment (not parent)
    // Returns true if deleted, false if not found
    if (this.variables.has(name)) {
      this.variables.delete(name);
      return true;
    }
    return false;
  }

  getThis(): any {
    if (this.thisValue !== undefined) {
      return this.thisValue;
    }
    let env = this.parent;
    while (env) {
      if (env.thisValue !== undefined) {
        return env.thisValue;
      }
      env = env.parent;
    }
    return undefined;
  }

  setThis(value: any): void {
    if (this.isFunctionScope || this.parent === null) {
      this.thisValue = value;
      return;
    }
    let env = this.parent;
    while (env) {
      if (env.isFunctionScope || env.parent === null) {
        env.thisValue = value;
        return;
      }
      env = env.parent;
    }
  }
}

type ASTValidator = (ast: ESTree.Program) => boolean;

/**
 * Language features that can be enabled/disabled to target specific ECMAScript versions
 */
export type LanguageFeature =
  // ES5 features
  | "ObjectLiterals"
  | "ArrayLiterals"
  | "FunctionDeclarations"
  | "FunctionExpressions"
  | "VariableDeclarations" // var (though we don't support var, this is for consistency)
  | "BinaryOperators"
  | "UnaryOperators"
  | "LogicalOperators"
  | "ConditionalExpression"
  | "MemberExpression"
  | "CallExpression"
  | "NewExpression"
  | "ThisExpression"
  | "IfStatement"
  | "WhileStatement"
  | "ForStatement"
  | "DoWhileStatement"
  | "ForInStatement"
  | "SwitchStatement"
  | "TryCatchStatement"
  | "ThrowStatement"
  | "BreakStatement"
  | "ContinueStatement"
  | "ReturnStatement"

  // ES6/ES2015+ features
  | "ArrowFunctions"
  | "LetConst" // let/const declarations
  | "TemplateLiterals"
  | "Destructuring" // Array and object destructuring
  | "SpreadOperator" // Spread in arrays, objects, function calls
  | "RestParameters" // Rest parameters in functions
  | "ForOfStatement"
  | "DefaultParameters"
  | "AsyncAwait" // async functions and await expressions
  | "Generators" // function* and generator behavior
  | "AsyncGenerators" // async function* and async generator behavior
  | "YieldExpression" // yield and yield* expressions
  | "OptionalChaining" // optional chaining (?.)
  | "LogicalAssignment" // ||=, &&=, ??=
  | "UpdateExpression" // ++ and -- operators
  | "Classes" // ES6 class declarations and expressions
  | "ClassFields" // ES2022 class fields (public instance and static fields)
  | "PrivateFields" // ES2022 private class fields (#privateField)
  | "StaticBlocks" // ES2022 static initialization blocks (static { })
  | "BigIntLiteral"; // ES2020 BigInt literals (10n)

/**
 * Feature control modes for the interpreter
 */
export type FeatureControl = {
  /**
   * Mode: "whitelist" allows only specified features, "blacklist" disallows specified features
   */
  mode: "whitelist" | "blacklist";

  /**
   * List of features to whitelist or blacklist
   */
  features: LanguageFeature[];
};

/**
 * Security options for the interpreter sandbox
 */
export type SecurityOptions = {
  /**
   * When true, sanitizes error stack traces to remove host file paths.
   * This prevents untrusted code from learning about the host environment.
   * Default: true
   */
  sanitizeErrors?: boolean;

  /**
   * When true, hides the original error message from host function errors,
   * replacing it with a generic message. This prevents sensitive information
   * in error messages from leaking to untrusted code.
   * Default: true
   */
  hideHostErrorMessages?: boolean;
};

export type InterpreterOptions = {
  globals?: Record<string, any>;
  validator?: ASTValidator;
  /**
   * Feature control for targeting specific ECMAScript versions
   * Whitelist: only specified features are allowed
   * Blacklist: all features except specified ones are allowed
   */
  featureControl?: FeatureControl;
  /**
   * Security options for the sandbox
   * Controls error sanitization and other security behaviors
   */
  security?: SecurityOptions;
};

export type EvaluateOptions = {
  globals?: Record<string, any>;
  validator?: ASTValidator;
  /**
   * Feature control for this specific evaluation call
   * Overrides constructor-level feature control if provided
   */
  featureControl?: FeatureControl;
  /**
   * AbortSignal to allow cancellation of async evaluation.
   * Only supported in evaluateAsync(). Ignored by synchronous evaluate().
   * Throws InterpreterError when aborted.
   */
  signal?: AbortSignal;
  /**
   * Maximum call stack depth
   * Throws InterpreterError if exceeded (protects against infinite recursion)
   */
  maxCallStackDepth?: number;
  /**
   * Maximum iterations per loop
   * Throws InterpreterError if any single loop exceeds this limit
   */
  maxLoopIterations?: number;
  /**
   * Maximum memory usage in bytes (best-effort estimate)
   * Throws InterpreterError if exceeded
   * Note: This is an approximation based on string/array/object allocations
   */
  maxMemory?: number;
};

/**
 * Statistics from the last evaluation
 */
export type ExecutionStats = {
  /**
   * Total number of AST nodes evaluated
   */
  nodeCount: number;

  /**
   * Number of function/method calls made
   */
  functionCalls: number;

  /**
   * Total number of loop iterations executed
   */
  loopIterations: number;

  /**
   * Execution time in milliseconds
   */
  executionTimeMs: number;
};

/**
 * Represents a single step in the execution process.
 * Yielded by the step-by-step evaluator.
 */
export type ExecutionStep = {
  /**
   * The type of the current AST node being evaluated
   */
  nodeType: string;

  /**
   * The line number of the current node (if available)
   */
  line?: number;

  /**
   * The current value in scope (for expressions) or undefined (for statements)
   */
  value?: any;

  /**
   * Whether execution has completed
   */
  done: boolean;

  /**
   * The final result (only when done is true)
   */
  result?: any;
};

/**
 * Main Interpreter class
 *
 * Evaluates JavaScript code by parsing it into an AST and walking the AST nodes.
 * Maintains an Environment chain for variable scoping and supports both sync and async evaluation.
 *
 * Usage:
 *   const interp = new Interpreter({ globals: { x: 10 } });
 *   interp.evaluate('x + 5'); // 15
 *   await interp.evaluateAsync('asyncFunc()');
 */
export class Interpreter {
  // Note: environment and evaluateNode/evaluateNodeAsync are marked as public
  // to allow GeneratorValue and AsyncGeneratorValue to access them.
  // They are intended for internal use only and should not be called by external code.
  public environment: Environment;
  private constructorGlobals: Record<string, any>; // Globals that persist across all evaluate() calls
  private constructorValidator?: ASTValidator; // AST validator that applies to all evaluate() calls
  private constructorFeatureControl?: FeatureControl; // Feature control that applies to all evaluate() calls
  private constructorFeatureSet?: Set<LanguageFeature>; // Cached feature set for faster lookup
  private securityOptions: SecurityOptions; // Security options for sandbox
  private perCallGlobalKeys: Set<string> = new Set(); // Track per-call globals for cleanup
  private overriddenConstructorGlobals: Map<string, any> = new Map(); // Track original values when per-call globals override
  private currentFeatureControl?: FeatureControl; // Active feature control (per-call overrides constructor)
  private currentFeatureSet?: Set<LanguageFeature>; // Cached per-call feature set

  // Execution control (async-only abort signal)
  private abortSignal?: AbortSignal; // Signal for async cancellation
  private executionCheckCounter = 0;
  private static readonly EXECUTION_CHECK_MASK = 0xff; // check every 256 nodes

  // Call stack depth limiting
  private maxCallStackDepth?: number;
  private currentCallStackDepth = 0;

  // Loop iteration limiting
  private maxLoopIterations?: number;

  // Memory tracking (best-effort)
  private maxMemory?: number;
  private currentMemoryUsage = 0;

  // Label for the currently executing loop (set by LabeledStatement)
  private currentLoopLabel: string | null = null;

  // Current line number for error reporting
  private currentLine = 0;
  private currentColumn = 1;

  // Call stack for error reporting and stack traces
  private callStack: StackFrame[] = [];

  // Current source code for error formatting
  private currentSourceCode: string = "";

  // Generator yield handling - for passing values into yield expressions
  // When set, the next yield expression will return this value instead of YieldValue
  public pendingYieldReceivedValue?: { value: any; hasValue: boolean };
  // Set to true to indicate we're resuming from a yield and should use pendingYieldReceivedValue
  public isResumingFromYield: boolean = false;
  // Track yield index for multiple yields in one statement
  // yieldResumeIndex: how many yields have already been satisfied with received values
  // yieldCurrentIndex: how many yields have been encountered in current evaluation
  public yieldResumeIndex: number = 0;
  public yieldCurrentIndex: number = 0;
  // Store received values for each yield (by index) so we can replay them during re-evaluation
  public yieldReceivedValues: any[] = [];

  // Track super binding context during class method execution
  private currentSuperBinding: SuperBinding | null = null;
  private instanceClassMap: WeakMap<object, ClassValue> = new WeakMap();
  private arrayMethodCache: WeakMap<any[], Map<string, HostFunctionValue>> = new WeakMap();
  private generatorMethodCache: WeakMap<GeneratorValue, Map<string, HostFunctionValue>> =
    new WeakMap();
  private asyncGeneratorMethodCache: WeakMap<AsyncGeneratorValue, Map<string, HostFunctionValue>> =
    new WeakMap();
  private thisInitStack: boolean[] = [];
  private constructorStack: ClassValue[] = [];

  // Execution statistics tracking
  private statsNodeCount = 0;
  private statsFunctionCalls = 0;
  private statsLoopIterations = 0;
  private statsStartTime = 0;
  private statsEndTime = 0;

  constructor(options?: InterpreterOptions) {
    this.environment = new Environment();
    this.constructorGlobals = options?.globals || {};
    this.constructorValidator = options?.validator;
    this.constructorFeatureControl = options?.featureControl;
    this.constructorFeatureSet = this.constructorFeatureControl
      ? new Set(this.constructorFeatureControl.features)
      : undefined;

    // Initialize security options with defaults (both true for maximum security)
    this.securityOptions = {
      sanitizeErrors: options?.security?.sanitizeErrors ?? true,
      hideHostErrorMessages: options?.security?.hideHostErrorMessages ?? true,
    };

    // Configure ReadOnlyProxy with security options
    setSecurityOptions(this.securityOptions);

    // Inject built-in globals that should always be available
    this.injectBuiltinGlobals();
    this.injectGlobals(this.constructorGlobals);
  }

  /**
   * Format a host error message respecting security options.
   * When hideHostErrorMessages is true, returns a generic message.
   * When sanitizeErrors is true, sanitizes stack traces in the message.
   */
  private formatHostError(context: string, error: Error): string {
    if (this.securityOptions.hideHostErrorMessages) {
      return `${context}: [error details hidden]`;
    }

    let message = error.message || "Unknown error";

    // If the error message contains stack-like content, sanitize it
    if (this.securityOptions.sanitizeErrors && message.includes("\n    at ")) {
      message = sanitizeErrorStack(message);
    }

    return `${context}: ${message}`;
  }

  /**
   * Inject built-in JavaScript globals that should always be available.
   * These are fundamental language primitives, not host-provided objects.
   */
  private injectBuiltinGlobals(): void {
    // undefined, NaN, and Infinity are fundamental JavaScript globals
    this.environment.declare("undefined", undefined, "const", true);
    this.environment.declare("NaN", NaN, "const", true);
    this.environment.declare("Infinity", Infinity, "const", true);
    // Symbol is a fundamental primitive type constructor
    this.environment.declare("Symbol", Symbol, "const", true);
    // globalThis and global provide access to the sandbox's global scope
    this.environment.declare("globalThis", new GlobalThisSentinel(), "const", true);
    this.environment.declare("global", new GlobalThisSentinel(), "const", true);
  }

  /**
   * Inject globals into the root environment
   *
   * Globals can come from constructor (persistent) or evaluate() options (per-call).
   * Host functions are wrapped in HostFunctionValue for security (blocks property access).
   *
   * @param globals - Object mapping variable names to values
   * @param allowOverride - If true, can override existing globals (for per-call globals)
   * @param trackKeys - If true, track keys for later cleanup (for per-call globals)
   */
  private injectGlobals(
    globals: Record<string, any>,
    allowOverride: boolean = false,
    trackKeys: boolean = false,
  ): void {
    for (const [key, value] of Object.entries(globals)) {
      // Reject high-risk host objects/functions regardless of allowOverride.
      if (this.isForbiddenGlobal(key, value)) {
        throw new InterpreterError(`Global '${key}' is not allowed for security reasons`);
      }

      // Wrap ALL values with ReadOnlyProxy for security and consistency
      // This handles functions, objects, arrays, and primitives uniformly
      // - Functions become HostFunctionValue (via proxy)
      // - Objects get read-only protection and recursive wrapping
      // - Primitives pass through unchanged
      const wrappedValue = ReadOnlyProxy.wrap(value, key);

      if (this.environment.has(key)) {
        // Variable already exists - decide whether to override
        if (allowOverride) {
          // Save the original value if it's a constructor global being overridden
          // This allows us to restore it later when per-call globals are cleaned up
          if (trackKeys && key in this.constructorGlobals) {
            this.overriddenConstructorGlobals.set(key, this.environment.get(key));
          }
          // Try to force update the global (only works for injected globals, not user variables)
          const wasUpdated = this.environment.forceSet(key, wrappedValue, true);
          if (wasUpdated && trackKeys) {
            this.perCallGlobalKeys.add(key);
          }
        }
        // If not allowOverride, skip this variable (don't overwrite user code variables)
      } else {
        // Variable doesn't exist yet - declare it as const and mark as global
        this.environment.declare(key, wrappedValue, "const", true);
        if (trackKeys) {
          this.perCallGlobalKeys.add(key);
        }
      }
    }
  }

  private isForbiddenGlobal(name: string, value: any): boolean {
    // Block both by name and by identity to prevent aliasing.
    if (isForbiddenGlobalName(name)) {
      return true;
    }
    return value === Function || value === eval || value === Proxy || value === Reflect;
  }

  /**
   * Clean up per-call globals after evaluate() execution
   *
   * Per-call globals are temporary and should not persist. This method:
   * 1. Restores constructor globals that were overridden
   * 2. Deletes new per-call globals that didn't exist before
   *
   * Called in finally block of evaluate()/evaluateAsync()
   */
  private removePerCallGlobals(): void {
    for (const key of this.perCallGlobalKeys) {
      if (this.overriddenConstructorGlobals.has(key)) {
        // This per-call global overrode a constructor global - restore original value
        const originalValue = this.overriddenConstructorGlobals.get(key);
        this.environment.forceSet(key, originalValue, true);
      } else {
        // This was a new per-call global - delete it completely
        this.environment.delete(key);
      }
    }
    this.perCallGlobalKeys.clear();
    this.overriddenConstructorGlobals.clear();
  }

  /**
   * Check if a language feature is enabled based on feature control settings
   *
   * Feature control allows whitelisting or blacklisting specific language features.
   * Per-call feature control (from evaluate options) takes precedence over constructor-level.
   *
   * @param feature - The language feature to check
   * @returns true if the feature is enabled, false if disabled
   *
   * @example
   * // Whitelist mode: only listed features are enabled
   * const interp = new Interpreter({
   *   featureControl: { mode: "whitelist", features: ["ForStatement", "IfStatement"] }
   * });
   * interp.isFeatureEnabled("ForStatement"); // true
   * interp.isFeatureEnabled("ForOfStatement"); // false
   *
   * @example
   * // Blacklist mode: all features except listed ones are enabled
   * const interp = new Interpreter({
   *   featureControl: { mode: "blacklist", features: ["AsyncAwait"] }
   * });
   * interp.isFeatureEnabled("ForStatement"); // true
   * interp.isFeatureEnabled("AsyncAwait"); // false
   */
  private isFeatureEnabled(feature: LanguageFeature): boolean {
    // Use currentFeatureControl if set (per-call), otherwise fall back to constructor-level
    const featureControl = this.currentFeatureControl || this.constructorFeatureControl;
    const featureSet = this.currentFeatureSet || this.constructorFeatureSet;

    // If no feature control is configured, all features are enabled
    if (!featureControl) {
      return true;
    }

    const isInList = featureSet ? featureSet.has(feature) : false;

    if (featureControl.mode === "whitelist") {
      // Whitelist: only features in the list are enabled
      return isInList;
    } else {
      // Blacklist: all features except those in the list are enabled
      return !isInList;
    }
  }

  /**
   * Check if execution should be aborted due to abort signal.
   * Called at the start of each loop iteration and periodically during evaluation.
   * Only effective during async evaluation where the event loop can process signal changes.
   */
  private checkExecutionLimits(): void {
    if (!this.abortSignal) {
      return;
    }
    // Reduce overhead by checking only every N nodes.
    this.executionCheckCounter =
      (this.executionCheckCounter + 1) & Interpreter.EXECUTION_CHECK_MASK;
    if (this.executionCheckCounter !== 0) {
      return;
    }
    if (this.abortSignal.aborted) {
      throw new InterpreterError("Execution aborted");
    }
  }

  /**
   * Check and increment call stack depth.
   * Call this before entering a function/method call.
   */
  private enterCallStack(): void {
    if (this.maxCallStackDepth !== undefined) {
      if (this.currentCallStackDepth >= this.maxCallStackDepth) {
        throw new InterpreterError("Maximum call stack depth exceeded");
      }
    }
    this.currentCallStackDepth++;
    // Track function call statistics
    this.statsFunctionCalls++;
  }

  /**
   * Decrement call stack depth.
   * Call this after returning from a function/method call.
   */
  private exitCallStack(): void {
    this.currentCallStackDepth--;
  }

  /**
   * Push a call frame onto the call stack for error reporting.
   */
  private pushCallFrame(frame: StackFrame): void {
    this.callStack.push(frame);
  }

  /**
   * Pop the last call frame from the call stack.
   */
  private popCallFrame(): void {
    this.callStack.pop();
  }

  /**
   * Check loop iteration count against limit.
   * @param iterations Current iteration count for the loop
   */
  private checkLoopIterations(iterations: number): void {
    // Track loop iteration statistics
    this.statsLoopIterations++;

    if (this.maxLoopIterations !== undefined && iterations >= this.maxLoopIterations) {
      throw new InterpreterError("Maximum loop iterations exceeded");
    }
  }

  /**
   * Track memory allocation (best-effort estimate).
   * @param bytes Estimated bytes being allocated
   */
  private trackMemory(bytes: number): void {
    if (this.maxMemory === undefined) {
      return;
    }
    this.currentMemoryUsage += bytes;
    if (this.currentMemoryUsage > this.maxMemory) {
      throw new InterpreterError("Maximum memory limit exceeded");
    }
  }

  private beginEvaluation(options?: EvaluateOptions): void {
    // Inject per-call globals if provided (with override capability).
    if (options?.globals) {
      this.injectGlobals(options.globals, true, true);
    }

    // Set per-call feature control if provided.
    if (options?.featureControl) {
      this.currentFeatureControl = options.featureControl;
      this.currentFeatureSet = new Set(options.featureControl.features);
    }

    // Signal is set separately by evaluateAsync(); not used in sync evaluate().
    this.abortSignal = undefined;
    this.executionCheckCounter = Interpreter.EXECUTION_CHECK_MASK;

    // Initialize call stack limiting.
    this.maxCallStackDepth = options?.maxCallStackDepth;
    this.currentCallStackDepth = 0;

    // Initialize loop iteration limiting.
    this.maxLoopIterations = options?.maxLoopIterations;

    // Initialize memory tracking.
    this.maxMemory = options?.maxMemory;
    this.currentMemoryUsage = 0;

    // Reset line tracking.
    this.currentLine = 0;

    // Reset execution statistics.
    this.statsNodeCount = 0;
    this.statsFunctionCalls = 0;
    this.statsLoopIterations = 0;
    this.statsStartTime = performance.now();
    this.statsEndTime = 0;
  }

  private endEvaluation(options?: EvaluateOptions): void {
    // Record end time for statistics.
    this.statsEndTime = performance.now();

    // Always clean up per-call globals after execution.
    if (options?.globals) {
      this.removePerCallGlobals();
    }
    // Clear per-call feature control.
    if (options?.featureControl) {
      this.currentFeatureControl = undefined;
      this.currentFeatureSet = undefined;
    }
    // Clear execution control.
    this.abortSignal = undefined;

    // Clear call stack limiting.
    this.maxCallStackDepth = undefined;
    this.currentCallStackDepth = 0;

    // Clear loop iteration limiting.
    this.maxLoopIterations = undefined;

    // Clear memory tracking.
    this.maxMemory = undefined;
    this.currentMemoryUsage = 0;
  }

  private parseAndValidate(code: string, options?: EvaluateOptions): ESTree.Program {
    // Use parseModule to support top-level await in async context.
    const ast = parseModule(code, {
      next: true, // Enable newer JavaScript features like async generators
    });

    // Run validator - per-call validator takes precedence over constructor validator.
    const validator = options?.validator || this.constructorValidator;
    if (validator) {
      const isValid = validator(ast);
      if (!isValid) {
        throw new InterpreterError("AST validation failed: code is not allowed");
      }
    }

    return ast;
  }

  evaluate(code: string, options?: EvaluateOptions): any {
    this.currentSourceCode = code;
    this.callStack = [];
    this.beginEvaluation(options);
    try {
      const ast = this.parseAndValidate(code, options);
      return this.evaluateNode(ast);
    } catch (error) {
      throw this.enhanceError(error);
    } finally {
      this.endEvaluation(options);
      this.currentSourceCode = "";
      this.callStack = [];
    }
  }

  async evaluateAsync(code: string, options?: EvaluateOptions): Promise<any> {
    this.currentSourceCode = code;
    this.callStack = [];
    this.beginEvaluation(options);
    this.abortSignal = options?.signal;
    if (this.abortSignal?.aborted) {
      this.endEvaluation(options);
      throw new InterpreterError("Execution aborted");
    }
    try {
      const ast = this.parseAndValidate(code, options);
      const result = await this.evaluateNodeAsync(ast);
      return result instanceof RawValue ? result.value : result;
    } catch (error) {
      throw this.enhanceError(error);
    } finally {
      this.endEvaluation(options);
      this.currentSourceCode = "";
      this.callStack = [];
    }
  }

  /**
   * Clears all user-declared variables from the environment, keeping only
   * the built-in globals (undefined, NaN, Infinity, Symbol) and constructor-provided globals.
   *
   * This is useful when you want to reset the interpreter state between evaluations
   * without creating a new Interpreter instance.
   *
   * @example
   * ```typescript
   * const interpreter = new Interpreter({ globals: { Math } });
   * interpreter.evaluate('let x = 10; let y = 20;');
   * interpreter.clearGlobals();
   * // x and y are now cleared, but Math is still available
   * interpreter.evaluate('x'); // throws: Undefined variable 'x'
   * ```
   */
  clearGlobals(): void {
    // Create a fresh environment
    this.environment = new Environment();
    // Re-inject built-in globals
    this.injectBuiltinGlobals();
    // Re-inject constructor-provided globals
    this.injectGlobals(this.constructorGlobals);
  }

  /**
   * Parses JavaScript code and returns the AST (Abstract Syntax Tree).
   *
   * This is useful for inspecting the structure of code before execution,
   * or for building custom validators and transformations.
   *
   * @param code - The JavaScript code to parse
   * @returns The parsed AST (ESTree.Program)
   * @throws ParseError if the code has syntax errors
   *
   * @example
   * ```typescript
   * const interpreter = new Interpreter();
   * const ast = interpreter.parse('const x = 1 + 2;');
   * console.log(ast.body[0].type); // 'VariableDeclaration'
   * ```
   */
  parse(code: string): ESTree.Program {
    return parseModule(code, { next: true });
  }

  /**
   * Returns statistics from the last evaluation.
   *
   * Statistics include:
   * - `nodeCount`: Total number of AST nodes evaluated
   * - `functionCalls`: Number of function/method calls made
   * - `loopIterations`: Total number of loop iterations executed
   * - `executionTimeMs`: Execution time in milliseconds
   *
   * @returns Statistics object from the last evaluate() or evaluateAsync() call
   *
   * @example
   * ```typescript
   * const interpreter = new Interpreter();
   * interpreter.evaluate(`
   *   for (let i = 0; i < 100; i++) {
   *     Math.sqrt(i);
   *   }
   * `);
   * const stats = interpreter.getStats();
   * console.log(stats.loopIterations); // 100
   * console.log(stats.functionCalls); // 100 (Math.sqrt calls)
   * ```
   */
  getStats(): ExecutionStats {
    return {
      nodeCount: this.statsNodeCount,
      functionCalls: this.statsFunctionCalls,
      loopIterations: this.statsLoopIterations,
      executionTimeMs: this.statsEndTime - this.statsStartTime,
    };
  }

  /**
   * Returns a generator that yields execution steps for debugging/inspection.
   *
   * This allows you to step through code execution one statement at a time,
   * inspecting the interpreter state at each step.
   *
   * @param code - The JavaScript code to evaluate
   * @returns A generator that yields ExecutionStep objects
   *
   * @example
   * ```typescript
   * const interpreter = new Interpreter();
   * const stepper = interpreter.evaluateSteps(`
   *   let x = 1;
   *   let y = 2;
   *   x + y;
   * `);
   *
   * for (const step of stepper) {
   *   console.log(`Step: ${step.nodeType}, line: ${step.line}`);
   *   if (step.done) {
   *     console.log(`Result: ${step.result}`);
   *   }
   * }
   * ```
   */
  *evaluateSteps(code: string): Generator<ExecutionStep, void, void> {
    const ast = this.parse(code);

    // Reset statistics
    this.statsNodeCount = 0;
    this.statsFunctionCalls = 0;
    this.statsLoopIterations = 0;
    this.statsStartTime = performance.now();

    let result: any;

    for (const statement of ast.body) {
      // Yield before executing each top-level statement
      yield {
        nodeType: statement.type,
        line: statement.line,
        done: false,
      };

      result = this.evaluateNode(statement);

      // Handle control flow values
      if (result instanceof ReturnValue) {
        result = result.value;
        break;
      }
    }

    this.statsEndTime = performance.now();

    // Final step with the result
    yield {
      nodeType: "Program",
      done: true,
      result,
    };
  }

  /**
   * Returns the current scope's variables for debugging.
   *
   * This is useful when stepping through code to inspect variable values.
   *
   * @returns An object containing all variables in the current scope
   *
   * @example
   * ```typescript
   * const interpreter = new Interpreter();
   * interpreter.evaluate('let x = 10; let y = 20;');
   * const scope = interpreter.getScope();
   * console.log(scope); // { x: 10, y: 20 }
   * ```
   */
  getScope(): Record<string, any> {
    const scope: Record<string, any> = {};
    // Get variables from current environment
    // Note: We walk the environment chain to collect all visible variables
    let env: any = this.environment;
    while (env) {
      const vars = env.variables;
      if (vars instanceof Map) {
        for (const [name, entry] of vars) {
          // Don't overwrite variables from inner scopes
          if (!(name in scope)) {
            scope[name] = (entry as any).value;
          }
        }
      }
      env = env.parent;
    }
    return scope;
  }

  /**
    * Enhance an error with line number information if available.
    */
   private enhanceError(error: unknown): unknown {
     if (error instanceof InterpreterError) {
       if (error.line === undefined || error.column === undefined) {
         if (this.currentLine > 0) {
           error.line = this.currentLine;
         }
       }
       if (!error.sourceCode && this.currentSourceCode) {
         error.sourceCode = this.currentSourceCode;
       }
       if (error.callStack === undefined || error.callStack.length === 0) {
         error.callStack = [...this.callStack];
       }
     }
     return error;
   }

  // Public for GeneratorValue/AsyncGeneratorValue access. Internal use only.
  public evaluateNode(node: ASTNode): any {
    this.statsNodeCount++;

    const nodeLoc = getNodeLocation(node);
    if (nodeLoc) {
      this.currentLine = nodeLoc.start.line;
      this.currentColumn = nodeLoc.start.column;
    } else if ("line" in node && typeof (node as any).line === "number") {
      this.currentLine = (node as any).line;
    }

    this.checkExecutionLimits();

    switch (node.type) {
      case "Program":
        return this.evaluateProgram(node as ESTree.Program);

      case "ExpressionStatement":
        return this.evaluateNode((node as ESTree.ExpressionStatement).expression);

      case "EmptyStatement":
        return undefined;

      case "Literal":
        return this.evaluateLiteral(node as ESTree.Literal);

      case "Identifier":
        return this.evaluateIdentifier(node as ESTree.Identifier);

      case "ThisExpression":
        return this.evaluateThisExpression(node as ESTree.ThisExpression);

      case "BinaryExpression":
        return this.evaluateBinaryExpression(node as ESTree.BinaryExpression);

      case "UnaryExpression":
        return this.evaluateUnaryExpression(node as ESTree.UnaryExpression);

      case "UpdateExpression":
        return this.evaluateUpdateExpression(node as ESTree.UpdateExpression);

      case "LogicalExpression":
        return this.evaluateLogicalExpression(node as ESTree.LogicalExpression);

      case "ConditionalExpression":
        return this.evaluateConditionalExpression(node as ESTree.ConditionalExpression);

      case "AssignmentExpression":
        return this.evaluateAssignmentExpression(node as ESTree.AssignmentExpression);

      case "VariableDeclaration":
        return this.evaluateVariableDeclaration(node as ESTree.VariableDeclaration);

      case "BlockStatement":
        return this.evaluateBlockStatement(node as ESTree.BlockStatement);

      case "IfStatement":
        return this.evaluateIfStatement(node as ESTree.IfStatement);

      case "WhileStatement":
        return this.evaluateWhileStatement(node as ESTree.WhileStatement);

      case "DoWhileStatement":
        return this.evaluateDoWhileStatement(node as ESTree.DoWhileStatement);

      case "ForStatement":
        return this.evaluateForStatement(node as ESTree.ForStatement);

      case "ForOfStatement":
        return this.evaluateForOfStatement(node as ESTree.ForOfStatement);

      case "ForInStatement":
        return this.evaluateForInStatement(node as ESTree.ForInStatement);

      case "SwitchStatement":
        return this.evaluateSwitchStatement(node as ESTree.SwitchStatement);

      case "FunctionDeclaration":
        return this.evaluateFunctionDeclaration(node as ESTree.FunctionDeclaration);

      case "FunctionExpression":
        return this.evaluateFunctionExpression(node as ESTree.FunctionExpression);

      case "ArrowFunctionExpression":
        return this.evaluateArrowFunctionExpression(node as ESTree.ArrowFunctionExpression);

      case "ReturnStatement":
        return this.evaluateReturnStatement(node as ESTree.ReturnStatement);

      case "AwaitExpression":
        throw new InterpreterError(
          "Cannot use await in synchronous evaluate(). Use evaluateAsync() instead.",
        );

      case "YieldExpression":
        return this.evaluateYieldExpression(node as ESTree.YieldExpression);

      case "BreakStatement":
        return this.evaluateBreakStatement(node as ESTree.BreakStatement);

      case "ContinueStatement":
        return this.evaluateContinueStatement(node as ESTree.ContinueStatement);

      case "LabeledStatement":
        return this.evaluateLabeledStatement(node as ESTree.LabeledStatement);

      case "ThrowStatement":
        return this.evaluateThrowStatement(node as ESTree.ThrowStatement);

      case "TryStatement":
        return this.evaluateTryStatement(node as ESTree.TryStatement);

      case "CallExpression":
        return this.evaluateCallExpression(node as ESTree.CallExpression);

      case "NewExpression":
        return this.evaluateNewExpression(node as ESTree.NewExpression);

      case "MemberExpression":
        return this.evaluateMemberExpression(node as ESTree.MemberExpression);

      case "ArrayExpression":
        return this.evaluateArrayExpression(node as ESTree.ArrayExpression);

      case "ObjectExpression":
        return this.evaluateObjectExpression(node as ESTree.ObjectExpression);

      case "TemplateLiteral":
        return this.evaluateTemplateLiteral(node as ESTree.TemplateLiteral);

      case "TaggedTemplateExpression":
        return this.evaluateTaggedTemplateExpression(node as ESTree.TaggedTemplateExpression);

      case "SequenceExpression":
        return this.evaluateSequenceExpression(node as ESTree.SequenceExpression);

      case "ChainExpression":
        return this.evaluateChainExpression(node as ESTree.ChainExpression);

      case "ClassDeclaration":
        return this.evaluateClassDeclaration(node as ESTree.ClassDeclaration);

      case "ClassExpression":
        return this.evaluateClassExpression(node as ESTree.ClassExpression);

      case "Super":
        return this.evaluateSuper();

      default:
        throw new InterpreterError(`Unsupported node type: ${node.type}`);
    }
  }

  // Public for GeneratorValue/AsyncGeneratorValue access. Internal use only.
  public async evaluateNodeAsync(node: ASTNode): Promise<any> {
    // Track statistics
    this.statsNodeCount++;

    // Track line number for error reporting
    if (node.line) {
      this.currentLine = node.line;
    }

    // Check execution limits periodically
    this.checkExecutionLimits();

    switch (node.type) {
      case "Program":
        return await this.evaluateProgramAsync(node as ESTree.Program);

      case "ExpressionStatement":
        return await this.evaluateNodeAsync((node as ESTree.ExpressionStatement).expression);

      case "EmptyStatement":
        return undefined;

      case "Literal":
        return this.evaluateLiteral(node as ESTree.Literal);

      case "Identifier":
        return this.evaluateIdentifier(node as ESTree.Identifier);

      case "ThisExpression":
        return this.evaluateThisExpression(node as ESTree.ThisExpression);

      case "BinaryExpression":
        return await this.evaluateBinaryExpressionAsync(node as ESTree.BinaryExpression);

      case "UnaryExpression":
        return await this.evaluateUnaryExpressionAsync(node as ESTree.UnaryExpression);

      case "UpdateExpression":
        return this.evaluateUpdateExpression(node as ESTree.UpdateExpression);

      case "LogicalExpression":
        return await this.evaluateLogicalExpressionAsync(node as ESTree.LogicalExpression);

      case "ConditionalExpression":
        return await this.evaluateConditionalExpressionAsync(node as ESTree.ConditionalExpression);

      case "AssignmentExpression":
        return await this.evaluateAssignmentExpressionAsync(node as ESTree.AssignmentExpression);

      case "VariableDeclaration":
        return await this.evaluateVariableDeclarationAsync(node as ESTree.VariableDeclaration);

      case "BlockStatement":
        return await this.evaluateBlockStatementAsync(node as ESTree.BlockStatement);

      case "IfStatement":
        return await this.evaluateIfStatementAsync(node as ESTree.IfStatement);

      case "WhileStatement":
        return await this.evaluateWhileStatementAsync(node as ESTree.WhileStatement);

      case "DoWhileStatement":
        return await this.evaluateDoWhileStatementAsync(node as ESTree.DoWhileStatement);

      case "ForStatement":
        return await this.evaluateForStatementAsync(node as ESTree.ForStatement);

      case "ForOfStatement":
        return await this.evaluateForOfStatementAsync(node as ESTree.ForOfStatement);

      case "ForInStatement":
        return await this.evaluateForInStatementAsync(node as ESTree.ForInStatement);

      case "SwitchStatement":
        return await this.evaluateSwitchStatementAsync(node as ESTree.SwitchStatement);

      case "FunctionDeclaration":
        // Function declarations are sync - just reuse the sync version
        return this.evaluateFunctionDeclaration(node as ESTree.FunctionDeclaration);

      case "FunctionExpression":
        // Function expressions are sync - just reuse the sync version
        return this.evaluateFunctionExpression(node as ESTree.FunctionExpression);

      case "ArrowFunctionExpression":
        // Arrow functions are sync - just reuse the sync version
        return this.evaluateArrowFunctionExpression(node as ESTree.ArrowFunctionExpression);

      case "ReturnStatement":
        return await this.evaluateReturnStatementAsync(node as ESTree.ReturnStatement);

      case "AwaitExpression":
        return await this.evaluateAwaitExpressionAsync(node as ESTree.AwaitExpression);

      case "YieldExpression":
        return await this.evaluateYieldExpressionAsync(node as ESTree.YieldExpression);

      case "BreakStatement":
        return this.evaluateBreakStatement(node as ESTree.BreakStatement);

      case "ContinueStatement":
        return this.evaluateContinueStatement(node as ESTree.ContinueStatement);

      case "LabeledStatement":
        return await this.evaluateLabeledStatementAsync(node as ESTree.LabeledStatement);

      case "ThrowStatement":
        return await this.evaluateThrowStatementAsync(node as ESTree.ThrowStatement);

      case "TryStatement":
        return await this.evaluateTryStatementAsync(node as ESTree.TryStatement);

      case "CallExpression":
        return await this.evaluateCallExpressionAsync(node as ESTree.CallExpression);

      case "NewExpression": {
        const result = await this.evaluateNewExpressionAsync(node as ESTree.NewExpression);
        // Return RawValue directly - it will be unwrapped by callers that need the value
        // This prevents Promise auto-awaiting in async contexts
        return result;
      }

      case "MemberExpression":
        return await this.evaluateMemberExpressionAsync(node as ESTree.MemberExpression);

      case "ArrayExpression":
        return await this.evaluateArrayExpressionAsync(node as ESTree.ArrayExpression);

      case "ObjectExpression":
        return await this.evaluateObjectExpressionAsync(node as ESTree.ObjectExpression);

      case "TemplateLiteral":
        return await this.evaluateTemplateLiteralAsync(node as ESTree.TemplateLiteral);

      case "TaggedTemplateExpression":
        return await this.evaluateTaggedTemplateExpressionAsync(
          node as ESTree.TaggedTemplateExpression,
        );

      case "SequenceExpression":
        return await this.evaluateSequenceExpressionAsync(node as ESTree.SequenceExpression);

      case "ChainExpression":
        return await this.evaluateChainExpressionAsync(node as ESTree.ChainExpression);

      case "ClassDeclaration":
        return await this.evaluateClassDeclarationAsync(node as ESTree.ClassDeclaration);

      case "ClassExpression":
        return await this.evaluateClassExpressionAsync(node as ESTree.ClassExpression);

      case "Super":
        return this.evaluateSuper();

      default:
        throw new InterpreterError(`Unsupported node type: ${node.type}`);
    }
  }

  private evaluateProgram(node: ESTree.Program): any {
    if (node.body.length === 0) {
      return undefined;
    }

    let result: any;
    for (const statement of node.body) {
      result = this.evaluateNode(statement);
    }

    return result;
  }

  private evaluateLiteral(node: ESTree.Literal): any {
    // Check for BigInt literals (they have a bigint property)
    if ("bigint" in node && !this.isFeatureEnabled("BigIntLiteral")) {
      throw new InterpreterError("BigIntLiteral is not enabled");
    }
    return node.value;
  }

  private evaluateIdentifier(node: ESTree.Identifier): any {
    return this.environment.get(node.name);
  }

  private evaluateThisExpression(_node: ESTree.ThisExpression): any {
    if (!this.isFeatureEnabled("ThisExpression")) {
      throw new InterpreterError("ThisExpression is not enabled");
    }

    if (this.thisInitStack.length > 0) {
      const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
      if (!isInitialized) {
        throw new InterpreterError(
          "Must call super constructor in derived class before accessing 'this'",
        );
      }
    }

    return this.environment.getThis();
  }

  // ============================================================================
  // CORE LOGIC HELPERS (shared between sync and async evaluation)
  // ============================================================================

  /**
   * Applies a binary operator to two operands.
   * This core logic is shared between sync and async evaluation paths.
   */
  private applyBinaryOperator(operator: string, left: any, right: any): any {
    switch (operator) {
      // Arithmetic operators
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        if (right === 0) {
          throw new InterpreterError("Division by zero");
        }
        return left / right;
      case "%":
        if (right === 0) {
          throw new InterpreterError("Modulo by zero");
        }
        return left % right;
      case "**":
        return left ** right;

      // Comparison operators (strict)
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      // Comparison operators (loose)
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;

      // Bitwise operators
      case "&":
        return left & right;
      case "|":
        return left | right;
      case "^":
        return left ^ right;
      case "<<":
        return left << right;
      case ">>":
        return left >> right;
      case ">>>":
        return left >>> right;

      // Relational operators
      case "in":
        if (typeof right !== "object" || right === null) {
          throw new InterpreterError(
            "Cannot use 'in' operator to search for '" + left + "' in " + right,
          );
        }
        return left in right;

      case "instanceof": {
        // Unwrap ReadOnlyProxy to get the real object for prototype chain checks
        const target =
          left != null && typeof left === "object" && left[PROXY_TARGET]
            ? left[PROXY_TARGET]
            : left;

        // Handle HostFunctionValue (wrapped host constructors like Array, Object, etc.)
        if (right instanceof HostFunctionValue) {
          return target instanceof right.hostFunc;
        }
        // Handle interpreter's ClassValue
        if (right instanceof ClassValue) {
          // Check if left is an instance created by this class
          return this.isInstanceOfClass(left, right);
        }
        // Handle interpreter's FunctionValue (user-defined functions used as constructors)
        if (right instanceof FunctionValue) {
          // User-defined functions in the interpreter can be used as constructors
          // Check if left was constructed by this function
          return this.isInstanceOfFunction(left, right);
        }
        // Handle native functions
        if (typeof right === "function") {
          return target instanceof right;
        }
        throw new InterpreterError("Right-hand side of 'instanceof' is not callable");
      }

      default:
        throw new InterpreterError(`Unsupported binary operator: ${operator}`);
    }
  }

  /**
   * Applies a unary operator to an operand.
   * This core logic is shared between sync and async evaluation paths.
   */
  private applyUnaryOperator(operator: string, argument: any): any {
    switch (operator) {
      case "+":
        return +argument;
      case "-":
        return -argument;
      case "!":
        return !argument;
      case "~":
        return ~argument;
      case "void":
        // void evaluates its operand and returns undefined
        return undefined;
      default:
        throw new InterpreterError(`Unsupported unary operator: ${operator}`);
    }
  }

  /**
   * Get the typeof value for an evaluated expression.
   * Handles FunctionValue and HostFunctionValue specially.
   */
  private getTypeofValue(value: any): string {
    if (value instanceof FunctionValue) {
      return "function";
    }
    if (value instanceof HostFunctionValue) {
      return "function";
    }
    if (value instanceof ClassValue) {
      return "function"; // Classes are functions in JavaScript
    }
    return typeof value;
  }

  /**
   * Applies an update operator (++ or --) to a number value.
   * Returns [newValue, returnValue] where returnValue depends on prefix/postfix.
   * This core logic is shared between sync and async evaluation paths.
   */
  private applyUpdateOperator(
    operator: string,
    currentValue: any,
    isPrefix: boolean,
  ): [number, number] {
    if (typeof currentValue !== "number") {
      throw new InterpreterError("Update expression can only be used with numbers");
    }

    let newValue: number;
    switch (operator) {
      case "++":
        newValue = currentValue + 1;
        break;
      case "--":
        newValue = currentValue - 1;
        break;
      default:
        throw new InterpreterError(`Unsupported update operator: ${operator}`);
    }

    // Return old value for postfix (i++), new value for prefix (++i)
    const returnValue = isPrefix ? newValue : currentValue;
    return [newValue, returnValue];
  }

  /**
   * Binds function parameters to argument values in the current environment.
   * Handles regular parameters, rest parameters, and default parameter values.
   * This core logic is shared between sync and async function calls.
   */
  private bindFunctionParameters(fn: FunctionValue, args: any[]): void {
    const regularParamCount = fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

    // Bind regular parameters (with default value support)
    for (let i = 0; i < regularParamCount; i++) {
      let value = args[i];

      // If value is undefined and we have a default, evaluate it
      if (value === undefined && fn.defaultValues.has(i)) {
        const defaultExpr = fn.defaultValues.get(i)!;
        value = this.evaluateNode(defaultExpr);
      }

      // Check if this parameter is a destructuring pattern
      if (fn.destructuredParams.has(i)) {
        const pattern = fn.destructuredParams.get(i)!;
        this.destructurePattern(pattern, value, true, "let");
      } else {
        this.environment.declare(fn.params[i]!, value, "let");
      }
    }

    // Bind rest parameter if present
    if (fn.restParamIndex !== null) {
      const restParamName = fn.params[fn.restParamIndex]!;
      const restArgs = args.slice(fn.restParamIndex);
      this.environment.declare(restParamName, restArgs, "let");
    }
  }

  /**
   * Async version of bindFunctionParameters that can evaluate async default values.
   */
  private async bindFunctionParametersAsync(fn: FunctionValue, args: any[]): Promise<void> {
    const regularParamCount = fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

    // Bind regular parameters (with default value support)
    for (let i = 0; i < regularParamCount; i++) {
      let value = args[i];

      // If value is undefined and we have a default, evaluate it
      if (value === undefined && fn.defaultValues.has(i)) {
        const defaultExpr = fn.defaultValues.get(i)!;
        value = await this.evaluateNodeAsync(defaultExpr);
      }

      // Check if this parameter is a destructuring pattern
      if (fn.destructuredParams.has(i)) {
        const pattern = fn.destructuredParams.get(i)!;
        await this.destructurePatternAsync(pattern, value, true, "let");
      } else {
        this.environment.declare(fn.params[i]!, value, "let");
      }
    }

    // Bind rest parameter if present
    if (fn.restParamIndex !== null) {
      const restParamName = fn.params[fn.restParamIndex]!;
      const restArgs = args.slice(fn.restParamIndex);
      this.environment.declare(restParamName, restArgs, "let");
    }
  }

  /**
   * Validates that a function has received the minimum required arguments.
   * Throws if too few arguments are provided (excluding parameters with defaults).
   * This core logic is shared between sync and async function calls.
   */
  private validateFunctionArguments(fn: FunctionValue, args: any[]): void {
    const regularParamCount = fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

    // Count required parameters (those without default values)
    let requiredParamCount = 0;
    for (let i = 0; i < regularParamCount; i++) {
      if (!fn.defaultValues.has(i)) {
        requiredParamCount = i + 1; // Last required parameter position + 1
      }
    }

    if (args.length < requiredParamCount) {
      throw new InterpreterError(
        `Expected at least ${requiredParamCount} arguments but got ${args.length}`,
      );
    }
  }

  /**
   * Builds a template literal string from quasis and evaluated expression values.
   * Interleaves static text parts with interpolated expressions.
   * This core logic is shared between sync and async template literal evaluation.
   */
  private buildTemplateLiteralString(
    quasis: ESTree.TemplateElement[],
    expressionValues: any[],
  ): string {
    let result = "";

    // Interleave quasis (static text) and expressions (interpolations)
    for (let i = 0; i < quasis.length; i++) {
      // Add the static text part
      const quasi = quasis[i];
      if (!quasi) {
        throw new InterpreterError("Template literal missing quasi element");
      }
      result += quasi.value.cooked;

      // Add the interpolated expression (if not the last quasi)
      // The last quasi has no expression after it
      if (i < expressionValues.length) {
        const exprValue = expressionValues[i];
        result += this.coerceTemplateValue(exprValue);
      }
    }

    // Track memory: estimate 2 bytes per character (UTF-16)
    this.trackMemory(result.length * 2);

    return result;
  }

  private coerceTemplateValue(value: any): string {
    // Security-first coercion: avoid calling user-controlled toString/valueOf hooks.
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      return String(value);
    }
    if (typeof value === "symbol") {
      return value.toString();
    }
    if (Array.isArray(value)) {
      const parts: string[] = [];
      for (let i = 0; i < value.length; i += 1) {
        if (Object.prototype.hasOwnProperty.call(value, i)) {
          const element = value[i];
          if (element === null || element === undefined) {
            parts.push("");
          } else {
            parts.push(this.coerceTemplateValue(element));
          }
        } else {
          parts.push("");
        }
      }
      return parts.join(",");
    }
    if (value instanceof FunctionValue || value instanceof HostFunctionValue) {
      return "[object Function]";
    }
    if (typeof value === "object") {
      return "[object Object]";
    }
    return String(value);
  }

  /**
   * Validates variable declaration kind and checks for unsupported 'var'.
   * This core logic is shared between sync and async variable declaration evaluation.
   */
  private validateVariableDeclarationKind(kind: string): void {
    if (kind !== "let" && kind !== "const" && kind !== "var") {
      throw new InterpreterError(`Unsupported variable declaration kind: ${kind}`);
    }
  }

  /**
   * Validates const declaration has an initializer.
   * This core logic is shared between sync and async variable declaration evaluation.
   */
  private validateConstInitializer(declarator: ESTree.VariableDeclarator, kind: string): void {
    if (kind === "const" && declarator.init === null) {
      throw new InterpreterError("Missing initializer in const declaration");
    }
  }

  /**
   * Checks if a result contains control flow (return/break/continue) that should propagate.
   * Returns true if control flow should stop current execution.
   * This core logic is shared between sync and async evaluation.
   */
  private shouldPropagateControlFlow(result: any): boolean {
    return (
      result instanceof ReturnValue ||
      result instanceof BreakValue ||
      result instanceof ContinueValue ||
      result instanceof YieldValue
    );
  }

  /**
   * Handles loop control flow: return, break, continue.
   * Returns what the loop should return based on the control flow.
   * This core logic is shared between sync and async loop evaluation.
   */
  // Pre-allocated control flow result objects to avoid allocation in hot loops
  private static readonly CONTROL_FLOW_CONTINUE: {
    shouldReturn: false;
    value: undefined;
  } = { shouldReturn: false, value: undefined };
  private static readonly CONTROL_FLOW_BREAK: {
    shouldReturn: true;
    value: undefined;
  } = { shouldReturn: true, value: undefined };

  /**
   * Check loop control flow result without allocating objects in the common case.
   * Returns a cached object indicating what action to take.
   * @param label - If this loop is labeled, the label name. Used to consume
   *   labeled break/continue targeting this specific loop.
   */
  private handleLoopControlFlow(
    result: any,
    label?: string | null,
  ): {
    shouldReturn: boolean;
    value: any;
  } {
    // If we hit a return statement, propagate it up
    if (result instanceof ReturnValue) {
      return { shouldReturn: true, value: result };
    }

    // If we hit a break statement, exit the loop and return undefined
    if (result instanceof BreakValue) {
      // Labeled break targeting this loop's label - consume and break
      if (result.label !== null && result.label === label) {
        return Interpreter.CONTROL_FLOW_BREAK;
      }
      // Labeled break targeting a different label - propagate
      if (result.label !== null) {
        return { shouldReturn: true, value: result };
      }
      // Unlabeled break - consume
      return Interpreter.CONTROL_FLOW_BREAK;
    }

    // Labeled continue targeting this loop's label - treat as unlabeled continue
    if (result instanceof ContinueValue && result.label !== null) {
      if (result.label === label) {
        return Interpreter.CONTROL_FLOW_CONTINUE;
      }
      // Labeled continue targeting a different label - propagate
      return { shouldReturn: true, value: result };
    }

    // Normal result or unlabeled continue - keep iterating
    return Interpreter.CONTROL_FLOW_CONTINUE;
  }

  /**
   * Extracts for-of loop variable information from the left-hand side.
   * Handles both declarations (for (let x of arr)) and existing variables (for (x of arr)).
   * Returns the variable name, whether it's a declaration, and the variable kind.
   */
  private extractForOfVariable(left: ESTree.ForOfStatement["left"]): {
    variableName?: string;
    pattern?: ESTree.ArrayPattern | ESTree.ObjectPattern;
    isDeclaration: boolean;
    variableKind?: "let" | "const";
  } {
    if (left.type === "VariableDeclaration") {
      const decl = left.declarations[0];
      if (decl?.id.type === "Identifier") {
        return {
          variableName: decl.id.name,
          isDeclaration: true,
          variableKind: left.kind as "let" | "const",
        };
      } else if (decl?.id.type === "ArrayPattern" || decl?.id.type === "ObjectPattern") {
        return {
          pattern: decl.id,
          isDeclaration: true,
          variableKind: left.kind as "let" | "const",
        };
      } else {
        throw new InterpreterError("Unsupported for...of variable pattern");
      }
    } else if (left.type === "Identifier") {
      return {
        variableName: left.name,
        isDeclaration: false,
      };
    } else if (left.type === "ArrayPattern" || left.type === "ObjectPattern") {
      // Destructuring assignment: for ([a, b] of pairs)
      return {
        pattern: left,
        isDeclaration: false,
      };
    } else {
      throw new InterpreterError("Unsupported for...of left-hand side");
    }
  }

  /**
   * Extracts for-in loop variable information from the left-hand side.
   * Handles both declarations (for (let k in obj)) and existing variables (for (k in obj)).
   * Returns the variable name, whether it's a declaration, and the variable kind.
   */
  private extractForInVariable(left: ESTree.ForInStatement["left"]): {
    variableName: string;
    isDeclaration: boolean;
    variableKind?: "let" | "const";
  } {
    if (left.type === "VariableDeclaration") {
      const decl = left.declarations[0];
      if (decl?.id.type !== "Identifier") {
        throw new InterpreterError("Unsupported for...in variable pattern");
      }
      return {
        variableName: decl.id.name,
        isDeclaration: true,
        variableKind: left.kind as "let" | "const",
      };
    } else if (left.type === "Identifier") {
      return {
        variableName: left.name,
        isDeclaration: false,
      };
    } else {
      throw new InterpreterError("Unsupported for...in left-hand side");
    }
  }

  /**
   * Converts an iterable to an array.
   * Supports arrays, generators, and objects with [Symbol.iterator].
   */
  private iterableToArray(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value[Symbol.iterator] === "function") {
      return [...value];
    }
    if (value && typeof value.next === "function") {
      // Already an iterator (e.g., generator instance without Symbol.iterator called)
      const result: any[] = [];
      let iterResult = value.next();
      while (!iterResult.done) {
        result.push(iterResult.value);
        iterResult = value.next();
      }
      return result;
    }
    throw new InterpreterError(
      "Spread syntax requires an iterable (array, generator, or object with [Symbol.iterator])",
    );
  }

  /**
   * Validates that a spread value in an array expression is iterable and returns an array.
   * Supports arrays, generators, and objects with [Symbol.iterator].
   */
  private validateArraySpread(spreadValue: any): any[] {
    return this.iterableToArray(spreadValue);
  }

  /**
   * Validates that a spread value in an object expression is an object.
   * Throws an error if the value is not a valid object.
   */
  private validateObjectSpread(spreadValue: any): void {
    if (typeof spreadValue !== "object" || spreadValue === null || Array.isArray(spreadValue)) {
      throw new InterpreterError("Spread syntax in objects requires an object");
    }
  }

  /**
   * Parse function parameters from AST nodes into the arrays/maps needed by FunctionValue.
   * Handles Identifier, RestElement, AssignmentPattern, ObjectPattern, and ArrayPattern.
   */
  private parseFunctionParams(nodeParams: ESTree.Pattern[]): {
    params: string[];
    restParamIndex: number | null;
    defaultValues: Map<number, ESTree.Expression>;
    destructuredParams: Map<number, ESTree.ObjectPattern | ESTree.ArrayPattern>;
  } {
    const params: string[] = [];
    let restParamIndex: number | null = null;
    const defaultValues = new Map<number, ESTree.Expression>();
    const destructuredParams = new Map<number, ESTree.ObjectPattern | ESTree.ArrayPattern>();

    for (let i = 0; i < nodeParams.length; i++) {
      const param = nodeParams[i];

      if (!param) {
        continue;
      }

      if (param.type === "RestElement") {
        if (!this.isFeatureEnabled("RestParameters")) {
          throw new InterpreterError("RestParameters is not enabled");
        }
        if (i !== nodeParams.length - 1) {
          throw new InterpreterError("Rest parameter must be last");
        }
        const restElement = param as ESTree.RestElement;
        if (restElement.argument.type !== "Identifier") {
          throw new InterpreterError("Rest parameter must be an identifier");
        }
        restParamIndex = i;
        params.push((restElement.argument as ESTree.Identifier).name);
      } else if (param.type === "Identifier") {
        params.push((param as ESTree.Identifier).name);
      } else if (param.type === "ObjectPattern" || param.type === "ArrayPattern") {
        // Destructuring parameter: ({ a, b }) => ... or ([a, b]) => ...
        if (!this.isFeatureEnabled("Destructuring")) {
          throw new InterpreterError("Destructuring is not enabled");
        }
        params.push(`__destructured_${i}__`);
        destructuredParams.set(i, param);
      } else if (param.type === "AssignmentPattern") {
        if (!this.isFeatureEnabled("DefaultParameters")) {
          throw new InterpreterError("DefaultParameters is not enabled");
        }
        const assignmentPattern = param as ESTree.AssignmentPattern;
        if (assignmentPattern.left.type === "Identifier") {
          params.push((assignmentPattern.left as ESTree.Identifier).name);
        } else if (
          assignmentPattern.left.type === "ObjectPattern" ||
          assignmentPattern.left.type === "ArrayPattern"
        ) {
          // Destructuring with default: ({ a, b } = {}) => ...
          if (!this.isFeatureEnabled("Destructuring")) {
            throw new InterpreterError("Destructuring is not enabled");
          }
          params.push(`__destructured_${i}__`);
          destructuredParams.set(i, assignmentPattern.left);
        } else {
          throw new InterpreterError("Unsupported parameter pattern type");
        }
        if (assignmentPattern.right) {
          defaultValues.set(i, assignmentPattern.right);
        }
      } else {
        throw new InterpreterError(`Unsupported parameter type: ${(param as ESTree.Node).type}`);
      }
    }

    return { params, restParamIndex, defaultValues, destructuredParams };
  }

  private extractPropertyKey(key: ESTree.Expression): string {
    if (key.type === "Identifier") {
      return (key as ESTree.Identifier).name;
    } else if (key.type === "Literal") {
      const literal = key as ESTree.Literal;
      return String(literal.value);
    } else {
      throw new InterpreterError("Unsupported property key type");
    }
  }

  /**
   * Sets up the catch parameter binding for a try-catch statement.
   * Returns the parameter name if present, null otherwise.
   */
  private getCatchParameterName(handler: ESTree.CatchClause | null | undefined): string | null {
    if (handler?.param && handler.param.type === "Identifier") {
      return (handler.param as ESTree.Identifier).name;
    }
    return null;
  }

  /**
   * Checks if a finally block result should override the try/catch result.
   * Finally blocks with control flow (return/break/continue) override previous results.
   */
  private shouldFinallyOverride(finallyResult: any): boolean {
    return this.shouldPropagateControlFlow(finallyResult);
  }

  /**
   * Validates that an object allows property access.
   * Throws an error if the object is a HostFunctionValue.
   */
  private validateMemberAccess(_object: any): void {
    // HostFunctionValue now handles property access securely through its Proxy,
    // allowing static methods (e.g., Promise.resolve) while blocking dangerous properties.
    // No blanket blocking needed here.
  }

  private validateSymbolProperty(property: any): void {
    // Block symbol hooks that can alter coercion/dispatch or expose host behavior.
    if (typeof property === "symbol" && isDangerousSymbol(property)) {
      throw new InterpreterError(
        `Symbol '${String(property)}' is not allowed for security reasons`,
      );
    }
  }

  private ensureNoPrototypeAccessForSymbol(object: any, property: symbol): void {
    // Mirror inherited-property checks for symbol keys to prevent prototype probing.
    if (object === null || typeof object !== "object") {
      return;
    }
    if (Object.getPrototypeOf(object) === null) {
      return;
    }
    // Allow Symbol.iterator for iteration protocol support
    if (property === Symbol.iterator) {
      return;
    }
    if (property in object && !Object.prototype.hasOwnProperty.call(object, property)) {
      throw new InterpreterError(
        `Access to inherited property '${String(property)}' is not allowed`,
      );
    }
  }

  private ensureNoInternalObjectAccess(object: any): void {
    // Prevent leaking interpreter internals through property access.
    if (object instanceof FunctionValue) {
      throw new InterpreterError("Cannot access properties on functions");
    }
    if (object instanceof GeneratorValue || object instanceof AsyncGeneratorValue) {
      throw new InterpreterError("Cannot access internal generator properties");
    }
    if (
      object instanceof ReturnValue ||
      object instanceof BreakValue ||
      object instanceof ContinueValue ||
      object instanceof OptionalChainShortCircuit ||
      object instanceof YieldValue ||
      object instanceof Environment
    ) {
      throw new InterpreterError("Cannot access internal interpreter state");
    }
  }

  private ensureNoInternalObjectMutation(object: any): void {
    // Prevent mutation of interpreter internals via property assignment.
    if (object instanceof FunctionValue) {
      throw new InterpreterError("Cannot assign properties on functions");
    }
    if (object instanceof GeneratorValue || object instanceof AsyncGeneratorValue) {
      throw new InterpreterError("Cannot assign properties on generators");
    }
    if (
      object instanceof ReturnValue ||
      object instanceof BreakValue ||
      object instanceof ContinueValue ||
      object instanceof OptionalChainShortCircuit ||
      object instanceof YieldValue ||
      object instanceof Environment
    ) {
      throw new InterpreterError("Cannot assign properties on internal objects");
    }
  }

  private ensureNoPrototypeAccess(object: any, propName: string): void {
    if (object === null || typeof object !== "object") {
      return;
    }
    if (Object.getPrototypeOf(object) === null) {
      return;
    }
    if (object instanceof RegExp) {
      return;
    }
    if (propName === "then") {
      return;
    }
    if (propName in object && !Object.prototype.hasOwnProperty.call(object, propName)) {
      throw new InterpreterError(`Access to inherited property '${propName}' is not allowed`);
    }
  }

  private shouldSkipPropertyValidation(object: any): boolean {
    if (object === null || typeof object !== "object") {
      return false;
    }
    if (this.instanceClassMap.has(object)) {
      return false;
    }
    if (object instanceof RegExp) {
      return true;
    }
    return Object.getPrototypeOf(object) === null;
  }

  private shouldForcePropertyValidation(property: string): boolean {
    return property === "__proto__" || property === "constructor" || property === "prototype";
  }

  private getInstanceClass(object: any): ClassValue | null {
    if (typeof object !== "object" || object === null) {
      return null;
    }
    return this.instanceClassMap.get(object) ?? null;
  }

  /**
   * Check if an object is an instance of a ClassValue.
   * Handles inheritance by walking up the prototype chain.
   */
  private isInstanceOfClass(obj: any, classValue: ClassValue): boolean {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    // Get the class that created this instance
    let instanceClass = this.getInstanceClass(obj);
    // Walk up the inheritance chain
    while (instanceClass) {
      if (instanceClass === classValue) {
        return true;
      }
      instanceClass = instanceClass.parentClass ?? null;
    }
    return false;
  }

  /**
   * Check if an object is an instance of a FunctionValue (user-defined constructor).
   * This is for functions used as constructors with 'new'.
   */
  private isInstanceOfFunction(_obj: any, _funcValue: FunctionValue): boolean {
    // FunctionValue instances used as constructors aren't tracked the same way
    // as ClassValue instances. For now, return false.
    // This could be extended if we track function-based construction.
    return false;
  }

  /**
   * Accesses an array element by index.
   * Handles numeric strings (for...in gives string indices).
   * Returns undefined for out-of-bounds access.
   */
  private accessArrayElement(arr: any[], property: any): any {
    // Convert string to number if it's a numeric string (for...in gives string indices)
    const index = typeof property === "string" ? Number(property) : property;

    if (typeof index !== "number" || isNaN(index)) {
      throw new InterpreterError("Array index must be a number");
    }
    if (index < 0 || index >= arr.length) {
      return undefined; // JavaScript behavior for out-of-bounds
    }
    return arr[index];
  }

  /**
   * Accesses an object property with validation.
   * Validates the property name for security.
   */
  private accessObjectProperty(obj: object, property: any): any {
    // Symbols are validated separately to avoid string coercion surprises.
    if (typeof property === "symbol") {
      this.validateSymbolProperty(property);
      this.ensureNoInternalObjectAccess(obj);
      this.ensureNoPrototypeAccessForSymbol(obj, property);
      return (obj as any)[property];
    }
    const propName = typeof property === "string" ? property : String(property);
    if (!this.shouldSkipPropertyValidation(obj) || this.shouldForcePropertyValidation(propName)) {
      validatePropertyName(propName); // Security: prevent prototype pollution
    }
    this.ensureNoInternalObjectAccess(obj);
    this.ensureNoPrototypeAccess(obj, propName);
    return (obj as any)[propName];
  }

  /**
   * Gets the .length property for strings and arrays.
   * Returns null if the property is not "length" or object doesn't support it.
   */
  private getLengthProperty(object: any, property: string): number | null {
    if (property === "length") {
      if (typeof object === "string" || Array.isArray(object)) {
        return object.length;
      }
    }
    return null;
  }

  /**
   * Validates that a value is an array for array destructuring.
   */
  private validateArrayDestructuring(value: any): void {
    if (!Array.isArray(value)) {
      throw new InterpreterError(`Cannot destructure non-array value`);
    }
  }

  /**
   * Validates that a value is an object (not null, not array) for object destructuring.
   */
  private validateObjectDestructuring(value: any): void {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new InterpreterError(`Cannot destructure non-object value`);
    }
  }

  /**
   * Binds an identifier in destructuring (either declares or sets).
   */
  private bindDestructuredIdentifier(
    name: string,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): void {
    if (declare) {
      this.environment.declare(name, value, kind!);
    } else {
      this.environment.set(name, value);
    }
  }

  /**
   * Extracts rest element name from a RestElement node.
   */
  private getRestElementName(restElement: ESTree.RestElement): string {
    if (restElement.argument.type !== "Identifier") {
      throw new InterpreterError("Rest element must be an identifier");
    }
    return (restElement.argument as ESTree.Identifier).name;
  }

  /**
   * Evaluates function/constructor arguments, handling spread elements.
   * Shared logic between evaluateCallExpression and evaluateNewExpression.
   */
  private evaluateArguments(args: ESTree.CallExpression["arguments"]): any[] {
    const count = args.length;
    if (count === 0) {
      return [];
    }

    let hasSpread = false;
    for (let i = 0; i < count; i++) {
      if (args[i]?.type === "SpreadElement") {
        hasSpread = true;
        break;
      }
    }

    if (!hasSpread) {
      const evaluatedArgs = Array.from({ length: count });
      for (let i = 0; i < count; i++) {
        evaluatedArgs[i] = this.evaluateNode(args[i] as ESTree.Expression);
      }
      return evaluatedArgs;
    }

    const evaluatedArgs: any[] = [];
    for (let i = 0; i < count; i++) {
      const arg = args[i];
      if (arg?.type === "SpreadElement") {
        // Spread in call: fn(...arr) - expand array as separate arguments.
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = this.evaluateNode((arg as ESTree.SpreadElement).argument);
        if (!Array.isArray(spreadValue)) {
          throw new InterpreterError("Spread syntax in function calls requires an array");
        }
        // Avoid push(...spreadValue) to sidestep argument count limits on large arrays.
        for (let j = 0; j < spreadValue.length; j++) {
          evaluatedArgs.push(spreadValue[j]);
        }
      } else {
        evaluatedArgs.push(this.evaluateNode(arg as ESTree.Expression));
      }
    }
    return evaluatedArgs;
  }

  /**
   * Evaluates function/constructor arguments asynchronously, handling spread elements.
   * Shared logic between evaluateCallExpressionAsync and evaluateNewExpressionAsync.
   */
  private async evaluateArgumentsAsync(args: ESTree.CallExpression["arguments"]): Promise<any[]> {
    const count = args.length;
    if (count === 0) {
      return [];
    }

    let hasSpread = false;
    for (let i = 0; i < count; i++) {
      if (args[i]?.type === "SpreadElement") {
        hasSpread = true;
        break;
      }
    }

    if (!hasSpread) {
      const evaluatedArgs = Array.from({ length: count });
      for (let i = 0; i < count; i++) {
        evaluatedArgs[i] = await this.evaluateNodeAsync(args[i] as ESTree.Expression);
      }
      return evaluatedArgs;
    }

    const evaluatedArgs: any[] = [];
    for (let i = 0; i < count; i++) {
      const arg = args[i];
      if (arg?.type === "SpreadElement") {
        // Spread in call: fn(...arr) - expand array as separate arguments.
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = await this.evaluateNodeAsync((arg as ESTree.SpreadElement).argument);
        if (!Array.isArray(spreadValue)) {
          throw new InterpreterError("Spread syntax in function calls requires an array");
        }
        // Avoid push(...spreadValue) to sidestep argument count limits on large arrays.
        for (let j = 0; j < spreadValue.length; j++) {
          evaluatedArgs.push(spreadValue[j]);
        }
      } else {
        evaluatedArgs.push(await this.evaluateNodeAsync(arg as ESTree.Expression));
      }
    }
    return evaluatedArgs;
  }

  /**
   * Wraps arguments for passing to host functions/constructors.
   * Converts FunctionValue instances to callable native functions so that
   * host code (like Promise constructor) can invoke sandbox callbacks.
   */
  private wrapArgsForHost(args: any[], isAsync: boolean): any[] {
    const count = args.length;
    if (count === 0) {
      return args;
    }

    let hasFunctionValue = false;
    for (let i = 0; i < count; i++) {
      if (args[i] instanceof FunctionValue) {
        hasFunctionValue = true;
        break;
      }
    }

    if (!hasFunctionValue) {
      return args;
    }

    const wrappedArgs = Array.from({ length: count });
    for (let i = 0; i < count; i++) {
      const arg = args[i];
      if (arg instanceof FunctionValue) {
        // Wrap sandbox function as a callable native function
        if (isAsync || arg.isAsync) {
          wrappedArgs[i] = async (...hostArgs: any[]) => {
            return await this.executeSandboxFunctionAsync(arg, hostArgs, undefined);
          };
        } else {
          wrappedArgs[i] = (...hostArgs: any[]) => {
            return this.executeSandboxFunction(arg, hostArgs, undefined);
          };
        }
      } else {
        wrappedArgs[i] = arg;
      }
    }
    return wrappedArgs;
  }

  /**
   * Executes a sandbox function (synchronous version).
   * Sets up environment, binds parameters, executes body, and unwraps return value.
   */
  private executeSandboxFunction(fn: FunctionValue, args: any[], thisValue: any): any {
    // Check and track call stack depth
    this.enterCallStack();

    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    this.environment = new Environment(fn.closure, thisValue, true);

    try {
      if (fn.homeClass) {
        this.currentSuperBinding = {
          parentClass: fn.homeClass.parentClass,
          thisValue,
          currentClass: fn.homeClass,
          isStatic: fn.homeIsStatic,
        };
      }

      // Bind parameters to arguments
      this.bindFunctionParameters(fn, args);

      // Execute the function body
      const result = this.evaluateNode(fn.body);

      // If we got a return value, unwrap it and return the actual value
      if (result instanceof ReturnValue) {
        return result.value;
      }

      // If no explicit return, JavaScript functions return undefined
      return undefined;
    } finally {
      // Restore the previous environment (exit function scope)
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
      this.exitCallStack();
    }
  }

  /**
   * Executes a sandbox function (asynchronous version).
   * Sets up environment, binds parameters, executes body, and unwraps return value.
   * Handles both sync and async sandbox functions.
   */
  private async executeSandboxFunctionAsync(
    fn: FunctionValue,
    args: any[],
    thisValue: any,
  ): Promise<any> {
    // Check and track call stack depth
    this.enterCallStack();

    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    this.environment = new Environment(fn.closure, thisValue, true);

    try {
      if (fn.homeClass) {
        this.currentSuperBinding = {
          parentClass: fn.homeClass.parentClass,
          thisValue,
          currentClass: fn.homeClass,
          isStatic: fn.homeIsStatic,
        };
      }

      // Bind parameters to arguments (use async version to handle async default values)
      await this.bindFunctionParametersAsync(fn, args);

      // Execute the function body
      const result = await this.evaluateNodeAsync(fn.body);

      // If we got a return value, unwrap it and return the actual value
      if (result instanceof ReturnValue) {
        return result.value;
      }

      // If no explicit return, JavaScript functions return undefined
      return undefined;
    } finally {
      // Restore the previous environment (exit function scope)
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
      this.exitCallStack();
    }
  }

  /**
   * Validates that a value is a valid constructor (FunctionValue or HostFunctionValue).
   */
  private validateConstructor(constructor: any): void {
    // Only allow sandbox/host functions or class values as constructors.
    if (
      !(
        constructor instanceof FunctionValue ||
        constructor instanceof HostFunctionValue ||
        constructor instanceof ClassValue
      )
    ) {
      throw new InterpreterError("Constructor must be a function or class");
    }
  }

  /**
   * Determines the final return value for a constructor.
   * If constructor explicitly returns an object, use that.
   * Otherwise, return the instance.
   */
  private resolveConstructorReturn(result: any, instance: object): any {
    // Match JS semantics: object return overrides the newly created instance.
    if (typeof result === "object" && result !== null) {
      return result;
    }
    return instance;
  }

  /**
   * Executes a host function constructor (synchronous).
   */
  private executeHostConstructor(constructor: HostFunctionValue, args: any[]): any {
    try {
      const result = Reflect.construct(constructor.hostFunc, args);
      return ReadOnlyProxy.wrap(result, constructor.name);
    } catch (error: any) {
      throw new InterpreterError(
        this.formatHostError(`Constructor '${constructor.name}' threw error`, error),
      );
    }
  }

  /**
   * Gets a property from an object for method call purposes.
   * Handles computed vs non-computed property access.
   * Used when we already have the object and need to extract a method.
   */
  private getObjectProperty(
    obj: any,
    memberExpr: ESTree.MemberExpression,
    propertyValue: any,
  ): any {
    this.validateMemberAccess(obj);
    const instanceClass = this.getInstanceClass(obj);
    if (memberExpr.computed) {
      // Symbols are treated distinctly from string keys for safety.
      if (typeof propertyValue === "symbol") {
        this.validateSymbolProperty(propertyValue);
        if (instanceClass) {
          throw new InterpreterError("Symbol properties are not supported");
        }
        if (typeof obj === "object" && obj !== null) {
          this.ensureNoInternalObjectAccess(obj);
          this.ensureNoPrototypeAccessForSymbol(obj, propertyValue);
        }
        return obj[propertyValue];
      }
      const propName = String(propertyValue);
      if (!this.shouldSkipPropertyValidation(obj) || this.shouldForcePropertyValidation(propName)) {
        validatePropertyName(propName);
      }
      if (instanceClass) {
        return this.getInstanceProperty(obj as Record<string, any>, instanceClass, propName);
      }
      if (typeof obj === "object" && obj !== null) {
        this.ensureNoInternalObjectAccess(obj);
        this.ensureNoPrototypeAccess(obj, propName);
      }
      return obj[propName];
    } else {
      if (memberExpr.property.type !== "Identifier") {
        throw new InterpreterError("Invalid method access");
      }
      const property = (memberExpr.property as ESTree.Identifier).name;
      if (instanceClass) {
        validatePropertyName(property);
        return this.getInstanceProperty(obj as Record<string, any>, instanceClass, property);
      }
      if (typeof obj === "object" && obj !== null) {
        if (
          !this.shouldSkipPropertyValidation(obj) ||
          this.shouldForcePropertyValidation(property)
        ) {
          validatePropertyName(property);
        }
        this.ensureNoInternalObjectAccess(obj);
        this.ensureNoPrototypeAccess(obj, property);
      }
      return obj[property];
    }
  }

  private evaluateBinaryExpression(node: ESTree.BinaryExpression): any {
    if (!this.isFeatureEnabled("BinaryOperators")) {
      throw new InterpreterError("BinaryOperators is not enabled");
    }

    const left = this.evaluateNode(node.left);
    if (left instanceof YieldValue) return left;
    const right = this.evaluateNode(node.right);
    if (right instanceof YieldValue) return right;
    return this.applyBinaryOperator(node.operator, left, right);
  }

  private evaluateUnaryExpression(node: ESTree.UnaryExpression): any {
    if (!this.isFeatureEnabled("UnaryOperators")) {
      throw new InterpreterError("UnaryOperators is not enabled");
    }

    // Special case: typeof should not throw for undefined variables
    if (node.operator === "typeof") {
      return this.evaluateTypeof(node.argument);
    }

    // Special case: delete operates on references, not values
    if (node.operator === "delete") {
      return this.evaluateDelete(node.argument);
    }

    // For other unary operators, evaluate normally
    const argument = this.evaluateNode(node.argument);
    return this.applyUnaryOperator(node.operator, argument);
  }

  /**
   * Evaluate typeof operator, handling undefined variables gracefully.
   */
  private evaluateTypeof(argument: ESTree.Expression): string {
    try {
      const value = this.evaluateNode(argument);
      return this.getTypeofValue(value);
    } catch (error) {
      if (error instanceof InterpreterError && error.message.includes("Undefined variable")) {
        return "undefined";
      }
      throw error;
    }
  }

  /**
   * Evaluate delete operator.
   * - `delete obj.prop` / `delete obj[expr]` deletes a property from an object.
   * - `delete identifier` returns true in non-strict mode (but doesn't actually delete).
   * - `delete literal` returns true.
   */
  private evaluateDelete(argument: ESTree.Expression): boolean {
    // delete obj.prop or delete obj[expr]
    if (argument.type === "MemberExpression") {
      const obj = this.evaluateNode(argument.object);
      if (obj === null || obj === undefined) {
        throw new InterpreterError(`Cannot delete property of ${obj}`);
      }
      const prop = argument.computed
        ? this.evaluateNode(argument.property)
        : (argument.property as ESTree.Identifier).name;
      // Block deletion on read-only proxied globals
      if (typeof obj === "object" && obj !== null) {
        return delete obj[prop];
      }
      return true;
    }

    // delete identifier - in non-strict mode returns true but doesn't delete
    if (argument.type === "Identifier") {
      return true;
    }

    // delete on literals or other expressions returns true
    return true;
  }

  private evaluateUpdateExpression(node: ESTree.UpdateExpression): any {
    if (!this.isFeatureEnabled("UpdateExpression")) {
      throw new InterpreterError("UpdateExpression is not enabled");
    }

    // UpdateExpression handles ++ and -- operators (both prefix and postfix)
    if (node.argument.type === "Identifier") {
      const name = (node.argument as ESTree.Identifier).name;
      const currentValue = this.environment.get(name);

      const [newValue, returnValue] = this.applyUpdateOperator(
        node.operator,
        currentValue,
        node.prefix,
      );

      this.environment.set(name, newValue);
      return returnValue;
    }

    if (node.argument.type === "MemberExpression") {
      const memberExpr = node.argument as ESTree.MemberExpression;
      const object = this.evaluateNode(memberExpr.object);
      const property = memberExpr.computed
        ? String(this.evaluateNode(memberExpr.property))
        : (memberExpr.property as ESTree.Identifier).name;

      const currentValue = object[property];

      const [newValue, returnValue] = this.applyUpdateOperator(
        node.operator,
        currentValue,
        node.prefix,
      );

      object[property] = newValue;
      return returnValue;
    }

    throw new InterpreterError(
      "Update expression must operate on an identifier or member expression",
    );
  }

  private evaluateLogicalExpression(node: ESTree.LogicalExpression): any {
    if (!this.isFeatureEnabled("LogicalOperators")) {
      throw new InterpreterError("LogicalOperators is not enabled");
    }

    const left = this.evaluateNode(node.left);
    if (left instanceof YieldValue) return left;

    switch (node.operator) {
      case "&&":
        // Short-circuit evaluation: if left is falsy, return left without evaluating right
        // This matches JavaScript semantics where && returns the first falsy value or the last value
        if (!left) return left;
        return this.evaluateNode(node.right);

      case "||":
        // Short-circuit evaluation: if left is truthy, return left without evaluating right
        // This matches JavaScript semantics where || returns the first truthy value or the last value
        if (left) return left;
        return this.evaluateNode(node.right);

      case "??":
        // Nullish coalescing: return right only if left is null or undefined
        if (left !== null && left !== undefined) return left;
        return this.evaluateNode(node.right);

      default:
        throw new InterpreterError(`Unsupported logical operator: ${node.operator}`);
    }
  }

  private evaluateConditionalExpression(node: ESTree.ConditionalExpression): any {
    if (!this.isFeatureEnabled("ConditionalExpression")) {
      throw new InterpreterError("ConditionalExpression is not enabled");
    }

    // Evaluate the test condition
    const testValue = this.evaluateNode(node.test);
    if (testValue instanceof YieldValue) return testValue;

    // Return consequent if truthy, alternate if falsy
    if (testValue) {
      return this.evaluateNode(node.consequent);
    } else {
      return this.evaluateNode(node.alternate);
    }
  }

  private evaluateAssignmentExpression(node: ESTree.AssignmentExpression): any {
    // Handle logical assignment operators (||=, &&=, ??=) with short-circuit evaluation
    if (node.operator === "||=" || node.operator === "&&=" || node.operator === "??=") {
      if (!this.isFeatureEnabled("LogicalAssignment")) {
        throw new InterpreterError("LogicalAssignment is not enabled");
      }
      return this.evaluateLogicalAssignment(node);
    }

    // Handle compound assignment operators (+=, -=, *=, etc.)
    if (node.operator !== "=") {
      return this.evaluateCompoundAssignment(node);
    }

    const value = this.evaluateNode(node.right);

    // Handle destructuring assignments
    if (node.left.type === "ArrayPattern" || node.left.type === "ObjectPattern") {
      this.destructurePattern(node.left, value, false);
      return value;
    }

    // Handle member expression assignment: arr[index] = value or obj.prop = value
    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;

      if (memberExpr.object.type === "Super") {
        return this.assignSuperMember(memberExpr, value);
      }

      const object = this.evaluateNode(memberExpr.object);

      // Block property assignment on host functions
      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      // Handle private field assignment: this.#field = value
      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        return this.assignPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
          value,
        );
      }

      if (memberExpr.computed) {
        // Computed property: arr[index] = value or obj["key"] = value
        const property = this.evaluateNode(memberExpr.property);
        const instanceClass = this.getInstanceClass(object);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue || instanceClass) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            object[property] = value;
            return value;
          }
          throw new InterpreterError("Assignment target is not an array or object");
        }

        if (Array.isArray(object)) {
          // Array element assignment: arr[i] = value
          // Convert string to number if it's a numeric string (needed because for...in gives string indices)
          const index = typeof property === "string" ? Number(property) : property;

          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = value;
          return value;
        } else if (object instanceof ClassValue) {
          const propName = String(property);
          return this.assignClassStaticMember(object, propName, value);
        } else if (instanceClass) {
          const propName = String(property);
          validatePropertyName(propName);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
            value,
          );
        } else if (typeof object === "object" && object !== null) {
          // Object computed property assignment: obj["key"] = value or obj[expr] = value
          const propName = String(property);
          validatePropertyName(propName); // Security: prevent prototype pollution
          object[propName] = value;
          return value;
        } else {
          throw new InterpreterError("Assignment target is not an array or object");
        }
      } else {
        // Dot notation: obj.prop = value
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }

        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property); // Security: prevent prototype pollution

        if (object instanceof ClassValue) {
          return this.assignClassStaticMember(object, property, value);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            value,
          );
        }

        if (typeof object === "object" && object !== null && !Array.isArray(object)) {
          object[property] = value;
          return value;
        } else {
          throw new InterpreterError("Cannot assign property to non-object");
        }
      }
    }

    // Handle variable assignment
    if (node.left.type !== "Identifier") {
      throw new InterpreterError("Invalid assignment target");
    }

    this.environment.set((node.left as ESTree.Identifier).name, value);
    return value;
  }

  /**
   * Evaluates logical assignment operators: ||=, &&=, ??=
   * These operators have short-circuit behavior - they only assign if the condition is met.
   * - x ||= y: assigns y to x only if x is falsy
   * - x &&= y: assigns y to x only if x is truthy
   * - x ??= y: assigns y to x only if x is null or undefined
   */
  private evaluateLogicalAssignment(node: ESTree.AssignmentExpression): any {
    // Get the current value of the left-hand side
    let currentValue: any;

    if (node.left.type === "Identifier") {
      currentValue = this.environment.get((node.left as ESTree.Identifier).name);
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object =
        memberExpr.object.type === "Super"
          ? this.evaluateSuperMemberAccess(memberExpr)
          : this.evaluateNode(memberExpr.object);

      if (memberExpr.object.type === "Super") {
        currentValue = object;
      } else if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        currentValue = this.accessPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
        );
      } else if (object instanceof ClassValue) {
        currentValue = this.accessClassStaticMember(object, memberExpr);
      } else {
        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          if (memberExpr.computed) {
            const property = this.evaluateNode(memberExpr.property);
            if (typeof property === "symbol") {
              this.validateSymbolProperty(property);
              throw new InterpreterError("Symbol properties are not supported");
            }
            const propName = String(property);
            validatePropertyName(propName);
            currentValue = this.getInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              propName,
            );
          } else {
            if (memberExpr.property.type !== "Identifier") {
              throw new InterpreterError("Invalid property access");
            }
            const property = (memberExpr.property as ESTree.Identifier).name;
            validatePropertyName(property);
            currentValue = this.getInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              property,
            );
          }
        } else {
          if (object instanceof HostFunctionValue) {
            throw new InterpreterError("Cannot access properties on host functions");
          }
          this.ensureNoInternalObjectAccess(object);

          if (memberExpr.computed) {
            const property = this.evaluateNode(memberExpr.property);
            if (typeof property === "symbol") {
              this.validateSymbolProperty(property);
              if (typeof object === "object" && object !== null) {
                this.ensureNoPrototypeAccessForSymbol(object, property);
                currentValue = object[property];
              } else {
                throw new InterpreterError("Invalid property access");
              }
            } else {
              const propName = Array.isArray(object)
                ? typeof property === "string"
                  ? Number(property)
                  : property
                : String(property);
              if (!Array.isArray(object) && typeof object === "object") {
                if (
                  !this.shouldSkipPropertyValidation(object) ||
                  this.shouldForcePropertyValidation(propName)
                ) {
                  validatePropertyName(propName);
                }
                this.ensureNoPrototypeAccess(object, propName);
              }
              currentValue = object[propName];
            }
          } else {
            if (memberExpr.property.type !== "Identifier") {
              throw new InterpreterError("Invalid property access");
            }
            const property = (memberExpr.property as ESTree.Identifier).name;
            if (
              !this.shouldSkipPropertyValidation(object) ||
              this.shouldForcePropertyValidation(property)
            ) {
              validatePropertyName(property);
            }
            if (typeof object === "object") {
              this.ensureNoPrototypeAccess(object, property);
            }
            currentValue = object[property];
          }
        }
      }
    } else {
      throw new InterpreterError("Invalid logical assignment target");
    }

    // Check if we should assign based on the operator and current value
    let shouldAssign: boolean;
    switch (node.operator) {
      case "||=":
        // Only assign if current value is falsy
        shouldAssign = !currentValue;
        break;
      case "&&=":
        // Only assign if current value is truthy
        shouldAssign = !!currentValue;
        break;
      case "??=":
        // Only assign if current value is null or undefined
        shouldAssign = currentValue === null || currentValue === undefined;
        break;
      default:
        throw new InterpreterError(`Unsupported logical assignment operator: ${node.operator}`);
    }

    // Short-circuit: if we shouldn't assign, return the current value without evaluating right
    if (!shouldAssign) {
      return currentValue;
    }

    // Evaluate the right-hand side and assign
    const newValue = this.evaluateNode(node.right);

    if (node.left.type === "Identifier") {
      this.environment.set((node.left as ESTree.Identifier).name, newValue);
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      if (memberExpr.object.type === "Super") {
        return this.assignSuperMember(memberExpr, newValue);
      }

      const object = this.evaluateNode(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        return this.assignPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
          newValue,
        );
      }

      if (memberExpr.computed) {
        const property = this.evaluateNode(memberExpr.property);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          const instanceClass = this.getInstanceClass(object);
          if (instanceClass) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            object[property] = newValue;
          }
          return newValue;
        }
        if (Array.isArray(object)) {
          const index = typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = newValue;
        } else if (object instanceof ClassValue) {
          const propName = String(property);
          return this.assignClassStaticMember(object, propName, newValue);
        } else {
          const instanceClass = this.getInstanceClass(object);
          if (instanceClass) {
            const propName = String(property);
            validatePropertyName(propName);
            return this.assignInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              propName,
              newValue,
            );
          } else if (typeof object === "object" && object !== null) {
            const propName = String(property);
            validatePropertyName(propName);
            object[propName] = newValue;
          }
        }
      } else {
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        if (object instanceof ClassValue) {
          return this.assignClassStaticMember(object, property, newValue);
        }
        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            newValue,
          );
        }
        object[property] = newValue;
      }
    }

    return newValue;
  }

  /**
   * Evaluates compound assignment operators: +=, -=, *=, /=, %=, **=, <<=, >>=, >>>=, &=, |=, ^=
   * These operators read the current value, apply the operation, and assign the result.
   */
  private evaluateCompoundAssignment(node: ESTree.AssignmentExpression): any {
    const rightValue = this.evaluateNode(node.right);

    // Get the current value and compute the new value
    const computeNewValue = (currentValue: any): any => {
      switch (node.operator) {
        case "+=":
          return currentValue + rightValue;
        case "-=":
          return currentValue - rightValue;
        case "*=":
          return currentValue * rightValue;
        case "/=":
          return currentValue / rightValue;
        case "%=":
          return currentValue % rightValue;
        case "**=":
          return currentValue ** rightValue;
        case "<<=":
          return currentValue << rightValue;
        case ">>=":
          return currentValue >> rightValue;
        case ">>>=":
          return currentValue >>> rightValue;
        case "&=":
          return currentValue & rightValue;
        case "|=":
          return currentValue | rightValue;
        case "^=":
          return currentValue ^ rightValue;
        default:
          throw new InterpreterError(`Unsupported assignment operator: ${node.operator}`);
      }
    };

    // Handle identifier assignment: x += 1
    if (node.left.type === "Identifier") {
      const name = (node.left as ESTree.Identifier).name;
      const currentValue = this.environment.get(name);
      const newValue = computeNewValue(currentValue);
      this.environment.set(name, newValue);
      return newValue;
    }

    // Handle member expression assignment: obj.prop += 1 or arr[i] += 1
    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;

      // Handle super member assignment
      if (memberExpr.object.type === "Super") {
        const currentValue = this.evaluateSuperMemberAccess(memberExpr);
        const newValue = computeNewValue(currentValue);
        return this.assignSuperMember(memberExpr, newValue);
      }

      const object = this.evaluateNode(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      // Handle private field: this.#field += 1
      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        const fieldName = (memberExpr.property as ESTree.PrivateIdentifier).name;
        const currentValue = this.accessPrivateField(object, fieldName);
        const newValue = computeNewValue(currentValue);
        return this.assignPrivateField(object, fieldName, newValue);
      }

      if (memberExpr.computed) {
        // Computed property: arr[i] += 1 or obj["key"] += 1
        const property = this.evaluateNode(memberExpr.property);

        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue || this.getInstanceClass(object)) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            const currentValue = object[property];
            const newValue = computeNewValue(currentValue);
            object[property] = newValue;
            return newValue;
          }
          throw new InterpreterError("Invalid assignment target");
        }

        if (Array.isArray(object)) {
          const index = typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          const currentValue = object[index];
          const newValue = computeNewValue(currentValue);
          object[index] = newValue;
          return newValue;
        }

        if (object instanceof ClassValue) {
          const propName = String(property);
          const currentValue = this.accessClassStaticMember(object, memberExpr);
          const newValue = computeNewValue(currentValue);
          return this.assignClassStaticMember(object, propName, newValue);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          const propName = String(property);
          validatePropertyName(propName);
          const currentValue = this.getInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
          );
          const newValue = computeNewValue(currentValue);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
            newValue,
          );
        }

        // Regular object
        const propName = String(property);
        validatePropertyName(propName);
        const currentValue = object[propName];
        const newValue = computeNewValue(currentValue);
        object[propName] = newValue;
        return newValue;
      } else {
        // Non-computed property: obj.prop += 1
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);

        if (object instanceof ClassValue) {
          const currentValue = this.accessClassStaticMember(object, memberExpr);
          const newValue = computeNewValue(currentValue);
          return this.assignClassStaticMember(object, property, newValue);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          const currentValue = this.getInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
          );
          const newValue = computeNewValue(currentValue);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            newValue,
          );
        }

        const currentValue = object[property];
        const newValue = computeNewValue(currentValue);
        object[property] = newValue;
        return newValue;
      }
    }

    throw new InterpreterError("Invalid compound assignment target");
  }

  private evaluateVariableDeclaration(node: ESTree.VariableDeclaration): any {
    const kind = node.kind as "let" | "const" | "var";

    // Check feature enablement based on declaration kind
    if ((kind === "let" || kind === "const") && !this.isFeatureEnabled("LetConst")) {
      throw new InterpreterError("LetConst is not enabled");
    }
    if (!this.isFeatureEnabled("VariableDeclarations")) {
      throw new InterpreterError("VariableDeclarations is not enabled");
    }

    this.validateVariableDeclarationKind(kind);

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      // Handle destructuring patterns
      if (declarator.id.type === "ArrayPattern" || declarator.id.type === "ObjectPattern") {
        // Destructuring declaration
        if (declarator.init === null) {
          throw new InterpreterError("Destructuring declaration must have an initializer");
        }

        const value = this.evaluateNode(declarator.init);
        this.destructurePattern(declarator.id, value, true, kind);
        lastValue = value;
        continue;
      }

      // Handle simple identifier
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError(`Unsupported declaration pattern: ${declarator.id.type}`);
      }

      const name = (declarator.id as ESTree.Identifier).name;

      // When resuming from a yield, skip variables that have already been declared
      // (their values have already been assigned from the yield expression)
      if (this.isResumingFromYield && this.environment.has(name)) {
        // The variable was already declared in the first evaluation pass.
        // The yield expression already returned the received value which was assigned.
        // Just evaluate the init (which will return the received value) but don't redeclare.
        const value = declarator.init ? this.evaluateNode(declarator.init) : undefined;
        // Use forceSet to update even const variables during yield resumption
        this.environment.forceSet(name, value);
        lastValue = value;
        continue;
      }

      const value = declarator.init ? this.evaluateNode(declarator.init) : undefined;

      this.validateConstInitializer(declarator, kind);

      this.environment.declare(name, value, kind);
      lastValue = value;
    }

    return lastValue;
  }

  private evaluateBlockStatement(node: ESTree.BlockStatement): any {
    // Create a new environment for block scope
    const previousEnvironment = this.environment;
    this.environment = new Environment(previousEnvironment);

    let result: any = undefined;

    try {
      for (const statement of node.body) {
        result = this.evaluateNode(statement);
        // If we hit a return/break/continue statement, propagate it up
        if (this.shouldPropagateControlFlow(result)) {
          return result;
        }
      }
    } finally {
      // Restore the previous environment
      this.environment = previousEnvironment;
    }

    return result;
  }

  private evaluateIfStatement(node: ESTree.IfStatement): any {
    if (!this.isFeatureEnabled("IfStatement")) {
      throw new InterpreterError("IfStatement is not enabled");
    }

    const condition = this.evaluateNode(node.test);

    if (condition) {
      return this.evaluateNode(node.consequent);
    } else if (node.alternate) {
      return this.evaluateNode(node.alternate);
    }

    return undefined;
  }

  private evaluateWhileStatement(node: ESTree.WhileStatement): any {
    if (!this.isFeatureEnabled("WhileStatement")) {
      throw new InterpreterError("WhileStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    let result: any = undefined;
    let iterations = 0;

    while (this.evaluateNode(node.test)) {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();
      this.checkLoopIterations(iterations++);

      result = this.evaluateNode(node.body);

      const controlFlow = this.handleLoopControlFlow(result, myLabel);
      if (controlFlow.shouldReturn) {
        this.currentLoopLabel = myLabel;
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    }

    this.currentLoopLabel = myLabel;
    return result;
  }

  private evaluateDoWhileStatement(node: ESTree.DoWhileStatement): any {
    if (!this.isFeatureEnabled("DoWhileStatement")) {
      throw new InterpreterError("DoWhileStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    let result: any = undefined;
    let iterations = 0;

    do {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();
      this.checkLoopIterations(iterations++);

      result = this.evaluateNode(node.body);

      const controlFlow = this.handleLoopControlFlow(result, myLabel);
      if (controlFlow.shouldReturn) {
        this.currentLoopLabel = myLabel;
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    } while (this.evaluateNode(node.test));

    this.currentLoopLabel = myLabel;
    return result;
  }

  private evaluateForStatement(node: ESTree.ForStatement): any {
    if (!this.isFeatureEnabled("ForStatement")) {
      throw new InterpreterError("ForStatement is not enabled");
    }

    // Save and clear the loop label (only labeled loops should have a label)
    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    // Create a new environment for the for loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the init expression (e.g., let i = 0)
      if (node.init) {
        this.evaluateNode(node.init);
      }

      let result: any = undefined;
      let iterations = 0;

      // Loop while test condition is true
      while (true) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        // Check test condition (e.g., i < 10)
        if (node.test) {
          const condition = this.evaluateNode(node.test);
          if (!condition) {
            break;
          }
        }

        // Execute loop body
        result = this.evaluateNode(node.body);

        // Check for return or break (before update for proper semantics)
        if (result instanceof ReturnValue) {
          return result;
        }
        if (result instanceof BreakValue) {
          // Labeled break targeting this loop's label - consume
          if (result.label !== null && result.label === myLabel) {
            return undefined;
          }
          // Labeled break targeting a different label - propagate
          if (result.label !== null) {
            return result;
          }
          // Unlabeled break - consume
          return undefined;
        }
        // Labeled continue targeting a different label - propagate
        if (result instanceof ContinueValue && result.label !== null && result.label !== myLabel) {
          return result;
        }

        // Execute update expression (e.g., i++)
        // Note: continue should execute update before next iteration
        if (node.update) {
          this.evaluateNode(node.update);
        }

        // Continue to next iteration (for ContinueValue or normal result)
      }

      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  /**
   * Evaluate for...of loop: for (let item of array) { ... }
   *
   * Key implementation details:
   * - Creates new scope for the loop
   * - For let/const declarations, creates NEW scope for EACH iteration
   *   (this allows const loop variables - each iteration gets fresh binding)
   * - For existing variables (for (x of arr)), just assigns in each iteration
   * - Supports break, continue, and return
   */
  private evaluateForOfStatement(node: ESTree.ForOfStatement): any {
    if (!this.isFeatureEnabled("ForOfStatement")) {
      throw new InterpreterError("ForOfStatement is not enabled");
    }

    if (node.await) {
      throw new InterpreterError(
        "Cannot use for await...of in synchronous evaluate(). Use evaluateAsync() instead.",
      );
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    // Create a new environment for the for...of loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable (right side)
      const iterableValue = this.evaluateNode(node.right);

      // Get an iterator from the value
      // Support: arrays, generators, and any object with [Symbol.iterator]
      let iterator: Iterator<any>;
      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue[Symbol.iterator] === "function") {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue.next === "function") {
        // Already an iterator (e.g., generator instance)
        iterator = iterableValue;
      } else {
        throw new InterpreterError(
          "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
        );
      }

      // Extract variable information
      const { variableName, pattern, isDeclaration, variableKind } = this.extractForOfVariable(
        node.left,
      );

      let result: any = undefined;
      let iterations = 0;

      // Iterate using the iterator protocol
      let iterResult = iterator.next();
      while (!iterResult.done) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        const currentValue = iterResult.value;

        if (isDeclaration) {
          // For declarations (let/const), create a NEW scope for EACH iteration
          // This is critical for two reasons:
          // 1. Allows const loop variables (each iteration gets a fresh immutable binding)
          // 2. Matches JavaScript semantics where closures capture per-iteration bindings
          //    Example: for (let i of [1,2,3]) { setTimeout(() => console.log(i)) }
          //    Each closure sees its own i, not the final value
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable(s) with the current element
          if (pattern) {
            this.destructurePattern(pattern, currentValue, true, variableKind);
          } else {
            this.environment.declare(variableName!, currentValue, variableKind!);
          }

          // Execute loop body
          result = this.evaluateNode(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables (for (x of arr)), just reassign in the current scope
          // No new scope needed since we're updating an existing variable
          if (pattern) {
            this.destructurePattern(pattern, currentValue, false);
          } else {
            this.environment.set(variableName!, currentValue);
          }

          // Execute loop body
          result = this.evaluateNode(node.body);
        }

        // Handle control flow
        if (result instanceof BreakValue) {
          // Call iterator.return() to allow cleanup (e.g., finally blocks in generators)
          if (typeof iterator.return === "function") {
            iterator.return();
          }
          // Labeled break targeting a different label - propagate
          if (result.label !== null && result.label !== myLabel) {
            return result;
          }
          return undefined;
        }
        if (result instanceof ReturnValue) {
          // Call iterator.return() to allow cleanup
          if (typeof iterator.return === "function") {
            iterator.return();
          }
          return result;
        }
        // Labeled continue targeting a different label - propagate
        if (result instanceof ContinueValue && result.label !== null && result.label !== myLabel) {
          if (typeof iterator.return === "function") {
            iterator.return();
          }
          return result;
        }
        // ContinueValue (unlabeled or targeting this loop) just continues to the next iteration

        // Get next value
        iterResult = iterator.next();
      }

      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  /**
   * Evaluate for...in statement: for (let key in obj) { ... }
   * Iterates over enumerable property names of an object
   */
  private evaluateForInStatement(node: ESTree.ForInStatement): any {
    if (!this.isFeatureEnabled("ForInStatement")) {
      throw new InterpreterError("ForInStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    // Create a new environment for the for...in loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the object (right side)
      const obj = this.evaluateNode(node.right);

      // Check if obj is an object or array
      if (obj === null || obj === undefined) {
        throw new InterpreterError("for...in requires an object or array, got null/undefined");
      }

      if (typeof obj !== "object") {
        throw new InterpreterError(`for...in requires an object or array, got ${typeof obj}`);
      }

      // Extract variable information
      const { variableName, isDeclaration, variableKind } = this.extractForInVariable(node.left);

      let result: any = undefined;
      let iterations = 0;

      // Iterate over object keys (own enumerable properties)
      // Use Object.keys to get own enumerable property names
      const keys = Object.keys(obj);

      for (const key of keys) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        if (isDeclaration) {
          // For declarations (let/const), create a NEW scope for EACH iteration
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable with the current key
          this.environment.declare(variableName, key, variableKind!);

          // Execute loop body
          result = this.evaluateNode(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign in the current scope
          this.environment.set(variableName, key);

          // Execute loop body
          result = this.evaluateNode(node.body);
        }

        // Handle control flow
        const controlFlow = this.handleLoopControlFlow(result, myLabel);
        if (controlFlow.shouldReturn) {
          return controlFlow.value;
        }
      }

      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  /**
   * Evaluate switch statement: switch (expr) { case val: ...; break; default: ...; }
   *
   * Key implementation details:
   * - Evaluates discriminant once
   * - Uses strict equality (===) for case matching
   * - Supports fall-through (no break = continue to next case)
   * - Default case can be anywhere (doesn't have to be last)
   * - Break exits the entire switch
   * - Return propagates out of switch
   */
  private evaluateSwitchStatement(node: ESTree.SwitchStatement): any {
    if (!this.isFeatureEnabled("SwitchStatement")) {
      throw new InterpreterError("SwitchStatement is not enabled");
    }

    // Evaluate the discriminant (the expression being switched on)
    const discriminant = this.evaluateNode(node.discriminant);

    let matched = false; // Track if we've matched a case (enables fall-through behavior)
    let result: any = undefined;

    // Iterate through all cases in order
    for (const switchCase of node.cases) {
      // Check if this case matches (or if we're falling through from a previous match)
      if (!matched) {
        if (switchCase.test === null) {
          // Default case - always matches (can appear anywhere, not just at the end)
          matched = true;
        } else {
          // Regular case - check if discriminant === test value (uses strict equality)
          const testValue = this.evaluateNode(switchCase.test);
          if (discriminant === testValue) {
            matched = true;
          }
        }
      }

      // If matched (either this case or falling through), execute consequent statements
      if (matched) {
        for (const statement of switchCase.consequent) {
          result = this.evaluateNode(statement);

          // If we hit a return statement, propagate it up
          if (result instanceof ReturnValue) {
            return result;
          }

          // If we hit a break statement, exit the switch immediately
          if (result instanceof BreakValue) {
            return undefined;
          }

          // Continue is not valid in switch (only in loops)
          if (result instanceof ContinueValue) {
            throw new InterpreterError("Illegal continue statement");
          }
        }
        // After executing this case's statements, continue to next case (fall-through)
        // This is JavaScript's default behavior - break is needed to prevent fall-through
      }
    }

    return result;
  }

  private evaluateFunctionDeclaration(node: ESTree.FunctionDeclaration): any {
    if (!this.isFeatureEnabled("FunctionDeclarations")) {
      throw new InterpreterError("FunctionDeclarations is not enabled");
    }

    if (node.async && !this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }
    if (node.generator) {
      if (node.async) {
        if (!this.isFeatureEnabled("AsyncGenerators")) {
          throw new InterpreterError("AsyncGenerators is not enabled");
        }
      } else if (!this.isFeatureEnabled("Generators")) {
        throw new InterpreterError("Generators is not enabled");
      }
    }

    if (!node.id) {
      throw new InterpreterError("Function declaration must have a name");
    }

    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const name = node.id.name;
    const { params, restParamIndex, defaultValues, destructuredParams } = this.parseFunctionParams(
      node.params,
    );

    if (node.body.type !== "BlockStatement") {
      throw new InterpreterError("Function body must be a block statement");
    }

    // Capture the current environment as the closure
    const func = new FunctionValue(
      params,
      node.body as ESTree.BlockStatement,
      this.environment,
      node.async || false,
      restParamIndex,
      node.generator || false,
      defaultValues,
      null,
      false,
      destructuredParams,
    );

    // Declare the function in the current environment
    this.environment.declare(name, func, "let");

    return undefined;
  }

  private evaluateFunctionExpression(node: ESTree.FunctionExpression): any {
    if (!this.isFeatureEnabled("FunctionExpressions")) {
      throw new InterpreterError("FunctionExpressions is not enabled");
    }

    if (node.async && !this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }
    if (node.generator) {
      if (node.async) {
        if (!this.isFeatureEnabled("AsyncGenerators")) {
          throw new InterpreterError("AsyncGenerators is not enabled");
        }
      } else if (!this.isFeatureEnabled("Generators")) {
        throw new InterpreterError("Generators is not enabled");
      }
    }

    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const { params, restParamIndex, defaultValues, destructuredParams } = this.parseFunctionParams(
      node.params,
    );

    if (node.body.type !== "BlockStatement") {
      throw new InterpreterError("Function body must be a block statement");
    }

    // Capture the current environment as the closure
    // Return the function value directly (no declaration)
    return new FunctionValue(
      params,
      node.body as ESTree.BlockStatement,
      this.environment,
      node.async || false,
      restParamIndex,
      node.generator || false,
      defaultValues,
      null,
      false,
      destructuredParams,
    );
  }

  private evaluateArrowFunctionExpression(node: ESTree.ArrowFunctionExpression): any {
    if (!this.isFeatureEnabled("ArrowFunctions")) {
      throw new InterpreterError("ArrowFunctions is not enabled");
    }

    if (node.async && !this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }
    if (node.generator) {
      throw new InterpreterError("Arrow functions cannot be generators");
    }

    const { params, restParamIndex, defaultValues, destructuredParams } = this.parseFunctionParams(
      node.params,
    );

    // Arrow functions can have expression body or block body
    let body: ESTree.BlockStatement;

    if (node.body.type === "BlockStatement") {
      // Block body: (x) => { return x * 2; }
      body = node.body as ESTree.BlockStatement;
    } else {
      // Expression body: (x) => x * 2
      // Wrap the expression in a block with implicit return
      body = {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: node.body,
          } as ESTree.ReturnStatement,
        ],
      } as ESTree.BlockStatement;
    }

    // Capture the current environment as the closure
    const func = new FunctionValue(
      params,
      body,
      this.environment,
      node.async || false,
      restParamIndex,
      false, // arrow functions are not generators
      defaultValues,
      null,
      false,
      destructuredParams,
    );

    return func;
  }

  private evaluateReturnStatement(node: ESTree.ReturnStatement): any {
    if (!this.isFeatureEnabled("ReturnStatement")) {
      throw new InterpreterError("ReturnStatement is not enabled");
    }

    const value = node.argument ? this.evaluateNode(node.argument) : undefined;
    return new ReturnValue(value);
  }

  private evaluateLabeledStatement(node: ESTree.LabeledStatement): any {
    const labelName = node.label.name;
    const body = node.body;

    // For labeled loops, we need to handle labeled continue by re-entering the loop
    if (this.isLoopStatement(body)) {
      return this.evaluateLabeledLoop(labelName, body);
    }

    const result = this.evaluateNode(body);
    // If break targets this label, consume it
    if (result instanceof BreakValue && result.label === labelName) {
      return undefined;
    }
    return result;
  }

  private async evaluateLabeledStatementAsync(node: ESTree.LabeledStatement): Promise<any> {
    const labelName = node.label.name;
    const body = node.body;

    // For labeled loops, we need to handle labeled continue by re-entering the loop
    if (this.isLoopStatement(body)) {
      return await this.evaluateLabeledLoopAsync(labelName, body);
    }

    const result = await this.evaluateNodeAsync(body);
    // If break targets this label, consume it
    if (result instanceof BreakValue && result.label === labelName) {
      return undefined;
    }
    return result;
  }

  private isLoopStatement(node: ESTree.Statement): boolean {
    return (
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement" ||
      node.type === "ForStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "ForInStatement"
    );
  }

  private evaluateLabeledLoop(label: string, body: ESTree.Statement): any {
    const previousLabel = this.currentLoopLabel;
    this.currentLoopLabel = label;
    try {
      const result = this.evaluateNode(body);
      if (result instanceof BreakValue && result.label === label) {
        return undefined;
      }
      return result;
    } finally {
      this.currentLoopLabel = previousLabel;
    }
  }

  private async evaluateLabeledLoopAsync(label: string, body: ESTree.Statement): Promise<any> {
    const previousLabel = this.currentLoopLabel;
    this.currentLoopLabel = label;
    try {
      const result = await this.evaluateNodeAsync(body);
      if (result instanceof BreakValue && result.label === label) {
        return undefined;
      }
      return result;
    } finally {
      this.currentLoopLabel = previousLabel;
    }
  }

  private evaluateBreakStatement(node: ESTree.BreakStatement): any {
    if (!this.isFeatureEnabled("BreakStatement")) {
      throw new InterpreterError("BreakStatement is not enabled");
    }

    return new BreakValue(node.label?.name ?? null);
  }

  private evaluateContinueStatement(node: ESTree.ContinueStatement): any {
    if (!this.isFeatureEnabled("ContinueStatement")) {
      throw new InterpreterError("ContinueStatement is not enabled");
    }

    return new ContinueValue(node.label?.name ?? null);
  }

  /**
   * Evaluate throw statement: throw expression
   * Throws an InterpreterError with the evaluated expression
   */
  private evaluateThrowStatement(node: ESTree.ThrowStatement): any {
    if (!this.isFeatureEnabled("ThrowStatement")) {
      throw new InterpreterError("ThrowStatement is not enabled");
    }

    const value = this.evaluateNode(node.argument);
    const error = new InterpreterError(`Uncaught ${String(value)}`);
    error.thrownValue = value;
    throw error;
  }

  /**
   * Evaluate try/catch/finally statement
   * Handles exception flow with proper cleanup
   */
  private evaluateTryStatement(node: ESTree.TryStatement): any {
    if (!this.isFeatureEnabled("TryCatchStatement")) {
      throw new InterpreterError("TryCatchStatement is not enabled");
    }

    let tryResult: any = undefined;
    let caughtError: any = null;
    let finallyHasOverride = false;
    let finallyOverrideValue: any = undefined;

    // Execute try block
    try {
      tryResult = this.evaluateBlockStatement(node.block);
    } catch (error) {
      caughtError = error;

      // If there's a catch clause, execute it
      if (node.handler) {
        // Create new scope for catch block
        const previousEnvironment = this.environment;
        this.environment = new Environment(previousEnvironment);

        try {
          // Bind error to catch parameter if provided
          if (node.handler.param) {
            if (node.handler.param.type === "Identifier") {
              this.environment.declare(node.handler.param.name, error, "let");
            } else if (
              node.handler.param.type === "ObjectPattern" ||
              node.handler.param.type === "ArrayPattern"
            ) {
              // Use original thrown value for destructuring
              const value =
                error instanceof InterpreterError && "thrownValue" in error
                  ? error.thrownValue
                  : error;
              this.destructurePattern(node.handler.param, value, true, "let");
            }
          }

          // Execute catch block
          tryResult = this.evaluateBlockStatement(node.handler.body);
          caughtError = null; // Error was handled
        } finally {
          // Restore environment
          this.environment = previousEnvironment;
        }
      }
    } finally {
      // Always execute finally block if present
      if (node.finalizer) {
        const finallyResult = this.evaluateBlockStatement(node.finalizer);

        // If finally block has control flow (return/break/continue), it overrides try/catch
        if (this.shouldFinallyOverride(finallyResult)) {
          finallyHasOverride = true;
          finallyOverrideValue = finallyResult;
        }
      }
    }

    if (finallyHasOverride) {
      return finallyOverrideValue;
    }

    // Re-throw if error wasn't caught
    if (caughtError !== null) {
      throw caughtError;
    }

    return tryResult;
  }

  /**
   * Destructure a pattern and assign/declare variables
   * @param pattern - ArrayPattern or ObjectPattern node
   * @param value - The value to destructure from
   * @param declare - If true, declare new variables; if false, assign to existing
   * @param kind - Variable kind for declarations ("let" or "const")
   */
  private destructurePattern(
    pattern: ESTree.ArrayPattern | ESTree.ObjectPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): void {
    if (!this.isFeatureEnabled("Destructuring")) {
      throw new InterpreterError("Destructuring is not enabled");
    }

    if (pattern.type === "ArrayPattern") {
      this.destructureArrayPattern(pattern, value, declare, kind);
    } else if (pattern.type === "ObjectPattern") {
      this.destructureObjectPattern(pattern, value, declare, kind);
    }
  }

  /**
   * Destructure array pattern: [a, b, c]
   * Handles array destructuring in variable declarations and assignments
   * Examples: let [a, b] = [1, 2], [x, [y, z]] = [1, [2, 3]]
   */
  private destructureArrayPattern(
    pattern: ESTree.ArrayPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): void {
    // Validate value is array-like
    this.validateArrayDestructuring(value);

    // Process each element in the pattern
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      if (element === null || element === undefined) {
        // Hole in array pattern: let [a, , c] = [1, 2, 3] - skip this position
        continue;
      }

      // Get the corresponding value from the array (undefined if out of bounds)
      const elementValue = i < value.length ? value[i] : undefined;

      if (element.type === "Identifier") {
        // Simple identifier: a
        this.bindDestructuredIdentifier(element.name, elementValue, declare, kind);
      } else if (element.type === "ArrayPattern" || element.type === "ObjectPattern") {
        // Nested destructuring: [a, [b, c]] or [a, {x, y}]
        // Recursively destructure the nested pattern
        this.destructurePattern(element, elementValue, declare, kind);
      } else if (element.type === "RestElement") {
        // Rest element: [...rest] - collect remaining array elements
        const restName = this.getRestElementName(element);
        // Collect all remaining elements from current position
        const remainingValues = value.slice(i);
        this.bindDestructuredIdentifier(restName, remainingValues, declare, kind);

        // Rest must be last element, so we break
        break;
      } else {
        // Must be AssignmentPattern (default value: a = 5)
        // TypeScript doesn't narrow this properly due to union type limitations
        // So we handle it as the else case with an assertion
        this.handleAssignmentPattern(
          element as unknown as ESTree.AssignmentPattern,
          elementValue,
          declare,
          kind,
        );
      }
    }
  }

  /**
   * Destructure object pattern: {x, y}
   * Handles object destructuring in variable declarations and assignments
   * Examples: let {x, y} = obj, {a: newName, b = 5} = obj
   */
  private destructureObjectPattern(
    pattern: ESTree.ObjectPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): void {
    // Validate value is an object (not null, not array)
    this.validateObjectDestructuring(value);

    // Track which keys have been destructured (needed for rest)
    const destructuredKeys = new Set<string>();
    let restElement: ESTree.RestElement | null = null;

    // First pass: Process regular properties and track keys
    for (const property of pattern.properties) {
      if (property.type === "RestElement") {
        // Save rest element for later processing (must be processed after all other properties)
        restElement = property as ESTree.RestElement;
        continue;
      }

      if (property.type === "Property") {
        // Extract the key (property name in source object)
        let key: string;
        if (property.computed) {
          // Computed property: {[expr]: value} - evaluate the expression to get the key
          const computedKey = this.evaluateNode(property.key);
          key = String(computedKey);
        } else {
          // Static property: {x} or {x: newName} - key is an identifier
          key = (property.key as ESTree.Identifier).name;
        }

        // Track this key as destructured
        destructuredKeys.add(key);

        // Get the value from the source object (undefined if property doesn't exist)
        const propValue = value[key];

        // Extract the target (where to assign/declare the variable)
        const target = property.value;

        if (target.type === "Identifier") {
          // Simple: {x} or {x: newName}
          // In {x}, both key and target are "x"
          // In {x: newName}, key is "x" but target is "newName"
          this.bindDestructuredIdentifier(target.name, propValue, declare, kind);
        } else if (target.type === "AssignmentPattern") {
          // Default value: {x = 5} - use 5 if propValue is undefined
          this.handleAssignmentPattern(target, propValue, declare, kind);
        } else if (target.type === "ArrayPattern" || target.type === "ObjectPattern") {
          // Nested destructuring: {a: {b}} or {a: [x, y]}
          // Recursively destructure the nested pattern
          this.destructurePattern(target, propValue, declare, kind);
        } else {
          throw new InterpreterError(`Unsupported object pattern value: ${target.type}`);
        }
      } else {
        const propertyType = (property as ESTree.Node).type;
        throw new InterpreterError(`Unsupported object pattern property: ${propertyType}`);
      }
    }

    // Second pass: Handle rest element if present
    if (restElement) {
      const restName = this.getRestElementName(restElement);
      const restObj: Record<string, any> = {};

      // Collect all non-destructured properties
      for (const [key, val] of Object.entries(value)) {
        if (!destructuredKeys.has(key)) {
          validatePropertyName(key); // Security: prevent prototype pollution
          restObj[key] = val;
        }
      }

      this.bindDestructuredIdentifier(restName, restObj, declare, kind);
    }
  }

  /**
   * Handle assignment pattern (default values): a = 5
   * Used in destructuring to provide default values when the source value is undefined
   * Examples: let [a = 1] = [], let {x = 5} = {}
   */
  private handleAssignmentPattern(
    pattern: ESTree.AssignmentPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): void {
    if (!this.isFeatureEnabled("DefaultParameters")) {
      throw new InterpreterError("DefaultParameters is not enabled");
    }

    // Use default value if the actual value is undefined
    // Important: only undefined triggers default, not other falsy values like null, 0, ""
    const defaultExpr = pattern.right;
    if (!defaultExpr) {
      throw new InterpreterError("Assignment pattern must have a default value");
    }
    const finalValue = value === undefined ? this.evaluateNode(defaultExpr) : value;

    const left = pattern.left;

    if (left.type === "Identifier") {
      // Simple identifier with default: a = 5
      const name = left.name;
      if (declare) {
        this.environment.declare(name, finalValue, kind!);
      } else {
        this.environment.set(name, finalValue);
      }
    } else if (left.type === "ArrayPattern" || left.type === "ObjectPattern") {
      // Nested pattern with default: [a = [1, 2]] or {x = {y: 1}}
      // Recursively destructure the nested pattern with the final value
      this.destructurePattern(left, finalValue, declare, kind);
    }
    // Note: TypeScript exhaustively checks all valid types above
    // Any other type would be a parser error from Meriyah, not a runtime case
  }

  /**
   * Evaluate function call: func(args) or obj.method(args)
   *
   * Key responsibilities:
   * 1. Detect method calls (obj.method()) vs regular calls (func())
   * 2. For method calls, bind 'this' to the object
   * 3. Handle host functions (native JS functions from globals)
   * 4. Handle sandbox functions (interpreted functions)
   * 5. Create new environment with closure + parameter bindings
   * 6. Unwrap ReturnValue if function returns
   */
  private evaluateCallExpression(node: ESTree.CallExpression): any {
    if (!this.isFeatureEnabled("CallExpression")) {
      throw new InterpreterError("CallExpression is not enabled");
    }

    // Handle super() constructor call
    if (node.callee.type === "Super") {
      if (!this.currentSuperBinding) {
        throw new InterpreterError("'super' keyword is only valid inside a class");
      }
      if (this.currentSuperBinding.isStatic) {
        throw new InterpreterError(
          "'super' constructor call is only valid inside a derived class constructor",
        );
      }
      const currentConstructor = this.constructorStack[this.constructorStack.length - 1] ?? null;
      if (!currentConstructor || currentConstructor !== this.currentSuperBinding.currentClass) {
        throw new InterpreterError(
          "'super' constructor call is only valid inside a derived class constructor",
        );
      }
      const args = this.evaluateArguments(node.arguments);
      const newThis = this.executeSuperConstructorCall(
        args,
        this.currentSuperBinding.thisValue,
        this.currentSuperBinding.currentClass,
      );
      if (newThis !== this.currentSuperBinding.thisValue) {
        this.currentSuperBinding = {
          parentClass: this.currentSuperBinding.parentClass,
          thisValue: newThis,
          currentClass: this.currentSuperBinding.currentClass,
          isStatic: this.currentSuperBinding.isStatic,
        };
        this.environment.setThis(newThis);
      }
      return newThis;
    }

    // Determine if this is a method call (obj.method()) or regular call
    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      // Method call: obj.method() - need to bind 'this'
      const memberExpr = node.callee as ESTree.MemberExpression;

      // Handle super.method() calls specially
      if (memberExpr.object.type === "Super") {
        // Get the bound super method
        callee = this.evaluateSuperMemberAccess(memberExpr);
        // super methods use the current instance as 'this'
        thisValue = this.currentSuperBinding?.thisValue;
      } else {
        thisValue = this.evaluateNode(memberExpr.object); // The object becomes 'this'
      }

      // Resolve the member value using the already-evaluated object to avoid double evaluation.
      if (memberExpr.object.type !== "Super") {
        callee = this.resolveMemberExpressionValue(memberExpr, thisValue);
      }
    } else {
      // Regular function call - no 'this' binding
      callee = this.evaluateNode(node.callee);
    }

    // Handle optional chaining short-circuit propagation from callee
    if (callee instanceof OptionalChainShortCircuit) {
      return callee;
    }

    // Handle optional call: func?.() returns undefined if func is null/undefined
    if (node.optional && (callee === null || callee === undefined)) {
      return OPTIONAL_CHAIN_SHORT_CIRCUIT;
    }

    // Handle host functions
    if (callee instanceof HostFunctionValue) {
      // Check if async host function in sync mode
      if (callee.isAsync) {
        throw new InterpreterError(
          `Cannot call async host function '${callee.name}' in synchronous evaluate(). Use evaluateAsync() instead.`,
        );
      }

      // Evaluate all arguments, handling spread
      const args = this.evaluateArguments(node.arguments);
      const wrappedArgs = callee.skipArgWrapping ? args : this.wrapArgsForHost(args, false);

      // Call the host function
      try {
        const result = callee.hostFunc(...wrappedArgs);
        return ReadOnlyProxy.wrap(result, callee.name);
      } catch (error: any) {
        // If rethrowErrors is true, propagate the error directly (used by generator.throw())
        if (callee.rethrowErrors) {
          throw error;
        }
        throw new InterpreterError(
          this.formatHostError(`Host function '${callee.name}' threw error`, error),
        );
      }
    }

    // Handle native JavaScript functions (e.g., bound class methods)
    if (typeof callee === "function") {
      const args = this.evaluateArguments(node.arguments);
      return thisValue !== undefined ? callee.call(thisValue, ...args) : callee(...args);
    }

    if (callee instanceof ClassValue) {
      throw new InterpreterError("Class constructor cannot be invoked without 'new'");
    }

    // Handle sandbox functions
    if (!(callee instanceof FunctionValue)) {
      throw new InterpreterError("Callee is not a function");
    }

    // Check if async sandbox function in sync mode
    if (callee.isAsync && !callee.isGenerator) {
      throw new InterpreterError(
        "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
      );
    }

    // Evaluate all arguments, handling spread
    const args = this.evaluateArguments(node.arguments);

    // Validate argument count
    this.validateFunctionArguments(callee, args);

    // If generator function, return a generator instance
    if (callee.isGenerator) {
      if (callee.isAsync) {
        if (!this.isFeatureEnabled("AsyncGenerators")) {
          throw new InterpreterError("AsyncGenerators is not enabled");
        }
        throw new InterpreterError(
          "Cannot call async generator in synchronous evaluate(). Use evaluateAsync() instead.",
        );
      }
      if (!this.isFeatureEnabled("Generators")) {
        throw new InterpreterError("Generators is not enabled");
      }
      return new GeneratorValue(callee, args, this, thisValue, this.isFeatureEnabled.bind(this));
    }

    // Execute the sandbox function
    return this.executeSandboxFunction(callee, args, thisValue);
  }

  private evaluateNewExpression(node: ESTree.NewExpression): any {
    if (!this.isFeatureEnabled("NewExpression")) {
      throw new InterpreterError("NewExpression is not enabled");
    }

    // 1. Evaluate constructor
    const constructor = this.evaluateNode(node.callee);

    // 2. Validate constructor is callable
    this.validateConstructor(constructor);

    // 3. Handle ClassValue - use instantiateClass
    if (constructor instanceof ClassValue) {
      return this.instantiateClass(constructor, node.arguments as ESTree.Expression[]);
    }

    // 4. Create new instance object
    const instance: Record<string, any> = {};

    // 5. Evaluate arguments
    const args = this.evaluateArguments(node.arguments);

    // 6. Call constructor based on type
    let result: any;

    if (constructor instanceof HostFunctionValue) {
      // Host function constructor
      const wrappedArgs = this.wrapArgsForHost(args, false);
      result = this.executeHostConstructor(constructor, wrappedArgs);
    } else {
      // Sandbox function constructor
      const callee = constructor as FunctionValue;

      // Validate argument count
      this.validateFunctionArguments(callee, args);

      // Execute with instance as 'this'
      result = this.executeSandboxFunction(callee, args, instance);
    }

    // 7. Return object or constructor's returned object
    return this.resolveConstructorReturn(result, instance);
  }

  private evaluateMemberExpression(node: ESTree.MemberExpression): any {
    if (!this.isFeatureEnabled("MemberExpression")) {
      throw new InterpreterError("MemberExpression is not enabled");
    }

    // Handle super.method() or super.property access
    if (node.object.type === "Super") {
      return this.evaluateSuperMemberAccess(node);
    }

    const object = this.evaluateNode(node.object);
    return this.resolveMemberExpressionValue(node, object);
  }

  private resolveMemberExpressionValue(node: ESTree.MemberExpression, object: any): any {
    // Preserve optional chaining short-circuit semantics.
    if (object instanceof OptionalChainShortCircuit) {
      return object;
    }
    if (node.optional && (object === null || object === undefined)) {
      return OPTIONAL_CHAIN_SHORT_CIRCUIT;
    }

    // Block property access on host functions
    this.validateMemberAccess(object);

    // Handle private field access (must check before ClassValue handling)
    if (node.property.type === "PrivateIdentifier") {
      if (!this.isFeatureEnabled("PrivateFields")) {
        throw new InterpreterError("PrivateFields is not enabled");
      }
      return this.accessPrivateField(object, (node.property as ESTree.PrivateIdentifier).name);
    }

    // Handle static member access on classes
    if (object instanceof ClassValue) {
      return this.accessClassStaticMember(object, node);
    }

    const instanceClass = this.getInstanceClass(object);
    if (instanceClass) {
      if (node.computed) {
        const property = this.evaluateNode(node.property);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          throw new InterpreterError("Symbol properties are not supported");
        }
        const propName = String(property);
        validatePropertyName(propName);
        return this.getInstanceProperty(object as Record<string, any>, instanceClass, propName);
      }

      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      if (
        !this.shouldSkipPropertyValidation(object) ||
        this.shouldForcePropertyValidation(property)
      ) {
        validatePropertyName(property);
      }
      return this.getInstanceProperty(object as Record<string, any>, instanceClass, property);
    }

    if (node.computed) {
      // obj[expr] - computed property access (array indexing or object bracket notation)
      const property = this.evaluateNode(node.property);
      if (typeof property === "symbol") {
        this.validateSymbolProperty(property);
        if (typeof object === "object" && object !== null) {
          return this.accessObjectProperty(object, property);
        }
        throw new InterpreterError("Computed property access requires an array or object");
      }

      // Handle Symbol constructor - allow access to static properties
      if (object === Symbol) {
        return (Symbol as any)[property];
      }

      // Handle HostFunctionValue computed access - block internal/meta properties
      if (object instanceof HostFunctionValue) {
        const propName = String(property);
        if (
          propName === "hostFunc" ||
          propName === "isAsync" ||
          propName === "rethrowErrors" ||
          propName === "name" ||
          propName === "length"
        ) {
          throw new InterpreterError("Cannot access properties on host functions");
        }
        // Let the HostFunctionValue proxy handle the access
        return (object as any)[propName];
      }

      // Handle array indexing
      if (Array.isArray(object)) {
        return this.accessArrayElement(object, property);
      }

      // Handle object computed property access: obj["key"]
      if (typeof object === "object" && object !== null) {
        return this.accessObjectProperty(object, property);
      }

      throw new InterpreterError("Computed property access requires an array or object");
    } else {
      // obj.prop - direct property access
      // Note: PrivateIdentifier is handled earlier in the function
      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      if (
        !this.shouldSkipPropertyValidation(object) ||
        this.shouldForcePropertyValidation(property)
      ) {
        validatePropertyName(property); // Security: prevent prototype pollution
      }

      if (object instanceof FunctionValue) {
        throw new InterpreterError("Cannot access properties on functions");
      }

      // Handle Symbol constructor - allow access to static properties (Symbol.iterator, etc.)
      if (object === Symbol) {
        return (Symbol as any)[property];
      }

      // Handle globalThis/global sentinel - return the sentinel's internal object
      if (object instanceof GlobalThisSentinel) {
        return (object as any)[property];
      }

      // Handle HostFunctionValue - allow static method access but block internal/meta properties
      if (object instanceof HostFunctionValue) {
        // Block access to internal properties and function metadata
        if (
          property === "hostFunc" ||
          property === "isAsync" ||
          property === "rethrowErrors" ||
          property === "name" ||
          property === "length"
        ) {
          throw new InterpreterError("Cannot access properties on host functions");
        }
        // Let the HostFunctionValue proxy handle the access (for static methods)
        return (object as any)[property];
      }

      // Handle .length for strings and arrays
      const length = this.getLengthProperty(object, property);
      if (length !== null) {
        return length;
      }

      // Handle generator methods (next, return, throw)
      if (object instanceof GeneratorValue) {
        const method = this.getGeneratorMethod(object, property);
        if (method) {
          return method;
        }
        throw new InterpreterError(`Generator method '${property}' not supported`);
      }

      // Handle async generator methods
      if (object instanceof AsyncGeneratorValue) {
        const method = this.getAsyncGeneratorMethod(object, property);
        if (method) {
          return method;
        }
        throw new InterpreterError(`Async generator method '${property}' not supported`);
      }

      // Handle array methods
      if (Array.isArray(object)) {
        const arrayMethod = this.getArrayMethod(object, property);
        if (arrayMethod) {
          return arrayMethod;
        }
        // Allow access to own properties on arrays (e.g., tagged template strings.raw)
        if (Object.prototype.hasOwnProperty.call(object, property)) {
          return (object as any)[property];
        }
        // Delegate to native array method if safe
        const nativeMethod = this.getNativeMethod(object, property);
        if (nativeMethod !== undefined) {
          return nativeMethod;
        }
        throw new InterpreterError(`Array property '${property}' not supported`);
      }

      // Handle string methods
      if (typeof object === "string") {
        const stringMethod = this.getStringMethod(object, property);
        if (stringMethod) {
          return stringMethod;
        }
        // Delegate to native string method if safe
        const nativeMethod = this.getNativeMethod(object, property);
        if (nativeMethod !== undefined) {
          return nativeMethod;
        }
        throw new InterpreterError(`String property '${property}' not supported`);
      }

      // Handle object property access
      if (typeof object === "object" && object !== null && !Array.isArray(object)) {
        this.ensureNoPrototypeAccess(object, property);
        return object[property];
      }

      throw new InterpreterError(`Property '${property}' not supported`);
    }
  }

  /**
   * Get an array method as a HostFunctionValue
   * Returns null if the method is not supported
   */
  private getArrayMethod(arr: any[], methodName: string): HostFunctionValue | null {
    // Cache per array instance to avoid re-allocating HostFunctionValue wrappers.
    let cache = this.arrayMethodCache.get(arr);
    if (!cache) {
      cache = new Map();
      this.arrayMethodCache.set(arr, cache);
    }

    const cached = cache.get(methodName);
    if (cached) {
      return cached;
    }

    const method = this.buildArrayMethod(arr, methodName);
    if (method) {
      cache.set(methodName, method);
    }
    return method;
  }

  private getGeneratorMethod(
    generator: GeneratorValue,
    methodName: string,
  ): HostFunctionValue | null {
    let cache = this.generatorMethodCache.get(generator);
    if (!cache) {
      cache = new Map();
      this.generatorMethodCache.set(generator, cache);
    }

    const cached = cache.get(methodName);
    if (cached) {
      return cached;
    }

    const method = this.buildGeneratorMethod(generator, methodName);
    if (method) {
      cache.set(methodName, method);
    }
    return method;
  }

  private buildGeneratorMethod(
    generator: GeneratorValue,
    methodName: string,
  ): HostFunctionValue | null {
    switch (methodName) {
      case "next":
        return new HostFunctionValue(generator.next.bind(generator), "next", false);
      case "return":
        return new HostFunctionValue(generator.return.bind(generator), "return", false);
      case "throw":
        // rethrowErrors: true - errors from throw() should propagate directly
        return new HostFunctionValue(generator.throw.bind(generator), "throw", false, true);
      default:
        return null;
    }
  }

  private getAsyncGeneratorMethod(
    generator: AsyncGeneratorValue,
    methodName: string,
  ): HostFunctionValue | null {
    let cache = this.asyncGeneratorMethodCache.get(generator);
    if (!cache) {
      cache = new Map();
      this.asyncGeneratorMethodCache.set(generator, cache);
    }

    const cached = cache.get(methodName);
    if (cached) {
      return cached;
    }

    const method = this.buildAsyncGeneratorMethod(generator, methodName);
    if (method) {
      cache.set(methodName, method);
    }
    return method;
  }

  private buildAsyncGeneratorMethod(
    generator: AsyncGeneratorValue,
    methodName: string,
  ): HostFunctionValue | null {
    switch (methodName) {
      case "next":
        return new HostFunctionValue(generator.next.bind(generator), "next", true);
      case "return":
        return new HostFunctionValue(generator.return.bind(generator), "return", true);
      case "throw":
        // rethrowErrors: true - errors from throw() should propagate directly
        return new HostFunctionValue(generator.throw.bind(generator), "throw", true, true);
      default:
        return null;
    }
  }

  private buildArrayMethod(arr: any[], methodName: string): HostFunctionValue | null {
    switch (methodName) {
      // Mutation methods
      case "push":
        return new HostFunctionValue(
          (...items: any[]) => {
            arr.push(...items);
            return arr.length;
          },
          "push",
          false,
        );

      case "pop":
        return new HostFunctionValue(() => arr.pop(), "pop", false);

      case "shift":
        return new HostFunctionValue(() => arr.shift(), "shift", false);

      case "unshift":
        return new HostFunctionValue(
          (...items: any[]) => {
            arr.unshift(...items);
            return arr.length;
          },
          "unshift",
          false,
        );

      // Non-mutation methods
      case "slice":
        return new HostFunctionValue(
          (start?: number, end?: number) => arr.slice(start, end),
          "slice",
          false,
        );

      case "concat":
        return new HostFunctionValue((...items: any[]) => arr.concat(...items), "concat", false);

      case "indexOf":
        return new HostFunctionValue(
          (searchElement: any, fromIndex?: number) => arr.indexOf(searchElement, fromIndex),
          "indexOf",
          false,
        );

      case "includes":
        return new HostFunctionValue(
          (searchElement: any, fromIndex?: number) => arr.includes(searchElement, fromIndex),
          "includes",
          false,
        );

      case "join":
        return new HostFunctionValue((separator?: string) => arr.join(separator), "join", false);

      case "reverse":
        return new HostFunctionValue(() => arr.reverse(), "reverse", false);

      // Higher-order methods - these need special handling to evaluate sandbox functions
      case "map":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            const result: any[] = [];
            for (let i = 0; i < arr.length; i++) {
              // Call the callback with (element, index, array)
              const value = this.callCallback(callback, undefined, [arr[i], i, arr]);
              result.push(value);
            }
            return result;
          },
          "map",
          false,
          false,
          true, // skipArgWrapping - we handle FunctionValue callbacks directly
        );

      case "filter":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            const result: any[] = [];
            for (let i = 0; i < arr.length; i++) {
              const shouldInclude = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (shouldInclude) {
                result.push(arr[i]);
              }
            }
            return result;
          },
          "filter",
          false,
          false,
          true, // skipArgWrapping
        );

      case "reduce":
        return new HostFunctionValue(
          (callback: FunctionValue | Function, initialValue?: any) => {
            let accumulator = initialValue;
            let startIndex = 0;

            // If no initial value, use first element as accumulator
            if (initialValue === undefined) {
              if (arr.length === 0) {
                throw new InterpreterError("Reduce of empty array with no initial value");
              }
              accumulator = arr[0];
              startIndex = 1;
            }

            for (let i = startIndex; i < arr.length; i++) {
              accumulator = this.callCallback(callback, undefined, [accumulator, arr[i], i, arr]);
            }
            return accumulator;
          },
          "reduce",
          false,
          false,
          true, // skipArgWrapping
        );

      case "find":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = 0; i < arr.length; i++) {
              const matches = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (matches) {
                return arr[i];
              }
            }
            return undefined;
          },
          "find",
          false,
          false,
          true, // skipArgWrapping
        );

      case "findIndex":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = 0; i < arr.length; i++) {
              const matches = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (matches) {
                return i;
              }
            }
            return -1;
          },
          "findIndex",
          false,
          false,
          true, // skipArgWrapping
        );

      case "every":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = 0; i < arr.length; i++) {
              const result = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (!result) {
                return false;
              }
            }
            return true;
          },
          "every",
          false,
          false,
          true, // skipArgWrapping
        );

      case "some":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = 0; i < arr.length; i++) {
              const result = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (result) {
                return true;
              }
            }
            return false;
          },
          "some",
          false,
          false,
          true, // skipArgWrapping
        );

      case "forEach":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = 0; i < arr.length; i++) {
              this.callCallback(callback, undefined, [arr[i], i, arr]);
            }
            return undefined;
          },
          "forEach",
          false,
          false,
          true, // skipArgWrapping
        );

      case "sort":
        return new HostFunctionValue(
          (compareFn?: FunctionValue | Function) => {
            if (compareFn) {
              arr.sort((a: any, b: any) => this.callCallback(compareFn, undefined, [a, b]));
            } else {
              // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- intentional: match JS default sort behavior
              arr.sort();
            }
            return arr;
          },
          "sort",
          false,
          false,
          true, // skipArgWrapping
        );

      case "flat":
        return new HostFunctionValue((depth?: number) => arr.flat(depth), "flat", false);

      case "flatMap":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            const result: any[] = [];
            for (let i = 0; i < arr.length; i++) {
              const mapped = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (Array.isArray(mapped)) {
                result.push(...mapped);
              } else {
                result.push(mapped);
              }
            }
            return result;
          },
          "flatMap",
          false,
          false,
          true, // skipArgWrapping
        );

      case "at":
        return new HostFunctionValue((index: number) => arr.at(index), "at", false);

      case "findLast":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = arr.length - 1; i >= 0; i--) {
              const matches = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (matches) {
                return arr[i];
              }
            }
            return undefined;
          },
          "findLast",
          false,
          false,
          true, // skipArgWrapping
        );

      case "findLastIndex":
        return new HostFunctionValue(
          (callback: FunctionValue | Function) => {
            for (let i = arr.length - 1; i >= 0; i--) {
              const matches = this.callCallback(callback, undefined, [arr[i], i, arr]);
              if (matches) {
                return i;
              }
            }
            return -1;
          },
          "findLastIndex",
          false,
          false,
          true, // skipArgWrapping
        );

      case "reduceRight":
        return new HostFunctionValue(
          (callback: FunctionValue | Function, initialValue?: any) => {
            let accumulator = initialValue;
            let startIndex = arr.length - 1;

            if (initialValue === undefined) {
              if (arr.length === 0) {
                throw new InterpreterError("Reduce of empty array with no initial value");
              }
              accumulator = arr[arr.length - 1];
              startIndex = arr.length - 2;
            }

            for (let i = startIndex; i >= 0; i--) {
              accumulator = this.callCallback(callback, undefined, [accumulator, arr[i], i, arr]);
            }
            return accumulator;
          },
          "reduceRight",
          false,
          false,
          true, // skipArgWrapping
        );

      case "splice":
        return new HostFunctionValue(
          (start: number, deleteCount?: number, ...items: any[]) => {
            if (deleteCount === undefined) {
              return arr.splice(start);
            }
            return arr.splice(start, deleteCount, ...items);
          },
          "splice",
          false,
        );

      case "fill":
        return new HostFunctionValue(
          (value: any, start?: number, end?: number) => {
            arr.fill(value, start, end);
            return arr;
          },
          "fill",
          false,
        );

      case "lastIndexOf":
        return new HostFunctionValue(
          (searchElement: any, fromIndex?: number) =>
            fromIndex !== undefined
              ? arr.lastIndexOf(searchElement, fromIndex)
              : arr.lastIndexOf(searchElement),
          "lastIndexOf",
          false,
        );

      default:
        return null;
    }
  }

  /**
   * Get a string method as a HostFunctionValue
   * Returns null if the method is not supported
   */
  private getStringMethod(str: string, methodName: string): HostFunctionValue | null {
    switch (methodName) {
      // Extraction methods
      case "substring":
        return new HostFunctionValue(
          (start: number, end?: number) => {
            return str.substring(start, end);
          },
          "substring",
          false,
        );

      case "slice":
        return new HostFunctionValue(
          (start: number, end?: number) => {
            return str.slice(start, end);
          },
          "slice",
          false,
        );

      case "charAt":
        return new HostFunctionValue(
          (index: number) => {
            return str.charAt(index);
          },
          "charAt",
          false,
        );

      // Search methods
      case "indexOf":
        return new HostFunctionValue(
          (searchString: string, position?: number) => {
            return str.indexOf(searchString, position);
          },
          "indexOf",
          false,
        );

      case "lastIndexOf":
        return new HostFunctionValue(
          (searchString: string, position?: number) => {
            return str.lastIndexOf(searchString, position);
          },
          "lastIndexOf",
          false,
        );

      case "includes":
        return new HostFunctionValue(
          (searchString: string, position?: number) => {
            return str.includes(searchString, position);
          },
          "includes",
          false,
        );

      // Matching methods
      case "startsWith":
        return new HostFunctionValue(
          (searchString: string, position?: number) => {
            return str.startsWith(searchString, position);
          },
          "startsWith",
          false,
        );

      case "endsWith":
        return new HostFunctionValue(
          (searchString: string, length?: number) => {
            return str.endsWith(searchString, length);
          },
          "endsWith",
          false,
        );

      // Case methods
      case "toUpperCase":
        return new HostFunctionValue(
          () => {
            return str.toUpperCase();
          },
          "toUpperCase",
          false,
        );

      case "toLowerCase":
        return new HostFunctionValue(
          () => {
            return str.toLowerCase();
          },
          "toLowerCase",
          false,
        );

      // Trimming methods
      case "trim":
        return new HostFunctionValue(
          () => {
            return str.trim();
          },
          "trim",
          false,
        );

      case "trimStart":
      case "trimLeft":
        return new HostFunctionValue(
          () => {
            return str.trimStart();
          },
          "trimStart",
          false,
        );

      case "trimEnd":
      case "trimRight":
        return new HostFunctionValue(
          () => {
            return str.trimEnd();
          },
          "trimEnd",
          false,
        );

      // Transformation methods
      case "split":
        return new HostFunctionValue(
          (separator?: string | null, limit?: number) => {
            if (separator === null || separator === undefined) {
              return [str];
            }
            return str.split(separator, limit);
          },
          "split",
          false,
        );

      case "replace":
        return new HostFunctionValue(
          (searchValue: string, replaceValue: string) => {
            return str.replace(searchValue, replaceValue);
          },
          "replace",
          false,
        );

      case "repeat":
        return new HostFunctionValue(
          (count: number) => {
            return str.repeat(count);
          },
          "repeat",
          false,
        );

      // Padding methods
      case "padStart":
        return new HostFunctionValue(
          (targetLength: number, padString?: string) => {
            return str.padStart(targetLength, padString);
          },
          "padStart",
          false,
        );

      case "padEnd":
        return new HostFunctionValue(
          (targetLength: number, padString?: string) => {
            return str.padEnd(targetLength, padString);
          },
          "padEnd",
          false,
        );

      default:
        return null;
    }
  }

  /**
   * Delegate to a native method on an object (array or string) if the property
   * is safe. Returns undefined if the property is dangerous or doesn't exist.
   * For function properties, wraps them as HostFunctionValue.
   */
  private getNativeMethod(object: any, property: string): any {
    if (isDangerousProperty(property)) {
      return undefined;
    }
    const value = (object as any)[property];
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === "function") {
      return new HostFunctionValue((...args: any[]) => value.apply(object, args), property, false);
    }
    return value;
  }

  private callCallback(callback: FunctionValue | Function, thisValue: any, args: any[]): any {
    if (callback instanceof FunctionValue) {
      return this.callSandboxFunction(callback, thisValue, args);
    }
    if (typeof callback === "function") {
      return callback.apply(thisValue, args);
    }
    throw new InterpreterError("Callback must be a function");
  }

  /**
   * Helper to call a sandbox function (used by array methods)
   */
  private callSandboxFunction(func: FunctionValue, thisValue: any, args: any[]): any {
    // Save and restore environment
    const previousEnvironment = this.environment;
    this.environment = new Environment(func.closure, thisValue, true);

    try {
      // Bind parameters
      for (let i = 0; i < func.params.length && i < args.length; i++) {
        if (func.destructuredParams.has(i)) {
          const pattern = func.destructuredParams.get(i)!;
          this.destructurePattern(pattern, args[i], true, "let");
        } else {
          this.environment.declare(func.params[i]!, args[i], "let");
        }
      }

      // Execute function body
      const result = this.evaluateNode(func.body);

      // Unwrap return value
      if (result instanceof ReturnValue) {
        return result.value;
      }

      return undefined;
    } finally {
      this.environment = previousEnvironment;
    }
  }

  private evaluateArrayExpression(node: ESTree.ArrayExpression): any {
    if (!this.isFeatureEnabled("ArrayLiterals")) {
      throw new InterpreterError("ArrayLiterals is not enabled");
    }

    const elements: any[] = [];

    for (const element of node.elements) {
      if (element === null) {
        // Sparse array element (e.g., [1, , 3])
        elements.push(undefined);
      } else if (element.type === "SpreadElement") {
        // Spread element: [...arr] - expand array into individual elements
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = this.evaluateNode((element as ESTree.SpreadElement).argument);
        const spreadArray = this.validateArraySpread(spreadValue);
        elements.push(...spreadArray);
      } else {
        elements.push(this.evaluateNode(element));
      }
    }

    // Track memory: estimate 16 bytes per array element
    this.trackMemory(elements.length * 16);

    return elements;
  }

  private evaluateObjectExpression(node: ESTree.ObjectExpression): any {
    if (!this.isFeatureEnabled("ObjectLiterals")) {
      throw new InterpreterError("ObjectLiterals is not enabled");
    }

    const obj: Record<string, any> = {};

    for (const property of node.properties) {
      if (property.type === "SpreadElement") {
        // Spread element: {...obj} - expand object properties
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = this.evaluateNode((property as ESTree.SpreadElement).argument);
        this.validateObjectSpread(spreadValue);

        // Merge properties from spread object
        for (const [key, value] of Object.entries(spreadValue)) {
          validatePropertyName(key); // Security: prevent prototype pollution
          obj[key] = value;
        }
      } else if (property.type === "Property") {
        // Get the property key - evaluate expression for computed properties
        const computedKey = property.computed ? this.evaluateNode(property.key) : null;
        const key =
          computedKey !== null
            ? typeof computedKey === "symbol"
              ? computedKey
              : String(computedKey)
            : this.extractPropertyKey(property.key);

        // Validate string keys for prototype pollution, skip for symbols
        if (typeof key === "string") {
          validatePropertyName(key);
        }

        if (property.kind === "get" || property.kind === "set") {
          // Getter/setter property
          const funcValue = this.evaluateNode(property.value) as FunctionValue;
          const descriptor = Object.getOwnPropertyDescriptor(obj, key) || {
            configurable: true,
            enumerable: true,
          };
          if (property.kind === "get") {
            descriptor.get = () => this.executeSandboxFunction(funcValue, [], obj);
          } else {
            descriptor.set = (v: any) => this.executeSandboxFunction(funcValue, [v], obj);
          }
          Object.defineProperty(obj, key, descriptor);
        } else {
          // Regular property or method shorthand
          const value = this.evaluateNode(property.value);
          (obj as any)[key] = value;
        }
      } else {
        const propertyType = (property as ESTree.Node).type;
        throw new InterpreterError(`Unsupported object property type: ${propertyType}`);
      }
    }

    // Track memory: estimate 64 bytes base + 32 bytes per property
    const propertyCount = Object.keys(obj).length;
    this.trackMemory(64 + propertyCount * 32);

    return obj;
  }

  /**
   * Evaluate template literal: `hello ${name}`
   *
   * Template literals consist of:
   * - quasis: Array of TemplateElement (static text parts)
   * - expressions: Array of expressions to interpolate
   *
   * Pattern: quasi[0] ${expr[0]} quasi[1] ${expr[1]} ... quasi[n]
   * Example: `Hello ${name}!` = ["Hello ", "!"] + [name]
   * Note: quasis.length is always expressions.length + 1
   */
  private evaluateTemplateLiteral(node: ESTree.TemplateLiteral): string {
    if (!this.isFeatureEnabled("TemplateLiterals")) {
      throw new InterpreterError("TemplateLiterals is not enabled");
    }

    // Evaluate all expressions
    const expressionValues: any[] = [];
    for (const expr of node.expressions) {
      if (!expr) {
        throw new InterpreterError("Template literal missing expression");
      }
      expressionValues.push(this.evaluateNode(expr));
    }

    // Build the final string using shared logic
    return this.buildTemplateLiteralString(node.quasis, expressionValues);
  }

  private evaluateTaggedTemplateExpression(node: ESTree.TaggedTemplateExpression): any {
    if (!this.isFeatureEnabled("TemplateLiterals")) {
      throw new InterpreterError("TemplateLiterals is not enabled");
    }

    const tag = this.evaluateNode(node.tag);

    // Build the strings array with cooked values
    const strings: string[] = node.quasi.quasis.map((q) => q.value.cooked);
    // Attach the raw property (frozen array of raw strings)
    const raw: string[] = node.quasi.quasis.map((q) => q.value.raw);
    Object.freeze(raw);
    Object.defineProperty(strings, "raw", {
      value: raw,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.freeze(strings);

    // Evaluate expressions
    const values: any[] = [];
    for (const expr of node.quasi.expressions) {
      values.push(this.evaluateNode(expr));
    }

    // Call the tag function
    const args = [strings, ...values];
    if (tag instanceof FunctionValue) {
      return this.executeSandboxFunction(tag, args, undefined);
    }
    if (tag instanceof HostFunctionValue) {
      return tag.hostFunc(...args);
    }
    if (typeof tag === "function") {
      return tag(...args);
    }
    throw new InterpreterError("Tag expression is not a function");
  }

  private evaluateSequenceExpression(node: ESTree.SequenceExpression): any {
    let result: any;
    for (const expr of node.expressions) {
      result = this.evaluateNode(expr);
    }
    return result;
  }

  /**
   * Evaluate optional chaining expression (obj?.prop, obj?.[key], func?.())
   * The chain expression wraps member/call expressions that may have optional access.
   * If any optional access encounters null/undefined, the entire chain returns undefined.
   */
  private evaluateChainExpression(node: ESTree.ChainExpression): any {
    if (!this.isFeatureEnabled("OptionalChaining")) {
      throw new InterpreterError("OptionalChaining is not enabled");
    }

    const result = this.evaluateNode(node.expression);

    // If we got a short-circuit marker, the chain should return undefined
    if (result instanceof OptionalChainShortCircuit) {
      return undefined;
    }

    return result;
  }

  // ============================================================================
  // ASYNC EVALUATION METHODS
  // ============================================================================

  private async evaluateProgramAsync(node: ESTree.Program): Promise<any> {
    if (node.body.length === 0) {
      return undefined;
    }

    let result: any;
    for (const statement of node.body) {
      result = await this.evaluateNodeAsync(statement);
    }

    return result;
  }

  private async evaluateBinaryExpressionAsync(node: ESTree.BinaryExpression): Promise<any> {
    if (!this.isFeatureEnabled("BinaryOperators")) {
      throw new InterpreterError("BinaryOperators is not enabled");
    }

    const left = await this.evaluateNodeAsync(node.left);
    if (left instanceof YieldValue) return left;
    const right = await this.evaluateNodeAsync(node.right);
    if (right instanceof YieldValue) return right;
    return this.applyBinaryOperator(node.operator, left, right);
  }

  private async evaluateUnaryExpressionAsync(node: ESTree.UnaryExpression): Promise<any> {
    if (!this.isFeatureEnabled("UnaryOperators")) {
      throw new InterpreterError("UnaryOperators is not enabled");
    }

    // Special case: typeof should not throw for undefined variables
    if (node.operator === "typeof") {
      return this.evaluateTypeofAsync(node.argument);
    }

    // Special case: delete operates on references, not values
    if (node.operator === "delete") {
      return this.evaluateDelete(node.argument);
    }

    // For other unary operators, evaluate normally
    const argument = await this.evaluateNodeAsync(node.argument);
    return this.applyUnaryOperator(node.operator, argument);
  }

  /**
   * Evaluate typeof operator, handling undefined variables gracefully.
   * Shared between sync and async paths via handleTypeof helper.
   */
  private async evaluateTypeofAsync(argument: ESTree.Expression): Promise<string> {
    try {
      const value = await this.evaluateNodeAsync(argument);
      return this.getTypeofValue(value);
    } catch (error) {
      if (error instanceof InterpreterError && error.message.includes("Undefined variable")) {
        return "undefined";
      }
      throw error;
    }
  }

  private async evaluateLogicalExpressionAsync(node: ESTree.LogicalExpression): Promise<any> {
    if (!this.isFeatureEnabled("LogicalOperators")) {
      throw new InterpreterError("LogicalOperators is not enabled");
    }

    const left = await this.evaluateNodeAsync(node.left);
    if (left instanceof YieldValue) return left;

    switch (node.operator) {
      case "&&":
        if (!left) return left;
        return await this.evaluateNodeAsync(node.right);
      case "||":
        if (left) return left;
        return await this.evaluateNodeAsync(node.right);
      case "??":
        // Nullish coalescing: return right only if left is null or undefined
        if (left !== null && left !== undefined) return left;
        return await this.evaluateNodeAsync(node.right);
      default:
        throw new InterpreterError(`Unsupported logical operator: ${node.operator}`);
    }
  }

  private async evaluateConditionalExpressionAsync(
    node: ESTree.ConditionalExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("ConditionalExpression")) {
      throw new InterpreterError("ConditionalExpression is not enabled");
    }

    // Evaluate the test condition
    const testValue = await this.evaluateNodeAsync(node.test);
    if (testValue instanceof YieldValue) return testValue;

    // Return consequent if truthy, alternate if falsy
    if (testValue) {
      return await this.evaluateNodeAsync(node.consequent);
    } else {
      return await this.evaluateNodeAsync(node.alternate);
    }
  }

  private async evaluateCallExpressionAsync(node: ESTree.CallExpression): Promise<any> {
    if (!this.isFeatureEnabled("CallExpression")) {
      throw new InterpreterError("CallExpression is not enabled");
    }

    // Handle super() constructor call
    if (node.callee.type === "Super") {
      if (!this.currentSuperBinding) {
        throw new InterpreterError("'super' keyword is only valid inside a class");
      }
      if (this.currentSuperBinding.isStatic) {
        throw new InterpreterError(
          "'super' constructor call is only valid inside a derived class constructor",
        );
      }
      const currentConstructor = this.constructorStack[this.constructorStack.length - 1] ?? null;
      if (!currentConstructor || currentConstructor !== this.currentSuperBinding.currentClass) {
        throw new InterpreterError(
          "'super' constructor call is only valid inside a derived class constructor",
        );
      }
      const args = await this.evaluateArgumentsAsync(node.arguments);
      const newThis = await this.executeSuperConstructorCallAsync(
        args,
        this.currentSuperBinding.thisValue,
        this.currentSuperBinding.currentClass,
      );
      if (newThis !== this.currentSuperBinding.thisValue) {
        this.currentSuperBinding = {
          parentClass: this.currentSuperBinding.parentClass,
          thisValue: newThis,
          currentClass: this.currentSuperBinding.currentClass,
          isStatic: this.currentSuperBinding.isStatic,
        };
        this.environment.setThis(newThis);
      }
      return newThis;
    }

    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      const memberExpr = node.callee as ESTree.MemberExpression;

      // Handle super.method() calls specially
      if (memberExpr.object.type === "Super") {
        // Get the bound super method
        callee = this.evaluateSuperMemberAccess(memberExpr);
        // super methods use the current instance as 'this'
        thisValue = this.currentSuperBinding?.thisValue;
      } else {
        thisValue = await this.evaluateNodeAsync(memberExpr.object);
      }

      // Resolve the member value using the already-evaluated object to avoid double evaluation.
      if (memberExpr.object.type !== "Super") {
        callee = await this.resolveMemberExpressionValueAsync(memberExpr, thisValue);
      }
    } else {
      callee = await this.evaluateNodeAsync(node.callee);
    }

    // Handle optional chaining short-circuit propagation from callee
    if (callee instanceof OptionalChainShortCircuit) {
      return callee;
    }

    // Handle optional call: func?.() returns undefined if func is null/undefined
    if (node.optional && (callee === null || callee === undefined)) {
      return OPTIONAL_CHAIN_SHORT_CIRCUIT;
    }

    // Handle host functions (sync and async)
    if (callee instanceof HostFunctionValue) {
      const args = await this.evaluateArgumentsAsync(node.arguments);
      const wrappedArgs = callee.skipArgWrapping ? args : this.wrapArgsForHost(args, true);

      try {
        const result = callee.hostFunc(...wrappedArgs);
        // If async host function, await the promise
        if (callee.isAsync) {
          const resolved = await result;
          return ReadOnlyProxy.wrap(resolved, callee.name);
        }
        return ReadOnlyProxy.wrap(result, callee.name);
      } catch (error: any) {
        // If rethrowErrors is true, propagate the error directly (used by generator.throw())
        if (callee.rethrowErrors) {
          throw error;
        }
        throw new InterpreterError(
          this.formatHostError(`Host function '${callee.name}' threw error`, error),
        );
      }
    }

    // Handle native JavaScript functions (e.g., bound class methods)
    if (typeof callee === "function") {
      const args = await this.evaluateArgumentsAsync(node.arguments);
      return thisValue !== undefined
        ? await callee.call(thisValue, ...args)
        : await callee(...args);
    }

    if (callee instanceof ClassValue) {
      throw new InterpreterError("Class constructor cannot be invoked without 'new'");
    }

    // Handle sandbox functions
    if (!(callee instanceof FunctionValue)) {
      throw new InterpreterError("Callee is not a function");
    }

    const args = await this.evaluateArgumentsAsync(node.arguments);

    // Validate argument count
    this.validateFunctionArguments(callee, args);

    // If generator function, return a generator instance
    if (callee.isGenerator) {
      if (callee.isAsync) {
        if (!this.isFeatureEnabled("AsyncGenerators")) {
          throw new InterpreterError("AsyncGenerators is not enabled");
        }
        return new AsyncGeneratorValue(
          callee,
          args,
          this,
          thisValue,
          this.isFeatureEnabled.bind(this),
        );
      }
      if (!this.isFeatureEnabled("Generators")) {
        throw new InterpreterError("Generators is not enabled");
      }
      return new GeneratorValue(callee, args, this, thisValue, this.isFeatureEnabled.bind(this));
    }

    // Execute the sandbox function (handles both sync and async functions)
    return await this.executeSandboxFunctionAsync(callee, args, thisValue);
  }

  private async evaluateNewExpressionAsync(node: ESTree.NewExpression): Promise<any> {
    if (!this.isFeatureEnabled("NewExpression")) {
      throw new InterpreterError("NewExpression is not enabled");
    }

    // 1. Evaluate constructor
    const constructor = await this.evaluateNodeAsync(node.callee);

    // 2. Validate constructor is callable
    this.validateConstructor(constructor);

    // 3. Handle ClassValue - use instantiateClassAsync
    if (constructor instanceof ClassValue) {
      return await this.instantiateClassAsync(constructor, node.arguments as ESTree.Expression[]);
    }

    // 4. Create new instance object
    const instance: Record<string, any> = {};

    // 5. Evaluate arguments
    const args = await this.evaluateArgumentsAsync(node.arguments);

    // 6. Call constructor based on type
    let result: any;

    if (constructor instanceof HostFunctionValue) {
      // Host function constructor
      const wrappedArgs = this.wrapArgsForHost(args, true);
      result = this.executeHostConstructor(constructor, wrappedArgs);
    } else {
      // Sandbox function constructor
      const callee = constructor as FunctionValue;

      // Validate argument count
      this.validateFunctionArguments(callee, args);

      // Execute with instance as 'this'
      result = await this.executeSandboxFunctionAsync(callee, args, instance);
    }

    // 7. Return object or constructor's returned object
    const finalResult = this.resolveConstructorReturn(result, instance);
    // Only wrap Promises in RawValue to prevent auto-awaiting
    // Other objects (like Error) should pass through normally
    if (finalResult instanceof Promise) {
      return new RawValue(finalResult);
    }
    return finalResult;
  }

  private async evaluateAssignmentExpressionAsync(node: ESTree.AssignmentExpression): Promise<any> {
    // Handle logical assignment operators (||=, &&=, ??=) with short-circuit evaluation
    if (node.operator === "||=" || node.operator === "&&=" || node.operator === "??=") {
      if (!this.isFeatureEnabled("LogicalAssignment")) {
        throw new InterpreterError("LogicalAssignment is not enabled");
      }
      return await this.evaluateLogicalAssignmentAsync(node);
    }

    // Handle compound assignment operators (+=, -=, *=, etc.)
    if (node.operator !== "=") {
      return this.evaluateCompoundAssignmentAsync(node);
    }

    const value = await this.evaluateNodeAsync(node.right);

    // Handle destructuring assignments
    if (node.left.type === "ArrayPattern" || node.left.type === "ObjectPattern") {
      await this.destructurePatternAsync(node.left, value, false);
      return value;
    }

    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      if (memberExpr.object.type === "Super") {
        return await this.assignSuperMemberAsync(memberExpr, value);
      }

      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        return this.assignPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
          value,
        );
      }

      if (memberExpr.computed) {
        const property = await this.evaluateNodeAsync(memberExpr.property);
        const instanceClass = this.getInstanceClass(object);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue || instanceClass) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            object[property] = value;
            return value;
          }
          throw new InterpreterError("Assignment target is not an array or object");
        }

        if (Array.isArray(object)) {
          // Convert string to number if it's a numeric string (for...in gives string indices)
          const index = typeof property === "string" ? Number(property) : property;

          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = value;
          return value;
        } else if (object instanceof ClassValue) {
          const propName = String(property);
          return await this.assignClassStaticMemberAsync(object, propName, value);
        } else if (instanceClass) {
          const propName = String(property);
          validatePropertyName(propName);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
            value,
          );
        } else if (typeof object === "object" && object !== null) {
          const propName = String(property);
          validatePropertyName(propName);
          object[propName] = value;
          return value;
        } else {
          throw new InterpreterError("Assignment target is not an array or object");
        }
      } else {
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }

        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);

        if (object instanceof ClassValue) {
          return await this.assignClassStaticMemberAsync(object, property, value);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            value,
          );
        }

        if (typeof object === "object" && object !== null && !Array.isArray(object)) {
          object[property] = value;
          return value;
        } else {
          throw new InterpreterError("Cannot assign property to non-object");
        }
      }
    }

    if (node.left.type !== "Identifier") {
      throw new InterpreterError("Invalid assignment target");
    }

    this.environment.set((node.left as ESTree.Identifier).name, value);
    return value;
  }

  /**
   * Async version of evaluateLogicalAssignment for ||=, &&=, ??=
   */
  private async evaluateLogicalAssignmentAsync(node: ESTree.AssignmentExpression): Promise<any> {
    // Get the current value of the left-hand side
    let currentValue: any;

    if (node.left.type === "Identifier") {
      currentValue = this.environment.get((node.left as ESTree.Identifier).name);
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object =
        memberExpr.object.type === "Super"
          ? this.evaluateSuperMemberAccess(memberExpr)
          : await this.evaluateNodeAsync(memberExpr.object);

      if (memberExpr.object.type === "Super") {
        currentValue = object;
      } else if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        currentValue = this.accessPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
        );
      } else if (object instanceof ClassValue) {
        currentValue = await this.accessClassStaticMemberAsync(object, memberExpr);
      } else {
        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          if (memberExpr.computed) {
            const property = await this.evaluateNodeAsync(memberExpr.property);
            if (typeof property === "symbol") {
              this.validateSymbolProperty(property);
              throw new InterpreterError("Symbol properties are not supported");
            }
            const propName = String(property);
            validatePropertyName(propName);
            currentValue = this.getInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              propName,
            );
          } else {
            if (memberExpr.property.type !== "Identifier") {
              throw new InterpreterError("Invalid property access");
            }
            const property = (memberExpr.property as ESTree.Identifier).name;
            validatePropertyName(property);
            currentValue = this.getInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              property,
            );
          }
        } else {
          if (object instanceof HostFunctionValue) {
            throw new InterpreterError("Cannot access properties on host functions");
          }
          this.ensureNoInternalObjectAccess(object);

          if (memberExpr.computed) {
            const property = await this.evaluateNodeAsync(memberExpr.property);
            if (typeof property === "symbol") {
              this.validateSymbolProperty(property);
              if (typeof object === "object" && object !== null) {
                this.ensureNoPrototypeAccessForSymbol(object, property);
                currentValue = object[property];
              } else {
                throw new InterpreterError("Invalid property access");
              }
            } else {
              const propName = Array.isArray(object)
                ? typeof property === "string"
                  ? Number(property)
                  : property
                : String(property);
              if (!Array.isArray(object) && typeof object === "object") {
                if (
                  !this.shouldSkipPropertyValidation(object) ||
                  this.shouldForcePropertyValidation(propName)
                ) {
                  validatePropertyName(propName);
                }
                this.ensureNoPrototypeAccess(object, propName);
              }
              currentValue = object[propName];
            }
          } else {
            if (memberExpr.property.type !== "Identifier") {
              throw new InterpreterError("Invalid property access");
            }
            const property = (memberExpr.property as ESTree.Identifier).name;
            if (
              !this.shouldSkipPropertyValidation(object) ||
              this.shouldForcePropertyValidation(property)
            ) {
              validatePropertyName(property);
            }
            if (typeof object === "object") {
              this.ensureNoPrototypeAccess(object, property);
            }
            currentValue = object[property];
          }
        }
      }
    } else {
      throw new InterpreterError("Invalid logical assignment target");
    }

    // Check if we should assign based on the operator and current value
    let shouldAssign: boolean;
    switch (node.operator) {
      case "||=":
        shouldAssign = !currentValue;
        break;
      case "&&=":
        shouldAssign = !!currentValue;
        break;
      case "??=":
        shouldAssign = currentValue === null || currentValue === undefined;
        break;
      default:
        throw new InterpreterError(`Unsupported logical assignment operator: ${node.operator}`);
    }

    // Short-circuit: if we shouldn't assign, return the current value without evaluating right
    if (!shouldAssign) {
      return currentValue;
    }

    // Evaluate the right-hand side and assign
    const newValue = await this.evaluateNodeAsync(node.right);

    if (node.left.type === "Identifier") {
      this.environment.set((node.left as ESTree.Identifier).name, newValue);
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      if (memberExpr.object.type === "Super") {
        return await this.assignSuperMemberAsync(memberExpr, newValue);
      }

      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        return this.assignPrivateField(
          object,
          (memberExpr.property as ESTree.PrivateIdentifier).name,
          newValue,
        );
      }

      if (memberExpr.computed) {
        const property = await this.evaluateNodeAsync(memberExpr.property);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          const instanceClass = this.getInstanceClass(object);
          if (instanceClass) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            object[property] = newValue;
          }
          return newValue;
        }
        if (Array.isArray(object)) {
          const index = typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = newValue;
        } else if (object instanceof ClassValue) {
          const propName = String(property);
          return await this.assignClassStaticMemberAsync(object, propName, newValue);
        } else {
          const instanceClass = this.getInstanceClass(object);
          if (instanceClass) {
            const propName = String(property);
            validatePropertyName(propName);
            return this.assignInstanceProperty(
              object as Record<string, any>,
              instanceClass,
              propName,
              newValue,
            );
          } else if (typeof object === "object" && object !== null) {
            const propName = String(property);
            validatePropertyName(propName);
            object[propName] = newValue;
          }
        }
      } else {
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        if (object instanceof ClassValue) {
          return await this.assignClassStaticMemberAsync(object, property, newValue);
        }
        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            newValue,
          );
        }
        object[property] = newValue;
      }
    }

    return newValue;
  }

  /**
   * Async version of evaluateCompoundAssignment.
   * Evaluates compound assignment operators: +=, -=, *=, /=, %=, **=, <<=, >>=, >>>=, &=, |=, ^=
   */
  private async evaluateCompoundAssignmentAsync(node: ESTree.AssignmentExpression): Promise<any> {
    const rightValue = await this.evaluateNodeAsync(node.right);

    // Get the current value and compute the new value
    const computeNewValue = (currentValue: any): any => {
      switch (node.operator) {
        case "+=":
          return currentValue + rightValue;
        case "-=":
          return currentValue - rightValue;
        case "*=":
          return currentValue * rightValue;
        case "/=":
          return currentValue / rightValue;
        case "%=":
          return currentValue % rightValue;
        case "**=":
          return currentValue ** rightValue;
        case "<<=":
          return currentValue << rightValue;
        case ">>=":
          return currentValue >> rightValue;
        case ">>>=":
          return currentValue >>> rightValue;
        case "&=":
          return currentValue & rightValue;
        case "|=":
          return currentValue | rightValue;
        case "^=":
          return currentValue ^ rightValue;
        default:
          throw new InterpreterError(`Unsupported assignment operator: ${node.operator}`);
      }
    };

    // Handle identifier assignment: x += 1
    if (node.left.type === "Identifier") {
      const name = (node.left as ESTree.Identifier).name;
      const currentValue = this.environment.get(name);
      const newValue = computeNewValue(currentValue);
      this.environment.set(name, newValue);
      return newValue;
    }

    // Handle member expression assignment: obj.prop += 1 or arr[i] += 1
    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;

      // Handle super member assignment
      if (memberExpr.object.type === "Super") {
        const currentValue = this.evaluateSuperMemberAccess(memberExpr);
        const newValue = computeNewValue(currentValue);
        return await this.assignSuperMemberAsync(memberExpr, newValue);
      }

      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError("Cannot assign properties on host functions");
      }
      this.ensureNoInternalObjectMutation(object);

      // Handle private field: this.#field += 1
      if (memberExpr.property.type === "PrivateIdentifier") {
        if (!this.isFeatureEnabled("PrivateFields")) {
          throw new InterpreterError("PrivateFields is not enabled");
        }
        const fieldName = (memberExpr.property as ESTree.PrivateIdentifier).name;
        const currentValue = this.accessPrivateField(object, fieldName);
        const newValue = computeNewValue(currentValue);
        return this.assignPrivateField(object, fieldName, newValue);
      }

      if (memberExpr.computed) {
        // Computed property: arr[i] += 1 or obj["key"] += 1
        const property = await this.evaluateNodeAsync(memberExpr.property);

        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          if (object instanceof ClassValue || this.getInstanceClass(object)) {
            throw new InterpreterError("Symbol properties are not supported");
          }
          if (typeof object === "object" && object !== null) {
            const currentValue = object[property];
            const newValue = computeNewValue(currentValue);
            object[property] = newValue;
            return newValue;
          }
          throw new InterpreterError("Invalid assignment target");
        }

        if (Array.isArray(object)) {
          const index = typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          const currentValue = object[index];
          const newValue = computeNewValue(currentValue);
          object[index] = newValue;
          return newValue;
        }

        if (object instanceof ClassValue) {
          const propName = String(property);
          const currentValue = await this.accessClassStaticMemberAsync(object, memberExpr);
          const newValue = computeNewValue(currentValue);
          return await this.assignClassStaticMemberAsync(object, propName, newValue);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          const propName = String(property);
          validatePropertyName(propName);
          const currentValue = this.getInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
          );
          const newValue = computeNewValue(currentValue);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            propName,
            newValue,
          );
        }

        // Regular object
        const propName = String(property);
        validatePropertyName(propName);
        const currentValue = object[propName];
        const newValue = computeNewValue(currentValue);
        object[propName] = newValue;
        return newValue;
      } else {
        // Non-computed property: obj.prop += 1
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);

        if (object instanceof ClassValue) {
          const currentValue = await this.accessClassStaticMemberAsync(object, memberExpr);
          const newValue = computeNewValue(currentValue);
          return await this.assignClassStaticMemberAsync(object, property, newValue);
        }

        const instanceClass = this.getInstanceClass(object);
        if (instanceClass) {
          const currentValue = this.getInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
          );
          const newValue = computeNewValue(currentValue);
          return this.assignInstanceProperty(
            object as Record<string, any>,
            instanceClass,
            property,
            newValue,
          );
        }

        const currentValue = object[property];
        const newValue = computeNewValue(currentValue);
        object[property] = newValue;
        return newValue;
      }
    }

    throw new InterpreterError("Invalid compound assignment target");
  }

  private async evaluateVariableDeclarationAsync(node: ESTree.VariableDeclaration): Promise<any> {
    const kind = node.kind as "let" | "const" | "var";
    this.validateVariableDeclarationKind(kind);

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      // Handle destructuring patterns
      if (declarator.id.type === "ArrayPattern" || declarator.id.type === "ObjectPattern") {
        // Destructuring declaration
        if (declarator.init === null) {
          throw new InterpreterError("Destructuring declaration must have an initializer");
        }

        const value = await this.evaluateNodeAsync(declarator.init);
        await this.destructurePatternAsync(declarator.id, value, true, kind);
        lastValue = value;
        continue;
      }

      // Handle simple identifier
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError(`Unsupported declaration pattern: ${declarator.id.type}`);
      }

      const name = (declarator.id as ESTree.Identifier).name;

      // When resuming from a yield, skip variables that have already been declared
      // (their values have already been assigned from the yield expression)
      if (this.isResumingFromYield && this.environment.has(name)) {
        // The variable was already declared in the first evaluation pass.
        // Just evaluate the init (which will return the received value) but don't redeclare.
        const value = declarator.init ? await this.evaluateNodeAsync(declarator.init) : undefined;
        // Use forceSet to update even const variables during yield resumption
        this.environment.forceSet(name, value);
        lastValue = value;
        continue;
      }

      let value = declarator.init ? await this.evaluateNodeAsync(declarator.init) : undefined;
      // Unwrap RawValue (used to prevent Promise auto-awaiting from NewExpression)
      if (value instanceof RawValue) {
        value = value.value;
      }

      this.validateConstInitializer(declarator, kind);

      this.environment.declare(name, value, kind);
      lastValue = value;
    }

    return lastValue;
  }

  private async evaluateBlockStatementAsync(node: ESTree.BlockStatement): Promise<any> {
    const previousEnvironment = this.environment;
    this.environment = new Environment(previousEnvironment);

    let result: any = undefined;

    try {
      for (const statement of node.body) {
        result = await this.evaluateNodeAsync(statement);
        if (this.shouldPropagateControlFlow(result)) {
          return result;
        }
      }
    } finally {
      this.environment = previousEnvironment;
    }

    return result;
  }

  private async evaluateIfStatementAsync(node: ESTree.IfStatement): Promise<any> {
    if (!this.isFeatureEnabled("IfStatement")) {
      throw new InterpreterError("IfStatement is not enabled");
    }

    const condition = await this.evaluateNodeAsync(node.test);

    if (condition) {
      return await this.evaluateNodeAsync(node.consequent);
    } else if (node.alternate) {
      return await this.evaluateNodeAsync(node.alternate);
    }

    return undefined;
  }

  private async evaluateWhileStatementAsync(node: ESTree.WhileStatement): Promise<any> {
    if (!this.isFeatureEnabled("WhileStatement")) {
      throw new InterpreterError("WhileStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    let result: any = undefined;
    let iterations = 0;

    while (await this.evaluateNodeAsync(node.test)) {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();
      this.checkLoopIterations(iterations++);

      result = await this.evaluateNodeAsync(node.body);

      const controlFlow = this.handleLoopControlFlow(result, myLabel);
      if (controlFlow.shouldReturn) {
        this.currentLoopLabel = myLabel;
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    }

    this.currentLoopLabel = myLabel;
    return result;
  }

  private async evaluateDoWhileStatementAsync(node: ESTree.DoWhileStatement): Promise<any> {
    if (!this.isFeatureEnabled("DoWhileStatement")) {
      throw new InterpreterError("DoWhileStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    let result: any = undefined;
    let iterations = 0;

    do {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();
      this.checkLoopIterations(iterations++);

      result = await this.evaluateNodeAsync(node.body);

      const controlFlow = this.handleLoopControlFlow(result, myLabel);
      if (controlFlow.shouldReturn) {
        this.currentLoopLabel = myLabel;
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    } while (await this.evaluateNodeAsync(node.test));

    this.currentLoopLabel = myLabel;
    return result;
  }

  private async evaluateForStatementAsync(node: ESTree.ForStatement): Promise<any> {
    if (!this.isFeatureEnabled("ForStatement")) {
      throw new InterpreterError("ForStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        await this.evaluateNodeAsync(node.init);
      }

      let result: any = undefined;
      let iterations = 0;

      while (true) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        if (node.test) {
          const condition = await this.evaluateNodeAsync(node.test);
          if (!condition) {
            break;
          }
        }

        result = await this.evaluateNodeAsync(node.body);

        // Check for return or break (before update for proper semantics)
        if (result instanceof ReturnValue) {
          return result;
        }
        if (result instanceof BreakValue) {
          // Labeled break targeting a different label - propagate
          if (result.label !== null && result.label !== myLabel) {
            return result;
          }
          return undefined;
        }
        // Labeled continue targeting a different label - propagate
        if (result instanceof ContinueValue && result.label !== null && result.label !== myLabel) {
          return result;
        }

        // Execute update expression (e.g., i++)
        // Note: continue should execute update before next iteration
        if (node.update) {
          await this.evaluateNodeAsync(node.update);
        }

        // Continue to next iteration (for ContinueValue or normal result)
      }

      return result;
    } finally {
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  private async evaluateForOfStatementAsync(node: ESTree.ForOfStatement): Promise<any> {
    if (!this.isFeatureEnabled("ForOfStatement")) {
      throw new InterpreterError("ForOfStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable (right side)
      const iterableValue = await this.evaluateNodeAsync(node.right);

      // Get an iterator from the value
      // Support: arrays, generators, and any object with [Symbol.iterator] or [Symbol.asyncIterator]
      let iterator: Iterator<any> | AsyncIterator<any>;
      let isAsync = node.await || false;

      // For `for await...of`, prefer Symbol.asyncIterator
      if (isAsync && iterableValue && typeof iterableValue[Symbol.asyncIterator] === "function") {
        iterator = iterableValue[Symbol.asyncIterator]();
      } else if (!isAsync && Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue[Symbol.asyncIterator] === "function") {
        iterator = iterableValue[Symbol.asyncIterator]();
        isAsync = true;
      } else if (iterableValue && typeof iterableValue[Symbol.iterator] === "function") {
        iterator = iterableValue[Symbol.iterator]();
      } else if (iterableValue && typeof iterableValue.next === "function") {
        // Already an iterator (e.g., generator instance)
        iterator = iterableValue;
      } else {
        throw new InterpreterError(
          "for...of requires an iterable (array, generator, or object with [Symbol.iterator])",
        );
      }

      // Extract variable information
      const { variableName, pattern, isDeclaration, variableKind } = this.extractForOfVariable(
        node.left,
      );

      let result: any = undefined;
      let iterations = 0;

      // Iterate using the iterator protocol
      let iterResult = isAsync
        ? await (iterator as AsyncIterator<any>).next()
        : (iterator as Iterator<any>).next();

      while (!iterResult.done) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        const currentValue = iterResult.value;

        if (isDeclaration) {
          // For declarations (let/const), create a new scope for each iteration
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable(s) with the current element
          if (pattern) {
            await this.destructurePatternAsync(pattern, currentValue, true, variableKind);
          } else {
            this.environment.declare(variableName!, currentValue, variableKind!);
          }

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign
          if (pattern) {
            await this.destructurePatternAsync(pattern, currentValue, false);
          } else {
            this.environment.set(variableName!, currentValue);
          }

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);
        }

        // Handle control flow
        if (result instanceof BreakValue) {
          // Call iterator.return() to allow cleanup (e.g., finally blocks in generators)
          if (typeof iterator.return === "function") {
            if (isAsync) {
              await (iterator as AsyncIterator<any>).return?.();
            } else {
              (iterator as Iterator<any>).return?.();
            }
          }
          // Labeled break targeting a different label - propagate
          if (result.label !== null && result.label !== myLabel) {
            return result;
          }
          return undefined;
        }
        if (result instanceof ReturnValue) {
          // Call iterator.return() to allow cleanup
          if (typeof iterator.return === "function") {
            if (isAsync) {
              await (iterator as AsyncIterator<any>).return?.();
            } else {
              (iterator as Iterator<any>).return?.();
            }
          }
          return result;
        }
        // Labeled continue targeting a different label - propagate
        if (result instanceof ContinueValue && result.label !== null && result.label !== myLabel) {
          if (typeof iterator.return === "function") {
            if (isAsync) {
              await (iterator as AsyncIterator<any>).return?.();
            } else {
              (iterator as Iterator<any>).return?.();
            }
          }
          return result;
        }
        // ContinueValue (unlabeled or targeting this loop) just continues to the next iteration

        // Get next value
        iterResult = isAsync
          ? await (iterator as AsyncIterator<any>).next()
          : (iterator as Iterator<any>).next();
      }

      return result;
    } finally {
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  private async evaluateForInStatementAsync(node: ESTree.ForInStatement): Promise<any> {
    if (!this.isFeatureEnabled("ForInStatement")) {
      throw new InterpreterError("ForInStatement is not enabled");
    }

    const myLabel = this.currentLoopLabel;
    this.currentLoopLabel = null;

    // Create a new environment for the for...in loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the object (right side)
      const obj = await this.evaluateNodeAsync(node.right);

      // Check if obj is an object or array
      if (obj === null || obj === undefined) {
        throw new InterpreterError("for...in requires an object or array, got null/undefined");
      }

      if (typeof obj !== "object") {
        throw new InterpreterError(`for...in requires an object or array, got ${typeof obj}`);
      }

      // Extract variable information
      const { variableName, isDeclaration, variableKind } = this.extractForInVariable(node.left);

      let result: any = undefined;
      let iterations = 0;

      // Iterate over object keys (own enumerable properties)
      const keys = Object.keys(obj);

      for (const key of keys) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();
        this.checkLoopIterations(iterations++);

        if (isDeclaration) {
          // For declarations (let/const), create a NEW scope for EACH iteration
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable with the current key
          this.environment.declare(variableName, key, variableKind!);

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign in the current scope
          this.environment.set(variableName, key);

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);
        }

        // Handle control flow
        const controlFlow = this.handleLoopControlFlow(result, myLabel);
        if (controlFlow.shouldReturn) {
          return controlFlow.value;
        }
      }

      return result;
    } finally {
      this.environment = previousEnv;
      this.currentLoopLabel = myLabel;
    }
  }

  private async evaluateSwitchStatementAsync(node: ESTree.SwitchStatement): Promise<any> {
    if (!this.isFeatureEnabled("SwitchStatement")) {
      throw new InterpreterError("SwitchStatement is not enabled");
    }

    // Evaluate the discriminant
    const discriminant = await this.evaluateNodeAsync(node.discriminant);

    let matched = false;
    let result: any = undefined;

    // Iterate through all cases
    for (const switchCase of node.cases) {
      if (!matched) {
        if (switchCase.test === null) {
          // Default case
          matched = true;
        } else {
          // Regular case - check if discriminant === test value
          const testValue = await this.evaluateNodeAsync(switchCase.test);
          if (discriminant === testValue) {
            matched = true;
          }
        }
      }

      // If matched, execute consequent statements
      if (matched) {
        for (const statement of switchCase.consequent) {
          result = await this.evaluateNodeAsync(statement);

          if (result instanceof ReturnValue) {
            return result;
          }

          if (result instanceof BreakValue) {
            return undefined;
          }

          if (result instanceof ContinueValue) {
            throw new InterpreterError("Illegal continue statement");
          }
        }
      }
    }

    return result;
  }

  private async evaluateReturnStatementAsync(node: ESTree.ReturnStatement): Promise<any> {
    const value = node.argument ? await this.evaluateNodeAsync(node.argument) : undefined;
    return new ReturnValue(value);
  }

  private async evaluateAwaitExpressionAsync(node: ESTree.AwaitExpression): Promise<any> {
    if (!this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }

    // Evaluate the argument (which should be a promise)
    const value = await this.evaluateNodeAsync(node.argument);

    // Security: Block awaiting host functions directly
    // This prevents exposing the raw host function to the host via the HostFunctionValue wrapper
    if (value instanceof HostFunctionValue) {
      throw new InterpreterError("Cannot await a host function. Did you mean to call it with ()?");
    }

    // Note: We don't block awaiting FunctionValue (sandbox functions) because:
    // 1. They can be legitimately returned from async functions
    // 2. The information disclosure (params, body, closure) already exists when returning functions
    // 3. The host should treat returned values as opaque (documented security consideration)

    // Await the promise (or pass through non-promise values)
    return await value;
  }

  /**
   * Evaluate yield expression (sync): yield value or yield* iterable
   * Returns a YieldValue signal that will be caught by the generator executor
   */
  private evaluateYieldExpression(node: ESTree.YieldExpression): any {
    if (!this.isFeatureEnabled("YieldExpression")) {
      throw new InterpreterError("YieldExpression is not enabled");
    }
    if (!this.isFeatureEnabled("Generators") && !this.isFeatureEnabled("AsyncGenerators")) {
      throw new InterpreterError(
        "YieldExpression requires Generators or AsyncGenerators to be enabled",
      );
    }

    // Track which yield we're at in the current evaluation
    const currentYieldIndex = this.yieldCurrentIndex++;

    // If we're resuming from a yield, check if this yield has already been satisfied
    if (this.isResumingFromYield) {
      // If this yield's index is less than the resume index, it was already satisfied
      // Return the stored received value
      if (currentYieldIndex < this.yieldResumeIndex) {
        return this.yieldReceivedValues[currentYieldIndex];
      }

      // If this is the yield we're resuming at, return the received value
      if (currentYieldIndex === this.yieldResumeIndex && this.pendingYieldReceivedValue?.hasValue) {
        const receivedValue = this.pendingYieldReceivedValue.value;
        this.pendingYieldReceivedValue = undefined;
        // Store the received value for future re-evaluations
        this.yieldReceivedValues[currentYieldIndex] = receivedValue;
        this.yieldResumeIndex++; // Mark this yield as satisfied
        return receivedValue;
      }
    }

    const value = node.argument ? this.evaluateNode(node.argument) : undefined;
    const delegate = node.delegate || false;

    return new YieldValue(value, delegate);
  }

  /**
   * Evaluate yield expression (async): yield value or yield* iterable
   * Returns a YieldValue signal that will be caught by the async generator executor
   */
  private async evaluateYieldExpressionAsync(node: ESTree.YieldExpression): Promise<any> {
    if (!this.isFeatureEnabled("YieldExpression")) {
      throw new InterpreterError("YieldExpression is not enabled");
    }
    if (!this.isFeatureEnabled("Generators") && !this.isFeatureEnabled("AsyncGenerators")) {
      throw new InterpreterError(
        "YieldExpression requires Generators or AsyncGenerators to be enabled",
      );
    }

    // Track which yield we're at in the current evaluation
    const currentYieldIndex = this.yieldCurrentIndex++;

    // If we're resuming from a yield, check if this yield has already been satisfied
    if (this.isResumingFromYield) {
      // If this yield's index is less than the resume index, it was already satisfied
      // Return the stored received value
      if (currentYieldIndex < this.yieldResumeIndex) {
        return this.yieldReceivedValues[currentYieldIndex];
      }

      // If this is the yield we're resuming at, return the received value
      if (currentYieldIndex === this.yieldResumeIndex && this.pendingYieldReceivedValue?.hasValue) {
        const receivedValue = this.pendingYieldReceivedValue.value;
        this.pendingYieldReceivedValue = undefined;
        // Store the received value for future re-evaluations
        this.yieldReceivedValues[currentYieldIndex] = receivedValue;
        this.yieldResumeIndex++; // Mark this yield as satisfied
        return receivedValue;
      }
    }

    const value = node.argument ? await this.evaluateNodeAsync(node.argument) : undefined;
    const delegate = node.delegate || false;

    return new YieldValue(value, delegate);
  }

  /**
   * Evaluate throw statement (async): throw expression
   * Throws an InterpreterError with the evaluated expression
   */
  private async evaluateThrowStatementAsync(node: ESTree.ThrowStatement): Promise<any> {
    if (!this.isFeatureEnabled("ThrowStatement")) {
      throw new InterpreterError("ThrowStatement is not enabled");
    }

    const value = await this.evaluateNodeAsync(node.argument);
    const error = new InterpreterError(`Uncaught ${String(value)}`);
    error.thrownValue = value;
    throw error;
  }

  /**
   * Evaluate try/catch/finally statement (async)
   * Handles exception flow with proper cleanup
   */
  private async evaluateTryStatementAsync(node: ESTree.TryStatement): Promise<any> {
    if (!this.isFeatureEnabled("TryCatchStatement")) {
      throw new InterpreterError("TryCatchStatement is not enabled");
    }

    let tryResult: any = undefined;
    let caughtError: any = null;
    let finallyHasOverride = false;
    let finallyOverrideValue: any = undefined;

    // Execute try block
    try {
      tryResult = await this.evaluateBlockStatementAsync(node.block);
    } catch (error) {
      caughtError = error;

      // If there's a catch clause, execute it
      if (node.handler) {
        // Create new scope for catch block
        const previousEnvironment = this.environment;
        this.environment = new Environment(previousEnvironment);

        try {
          // Bind error to catch parameter if provided
          if (node.handler.param) {
            if (node.handler.param.type === "Identifier") {
              this.environment.declare(node.handler.param.name, error, "let");
            } else if (
              node.handler.param.type === "ObjectPattern" ||
              node.handler.param.type === "ArrayPattern"
            ) {
              // Use original thrown value for destructuring
              const value =
                error instanceof InterpreterError && "thrownValue" in error
                  ? error.thrownValue
                  : error;
              await this.destructurePatternAsync(node.handler.param, value, true, "let");
            }
          }

          // Execute catch block
          tryResult = await this.evaluateBlockStatementAsync(node.handler.body);
          caughtError = null; // Error was handled
        } finally {
          // Restore environment
          this.environment = previousEnvironment;
        }
      }
    } finally {
      // Always execute finally block if present
      if (node.finalizer) {
        const finallyResult = await this.evaluateBlockStatementAsync(node.finalizer);

        // If finally block has control flow (return/break/continue), it overrides try/catch
        if (this.shouldFinallyOverride(finallyResult)) {
          finallyHasOverride = true;
          finallyOverrideValue = finallyResult;
        }
      }
    }

    if (finallyHasOverride) {
      return finallyOverrideValue;
    }

    // Re-throw if error wasn't caught
    if (caughtError !== null) {
      throw caughtError;
    }

    return tryResult;
  }

  /**
   * Destructure a pattern and assign/declare variables (async)
   */
  private async destructurePatternAsync(
    pattern: ESTree.ArrayPattern | ESTree.ObjectPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): Promise<void> {
    if (pattern.type === "ArrayPattern") {
      await this.destructureArrayPatternAsync(pattern, value, declare, kind);
    } else if (pattern.type === "ObjectPattern") {
      await this.destructureObjectPatternAsync(pattern, value, declare, kind);
    }
  }

  /**
   * Destructure array pattern (async): [a, b, c]
   */
  private async destructureArrayPatternAsync(
    pattern: ESTree.ArrayPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): Promise<void> {
    // Validate value is array-like
    this.validateArrayDestructuring(value);

    // Process each element in the pattern
    for (let i = 0; i < pattern.elements.length; i++) {
      const element = pattern.elements[i];
      if (element === null || element === undefined) {
        // Hole in array pattern: let [a, , c] = [1, 2, 3]
        continue;
      }

      const elementValue = i < value.length ? value[i] : undefined;

      if (element.type === "Identifier") {
        // Simple identifier: a
        this.bindDestructuredIdentifier(element.name, elementValue, declare, kind);
      } else if (element.type === "ArrayPattern" || element.type === "ObjectPattern") {
        // Nested destructuring: [a, [b, c]]
        await this.destructurePatternAsync(element, elementValue, declare, kind);
      } else if (element.type === "RestElement") {
        // Rest element: [...rest] - collect remaining array elements
        const restName = this.getRestElementName(element);
        // Collect all remaining elements from current position
        const remainingValues = value.slice(i);
        this.bindDestructuredIdentifier(restName, remainingValues, declare, kind);

        // Rest must be last element, so we break
        break;
      } else {
        // Must be AssignmentPattern (default value: a = 5)
        // TypeScript doesn't narrow this properly, so we handle it as the else case
        await this.handleAssignmentPatternAsync(
          element as unknown as ESTree.AssignmentPattern,
          elementValue,
          declare,
          kind,
        );
      }
    }
  }

  /**
   * Destructure object pattern (async): {x, y}
   */
  private async destructureObjectPatternAsync(
    pattern: ESTree.ObjectPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): Promise<void> {
    // Validate value is an object
    this.validateObjectDestructuring(value);

    // Track which keys have been destructured (needed for rest)
    const destructuredKeys = new Set<string>();
    let restElement: ESTree.RestElement | null = null;

    // First pass: Process regular properties and track keys
    for (const property of pattern.properties) {
      if (property.type === "RestElement") {
        // Save rest element for later processing (must be processed after all other properties)
        restElement = property as ESTree.RestElement;
        continue;
      }

      if (property.type === "Property") {
        // Extract the key (property name in source object)
        let key: string;
        if (property.computed) {
          // Computed property: {[expr]: value}
          const computedKey = await this.evaluateNodeAsync(property.key);
          key = String(computedKey);
        } else {
          // Static property: {x} or {x: newName}
          key = (property.key as ESTree.Identifier).name;
        }

        // Track this key as destructured
        destructuredKeys.add(key);

        // Get the value from the source object
        const propValue = value[key];

        // Extract the target (where to assign)
        const target = property.value;

        if (target.type === "Identifier") {
          // Simple: {x} or {x: newName}
          this.bindDestructuredIdentifier(target.name, propValue, declare, kind);
        } else if (target.type === "AssignmentPattern") {
          // Default value: {x = 5}
          await this.handleAssignmentPatternAsync(target, propValue, declare, kind);
        } else if (target.type === "ArrayPattern" || target.type === "ObjectPattern") {
          // Nested destructuring: {a: {b}}
          await this.destructurePatternAsync(target, propValue, declare, kind);
        } else {
          throw new InterpreterError(`Unsupported object pattern value: ${target.type}`);
        }
      } else {
        const propertyType = (property as ESTree.Node).type;
        throw new InterpreterError(`Unsupported object pattern property: ${propertyType}`);
      }
    }

    // Second pass: Handle rest element if present
    if (restElement) {
      const restName = this.getRestElementName(restElement);
      const restObj: Record<string, any> = {};

      // Collect all non-destructured properties
      for (const [key, val] of Object.entries(value)) {
        if (!destructuredKeys.has(key)) {
          validatePropertyName(key); // Security: prevent prototype pollution
          restObj[key] = val;
        }
      }

      this.bindDestructuredIdentifier(restName, restObj, declare, kind);
    }
  }

  /**
   * Handle assignment pattern (async) (default values): a = 5
   */
  private async handleAssignmentPatternAsync(
    pattern: ESTree.AssignmentPattern,
    value: any,
    declare: boolean,
    kind?: "let" | "const" | "var",
  ): Promise<void> {
    // Use default if value is undefined
    const defaultExpr = pattern.right;
    if (!defaultExpr) {
      throw new InterpreterError("Assignment pattern must have a default value");
    }
    const finalValue = value === undefined ? await this.evaluateNodeAsync(defaultExpr) : value;

    const left = pattern.left;

    if (left.type === "Identifier") {
      const name = left.name;
      if (declare) {
        this.environment.declare(name, finalValue, kind!);
      } else {
        this.environment.set(name, finalValue);
      }
    } else if (left.type === "ArrayPattern" || left.type === "ObjectPattern") {
      // Nested pattern with default: [a = [1, 2]]
      await this.destructurePatternAsync(left, finalValue, declare, kind);
    }
    // Note: TypeScript exhaustively checks all valid types above
    // Any other type would be a parser error, not a runtime case
  }

  private async evaluateMemberExpressionAsync(node: ESTree.MemberExpression): Promise<any> {
    if (!this.isFeatureEnabled("MemberExpression")) {
      throw new InterpreterError("MemberExpression is not enabled");
    }

    // Handle super.method() or super.property access
    if (node.object.type === "Super") {
      return this.evaluateSuperMemberAccess(node);
    }

    const object = await this.evaluateNodeAsync(node.object);
    return this.resolveMemberExpressionValueAsync(node, object);
  }

  private async resolveMemberExpressionValueAsync(
    node: ESTree.MemberExpression,
    object: any,
  ): Promise<any> {
    // Preserve optional chaining short-circuit semantics.
    if (object instanceof OptionalChainShortCircuit) {
      return object;
    }
    if (node.optional && (object === null || object === undefined)) {
      return OPTIONAL_CHAIN_SHORT_CIRCUIT;
    }

    this.validateMemberAccess(object);

    // Handle private field access (must check before ClassValue handling)
    if (node.property.type === "PrivateIdentifier") {
      if (!this.isFeatureEnabled("PrivateFields")) {
        throw new InterpreterError("PrivateFields is not enabled");
      }
      return this.accessPrivateField(object, (node.property as ESTree.PrivateIdentifier).name);
    }

    // Handle static member access on classes
    if (object instanceof ClassValue) {
      return this.accessClassStaticMember(object, node);
    }

    const instanceClass = this.getInstanceClass(object);
    if (instanceClass) {
      if (node.computed) {
        const property = await this.evaluateNodeAsync(node.property);
        if (typeof property === "symbol") {
          this.validateSymbolProperty(property);
          throw new InterpreterError("Symbol properties are not supported");
        }
        const propName = String(property);
        validatePropertyName(propName);
        return this.getInstanceProperty(object as Record<string, any>, instanceClass, propName);
      }

      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      validatePropertyName(property);
      return this.getInstanceProperty(object as Record<string, any>, instanceClass, property);
    }

    if (node.computed) {
      const property = await this.evaluateNodeAsync(node.property);
      if (typeof property === "symbol") {
        this.validateSymbolProperty(property);
        if (typeof object === "object" && object !== null) {
          return this.accessObjectProperty(object, property);
        }
        throw new InterpreterError("Computed property access requires an array or object");
      }

      // Handle Symbol constructor - allow access to static properties
      if (object === Symbol) {
        return (Symbol as any)[property];
      }

      // Handle HostFunctionValue computed access - block internal/meta properties
      if (object instanceof HostFunctionValue) {
        const propName = String(property);
        if (
          propName === "hostFunc" ||
          propName === "isAsync" ||
          propName === "rethrowErrors" ||
          propName === "name" ||
          propName === "length"
        ) {
          throw new InterpreterError("Cannot access properties on host functions");
        }
        // Let the HostFunctionValue proxy handle the access
        return (object as any)[propName];
      }

      if (Array.isArray(object)) {
        return this.accessArrayElement(object, property);
      }

      if (typeof object === "object" && object !== null) {
        return this.accessObjectProperty(object, property);
      }

      throw new InterpreterError("Computed property access requires an array or object");
    } else {
      // obj.prop - direct property access
      // Note: PrivateIdentifier is handled earlier in the function
      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      validatePropertyName(property);

      if (object instanceof FunctionValue) {
        throw new InterpreterError("Cannot access properties on functions");
      }

      // Handle Symbol constructor - allow access to static properties (Symbol.iterator, etc.)
      if (object === Symbol) {
        return (Symbol as any)[property];
      }

      // Handle globalThis/global sentinel - return the sentinel's internal object
      if (object instanceof GlobalThisSentinel) {
        return (object as any)[property];
      }

      // Handle HostFunctionValue - allow static method access but block internal/meta properties
      if (object instanceof HostFunctionValue) {
        if (
          property === "hostFunc" ||
          property === "isAsync" ||
          property === "rethrowErrors" ||
          property === "name" ||
          property === "length"
        ) {
          throw new InterpreterError("Cannot access properties on host functions");
        }
        // Let the HostFunctionValue proxy handle the access (for static methods)
        return (object as any)[property];
      }

      const length = this.getLengthProperty(object, property);
      if (length !== null) {
        return length;
      }

      // Handle generator methods (next, return, throw)
      if (object instanceof GeneratorValue) {
        const method = this.getGeneratorMethod(object, property);
        if (method) {
          return method;
        }
        throw new InterpreterError(`Generator method '${property}' not supported`);
      }

      // Handle async generator methods
      if (object instanceof AsyncGeneratorValue) {
        const method = this.getAsyncGeneratorMethod(object, property);
        if (method) {
          return method;
        }
        throw new InterpreterError(`Async generator method '${property}' not supported`);
      }

      // Handle array methods (reuse sync version since array methods work the same)
      if (Array.isArray(object)) {
        const arrayMethod = this.getArrayMethod(object, property);
        if (arrayMethod) {
          return arrayMethod;
        }
        // Allow access to own properties on arrays (e.g., tagged template strings.raw)
        if (Object.prototype.hasOwnProperty.call(object, property)) {
          return (object as any)[property];
        }
        // Delegate to native array method if safe
        const nativeMethod = this.getNativeMethod(object, property);
        if (nativeMethod !== undefined) {
          return nativeMethod;
        }
        throw new InterpreterError(`Array property '${property}' not supported`);
      }

      // Handle string methods (reuse sync version since string methods work the same)
      if (typeof object === "string") {
        const stringMethod = this.getStringMethod(object, property);
        if (stringMethod) {
          return stringMethod;
        }
        // Delegate to native string method if safe
        const nativeMethod = this.getNativeMethod(object, property);
        if (nativeMethod !== undefined) {
          return nativeMethod;
        }
        throw new InterpreterError(`String property '${property}' not supported`);
      }

      if (typeof object === "object" && object !== null && !Array.isArray(object)) {
        this.ensureNoPrototypeAccess(object, property);
        return object[property];
      }

      throw new InterpreterError(`Property '${property}' not supported`);
    }
  }

  private async evaluateArrayExpressionAsync(node: ESTree.ArrayExpression): Promise<any> {
    if (!this.isFeatureEnabled("ArrayLiterals")) {
      throw new InterpreterError("ArrayLiterals is not enabled");
    }

    const elements: any[] = [];

    for (const element of node.elements) {
      if (element === null) {
        elements.push(undefined);
      } else if (element.type === "SpreadElement") {
        // Spread element: [...arr] - expand array into individual elements
        const spreadValue = await this.evaluateNodeAsync(
          (element as ESTree.SpreadElement).argument,
        );
        const spreadArray = this.validateArraySpread(spreadValue);
        elements.push(...spreadArray);
      } else {
        elements.push(await this.evaluateNodeAsync(element));
      }
    }

    // Track memory: estimate 16 bytes per array element
    this.trackMemory(elements.length * 16);

    return elements;
  }

  private async evaluateObjectExpressionAsync(node: ESTree.ObjectExpression): Promise<any> {
    if (!this.isFeatureEnabled("ObjectLiterals")) {
      throw new InterpreterError("ObjectLiterals is not enabled");
    }

    const obj: Record<string, any> = {};

    for (const property of node.properties) {
      if (property.type === "SpreadElement") {
        // Spread element: {...obj} - expand object properties
        const spreadValue = await this.evaluateNodeAsync(
          (property as ESTree.SpreadElement).argument,
        );
        this.validateObjectSpread(spreadValue);

        // Merge properties from spread object
        for (const [key, value] of Object.entries(spreadValue)) {
          validatePropertyName(key); // Security: prevent prototype pollution
          obj[key] = value;
        }
      } else if (property.type === "Property") {
        // Evaluate expression for computed properties
        const computedKey = property.computed ? await this.evaluateNodeAsync(property.key) : null;
        const key =
          computedKey !== null
            ? typeof computedKey === "symbol"
              ? computedKey
              : String(computedKey)
            : this.extractPropertyKey(property.key);

        // Validate string keys for prototype pollution, skip for symbols
        if (typeof key === "string") {
          validatePropertyName(key);
        }

        if (property.kind === "get" || property.kind === "set") {
          // Getter/setter property
          const funcValue = (await this.evaluateNodeAsync(property.value)) as FunctionValue;
          const descriptor = Object.getOwnPropertyDescriptor(obj, key) || {
            configurable: true,
            enumerable: true,
          };
          if (property.kind === "get") {
            descriptor.get = () => this.executeSandboxFunction(funcValue, [], obj);
          } else {
            descriptor.set = (v: any) => this.executeSandboxFunction(funcValue, [v], obj);
          }
          Object.defineProperty(obj, key, descriptor);
        } else {
          // Regular property or method shorthand
          const value = await this.evaluateNodeAsync(property.value);
          (obj as any)[key] = value;
        }
      } else {
        const propertyType = (property as ESTree.Node).type;
        throw new InterpreterError(`Unsupported object property type: ${propertyType}`);
      }
    }

    // Track memory: estimate 64 bytes base + 32 bytes per property
    const propertyCount = Object.keys(obj).length;
    this.trackMemory(64 + propertyCount * 32);

    return obj;
  }

  /**
   * Evaluate template literal (async): `hello ${name}`
   */
  private async evaluateTemplateLiteralAsync(node: ESTree.TemplateLiteral): Promise<string> {
    if (!this.isFeatureEnabled("TemplateLiterals")) {
      throw new InterpreterError("TemplateLiterals is not enabled");
    }

    // Evaluate all expressions asynchronously
    const expressionValues: any[] = [];
    for (const expr of node.expressions) {
      if (!expr) {
        throw new InterpreterError("Template literal missing expression");
      }
      expressionValues.push(await this.evaluateNodeAsync(expr));
    }

    // Build the final string using shared logic
    return this.buildTemplateLiteralString(node.quasis, expressionValues);
  }

  private async evaluateTaggedTemplateExpressionAsync(
    node: ESTree.TaggedTemplateExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("TemplateLiterals")) {
      throw new InterpreterError("TemplateLiterals is not enabled");
    }

    const tag = await this.evaluateNodeAsync(node.tag);

    // Build the strings array with cooked values
    const strings: string[] = node.quasi.quasis.map((q) => q.value.cooked);
    const raw: string[] = node.quasi.quasis.map((q) => q.value.raw);
    Object.freeze(raw);
    Object.defineProperty(strings, "raw", {
      value: raw,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    Object.freeze(strings);

    // Evaluate expressions asynchronously
    const values: any[] = [];
    for (const expr of node.quasi.expressions) {
      values.push(await this.evaluateNodeAsync(expr));
    }

    // Call the tag function
    const args = [strings, ...values];
    if (tag instanceof FunctionValue) {
      return await this.executeSandboxFunctionAsync(tag, args, undefined);
    }
    if (tag instanceof HostFunctionValue) {
      return tag.isAsync ? await tag.hostFunc(...args) : tag.hostFunc(...args);
    }
    if (typeof tag === "function") {
      return tag(...args);
    }
    throw new InterpreterError("Tag expression is not a function");
  }

  private async evaluateSequenceExpressionAsync(node: ESTree.SequenceExpression): Promise<any> {
    let result: any;
    for (const expr of node.expressions) {
      result = await this.evaluateNodeAsync(expr);
    }
    return result;
  }

  /**
   * Async version of evaluateChainExpression for optional chaining
   */
  private async evaluateChainExpressionAsync(node: ESTree.ChainExpression): Promise<any> {
    if (!this.isFeatureEnabled("OptionalChaining")) {
      throw new InterpreterError("OptionalChaining is not enabled");
    }

    const result = await this.evaluateNodeAsync(node.expression);

    // If we got a short-circuit marker, the chain should return undefined
    if (result instanceof OptionalChainShortCircuit) {
      return undefined;
    }

    return result;
  }

  // ============================================================================
  // CLASS SUPPORT (ES6)
  // ============================================================================

  /**
   * Evaluate a class declaration: class Foo { }
   * Binds the class to the environment and returns undefined.
   */
  private evaluateClassDeclaration(node: ESTree.ClassDeclaration): undefined {
    if (!this.isFeatureEnabled("Classes")) {
      throw new InterpreterError("Classes is not enabled");
    }

    const classValue = this.buildClassValue(node);

    // For declarations, bind to the environment
    if (node.id) {
      this.environment.declare(node.id.name, classValue, "let");
    }

    return undefined;
  }

  /**
   * Async version of evaluateClassDeclaration
   */
  private async evaluateClassDeclarationAsync(node: ESTree.ClassDeclaration): Promise<undefined> {
    if (!this.isFeatureEnabled("Classes")) {
      throw new InterpreterError("Classes is not enabled");
    }

    const classValue = await this.buildClassValueAsync(node);

    if (node.id) {
      this.environment.declare(node.id.name, classValue, "let");
    }

    return undefined;
  }

  /**
   * Evaluate a class expression: const Foo = class { }
   * Returns the ClassValue.
   */
  private evaluateClassExpression(node: ESTree.ClassExpression): ClassValue {
    if (!this.isFeatureEnabled("Classes")) {
      throw new InterpreterError("Classes is not enabled");
    }

    return this.buildClassValue(node);
  }

  /**
   * Async version of evaluateClassExpression
   */
  private async evaluateClassExpressionAsync(node: ESTree.ClassExpression): Promise<ClassValue> {
    if (!this.isFeatureEnabled("Classes")) {
      throw new InterpreterError("Classes is not enabled");
    }

    return await this.buildClassValueAsync(node);
  }

  /**
   * Handle the super keyword.
   * Returns a marker that CallExpression/MemberExpression can detect.
   */
  private evaluateSuper(): SuperBinding {
    if (!this.currentSuperBinding) {
      throw new InterpreterError("'super' keyword is only valid inside a class");
    }

    return this.currentSuperBinding;
  }

  /**
   * Build a ClassValue from a class declaration or expression AST node.
   */
  private buildClassValue(node: ESTree.ClassDeclaration | ESTree.ClassExpression): ClassValue {
    // Evaluate superclass if present
    let parentClass: ClassValue | null = null;
    if (node.superClass) {
      const superValue = this.evaluateNode(node.superClass);
      if (!(superValue instanceof ClassValue)) {
        throw new InterpreterError("Class extends clause requires a class constructor");
      }
      parentClass = superValue;
    }

    return this.processClassBody(node, parentClass);
  }

  /**
   * Async version of buildClassValue
   */
  private async buildClassValueAsync(
    node: ESTree.ClassDeclaration | ESTree.ClassExpression,
  ): Promise<ClassValue> {
    let parentClass: ClassValue | null = null;
    if (node.superClass) {
      const superValue = await this.evaluateNodeAsync(node.superClass);
      if (!(superValue instanceof ClassValue)) {
        throw new InterpreterError("Class extends clause requires a class constructor");
      }
      parentClass = superValue;
    }

    return await this.processClassBodyAsync(node, parentClass);
  }

  /**
   * Process the class body and create maps of methods, getters, setters.
   */
  private processClassBody(
    node: ESTree.ClassDeclaration | ESTree.ClassExpression,
    parentClass: ClassValue | null,
  ): ClassValue {
    const instanceMethods = new Map<string, FunctionValue>();
    const staticMethods = new Map<string, FunctionValue>();
    const instanceGetters = new Map<string, FunctionValue>();
    const instanceSetters = new Map<string, FunctionValue>();
    const staticGetters = new Map<string, FunctionValue>();
    const staticSetters = new Map<string, FunctionValue>();
    const instanceFields: ClassFieldInitializer[] = [];
    const staticFields = new Map<string, any>();
    const privateInstanceMethods = new Map<string, FunctionValue>();
    const privateStaticMethods = new Map<string, FunctionValue>();
    const privateStaticFields = new Map<string, any>();
    let constructorMethod: FunctionValue | null = null;

    const previousEnvironment = this.environment;
    const classEnv = new Environment(this.environment);
    const className = node.id?.name ?? null;

    const classValue = new ClassValue(
      className,
      null,
      instanceMethods,
      staticMethods,
      instanceGetters,
      instanceSetters,
      staticGetters,
      staticSetters,
      parentClass,
      classEnv,
      instanceFields,
      staticFields,
      privateInstanceMethods,
      privateStaticMethods,
      privateStaticFields,
    );

    if (className) {
      classEnv.declare(className, classValue, "const");
    }

    this.environment = classEnv;

    try {
      for (const element of node.body.body) {
        if (element.type === "MethodDefinition") {
          const methodDef = element as ESTree.MethodDefinition;
          const isPrivate = methodDef.key?.type === "PrivateIdentifier";

          if (isPrivate) {
            if (!this.isFeatureEnabled("PrivateFields")) {
              throw new InterpreterError("PrivateFields is not enabled");
            }

            const methodName = (methodDef.key as ESTree.PrivateIdentifier).name;
            const funcValue = this.createMethodFunction(
              methodDef.value as ESTree.FunctionExpression,
            );

            if (methodDef.static) {
              privateStaticMethods.set(methodName, funcValue);
            } else {
              privateInstanceMethods.set(methodName, funcValue);
            }
          } else {
            const methodName = this.extractClassMethodName(methodDef);

            if (methodDef.kind !== "constructor") {
              validatePropertyName(methodName);
            }

            const funcValue = this.createMethodFunction(
              methodDef.value as ESTree.FunctionExpression,
            );

            if (methodDef.kind === "constructor") {
              constructorMethod = funcValue;
            } else if (methodDef.kind === "get") {
              if (methodDef.static) {
                staticMethods.delete(methodName);
                staticGetters.set(methodName, funcValue);
              } else {
                instanceMethods.delete(methodName);
                instanceGetters.set(methodName, funcValue);
              }
            } else if (methodDef.kind === "set") {
              if (methodDef.static) {
                staticMethods.delete(methodName);
                staticSetters.set(methodName, funcValue);
              } else {
                instanceMethods.delete(methodName);
                instanceSetters.set(methodName, funcValue);
              }
            } else {
              if (methodDef.static) {
                staticGetters.delete(methodName);
                staticSetters.delete(methodName);
                staticMethods.set(methodName, funcValue);
              } else {
                instanceGetters.delete(methodName);
                instanceSetters.delete(methodName);
                instanceMethods.set(methodName, funcValue);
              }
            }
          }
        } else if (element.type === "PropertyDefinition") {
          const propDef = element as ESTree.PropertyDefinition;
          const isPrivate = propDef.key?.type === "PrivateIdentifier";

          if (isPrivate) {
            if (!this.isFeatureEnabled("PrivateFields")) {
              throw new InterpreterError("PrivateFields is not enabled");
            }

            const fieldName = (propDef.key as ESTree.PrivateIdentifier).name;

            if (propDef.static) {
              const value = propDef.value
                ? this.evaluateStaticFieldInitializer(classValue, propDef.value)
                : undefined;
              privateStaticFields.set(fieldName, value);
            } else {
              instanceFields.push({
                name: fieldName,
                initializer: propDef.value,
                computed: false,
                keyNode: propDef.key,
                isPrivate: true,
              });
            }
          } else {
            if (!this.isFeatureEnabled("ClassFields")) {
              throw new InterpreterError("ClassFields is not enabled");
            }

            const fieldName = this.extractPropertyDefinitionName(propDef);

            validatePropertyName(fieldName);

            if (propDef.static) {
              const value = propDef.value
                ? this.evaluateStaticFieldInitializer(classValue, propDef.value)
                : undefined;
              staticFields.set(fieldName, value);
            } else {
              instanceFields.push({
                name: fieldName,
                initializer: propDef.value,
                computed: propDef.computed,
                keyNode: propDef.key,
                isPrivate: false,
              });
            }
          }
        } else if (element.type === "StaticBlock") {
          if (!this.isFeatureEnabled("StaticBlocks")) {
            throw new InterpreterError("StaticBlocks is not enabled");
          }
          this.executeStaticBlock(element as ESTree.StaticBlock, classValue);
        }
      }
    } finally {
      this.environment = previousEnvironment;
    }

    classValue.constructorMethod = constructorMethod;
    this.tagClassMethods(classValue);

    return classValue;
  }

  /**
   * Async version of processClassBody.
   */
  private async processClassBodyAsync(
    node: ESTree.ClassDeclaration | ESTree.ClassExpression,
    parentClass: ClassValue | null,
  ): Promise<ClassValue> {
    const instanceMethods = new Map<string, FunctionValue>();
    const staticMethods = new Map<string, FunctionValue>();
    const instanceGetters = new Map<string, FunctionValue>();
    const instanceSetters = new Map<string, FunctionValue>();
    const staticGetters = new Map<string, FunctionValue>();
    const staticSetters = new Map<string, FunctionValue>();
    const instanceFields: ClassFieldInitializer[] = [];
    const staticFields = new Map<string, any>();
    const privateInstanceMethods = new Map<string, FunctionValue>();
    const privateStaticMethods = new Map<string, FunctionValue>();
    const privateStaticFields = new Map<string, any>();
    let constructorMethod: FunctionValue | null = null;

    const previousEnvironment = this.environment;
    const classEnv = new Environment(this.environment);
    const className = node.id?.name ?? null;

    const classValue = new ClassValue(
      className,
      null,
      instanceMethods,
      staticMethods,
      instanceGetters,
      instanceSetters,
      staticGetters,
      staticSetters,
      parentClass,
      classEnv,
      instanceFields,
      staticFields,
      privateInstanceMethods,
      privateStaticMethods,
      privateStaticFields,
    );

    if (className) {
      classEnv.declare(className, classValue, "const");
    }

    this.environment = classEnv;

    try {
      for (const element of node.body.body) {
        if (element.type === "MethodDefinition") {
          const methodDef = element as ESTree.MethodDefinition;
          const isPrivate = methodDef.key?.type === "PrivateIdentifier";

          if (isPrivate) {
            if (!this.isFeatureEnabled("PrivateFields")) {
              throw new InterpreterError("PrivateFields is not enabled");
            }

            const methodName = (methodDef.key as ESTree.PrivateIdentifier).name;
            const funcValue = this.createMethodFunction(
              methodDef.value as ESTree.FunctionExpression,
            );

            if (methodDef.static) {
              privateStaticMethods.set(methodName, funcValue);
            } else {
              privateInstanceMethods.set(methodName, funcValue);
            }
          } else {
            const methodName = await this.extractClassMethodNameAsync(methodDef);

            if (methodDef.kind !== "constructor") {
              validatePropertyName(methodName);
            }

            const funcValue = this.createMethodFunction(
              methodDef.value as ESTree.FunctionExpression,
            );

            if (methodDef.kind === "constructor") {
              constructorMethod = funcValue;
            } else if (methodDef.kind === "get") {
              if (methodDef.static) {
                staticMethods.delete(methodName);
                staticGetters.set(methodName, funcValue);
              } else {
                instanceMethods.delete(methodName);
                instanceGetters.set(methodName, funcValue);
              }
            } else if (methodDef.kind === "set") {
              if (methodDef.static) {
                staticMethods.delete(methodName);
                staticSetters.set(methodName, funcValue);
              } else {
                instanceMethods.delete(methodName);
                instanceSetters.set(methodName, funcValue);
              }
            } else {
              if (methodDef.static) {
                staticGetters.delete(methodName);
                staticSetters.delete(methodName);
                staticMethods.set(methodName, funcValue);
              } else {
                instanceGetters.delete(methodName);
                instanceSetters.delete(methodName);
                instanceMethods.set(methodName, funcValue);
              }
            }
          }
        } else if (element.type === "PropertyDefinition") {
          const propDef = element as ESTree.PropertyDefinition;
          const isPrivate = propDef.key?.type === "PrivateIdentifier";

          if (isPrivate) {
            if (!this.isFeatureEnabled("PrivateFields")) {
              throw new InterpreterError("PrivateFields is not enabled");
            }

            const fieldName = (propDef.key as ESTree.PrivateIdentifier).name;

            if (propDef.static) {
              const value = propDef.value
                ? await this.evaluateStaticFieldInitializerAsync(classValue, propDef.value)
                : undefined;
              privateStaticFields.set(fieldName, value);
            } else {
              instanceFields.push({
                name: fieldName,
                initializer: propDef.value,
                computed: false,
                keyNode: propDef.key,
                isPrivate: true,
              });
            }
          } else {
            if (!this.isFeatureEnabled("ClassFields")) {
              throw new InterpreterError("ClassFields is not enabled");
            }

            const fieldName = await this.extractPropertyDefinitionNameAsync(propDef);

            validatePropertyName(fieldName);

            if (propDef.static) {
              const value = propDef.value
                ? await this.evaluateStaticFieldInitializerAsync(classValue, propDef.value)
                : undefined;
              staticFields.set(fieldName, value);
            } else {
              instanceFields.push({
                name: fieldName,
                initializer: propDef.value,
                computed: propDef.computed,
                keyNode: propDef.key,
                isPrivate: false,
              });
            }
          }
        } else if (element.type === "StaticBlock") {
          if (!this.isFeatureEnabled("StaticBlocks")) {
            throw new InterpreterError("StaticBlocks is not enabled");
          }
          await this.executeStaticBlockAsync(element as ESTree.StaticBlock, classValue);
        }
      }
    } finally {
      this.environment = previousEnvironment;
    }

    classValue.constructorMethod = constructorMethod;
    this.tagClassMethods(classValue);

    return classValue;
  }

  /**
   * Execute a static initialization block in the context of the class.
   * Static blocks have access to the class via 'this' and can access private static members.
   */
  private executeStaticBlock(block: ESTree.StaticBlock, classValue: ClassValue): void {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;

    // Create environment with 'this' as the class itself
    this.environment = new Environment(classValue.closure, classValue, true);

    // Set super binding for private static field access
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: classValue,
      currentClass: classValue,
      isStatic: true,
    };

    try {
      // Execute all statements in the static block
      for (const statement of block.body) {
        const result = this.evaluateNode(statement);
        // Static blocks don't return values, but we need to handle control flow
        if (result instanceof ReturnValue) {
          throw new InterpreterError(
            "Return statement is not allowed in static initialization block",
          );
        }
      }
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  private evaluateStaticFieldInitializer(
    classValue: ClassValue,
    initializer: ESTree.Expression,
  ): any {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;

    this.environment = new Environment(classValue.closure, classValue, true);
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: classValue,
      currentClass: classValue,
      isStatic: true,
    };

    try {
      return this.evaluateNode(initializer);
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  /**
   * Async version of executeStaticBlock.
   */
  private async executeStaticBlockAsync(
    block: ESTree.StaticBlock,
    classValue: ClassValue,
  ): Promise<void> {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;

    this.environment = new Environment(classValue.closure, classValue, true);
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: classValue,
      currentClass: classValue,
      isStatic: true,
    };

    try {
      for (const statement of block.body) {
        const result = await this.evaluateNodeAsync(statement);
        if (result instanceof ReturnValue) {
          throw new InterpreterError(
            "Return statement is not allowed in static initialization block",
          );
        }
      }
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  private async evaluateStaticFieldInitializerAsync(
    classValue: ClassValue,
    initializer: ESTree.Expression,
  ): Promise<any> {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;

    this.environment = new Environment(classValue.closure, classValue, true);
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: classValue,
      currentClass: classValue,
      isStatic: true,
    };

    try {
      return await this.evaluateNodeAsync(initializer);
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  /**
   * Extract method name from a MethodDefinition, handling computed properties.
   */
  private extractClassMethodName(methodDef: ESTree.MethodDefinition): string {
    if (methodDef.key === null) {
      throw new InterpreterError("Method key is null");
    }
    if (methodDef.computed) {
      // Computed property: [expr]() { }
      const keyValue = this.evaluateNode(methodDef.key);
      return String(keyValue);
    } else if (methodDef.key.type === "Identifier") {
      return (methodDef.key as ESTree.Identifier).name;
    } else if (methodDef.key.type === "Literal") {
      return String((methodDef.key as ESTree.Literal).value);
    }
    throw new InterpreterError("Unsupported method key type");
  }

  /**
   * Async version of extractClassMethodName.
   */
  private async extractClassMethodNameAsync(methodDef: ESTree.MethodDefinition): Promise<string> {
    if (methodDef.key === null) {
      throw new InterpreterError("Method key is null");
    }
    if (methodDef.computed) {
      const keyValue = await this.evaluateNodeAsync(methodDef.key);
      return String(keyValue);
    } else if (methodDef.key.type === "Identifier") {
      return (methodDef.key as ESTree.Identifier).name;
    } else if (methodDef.key.type === "Literal") {
      return String((methodDef.key as ESTree.Literal).value);
    }
    throw new InterpreterError("Unsupported method key type");
  }

  /**
   * Extract field name from a PropertyDefinition, handling computed properties.
   */
  private extractPropertyDefinitionName(propDef: ESTree.PropertyDefinition): string {
    if (propDef.key === null) {
      throw new InterpreterError("Property definition key is null");
    }
    if (propDef.computed) {
      // Computed property: [expr] = value
      const keyValue = this.evaluateNode(propDef.key as ESTree.Expression);
      return String(keyValue);
    } else if (propDef.key.type === "Identifier") {
      return (propDef.key as ESTree.Identifier).name;
    } else if (propDef.key.type === "Literal") {
      return String((propDef.key as ESTree.Literal).value);
    }
    throw new InterpreterError("Unsupported property definition key type");
  }

  /**
   * Async version of extractPropertyDefinitionName.
   */
  private async extractPropertyDefinitionNameAsync(
    propDef: ESTree.PropertyDefinition,
  ): Promise<string> {
    if (propDef.key === null) {
      throw new InterpreterError("Property definition key is null");
    }
    if (propDef.computed) {
      const keyValue = await this.evaluateNodeAsync(propDef.key as ESTree.Expression);
      return String(keyValue);
    } else if (propDef.key.type === "Identifier") {
      return (propDef.key as ESTree.Identifier).name;
    } else if (propDef.key.type === "Literal") {
      return String((propDef.key as ESTree.Literal).value);
    }
    throw new InterpreterError("Unsupported property definition key type");
  }

  /**
   * Create a FunctionValue from a method's FunctionExpression.
   */
  private createMethodFunction(func: ESTree.FunctionExpression): FunctionValue {
    const { params, restParamIndex, defaultValues, destructuredParams } = this.parseFunctionParams(
      func.params,
    );

    // Make sure the body is a BlockStatement (methods should always have one)
    if (!func.body || func.body.type !== "BlockStatement") {
      throw new InterpreterError("Method body must be a block statement");
    }

    return new FunctionValue(
      params,
      func.body as ESTree.BlockStatement,
      this.environment,
      func.async ?? false,
      restParamIndex,
      func.generator ?? false,
      defaultValues,
      null,
      false,
      destructuredParams,
    );
  }

  private tagClassMethods(classValue: ClassValue): void {
    if (classValue.constructorMethod) {
      classValue.constructorMethod.homeClass = classValue;
      classValue.constructorMethod.homeIsStatic = false;
    }

    this.tagClassMethodMap(classValue.instanceMethods, classValue, false);
    this.tagClassMethodMap(classValue.instanceGetters, classValue, false);
    this.tagClassMethodMap(classValue.instanceSetters, classValue, false);
    this.tagClassMethodMap(classValue.staticMethods, classValue, true);
    this.tagClassMethodMap(classValue.staticGetters, classValue, true);
    this.tagClassMethodMap(classValue.staticSetters, classValue, true);
    this.tagClassMethodMap(classValue.privateInstanceMethods, classValue, false);
    this.tagClassMethodMap(classValue.privateStaticMethods, classValue, true);
  }

  private tagClassMethodMap(
    methods: Map<string, FunctionValue>,
    classValue: ClassValue,
    isStatic: boolean,
  ): void {
    for (const func of methods.values()) {
      func.homeClass = classValue;
      func.homeIsStatic = isStatic;
    }
  }

  /**
   * Instantiate a class by creating an instance and running the constructor.
   */
  private instantiateClass(classValue: ClassValue, argNodes: ESTree.Expression[]): any {
    // Create instance object
    let instance: Record<string, any> = Object.create(null);
    this.instanceClassMap.set(instance, classValue);

    // Evaluate arguments
    const args = this.evaluateArguments(argNodes);

    // Find the constructor to call (could be inherited)
    const { constructor, definingClass } = this.findClassConstructor(classValue);

    // Execute constructor if there is one
    if (constructor) {
      const { result, thisValue } = this.executeClassConstructorBody(
        constructor,
        definingClass,
        instance,
        args,
      );
      const finalInstance = thisValue ?? instance;
      if (result instanceof ReturnValue) {
        return this.resolveConstructorReturn(result.value, finalInstance);
      }
      return finalInstance;
    } else if (classValue.parentClass) {
      this.thisInitStack.push(false);
      try {
        instance = this.executeSuperConstructorCall(args, instance, classValue);
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      } finally {
        this.thisInitStack.pop();
      }
    } else {
      this.initializeInstanceFieldsForClass(instance, classValue);
    }

    return instance;
  }

  /**
   * Async version of instantiateClass
   */
  private async instantiateClassAsync(
    classValue: ClassValue,
    argNodes: ESTree.Expression[],
  ): Promise<any> {
    let instance: Record<string, any> = Object.create(null);
    this.instanceClassMap.set(instance, classValue);

    const args = await this.evaluateArgumentsAsync(argNodes);

    const { constructor, definingClass } = this.findClassConstructor(classValue);

    if (constructor) {
      const { result, thisValue } = await this.executeClassConstructorBodyAsync(
        constructor,
        definingClass,
        instance,
        args,
      );
      const finalInstance = thisValue ?? instance;
      if (result instanceof ReturnValue) {
        return this.resolveConstructorReturn(result.value, finalInstance);
      }
      return finalInstance;
    } else if (classValue.parentClass) {
      this.thisInitStack.push(false);
      try {
        instance = await this.executeSuperConstructorCallAsync(args, instance, classValue);
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      } finally {
        this.thisInitStack.pop();
      }
    } else {
      await this.initializeInstanceFieldsForClassAsync(instance, classValue);
    }

    return instance;
  }

  /**
   * Find the constructor for a class, walking up the inheritance chain if needed.
   * Returns the constructor and the class that defines it.
   */
  private findClassConstructor(classValue: ClassValue): {
    constructor: FunctionValue | null;
    definingClass: ClassValue;
  } {
    let current: ClassValue | null = classValue;
    while (current) {
      if (current.constructorMethod) {
        return {
          constructor: current.constructorMethod,
          definingClass: current,
        };
      }
      current = current.parentClass;
    }
    return { constructor: null, definingClass: classValue };
  }

  /**
   * Set up instance methods, getters, and setters on an instance object.
   * Walks the inheritance chain (parent first) so child methods override parent methods.
   */
  private setupInstanceMethods(instance: Record<string, any>, classValue: ClassValue): void {
    // Build inheritance chain (root first)
    const classChain: ClassValue[] = [];
    let current: ClassValue | null = classValue;
    while (current) {
      classChain.unshift(current);
      current = current.parentClass;
    }

    for (const cls of classChain) {
      // Add instance methods
      for (const [name, func] of cls.instanceMethods) {
        instance[name] = this.createBoundClassMethod(func, instance, cls);
      }

      // Add getters/setters via Object.defineProperty
      const processedProps = new Set<string>();

      for (const [name, getter] of cls.instanceGetters) {
        const setter = cls.instanceSetters.get(name);
        processedProps.add(name);

        Object.defineProperty(instance, name, {
          get: () => this.executeClassMethod(getter, instance, cls, []),
          set: setter
            ? (value: any) => this.executeClassMethod(setter, instance, cls, [value])
            : undefined,
          enumerable: true,
          configurable: true,
        });
      }

      // Handle setters without corresponding getters
      for (const [name, setter] of cls.instanceSetters) {
        if (!processedProps.has(name)) {
          Object.defineProperty(instance, name, {
            get: undefined,
            set: (value: any) => this.executeClassMethod(setter, instance, cls, [value]),
            enumerable: true,
            configurable: true,
          });
        }
      }
    }
  }

  /**
   * Initialize instance fields on an instance object.
   * Walks the inheritance chain (parent first) so child fields can override parent fields.
   */
  private initializeInstanceFields(instance: Record<string, any>, classValue: ClassValue): void {
    // Build inheritance chain (root first)
    const classChain: ClassValue[] = [];
    let current: ClassValue | null = classValue;
    while (current) {
      classChain.unshift(current);
      current = current.parentClass;
    }

    // Initialize fields in order: parent first, then child
    for (const cls of classChain) {
      this.initializeInstanceFieldsForClass(instance, cls);
    }
  }

  private initializeInstanceFieldsForClass(
    instance: Record<string, any>,
    classValue: ClassValue,
  ): void {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    this.environment = new Environment(classValue.closure, instance, true);
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: instance,
      currentClass: classValue,
      isStatic: false,
    };

    try {
      for (const field of classValue.instanceFields) {
        const value = field.initializer ? this.evaluateNode(field.initializer) : undefined;

        if (field.isPrivate) {
          let privateFields = classValue.privateFieldStorage.get(instance);
          if (!privateFields) {
            privateFields = new Map<string, any>();
            classValue.privateFieldStorage.set(instance, privateFields);
          }
          privateFields.set(field.name, value);
        } else {
          let fieldName = field.name;
          if (field.computed && field.keyNode) {
            fieldName = String(this.evaluateNode(field.keyNode as ESTree.Expression));
          }
          instance[fieldName] = value;
        }
      }
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  /**
   * Async version of initializeInstanceFields.
   */
  private async initializeInstanceFieldsAsync(
    instance: Record<string, any>,
    classValue: ClassValue,
  ): Promise<void> {
    // Build inheritance chain (root first)
    const classChain: ClassValue[] = [];
    let current: ClassValue | null = classValue;
    while (current) {
      classChain.unshift(current);
      current = current.parentClass;
    }

    // Initialize fields in order: parent first, then child
    for (const cls of classChain) {
      await this.initializeInstanceFieldsForClassAsync(instance, cls);
    }
  }

  private async initializeInstanceFieldsForClassAsync(
    instance: Record<string, any>,
    classValue: ClassValue,
  ): Promise<void> {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    this.environment = new Environment(classValue.closure, instance, true);
    this.currentSuperBinding = {
      parentClass: classValue.parentClass,
      thisValue: instance,
      currentClass: classValue,
      isStatic: false,
    };

    try {
      for (const field of classValue.instanceFields) {
        const value = field.initializer
          ? await this.evaluateNodeAsync(field.initializer)
          : undefined;

        if (field.isPrivate) {
          let privateFields = classValue.privateFieldStorage.get(instance);
          if (!privateFields) {
            privateFields = new Map<string, any>();
            classValue.privateFieldStorage.set(instance, privateFields);
          }
          privateFields.set(field.name, value);
        } else {
          let fieldName = field.name;
          if (field.computed && field.keyNode) {
            fieldName = String(await this.evaluateNodeAsync(field.keyNode as ESTree.Expression));
          }
          instance[fieldName] = value;
        }
      }
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  /**
   * Create a bound class method that captures this and super context.
   */
  private createBoundClassMethod(
    func: FunctionValue,
    instance: any,
    definingClass: ClassValue,
  ): (...args: any[]) => any {
    // Return a callable function that binds the right context
    return (...args: any[]) => {
      return this.executeClassMethod(func, instance, definingClass, args);
    };
  }

  /**
   * Execute a class method with proper this and super binding.
   */
  private executeClassMethod(
    func: FunctionValue,
    instance: any,
    definingClass: ClassValue,
    args: any[],
  ): any {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;

    this.environment = new Environment(func.closure, instance, true);
    this.currentSuperBinding = {
      parentClass: definingClass.parentClass,
      thisValue: instance,
      currentClass: definingClass,
      isStatic: func.homeIsStatic,
    };

    try {
      this.bindFunctionParameters(func, args);
      const result = this.evaluateNode(func.body);

      if (result instanceof ReturnValue) {
        return result.value;
      }
      return undefined;
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
    }
  }

  /**
   * Execute super() constructor call.
   */
  private executeSuperConstructorCall(args: any[], instance: any, currentClass: ClassValue): any {
    const parentClass = currentClass.parentClass;
    if (!parentClass) {
      throw new InterpreterError("'super' constructor call requires a parent class");
    }

    // Note: Instance methods are already set up in instantiateClass
    // We only need to execute the parent constructor here

    if (this.thisInitStack.length > 0) {
      const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
      if (isInitialized) {
        throw new InterpreterError("super() has already been called");
      }
    }

    const { constructor: parentConstructor, definingClass } =
      this.findClassConstructor(parentClass);

    let currentInstance = instance;

    if (parentConstructor) {
      const { result, thisValue } = this.executeClassConstructorBody(
        parentConstructor,
        definingClass,
        instance,
        args,
      );
      currentInstance = thisValue ?? instance;
      if (result instanceof ReturnValue) {
        currentInstance = this.resolveConstructorReturn(result.value, currentInstance);
      }
    } else if (parentClass.parentClass) {
      this.thisInitStack.push(false);
      try {
        currentInstance = this.executeSuperConstructorCall(args, instance, parentClass);
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      } finally {
        this.thisInitStack.pop();
      }
    } else {
      this.initializeInstanceFieldsForClass(currentInstance, parentClass);
    }

    if (this.thisInitStack.length > 0) {
      this.thisInitStack[this.thisInitStack.length - 1] = true;
    }

    this.initializeInstanceFieldsForClass(currentInstance, currentClass);
    return currentInstance;
  }

  /**
   * Async version of executeSuperConstructorCall.
   */
  private async executeSuperConstructorCallAsync(
    args: any[],
    instance: any,
    currentClass: ClassValue,
  ): Promise<any> {
    const parentClass = currentClass.parentClass;
    if (!parentClass) {
      throw new InterpreterError("'super' constructor call requires a parent class");
    }

    // Note: Instance methods are already set up in instantiateClassAsync
    // We only need to execute the parent constructor here

    if (this.thisInitStack.length > 0) {
      const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
      if (isInitialized) {
        throw new InterpreterError("super() has already been called");
      }
    }

    const { constructor: parentConstructor, definingClass } =
      this.findClassConstructor(parentClass);

    let currentInstance = instance;

    if (parentConstructor) {
      const { result, thisValue } = await this.executeClassConstructorBodyAsync(
        parentConstructor,
        definingClass,
        instance,
        args,
      );
      currentInstance = thisValue ?? instance;
      if (result instanceof ReturnValue) {
        currentInstance = this.resolveConstructorReturn(result.value, currentInstance);
      }
    } else if (parentClass.parentClass) {
      this.thisInitStack.push(false);
      try {
        currentInstance = await this.executeSuperConstructorCallAsync(args, instance, parentClass);
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      } finally {
        this.thisInitStack.pop();
      }
    } else {
      await this.initializeInstanceFieldsForClassAsync(currentInstance, parentClass);
    }

    if (this.thisInitStack.length > 0) {
      this.thisInitStack[this.thisInitStack.length - 1] = true;
    }

    await this.initializeInstanceFieldsForClassAsync(currentInstance, currentClass);
    return currentInstance;
  }

  private executeClassConstructorBody(
    constructor: FunctionValue,
    definingClass: ClassValue,
    instance: any,
    args: any[],
  ): ConstructorExecutionResult {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    const isDerived = !!definingClass.parentClass;

    this.thisInitStack.push(!isDerived);
    this.constructorStack.push(definingClass);
    this.environment = new Environment(constructor.closure, instance, true);
    this.currentSuperBinding = {
      parentClass: definingClass.parentClass,
      thisValue: instance,
      currentClass: definingClass,
      isStatic: false,
    };

    try {
      this.bindFunctionParameters(constructor, args);
      if (!isDerived) {
        this.initializeInstanceFieldsForClass(instance, definingClass);
      }
      const result = this.evaluateNode(constructor.body);
      if (isDerived) {
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      }
      return { result, thisValue: this.environment.getThis() };
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
      this.thisInitStack.pop();
      this.constructorStack.pop();
    }
  }

  private async executeClassConstructorBodyAsync(
    constructor: FunctionValue,
    definingClass: ClassValue,
    instance: any,
    args: any[],
  ): Promise<ConstructorExecutionResult> {
    const previousEnvironment = this.environment;
    const previousSuperBinding = this.currentSuperBinding;
    const isDerived = !!definingClass.parentClass;

    this.thisInitStack.push(!isDerived);
    this.constructorStack.push(definingClass);
    this.environment = new Environment(constructor.closure, instance, true);
    this.currentSuperBinding = {
      parentClass: definingClass.parentClass,
      thisValue: instance,
      currentClass: definingClass,
      isStatic: false,
    };

    try {
      await this.bindFunctionParametersAsync(constructor, args);
      if (!isDerived) {
        await this.initializeInstanceFieldsForClassAsync(instance, definingClass);
      }
      const result = await this.evaluateNodeAsync(constructor.body);
      if (isDerived) {
        const isInitialized = this.thisInitStack[this.thisInitStack.length - 1] ?? true;
        if (!isInitialized) {
          throw new InterpreterError(
            "Derived class constructor must call super() before returning",
          );
        }
      }
      return { result, thisValue: this.environment.getThis() };
    } finally {
      this.environment = previousEnvironment;
      this.currentSuperBinding = previousSuperBinding;
      this.thisInitStack.pop();
      this.constructorStack.pop();
    }
  }

  /**
   * Look up a method in the parent class chain for super.method() calls.
   */
  private lookupSuperMethod(
    superBinding: SuperBinding,
    methodName: string,
  ): { method: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const method = current.instanceMethods.get(methodName);
      if (method) {
        return { method, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupInstanceMethod(
    classValue: ClassValue,
    methodName: string,
  ): { method: FunctionValue; definingClass: ClassValue } | null {
    let current: ClassValue | null = classValue;
    while (current) {
      const method = current.instanceMethods.get(methodName);
      if (method) {
        return { method, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  /**
   * Look up a getter in the parent class chain for super.property access.
   */
  private lookupSuperGetter(
    superBinding: SuperBinding,
    propertyName: string,
  ): { getter: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const getter = current.instanceGetters.get(propertyName);
      if (getter) {
        return { getter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupInstanceGetter(
    classValue: ClassValue,
    propertyName: string,
  ): { getter: FunctionValue; definingClass: ClassValue } | null {
    let current: ClassValue | null = classValue;
    while (current) {
      const getter = current.instanceGetters.get(propertyName);
      if (getter) {
        return { getter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  /**
   * Look up a setter in the parent class chain for super.property = value.
   */
  private lookupSuperSetter(
    superBinding: SuperBinding,
    propertyName: string,
  ): { setter: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const setter = current.instanceSetters.get(propertyName);
      if (setter) {
        return { setter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupInstanceSetter(
    classValue: ClassValue,
    propertyName: string,
  ): { setter: FunctionValue; definingClass: ClassValue } | null {
    let current: ClassValue | null = classValue;
    while (current) {
      const setter = current.instanceSetters.get(propertyName);
      if (setter) {
        return { setter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupSuperStaticMethod(
    superBinding: SuperBinding,
    methodName: string,
  ): { method: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const method = current.staticMethods.get(methodName);
      if (method) {
        return { method, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupSuperStaticGetter(
    superBinding: SuperBinding,
    propertyName: string,
  ): { getter: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const getter = current.staticGetters.get(propertyName);
      if (getter) {
        return { getter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private lookupSuperStaticSetter(
    superBinding: SuperBinding,
    propertyName: string,
  ): { setter: FunctionValue; definingClass: ClassValue } | null {
    let current = superBinding.parentClass;
    while (current) {
      const setter = current.staticSetters.get(propertyName);
      if (setter) {
        return { setter, definingClass: current };
      }
      current = current.parentClass;
    }
    return null;
  }

  private getInstanceProperty(
    instance: Record<string, any>,
    classValue: ClassValue,
    propertyName: string,
  ): any {
    if (Object.prototype.hasOwnProperty.call(instance, propertyName)) {
      return instance[propertyName];
    }

    const getterResult = this.lookupInstanceGetter(classValue, propertyName);
    if (getterResult) {
      return this.executeClassMethod(getterResult.getter, instance, getterResult.definingClass, []);
    }

    const methodResult = this.lookupInstanceMethod(classValue, propertyName);
    if (methodResult) {
      return methodResult.method;
    }

    return undefined;
  }

  private assignInstanceProperty(
    instance: Record<string, any>,
    classValue: ClassValue,
    propertyName: string,
    value: any,
  ): any {
    const setterResult = this.lookupInstanceSetter(classValue, propertyName);
    if (setterResult) {
      this.executeClassMethod(setterResult.setter, instance, setterResult.definingClass, [value]);
      return value;
    }

    instance[propertyName] = value;
    return value;
  }

  /**
   * Access a static member (method, getter, or setter) on a class.
   */
  private accessClassStaticMember(classValue: ClassValue, node: ESTree.MemberExpression): any {
    const propertyName = node.computed
      ? String(this.evaluateNode(node.property))
      : (node.property as ESTree.Identifier).name;

    validatePropertyName(propertyName);

    // Check for static method
    const method = classValue.staticMethods.get(propertyName);
    if (method) {
      return method;
    }

    // Check for static getter
    const getter = classValue.staticGetters.get(propertyName);
    if (getter) {
      return this.executeClassMethod(getter, classValue, classValue, []);
    }

    // Check for static field
    if (classValue.staticFields.has(propertyName)) {
      return classValue.staticFields.get(propertyName);
    }

    // Property not found
    return undefined;
  }

  /**
   * Async version of accessClassStaticMember.
   */
  private async accessClassStaticMemberAsync(
    classValue: ClassValue,
    node: ESTree.MemberExpression,
  ): Promise<any> {
    const propertyName = node.computed
      ? String(await this.evaluateNodeAsync(node.property))
      : (node.property as ESTree.Identifier).name;

    validatePropertyName(propertyName);

    const method = classValue.staticMethods.get(propertyName);
    if (method) {
      return method;
    }

    const getter = classValue.staticGetters.get(propertyName);
    if (getter) {
      return this.executeClassMethod(getter, classValue, classValue, []);
    }

    if (classValue.staticFields.has(propertyName)) {
      return classValue.staticFields.get(propertyName);
    }

    return undefined;
  }

  /**
   * Assign a value to a static class member.
   */
  private assignClassStaticMember(classValue: ClassValue, propertyName: string, value: any): any {
    validatePropertyName(propertyName);

    const setter = classValue.staticSetters.get(propertyName);
    if (setter) {
      this.executeClassMethod(setter, classValue, classValue, [value]);
      return value;
    }

    classValue.staticFields.set(propertyName, value);
    return value;
  }

  /**
   * Async version of assignClassStaticMember.
   */
  private async assignClassStaticMemberAsync(
    classValue: ClassValue,
    propertyName: string,
    value: any,
  ): Promise<any> {
    validatePropertyName(propertyName);

    const setter = classValue.staticSetters.get(propertyName);
    if (setter) {
      this.executeClassMethod(setter, classValue, classValue, [value]);
      return value;
    }

    classValue.staticFields.set(propertyName, value);
    return value;
  }

  /**
   * Assign a value to a super member.
   */
  private assignSuperMember(node: ESTree.MemberExpression, value: any): any {
    if (!this.currentSuperBinding) {
      throw new InterpreterError("'super' keyword is only valid inside a class");
    }

    if (!this.currentSuperBinding.parentClass) {
      throw new InterpreterError("'super' member assignment requires a parent class");
    }

    if (node.property.type === "PrivateIdentifier") {
      throw new InterpreterError("Private fields are not accessible via super");
    }

    const propertyName = node.computed
      ? String(this.evaluateNode(node.property))
      : (node.property as ESTree.Identifier).name;

    validatePropertyName(propertyName);

    if (this.currentSuperBinding.isStatic) {
      const setterResult = this.lookupSuperStaticSetter(this.currentSuperBinding, propertyName);

      if (setterResult) {
        const { setter, definingClass } = setterResult;
        this.executeClassMethod(setter, this.currentSuperBinding.thisValue, definingClass, [value]);
        return value;
      }

      const receiver = this.currentSuperBinding.thisValue;
      if (receiver instanceof ClassValue) {
        return this.assignClassStaticMember(receiver, propertyName, value);
      }
    } else {
      const setterResult = this.lookupSuperSetter(this.currentSuperBinding, propertyName);

      if (setterResult) {
        const { setter, definingClass } = setterResult;
        this.executeClassMethod(setter, this.currentSuperBinding.thisValue, definingClass, [value]);
        return value;
      }

      const instance = this.currentSuperBinding.thisValue;
      if (typeof instance === "object" && instance !== null) {
        instance[propertyName] = value;
        return value;
      }
    }

    throw new InterpreterError("Cannot assign property to non-object");
  }

  /**
   * Async version of assignSuperMember.
   */
  private async assignSuperMemberAsync(node: ESTree.MemberExpression, value: any): Promise<any> {
    if (!this.currentSuperBinding) {
      throw new InterpreterError("'super' keyword is only valid inside a class");
    }

    if (!this.currentSuperBinding.parentClass) {
      throw new InterpreterError("'super' member assignment requires a parent class");
    }

    if (node.property.type === "PrivateIdentifier") {
      throw new InterpreterError("Private fields are not accessible via super");
    }

    const propertyName = node.computed
      ? String(await this.evaluateNodeAsync(node.property))
      : (node.property as ESTree.Identifier).name;

    validatePropertyName(propertyName);

    if (this.currentSuperBinding.isStatic) {
      const setterResult = this.lookupSuperStaticSetter(this.currentSuperBinding, propertyName);

      if (setterResult) {
        const { setter, definingClass } = setterResult;
        this.executeClassMethod(setter, this.currentSuperBinding.thisValue, definingClass, [value]);
        return value;
      }

      const receiver = this.currentSuperBinding.thisValue;
      if (receiver instanceof ClassValue) {
        return await this.assignClassStaticMemberAsync(receiver, propertyName, value);
      }
    } else {
      const setterResult = this.lookupSuperSetter(this.currentSuperBinding, propertyName);

      if (setterResult) {
        const { setter, definingClass } = setterResult;
        this.executeClassMethod(setter, this.currentSuperBinding.thisValue, definingClass, [value]);
        return value;
      }

      const instance = this.currentSuperBinding.thisValue;
      if (typeof instance === "object" && instance !== null) {
        instance[propertyName] = value;
        return value;
      }
    }

    throw new InterpreterError("Cannot assign property to non-object");
  }

  /**
   * Access a private field on an object.
   * Private fields are stored in the ClassValue's WeakMap, not on the instance itself.
   * We need to find the class in the current context that has this private field.
   */
  private accessPrivateField(object: any, fieldName: string): any {
    if (typeof object !== "object" || object === null) {
      throw new InterpreterError(`Cannot access private field #${fieldName} on non-object`);
    }

    // We need to know which class context we're in to access private fields
    // The currentSuperBinding tells us which class we're executing in
    if (!this.currentSuperBinding) {
      throw new InterpreterError(`Cannot access private field #${fieldName} outside of class`);
    }

    const currentClass = this.currentSuperBinding.currentClass;

    // Check if accessing static private members (when object is a ClassValue)
    if (object instanceof ClassValue) {
      // Check static private fields
      if (currentClass.privateStaticFields.has(fieldName)) {
        return currentClass.privateStaticFields.get(fieldName);
      }

      // Check private static methods
      const privateStaticMethod = currentClass.privateStaticMethods.get(fieldName);
      if (privateStaticMethod) {
        return privateStaticMethod;
      }

      throw new InterpreterError(`Private field #${fieldName} is not defined`);
    }

    // Check instance private fields
    const privateFields = currentClass.privateFieldStorage.get(object);
    if (privateFields && privateFields.has(fieldName)) {
      return privateFields.get(fieldName);
    }

    // Check private instance methods
    const privateMethod = currentClass.privateInstanceMethods.get(fieldName);
    if (privateMethod) {
      return privateMethod;
    }

    throw new InterpreterError(`Private field #${fieldName} is not defined`);
  }

  /**
   * Assign a value to a private field on an object.
   * Private fields are stored in the ClassValue's WeakMap.
   */
  private assignPrivateField(object: any, fieldName: string, value: any): any {
    if (typeof object !== "object" || object === null) {
      throw new InterpreterError(`Cannot assign to private field #${fieldName} on non-object`);
    }

    if (!this.currentSuperBinding) {
      throw new InterpreterError(`Cannot assign to private field #${fieldName} outside of class`);
    }

    const currentClass = this.currentSuperBinding.currentClass;

    // Check if this is an instance private field
    const privateFields = currentClass.privateFieldStorage.get(object);
    if (privateFields && privateFields.has(fieldName)) {
      privateFields.set(fieldName, value);
      return value;
    }

    // Check if this is a static private field
    if (currentClass.privateStaticFields.has(fieldName)) {
      currentClass.privateStaticFields.set(fieldName, value);
      return value;
    }

    throw new InterpreterError(`Private field #${fieldName} is not defined`);
  }

  /**
   * Evaluate super.method or super.property access.
   * Returns a bound method or executes a getter.
   */
  private evaluateSuperMemberAccess(node: ESTree.MemberExpression): any {
    if (!this.currentSuperBinding) {
      throw new InterpreterError("'super' keyword is only valid inside a class");
    }

    if (!this.currentSuperBinding.parentClass) {
      throw new InterpreterError("'super' member access requires a parent class");
    }

    // Get the property name
    const propertyName = node.computed
      ? String(this.evaluateNode(node.property))
      : (node.property as ESTree.Identifier).name;

    validatePropertyName(propertyName);

    // First check for a method
    if (this.currentSuperBinding.isStatic) {
      const methodResult = this.lookupSuperStaticMethod(this.currentSuperBinding, propertyName);
      if (methodResult) {
        return methodResult.method;
      }

      const getterResult = this.lookupSuperStaticGetter(this.currentSuperBinding, propertyName);
      if (getterResult) {
        const { getter, definingClass } = getterResult;
        return this.executeClassMethod(
          getter,
          this.currentSuperBinding.thisValue,
          definingClass,
          [],
        );
      }

      let current: ClassValue | null = this.currentSuperBinding.parentClass;
      while (current) {
        if (current.staticFields.has(propertyName)) {
          return current.staticFields.get(propertyName);
        }
        current = current.parentClass;
      }
    } else {
      const methodResult = this.lookupSuperMethod(this.currentSuperBinding, propertyName);
      if (methodResult) {
        return methodResult.method;
      }

      const getterResult = this.lookupSuperGetter(this.currentSuperBinding, propertyName);
      if (getterResult) {
        const { getter, definingClass } = getterResult;
        return this.executeClassMethod(
          getter,
          this.currentSuperBinding.thisValue,
          definingClass,
          [],
        );
      }
    }

    return undefined;
  }
}
