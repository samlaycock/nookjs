import { parseModule, parseScript } from "../src/ast";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type ParseScriptParams = Parameters<typeof parseScript>;
type AssertParseScriptParams = Expect<Equal<ParseScriptParams, [input: string]>>;

type ParseModuleParams = Parameters<typeof parseModule>;
type AssertParseModuleParams = Expect<Equal<ParseModuleParams, [input: string]>>;

void ({} as AssertParseScriptParams);
void ({} as AssertParseModuleParams);
