import type { ESTree } from "../src/index";

import { createSandbox, ts } from "../src/index";

const noLoopsValidator = (ast: ESTree.Program): boolean => {
  const serializedAst = JSON.stringify(ast);
  return !serializedAst.includes('"WhileStatement"') && !serializedAst.includes('"ForStatement"');
};

const readOnlyValidator = (ast: ESTree.Program): boolean => {
  return !JSON.stringify(ast).includes('"VariableDeclaration"');
};

const noLoopSandbox = createSandbox({
  env: "es2022",
  validator: noLoopsValidator,
});

const readOnlySandbox = createSandbox({ env: "es2022" });

const safeValue = await noLoopSandbox.run<number>("5 + 10");

let blockedLoop = false;
try {
  await noLoopSandbox.run("let i = 0; while (i < 5) { i = i + 1; }");
} catch {
  blockedLoop = true;
}

const readOnlyValue = await readOnlySandbox.run<number>("5 * 3", {
  validator: readOnlyValidator,
});

let blockedWrite = false;
try {
  await readOnlySandbox.run("let x = 10", { validator: readOnlyValidator });
} catch {
  blockedWrite = true;
}

const sizeValidator = (ast: ESTree.Program): boolean => ast.body.length <= 3;
const sizeLimitedSandbox = createSandbox({ env: "es2022", validator: sizeValidator });

let blockedLargeProgram = false;
try {
  await sizeLimitedSandbox.run(ts`let a = 1; let b = 2; let c = 3; let d = 4;`);
} catch {
  blockedLargeProgram = true;
}

console.log({ safeValue, readOnlyValue, blockedLoop, blockedWrite, blockedLargeProgram });
