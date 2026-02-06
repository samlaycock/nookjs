import { createSandbox, type RunResult, run } from "../src/sandbox";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const sandbox = createSandbox({ env: "es2022" });

const sandboxValue = sandbox.run<number>("1 + 2");
type SandboxValueType = Awaited<typeof sandboxValue>;
type AssertSandboxValue = Expect<Equal<SandboxValueType, number>>;

const sandboxFull = sandbox.run<number>("1 + 2", { result: "full" });
type SandboxFullType = Awaited<typeof sandboxFull>;
type AssertSandboxFull = Expect<Equal<SandboxFullType, RunResult<number>>>;

const oneOffValue = run<number>("1 + 2");
type OneOffValueType = Awaited<typeof oneOffValue>;
type AssertOneOffValue = Expect<Equal<OneOffValueType, number>>;

const oneOffFull = run<number>("1 + 2", { result: "full" });
type OneOffFullType = Awaited<typeof oneOffFull>;
type AssertOneOffFull = Expect<Equal<OneOffFullType, RunResult<number>>>;

void ({} as AssertSandboxValue);
void ({} as AssertSandboxFull);
void ({} as AssertOneOffValue);
void ({} as AssertOneOffFull);
