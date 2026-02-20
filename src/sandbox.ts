import type { ESTree } from "./ast";
import type {
  EvaluateOptions,
  ExecutionStats,
  FeatureControl,
  InterpreterOptions,
  LanguageFeature,
  SecurityOptions,
} from "./interpreter";
import type { ModuleOptions, ModuleResolver } from "./modules";
import type { ResourceStats } from "./resource-tracker";

import { Interpreter } from "./interpreter";
import {
  BlobAPI,
  Browser,
  BufferAPI,
  ConsoleAPI,
  CryptoAPI,
  ES2015,
  ES2016,
  ES2017,
  ES2018,
  ES2019,
  ES2020,
  ES2021,
  ES2022,
  ES2023,
  ES2024,
  ES5,
  ES6,
  ESNext,
  EventAPI,
  FetchAPI,
  IntlAPI,
  Minimal,
  NodeJS,
  PerformanceAPI,
  RegExpAPI,
  StreamsAPI,
  TextCodecAPI,
  TimersAPI,
  WinterCG,
  preset,
} from "./presets";

export type SandboxEnv =
  | "minimal"
  | "browser"
  | "wintercg"
  | "node"
  | "es5"
  | "es6"
  | "es2015"
  | "es2016"
  | "es2017"
  | "es2018"
  | "es2019"
  | "es2020"
  | "es2021"
  | "es2022"
  | "es2023"
  | "es2024"
  | "esnext"
  | "ES5"
  | "ES6"
  | "ES2015"
  | "ES2016"
  | "ES2017"
  | "ES2018"
  | "ES2019"
  | "ES2020"
  | "ES2021"
  | "ES2022"
  | "ES2023"
  | "ES2024"
  | "ESNext";

export type SandboxApi =
  | "fetch"
  | "console"
  | "timers"
  | "text"
  | "textcodec"
  | "crypto"
  | "regexp"
  | "regex"
  | "intl"
  | "buffer"
  | "streams"
  | "blob"
  | "performance"
  | "events";

export type ResultMode = "value" | "full";

export interface FeatureToggles {
  readonly enable?: readonly LanguageFeature[];
  readonly disable?: readonly LanguageFeature[];
  readonly mode?: "whitelist" | "blacklist";
}

export interface RunLimits {
  readonly callDepth?: number;
  readonly loops?: number;
  readonly memoryBytes?: number;
}

export interface TotalLimits {
  readonly memoryBytes?: number;
  readonly iterations?: number;
  readonly functionCalls?: number;
  readonly cpuTimeMs?: number;
  readonly evaluations?: number;
}

export interface SandboxLimits {
  readonly perRun?: RunLimits;
  readonly total?: TotalLimits;
}

export interface SandboxPolicy {
  readonly errors?: "safe" | "sanitize" | "full";
}

export interface SandboxModules {
  readonly files?: Record<string, string>;
  readonly ast?: Record<string, ESTree.Program>;
  readonly externals?: Record<string, Record<string, unknown>>;
  readonly resolver?: ModuleResolver;
  readonly cache?: boolean;
  readonly maxDepth?: number;
}

export interface SandboxOptions {
  readonly env?: SandboxEnv;
  readonly apis?: readonly SandboxApi[];
  readonly globals?: Record<string, unknown>;
  readonly features?: FeatureToggles;
  readonly limits?: SandboxLimits;
  readonly timeoutMs?: number;
  readonly policy?: SandboxPolicy;
  readonly modules?: SandboxModules;
  readonly validator?: (ast: ESTree.Program) => boolean;
  readonly trackResources?: boolean;
  readonly security?: SecurityOptions;
  readonly strictEvaluationIsolation?: boolean;
}

export interface RunOptions {
  readonly globals?: Record<string, unknown>;
  readonly features?: FeatureToggles;
  readonly limits?: RunLimits;
  readonly validator?: (ast: ESTree.Program) => boolean;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly result?: ResultMode;
}

export interface RunOptionsFull extends RunOptions {
  readonly result: "full";
}

export interface RunModuleOptions extends RunOptions {
  readonly path: string;
}

