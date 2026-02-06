import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({ env: "es2022" });

const caught = await sandbox.run<string>(ts`
  try {
    throw "boom";
  } catch (error) {
    "caught " + error;
  }
`);

const tryFinally = await sandbox.run<string[]>(ts`
  const events = [];
  function test() {
    try {
      events.push("try");
      return "from try";
    } finally {
      events.push("finally");
    }
  }
  test();
  events;
`);

const nested = await sandbox.run<string[]>(ts`
  const events = [];
  try {
    events.push("outer try");
    try {
      throw "inner";
    } catch {
      events.push("inner catch");
    } finally {
      events.push("inner finally");
    }
  } finally {
    events.push("outer finally");
  }
  events;
`);

console.log({ caught, tryFinally, nested });
