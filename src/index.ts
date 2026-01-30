export { ParseError } from "./ast";
export type { ESTree } from "./ast";
export { Interpreter, InterpreterError } from "./interpreter";
export type {
  InterpreterOptions,
  EvaluateOptions,
  LanguageFeature,
  FeatureControl,
  SecurityOptions,
  ExecutionStats,
  ExecutionStep,
} from "./interpreter";

export {
  InterpreterError as InterpreterErrorBase,
  ParseError as ParseErrorBase,
  RuntimeError,
  SecurityError,
  FeatureError,
  ErrorCode,
  type Location,
  type StackFrame,
  formatError,
} from "./errors";

export * from "./presets";
export * from "./utils";