export interface RunModuleOptionsFull extends RunModuleOptions {
  readonly result: "full";
}

export interface RunOnceOptions extends RunOptions {
  readonly sandbox?: SandboxOptions;
}

export interface RunOnceOptionsFull extends RunOnceOptions {
  readonly result: "full";
}

export interface SandboxParseOptions {
  readonly validator?: (ast: ESTree.Program) => boolean;
}

export interface ParseOnceOptions extends SandboxParseOptions {
  readonly sandbox?: SandboxOptions;
}

export interface RunResult<T = unknown> {
  readonly value: T;
  readonly stats: ExecutionStats;
  readonly resources?: ResourceStats;
}

export interface Sandbox {
  run<T = unknown>(code: string, options: RunOptionsFull): Promise<RunResult<T>>;
  runSync<T = unknown>(code: string, options: RunOptionsFull): RunResult<T>;
  run<T = unknown>(code: string, options?: RunOptions): Promise<T>;
  runSync<T = unknown>(code: string, options?: RunOptions): T;
  runModule<T extends Record<string, unknown> = Record<string, unknown>>(
    code: string,
    options: RunModuleOptionsFull,
  ): Promise<RunResult<T>>;
  runModule<T extends Record<string, unknown> = Record<string, unknown>>(
    code: string,
    options: RunModuleOptions,
  ): Promise<T>;
  parse(code: string, options?: SandboxParseOptions): ESTree.Program;
  stats(): ExecutionStats;
  resources(): ResourceStats | undefined;
  readonly interpreter: Interpreter;
}

const ENV_PRESET_MAP: Record<string, InterpreterOptions> = {
  minimal: Minimal,
  browser: Browser,
  wintercg: WinterCG,
  node: NodeJS,
  es5: ES5,
  es6: ES6,
  es2015: ES2015,
  es2016: ES2016,
  es2017: ES2017,
  es2018: ES2018,
  es2019: ES2019,
  es2020: ES2020,
  es2021: ES2021,
  es2022: ES2022,
  es2023: ES2023,
  es2024: ES2024,
  esnext: ESNext,
};

const API_PRESET_MAP: Record<string, InterpreterOptions> = {
  fetch: FetchAPI,
  console: ConsoleAPI,
  timers: TimersAPI,
  text: TextCodecAPI,
  textcodec: TextCodecAPI,
  crypto: CryptoAPI,
  regexp: RegExpAPI,
  regex: RegExpAPI,
  intl: IntlAPI,
  buffer: BufferAPI,
  streams: StreamsAPI,
  blob: BlobAPI,
  performance: PerformanceAPI,
  events: EventAPI,
};

const DEFAULT_SAFE_RUN_LIMITS: RunLimits = {
  callDepth: 250,
  loops: 100_000,
  memoryBytes: 16 * 1024 * 1024,
};

const resolveEnvPreset = (env?: SandboxEnv): InterpreterOptions => {
  if (!env) {
    return Minimal;
  }

  const direct = ENV_PRESET_MAP[env];
  if (direct) {
    return direct;
  }

  const normalized = env.toLowerCase();
  const normalizedPreset = ENV_PRESET_MAP[normalized];
  if (normalizedPreset) {
    return normalizedPreset;
  }

  throw new Error(`Unknown env preset: ${env}`);
};

const resolveApiPresets = (apis?: readonly SandboxApi[]): InterpreterOptions[] => {
  if (!apis || apis.length === 0) {
    return [];
  }

  const resolved: InterpreterOptions[] = [];

  for (const api of apis) {
    const key = api.toLowerCase();
    const preset = API_PRESET_MAP[key];
    if (!preset) {
      throw new Error(`Unknown API preset: ${api}`);
    }
    resolved.push(preset);
  }

  return resolved;
};

const resolveSecurity = (
  policy?: SandboxPolicy,
  securityOverride?: SecurityOptions,
): SecurityOptions | undefined => {
  if (securityOverride) {
    return securityOverride;
  }

  if (!policy?.errors) {
    return undefined;
  }

  if (policy.errors === "full") {
    return { sanitizeErrors: false, hideHostErrorMessages: false };
  }

  if (policy.errors === "sanitize") {
    return { sanitizeErrors: true, hideHostErrorMessages: false };
  }

  return { sanitizeErrors: true, hideHostErrorMessages: true };
};

