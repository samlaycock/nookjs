export { ParseError } from "./ast";
export type { ESTree } from "./ast";
export { Interpreter, InterpreterError } from "./interpreter";
export type {
  InterpreterOptions,
  EvaluateOptions,
  ParseOptions,
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

export {
  ResourceTracker,
  ResourceExhaustedError,
  type ResourceLimits,
  type ResourceStats,
  type ResourceHistoryEntry,
} from "./resource-tracker";

export type {
  ModuleResolver,
  ModuleOptions,
  ModuleSource,
  ModuleRecord,
} from "./modules";
export { ModuleSystem } from "./modules";

export * from "./presets";
export * from "./utils";
