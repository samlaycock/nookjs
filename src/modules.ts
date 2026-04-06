import type { ESTree } from "./ast";

const MAX_RESOLVED_PATH_CONTEXT_CACHE_SIZE = 1024;

interface ResolutionContextCacheNode {
  children: Map<string, ResolutionContextCacheNode>;
  entry?: ResolutionContextCacheEntry;
}

interface ResolutionContextCacheEntry {
  importer: string | null;
  importerChain: readonly string[];
  node: ResolutionContextCacheNode;
  path: string;
  specifier: string;
}

function createResolutionContextCacheNode(): ResolutionContextCacheNode {
  return { children: new Map() };
}

/**
 * Structured resolution-context cache keyed by specifier, importer, and importer chain.
 * This avoids per-lookup serialization while retaining bounded LRU-style eviction.
 */
class ResolutionContextPathCache {
  private readonly bySpecifier: Map<string, Map<string | null, ResolutionContextCacheNode>> =
    new Map();
  private readonly lruEntries: Set<ResolutionContextCacheEntry> = new Set();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get size(): number {
    return this.lruEntries.size;
  }

  clear(): void {
    this.bySpecifier.clear();
    this.lruEntries.clear();
  }

  delete(specifier: string, importer: string | null, importerChain: readonly string[]): void {
    const entry = this.getEntry(specifier, importer, importerChain);
    if (!entry) {
      return;
    }

    this.deleteEntry(entry);
  }

  get(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): string | undefined {
    const entry = this.getEntry(specifier, importer, importerChain);
    if (!entry) {
      return undefined;
    }

    this.touchEntry(entry);
    return entry.path;
  }

  set(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
    path: string,
  ): void {
    const node = this.getOrCreateLeafNode(specifier, importer, importerChain);
    const existingEntry = node.entry;
    if (existingEntry) {
      existingEntry.path = path;
      this.touchEntry(existingEntry);
      return;
    }

    const entry: ResolutionContextCacheEntry = {
      importer,
      importerChain,
      node,
      path,
      specifier,
    };
    node.entry = entry;
    this.lruEntries.add(entry);

    if (this.lruEntries.size > this.maxSize) {
      const oldestEntry = this.lruEntries.values().next().value;
      if (oldestEntry) {
        this.deleteEntry(oldestEntry);
      }
    }
  }

  private deleteEntry(entry: ResolutionContextCacheEntry): void {
    entry.node.entry = undefined;
    this.lruEntries.delete(entry);
    this.pruneEmptyNodes(entry.specifier, entry.importer, entry.importerChain);
  }

  private getEntry(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): ResolutionContextCacheEntry | undefined {
    const importerNodes = this.bySpecifier.get(specifier);
    if (!importerNodes) {
      return undefined;
    }

    const rootNode = importerNodes.get(importer);
    if (!rootNode) {
      return undefined;
    }

    const leafNode = this.getLeafNode(rootNode, importerChain);
    return leafNode?.entry;
  }

  private getLeafNode(
    rootNode: ResolutionContextCacheNode,
    importerChain: readonly string[],
  ): ResolutionContextCacheNode | undefined {
    let currentNode: ResolutionContextCacheNode | undefined = rootNode;
    for (const segment of importerChain) {
      currentNode = currentNode.children.get(segment);
      if (!currentNode) {
        return undefined;
      }
    }
    return currentNode;
  }

  private getOrCreateLeafNode(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): ResolutionContextCacheNode {
    let importerNodes = this.bySpecifier.get(specifier);
    if (!importerNodes) {
      importerNodes = new Map();
      this.bySpecifier.set(specifier, importerNodes);
    }

    let rootNode = importerNodes.get(importer);
    if (!rootNode) {
      rootNode = createResolutionContextCacheNode();
      importerNodes.set(importer, rootNode);
    }

    let currentNode = rootNode;
    for (const segment of importerChain) {
      let nextNode = currentNode.children.get(segment);
      if (!nextNode) {
        nextNode = createResolutionContextCacheNode();
        currentNode.children.set(segment, nextNode);
      }
      currentNode = nextNode;
    }

    return currentNode;
  }

  private pruneEmptyNodes(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): void {
    const importerNodes = this.bySpecifier.get(specifier);
    if (!importerNodes) {
      return;
    }

    const rootNode = importerNodes.get(importer);
    if (!rootNode) {
      return;
    }

    const visitedNodes: ResolutionContextCacheNode[] = [rootNode];
    let currentNode: ResolutionContextCacheNode | undefined = rootNode;
    for (const segment of importerChain) {
      currentNode = currentNode.children.get(segment);
      if (!currentNode) {
        return;
      }
      visitedNodes.push(currentNode);
    }

    for (let index = importerChain.length; index > 0; index -= 1) {
      const node = visitedNodes[index]!;
      if (node.entry || node.children.size > 0) {
        return;
      }

      const parentNode = visitedNodes[index - 1]!;
      const segment = importerChain[index - 1]!;
      parentNode.children.delete(segment);
    }

    if (!rootNode.entry && rootNode.children.size === 0) {
      importerNodes.delete(importer);
      if (importerNodes.size === 0) {
        this.bySpecifier.delete(specifier);
      }
    }
  }