const hasTotalLimits = (limits?: TotalLimits): boolean => {
  if (!limits) {
    return false;
  }

  return (
    limits.memoryBytes !== undefined ||
    limits.iterations !== undefined ||
    limits.functionCalls !== undefined ||
    limits.cpuTimeMs !== undefined ||
    limits.evaluations !== undefined
  );
};

const resolveFeatureControl = (
  base: FeatureControl | undefined,
  toggles?: FeatureToggles,
): FeatureControl | undefined => {
  if (!toggles || (!toggles.enable?.length && !toggles.disable?.length && !toggles.mode)) {
    return base;
  }

  const enable = new Set(toggles.enable ?? []);
  const disable = new Set(toggles.disable ?? []);

  if (base?.mode === "whitelist") {
    const features = new Set(base.features);
    for (const feature of enable) {
      features.add(feature);
    }
    for (const feature of disable) {
      features.delete(feature);
    }
    return { mode: "whitelist", features: [...features] as LanguageFeature[] };
  }

  if (base?.mode === "blacklist") {
    const features = new Set(base.features);
    for (const feature of enable) {
      features.delete(feature);
    }
    for (const feature of disable) {
      features.add(feature);
    }
    return { mode: "blacklist", features: [...features] as LanguageFeature[] };
  }

  const mode = toggles.mode ?? (disable.size > 0 ? "blacklist" : "whitelist");
  if (mode === "whitelist") {
    return { mode: "whitelist", features: [...enable] as LanguageFeature[] };
  }

  const blacklist = new Set(disable);
  for (const feature of enable) {
    blacklist.delete(feature);
  }
  return { mode: "blacklist", features: [...blacklist] as LanguageFeature[] };
};

const resolveModules = (modules?: SandboxModules): ModuleOptions | undefined => {
  if (!modules) {
    return undefined;
  }

  const files = modules.files ?? {};
  const ast = modules.ast ?? {};
  const externals = modules.externals ?? {};
  const resolver: ModuleResolver = {
    resolve(specifier, importer, context) {
      if (Object.prototype.hasOwnProperty.call(files, specifier)) {
        const code = files[specifier];
        if (code !== undefined) {
          return { type: "source", code, path: specifier };
        }
      }

      if (Object.prototype.hasOwnProperty.call(ast, specifier)) {
        const program = ast[specifier];
        if (program !== undefined) {
          return { type: "ast", ast: program, path: specifier };
        }
      }

      if (Object.prototype.hasOwnProperty.call(externals, specifier)) {
        const exports = externals[specifier];
        if (exports !== undefined) {
          return { type: "namespace", exports, path: specifier };
        }
      }

      return modules.resolver?.resolve(specifier, importer, context) ?? null;
    },
    onLoad: modules.resolver?.onLoad
      ? (specifier, path, exports) => modules.resolver?.onLoad?.(specifier, path, exports)
      : undefined,
    onError: modules.resolver?.onError
      ? (specifier, importer, error) => modules.resolver?.onError?.(specifier, importer, error)
      : undefined,
  };

  return {
    enabled: true,
    resolver,
    cache: modules.cache,
    maxDepth: modules.maxDepth,
  };
};

const mergeRunLimits = (defaults?: RunLimits, overrides?: RunLimits): RunLimits | undefined => {
  if (!defaults && !overrides) {
    return undefined;
  }

  return { ...defaults, ...overrides };
};

