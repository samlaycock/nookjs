import type { ESTree } from "./ast";

export type ModuleSource =
  | { type: "source"; code: string; path: string }
  | { type: "ast"; ast: ESTree.Program; path: string }
  | { type: "namespace"; exports: Record<string, any>; path: string };

/**
 * Context provided to the resolver for more informed module resolution decisions.
 */
export interface ModuleResolverContext {
  /** The module specifier being resolved (e.g., "./utils", "lodash") */
  specifier: string;
  /** The path of the module requesting this import, or null for entry point */
  importer: string | null;
  /** The full chain of importers leading to this resolution (for cycle detection) */
  importerChain: readonly string[];
}

/**
 * Resolver interface for loading modules.
 *
 * Implementors control which modules can be loaded and how they are resolved.
 * Returning null blocks access to the requested module.
 */
export interface ModuleResolver {
  /**
   * Resolve a module specifier to its source.
   *
   * @param specifier - The module specifier (e.g., "./utils", "lodash")
   * @param importer - The path of the importing module, or null for entry point
   * @param context - Additional context including the full importer chain
   * @returns The module source, or null to block access
   */
  resolve(
    specifier: string,
    importer: string | null,
    context?: ModuleResolverContext,
  ): ModuleSource | Promise<ModuleSource | null> | null;

  /**
   * Optional callback invoked after a module is successfully loaded.
   * Useful for logging, metrics, or post-processing.
   */
  onLoad?(specifier: string, path: string, exports: Record<string, any>): void;

  /**
   * Optional callback invoked when module resolution or evaluation fails.
   * Useful for error reporting and debugging.
   */
  onError?(specifier: string, importer: string | null, error: Error): void;
}

export interface ModuleOptions {
  enabled: boolean;
  resolver: ModuleResolver;
  cache?: boolean;
  maxDepth?: number;
}

export const DEFAULT_MODULE_OPTIONS: ModuleOptions = {
  enabled: false,
  resolver: {
    resolve() {
      return null;
    },
  },
  cache: true,
  maxDepth: 100,
};

/**
 * Metadata about a loaded module.
 */
export interface ModuleMetadata {
  /** The resolved path of the module */
  path: string;
  /** The original specifier used to import this module */
  specifier: string;
  /** Current status of the module */
  status: "initializing" | "initialized" | "failed";
  /** Timestamp when the module was first loaded */
  loadedAt: number;
  /** Error if the module failed to load */
  error?: Error;
}

export interface ModuleRecord {
  path: string;
  specifier: string;
  exports: Record<string, any>;
  status: "initializing" | "initialized" | "failed";
  error?: Error;
  source?: string;
  ast?: ESTree.Program;
  loadedAt: number;
}

/**
 * Deep clones an object to prevent mutations from affecting the original.
 * Handles nested objects, arrays, and common value types.
 */
function deepClone<T>(obj: T, seen = new WeakMap()): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj as object)) {
    return seen.get(obj as object);
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    const cloned: unknown[] = [];
    seen.set(obj, cloned);
    for (let i = 0; i < obj.length; i++) {
      cloned[i] = deepClone(obj[i], seen);
    }
    return cloned as T;
  }

  // Handle Map
  if (obj instanceof Map) {
    const cloned = new Map();
    seen.set(obj, cloned);
    obj.forEach((value, key) => {
      cloned.set(deepClone(key, seen), deepClone(value, seen));
    });
    return cloned as T;
  }

  // Handle Set
  if (obj instanceof Set) {
    const cloned = new Set();
    seen.set(obj, cloned);
    obj.forEach((value) => {
      cloned.add(deepClone(value, seen));
    });
    return cloned as T;
  }

  // Handle plain objects
  const cloned = Object.create(Object.getPrototypeOf(obj));
  seen.set(obj as object, cloned);
  for (const key of Reflect.ownKeys(obj as object)) {
    cloned[key] = deepClone((obj as Record<string | symbol, unknown>)[key], seen);
  }
  return cloned;
}

