import type { ESTree } from "./ast";

export type ModuleSource =
  | { type: "source"; code: string; path: string }
  | { type: "ast"; ast: ESTree.Program; path: string }
  | { type: "namespace"; exports: Record<string, any>; path: string };

export interface ModuleResolver {
  resolve(specifier: string, importer: string | null): ModuleSource | Promise<ModuleSource> | null;
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

export interface ModuleRecord {
  path: string;
  exports: Record<string, any>;
  status: "initializing" | "initialized" | "failed";
  error?: Error;
  source?: string;
  ast?: ESTree.Program;
}

export class ModuleSystem {
  private cache: Map<string, ModuleRecord> = new Map();
  private options: ModuleOptions;
  private depth: number = 0;

  constructor(options: ModuleOptions) {
    this.options = {
      ...DEFAULT_MODULE_OPTIONS,
      ...options,
      cache: options.cache ?? true,
      maxDepth: options.maxDepth ?? 100,
    };
  }

  async resolveModule(specifier: string, importer: string | null): Promise<ModuleRecord | null> {
    if (!this.options.enabled) {
      throw new Error("Module system is not enabled");
    }

    if (this.options.cache) {
      const cached = this.cache.get(specifier);
      if (cached && cached.status === "initialized") {
        return cached;
      }
    }

    if (this.options.maxDepth !== undefined && this.depth >= this.options.maxDepth) {
      throw new Error(`Module resolution depth exceeded maximum (${this.options.maxDepth})`);
    }

    this.depth++;
    try {
      const source = await this.options.resolver.resolve(specifier, importer);
      if (source === null) {
        return null;
      }

      const record: ModuleRecord = {
        path: source.path,
        exports: {},
        status: "initializing",
      };

      if (this.options.cache) {
        this.cache.set(specifier, record);
      }

      if (source.type === "namespace") {
        record.exports = { ...source.exports };
        record.status = "initialized";
        this.depth--;
        return record;
      }

      if (source.type === "source") {
        record.source = source.code;
      } else if (source.type === "ast") {
        record.ast = source.ast;
      }

      return record;
    } catch (error) {
      this.depth--;
      throw error;
    }
  }

  getModuleExports(path: string): Record<string, any> | undefined {
    const record = this.cache.get(path);
    if (record && record.status === "initialized") {
      return record.exports;
    }
    return undefined;
  }

  setModuleExports(path: string, exports: Record<string, any>): void {
    const record = this.cache.get(path);
    if (record) {
      record.exports = exports;
      record.status = "initialized";
      this.depth--;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.depth = 0;
  }

  isEnabled(): boolean {
    return this.options.enabled;
  }

  getMaxDepth(): number {
    return this.options.maxDepth ?? DEFAULT_MODULE_OPTIONS.maxDepth!;
  }

  getCurrentDepth(): number {
    return this.depth;
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
