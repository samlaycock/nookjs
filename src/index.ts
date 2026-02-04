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

export {
  createSandbox,
  run,
  parse,
  type FeatureToggles,
  type ParseOnceOptions,
  type ResultMode,
  type RunLimits,
  type RunModuleOptions,
  type RunModuleOptionsFull,
  type RunOnceOptions,
  type RunOnceOptionsFull,
  type RunOptions,
  type RunOptionsFull,
  type RunResult,
  type Sandbox,
  type SandboxApi,
  type SandboxEnv,
  type SandboxLimits,
  type SandboxModules,
  type SandboxOptions,
  type SandboxParseOptions,
  type SandboxPolicy,
  type TotalLimits,
} from "./sandbox";

export type {
  ModuleResolver,
  ModuleResolverContext,
  ModuleOptions,
  ModuleSource,
  ModuleRecord,
  ModuleMetadata,
} from "./modules";
export { ModuleSystem } from "./modules";

export * from "./presets";
export * from "./utils";
