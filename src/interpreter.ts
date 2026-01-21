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

import { parseModule } from "meriyah";
import type { ESTree } from "meriyah";

import { isDangerousProperty } from "./constants";
import { ReadOnlyProxy } from "./readonly-proxy";

type ASTNode = ESTree.Node;

/**
 * Custom error class for interpreter-specific errors
 */
export class InterpreterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterpreterError";
  }
}

function validatePropertyName(name: string): void {
  if (isDangerousProperty(name)) {
    throw new InterpreterError(
      `Property name '${name}' is not allowed for security reasons`,
    );
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
  // Marker class to signal break statement
}

/**
 * Marker class to signal a continue statement
 * When a loop executes `continue`, we return ContinueValue to signal skipping to next iteration
 */
class ContinueValue {
  // Marker class to signal continue statement
}

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
  ) {}
}

/**
 * Type for the evaluator function used by generators.
 * Can be sync (evaluateNode) or async (evaluateNodeAsync).
 */
type GeneratorEvaluator = (node: ESTree.Node) => any;
type AsyncGeneratorEvaluator = (node: ESTree.Node) => Promise<any>;

/**
 * Shared state type for generators
 */
type GeneratorState =
  | "suspended-start"
  | "suspended-yield"
  | "executing"
  | "completed";

/**
 * Binds generator function parameters to the environment.
 * Shared between sync and async generators.
 */