export class ModuleSystem {
  // Cache by resolved path, not specifier (fixes cache key collision)
  private cacheByPath: Map<string, ModuleRecord> = new Map();
  // Secondary index: specifier -> path (for specifier-based lookups)
  private specifierToPath: Map<string, string> = new Map();
  private options: ModuleOptions;
  // Track depth per evaluation context using a stack (fixes shared depth counter)
  private evaluationStack: string[] = [];

  constructor(options: ModuleOptions) {
    this.options = {
      ...DEFAULT_MODULE_OPTIONS,
      ...options,
      cache: options.cache ?? true,
      maxDepth: options.maxDepth ?? 100,
    };
  }

  /**
   * Get the current importer chain for cycle detection and context.
   */
  getImporterChain(): readonly string[] {
    return [...this.evaluationStack];
  }

  /**
   * Push a module onto the evaluation stack.
   * Called when starting to evaluate a module.
   */
  pushEvaluation(path: string): void {
    this.evaluationStack.push(path);
  }

  /**
   * Pop a module from the evaluation stack.
   * Called when finished evaluating a module.
   */
  popEvaluation(): void {
    this.evaluationStack.pop();
  }

  /**
   * Get the current evaluation depth.
   */
  getCurrentDepth(): number {
    return this.evaluationStack.length;
  }

  async resolveModule(specifier: string, importer: string | null): Promise<ModuleRecord | null> {
    if (!this.options.enabled) {
      throw new Error("Module system is not enabled");
    }

    // Check cache by specifier first (for already resolved modules)
    if (this.options.cache) {
      const cachedPath = this.specifierToPath.get(specifier);
      if (cachedPath) {
        const cached = this.cacheByPath.get(cachedPath);
        if (cached && cached.status === "initialized") {
          return cached;
        }
        // If initializing, return it to handle circular deps
        if (cached && cached.status === "initializing") {
          return cached;
        }
      }
    }

    // Check depth limit
    if (
      this.options.maxDepth !== undefined &&
      this.evaluationStack.length >= this.options.maxDepth
    ) {
      const error = new Error(
        `Module resolution depth exceeded maximum (${this.options.maxDepth})`,
      );
      this.options.resolver.onError?.(specifier, importer, error);
      throw error;
    }

    try {
      // Build resolver context
      const context: ModuleResolverContext = {
        specifier,
        importer,
        importerChain: this.getImporterChain(),
      };

      const source = await this.options.resolver.resolve(specifier, importer, context);
      if (source === null) {
        return null;
      }

      const record: ModuleRecord = {
        path: source.path,
        specifier,
        exports: {},
        status: "initializing",
        loadedAt: Date.now(),
      };

      if (this.options.cache) {
        this.cacheByPath.set(source.path, record);
        this.specifierToPath.set(specifier, source.path);
      }

      if (source.type === "namespace") {
        // Deep clone namespace exports to prevent mutations affecting resolver
        // Note: Don't freeze here - ReadOnlyProxy handles immutability and freezing
        // causes issues with proxy wrapping
        record.exports = deepClone(source.exports);
        record.status = "initialized";
        this.options.resolver.onLoad?.(specifier, source.path, record.exports);
        return record;
      }

      if (source.type === "source") {
        record.source = source.code;
      } else if (source.type === "ast") {
        record.ast = source.ast;
      }

      return record;
    } catch (error) {
      this.options.resolver.onError?.(specifier, importer, error as Error);
      throw error;
    }
  }

  /**
   * Get module exports by path.
   * Returns undefined if the module is not cached or not yet initialized.
   *
   * Note: Returns the frozen exports object. While the object itself cannot
   * be mutated, callers should use ReadOnlyProxy.wrap() for full security
   * when exposing to untrusted code.
   */
  getModuleExports(path: string): Record<string, any> | undefined {
    const record = this.cacheByPath.get(path);
    if (record && record.status === "initialized") {
      return record.exports;
    }
    return undefined;
  }

