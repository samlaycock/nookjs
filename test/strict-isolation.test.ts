import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { createSandbox } from "../src/sandbox";

describe("Strict Evaluation Isolation", () => {
  it("should not leak strict-isolation mutex when a stepper is never iterated", () => {
    const interpreter = new Interpreter({ strictEvaluationIsolation: true });

    interpreter.evaluateSteps("1 + 1");

    expect(interpreter.evaluate("1 + 1")).toBe(2);
  });

  it("should block sync evaluate() while async evaluation is pending", async () => {
    const gateState: { release: () => void } = { release: () => {} };
    const gate = new Promise<void>((resolve) => {
      gateState.release = resolve;
    });

    const waitForGate = () => gate;
    const interpreter = new Interpreter({ strictEvaluationIsolation: true });

    const asyncRun = interpreter.evaluateAsync(
      `
        async function readSecret() {
          await waitForGate();
          return secret;
        }

        readSecret();
      `,
      {
        globals: { waitForGate, secret: "A" },
      },
    );

    const syncRun: { error: unknown } = { error: undefined };
    try {
      interpreter.evaluate("secret", { globals: { secret: "B" } });
    } catch (error) {
      syncRun.error = error;
    } finally {
      gateState.release();
    }

    const syncErrorMessage =
      syncRun.error instanceof Error ? syncRun.error.message : String(syncRun.error);
    expect(syncErrorMessage).toContain("Strict isolation is enabled");
    const asyncResult = await asyncRun;
    expect(asyncResult).toBe("A");
  });

  it("should block runSync() while run() is pending by default in createSandbox()", async () => {
    const gateState: { release: () => void } = { release: () => {} };
    const gate = new Promise<void>((resolve) => {
      gateState.release = resolve;
    });

    const waitForGate = () => gate;
    const sandbox = createSandbox({
      env: "es2022",
      globals: { waitForGate },
    });

    const asyncRun = sandbox.run(
      `
        async function readSecret() {
          await waitForGate();
          return secret;
        }

        readSecret();
      `,
      {
        globals: { secret: "A" },
      },
    );

    const syncRun: { error: unknown } = { error: undefined };
    try {
      sandbox.runSync("secret", { globals: { secret: "B" } });
    } catch (error) {
      syncRun.error = error;
    } finally {
      gateState.release();
    }

    const syncErrorMessage =
      syncRun.error instanceof Error ? syncRun.error.message : String(syncRun.error);
    expect(syncErrorMessage).toContain("Strict isolation is enabled");
    const asyncResult = await asyncRun;
    expect(asyncResult).toBe("A");
  });

  it("should allow sync overlap when strictEvaluationIsolation is explicitly disabled in createSandbox()", async () => {
    const gateState: { release: () => void } = { release: () => {} };
    const gate = new Promise<void>((resolve) => {
      gateState.release = resolve;
    });

    const waitForGate = () => gate;
    const sandbox = createSandbox({
      env: "es2022",
      strictEvaluationIsolation: false,
      globals: { waitForGate },
    });

    const asyncRun = sandbox.run(
      `
        async function readSecret() {
          await waitForGate();
          return secret;
        }

        readSecret();
      `,
      {
        globals: { secret: "A" },
      },
    );

    const syncResult = sandbox.runSync("secret", { globals: { secret: "B" } });
    gateState.release();

    expect(syncResult).toBe("B");
    const asyncResult = await asyncRun;
    expect(asyncResult).toBe("A");
  });

  it("should block runSync() while runModule() is pending by default in createSandbox()", async () => {
    const gateState: { release: () => void } = { release: () => {} };
    const gate = new Promise<void>((resolve) => {
      gateState.release = resolve;
    });

    const sandbox = createSandbox({
      env: "es2022",
      modules: {},
      globals: {
        waitForGate: () => gate,
      },
    });

    const moduleRun = sandbox.runModule(
      `
        const secret = await waitForGate().then(() => "A");
        export { secret };
      `,
      { path: "main.js" },
    );

    const syncRun: { error: unknown } = { error: undefined };
    try {
      sandbox.runSync("secret", { globals: { secret: "B" } });
    } catch (error) {
      syncRun.error = error;
    } finally {
      gateState.release();
    }

    const syncErrorMessage =
      syncRun.error instanceof Error ? syncRun.error.message : String(syncRun.error);
    expect(syncErrorMessage).toContain("Strict isolation is enabled");
    const moduleExports = await moduleRun;
    expect(moduleExports.secret).toBe("A");
  });
});