  private touchEntry(entry: ResolutionContextCacheEntry): void {
    this.lruEntries.delete(entry);
    this.lruEntries.add(entry);
  }
}

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

export interface ModuleImportMetaContext {
  /** The resolved canonical path of the module being evaluated */
  path: string;
  /** The original specifier used to load the module */
  specifier: string;
  /** The path of the importing module, or null for entry point */
  importer: string | null;
}

/**
 * Optional context for importer-aware module introspection.
 */
export interface ModuleIntrospectionContext {
  /** The path of the module that imported the specifier, or null for entry point */
  importer?: string | null;
  /** Optional full importer chain when resolution depends on more than the importer alone */
  importerChain?: readonly string[];
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
   * Optional callback invoked after resolving a canonical module path and before
   * returning either a cached record or newly loaded source.
   *
   * Use this to keep importer-aware authorization checks separate from source
   * loading so cached modules can skip repeated resolve() work without bypassing
   * per-import access control.
   */
  authorize?(
    specifier: string,
    importer: string | null,
    resolvedPath: string,
    context?: ModuleResolverContext,
  ): boolean | Promise<boolean>;

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

  /**
   * Optional hook for extending `import.meta` during module evaluation.
   * Return additional properties to merge onto the sandbox-safe base object.
   */
  getImportMeta?(
    context: ModuleImportMetaContext,
  ): Record<string, any> | Promise<Record<string, any> | null> | null;
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
  importer: string | null;
  path: string;
  specifier: string;
  exports: Record<string, any>;
  importMeta?: Record<string, any>;
  status: "initializing" | "initialized" | "failed";
  error?: Error;
  source?: string;
  ast?: ESTree.Program;
  loadedAt: number;
}

/**
 * Creates a shallow copy while preserving property descriptors/getters.
 * This avoids expensive recursive cloning and preserves branded nested values.
 */
function shallowCloneWithDescriptors<T extends object>(obj: T): T {
  const clone = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));

  for (const key of Reflect.ownKeys(obj)) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (!descriptor) {
      continue;
    }
    Object.defineProperty(clone, key, descriptor);
  }

  return clone as T;
}

export class ModuleSystem {
  // Cache by resolved path, not specifier (fixes cache key collision)
  private cacheByPath: Map<string, ModuleRecord> = new Map();
  // Secondary index: specifier -> all resolved paths seen for that textual specifier.
  private specifierToPaths: Map<string, Set<string>> = new Map();
  // Importer-aware index used by public introspection when a specifier is context-sensitive.
  private specifierToPathsByImporter: Map<string, Map<string | null, Set<string>>> = new Map();
  // Context-specific index for reusing cached module paths without re-running resolve()
  private resolvedPathByContext = new ResolutionContextPathCache(
    MAX_RESOLVED_PATH_CONTEXT_CACHE_SIZE,
  );
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

  private getResolvedPathForContext(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): string | undefined {
    return this.resolvedPathByContext.get(specifier, importer, importerChain);
  }

  private cacheResolvedPathForContext(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
    path: string,
  ): void {
    this.resolvedPathByContext.set(specifier, importer, importerChain, path);
  }

  private deleteResolvedPathForContext(
    specifier: string,
    importer: string | null,
    importerChain: readonly string[],
  ): void {
    this.resolvedPathByContext.delete(specifier, importer, importerChain);
  }

  private registerSpecifierPath(specifier: string, importer: string | null, path: string): void {
    let paths = this.specifierToPaths.get(specifier);
    if (!paths) {
      paths = new Set();
      this.specifierToPaths.set(specifier, paths);
    }
    paths.add(path);

    let pathsByImporter = this.specifierToPathsByImporter.get(specifier);
    if (!pathsByImporter) {
      pathsByImporter = new Map();
      this.specifierToPathsByImporter.set(specifier, pathsByImporter);
    }

    let importerPaths = pathsByImporter.get(importer);
    if (!importerPaths) {
      importerPaths = new Set();
      pathsByImporter.set(importer, importerPaths);
    }
    importerPaths.add(path);
  }

  private getUnambiguousPath(paths?: ReadonlySet<string>): string | undefined {
    if (!paths || paths.size !== 1) {
      return undefined;
    }

    return paths.values().next().value;
  }

  private getPathForSpecifier(
    specifier: string,
    context?: ModuleIntrospectionContext,
  ): string | undefined {
    if (context?.importerChain) {
      return this.getResolvedPathForContext(
        specifier,
        context.importer ?? null,
        context.importerChain,
      );
    }

    if (context && Object.hasOwn(context, "importer")) {
      const importerPaths = this.specifierToPathsByImporter
        .get(specifier)
        ?.get(context.importer ?? null);
      return this.getUnambiguousPath(importerPaths);
    }

    return this.getUnambiguousPath(this.specifierToPaths.get(specifier));
  }

