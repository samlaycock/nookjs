import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function PluginsExamples() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">
        Plugin Systems
      </h1>
      <p className="text-xl text-neutral-300 mb-8">
        Build safe, extensible plugin systems that allow users to write custom
        logic.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Basic Plugin Architecture
        </h2>
        <p className="text-neutral-300 mb-4">
          A simple plugin system where users can extend functionality:
        </p>
        <CodeBlock
          code={`import { createSandbox, InterpreterError, type Sandbox } from "nookjs";

interface Plugin {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
}

interface PluginContext {
  data: Record<string, unknown>;
  results: Record<string, unknown>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private sandboxes: Map<string, Sandbox> = new Map();

  registerPlugin(plugin: Plugin) {
    // Create isolated sandbox for this plugin with resource tracking
    const sandbox = createSandbox({
      env: "es2024",
      trackResources: true,
      limits: {
        total: {
          memoryBytes: 50 * 1024 * 1024, // 50 MB
          evaluations: 10000,
          iterations: 100000,
        },
      },
      globals: {
        // Plugin API
        log: (...args: unknown[]) =>
          console.log(\`[Plugin:\${plugin.id}]\`, ...args),
      },
    });

    this.plugins.set(plugin.id, plugin);
    this.sandboxes.set(plugin.id, sandbox);
  }

  async executePlugin(pluginId: string, context: PluginContext) {
    const plugin = this.plugins.get(pluginId);
    const sandbox = this.sandboxes.get(pluginId);

    if (!plugin || !sandbox || !plugin.enabled) {
      return null;
    }

    try {
      return await sandbox.run(plugin.code, {
        globals: { context },
      });
    } catch (error) {
      if (error instanceof InterpreterError) {
        console.error(\`Plugin \${pluginId} error:\`, error.message);
        return { error: error.message };
      }
      throw error;
    }
  }

  getPluginStats(pluginId: string) {
    return this.sandboxes.get(pluginId)?.resources();
  }
}

// Usage
const manager = new PluginManager();

manager.registerPlugin({
  id: "discount-calculator",
  name: "Custom Discount Calculator",
  enabled: true,
  code: \`
    const { data, results } = context;

    let discount = 0;

    // Gold customers get 15% off
    if (data.customerTier === "gold") {
      discount += 0.15;
    }

    // Bulk orders get additional 10% off
    if (data.itemCount >= 10) {
      discount += 0.10;
    }

    results.discount = Math.min(discount, 0.25); // Cap at 25%
    results.finalPrice = data.subtotal * (1 - results.discount);

    log("Calculated discount:", results.discount);

    results
  \`,
});

const result = await manager.executePlugin("discount-calculator", {
  data: { customerTier: "gold", itemCount: 15, subtotal: 200 },
  results: {},
});

console.log(result); // { discount: 0.25, finalPrice: 150 }`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Event-Based Plugin System
        </h2>
        <p className="text-neutral-300 mb-4">
          Let plugins hook into application events:
        </p>
        <CodeBlock
          code={`import { createSandbox, type Sandbox } from "nookjs";

type EventType = "order.created" | "order.shipped" | "user.registered";

interface EventPlugin {
  id: string;
  events: EventType[];
  code: string;
}

class EventPluginSystem {
  private plugins: Map<string, EventPlugin> = new Map();
  private sandboxes: Map<string, Sandbox> = new Map();

  register(plugin: EventPlugin) {
    const sandbox = createSandbox({
      env: "es2024",
      globals: {
        // Event handling API
        log: console.log,
        sendNotification: async (to: string, message: string) => {
          console.log(\`Notification to \${to}: \${message}\`);
          return { sent: true };
        },
        updateRecord: async (table: string, id: string, data: unknown) => {
          console.log(\`Update \${table}[\${id}]\`, data);
          return { updated: true };
        },
      },
    });

    this.plugins.set(plugin.id, plugin);
    this.sandboxes.set(plugin.id, sandbox);
  }

  async emit(event: EventType, payload: Record<string, unknown>) {
    const results: Array<{ pluginId: string; result: unknown }> = [];

    for (const [pluginId, plugin] of this.plugins) {
      if (!plugin.events.includes(event)) continue;

      const sandbox = this.sandboxes.get(pluginId)!;

      try {
        const result = await sandbox.run(plugin.code, {
          globals: { event, payload },
        });
        results.push({ pluginId, result });
      } catch (error) {
        results.push({ pluginId, result: { error: String(error) } });
      }
    }

    return results;
  }
}

// Usage
const events = new EventPluginSystem();

events.register({
  id: "welcome-email",
  events: ["user.registered"],
  code: \`
    async function run() {
      if (event === "user.registered") {
        await sendNotification(
          payload.email,
          \`Welcome to our platform, \${payload.name}!\`
        );
        return { action: "welcome-email-sent" };
      }
    }
    run();
  \`,
});

events.register({
  id: "inventory-update",
  events: ["order.created", "order.shipped"],
  code: \`
    async function run() {
      if (event === "order.created") {
        for (const item of payload.items) {
          await updateRecord("inventory", item.productId, {
            reserved: item.quantity,
          });
        }
        return { action: "inventory-reserved" };
      }

      if (event === "order.shipped") {
        for (const item of payload.items) {
          await updateRecord("inventory", item.productId, {
            shipped: item.quantity,
          });
        }
        return { action: "inventory-shipped" };
      }
    }
    run();
  \`,
});

// Trigger events
await events.emit("user.registered", {
  email: "new@example.com",
  name: "New User",
});

await events.emit("order.created", {
  orderId: "123",
  items: [{ productId: "prod_1", quantity: 2 }],
});`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Middleware Pipeline
        </h2>
        <p className="text-neutral-300 mb-4">
          Create a middleware system where plugins can transform data:
        </p>
        <CodeBlock
          code={`import { createSandbox, type Sandbox } from "nookjs";

interface Middleware {
  id: string;
  priority: number;
  code: string;
}

class MiddlewarePipeline<T> {
  private middlewares: Middleware[] = [];
  private sandbox: Sandbox;

  constructor() {
    this.sandbox = createSandbox({
      env: "es2024",
      globals: {
        log: console.log,
      },
    });
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  async execute(input: T): Promise<T> {
    let current = input;

    for (const middleware of this.middlewares) {
      try {
        const result = await this.sandbox.run(middleware.code, {
          globals: { input: current },
        });

        // Middleware can return modified input or null to skip
        if (result !== null && result !== undefined) {
          current = result as T;
        }
      } catch (error) {
        console.error(\`Middleware \${middleware.id} failed:\`, error);
        // Continue with current value
      }
    }

    return current;
  }
}

// Usage: Request processing pipeline
interface Request {
  headers: Record<string, string>;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

const pipeline = new MiddlewarePipeline<Request>();

pipeline.use({
  id: "auth-check",
  priority: 1,
  code: \`
    // Add user info from auth header
    const token = input.headers["authorization"];
    if (token) {
      input.metadata.userId = token.split(" ")[1];
      input.metadata.authenticated = true;
    } else {
      input.metadata.authenticated = false;
    }
    input
  \`,
});

pipeline.use({
  id: "rate-limit-check",
  priority: 2,
  code: \`
    // Add rate limit info
    input.metadata.rateLimit = {
      remaining: 100,
      reset: Date.now() + 60000,
    };
    input
  \`,
});

pipeline.use({
  id: "request-logger",
  priority: 10,
  code: \`
    log("Processing request:", {
      authenticated: input.metadata.authenticated,
      userId: input.metadata.userId,
    });
    input
  \`,
});

const result = await pipeline.execute({
  headers: { authorization: "Bearer user_123" },
  body: { action: "getData" },
  metadata: {},
});

console.log(result.metadata);
// { userId: "user_123", authenticated: true, rateLimit: { remaining: 100, ... } }`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Plugin Marketplace Pattern
        </h2>
        <p className="text-neutral-300 mb-4">
          A complete plugin system with installation, versioning, and
          sandboxing:
        </p>
        <CodeBlock
          code={`import { createSandbox, InterpreterError, type Sandbox } from "nookjs";

interface InstalledPlugin {
  id: string;
  version: string;
  code: string;
  permissions: string[];
  config: Record<string, unknown>;
}

interface PluginAPI {
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  http: {
    get: (url: string) => Promise<unknown>;
  };
  ui: {
    showNotification: (message: string) => void;
  };
}

class PluginRuntime {
  private plugins: Map<string, InstalledPlugin> = new Map();
  private sandboxes: Map<string, Sandbox> = new Map();
  private storage: Map<string, Map<string, unknown>> = new Map();

  install(plugin: InstalledPlugin) {
    // Create isolated storage for plugin
    this.storage.set(plugin.id, new Map());

    // Build API based on permissions
    const api = this.buildAPI(plugin);

    // Create sandbox with resource tracking
    const sandbox = createSandbox({
      env: "es2024",
      trackResources: true,
      limits: {
        total: {
          memoryBytes: 100 * 1024 * 1024,
          evaluations: 50000,
          cpuTimeMs: 60000, // 1 minute cumulative
        },
      },
      globals: {
        ...api,
        config: plugin.config,
        log: (...args: unknown[]) =>
          console.log(\`[Plugin:\${plugin.id}]\`, ...args),
      },
    });

    this.plugins.set(plugin.id, plugin);
    this.sandboxes.set(plugin.id, sandbox);
  }

  private buildAPI(plugin: InstalledPlugin): Partial<PluginAPI> {
    const api: Partial<PluginAPI> = {};
    const pluginStorage = this.storage.get(plugin.id)!;

    if (plugin.permissions.includes("storage")) {
      api.storage = {
        get: async (key: string) => pluginStorage.get(key),
        set: async (key: string, value: unknown) => {
          pluginStorage.set(key, value);
        },
      };
    }

    if (plugin.permissions.includes("http")) {
      api.http = {
        get: async (url: string) => {
          // Validate URL against allowlist
          const allowed = ["api.example.com", "data.example.com"];
          const hostname = new URL(url).hostname;
          if (!allowed.includes(hostname)) {
            throw new Error(\`HTTP access to \${hostname} not allowed\`);
          }
          const response = await fetch(url);
          return response.json();
        },
      };
    }

    if (plugin.permissions.includes("ui")) {
      api.ui = {
        showNotification: (message: string) => {
          console.log(\`[Notification] \${message}\`);
        },
      };
    }

    return api;
  }

  async run(pluginId: string, method: string, args: unknown[] = []) {
    const sandbox = this.sandboxes.get(pluginId);
    if (!sandbox) throw new Error(\`Plugin \${pluginId} not installed\`);

    try {
      return await sandbox.run(
        \`(\${method})(...args)\`,
        { globals: { args } }
      );
    } catch (error) {
      if (error instanceof InterpreterError) {
        console.error(\`Plugin \${pluginId} error:\`, error.message);
      }
      throw error;
    }
  }

  getStats(pluginId: string) {
    return this.sandboxes.get(pluginId)?.resources();
  }

  uninstall(pluginId: string) {
    this.plugins.delete(pluginId);
    this.sandboxes.delete(pluginId);
    this.storage.delete(pluginId);
  }
}

// Usage
const runtime = new PluginRuntime();

runtime.install({
  id: "analytics-tracker",
  version: "1.0.0",
  permissions: ["storage", "ui"],
  config: { sampleRate: 0.1 },
  code: \`
    // Plugin defines functions
    async function trackEvent(eventName, data) {
      // Get current count
      const count = await storage.get("eventCount") || 0;
      await storage.set("eventCount", count + 1);

      // Sample based on config
      if (Math.random() < config.sampleRate) {
        log("Tracking:", eventName, data);
        ui.showNotification(\`Event tracked: \${eventName}\`);
      }

      return { tracked: true, totalEvents: count + 1 };
    }

    async function getStats() {
      return {
        totalEvents: await storage.get("eventCount") || 0,
      };
    }
  \`,
});

// Run plugin methods
await runtime.run("analytics-tracker", "trackEvent", ["page_view", { page: "/home" }]);
await runtime.run("analytics-tracker", "trackEvent", ["button_click", { id: "signup" }]);

const stats = await runtime.run("analytics-tracker", "getStats");
console.log(stats); // { totalEvents: 2 }

// Check resource usage
console.log(runtime.getStats("analytics-tracker"));`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Best Practices
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              1. Always enable resource tracking
            </h3>
            <p className="text-neutral-400 text-sm">
              Each plugin should have its own sandbox with resource tracking
              enabled to prevent any single plugin from consuming all resources.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              2. Implement permission systems
            </h3>
            <p className="text-neutral-400 text-sm">
              Only expose APIs that the plugin explicitly needs. Use a
              permission-based system to control access.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              3. Validate all inputs
            </h3>
            <p className="text-neutral-400 text-sm">
              APIs exposed to plugins should validate all arguments and sanitize
              outputs before they're used by the host application.
            </p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              4. Isolate plugin storage
            </h3>
            <p className="text-neutral-400 text-sm">
              Each plugin should have its own isolated storage space that cannot
              be accessed by other plugins.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/examples/async"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Async Operations
        </Link>
        <Link
          to="/"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Try the Playground &rarr;
        </Link>
      </div>
    </article>
  );
}