  /**
   * Get module exports by specifier.
   */
  getModuleExportsBySpecifier(specifier: string): Record<string, any> | undefined {
    const path = this.specifierToPath.get(specifier);
    if (path) {
      return this.getModuleExports(path);
    }
    return undefined;
  }

  /**
   * Set module exports after evaluation completes.
   *
   * Note: Exports from evaluateModuleAstAsync are already wrapped in ReadOnlyProxy,
   * which provides mutation protection. We store them directly without additional
   * freezing since the proxy already blocks mutations.
   */
  setModuleExports(specifier: string, exports: Record<string, any>): void {
    const path = this.specifierToPath.get(specifier);
    if (!path) return;

    const record = this.cacheByPath.get(path);
    if (record) {
      // Exports are already protected by ReadOnlyProxy from evaluateModuleAstAsync
      record.exports = exports;
      record.status = "initialized";
      this.options.resolver.onLoad?.(specifier, path, record.exports);
    }
  }

  /**
   * Mark a module as failed.
   */
  setModuleFailed(specifier: string, error: Error): void {
    const path = this.specifierToPath.get(specifier);
    if (!path) return;

    const record = this.cacheByPath.get(path);
    if (record) {
      record.status = "failed";
      record.error = error;
      this.options.resolver.onError?.(specifier, null, error);
    }
  }

  /**
   * Clear all module caches.
   */
  clearCache(): void {
    this.cacheByPath.clear();
    this.specifierToPath.clear();
    this.evaluationStack = [];
  }

  /**
   * Check if modules are enabled.
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Get the maximum allowed module depth.
   */
  getMaxDepth(): number {
    return this.options.maxDepth ?? DEFAULT_MODULE_OPTIONS.maxDepth!;
  }

  // ============================================================================
  // MODULE INTROSPECTION API
  // ============================================================================

  /**
   * Check if a module is cached (by specifier).
   */
  isModuleCached(specifier: string): boolean {
    return this.specifierToPath.has(specifier);
  }

  /**
   * Check if a module is cached (by path).
   */
  isModuleCachedByPath(path: string): boolean {
    return this.cacheByPath.has(path);
  }

  /**
   * Get a list of all loaded module paths.
   */
  getLoadedModules(): string[] {
    return Array.from(this.cacheByPath.keys());
  }

  /**
   * Get a list of all registered specifiers.
   */
  getLoadedSpecifiers(): string[] {
    return Array.from(this.specifierToPath.keys());
  }

  /**
   * Get metadata about a loaded module.
   */
  getModuleMetadata(specifier: string): ModuleMetadata | undefined {
    const path = this.specifierToPath.get(specifier);
    if (!path) return undefined;

    const record = this.cacheByPath.get(path);
    if (!record) return undefined;

    return {
      path: record.path,
      specifier: record.specifier,
      status: record.status,
      loadedAt: record.loadedAt,
      error: record.error,
    };
  }

  /**
   * Get metadata about a loaded module by path.
   */
  getModuleMetadataByPath(path: string): ModuleMetadata | undefined {
    const record = this.cacheByPath.get(path);
    if (!record) return undefined;

    return {
      path: record.path,
      specifier: record.specifier,
      status: record.status,
      loadedAt: record.loadedAt,
      error: record.error,
    };
  }

  /**
   * Get the number of cached modules.
   */
  getCacheSize(): number {
    return this.cacheByPath.size;
  }
}

export function isModuleStatement(
  node: ESTree.Node,
): node is
  | ESTree.ImportDeclaration
  | ESTree.ExportNamedDeclaration
  | ESTree.ExportDefaultDeclaration
  | ESTree.ExportAllDeclaration {
  return (
    node.type === "ImportDeclaration" ||
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration" ||
    node.type === "ExportAllDeclaration"
  );
}
