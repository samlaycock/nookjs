import { Interpreter, ts } from "../src/index";

const results: string[] = [];
const interpreterWithHostFunctions = new Interpreter({
  globals: {
    double: (x: number) => x * 2,
    add: (a: number, b: number) => a + b,
    log: (msg: string) => results.push(msg),
  },
});

interpreterWithHostFunctions.evaluate(ts`double(5)`);
interpreterWithHostFunctions.evaluate(ts`add(3, 7)`);
interpreterWithHostFunctions.evaluate(ts`
  log("Hello from sandbox!");
  log("Calculated: " + add(double(5), 3));
`);

const perCallInterpreter = new Interpreter();
perCallInterpreter.evaluate(ts`multiply(4, 5)`, {
  globals: {
    multiply: (a: number, b: number) => a * b,
  },
});

const mixedInterpreter = new Interpreter({
  globals: {
    hostDouble: (x: number) => x * 2,
  },
});
mixedInterpreter.evaluate(ts`
  function sandboxTriple(x) {
    return x * 3;
  }
  hostDouble(5) + sandboxTriple(5)
`);
