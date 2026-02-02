import { Link } from "react-router";

import { CodeBlock } from "../../../components/code-block";

export function AsyncExamples() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-neutral-50 mb-4">Async Operations</h1>
      <p className="text-xl text-neutral-300 mb-8">
        Examples of using async/await and Promises in sandbox code.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Basic Async/Await</h2>
        <p className="text-neutral-300 mb-4">
          Use <code className="text-amber-400 bg-neutral-800 px-1 rounded">evaluateAsync</code> to
          run code with async operations:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      // Async function that sandbox code can await
      fetchUser: async (id: number) => {
        const response = await fetch(\`/api/users/\${id}\`);
        return response.json();
      },
    },
  })
);

const result = await interpreter.evaluateAsync(\`
  const user = await fetchUser(123);
  user.name
\`);

console.log(result); // "John Doe"`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Promise Handling</h2>
        <p className="text-neutral-300 mb-4">Sandbox code can work with Promises directly:</p>
        <CodeBlock
          code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      fetchData: (url: string) =>
        fetch(url).then((r) => r.json()),
    },
  })
);

// Using .then()
const result1 = await interpreter.evaluateAsync(\`
  fetchData('/api/data')
    .then(data => data.items)
    .then(items => items.length)
\`);

// Using async/await
const result2 = await interpreter.evaluateAsync(\`
  const data = await fetchData('/api/data');
  const items = data.items;
  items.length
\`);`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Parallel Execution</h2>
        <p className="text-neutral-300 mb-4">Execute multiple async operations in parallel:</p>
        <CodeBlock
          code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      fetchUser: async (id: number) => ({ id, name: \`User \${id}\` }),
      fetchOrders: async (userId: number) => [
        { id: 1, total: 100 },
        { id: 2, total: 200 },
      ],
      fetchPreferences: async (userId: number) => ({ theme: "dark" }),
      Promise, // Expose Promise for Promise.all
    },
  })
);

const result = await interpreter.evaluateAsync(\`
  const userId = 123;

  // Parallel fetch
  const [user, orders, preferences] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchPreferences(userId),
  ]);

  {
    user,
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    theme: preferences.theme,
  }
\`);

console.log(result);
// { user: { id: 123, name: "User 123" }, orderCount: 2, totalSpent: 300, theme: "dark" }`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Error Handling in Async Code
        </h2>
        <p className="text-neutral-300 mb-4">Handle errors from async operations:</p>
        <CodeBlock
          code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      fetchData: async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}\`);
        }
        return response.json();
      },
    },
  })
);

// Try-catch in sandbox code
const result = await interpreter.evaluateAsync(\`
  let data;
  let error = null;

  try {
    data = await fetchData('/api/data');
  } catch (e) {
    error = e.message;
  }

  { data, error }
\`);

// Or handle at the host level
import { RuntimeError } from "nookjs";

try {
  await interpreter.evaluateAsync(\`
    const data = await fetchData('/api/nonexistent');
    data
  \`);
} catch (error) {
  if (error instanceof RuntimeError) {
    console.log("Sandbox threw:", error.thrownValue);
  }
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Timeouts and Cancellation</h2>
        <p className="text-neutral-300 mb-4">
          Use AbortSignal to cancel long-running async operations:
        </p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      slowOperation: () =>
        new Promise((resolve) => setTimeout(() => resolve("done"), 10000)),
    },
  })
);

// Create abort controller with timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const result = await interpreter.evaluateAsync(
    \`
    const result = await slowOperation();
    result
  \`,
    { signal: controller.signal }
  );
  console.log(result);
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Operation timed out after 5 seconds");
  } else {
    throw error;
  }
} finally {
  clearTimeout(timeout);
}`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Async Data Pipeline</h2>
        <p className="text-neutral-300 mb-4">Build async data processing pipelines:</p>
        <CodeBlock
          code={`const interpreter = new Interpreter(
  preset(ES2024, {
    globals: {
      // Data sources
      fetchUsers: async () => [
        { id: 1, name: "Alice", departmentId: 1 },
        { id: 2, name: "Bob", departmentId: 2 },
        { id: 3, name: "Charlie", departmentId: 1 },
      ],
      fetchDepartments: async () => [
        { id: 1, name: "Engineering" },
        { id: 2, name: "Sales" },
      ],

      // Async helpers
      delay: (ms: number) => new Promise((r) => setTimeout(r, ms)),

      Promise,
    },
  })
);

const result = await interpreter.evaluateAsync(\`
  // Fetch data in parallel
  const [users, departments] = await Promise.all([
    fetchUsers(),
    fetchDepartments(),
  ]);

  // Create lookup map
  const deptMap = {};
  for (const dept of departments) {
    deptMap[dept.id] = dept.name;
  }

  // Transform data
  const enrichedUsers = users.map(user => ({
    ...user,
    departmentName: deptMap[user.departmentId],
  }));

  // Group by department
  const byDepartment = {};
  for (const user of enrichedUsers) {
    const dept = user.departmentName;
    if (!byDepartment[dept]) {
      byDepartment[dept] = [];
    }
    byDepartment[dept].push(user.name);
  }

  byDepartment
\`);

console.log(result);
// { Engineering: ["Alice", "Charlie"], Sales: ["Bob"] }`}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">Webhook Handler</h2>
        <p className="text-neutral-300 mb-4">Let users define async webhook processing logic:</p>
        <CodeBlock
          code={`import { Interpreter, ES2024, preset } from "nookjs";

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
}

function createWebhookHandler(userScript: string) {
  const interpreter = new Interpreter(
    preset(ES2024, {
      globals: {
        // Async actions the user can trigger
        sendEmail: async (to: string, subject: string, body: string) => {
          console.log(\`Sending email to \${to}: \${subject}\`);
          // Actual email sending logic
          return { success: true, messageId: "msg_123" };
        },
        sendSlack: async (channel: string, message: string) => {
          console.log(\`Sending Slack to \${channel}: \${message}\`);
          return { success: true };
        },
        updateDatabase: async (table: string, id: string, data: unknown) => {
          console.log(\`Updating \${table}[\${id}]\`, data);
          return { updated: true };
        },
        log: console.log,
      },
    })
  );

  return async function handleWebhook(payload: WebhookPayload) {
    return interpreter.evaluateAsync(userScript, {
      globals: { payload },
    });
  };
}

// User-defined webhook handler
const handleOrderWebhook = createWebhookHandler(\`
  const { event, data } = payload;

  if (event === "order.created") {
    // Notify team
    await sendSlack("#orders", \`New order: \${data.orderId} - $\${data.total}\`);

    // Send confirmation to customer
    await sendEmail(
      data.customerEmail,
      "Order Confirmation",
      \`Thank you for your order #\${data.orderId}!\`
    );

    return { handled: true, actions: ["slack", "email"] };
  }

  if (event === "order.shipped") {
    await sendEmail(
      data.customerEmail,
      "Your order has shipped!",
      \`Tracking: \${data.trackingNumber}\`
    );

    await updateDatabase("orders", data.orderId, { status: "shipped" });

    return { handled: true, actions: ["email", "database"] };
  }

  return { handled: false };
\`);

// Process webhooks
await handleOrderWebhook({
  event: "order.created",
  data: { orderId: "123", total: 99.99, customerEmail: "customer@example.com" },
});`}
        />
      </section>

      <div className="flex justify-between pt-8 border-t border-neutral-800">
        <Link
          to="/docs/examples/basic"
          className="text-neutral-400 hover:text-amber-400 transition-colors"
        >
          &larr; Basic Usage
        </Link>
        <Link
          to="/docs/examples/plugins"
          className="text-amber-500 hover:text-amber-400 transition-colors"
        >
          Plugin Systems &rarr;
        </Link>
      </div>
    </article>
  );
}
