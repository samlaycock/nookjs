export enum ErrorCode {
  UNEXPECTED_TOKEN = "E0001",
  UNTERMINATED_STRING = "E0002",
  UNTERMINATED_TEMPLATE = "E0003",
  UNTERMINATED_REGEXP = "E0004",
  UNEXPECTED_TOKEN_LEFT_HAND_SIDE = "E0005",
  INVALID_FOR_LEFT_HAND_SIDE = "E0006",
  UNEXPECTED_TOKEN_IN_SWITCH = "E0007",
  MISSING_BODY = "E0008",
  MISSING_CATCH_OR_FINALLY = "E0009",
  ILLEGAL_BREAK_CONTINUE = "E0010",
  INVALID_ITERATOR = "E0011",
  YIELD_DELEGATION_TARGET = "E0012",
  GENERATOR_STATE = "E0013",
  UNDEFINED_VARIABLE = "E0100",
  RECONSTRUCTED_STACK = "E0101",
  THROWN_ERROR = "E0102",
  INVALID_RIGHT_HAND_SIDE = "E0103",
  INVALID_OPERAND = "E0104",
  INVALID_UPDATE_TARGET = "E0105",
  INVALID_DELETE_TARGET = "E0106",
  INVALID_AWAIT = "E0107",
  INVALID_YIELD = "E0108",
  TYPE_ERROR = "E0109",
  REFERENCE_ERROR = "E0110",
  PROPERTY_ACCESS_ERROR = "E0111",
  CALL_NON_FUNCTION = "E0112",
  NOT_CONSTRUCTABLE = "E0113",
  ARGUMENTS_NOT_SUPPORTED = "E0114",
  SUPER_CALL_OUTSIDE_CLASS = "E0115",
  SUPER_NO_CONSTRUCTOR = "E0116",
  PRIVATE_FIELD_ACCESS = "E0117",
  PROPERTY_NAME_FORBIDDEN = "E1001",
  SYMBOL_NAME_FORBIDDEN = "E1002",
  GLOBAL_NAME_FORBIDDEN = "E1003",
  PROTO_POLLUTION = "E1004",
  PROTOTYPE_ACCESS = "E1005",
  CONSTRUCTOR_PROTOTYPE = "E1006",
  SET_PROTOTYPE_OF = "E1007",
  ASSIGN_PROTOTYPE = "E1008",
  FEATURE_NOT_ENABLED = "E2001",
}

export interface Location {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface StackFrame {
  functionName?: string;
  fileName: string;
  line: number;
  column: number;
}

export interface SourceLocation {
  sourceCode: string;
  location: Location;
}

export class InterpreterError extends Error {
  type: "parse" | "runtime" | "security" | "feature" = "runtime";
  line: number = 0;
  column: number = 0;
  endLine?: number;
  endColumn?: number;
  code?: ErrorCode;
  sourceCode?: string;
  callStack?: StackFrame[];

  constructor(
    message: string,
    options?: {
      line?: number;
      column?: number;
      endLine?: number;
      endColumn?: number;
      code?: ErrorCode;
      sourceCode?: string;
      callStack?: StackFrame[];
    },
  ) {
    super(message);
    this.name = "InterpreterError";
    if (options) {
      this.line = options.line ?? this.line;
      this.column = options.column ?? this.column;
      this.endLine = options.endLine;
      this.endColumn = options.endColumn;
      this.code = options.code;
      this.sourceCode = options.sourceCode;
      this.callStack = options.callStack;
    }
  }

  toString(): string {
    return formatError(this);
  }
}

export class ParseError extends InterpreterError {
  type: "parse" = "parse";
  expectedToken?: string;

  constructor(
    message: string,
    options?: {
      line?: number;
      column?: number;
      endLine?: number;
      endColumn?: number;
      code?: ErrorCode;
      sourceCode?: string;
      expectedToken?: string;
    },
  ) {
    super(message, options);
    this.name = "ParseError";
    if (options) {
      this.expectedToken = options.expectedToken;
    }
  }
}

export class RuntimeError extends InterpreterError {
  type: "runtime" = "runtime";
  thrownValue: unknown;

  constructor(
    message: string,
    thrownValue: unknown,
    options?: {
      line?: number;
      column?: number;
      endLine?: number;
      endColumn?: number;
      code?: ErrorCode;
      sourceCode?: string;
      callStack?: StackFrame[];
    },
  ) {
    super(message, options);
    this.name = "RuntimeError";
    this.thrownValue = thrownValue;
  }
}

export class SecurityError extends InterpreterError {
  type: "security" = "security";
  operation: string;
  blockedProperty?: string;

  constructor(
    operation: string,
    blockedProperty?: string,
    options?: {
      line?: number;
      column?: number;
      endLine?: number;
      endColumn?: number;
      code?: ErrorCode;
      sourceCode?: string;
    },
  ) {
    const message = blockedProperty
      ? `${operation}: '${blockedProperty}' is blocked for security reasons`
      : `${operation} is blocked for security reasons`;
    super(message, options);
    this.name = "SecurityError";
    this.operation = operation;
    this.blockedProperty = blockedProperty;
  }
}

export class FeatureError extends InterpreterError {
  type: "feature" = "feature";
  feature: string;
  suggestion?: string;

  constructor(
    feature: string,
    options?: {
      line?: number;
      column?: number;
      endLine?: number;
      endColumn?: number;
      code?: ErrorCode;
      sourceCode?: string;
      suggestion?: string;
    },
  ) {
    const message = options?.suggestion
      ? `${feature} is not enabled. ${options.suggestion}`
      : `${feature} is not enabled`;
    super(message, options);
    this.name = "FeatureError";
    this.feature = feature;
    if (options) {
      this.suggestion = options.suggestion;
    }
  }
}

export function getSourceLine(sourceCode: string, line: number): string | null {
  const lines = sourceCode.split("\n");
  if (line < 1 || line > lines.length) {
    return null;
  }
  return lines[line - 1];
}

export function formatError(error: InterpreterError): string {
  let result = "";

  const errorName = error.name;
  const errorCode = error.code ? ` [${error.code}]` : "";

  result += `${errorName}${errorCode}: ${error.message}`;

  if (error.sourceCode) {
    const sourceLine = getSourceLine(error.sourceCode, error.line);
    if (sourceLine !== null) {
      result += "\n  |";
      result += `\n${error.line} | ${sourceLine}`;
      const caretColumn = error.column > 0 ? error.column - 1 : 0;
      const caretLength = error.endColumn && error.endColumn > error.column ? error.endColumn - error.column : 1;
      const spaces = " ".repeat(caretColumn);
      const carets = "^".repeat(caretLength);
      result += `\n  | ${spaces}${carets}`;
    }
  }

  if (error.callStack && error.callStack.length > 0) {
    result += "\n\nCall stack:";
    for (const frame of error.callStack) {
      const functionName = frame.functionName ?? "(anonymous)";
      result += `\n  at ${functionName} (${frame.fileName}:${frame.line}:${frame.column})`;
    }
  }

  return result;
}

export function parseErrorToInterpreterError(parseError: ParseError, sourceCode: string): InterpreterError {
  return new InterpreterError(parseError.message, {
    line: parseError.line,
    column: parseError.column,
    endLine: parseError.endLine,
    endColumn: parseError.endColumn,
    code: parseError.code,
    sourceCode,
  });
}
