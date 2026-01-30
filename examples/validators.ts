import { Interpreter, ts } from "../src/index";

const noLoopsValidator = (ast: any) => {
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') && !code.includes('"ForStatement"');
};

const validatedInterpreter = new Interpreter({
  globals: { MAX: 100 },
  validator: noLoopsValidator,
});

validatedInterpreter.evaluate(ts`5 + 10`);

try {
  validatedInterpreter.evaluate(ts`let i = 0; while (i < 5) { i = i + 1; }`);
} catch {
  // Blocked
}

const simpleInterpreter = new Interpreter();

const readOnlyValidator = (ast: any) => {
  const code = JSON.stringify(ast);
  return !code.includes('"VariableDeclaration"');
};

simpleInterpreter.evaluate(ts`10 + 20`);
simpleInterpreter.evaluate(ts`5 * 3`, { validator: readOnlyValidator });

try {
  simpleInterpreter.evaluate(ts`let x = 10`, { validator: readOnlyValidator });
} catch {
  // Blocked
}

const sizeValidator = (ast: any) => {
  return ast.body.length <= 3;
};

const sizeLimitedInterpreter = new Interpreter({ validator: sizeValidator });
sizeLimitedInterpreter.evaluate(ts`let x = 5; x + 10`);

try {
  sizeLimitedInterpreter.evaluate(ts`let a = 1; let b = 2; let c = 3; let d = 4;`);
} catch {
  // Blocked
}