  async resolveModule(specifier: string, importer: string | null): Promise<ModuleRecord | null> {
    if (!this.options.enabled) {
      throw new Error("Module system is not enabled");
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
      // Build resolver context. Without authorize(), resolve() stays the first gate
      // so importer-aware access control can remain embedded in resolver logic.
      // With authorize(), we can reuse a cached resolved path for the same context
      // while still re-checking authorization before returning cached records.
      const context: ModuleResolverContext = {
        specifier,
        importer,
        importerChain: this.getImporterChain(),
      };

      if (this.options.cache && this.options.resolver.authorize) {
        const cachedPath = this.getResolvedPathForContext(
          specifier,
          importer,
          context.importerChain,
        );
        if (cachedPath !== undefined) {
          const existingByPath = this.cacheByPath.get(cachedPath);
          if (existingByPath) {
            const isAuthorized = await this.options.resolver.authorize(
              specifier,
              importer,
              cachedPath,
              context,
            );
            if (!isAuthorized) {
              return null;
            }

            this.registerSpecifierPath(specifier, importer, cachedPath);
            this.cacheResolvedPathForContext(
              specifier,
              importer,
              context.importerChain,
              cachedPath,
            );
            return existingByPath;
          }

          this.deleteResolvedPathForContext(specifier, importer, context.importerChain);
        }
      }

      const source = await this.options.resolver.resolve(specifier, importer, context);
      if (source === null) {
        return null;
      }

      if (this.options.resolver.authorize) {
        const isAuthorized = await this.options.resolver.authorize(
          specifier,
          importer,
          source.path,
          context,
        );
        if (!isAuthorized) {
          return null;
        }
      }

      // After resolve() and optional authorize(), check cache by resolved path.
      // Cache key is the resolved path (source.path), not the specifier,
      // to ensure cache entries are tied to the specific resolved module.
      if (this.options.cache) {
        const existingByPath = this.cacheByPath.get(source.path);
        if (existingByPath) {
          // Preserve all successfully authorized specifiers, even when they
          // resolve to a module path that is already cached.
          this.registerSpecifierPath(specifier, importer, source.path);
          this.cacheResolvedPathForContext(specifier, importer, context.importerChain, source.path);
          // If already initialized, return cached exports
          if (existingByPath.status === "initialized") {
            return existingByPath;
          }
          // If still initializing, return it to handle circular deps
          if (existingByPath.status === "initializing") {
            return existingByPath;
          }
          // If previously failed, return cached failure record
          if (existingByPath.status === "failed") {
            return existingByPath;
          }
        }
      }

      const record: ModuleRecord = {
        importer,
        path: source.path,
        specifier,
        exports: {},
        status: "initializing",
        loadedAt: Date.now(),
      };

      if (this.options.resolver.getImportMeta) {
        const importMeta = await this.options.resolver.getImportMeta({
          path: source.path,
          specifier,
          importer,
        });
        if (importMeta && typeof importMeta === "object") {
          record.importMeta = shallowCloneWithDescriptors(importMeta);
        }
      }

      if (this.options.cache) {
        this.cacheByPath.set(source.path, record);
        this.registerSpecifierPath(specifier, importer, source.path);
        this.cacheResolvedPathForContext(specifier, importer, context.importerChain, source.path);
      }

      if (source.type === "namespace") {
        // Shallow-clone top-level exports to avoid mutating resolver-owned objects
        // while preserving accessors/descriptors and branded nested instances.
        // Note: Don't freeze here - ReadOnlyProxy handles immutability and freezing
        // causes issues with proxy wrapping
        record.exports = shallowCloneWithDescriptors(source.exports);
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
  getModuleExportsBySpecifier(
    specifier: string,
    context?: ModuleIntrospectionContext,
  ): Record<string, any> | undefined {
    const path = this.getPathForSpecifier(specifier, context);
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
  setModuleExports(path: string, exports: Record<string, any>): void {
    const record = this.cacheByPath.get(path);
    if (record) {
      // Exports are already protected by ReadOnlyProxy from evaluateModuleAstAsync
      record.exports = exports;
      record.status = "initialized";
      this.options.resolver.onLoad?.(record.specifier, path, record.exports);
    }
  }

  /**
   * Mark a module as failed.
   */
  setModuleFailed(path: string, error: Error): void {
    const record = this.cacheByPath.get(path);
    if (record) {
      record.status = "failed";
      record.error = error;
      this.options.resolver.onError?.(record.specifier, record.importer, error);
    }
  }

  /**
   * Clear all module caches.
   */
  clearCache(): void {
    this.cacheByPath.clear();
    this.specifierToPaths.clear();
    this.specifierToPathsByImporter.clear();
    this.resolvedPathByContext.clear();
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
  isModuleCached(specifier: string, context?: ModuleIntrospectionContext): boolean {
    return this.getPathForSpecifier(specifier, context) !== undefined;
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
    return Array.from(this.specifierToPaths.keys());
  }

  /**
   * Get metadata about a loaded module.
   */
  getModuleMetadata(
    specifier: string,
    context?: ModuleIntrospectionContext,
  ): ModuleMetadata | undefined {
    const path = this.getPathForSpecifier(specifier, context);
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