const buildEvaluateOptions = (
  baseFeatureControl: FeatureControl | undefined,
  defaultLimits: RunLimits | undefined,
  options?: RunOptions,
  signal?: AbortSignal,
): EvaluateOptions => {
  const featureControl = resolveFeatureControl(baseFeatureControl, options?.features);
  const limits = mergeRunLimits(defaultLimits, options?.limits);

  return {
    ...(options?.globals ? { globals: options.globals } : {}),
    ...(options?.validator ? { validator: options.validator } : {}),
    ...(featureControl ? { featureControl } : {}),
    ...(signal ? { signal } : {}),
    ...(limits?.callDepth !== undefined ? { maxCallStackDepth: limits.callDepth } : {}),
    ...(limits?.loops !== undefined ? { maxLoopIterations: limits.loops } : {}),
    ...(limits?.memoryBytes !== undefined ? { maxMemory: limits.memoryBytes } : {}),
  };
};

interface ResolvedRunSignal {
  readonly signal?: AbortSignal;
  cleanup(): void;
}

const validateTimeoutMs = (timeoutMs: number): void => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive finite number");
  }
};

const resolveRunSignal = (defaultTimeoutMs?: number, options?: RunOptions): ResolvedRunSignal => {
  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  const externalSignal = options?.signal;

  if (timeoutMs === undefined) {
    return {
      signal: externalSignal,
      cleanup: () => {},
    };
  }

  validateTimeoutMs(timeoutMs);

  const controller = new AbortController();
  let cleaned = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => {
    controller.abort();
    cleanup();
  };

  const cleanup = () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  };

  if (externalSignal?.aborted) {
    controller.abort();
    return {
      signal: controller.signal,
      cleanup,
    };
  }

  if (externalSignal) {
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  timeoutId = setTimeout(() => {
    controller.abort();
    cleanup();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup,
  };
};

const assertSyncTimeoutIsDisabled = (defaultTimeoutMs?: number, options?: RunOptions): void => {
  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  if (timeoutMs !== undefined) {
    throw new Error("timeoutMs is only supported for async execution");
  }
};

const formatResult = <T>(
  value: T,
  mode: ResultMode | undefined,
  interpreter: Interpreter,
  trackResources: boolean,
): T | RunResult<T> => {
  if (mode !== "full") {
    return value;
  }

  const stats = interpreter.getStats();
  const resources = trackResources ? interpreter.getResourceStats() : undefined;
  return { value, stats, resources };
};

const applyTotalLimits = (interpreter: Interpreter, limits?: TotalLimits): void => {
  if (!limits) {
    return;
  }

  if (limits.memoryBytes !== undefined) {
    interpreter.setResourceLimit("maxTotalMemory", limits.memoryBytes);
  }
  if (limits.iterations !== undefined) {
    interpreter.setResourceLimit("maxTotalIterations", limits.iterations);
  }
  if (limits.functionCalls !== undefined) {
    interpreter.setResourceLimit("maxFunctionCalls", limits.functionCalls);
  }
  if (limits.cpuTimeMs !== undefined) {
    interpreter.setResourceLimit("maxCpuTime", limits.cpuTimeMs);
  }
  if (limits.evaluations !== undefined) {
    interpreter.setResourceLimit("maxEvaluations", limits.evaluations);
  }
};

export const createSandbox = (options: SandboxOptions = {}): Sandbox => {
  const envPreset = resolveEnvPreset(options.env);
  const apiPresets = resolveApiPresets(options.apis);
  const baseOptions = preset(envPreset, ...apiPresets);
  const featureControl = resolveFeatureControl(baseOptions.featureControl, options.features);
  const security = resolveSecurity(options.policy, options.security);
  const modules = resolveModules(options.modules);
  const trackResources = options.trackResources === true || hasTotalLimits(options.limits?.total);

  const interpreterOptions: InterpreterOptions = {
    ...baseOptions,
    ...(modules ? { modules } : {}),
    ...(security ? { security } : {}),
    ...(featureControl ? { featureControl } : {}),
    ...(trackResources ? { resourceTracking: true } : {}),
    ...(options.validator ? { validator: options.validator } : {}),
    ...(options.strictEvaluationIsolation ? { strictEvaluationIsolation: true } : {}),
    globals: {
      ...baseOptions.globals,
      ...options.globals,
    },
  };

  const interpreter = new Interpreter(interpreterOptions);
  applyTotalLimits(interpreter, options.limits?.total);

  const defaultLimits = mergeRunLimits(DEFAULT_SAFE_RUN_LIMITS, options.limits?.perRun);
  const defaultTimeoutMs = options.timeoutMs;
  const baseFeatureSet = featureControl ?? baseOptions.featureControl;
  const defaultParseOptions = options.validator ? { validator: options.validator } : undefined;

  function run<T = unknown>(code: string, runOptions: RunOptionsFull): Promise<RunResult<T>>;
  function run<T = unknown>(code: string, runOptions?: RunOptions): Promise<T>;
  async function run<T = unknown>(
    code: string,
    runOptions?: RunOptions,
  ): Promise<T | RunResult<T>> {
    const resolvedSignal = resolveRunSignal(defaultTimeoutMs, runOptions);
    const evaluateOptions = buildEvaluateOptions(
      baseFeatureSet,
      defaultLimits,
      runOptions,
      resolvedSignal.signal,
    );
    try {
      const value = (await interpreter.evaluateAsync(code, evaluateOptions)) as T;
      return formatResult(value, runOptions?.result, interpreter, trackResources);
    } finally {
      resolvedSignal.cleanup();
    }
  }

  function runSync<T = unknown>(code: string, runOptions: RunOptionsFull): RunResult<T>;
  function runSync<T = unknown>(code: string, runOptions?: RunOptions): T;
  function runSync<T = unknown>(code: string, runOptions?: RunOptions): T | RunResult<T> {
    assertSyncTimeoutIsDisabled(defaultTimeoutMs, runOptions);
    const evaluateOptions = buildEvaluateOptions(baseFeatureSet, defaultLimits, runOptions);
    const value = interpreter.evaluate(code, evaluateOptions) as T;
    return formatResult(value, runOptions?.result, interpreter, trackResources);
  }

  function runModule<T extends Record<string, unknown> = Record<string, unknown>>(
    code: string,
    runOptions: RunModuleOptionsFull,
  ): Promise<RunResult<T>>;
  function runModule<T extends Record<string, unknown> = Record<string, unknown>>(
    code: string,
    runOptions: RunModuleOptions,
  ): Promise<T>;
  async function runModule<T extends Record<string, unknown> = Record<string, unknown>>(
    code: string,
    runOptions: RunModuleOptions,
  ): Promise<T | RunResult<T>> {
    const resolvedSignal = resolveRunSignal(defaultTimeoutMs, runOptions);
    const evaluateOptions = buildEvaluateOptions(
      baseFeatureSet,
      defaultLimits,
      runOptions,
      resolvedSignal.signal,
    );
    try {
      const exports = (await interpreter.evaluateModuleAsync(code, {
        path: runOptions.path,
        ...evaluateOptions,
      })) as T;
      return formatResult(exports, runOptions.result, interpreter, trackResources);
    } finally {
      resolvedSignal.cleanup();
    }
  }

  const parse = (code: string, parseOptions?: SandboxParseOptions): ESTree.Program => {
    const options = parseOptions?.validator
      ? { validator: parseOptions.validator }
      : defaultParseOptions;
    return interpreter.parse(code, options);
  };

  return {
    run,
    runSync,
    runModule,
    parse,
    stats: () => interpreter.getStats(),
    resources: () => (trackResources ? interpreter.getResourceStats() : undefined),
    interpreter,
  };
};

export function run<T = unknown>(code: string, options: RunOnceOptionsFull): Promise<RunResult<T>>;
export function run<T = unknown>(code: string, options?: RunOnceOptions): Promise<T>;
export async function run<T = unknown>(
  code: string,
  options?: RunOnceOptions,
): Promise<T | RunResult<T>> {
  const sandbox = createSandbox(options?.sandbox);
  return sandbox.run<T>(code, options);
}

export const parse = (code: string, options?: ParseOnceOptions): ESTree.Program => {
  if (options?.sandbox) {
    const sandbox = createSandbox(options.sandbox);
    return sandbox.parse(code, { validator: options.validator });
  }

  const interpreter = new Interpreter();
  const parseOptions = options?.validator ? { validator: options.validator } : undefined;
  return interpreter.parse(code, parseOptions);
};