function bindGeneratorParameters(
  fn: FunctionValue,
  args: any[],
  env: Environment,
): void {
  const regularParamCount =
    fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

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
  ) {}

  /**
   * Execute a statement in generator context, yielding any yields recursively.
   */
  private *executeStatement(
    statement: ESTree.Statement,
  ): Generator<any, any, any> {
    if (statement.type === "ForStatement") {
      return yield* this.executeForStatement(statement as ESTree.ForStatement);
    }
    if (statement.type === "WhileStatement") {
      return yield* this.executeWhileStatement(
        statement as ESTree.WhileStatement,
      );
    }
    if (statement.type === "DoWhileStatement") {
      return yield* this.executeDoWhileStatement(
        statement as ESTree.DoWhileStatement,
      );
    }
    if (statement.type === "ForOfStatement") {
      return yield* this.executeForOfStatement(
        statement as ESTree.ForOfStatement,
      );
    }
    if (statement.type === "ForInStatement") {
      return yield* this.executeForInStatement(
        statement as ESTree.ForInStatement,
      );
    }
    if (statement.type === "TryStatement") {
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
  ): Generator<
    any,
    { shouldBreak: boolean; shouldReturn: any; shouldContinue: boolean },
    any
  > {
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
  private *executeForStatement(
    node: ESTree.ForStatement,
  ): Generator<any, any, any> {
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
          const { shouldBreak, shouldReturn, shouldContinue } =
            yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
          if (shouldReturn) return shouldReturn;
          if (shouldBreak) break;
          // shouldContinue falls through to update
        } else {
          const result = this.interpreter.evaluateNode(node.body);
          const processed = processGeneratorResult(result);
          if (processed.yielded) {
            if (processed.delegate)
              yield* this.delegateYield(processed.yieldValue);
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
  private *executeWhileStatement(
    node: ESTree.WhileStatement,
  ): Generator<any, any, any> {
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
          if (processed.delegate)
            yield* this.delegateYield(processed.yieldValue);
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
  private *executeDoWhileStatement(
    node: ESTree.DoWhileStatement,
  ): Generator<any, any, any> {
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
          if (processed.delegate)
            yield* this.delegateYield(processed.yieldValue);
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
  private *executeForOfStatement(
    node: ESTree.ForOfStatement,
  ): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable
      const iterableValue = this.interpreter.evaluateNode(node.right);

      // Get an iterator from the value
      let iterator: Iterator<any>;
      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.iterator] === "function"
      ) {
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
          throw new InterpreterError(
            "for...of only supports simple identifiers",
          );
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
          this.interpreter.environment.declare(
            variableName,
            currentValue,
            variableKind!,
          );

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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
  private *executeForInStatement(
    node: ESTree.ForInStatement,
  ): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the object
      const obj = this.interpreter.evaluateNode(node.right);

      if (obj === null || obj === undefined) {
        throw new InterpreterError(
          "for...in requires an object or array, got null/undefined",
        );
      }
      if (typeof obj !== "object") {
        throw new InterpreterError(
          `for...in requires an object or array, got ${typeof obj}`,
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
          throw new InterpreterError(
            "for...in only supports simple identifiers",
          );
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
          this.interpreter.environment.declare(
            variableName,
            key,
            variableKind!,
          );

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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
  private *executeTryStatement(
    node: ESTree.TryStatement,
  ): Generator<any, any, any> {
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
            this.interpreter.environment.declare(
              node.handler.param.name,
              error,
              "let",
            );
          }

          // Execute catch block
          if (node.handler.body.type === "BlockStatement") {
            const { shouldReturn } = yield* this.executeBlockBody(
              node.handler.body.body,
            );
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
          const { shouldReturn } = yield* this.executeBlockBody(
            node.finalizer.body,
          );
          // If finally block has a return, it overrides try/catch result
          // Unwrap ReturnValue since we're returning directly from the generator
          if (shouldReturn) {
            if (shouldReturn instanceof ReturnValue) {
              return shouldReturn.value;
            }
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
      return tryResult.value;
    }
    return tryResult;
  }

  /**
   * Create the native generator that wraps interpreter execution.
   */
  private *createExecutionGenerator(): Generator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    const generatorEnv = new Environment(this.fn.closure, undefined, true);
    this.interpreter.environment = generatorEnv;

    try {
      bindGeneratorParameters(this.fn, this.args, generatorEnv);

      for (const statement of this.fn.body.body) {
        const result = yield* this.executeStatement(statement);

        if (result instanceof ReturnValue) {
          return result.value;
        }
        if (result instanceof BreakValue || result instanceof ContinueValue) {
          throw new InterpreterError(
            "Break/continue outside of loop in generator",
          );
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
    return this.nativeGenerator?.return?.(value) || { done: true, value };
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
  ) {}

  /**
   * Execute a statement in async generator context, yielding any yields recursively.
   */
  private async *executeStatement(
    statement: ESTree.Statement,
  ): AsyncGenerator<any, any, any> {
    if (statement.type === "ForStatement") {
      return yield* this.executeForStatement(statement as ESTree.ForStatement);
    }
    if (statement.type === "WhileStatement") {
      return yield* this.executeWhileStatement(
        statement as ESTree.WhileStatement,
      );
    }
    if (statement.type === "DoWhileStatement") {
      return yield* this.executeDoWhileStatement(
        statement as ESTree.DoWhileStatement,
      );
    }
    if (statement.type === "ForOfStatement") {
      return yield* this.executeForOfStatement(
        statement as ESTree.ForOfStatement,
      );
    }
    if (statement.type === "ForInStatement") {
      return yield* this.executeForInStatement(
        statement as ESTree.ForInStatement,
      );
    }
    if (statement.type === "TryStatement") {
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
    } else if (
      iterable &&
      typeof iterable[Symbol.asyncIterator] === "function"
    ) {
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

        const resumeResult =
          await this.interpreter.evaluateNodeAsync(statement);
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
  private async *executeForStatement(
    node: ESTree.ForStatement,
  ): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        await this.interpreter.evaluateNodeAsync(node.init);
      }

      while (true) {
        if (
          node.test &&
          !(await this.interpreter.evaluateNodeAsync(node.test))
        ) {
          break;
        }

        if (node.body.type === "BlockStatement") {
          const { shouldBreak, shouldReturn, shouldContinue } =
            yield* this.executeBlockBody(
              (node.body as ESTree.BlockStatement).body,
            );
          if (shouldReturn) return shouldReturn;
          if (shouldBreak) break;
          // shouldContinue falls through to update
        } else {
          const result = await this.interpreter.evaluateNodeAsync(node.body);
          const processed = processGeneratorResult(result);
          if (processed.yielded) {
            if (processed.delegate)
              yield* this.delegateYield(processed.yieldValue);
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
  private async *executeWhileStatement(
    node: ESTree.WhileStatement,
  ): AsyncGenerator<any, any, any> {
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
          if (processed.delegate)
            yield* this.delegateYield(processed.yieldValue);
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
          if (processed.delegate)
            yield* this.delegateYield(processed.yieldValue);
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
  private async *executeForOfStatement(
    node: ESTree.ForOfStatement,
  ): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable
      const iterableValue = await this.interpreter.evaluateNodeAsync(
        node.right,
      );

      // Get an iterator from the value (support async iterators too)
      let iterator: Iterator<any> | AsyncIterator<any>;
      let isAsync = false;

      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.asyncIterator] === "function"
      ) {
        iterator = iterableValue[Symbol.asyncIterator]();
        isAsync = true;
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.iterator] === "function"
      ) {
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
          throw new InterpreterError(
            "for...of only supports simple identifiers",
          );
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
          this.interpreter.environment.declare(
            variableName,
            currentValue,
            variableKind!,
          );

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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
  private async *executeForInStatement(
    node: ESTree.ForInStatement,
  ): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = new Environment(previousEnv);

    try {
      // Evaluate the object
      const obj = await this.interpreter.evaluateNodeAsync(node.right);

      if (obj === null || obj === undefined) {
        throw new InterpreterError(
          "for...in requires an object or array, got null/undefined",
        );
      }
      if (typeof obj !== "object") {
        throw new InterpreterError(
          `for...in requires an object or array, got ${typeof obj}`,
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
          throw new InterpreterError(
            "for...in only supports simple identifiers",
          );
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
          this.interpreter.environment.declare(
            variableName,
            key,
            variableKind!,
          );

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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
              if (processed.delegate)
                yield* this.delegateYield(processed.yieldValue);
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
  private async *executeTryStatement(
    node: ESTree.TryStatement,
  ): AsyncGenerator<any, any, any> {
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
            this.interpreter.environment.declare(
              node.handler.param.name,
              error,
              "let",
            );
          }

          // Execute catch block
          if (node.handler.body.type === "BlockStatement") {
            const { shouldReturn } = yield* this.executeBlockBody(
              node.handler.body.body,
            );
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
          const { shouldReturn } = yield* this.executeBlockBody(
            node.finalizer.body,
          );
          // If finally block has a return, it overrides try/catch result
          // Unwrap ReturnValue since we're returning directly from the generator
          if (shouldReturn) {
            if (shouldReturn instanceof ReturnValue) {
              return shouldReturn.value;
            }
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
      return tryResult.value;
    }
    return tryResult;
  }

  /**
   * Create the native async generator that wraps interpreter execution.
   */
  private async *createExecutionGenerator(): AsyncGenerator<any, any, any> {
    const previousEnv = this.interpreter.environment;
    const generatorEnv = new Environment(this.fn.closure, undefined, true);
    this.interpreter.environment = generatorEnv;

    try {
      bindGeneratorParameters(this.fn, this.args, generatorEnv);

      for (const statement of this.fn.body.body) {
        const result = yield* this.executeStatement(statement);

        if (result instanceof ReturnValue) {
          return result.value;
        }
        if (result instanceof BreakValue || result instanceof ContinueValue) {
          throw new InterpreterError(
            "Break/continue outside of loop in generator",
          );
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
    return (
      (await this.nativeGenerator?.return?.(value)) || { done: true, value }
    );
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
  ) {
    // Return a Proxy that blocks property access on host functions
    // This prevents accessing dangerous properties like .constructor, .apply, etc.
    return new Proxy(this, {
      get(target, prop) {
        // Allow access to our public properties
        if (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors"
        ) {
          return target[prop];
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

        // Allow internal properties needed for instanceof checks
        // These are accessed by the JavaScript engine, not user code
        if (typeof prop === "symbol") {
          return (target as any)[prop];
        }

        // Block all other property access for security
        throw new InterpreterError(
          `Cannot access properties on host functions`,
        );
      },

      set() {
        throw new InterpreterError(`Cannot modify host functions`);
      },

      has(target, prop) {
        // Only report our properties as existing
        return (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors"
        );
      },

      ownKeys() {
        // Only expose our properties
        return ["hostFunc", "name", "isAsync", "rethrowErrors"];
      },

      getOwnPropertyDescriptor(target, prop) {
        if (
          prop === "hostFunc" ||
          prop === "name" ||
          prop === "isAsync" ||
          prop === "rethrowErrors"
        ) {
          return Object.getOwnPropertyDescriptor(target, prop);
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
      if (targetEnv.variables.has(name)) {
        const existing = targetEnv.variables.get(name)!;
        if (existing.kind === "var") {
          // Re-declaration with var is allowed, just update the value
          existing.value = value;
          return;
        } else {
          // Cannot redeclare let/const as var
          throw new InterpreterError(
            `Identifier '${name}' has already been declared`,
          );
        }
      }

      // Declare new var in function scope
      targetEnv.variables.set(name, { value, kind, isGlobal });
      return;
    }

    // let and const are block-scoped - check current scope only
    if (this.variables.has(name)) {
      throw new InterpreterError(
        `Variable '${name}' has already been declared`,
      );
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
    return this.parent.findVarScope();
  }

  get(name: string): any {
    if (this.variables.has(name)) {
      return this.variables.get(name)!.value;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new InterpreterError(`Undefined variable '${name}'`);
  }

  set(name: string, value: any): void {
    if (this.variables.has(name)) {
      const variable = this.variables.get(name)!;
      if (variable.kind === "const") {
        throw new InterpreterError(`Cannot assign to const variable '${name}'`);
      }
      variable.value = value;
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
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
    if (this.variables.has(name)) {
      const variable = this.variables.get(name)!;
      if (onlyGlobals && !variable.isGlobal) {
        return false; // Don't override user variables when onlyGlobals is set
      }
      variable.value = value;
      return true;
    }
    if (this.parent) {
      return this.parent.forceSet(name, value, onlyGlobals);
    }
    if (onlyGlobals) {
      return false; // Variable doesn't exist
    }
    throw new InterpreterError(`Undefined variable '${name}'`);
  }

  has(name: string): boolean {
    return this.variables.has(name) || (this.parent?.has(name) ?? false);
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
    // If this environment has a thisValue (not undefined), return it
    if (this.thisValue !== undefined) {
      return this.thisValue;
    }
    // Otherwise, look in the parent environment
    if (this.parent) {
      return this.parent.getThis();
    }
    // No this value found in the chain
    return undefined;
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
  | "UpdateExpression"; // ++ and -- operators

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

export type InterpreterOptions = {
  globals?: Record<string, any>;
  validator?: ASTValidator;
  /**
   * Feature control for targeting specific ECMAScript versions
   * Whitelist: only specified features are allowed
   * Blacklist: all features except specified ones are allowed
   */
  featureControl?: FeatureControl;
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
   * Maximum execution time in milliseconds
   * Throws InterpreterError if exceeded
   */
  timeout?: number;
  /**
   * AbortSignal to allow immediate cancellation
   * Throws InterpreterError when aborted
   */
  signal?: AbortSignal;
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
  private perCallGlobalKeys: Set<string> = new Set(); // Track per-call globals for cleanup
  private overriddenConstructorGlobals: Map<string, any> = new Map(); // Track original values when per-call globals override
  private currentFeatureControl?: FeatureControl; // Active feature control (per-call overrides constructor)

  // Execution control
  private executionStartTime?: number; // Start time for timeout calculation
  private executionTimeout?: number; // Timeout duration in ms
  private abortSignal?: AbortSignal; // Signal for immediate cancellation

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

  constructor(options?: InterpreterOptions) {
    this.environment = new Environment();
    this.constructorGlobals = options?.globals || {};
    this.constructorValidator = options?.validator;
    this.constructorFeatureControl = options?.featureControl;
    // Inject built-in globals that should always be available
    this.injectBuiltinGlobals();
    this.injectGlobals(this.constructorGlobals);
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
            this.overriddenConstructorGlobals.set(
              key,
              this.environment.get(key),
            );
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
    const featureControl =
      this.currentFeatureControl || this.constructorFeatureControl;

    // If no feature control is configured, all features are enabled
    if (!featureControl) {
      return true;
    }

    const isInList = featureControl.features.includes(feature);

    if (featureControl.mode === "whitelist") {
      // Whitelist: only features in the list are enabled
      return isInList;
    } else {
      // Blacklist: all features except those in the list are enabled
      return !isInList;
    }
  }

  /**
   * Check if execution should be aborted due to timeout or abort signal
   * Called at the start of each loop iteration and periodically during evaluation
   */
  private checkExecutionLimits(): void {
    // Check timeout by comparing elapsed time
    if (
      this.executionTimeout !== undefined &&
      this.executionStartTime !== undefined
    ) {
      const elapsed = Date.now() - this.executionStartTime;
      if (elapsed > this.executionTimeout) {
        throw new InterpreterError("Execution timeout exceeded");
      }
    }

    // Check abort signal
    if (this.abortSignal?.aborted) {
      throw new InterpreterError("Execution aborted");
    }
  }

  evaluate(code: string, options?: EvaluateOptions): any {
    // Inject per-call globals if provided (with override capability)
    if (options?.globals) {
      this.injectGlobals(options.globals, true, true);
    }

    // Set per-call feature control if provided
    if (options?.featureControl) {
      this.currentFeatureControl = options.featureControl;
    }

    // Initialize execution control
    this.executionStartTime =
      options?.timeout !== undefined ? Date.now() : undefined;
    this.executionTimeout = options?.timeout;
    this.abortSignal = options?.signal;

    try {
      // Use parseModule to support top-level await in async context
      const ast = parseModule(code, {
        next: true, // Enable newer JavaScript features like async generators
      });

      // Run validator - per-call validator takes precedence over constructor validator
      const validator = options?.validator || this.constructorValidator;
      if (validator) {
        const isValid = validator(ast);
        if (!isValid) {
          throw new InterpreterError(
            "AST validation failed: code is not allowed",
          );
        }
      }

      return this.evaluateNode(ast);
    } finally {
      // Always clean up per-call globals after execution
      if (options?.globals) {
        this.removePerCallGlobals();
      }
      // Clear per-call feature control
      if (options?.featureControl) {
        this.currentFeatureControl = undefined;
      }
      // Clear execution control
      this.executionStartTime = undefined;
      this.executionTimeout = undefined;
      this.abortSignal = undefined;
    }
  }

  async evaluateAsync(code: string, options?: EvaluateOptions): Promise<any> {
    // Inject per-call globals if provided (with override capability)
    if (options?.globals) {
      this.injectGlobals(options.globals, true, true);
    }

    // Set per-call feature control if provided
    if (options?.featureControl) {
      this.currentFeatureControl = options.featureControl;
    }

    // Initialize execution control
    this.executionStartTime =
      options?.timeout !== undefined ? Date.now() : undefined;
    this.executionTimeout = options?.timeout;
    this.abortSignal = options?.signal;

    try {
      // Use parseModule to support top-level await in async context
      const ast = parseModule(code, {
        next: true, // Enable newer JavaScript features like async generators
      });

      // Run validator - per-call validator takes precedence over constructor validator
      const validator = options?.validator || this.constructorValidator;
      if (validator) {
        const isValid = validator(ast);
        if (!isValid) {
          throw new InterpreterError(
            "AST validation failed: code is not allowed",
          );
        }
      }

      return await this.evaluateNodeAsync(ast);
    } finally {
      // Always clean up per-call globals after execution
      if (options?.globals) {
        this.removePerCallGlobals();
      }
      // Clear per-call feature control
      if (options?.featureControl) {
        this.currentFeatureControl = undefined;
      }
      // Clear execution control
      this.executionStartTime = undefined;
      this.executionTimeout = undefined;
      this.abortSignal = undefined;
    }
  }

  // Public for GeneratorValue/AsyncGeneratorValue access. Internal use only.
  public evaluateNode(node: ASTNode): any {
    // Check execution limits periodically
    this.checkExecutionLimits();

    switch (node.type) {
      case "Program":
        return this.evaluateProgram(node as ESTree.Program);

      case "ExpressionStatement":
        return this.evaluateNode(
          (node as ESTree.ExpressionStatement).expression,
        );

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
        return this.evaluateConditionalExpression(
          node as ESTree.ConditionalExpression,
        );

      case "AssignmentExpression":
        return this.evaluateAssignmentExpression(
          node as ESTree.AssignmentExpression,
        );

      case "VariableDeclaration":
        return this.evaluateVariableDeclaration(
          node as ESTree.VariableDeclaration,
        );

      case "BlockStatement":
        return this.evaluateBlockStatement(node as ESTree.BlockStatement);

      case "IfStatement":
        return this.evaluateIfStatement(node as ESTree.IfStatement);

      case "WhileStatement":
        return this.evaluateWhileStatement(node as ESTree.WhileStatement);

      case "ForStatement":
        return this.evaluateForStatement(node as ESTree.ForStatement);

      case "ForOfStatement":
        return this.evaluateForOfStatement(node as ESTree.ForOfStatement);

      case "ForInStatement":
        return this.evaluateForInStatement(node as ESTree.ForInStatement);

      case "SwitchStatement":
        return this.evaluateSwitchStatement(node as ESTree.SwitchStatement);

      case "FunctionDeclaration":
        return this.evaluateFunctionDeclaration(
          node as ESTree.FunctionDeclaration,
        );

      case "FunctionExpression":
        return this.evaluateFunctionExpression(
          node as ESTree.FunctionExpression,
        );

      case "ArrowFunctionExpression":
        return this.evaluateArrowFunctionExpression(
          node as ESTree.ArrowFunctionExpression,
        );

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

      default:
        throw new InterpreterError(`Unsupported node type: ${node.type}`);
    }
  }

  // Public for GeneratorValue/AsyncGeneratorValue access. Internal use only.
  public async evaluateNodeAsync(node: ASTNode): Promise<any> {
    // Check execution limits periodically
    this.checkExecutionLimits();

    switch (node.type) {
      case "Program":
        return await this.evaluateProgramAsync(node as ESTree.Program);

      case "ExpressionStatement":
        return await this.evaluateNodeAsync(
          (node as ESTree.ExpressionStatement).expression,
        );

      case "Literal":
        return this.evaluateLiteral(node as ESTree.Literal);

      case "Identifier":
        return this.evaluateIdentifier(node as ESTree.Identifier);

      case "ThisExpression":
        return this.evaluateThisExpression(node as ESTree.ThisExpression);

      case "BinaryExpression":
        return await this.evaluateBinaryExpressionAsync(
          node as ESTree.BinaryExpression,
        );

      case "UnaryExpression":
        return await this.evaluateUnaryExpressionAsync(
          node as ESTree.UnaryExpression,
        );

      case "UpdateExpression":
        // UpdateExpression (++/--) only works on identifiers - no async needed
        return this.evaluateUpdateExpression(node as ESTree.UpdateExpression);

      case "LogicalExpression":
        return await this.evaluateLogicalExpressionAsync(
          node as ESTree.LogicalExpression,
        );

      case "ConditionalExpression":
        return await this.evaluateConditionalExpressionAsync(
          node as ESTree.ConditionalExpression,
        );

      case "AssignmentExpression":
        return await this.evaluateAssignmentExpressionAsync(
          node as ESTree.AssignmentExpression,
        );

      case "VariableDeclaration":
        return await this.evaluateVariableDeclarationAsync(
          node as ESTree.VariableDeclaration,
        );

      case "BlockStatement":
        return await this.evaluateBlockStatementAsync(
          node as ESTree.BlockStatement,
        );

      case "IfStatement":
        return await this.evaluateIfStatementAsync(node as ESTree.IfStatement);

      case "WhileStatement":
        return await this.evaluateWhileStatementAsync(
          node as ESTree.WhileStatement,
        );

      case "ForStatement":
        return await this.evaluateForStatementAsync(
          node as ESTree.ForStatement,
        );

      case "ForOfStatement":
        return await this.evaluateForOfStatementAsync(
          node as ESTree.ForOfStatement,
        );

      case "ForInStatement":
        return await this.evaluateForInStatementAsync(
          node as ESTree.ForInStatement,
        );

      case "SwitchStatement":
        return await this.evaluateSwitchStatementAsync(
          node as ESTree.SwitchStatement,
        );

      case "FunctionDeclaration":
        // Function declarations are sync - just reuse the sync version
        return this.evaluateFunctionDeclaration(
          node as ESTree.FunctionDeclaration,
        );

      case "FunctionExpression":
        // Function expressions are sync - just reuse the sync version
        return this.evaluateFunctionExpression(
          node as ESTree.FunctionExpression,
        );

      case "ArrowFunctionExpression":
        // Arrow functions are sync - just reuse the sync version
        return this.evaluateArrowFunctionExpression(
          node as ESTree.ArrowFunctionExpression,
        );

      case "ReturnStatement":
        return await this.evaluateReturnStatementAsync(
          node as ESTree.ReturnStatement,
        );

      case "AwaitExpression":
        return await this.evaluateAwaitExpressionAsync(
          node as ESTree.AwaitExpression,
        );

      case "YieldExpression":
        return await this.evaluateYieldExpressionAsync(
          node as ESTree.YieldExpression,
        );

      case "BreakStatement":
        return this.evaluateBreakStatement(node as ESTree.BreakStatement);

      case "ContinueStatement":
        return this.evaluateContinueStatement(node as ESTree.ContinueStatement);

      case "ThrowStatement":
        return await this.evaluateThrowStatementAsync(
          node as ESTree.ThrowStatement,
        );

      case "TryStatement":
        return await this.evaluateTryStatementAsync(
          node as ESTree.TryStatement,
        );

      case "CallExpression":
        return await this.evaluateCallExpressionAsync(
          node as ESTree.CallExpression,
        );

      case "NewExpression":
        return await this.evaluateNewExpressionAsync(
          node as ESTree.NewExpression,
        );

      case "MemberExpression":
        return await this.evaluateMemberExpressionAsync(
          node as ESTree.MemberExpression,
        );

      case "ArrayExpression":
        return await this.evaluateArrayExpressionAsync(
          node as ESTree.ArrayExpression,
        );

      case "ObjectExpression":
        return await this.evaluateObjectExpressionAsync(
          node as ESTree.ObjectExpression,
        );

      case "TemplateLiteral":
        return await this.evaluateTemplateLiteralAsync(
          node as ESTree.TemplateLiteral,
        );

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
    return node.value;
  }

  private evaluateIdentifier(node: ESTree.Identifier): any {
    return this.environment.get(node.name);
  }

  private evaluateThisExpression(node: ESTree.ThisExpression): any {
    if (!this.isFeatureEnabled("ThisExpression")) {
      throw new InterpreterError("ThisExpression is not enabled");
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
      throw new InterpreterError(
        "Update expression can only be used with numbers",
      );
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
   * Handles both regular parameters and rest parameters.
   * This core logic is shared between sync and async function calls.
   */
  private bindFunctionParameters(fn: FunctionValue, args: any[]): void {
    const regularParamCount =
      fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

    // Bind regular parameters
    for (let i = 0; i < regularParamCount; i++) {
      this.environment.declare(fn.params[i]!, args[i], "let");
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
   * Throws if too few arguments are provided.
   * This core logic is shared between sync and async function calls.
   */
  private validateFunctionArguments(fn: FunctionValue, args: any[]): void {
    const regularParamCount =
      fn.restParamIndex !== null ? fn.restParamIndex : fn.params.length;

    if (args.length < regularParamCount) {
      throw new InterpreterError(
        `Expected at least ${regularParamCount} arguments but got ${args.length}`,
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
        // Coerce to string (matches JavaScript behavior: undefined → "undefined", etc.)
        result += String(exprValue);
      }
    }

    return result;
  }

  /**
   * Validates variable declaration kind and checks for unsupported 'var'.
   * This core logic is shared between sync and async variable declaration evaluation.
   */
  private validateVariableDeclarationKind(kind: string): void {
    if (kind !== "let" && kind !== "const" && kind !== "var") {
      throw new InterpreterError(
        `Unsupported variable declaration kind: ${kind}`,
      );
    }
  }

  /**
   * Validates const declaration has an initializer.
   * This core logic is shared between sync and async variable declaration evaluation.
   */
  private validateConstInitializer(
    declarator: ESTree.VariableDeclarator,
    kind: string,
  ): void {
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
  private handleLoopControlFlow(result: any): {
    shouldReturn: boolean;
    value: any;
  } {
    // If we hit a return statement, propagate it up
    if (result instanceof ReturnValue) {
      return { shouldReturn: true, value: result };
    }

    // If we hit a break statement, exit the loop (return undefined)
    if (result instanceof BreakValue) {
      return { shouldReturn: true, value: undefined };
    }

    // If we hit a continue statement, continue to next iteration
    if (result instanceof ContinueValue) {
      return { shouldReturn: false, value: result };
    }

    // Normal result - continue execution
    return { shouldReturn: false, value: result };
  }

  /**
   * Extracts for-of loop variable information from the left-hand side.
   * Handles both declarations (for (let x of arr)) and existing variables (for (x of arr)).
   * Returns the variable name, whether it's a declaration, and the variable kind.
   */
  private extractForOfVariable(left: ESTree.ForOfStatement["left"]): {
    variableName: string;
    isDeclaration: boolean;
    variableKind?: "let" | "const";
  } {
    if (left.type === "VariableDeclaration") {
      const decl = left.declarations[0];
      if (decl?.id.type !== "Identifier") {
        throw new InterpreterError("Unsupported for...of variable pattern");
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
    if (
      typeof spreadValue !== "object" ||
      spreadValue === null ||
      Array.isArray(spreadValue)
    ) {
      throw new InterpreterError("Spread syntax in objects requires an object");
    }
  }

  /**
   * Extracts a property key from an object property.
   * Handles both Identifier keys and Literal keys.
   * Returns the string key to use in the resulting object.
   */
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
  private getCatchParameterName(
    handler: ESTree.CatchClause | null | undefined,
  ): string | null {
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
  private validateMemberAccess(object: any): void {
    if (object instanceof HostFunctionValue) {
      throw new InterpreterError("Cannot access properties on host functions");
    }
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
    const propName = String(property);
    validatePropertyName(propName); // Security: prevent prototype pollution
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
    const evaluatedArgs: any[] = [];
    for (const arg of args) {
      if (arg.type === "SpreadElement") {
        // Spread in call: fn(...arr) - expand array as separate arguments
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = this.evaluateNode(
          (arg as ESTree.SpreadElement).argument,
        );
        if (!Array.isArray(spreadValue)) {
          throw new InterpreterError(
            "Spread syntax in function calls requires an array",
          );
        }
        evaluatedArgs.push(...spreadValue);
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
  private async evaluateArgumentsAsync(
    args: ESTree.CallExpression["arguments"],
  ): Promise<any[]> {
    const evaluatedArgs: any[] = [];
    for (const arg of args) {
      if (arg.type === "SpreadElement") {
        // Spread in call: fn(...arr) - expand array as separate arguments
        if (!this.isFeatureEnabled("SpreadOperator")) {
          throw new InterpreterError("SpreadOperator is not enabled");
        }

        const spreadValue = await this.evaluateNodeAsync(
          (arg as ESTree.SpreadElement).argument,
        );
        if (!Array.isArray(spreadValue)) {
          throw new InterpreterError(
            "Spread syntax in function calls requires an array",
          );
        }
        evaluatedArgs.push(...spreadValue);
      } else {
        evaluatedArgs.push(
          await this.evaluateNodeAsync(arg as ESTree.Expression),
        );
      }
    }
    return evaluatedArgs;
  }

  /**
   * Executes a sandbox function (synchronous version).
   * Sets up environment, binds parameters, executes body, and unwraps return value.
   */
  private executeSandboxFunction(
    fn: FunctionValue,
    args: any[],
    thisValue: any,
  ): any {
    const previousEnvironment = this.environment;
    this.environment = new Environment(fn.closure, thisValue, true);

    try {
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
    const previousEnvironment = this.environment;
    this.environment = new Environment(fn.closure, thisValue, true);

    try {
      // Bind parameters to arguments
      this.bindFunctionParameters(fn, args);

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
    }
  }

  /**
   * Validates that a value is a valid constructor (FunctionValue or HostFunctionValue).
   */
  private validateConstructor(constructor: any): void {
    if (
      !(
        constructor instanceof FunctionValue ||
        constructor instanceof HostFunctionValue
      )
    ) {
      throw new InterpreterError("Constructor must be a function");
    }
  }

  /**
   * Determines the final return value for a constructor.
   * If constructor explicitly returns an object, use that.
   * Otherwise, return the instance.
   */
  private resolveConstructorReturn(result: any, instance: object): any {
    if (typeof result === "object" && result !== null) {
      return result;
    }
    return instance;
  }

  /**
   * Executes a host function constructor (synchronous).
   */
  private executeHostConstructor(
    constructor: HostFunctionValue,
    args: any[],
    instance: object,
  ): any {
    try {
      return constructor.hostFunc.apply(instance, args);
    } catch (error: any) {
      throw new InterpreterError(`Constructor threw error: ${error.message}`);
    }
  }

  /**
   * Executes a host function constructor (asynchronous).
   */
  private async executeHostConstructorAsync(
    constructor: HostFunctionValue,
    args: any[],
    instance: object,
  ): Promise<any> {
    try {
      const result = constructor.hostFunc.apply(instance, args);
      // If async host function, await the result
      if (constructor.isAsync) {
        return await result;
      }
      return result;
    } catch (error: any) {
      throw new InterpreterError(`Constructor threw error: ${error.message}`);
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
    if (memberExpr.computed) {
      return obj[String(propertyValue)];
    } else {
      if (memberExpr.property.type !== "Identifier") {
        throw new InterpreterError("Invalid method access");
      }
      const property = (memberExpr.property as ESTree.Identifier).name;
      return obj[property];
    }
  }

  private evaluateBinaryExpression(node: ESTree.BinaryExpression): any {
    if (!this.isFeatureEnabled("BinaryOperators")) {
      throw new InterpreterError("BinaryOperators is not enabled");
    }

    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);
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
      if (
        error instanceof InterpreterError &&
        error.message.includes("Undefined variable")
      ) {
        return "undefined";
      }
      throw error;
    }
  }

  private evaluateUpdateExpression(node: ESTree.UpdateExpression): any {
    if (!this.isFeatureEnabled("UpdateExpression")) {
      throw new InterpreterError("UpdateExpression is not enabled");
    }

    // UpdateExpression handles ++ and -- operators (both prefix and postfix)
    if (node.argument.type !== "Identifier") {
      throw new InterpreterError(
        "Update expression must operate on an identifier",
      );
    }

    const identifier = node.argument as ESTree.Identifier;
    const name = identifier.name;
    const currentValue = this.environment.get(name);

    const [newValue, returnValue] = this.applyUpdateOperator(
      node.operator,
      currentValue,
      node.prefix,
    );

    // Update the variable with the new value
    this.environment.set(name, newValue);

    return returnValue;
  }

  private evaluateLogicalExpression(node: ESTree.LogicalExpression): any {
    if (!this.isFeatureEnabled("LogicalOperators")) {
      throw new InterpreterError("LogicalOperators is not enabled");
    }

    const left = this.evaluateNode(node.left);

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
        throw new InterpreterError(
          `Unsupported logical operator: ${node.operator}`,
        );
    }
  }

  private evaluateConditionalExpression(
    node: ESTree.ConditionalExpression,
  ): any {
    if (!this.isFeatureEnabled("ConditionalExpression")) {
      throw new InterpreterError("ConditionalExpression is not enabled");
    }

    // Evaluate the test condition
    const testValue = this.evaluateNode(node.test);

    // Return consequent if truthy, alternate if falsy
    if (testValue) {
      return this.evaluateNode(node.consequent);
    } else {
      return this.evaluateNode(node.alternate);
    }
  }

  private evaluateAssignmentExpression(node: ESTree.AssignmentExpression): any {
    // Handle logical assignment operators (||=, &&=, ??=) with short-circuit evaluation
    if (
      node.operator === "||=" ||
      node.operator === "&&=" ||
      node.operator === "??="
    ) {
      return this.evaluateLogicalAssignment(node);
    }

    if (node.operator !== "=") {
      throw new InterpreterError(
        `Unsupported assignment operator: ${node.operator}`,
      );
    }

    const value = this.evaluateNode(node.right);

    // Handle destructuring assignments
    if (
      node.left.type === "ArrayPattern" ||
      node.left.type === "ObjectPattern"
    ) {
      this.destructurePattern(node.left, value, false);
      return value;
    }

    // Handle member expression assignment: arr[index] = value or obj.prop = value
    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object = this.evaluateNode(memberExpr.object);

      // Block property assignment on host functions
      if (object instanceof HostFunctionValue) {
        throw new InterpreterError(
          "Cannot assign properties on host functions",
        );
      }

      if (memberExpr.computed) {
        // Computed property: arr[index] = value or obj["key"] = value
        const property = this.evaluateNode(memberExpr.property);

        if (Array.isArray(object)) {
          // Array element assignment: arr[i] = value
          // Convert string to number if it's a numeric string (needed because for...in gives string indices)
          const index =
            typeof property === "string" ? Number(property) : property;

          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = value;
          return value;
        } else if (typeof object === "object" && object !== null) {
          // Object computed property assignment: obj["key"] = value or obj[expr] = value
          const propName = String(property);
          validatePropertyName(propName); // Security: prevent prototype pollution
          object[propName] = value;
          return value;
        } else {
          throw new InterpreterError(
            "Assignment target is not an array or object",
          );
        }
      } else {
        // Dot notation: obj.prop = value
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }

        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property); // Security: prevent prototype pollution

        if (
          typeof object === "object" &&
          object !== null &&
          !Array.isArray(object)
        ) {
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
      currentValue = this.environment.get(
        (node.left as ESTree.Identifier).name,
      );
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object = this.evaluateNode(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError(
          "Cannot access properties on host functions",
        );
      }

      if (memberExpr.computed) {
        const property = this.evaluateNode(memberExpr.property);
        const propName = Array.isArray(object)
          ? typeof property === "string"
            ? Number(property)
            : property
          : String(property);
        currentValue = object[propName];
      } else {
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        currentValue = object[property];
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
        throw new InterpreterError(
          `Unsupported logical assignment operator: ${node.operator}`,
        );
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
      const object = this.evaluateNode(memberExpr.object);

      if (memberExpr.computed) {
        const property = this.evaluateNode(memberExpr.property);
        if (Array.isArray(object)) {
          const index =
            typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = newValue;
        } else if (typeof object === "object" && object !== null) {
          const propName = String(property);
          validatePropertyName(propName);
          object[propName] = newValue;
        }
      } else {
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        object[property] = newValue;
      }
    }

    return newValue;
  }

  private evaluateVariableDeclaration(node: ESTree.VariableDeclaration): any {
    const kind = node.kind as "let" | "const" | "var";

    // Check feature enablement based on declaration kind
    if (
      (kind === "let" || kind === "const") &&
      !this.isFeatureEnabled("LetConst")
    ) {
      throw new InterpreterError("LetConst is not enabled");
    }
    if (!this.isFeatureEnabled("VariableDeclarations")) {
      throw new InterpreterError("VariableDeclarations is not enabled");
    }

    this.validateVariableDeclarationKind(kind);

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      // Handle destructuring patterns
      if (
        declarator.id.type === "ArrayPattern" ||
        declarator.id.type === "ObjectPattern"
      ) {
        // Destructuring declaration
        if (declarator.init === null) {
          throw new InterpreterError(
            "Destructuring declaration must have an initializer",
          );
        }

        const value = this.evaluateNode(declarator.init);
        this.destructurePattern(declarator.id, value, true, kind);
        lastValue = value;
        continue;
      }

      // Handle simple identifier
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError(
          `Unsupported declaration pattern: ${declarator.id.type}`,
        );
      }

      const name = (declarator.id as ESTree.Identifier).name;

      // When resuming from a yield, skip variables that have already been declared
      // (their values have already been assigned from the yield expression)
      if (this.isResumingFromYield && this.environment.has(name)) {
        // The variable was already declared in the first evaluation pass.
        // The yield expression already returned the received value which was assigned.
        // Just evaluate the init (which will return the received value) but don't redeclare.
        const value = declarator.init
          ? this.evaluateNode(declarator.init)
          : undefined;
        // Use forceSet to update even const variables during yield resumption
        this.environment.forceSet(name, value);
        lastValue = value;
        continue;
      }

      const value = declarator.init
        ? this.evaluateNode(declarator.init)
        : undefined;

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

    let result: any = undefined;

    while (this.evaluateNode(node.test)) {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();

      result = this.evaluateNode(node.body);

      const controlFlow = this.handleLoopControlFlow(result);
      if (controlFlow.shouldReturn) {
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    }

    return result;
  }

  private evaluateForStatement(node: ESTree.ForStatement): any {
    if (!this.isFeatureEnabled("ForStatement")) {
      throw new InterpreterError("ForStatement is not enabled");
    }

    // Create a new environment for the for loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the init expression (e.g., let i = 0)
      if (node.init) {
        this.evaluateNode(node.init);
      }

      let result: any = undefined;

      // Loop while test condition is true
      while (true) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

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
          return undefined;
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
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.iterator] === "function"
      ) {
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
      const { variableName, isDeclaration, variableKind } =
        this.extractForOfVariable(node.left);

      let result: any = undefined;

      // Iterate using the iterator protocol
      let iterResult = iterator.next();
      while (!iterResult.done) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

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

          // Declare the variable with the current element
          this.environment.declare(variableName, currentValue, variableKind!);

          // Execute loop body
          result = this.evaluateNode(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables (for (x of arr)), just reassign in the current scope
          // No new scope needed since we're updating an existing variable
          this.environment.set(variableName, currentValue);

          // Execute loop body
          result = this.evaluateNode(node.body);
        }

        // Handle control flow
        if (result instanceof BreakValue) {
          // Call iterator.return() to allow cleanup (e.g., finally blocks in generators)
          if (typeof iterator.return === "function") {
            iterator.return();
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
        // ContinueValue just continues to the next iteration

        // Get next value
        iterResult = iterator.next();
      }

      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
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

    // Create a new environment for the for...in loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the object (right side)
      const obj = this.evaluateNode(node.right);

      // Check if obj is an object or array
      if (obj === null || obj === undefined) {
        throw new InterpreterError(
          "for...in requires an object or array, got null/undefined",
        );
      }

      if (typeof obj !== "object") {
        throw new InterpreterError(
          `for...in requires an object or array, got ${typeof obj}`,
        );
      }

      // Extract variable information
      const { variableName, isDeclaration, variableKind } =
        this.extractForInVariable(node.left);

      let result: any = undefined;

      // Iterate over object keys (own enumerable properties)
      // Use Object.keys to get own enumerable property names
      const keys = Object.keys(obj);

      for (const key of keys) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

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
        const controlFlow = this.handleLoopControlFlow(result);
        if (controlFlow.shouldReturn) {
          return controlFlow.value;
        }
      }

      return result;
    } finally {
      // Restore the previous environment
      this.environment = previousEnv;
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
            throw new InterpreterError(
              "Continue statement not allowed in switch statement",
            );
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

    if (!node.id) {
      throw new InterpreterError("Function declaration must have a name");
    }

    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const name = node.id.name;
    const params: string[] = [];
    let restParamIndex: number | null = null;

    for (let i = 0; i < node.params.length; i++) {
      const param = node.params[i];

      if (!param) {
        continue;
      }

      if (param.type === "RestElement") {
        // Rest parameter: ...args
        if (!this.isFeatureEnabled("RestParameters")) {
          throw new InterpreterError("RestParameters is not enabled");
        }

        if (i !== node.params.length - 1) {
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
      } else {
        throw new InterpreterError("Destructuring parameters not supported");
      }
    }

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

    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const params: string[] = [];
    let restParamIndex: number | null = null;

    for (let i = 0; i < node.params.length; i++) {
      const param = node.params[i];

      if (!param) {
        continue;
      }

      if (param.type === "RestElement") {
        // Rest parameter: ...args
        if (!this.isFeatureEnabled("RestParameters")) {
          throw new InterpreterError("RestParameters is not enabled");
        }

        if (i !== node.params.length - 1) {
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
      } else {
        throw new InterpreterError("Destructuring parameters not supported");
      }
    }

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
    );
  }

  private evaluateArrowFunctionExpression(
    node: ESTree.ArrowFunctionExpression,
  ): any {
    if (!this.isFeatureEnabled("ArrowFunctions")) {
      throw new InterpreterError("ArrowFunctions is not enabled");
    }

    if (node.async && !this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }

    const params: string[] = [];
    let restParamIndex: number | null = null;

    for (let i = 0; i < node.params.length; i++) {
      const param = node.params[i];

      if (!param) {
        continue;
      }

      if (param.type === "RestElement") {
        // Rest parameter: ...args
        if (!this.isFeatureEnabled("RestParameters")) {
          throw new InterpreterError("RestParameters is not enabled");
        }

        if (i !== node.params.length - 1) {
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
      } else {
        throw new InterpreterError("Destructuring parameters not supported");
      }
    }

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

  private evaluateBreakStatement(node: ESTree.BreakStatement): any {
    if (!this.isFeatureEnabled("BreakStatement")) {
      throw new InterpreterError("BreakStatement is not enabled");
    }

    if (node.label) {
      throw new InterpreterError("Labeled break statements are not supported");
    }
    return new BreakValue();
  }

  private evaluateContinueStatement(node: ESTree.ContinueStatement): any {
    if (!this.isFeatureEnabled("ContinueStatement")) {
      throw new InterpreterError("ContinueStatement is not enabled");
    }

    if (node.label) {
      throw new InterpreterError(
        "Labeled continue statements are not supported",
      );
    }
    return new ContinueValue();
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
    throw new InterpreterError(`Uncaught ${String(value)}`);
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
          const paramName = this.getCatchParameterName(node.handler);
          if (paramName) {
            this.environment.declare(paramName, error, "let");
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
          return finallyResult;
        }
      }
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
        this.bindDestructuredIdentifier(
          element.name,
          elementValue,
          declare,
          kind,
        );
      } else if (
        element.type === "ArrayPattern" ||
        element.type === "ObjectPattern"
      ) {
        // Nested destructuring: [a, [b, c]] or [a, {x, y}]
        // Recursively destructure the nested pattern
        this.destructurePattern(element, elementValue, declare, kind);
      } else if (element.type === "RestElement") {
        // Rest element: [...rest] - collect remaining array elements
        const restName = this.getRestElementName(element);
        // Collect all remaining elements from current position
        const remainingValues = value.slice(i);
        this.bindDestructuredIdentifier(
          restName,
          remainingValues,
          declare,
          kind,
        );

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
          this.bindDestructuredIdentifier(
            target.name,
            propValue,
            declare,
            kind,
          );
        } else if (target.type === "AssignmentPattern") {
          // Default value: {x = 5} - use 5 if propValue is undefined
          this.handleAssignmentPattern(target, propValue, declare, kind);
        } else if (
          target.type === "ArrayPattern" ||
          target.type === "ObjectPattern"
        ) {
          // Nested destructuring: {a: {b}} or {a: [x, y]}
          // Recursively destructure the nested pattern
          this.destructurePattern(target, propValue, declare, kind);
        } else {
          throw new InterpreterError(
            `Unsupported object pattern value: ${target.type}`,
          );
        }
      } else {
        throw new InterpreterError(
          `Unsupported object pattern property: ${property.type}`,
        );
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
      throw new InterpreterError(
        "Assignment pattern must have a default value",
      );
    }
    const finalValue =
      value === undefined ? this.evaluateNode(defaultExpr) : value;

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

    // Determine if this is a method call (obj.method()) or regular call
    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      // Method call: obj.method() - need to bind 'this'
      const memberExpr = node.callee as ESTree.MemberExpression;
      thisValue = this.evaluateNode(memberExpr.object); // The object becomes 'this'

      // For arrays, strings, generators, and async generators, use evaluateMemberExpression
      // to get HostFunctionValue wrappers
      if (
        Array.isArray(thisValue) ||
        typeof thisValue === "string" ||
        thisValue instanceof GeneratorValue ||
        thisValue instanceof AsyncGeneratorValue
      ) {
        callee = this.evaluateMemberExpression(memberExpr);
      } else {
        // Get the method from the object
        const property = memberExpr.computed
          ? this.evaluateNode(memberExpr.property)
          : null;
        callee = this.getObjectProperty(thisValue, memberExpr, property);
      }
    } else {
      // Regular function call - no 'this' binding
      callee = this.evaluateNode(node.callee);
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

      // Call the host function
      try {
        return callee.hostFunc(...args);
      } catch (error: any) {
        // If rethrowErrors is true, propagate the error directly (used by generator.throw())
        if (callee.rethrowErrors) {
          throw error;
        }
        throw new InterpreterError(
          `Host function '${callee.name}' threw error: ${error.message}`,
        );
      }
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
        throw new InterpreterError(
          "Cannot call async generator in synchronous evaluate(). Use evaluateAsync() instead.",
        );
      }
      return new GeneratorValue(callee, args, this);
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

    // 3. Create new instance object
    const instance: Record<string, any> = {};

    // 4. Evaluate arguments
    const args = this.evaluateArguments(node.arguments);

    // 5. Call constructor based on type
    let result: any;

    if (constructor instanceof HostFunctionValue) {
      // Host function constructor
      result = this.executeHostConstructor(constructor, args, instance);
    } else {
      // Sandbox function constructor
      const callee = constructor as FunctionValue;

      // Validate argument count
      this.validateFunctionArguments(callee, args);

      // Execute with instance as 'this'
      result = this.executeSandboxFunction(callee, args, instance);
    }

    // 6. Return object or constructor's returned object
    return this.resolveConstructorReturn(result, instance);
  }

  private evaluateMemberExpression(node: ESTree.MemberExpression): any {
    if (!this.isFeatureEnabled("MemberExpression")) {
      throw new InterpreterError("MemberExpression is not enabled");
    }

    const object = this.evaluateNode(node.object);

    // Block property access on host functions
    this.validateMemberAccess(object);

    if (node.computed) {
      // obj[expr] - computed property access (array indexing or object bracket notation)
      const property = this.evaluateNode(node.property);

      // Handle array indexing
      if (Array.isArray(object)) {
        return this.accessArrayElement(object, property);
      }

      // Handle object computed property access: obj["key"]
      if (typeof object === "object" && object !== null) {
        return this.accessObjectProperty(object, property);
      }

      throw new InterpreterError(
        "Computed property access requires an array or object",
      );
    } else {
      // obj.prop - direct property access
      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      validatePropertyName(property); // Security: prevent prototype pollution

      // Handle .length for strings and arrays
      const length = this.getLengthProperty(object, property);
      if (length !== null) {
        return length;
      }

      // Handle generator methods (next, return, throw)
      if (object instanceof GeneratorValue) {
        if (property === "next") {
          return new HostFunctionValue(object.next.bind(object), "next", false);
        }
        if (property === "return") {
          return new HostFunctionValue(
            object.return.bind(object),
            "return",
            false,
          );
        }
        if (property === "throw") {
          // rethrowErrors: true - errors from throw() should propagate directly
          return new HostFunctionValue(
            object.throw.bind(object),
            "throw",
            false,
            true,
          );
        }
        throw new InterpreterError(
          `Generator method '${property}' not supported`,
        );
      }

      // Handle async generator methods
      if (object instanceof AsyncGeneratorValue) {
        if (property === "next") {
          return new HostFunctionValue(object.next.bind(object), "next", true);
        }
        if (property === "return") {
          return new HostFunctionValue(
            object.return.bind(object),
            "return",
            true,
          );
        }
        if (property === "throw") {
          // rethrowErrors: true - errors from throw() should propagate directly
          return new HostFunctionValue(
            object.throw.bind(object),
            "throw",
            true,
            true,
          );
        }
        throw new InterpreterError(
          `Async generator method '${property}' not supported`,
        );
      }

      // Handle array methods
      if (Array.isArray(object)) {
        const arrayMethod = this.getArrayMethod(object, property);
        if (arrayMethod) {
          return arrayMethod;
        }
        throw new InterpreterError(`Array method '${property}' not supported`);
      }

      // Handle string methods
      if (typeof object === "string") {
        const stringMethod = this.getStringMethod(object, property);
        if (stringMethod) {
          return stringMethod;
        }
        throw new InterpreterError(`String method '${property}' not supported`);
      }

      // Handle object property access
      if (
        typeof object === "object" &&
        object !== null &&
        !Array.isArray(object)
      ) {
        return object[property];
      }

      throw new InterpreterError(`Property '${property}' not supported`);
    }
  }

  /**
   * Get an array method as a HostFunctionValue
   * Returns null if the method is not supported
   */
  private getArrayMethod(
    arr: any[],
    methodName: string,
  ): HostFunctionValue | null {
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
        return new HostFunctionValue(
          (...items: any[]) => arr.concat(...items),
          "concat",
          false,
        );

      case "indexOf":
        return new HostFunctionValue(
          (searchElement: any, fromIndex?: number) =>
            arr.indexOf(searchElement, fromIndex),
          "indexOf",
          false,
        );

      case "includes":
        return new HostFunctionValue(
          (searchElement: any, fromIndex?: number) =>
            arr.includes(searchElement, fromIndex),
          "includes",
          false,
        );

      case "join":
        return new HostFunctionValue(
          (separator?: string) => arr.join(separator),
          "join",
          false,
        );

      case "reverse":
        return new HostFunctionValue(() => arr.reverse(), "reverse", false);

      // Higher-order methods - these need special handling to evaluate sandbox functions
      case "map":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("map callback must be a function");
            }
            const result: any[] = [];
            for (let i = 0; i < arr.length; i++) {
              // Call the sandbox function with (element, index, array)
              const value = this.callSandboxFunction(callback, undefined, [
                arr[i],
                i,
                arr,
              ]);
              result.push(value);
            }
            return result;
          },
          "map",
          false,
        );

      case "filter":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("filter callback must be a function");
            }
            const result: any[] = [];
            for (let i = 0; i < arr.length; i++) {
              const shouldInclude = this.callSandboxFunction(
                callback,
                undefined,
                [arr[i], i, arr],
              );
              if (shouldInclude) {
                result.push(arr[i]);
              }
            }
            return result;
          },
          "filter",
          false,
        );

      case "reduce":
        return new HostFunctionValue(
          (callback: FunctionValue, initialValue?: any) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("reduce callback must be a function");
            }
            let accumulator = initialValue;
            let startIndex = 0;

            // If no initial value, use first element as accumulator
            if (initialValue === undefined) {
              if (arr.length === 0) {
                throw new InterpreterError(
                  "Reduce of empty array with no initial value",
                );
              }
              accumulator = arr[0];
              startIndex = 1;
            }

            for (let i = startIndex; i < arr.length; i++) {
              accumulator = this.callSandboxFunction(callback, undefined, [
                accumulator,
                arr[i],
                i,
                arr,
              ]);
            }
            return accumulator;
          },
          "reduce",
          false,
        );

      case "find":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("find callback must be a function");
            }
            for (let i = 0; i < arr.length; i++) {
              const matches = this.callSandboxFunction(callback, undefined, [
                arr[i],
                i,
                arr,
              ]);
              if (matches) {
                return arr[i];
              }
            }
            return undefined;
          },
          "find",
          false,
        );

      case "findIndex":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError(
                "findIndex callback must be a function",
              );
            }
            for (let i = 0; i < arr.length; i++) {
              const matches = this.callSandboxFunction(callback, undefined, [
                arr[i],
                i,
                arr,
              ]);
              if (matches) {
                return i;
              }
            }
            return -1;
          },
          "findIndex",
          false,
        );

      case "every":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("every callback must be a function");
            }
            for (let i = 0; i < arr.length; i++) {
              const result = this.callSandboxFunction(callback, undefined, [
                arr[i],
                i,
                arr,
              ]);
              if (!result) {
                return false;
              }
            }
            return true;
          },
          "every",
          false,
        );

      case "some":
        return new HostFunctionValue(
          (callback: FunctionValue) => {
            if (!(callback instanceof FunctionValue)) {
              throw new InterpreterError("some callback must be a function");
            }
            for (let i = 0; i < arr.length; i++) {
              const result = this.callSandboxFunction(callback, undefined, [
                arr[i],
                i,
                arr,
              ]);
              if (result) {
                return true;
              }
            }
            return false;
          },
          "some",
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
  private getStringMethod(
    str: string,
    methodName: string,
  ): HostFunctionValue | null {
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
   * Helper to call a sandbox function (used by array methods)
   */
  private callSandboxFunction(
    func: FunctionValue,
    thisValue: any,
    args: any[],
  ): any {
    // Save and restore environment
    const previousEnvironment = this.environment;
    this.environment = new Environment(func.closure, thisValue, true);

    try {
      // Bind parameters
      for (let i = 0; i < func.params.length && i < args.length; i++) {
        this.environment.declare(func.params[i]!, args[i], "let");
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

        const spreadValue = this.evaluateNode(
          (element as ESTree.SpreadElement).argument,
        );
        const spreadArray = this.validateArraySpread(spreadValue);
        elements.push(...spreadArray);
      } else {
        elements.push(this.evaluateNode(element));
      }
    }

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

        const spreadValue = this.evaluateNode(
          (property as ESTree.SpreadElement).argument,
        );
        this.validateObjectSpread(spreadValue);

        // Merge properties from spread object
        for (const [key, value] of Object.entries(spreadValue)) {
          validatePropertyName(key); // Security: prevent prototype pollution
          obj[key] = value;
        }
      } else if (property.type === "Property") {
        // Regular property
        // Get the property key
        const key = this.extractPropertyKey(property.key);

        validatePropertyName(key); // Security: prevent prototype pollution

        // Evaluate the property value
        const value = this.evaluateNode(property.value);
        obj[key] = value;
      } else {
        throw new InterpreterError(
          `Unsupported object property type: ${property.type}`,
        );
      }
    }

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

  private async evaluateBinaryExpressionAsync(
    node: ESTree.BinaryExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("BinaryOperators")) {
      throw new InterpreterError("BinaryOperators is not enabled");
    }

    const left = await this.evaluateNodeAsync(node.left);
    const right = await this.evaluateNodeAsync(node.right);
    return this.applyBinaryOperator(node.operator, left, right);
  }

  private async evaluateUnaryExpressionAsync(
    node: ESTree.UnaryExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("UnaryOperators")) {
      throw new InterpreterError("UnaryOperators is not enabled");
    }

    // Special case: typeof should not throw for undefined variables
    if (node.operator === "typeof") {
      return this.evaluateTypeofAsync(node.argument);
    }

    // For other unary operators, evaluate normally
    const argument = await this.evaluateNodeAsync(node.argument);
    return this.applyUnaryOperator(node.operator, argument);
  }

  /**
   * Evaluate typeof operator, handling undefined variables gracefully.
   * Shared between sync and async paths via handleTypeof helper.
   */
  private async evaluateTypeofAsync(
    argument: ESTree.Expression,
  ): Promise<string> {
    try {
      const value = await this.evaluateNodeAsync(argument);
      return this.getTypeofValue(value);
    } catch (error) {
      if (
        error instanceof InterpreterError &&
        error.message.includes("Undefined variable")
      ) {
        return "undefined";
      }
      throw error;
    }
  }

  private async evaluateLogicalExpressionAsync(
    node: ESTree.LogicalExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("LogicalOperators")) {
      throw new InterpreterError("LogicalOperators is not enabled");
    }

    const left = await this.evaluateNodeAsync(node.left);

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
        throw new InterpreterError(
          `Unsupported logical operator: ${node.operator}`,
        );
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

    // Return consequent if truthy, alternate if falsy
    if (testValue) {
      return await this.evaluateNodeAsync(node.consequent);
    } else {
      return await this.evaluateNodeAsync(node.alternate);
    }
  }

  private async evaluateCallExpressionAsync(
    node: ESTree.CallExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("CallExpression")) {
      throw new InterpreterError("CallExpression is not enabled");
    }

    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      const memberExpr = node.callee as ESTree.MemberExpression;
      thisValue = await this.evaluateNodeAsync(memberExpr.object);

      // For arrays, strings, and generators, use evaluateMemberExpressionAsync to get HostFunctionValue wrappers
      // For other objects, access the property directly
      if (
        Array.isArray(thisValue) ||
        typeof thisValue === "string" ||
        thisValue instanceof GeneratorValue ||
        thisValue instanceof AsyncGeneratorValue
      ) {
        callee = await this.evaluateMemberExpressionAsync(memberExpr);
      } else {
        if (thisValue instanceof HostFunctionValue) {
          throw new InterpreterError(
            "Cannot access properties on host functions",
          );
        }

        // Get the method from the object
        const property = memberExpr.computed
          ? await this.evaluateNodeAsync(memberExpr.property)
          : null;
        callee = this.getObjectProperty(thisValue, memberExpr, property);
      }
    } else {
      callee = await this.evaluateNodeAsync(node.callee);
    }

    // Handle host functions (sync and async)
    if (callee instanceof HostFunctionValue) {
      const args = await this.evaluateArgumentsAsync(node.arguments);

      try {
        const result = callee.hostFunc(...args);
        // If async host function, await the promise
        if (callee.isAsync) {
          return await result;
        }
        return result;
      } catch (error: any) {
        // If rethrowErrors is true, propagate the error directly (used by generator.throw())
        if (callee.rethrowErrors) {
          throw error;
        }
        throw new InterpreterError(
          `Host function '${callee.name}' threw error: ${error.message}`,
        );
      }
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
        return new AsyncGeneratorValue(callee, args, this);
      }
      return new GeneratorValue(callee, args, this);
    }

    // Execute the sandbox function (handles both sync and async functions)
    return await this.executeSandboxFunctionAsync(callee, args, thisValue);
  }

  private async evaluateNewExpressionAsync(
    node: ESTree.NewExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("NewExpression")) {
      throw new InterpreterError("NewExpression is not enabled");
    }

    // 1. Evaluate constructor
    const constructor = await this.evaluateNodeAsync(node.callee);

    // 2. Validate constructor is callable
    this.validateConstructor(constructor);

    // 3. Create new instance object
    const instance: Record<string, any> = {};

    // 4. Evaluate arguments
    const args = await this.evaluateArgumentsAsync(node.arguments);

    // 5. Call constructor based on type
    let result: any;

    if (constructor instanceof HostFunctionValue) {
      // Host function constructor
      result = await this.executeHostConstructorAsync(
        constructor,
        args,
        instance,
      );
    } else {
      // Sandbox function constructor
      const callee = constructor as FunctionValue;

      // Validate argument count
      this.validateFunctionArguments(callee, args);

      // Execute with instance as 'this'
      result = await this.executeSandboxFunctionAsync(callee, args, instance);
    }

    // 6. Return object or constructor's returned object
    return this.resolveConstructorReturn(result, instance);
  }

  private async evaluateAssignmentExpressionAsync(
    node: ESTree.AssignmentExpression,
  ): Promise<any> {
    // Handle logical assignment operators (||=, &&=, ??=) with short-circuit evaluation
    if (
      node.operator === "||=" ||
      node.operator === "&&=" ||
      node.operator === "??="
    ) {
      return await this.evaluateLogicalAssignmentAsync(node);
    }

    if (node.operator !== "=") {
      throw new InterpreterError(
        `Unsupported assignment operator: ${node.operator}`,
      );
    }

    const value = await this.evaluateNodeAsync(node.right);

    // Handle destructuring assignments
    if (
      node.left.type === "ArrayPattern" ||
      node.left.type === "ObjectPattern"
    ) {
      await this.destructurePatternAsync(node.left, value, false);
      return value;
    }

    if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError(
          "Cannot assign properties on host functions",
        );
      }

      if (memberExpr.computed) {
        const property = await this.evaluateNodeAsync(memberExpr.property);

        if (Array.isArray(object)) {
          // Convert string to number if it's a numeric string (for...in gives string indices)
          const index =
            typeof property === "string" ? Number(property) : property;

          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = value;
          return value;
        } else if (typeof object === "object" && object !== null) {
          const propName = String(property);
          validatePropertyName(propName);
          object[propName] = value;
          return value;
        } else {
          throw new InterpreterError(
            "Assignment target is not an array or object",
          );
        }
      } else {
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }

        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);

        if (
          typeof object === "object" &&
          object !== null &&
          !Array.isArray(object)
        ) {
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
  private async evaluateLogicalAssignmentAsync(
    node: ESTree.AssignmentExpression,
  ): Promise<any> {
    // Get the current value of the left-hand side
    let currentValue: any;

    if (node.left.type === "Identifier") {
      currentValue = this.environment.get(
        (node.left as ESTree.Identifier).name,
      );
    } else if (node.left.type === "MemberExpression") {
      const memberExpr = node.left as ESTree.MemberExpression;
      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (object instanceof HostFunctionValue) {
        throw new InterpreterError(
          "Cannot access properties on host functions",
        );
      }

      if (memberExpr.computed) {
        const property = await this.evaluateNodeAsync(memberExpr.property);
        const propName = Array.isArray(object)
          ? typeof property === "string"
            ? Number(property)
            : property
          : String(property);
        currentValue = object[propName];
      } else {
        if (memberExpr.property.type !== "Identifier") {
          throw new InterpreterError("Invalid property access");
        }
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        currentValue = object[property];
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
        throw new InterpreterError(
          `Unsupported logical assignment operator: ${node.operator}`,
        );
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
      const object = await this.evaluateNodeAsync(memberExpr.object);

      if (memberExpr.computed) {
        const property = await this.evaluateNodeAsync(memberExpr.property);
        if (Array.isArray(object)) {
          const index =
            typeof property === "string" ? Number(property) : property;
          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = newValue;
        } else if (typeof object === "object" && object !== null) {
          const propName = String(property);
          validatePropertyName(propName);
          object[propName] = newValue;
        }
      } else {
        const property = (memberExpr.property as ESTree.Identifier).name;
        validatePropertyName(property);
        object[property] = newValue;
      }
    }

    return newValue;
  }

  private async evaluateVariableDeclarationAsync(
    node: ESTree.VariableDeclaration,
  ): Promise<any> {
    const kind = node.kind as "let" | "const" | "var";
    this.validateVariableDeclarationKind(kind);

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      // Handle destructuring patterns
      if (
        declarator.id.type === "ArrayPattern" ||
        declarator.id.type === "ObjectPattern"
      ) {
        // Destructuring declaration
        if (declarator.init === null) {
          throw new InterpreterError(
            "Destructuring declaration must have an initializer",
          );
        }

        const value = await this.evaluateNodeAsync(declarator.init);
        await this.destructurePatternAsync(declarator.id, value, true, kind);
        lastValue = value;
        continue;
      }

      // Handle simple identifier
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError(
          `Unsupported declaration pattern: ${declarator.id.type}`,
        );
      }

      const name = (declarator.id as ESTree.Identifier).name;

      // When resuming from a yield, skip variables that have already been declared
      // (their values have already been assigned from the yield expression)
      if (this.isResumingFromYield && this.environment.has(name)) {
        // The variable was already declared in the first evaluation pass.
        // Just evaluate the init (which will return the received value) but don't redeclare.
        const value = declarator.init
          ? await this.evaluateNodeAsync(declarator.init)
          : undefined;
        // Use forceSet to update even const variables during yield resumption
        this.environment.forceSet(name, value);
        lastValue = value;
        continue;
      }

      const value = declarator.init
        ? await this.evaluateNodeAsync(declarator.init)
        : undefined;

      this.validateConstInitializer(declarator, kind);

      this.environment.declare(name, value, kind);
      lastValue = value;
    }

    return lastValue;
  }

  private async evaluateBlockStatementAsync(
    node: ESTree.BlockStatement,
  ): Promise<any> {
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

  private async evaluateIfStatementAsync(
    node: ESTree.IfStatement,
  ): Promise<any> {
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

  private async evaluateWhileStatementAsync(
    node: ESTree.WhileStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("WhileStatement")) {
      throw new InterpreterError("WhileStatement is not enabled");
    }

    let result: any = undefined;

    while (await this.evaluateNodeAsync(node.test)) {
      // Check execution limits at the start of each loop iteration
      this.checkExecutionLimits();

      result = await this.evaluateNodeAsync(node.body);

      const controlFlow = this.handleLoopControlFlow(result);
      if (controlFlow.shouldReturn) {
        return controlFlow.value;
      }
      // Continue to next iteration (for ContinueValue or normal result)
    }

    return result;
  }

  private async evaluateForStatementAsync(
    node: ESTree.ForStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("ForStatement")) {
      throw new InterpreterError("ForStatement is not enabled");
    }

    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        await this.evaluateNodeAsync(node.init);
      }

      let result: any = undefined;

      while (true) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

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
          return undefined;
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
    }
  }

  private async evaluateForOfStatementAsync(
    node: ESTree.ForOfStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("ForOfStatement")) {
      throw new InterpreterError("ForOfStatement is not enabled");
    }

    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable (right side)
      const iterableValue = await this.evaluateNodeAsync(node.right);

      // Get an iterator from the value
      // Support: arrays, generators, and any object with [Symbol.iterator] or [Symbol.asyncIterator]
      let iterator: Iterator<any> | AsyncIterator<any>;
      let isAsync = false;

      if (Array.isArray(iterableValue)) {
        iterator = iterableValue[Symbol.iterator]();
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.asyncIterator] === "function"
      ) {
        iterator = iterableValue[Symbol.asyncIterator]();
        isAsync = true;
      } else if (
        iterableValue &&
        typeof iterableValue[Symbol.iterator] === "function"
      ) {
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
      const { variableName, isDeclaration, variableKind } =
        this.extractForOfVariable(node.left);

      let result: any = undefined;

      // Iterate using the iterator protocol
      let iterResult = isAsync
        ? await (iterator as AsyncIterator<any>).next()
        : (iterator as Iterator<any>).next();

      while (!iterResult.done) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

        const currentValue = iterResult.value;

        if (isDeclaration) {
          // For declarations (let/const), create a new scope for each iteration
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable with the current element
          this.environment.declare(variableName, currentValue, variableKind!);

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign
          this.environment.set(variableName, currentValue);

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
        // ContinueValue just continues to the next iteration

        // Get next value
        iterResult = isAsync
          ? await (iterator as AsyncIterator<any>).next()
          : (iterator as Iterator<any>).next();
      }

      return result;
    } finally {
      this.environment = previousEnv;
    }
  }

  private async evaluateForInStatementAsync(
    node: ESTree.ForInStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("ForInStatement")) {
      throw new InterpreterError("ForInStatement is not enabled");
    }

    // Create a new environment for the for...in loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the object (right side)
      const obj = await this.evaluateNodeAsync(node.right);

      // Check if obj is an object or array
      if (obj === null || obj === undefined) {
        throw new InterpreterError(
          "for...in requires an object or array, got null/undefined",
        );
      }

      if (typeof obj !== "object") {
        throw new InterpreterError(
          `for...in requires an object or array, got ${typeof obj}`,
        );
      }

      // Extract variable information
      const { variableName, isDeclaration, variableKind } =
        this.extractForInVariable(node.left);

      let result: any = undefined;

      // Iterate over object keys (own enumerable properties)
      const keys = Object.keys(obj);

      for (const key of keys) {
        // Check execution limits at the start of each loop iteration
        this.checkExecutionLimits();

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
        const controlFlow = this.handleLoopControlFlow(result);
        if (controlFlow.shouldReturn) {
          return controlFlow.value;
        }
      }

      return result;
    } finally {
      this.environment = previousEnv;
    }
  }

  private async evaluateSwitchStatementAsync(
    node: ESTree.SwitchStatement,
  ): Promise<any> {
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
            throw new InterpreterError(
              "Continue statement not allowed in switch statement",
            );
          }
        }
      }
    }

    return result;
  }

  private async evaluateReturnStatementAsync(
    node: ESTree.ReturnStatement,
  ): Promise<any> {
    const value = node.argument
      ? await this.evaluateNodeAsync(node.argument)
      : undefined;
    return new ReturnValue(value);
  }

  private async evaluateAwaitExpressionAsync(
    node: ESTree.AwaitExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("AsyncAwait")) {
      throw new InterpreterError("AsyncAwait is not enabled");
    }

    // Evaluate the argument (which should be a promise)
    const value = await this.evaluateNodeAsync(node.argument);

    // Security: Block awaiting host functions directly
    // This prevents exposing the raw host function to the host via the HostFunctionValue wrapper
    if (value instanceof HostFunctionValue) {
      throw new InterpreterError(
        "Cannot await a host function. Did you mean to call it with ()?",
      );
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
      if (
        currentYieldIndex === this.yieldResumeIndex &&
        this.pendingYieldReceivedValue?.hasValue
      ) {
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
  private async evaluateYieldExpressionAsync(
    node: ESTree.YieldExpression,
  ): Promise<any> {
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
      if (
        currentYieldIndex === this.yieldResumeIndex &&
        this.pendingYieldReceivedValue?.hasValue
      ) {
        const receivedValue = this.pendingYieldReceivedValue.value;
        this.pendingYieldReceivedValue = undefined;
        // Store the received value for future re-evaluations
        this.yieldReceivedValues[currentYieldIndex] = receivedValue;
        this.yieldResumeIndex++; // Mark this yield as satisfied
        return receivedValue;
      }
    }

    const value = node.argument
      ? await this.evaluateNodeAsync(node.argument)
      : undefined;
    const delegate = node.delegate || false;

    return new YieldValue(value, delegate);
  }

  /**
   * Evaluate throw statement (async): throw expression
   * Throws an InterpreterError with the evaluated expression
   */
  private async evaluateThrowStatementAsync(
    node: ESTree.ThrowStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("ThrowStatement")) {
      throw new InterpreterError("ThrowStatement is not enabled");
    }

    const value = await this.evaluateNodeAsync(node.argument);
    throw new InterpreterError(`Uncaught ${String(value)}`);
  }

  /**
   * Evaluate try/catch/finally statement (async)
   * Handles exception flow with proper cleanup
   */
  private async evaluateTryStatementAsync(
    node: ESTree.TryStatement,
  ): Promise<any> {
    if (!this.isFeatureEnabled("TryCatchStatement")) {
      throw new InterpreterError("TryCatchStatement is not enabled");
    }

    let tryResult: any = undefined;
    let caughtError: any = null;

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
          const paramName = this.getCatchParameterName(node.handler);
          if (paramName) {
            this.environment.declare(paramName, error, "let");
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
        const finallyResult = await this.evaluateBlockStatementAsync(
          node.finalizer,
        );

        // If finally block has control flow (return/break/continue), it overrides try/catch
        if (this.shouldFinallyOverride(finallyResult)) {
          return finallyResult;
        }
      }
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
        this.bindDestructuredIdentifier(
          element.name,
          elementValue,
          declare,
          kind,
        );
      } else if (
        element.type === "ArrayPattern" ||
        element.type === "ObjectPattern"
      ) {
        // Nested destructuring: [a, [b, c]]
        await this.destructurePatternAsync(
          element,
          elementValue,
          declare,
          kind,
        );
      } else if (element.type === "RestElement") {
        // Rest element: [...rest] - collect remaining array elements
        const restName = this.getRestElementName(element);
        // Collect all remaining elements from current position
        const remainingValues = value.slice(i);
        this.bindDestructuredIdentifier(
          restName,
          remainingValues,
          declare,
          kind,
        );

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
          this.bindDestructuredIdentifier(
            target.name,
            propValue,
            declare,
            kind,
          );
        } else if (target.type === "AssignmentPattern") {
          // Default value: {x = 5}
          await this.handleAssignmentPatternAsync(
            target,
            propValue,
            declare,
            kind,
          );
        } else if (
          target.type === "ArrayPattern" ||
          target.type === "ObjectPattern"
        ) {
          // Nested destructuring: {a: {b}}
          await this.destructurePatternAsync(target, propValue, declare, kind);
        } else {
          throw new InterpreterError(
            `Unsupported object pattern value: ${target.type}`,
          );
        }
      } else {
        throw new InterpreterError(
          `Unsupported object pattern property: ${property.type}`,
        );
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
      throw new InterpreterError(
        "Assignment pattern must have a default value",
      );
    }
    const finalValue =
      value === undefined ? await this.evaluateNodeAsync(defaultExpr) : value;

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

  private async evaluateMemberExpressionAsync(
    node: ESTree.MemberExpression,
  ): Promise<any> {
    if (!this.isFeatureEnabled("MemberExpression")) {
      throw new InterpreterError("MemberExpression is not enabled");
    }

    const object = await this.evaluateNodeAsync(node.object);

    this.validateMemberAccess(object);

    if (node.computed) {
      const property = await this.evaluateNodeAsync(node.property);

      if (Array.isArray(object)) {
        return this.accessArrayElement(object, property);
      }

      if (typeof object === "object" && object !== null) {
        return this.accessObjectProperty(object, property);
      }

      throw new InterpreterError(
        "Computed property access requires an array or object",
      );
    } else {
      if (node.property.type !== "Identifier") {
        throw new InterpreterError("Invalid property access");
      }
      const property = (node.property as ESTree.Identifier).name;
      validatePropertyName(property);

      const length = this.getLengthProperty(object, property);
      if (length !== null) {
        return length;
      }

      // Handle generator methods (next, return, throw)
      if (object instanceof GeneratorValue) {
        if (property === "next") {
          return new HostFunctionValue(object.next.bind(object), "next", false);
        }
        if (property === "return") {
          return new HostFunctionValue(
            object.return.bind(object),
            "return",
            false,
          );
        }
        if (property === "throw") {
          // rethrowErrors: true - errors from throw() should propagate directly
          return new HostFunctionValue(
            object.throw.bind(object),
            "throw",
            false,
            true,
          );
        }
        throw new InterpreterError(
          `Generator method '${property}' not supported`,
        );
      }

      // Handle async generator methods
      if (object instanceof AsyncGeneratorValue) {
        if (property === "next") {
          return new HostFunctionValue(object.next.bind(object), "next", true);
        }
        if (property === "return") {
          return new HostFunctionValue(
            object.return.bind(object),
            "return",
            true,
          );
        }
        if (property === "throw") {
          // rethrowErrors: true - errors from throw() should propagate directly
          return new HostFunctionValue(
            object.throw.bind(object),
            "throw",
            true,
            true,
          );
        }
        throw new InterpreterError(
          `Async generator method '${property}' not supported`,
        );
      }

      // Handle array methods (reuse sync version since array methods work the same)
      if (Array.isArray(object)) {
        const arrayMethod = this.getArrayMethod(object, property);
        if (arrayMethod) {
          return arrayMethod;
        }
        throw new InterpreterError(`Array method '${property}' not supported`);
      }

      // Handle string methods (reuse sync version since string methods work the same)
      if (typeof object === "string") {
        const stringMethod = this.getStringMethod(object, property);
        if (stringMethod) {
          return stringMethod;
        }
        throw new InterpreterError(`String method '${property}' not supported`);
      }

      if (
        typeof object === "object" &&
        object !== null &&
        !Array.isArray(object)
      ) {
        return object[property];
      }

      throw new InterpreterError(`Property '${property}' not supported`);
    }
  }

  private async evaluateArrayExpressionAsync(
    node: ESTree.ArrayExpression,
  ): Promise<any> {
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

    return elements;
  }

  private async evaluateObjectExpressionAsync(
    node: ESTree.ObjectExpression,
  ): Promise<any> {
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
        // Regular property
        const key = this.extractPropertyKey(property.key);

        validatePropertyName(key);

        const value = await this.evaluateNodeAsync(property.value);
        obj[key] = value;
      } else {
        throw new InterpreterError(
          `Unsupported object property type: ${property.type}`,
        );
      }
    }

    return obj;
  }

  /**
   * Evaluate template literal (async): `hello ${name}`
   */
  private async evaluateTemplateLiteralAsync(
    node: ESTree.TemplateLiteral,
  ): Promise<string> {
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
}
