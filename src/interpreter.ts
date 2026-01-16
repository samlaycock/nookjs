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

import { parseScript } from "meriyah";
import type { ESTree } from "meriyah";
import { ReadOnlyProxy } from "./readonly-proxy";
import { DANGEROUS_PROPERTIES, isDangerousProperty } from "./constants";

// Re-export constants for external use
export { DANGEROUS_PROPERTIES, isDangerousProperty } from "./constants";

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
  ) {}
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
  ) {
    // Return a Proxy that blocks property access on host functions
    // This prevents accessing dangerous properties like .constructor, .apply, etc.
    return new Proxy(this, {
      get(target, prop) {
        // Allow access to our three public properties
        if (prop === "hostFunc" || prop === "name" || prop === "isAsync") {
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
        // Only report our three properties as existing
        return prop === "hostFunc" || prop === "name" || prop === "isAsync";
      },

      ownKeys() {
        // Only expose our three properties
        return ["hostFunc", "name", "isAsync"];
      },

      getOwnPropertyDescriptor(target, prop) {
        if (prop === "hostFunc" || prop === "name" || prop === "isAsync") {
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
    { value: any; kind: "let" | "const"; isGlobal?: boolean }
  > = new Map();
  private parent: Environment | null = null;
  private thisValue: any = undefined;

  constructor(parent: Environment | null = null, thisValue: any = undefined) {
    this.parent = parent;
    this.thisValue = thisValue;
  }

  declare(
    name: string,
    value: any,
    kind: "let" | "const",
    isGlobal: boolean = false,
  ): void {
    if (this.variables.has(name)) {
      throw new InterpreterError(
        `Variable '${name}' has already been declared`,
      );
    }
    this.variables.set(name, { value, kind, isGlobal });
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

  has(name: string): boolean {
    return this.variables.has(name) || (this.parent?.has(name) ?? false);
  }

  /**
   * Force set a variable value, even if it's const
   * Used for updating injected globals (allows per-call globals to override constructor globals)
   *
   * Important: Only allows overriding globals (isGlobal=true), NOT user-declared variables
   * This protects user variables from being clobbered by late-injected globals
   *
   * Returns: true if variable was updated, false if it's a user variable or doesn't exist
   */
  forceSet(name: string, value: any): boolean {
    if (this.variables.has(name)) {
      const variable = this.variables.get(name)!;
      // Only allow force-setting globals, not user-declared variables
      if (variable.isGlobal) {
        variable.value = value;
        return true;
      }
      return false; // Don't override user variables
    }
    if (this.parent) {
      return this.parent.forceSet(name, value);
    }
    return false; // Variable doesn't exist
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

type InterpreterOptions = {
  globals?: Record<string, any>;
  validator?: ASTValidator;
};

type EvaluateOptions = {
  globals?: Record<string, any>;
  validator?: ASTValidator;
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
  private environment: Environment;
  private constructorGlobals: Record<string, any>; // Globals that persist across all evaluate() calls
  private constructorValidator?: ASTValidator; // AST validator that applies to all evaluate() calls
  private perCallGlobalKeys: Set<string> = new Set(); // Track per-call globals for cleanup
  private overriddenConstructorGlobals: Map<string, any> = new Map(); // Track original values when per-call globals override

  constructor(options?: InterpreterOptions) {
    this.environment = new Environment();
    this.constructorGlobals = options?.globals || {};
    this.constructorValidator = options?.validator;
    this.injectGlobals(this.constructorGlobals);
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
        // If the variable exists, check if we should override
        if (allowOverride) {
          // Save the original value if it's a constructor global
          if (trackKeys && key in this.constructorGlobals) {
            this.overriddenConstructorGlobals.set(
              key,
              this.environment.get(key),
            );
          }
          // Try to force update the global (only works for injected globals)
          const wasUpdated = this.environment.forceSet(key, wrappedValue);
          if (wasUpdated && trackKeys) {
            this.perCallGlobalKeys.add(key);
          }
        }
        // If not allowOverride, skip this variable (don't overwrite)
      } else {
        // Variable doesn't exist, declare it as const and mark as global
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
        this.environment.forceSet(key, originalValue);
      } else {
        // This was a new per-call global - delete it completely
        this.environment.delete(key);
      }
    }
    this.perCallGlobalKeys.clear();
    this.overriddenConstructorGlobals.clear();
  }

  evaluate(code: string, options?: EvaluateOptions): any {
    // Inject per-call globals if provided (with override capability)
    if (options?.globals) {
      this.injectGlobals(options.globals, true, true);
    }

    try {
      const ast = parseScript(code, { module: false });

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
    }
  }

  async evaluateAsync(code: string, options?: EvaluateOptions): Promise<any> {
    // Inject per-call globals if provided (with override capability)
    if (options?.globals) {
      this.injectGlobals(options.globals, true, true);
    }

    try {
      const ast = parseScript(code, { module: false });

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
    }
  }

  private evaluateNode(node: ASTNode): any {
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

      case "BreakStatement":
        return this.evaluateBreakStatement(node as ESTree.BreakStatement);

      case "ContinueStatement":
        return this.evaluateContinueStatement(node as ESTree.ContinueStatement);

      case "CallExpression":
        return this.evaluateCallExpression(node as ESTree.CallExpression);

      case "MemberExpression":
        return this.evaluateMemberExpression(node as ESTree.MemberExpression);

      case "ArrayExpression":
        return this.evaluateArrayExpression(node as ESTree.ArrayExpression);

      case "ObjectExpression":
        return this.evaluateObjectExpression(node as ESTree.ObjectExpression);

      default:
        throw new InterpreterError(`Unsupported node type: ${node.type}`);
    }
  }

  private async evaluateNodeAsync(node: ASTNode): Promise<any> {
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
        return await this.evaluateUpdateExpressionAsync(
          node as ESTree.UpdateExpression,
        );

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
        return await this.evaluateFunctionDeclarationAsync(
          node as ESTree.FunctionDeclaration,
        );

      case "FunctionExpression":
        return await this.evaluateFunctionExpressionAsync(
          node as ESTree.FunctionExpression,
        );

      case "ArrowFunctionExpression":
        return await this.evaluateArrowFunctionExpressionAsync(
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

      case "BreakStatement":
        return this.evaluateBreakStatement(node as ESTree.BreakStatement);

      case "ContinueStatement":
        return this.evaluateContinueStatement(node as ESTree.ContinueStatement);

      case "CallExpression":
        return await this.evaluateCallExpressionAsync(
          node as ESTree.CallExpression,
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
    return this.environment.getThis();
  }

  private evaluateBinaryExpression(node: ESTree.BinaryExpression): any {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);

    switch (node.operator) {
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

      // Comparison operators
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;

      default:
        throw new InterpreterError(
          `Unsupported binary operator: ${node.operator}`,
        );
    }
  }

  private evaluateUnaryExpression(node: ESTree.UnaryExpression): any {
    // Special case: typeof should not throw for undefined variables
    if (node.operator === "typeof") {
      // Try to evaluate, but catch undefined variable errors
      try {
        const argument = this.evaluateNode(node.argument);

        // Handle special cases for internal types
        if (argument instanceof FunctionValue) {
          return "function";
        }
        if (argument instanceof HostFunctionValue) {
          return "function";
        }

        return typeof argument;
      } catch (error) {
        // If it's an undefined variable error, return "undefined"
        if (
          error instanceof InterpreterError &&
          error.message.includes("Undefined variable")
        ) {
          return "undefined";
        }
        // Re-throw other errors
        throw error;
      }
    }

    // For other unary operators, evaluate normally
    const argument = this.evaluateNode(node.argument);

    switch (node.operator) {
      case "+":
        return +argument;
      case "-":
        return -argument;
      case "!":
        return !argument;
      default:
        throw new InterpreterError(
          `Unsupported unary operator: ${node.operator}`,
        );
    }
  }

  private evaluateUpdateExpression(node: ESTree.UpdateExpression): any {
    // UpdateExpression handles ++ and -- operators
    if (node.argument.type !== "Identifier") {
      throw new InterpreterError(
        "Update expression must operate on an identifier",
      );
    }

    const identifier = node.argument as ESTree.Identifier;
    const name = identifier.name;
    const currentValue = this.environment.get(name);

    if (typeof currentValue !== "number") {
      throw new InterpreterError(
        "Update expression can only be used with numbers",
      );
    }

    let newValue: number;
    switch (node.operator) {
      case "++":
        newValue = currentValue + 1;
        break;
      case "--":
        newValue = currentValue - 1;
        break;
      default:
        throw new InterpreterError(
          `Unsupported update operator: ${node.operator}`,
        );
    }

    this.environment.set(name, newValue);

    // Return old value for postfix (i++), new value for prefix (++i)
    return node.prefix ? newValue : currentValue;
  }

  private evaluateLogicalExpression(node: ESTree.LogicalExpression): any {
    const left = this.evaluateNode(node.left);

    switch (node.operator) {
      case "&&":
        // Short-circuit: if left is falsy, return left without evaluating right
        if (!left) return left;
        return this.evaluateNode(node.right);

      case "||":
        // Short-circuit: if left is truthy, return left without evaluating right
        if (left) return left;
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
    if (node.operator !== "=") {
      throw new InterpreterError(
        `Unsupported assignment operator: ${node.operator}`,
      );
    }

    const value = this.evaluateNode(node.right);

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
        // Computed property: arr[index] = value
        const property = this.evaluateNode(memberExpr.property);

        if (Array.isArray(object)) {
          // Array element assignment
          // Convert string to number if it's a numeric string (for...in gives string indices)
          const index =
            typeof property === "string" ? Number(property) : property;

          if (typeof index !== "number" || isNaN(index)) {
            throw new InterpreterError("Array index must be a number");
          }
          object[index] = value;
          return value;
        } else if (typeof object === "object" && object !== null) {
          // Object computed property assignment: obj["key"] = value
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

  private evaluateVariableDeclaration(node: ESTree.VariableDeclaration): any {
    const kind = node.kind as "let" | "const" | "var";

    if (kind === "var") {
      throw new InterpreterError("var is not supported, use let or const");
    }

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError("Destructuring is not supported");
      }

      const name = (declarator.id as ESTree.Identifier).name;
      const value = declarator.init
        ? this.evaluateNode(declarator.init)
        : undefined;

      if (kind === "const" && declarator.init === null) {
        throw new InterpreterError("Missing initializer in const declaration");
      }

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
        if (
          result instanceof ReturnValue ||
          result instanceof BreakValue ||
          result instanceof ContinueValue
        ) {
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
    const condition = this.evaluateNode(node.test);

    if (condition) {
      return this.evaluateNode(node.consequent);
    } else if (node.alternate) {
      return this.evaluateNode(node.alternate);
    }

    return undefined;
  }

  private evaluateWhileStatement(node: ESTree.WhileStatement): any {
    let result: any = undefined;

    while (this.evaluateNode(node.test)) {
      result = this.evaluateNode(node.body);

      // If we hit a return statement in a loop, propagate it
      if (result instanceof ReturnValue) {
        return result;
      }

      // If we hit a break statement, exit the loop
      if (result instanceof BreakValue) {
        return undefined;
      }

      // If we hit a continue statement, skip to next iteration
      if (result instanceof ContinueValue) {
        continue;
      }
    }

    return result;
  }

  private evaluateForStatement(node: ESTree.ForStatement): any {
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
        // Check test condition (e.g., i < 10)
        if (node.test) {
          const condition = this.evaluateNode(node.test);
          if (!condition) {
            break;
          }
        }

        // Execute loop body
        result = this.evaluateNode(node.body);

        // If we hit a return statement in a loop, propagate it
        if (result instanceof ReturnValue) {
          return result;
        }

        // If we hit a break statement, exit the loop
        if (result instanceof BreakValue) {
          return undefined;
        }

        // Execute update expression (e.g., i++)
        // Note: continue should skip to update, so we check after update
        if (node.update) {
          this.evaluateNode(node.update);
        }

        // If we hit a continue statement, skip to next iteration
        // (already executed update above)
        if (result instanceof ContinueValue) {
          continue;
        }
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
    // Create a new environment for the for...of loop scope
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable (right side)
      const iterable = this.evaluateNode(node.right);

      // Check if iterable is an array (currently only arrays are supported)
      if (!Array.isArray(iterable)) {
        throw new InterpreterError("for...of requires an iterable (array)");
      }

      // Determine the loop variable info
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | undefined;

      if (node.left.type === "VariableDeclaration") {
        // e.g., for (let item of arr) or for (const item of arr)
        const decl = node.left.declarations[0];
        if (decl?.id.type !== "Identifier") {
          throw new InterpreterError("Unsupported for...of variable pattern");
        }
        variableName = decl.id.name;
        isDeclaration = true;
        variableKind = node.left.kind as "let" | "const";
      } else if (node.left.type === "Identifier") {
        // e.g., for (item of arr) where item is already declared
        variableName = node.left.name;
      } else {
        throw new InterpreterError("Unsupported for...of left-hand side");
      }

      let result: any = undefined;

      // Iterate over the array
      for (let i = 0; i < iterable.length; i++) {
        if (isDeclaration) {
          // For declarations (let/const), create a NEW scope for EACH iteration
          // This is necessary for const since we can't reassign it
          // It also matches JavaScript semantics where each iteration gets fresh bindings
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable with the current element
          this.environment.declare(variableName, iterable[i], variableKind!);

          // Execute loop body
          result = this.evaluateNode(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign in the current scope
          this.environment.set(variableName, iterable[i]);

          // Execute loop body
          result = this.evaluateNode(node.body);
        }

        // If we hit a return statement in a loop, propagate it
        if (result instanceof ReturnValue) {
          return result;
        }

        // If we hit a break statement, exit the loop
        if (result instanceof BreakValue) {
          return undefined;
        }

        // If we hit a continue statement, skip to next iteration
        if (result instanceof ContinueValue) {
          continue;
        }
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

      // Determine the loop variable info
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | undefined;

      if (node.left.type === "VariableDeclaration") {
        // e.g., for (let key in obj) or for (const key in obj)
        const decl = node.left.declarations[0];
        if (decl?.id.type !== "Identifier") {
          throw new InterpreterError("Unsupported for...in variable pattern");
        }
        variableName = decl.id.name;
        isDeclaration = true;
        variableKind = node.left.kind as "let" | "const";
      } else if (node.left.type === "Identifier") {
        // e.g., for (key in obj) where key is already declared
        variableName = node.left.name;
      } else {
        throw new InterpreterError("Unsupported for...in left-hand side");
      }

      let result: any = undefined;

      // Iterate over object keys (own enumerable properties)
      // Use Object.keys to get own enumerable property names
      const keys = Object.keys(obj);

      for (const key of keys) {
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

        // If we hit a return statement in a loop, propagate it
        if (result instanceof ReturnValue) {
          return result;
        }

        // If we hit a break statement, exit the loop
        if (result instanceof BreakValue) {
          return undefined;
        }

        // If we hit a continue statement, skip to next iteration
        if (result instanceof ContinueValue) {
          continue;
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
    // Evaluate the discriminant (the expression being switched on)
    const discriminant = this.evaluateNode(node.discriminant);

    let matched = false; // Track if we've matched a case (for fall-through)
    let result: any = undefined;

    // Iterate through all cases
    for (const switchCase of node.cases) {
      // Check if this case matches (or if we're falling through from a previous match)
      if (!matched) {
        if (switchCase.test === null) {
          // Default case - always matches
          matched = true;
        } else {
          // Regular case - check if discriminant === test value
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

          // If we hit a return statement, propagate it
          if (result instanceof ReturnValue) {
            return result;
          }

          // If we hit a break statement, exit the switch
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
        // unless we hit a break above
      }
    }

    return result;
  }

  private evaluateFunctionDeclaration(node: ESTree.FunctionDeclaration): any {
    if (!node.id) {
      throw new InterpreterError("Function declaration must have a name");
    }

    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const name = node.id.name;
    const params: string[] = [];

    for (const param of node.params) {
      if (param.type !== "Identifier") {
        throw new InterpreterError("Destructuring parameters not supported");
      }
      params.push((param as ESTree.Identifier).name);
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
    );

    // Declare the function in the current environment
    this.environment.declare(name, func, "let");

    return undefined;
  }

  private evaluateFunctionExpression(node: ESTree.FunctionExpression): any {
    if (!node.body) {
      throw new InterpreterError("Function must have a body");
    }

    const params: string[] = [];

    for (const param of node.params) {
      if (param.type !== "Identifier") {
        throw new InterpreterError("Destructuring parameters not supported");
      }
      params.push((param as ESTree.Identifier).name);
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
    );
  }

  private evaluateArrowFunctionExpression(
    node: ESTree.ArrowFunctionExpression,
  ): any {
    const params: string[] = [];

    for (const param of node.params) {
      if (param.type !== "Identifier") {
        throw new InterpreterError("Destructuring parameters not supported");
      }
      params.push((param as ESTree.Identifier).name);
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
    );

    return func;
  }

  private evaluateReturnStatement(node: ESTree.ReturnStatement): any {
    const value = node.argument ? this.evaluateNode(node.argument) : undefined;
    return new ReturnValue(value);
  }

  private evaluateBreakStatement(node: ESTree.BreakStatement): any {
    if (node.label) {
      throw new InterpreterError("Labeled break statements are not supported");
    }
    return new BreakValue();
  }

  private evaluateContinueStatement(node: ESTree.ContinueStatement): any {
    if (node.label) {
      throw new InterpreterError(
        "Labeled continue statements are not supported",
      );
    }
    return new ContinueValue();
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
    // Determine if this is a method call (obj.method()) or regular call
    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      // Method call: obj.method() - need to bind 'this'
      const memberExpr = node.callee as ESTree.MemberExpression;
      thisValue = this.evaluateNode(memberExpr.object); // The object becomes 'this'

      // For arrays and strings, use evaluateMemberExpression to get HostFunctionValue wrappers
      // For other objects, access the property directly
      if (Array.isArray(thisValue) || typeof thisValue === "string") {
        callee = this.evaluateMemberExpression(memberExpr);
      } else {
        // Get the method from the object
        if (memberExpr.computed) {
          const property = this.evaluateNode(memberExpr.property);
          callee = thisValue[String(property)];
        } else {
          if (memberExpr.property.type !== "Identifier") {
            throw new InterpreterError("Invalid method access");
          }
          const property = (memberExpr.property as ESTree.Identifier).name;
          callee = thisValue[property];
        }
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

      // Evaluate all arguments
      const args: any[] = [];
      for (const arg of node.arguments) {
        args.push(this.evaluateNode(arg as ESTree.Expression));
      }

      // Call the host function
      try {
        return callee.hostFunc(...args);
      } catch (error: any) {
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
    if (callee.isAsync) {
      throw new InterpreterError(
        "Cannot call async function in synchronous evaluate(). Use evaluateAsync() instead.",
      );
    }

    // Evaluate all arguments
    const args: any[] = [];
    for (const arg of node.arguments) {
      args.push(this.evaluateNode(arg as ESTree.Expression));
    }

    // Check argument count
    if (args.length !== callee.params.length) {
      throw new InterpreterError(
        `Expected ${callee.params.length} arguments but got ${args.length}`,
      );
    }

    // Create a new environment for the function execution
    // CRITICAL: The parent is the CLOSURE environment (where function was defined), NOT current env
    // This enables proper closure semantics - functions "remember" their defining scope
    // Pass thisValue to bind 'this' in the function (for method calls)
    const previousEnvironment = this.environment;
    this.environment = new Environment(callee.closure, thisValue);

    try {
      // Bind parameters to arguments in the new environment
      for (let i = 0; i < callee.params.length; i++) {
        this.environment.declare(callee.params[i]!, args[i], "let");
      }

      // Execute the function body
      const result = this.evaluateNode(callee.body);

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

  private evaluateMemberExpression(node: ESTree.MemberExpression): any {
    const object = this.evaluateNode(node.object);

    // Block property access on host functions
    if (object instanceof HostFunctionValue) {
      throw new InterpreterError("Cannot access properties on host functions");
    }

    if (node.computed) {
      // obj[expr] - computed property access (array indexing or object bracket notation)
      const property = this.evaluateNode(node.property);

      // Handle array indexing
      if (Array.isArray(object)) {
        // Convert string to number if it's a numeric string (for...in gives string indices)
        const index =
          typeof property === "string" ? Number(property) : property;

        if (typeof index !== "number" || isNaN(index)) {
          throw new InterpreterError("Array index must be a number");
        }
        if (index < 0 || index >= object.length) {
          return undefined; // JavaScript behavior for out-of-bounds
        }
        return object[index];
      }

      // Handle object computed property access: obj["key"]
      if (typeof object === "object" && object !== null) {
        const propName = String(property);
        validatePropertyName(propName); // Security: prevent prototype pollution
        return object[propName];
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
      if (property === "length") {
        if (typeof object === "string" || Array.isArray(object)) {
          return object.length;
        }
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
    this.environment = new Environment(func.closure, thisValue);

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
    const elements: any[] = [];

    for (const element of node.elements) {
      if (element === null) {
        // Sparse array element (e.g., [1, , 3])
        elements.push(undefined);
      } else {
        elements.push(this.evaluateNode(element));
      }
    }

    return elements;
  }

  private evaluateObjectExpression(node: ESTree.ObjectExpression): any {
    const obj: Record<string, any> = {};

    for (const property of node.properties) {
      if (property.type !== "Property") {
        throw new InterpreterError(
          "Only property nodes are supported in objects",
        );
      }

      // Get the property key
      let key: string;
      if (property.key.type === "Identifier") {
        key = (property.key as ESTree.Identifier).name;
      } else if (property.key.type === "Literal") {
        const literal = property.key as ESTree.Literal;
        key = String(literal.value);
      } else {
        throw new InterpreterError("Unsupported property key type");
      }

      validatePropertyName(key); // Security: prevent prototype pollution

      // Evaluate the property value
      const value = this.evaluateNode(property.value);
      obj[key] = value;
    }

    return obj;
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
    const left = await this.evaluateNodeAsync(node.left);
    const right = await this.evaluateNodeAsync(node.right);

    switch (node.operator) {
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
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      default:
        throw new InterpreterError(
          `Unsupported binary operator: ${node.operator}`,
        );
    }
  }

  private async evaluateUnaryExpressionAsync(
    node: ESTree.UnaryExpression,
  ): Promise<any> {
    // Special case: typeof should not throw for undefined variables
    if (node.operator === "typeof") {
      // Try to evaluate, but catch undefined variable errors
      try {
        const argument = await this.evaluateNodeAsync(node.argument);

        // Handle special cases for internal types
        if (argument instanceof FunctionValue) {
          return "function";
        }
        if (argument instanceof HostFunctionValue) {
          return "function";
        }

        return typeof argument;
      } catch (error) {
        // If it's an undefined variable error, return "undefined"
        if (
          error instanceof InterpreterError &&
          error.message.includes("Undefined variable")
        ) {
          return "undefined";
        }
        // Re-throw other errors
        throw error;
      }
    }

    // For other unary operators, evaluate normally
    const argument = await this.evaluateNodeAsync(node.argument);

    switch (node.operator) {
      case "+":
        return +argument;
      case "-":
        return -argument;
      case "!":
        return !argument;
      default:
        throw new InterpreterError(
          `Unsupported unary operator: ${node.operator}`,
        );
    }
  }

  private async evaluateUpdateExpressionAsync(
    node: ESTree.UpdateExpression,
  ): Promise<any> {
    if (node.argument.type !== "Identifier") {
      throw new InterpreterError(
        "Update expression must operate on an identifier",
      );
    }

    const identifier = node.argument as ESTree.Identifier;
    const name = identifier.name;
    const currentValue = this.environment.get(name);

    if (typeof currentValue !== "number") {
      throw new InterpreterError(
        "Update expression can only be used with numbers",
      );
    }

    let newValue: number;
    switch (node.operator) {
      case "++":
        newValue = currentValue + 1;
        break;
      case "--":
        newValue = currentValue - 1;
        break;
      default:
        throw new InterpreterError(
          `Unsupported update operator: ${node.operator}`,
        );
    }

    this.environment.set(name, newValue);
    return node.prefix ? newValue : currentValue;
  }

  private async evaluateLogicalExpressionAsync(
    node: ESTree.LogicalExpression,
  ): Promise<any> {
    const left = await this.evaluateNodeAsync(node.left);

    switch (node.operator) {
      case "&&":
        if (!left) return left;
        return await this.evaluateNodeAsync(node.right);
      case "||":
        if (left) return left;
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
    let thisValue: any = undefined;
    let callee: any;

    if (node.callee.type === "MemberExpression") {
      const memberExpr = node.callee as ESTree.MemberExpression;
      thisValue = await this.evaluateNodeAsync(memberExpr.object);

      // For arrays and strings, use evaluateMemberExpressionAsync to get HostFunctionValue wrappers
      // For other objects, access the property directly
      if (Array.isArray(thisValue) || typeof thisValue === "string") {
        callee = await this.evaluateMemberExpressionAsync(memberExpr);
      } else {
        if (thisValue instanceof HostFunctionValue) {
          throw new InterpreterError(
            "Cannot access properties on host functions",
          );
        }

        if (memberExpr.computed) {
          const property = await this.evaluateNodeAsync(memberExpr.property);
          callee = thisValue[String(property)];
        } else {
          if (memberExpr.property.type !== "Identifier") {
            throw new InterpreterError("Invalid method access");
          }
          const property = (memberExpr.property as ESTree.Identifier).name;
          callee = thisValue[property];
        }
      }
    } else {
      callee = await this.evaluateNodeAsync(node.callee);
    }

    // Handle host functions (sync and async)
    if (callee instanceof HostFunctionValue) {
      const args: any[] = [];
      for (const arg of node.arguments) {
        args.push(await this.evaluateNodeAsync(arg as ESTree.Expression));
      }

      try {
        const result = callee.hostFunc(...args);
        // If async host function, await the promise
        if (callee.isAsync) {
          return await result;
        }
        return result;
      } catch (error: any) {
        throw new InterpreterError(
          `Host function '${callee.name}' threw error: ${error.message}`,
        );
      }
    }

    // Handle sandbox functions
    if (!(callee instanceof FunctionValue)) {
      throw new InterpreterError("Callee is not a function");
    }

    const args: any[] = [];
    for (const arg of node.arguments) {
      args.push(await this.evaluateNodeAsync(arg as ESTree.Expression));
    }

    if (args.length !== callee.params.length) {
      throw new InterpreterError(
        `Expected ${callee.params.length} arguments but got ${args.length}`,
      );
    }

    const previousEnvironment = this.environment;
    this.environment = new Environment(callee.closure, thisValue);

    try {
      for (let i = 0; i < callee.params.length; i++) {
        this.environment.declare(callee.params[i]!, args[i], "let");
      }

      // If this is an async sandbox function, execute the body and wrap in a promise
      if (callee.isAsync) {
        // Execute function body asynchronously
        const executeAsync = async () => {
          const result = await this.evaluateNodeAsync(callee.body);
          if (result instanceof ReturnValue) {
            return result.value;
          }
          return undefined;
        };
        // Return the promise (so it can be awaited by caller)
        return await executeAsync();
      }

      // Sync sandbox function
      const result = await this.evaluateNodeAsync(callee.body);

      if (result instanceof ReturnValue) {
        return result.value;
      }

      return undefined;
    } finally {
      this.environment = previousEnvironment;
    }
  }

  private async evaluateAssignmentExpressionAsync(
    node: ESTree.AssignmentExpression,
  ): Promise<any> {
    if (node.operator !== "=") {
      throw new InterpreterError(
        `Unsupported assignment operator: ${node.operator}`,
      );
    }

    const value = await this.evaluateNodeAsync(node.right);

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

  private async evaluateVariableDeclarationAsync(
    node: ESTree.VariableDeclaration,
  ): Promise<any> {
    const kind = node.kind as "let" | "const" | "var";

    if (kind === "var") {
      throw new InterpreterError("var is not supported, use let or const");
    }

    let lastValue: any = undefined;

    for (const declarator of node.declarations) {
      if (declarator.id.type !== "Identifier") {
        throw new InterpreterError("Destructuring is not supported");
      }

      const name = (declarator.id as ESTree.Identifier).name;
      const value = declarator.init
        ? await this.evaluateNodeAsync(declarator.init)
        : undefined;

      if (kind === "const" && declarator.init === null) {
        throw new InterpreterError("Missing initializer in const declaration");
      }

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
        if (
          result instanceof ReturnValue ||
          result instanceof BreakValue ||
          result instanceof ContinueValue
        ) {
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
    let result: any = undefined;

    while (await this.evaluateNodeAsync(node.test)) {
      result = await this.evaluateNodeAsync(node.body);

      if (result instanceof ReturnValue) {
        return result;
      }

      if (result instanceof BreakValue) {
        return undefined;
      }

      if (result instanceof ContinueValue) {
        continue;
      }
    }

    return result;
  }

  private async evaluateForStatementAsync(
    node: ESTree.ForStatement,
  ): Promise<any> {
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      if (node.init) {
        await this.evaluateNodeAsync(node.init);
      }

      let result: any = undefined;

      while (true) {
        if (node.test) {
          const condition = await this.evaluateNodeAsync(node.test);
          if (!condition) {
            break;
          }
        }

        result = await this.evaluateNodeAsync(node.body);

        if (result instanceof ReturnValue) {
          return result;
        }

        if (result instanceof BreakValue) {
          return undefined;
        }

        if (node.update) {
          await this.evaluateNodeAsync(node.update);
        }

        if (result instanceof ContinueValue) {
          continue;
        }
      }

      return result;
    } finally {
      this.environment = previousEnv;
    }
  }

  private async evaluateForOfStatementAsync(
    node: ESTree.ForOfStatement,
  ): Promise<any> {
    const previousEnv = this.environment;
    this.environment = new Environment(previousEnv);

    try {
      // Evaluate the iterable (right side)
      const iterable = await this.evaluateNodeAsync(node.right);

      // Check if iterable is an array
      if (!Array.isArray(iterable)) {
        throw new InterpreterError("for...of requires an iterable (array)");
      }

      // Determine the loop variable info
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | undefined;

      if (node.left.type === "VariableDeclaration") {
        const decl = node.left.declarations[0];
        if (decl?.id.type !== "Identifier") {
          throw new InterpreterError("Unsupported for...of variable pattern");
        }
        variableName = decl.id.name;
        isDeclaration = true;
        variableKind = node.left.kind as "let" | "const";
      } else if (node.left.type === "Identifier") {
        variableName = node.left.name;
      } else {
        throw new InterpreterError("Unsupported for...of left-hand side");
      }

      let result: any = undefined;

      // Iterate over the array
      for (let i = 0; i < iterable.length; i++) {
        if (isDeclaration) {
          // For declarations (let/const), create a new scope for each iteration
          const iterEnv = this.environment;
          this.environment = new Environment(iterEnv);

          // Declare the variable with the current element
          this.environment.declare(variableName, iterable[i], variableKind!);

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);

          // Restore environment after iteration
          this.environment = iterEnv;
        } else {
          // For existing variables, just assign
          this.environment.set(variableName, iterable[i]);

          // Execute loop body
          result = await this.evaluateNodeAsync(node.body);
        }

        if (result instanceof ReturnValue) {
          return result;
        }

        if (result instanceof BreakValue) {
          return undefined;
        }

        if (result instanceof ContinueValue) {
          continue;
        }
      }

      return result;
    } finally {
      this.environment = previousEnv;
    }
  }

  private async evaluateForInStatementAsync(
    node: ESTree.ForInStatement,
  ): Promise<any> {
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

      // Determine the loop variable info
      let variableName: string;
      let isDeclaration = false;
      let variableKind: "let" | "const" | undefined;

      if (node.left.type === "VariableDeclaration") {
        const decl = node.left.declarations[0];
        if (decl?.id.type !== "Identifier") {
          throw new InterpreterError("Unsupported for...in variable pattern");
        }
        variableName = decl.id.name;
        isDeclaration = true;
        variableKind = node.left.kind as "let" | "const";
      } else if (node.left.type === "Identifier") {
        variableName = node.left.name;
      } else {
        throw new InterpreterError("Unsupported for...in left-hand side");
      }

      let result: any = undefined;

      // Iterate over object keys (own enumerable properties)
      const keys = Object.keys(obj);

      for (const key of keys) {
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

        // If we hit a return statement in a loop, propagate it
        if (result instanceof ReturnValue) {
          return result;
        }

        // If we hit a break statement, exit the loop
        if (result instanceof BreakValue) {
          return undefined;
        }

        // If we hit a continue statement, skip to next iteration
        if (result instanceof ContinueValue) {
          continue;
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

  private async evaluateFunctionDeclarationAsync(
    node: ESTree.FunctionDeclaration,
  ): Promise<any> {
    // Function declarations are sync - just reuse the sync version
    return this.evaluateFunctionDeclaration(node);
  }

  private async evaluateFunctionExpressionAsync(
    node: ESTree.FunctionExpression,
  ): Promise<any> {
    // Function expressions are sync - just reuse the sync version
    return this.evaluateFunctionExpression(node);
  }

  private async evaluateArrowFunctionExpressionAsync(
    node: ESTree.ArrowFunctionExpression,
  ): Promise<any> {
    // Arrow functions are sync - just reuse the sync version
    return this.evaluateArrowFunctionExpression(node);
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

  private async evaluateMemberExpressionAsync(
    node: ESTree.MemberExpression,
  ): Promise<any> {
    const object = await this.evaluateNodeAsync(node.object);

    if (object instanceof HostFunctionValue) {
      throw new InterpreterError("Cannot access properties on host functions");
    }

    if (node.computed) {
      const property = await this.evaluateNodeAsync(node.property);

      if (Array.isArray(object)) {
        // Convert string to number if it's a numeric string (for...in gives string indices)
        const index =
          typeof property === "string" ? Number(property) : property;

        if (typeof index !== "number" || isNaN(index)) {
          throw new InterpreterError("Array index must be a number");
        }
        if (index < 0 || index >= object.length) {
          return undefined;
        }
        return object[index];
      }

      if (typeof object === "object" && object !== null) {
        const propName = String(property);
        validatePropertyName(propName);
        return object[propName];
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

      if (property === "length") {
        if (typeof object === "string" || Array.isArray(object)) {
          return object.length;
        }
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
    const elements: any[] = [];

    for (const element of node.elements) {
      if (element === null) {
        elements.push(undefined);
      } else {
        elements.push(await this.evaluateNodeAsync(element));
      }
    }

    return elements;
  }

  private async evaluateObjectExpressionAsync(
    node: ESTree.ObjectExpression,
  ): Promise<any> {
    const obj: Record<string, any> = {};

    for (const property of node.properties) {
      if (property.type !== "Property") {
        throw new InterpreterError(
          "Only property nodes are supported in objects",
        );
      }

      let key: string;
      if (property.key.type === "Identifier") {
        key = (property.key as ESTree.Identifier).name;
      } else if (property.key.type === "Literal") {
        const literal = property.key as ESTree.Literal;
        key = String(literal.value);
      } else {
        throw new InterpreterError("Unsupported property key type");
      }

      validatePropertyName(key);

      const value = await this.evaluateNodeAsync(property.value);
      obj[key] = value;
    }

    return obj;
  }
}
