import { Interpreter, ts } from "../src/index";

const mathInterpreter = new Interpreter({ globals: { Math } });

mathInterpreter.evaluate(ts`Math.floor(4.7)`);
mathInterpreter.evaluate(ts`Math.PI * 2`);
mathInterpreter.evaluate(ts`Math.sqrt(16)`);
mathInterpreter.evaluate(ts`Math.max(10, 20, 5, 15)`);
mathInterpreter.evaluate(ts`
  let radius = 5;
  let area = Math.PI * Math.pow(radius, 2);
  Math.round(area)
`);

const logs: string[] = [];
const mockConsole = {
  log: (...args: any[]) => {
    logs.push(args.join(" "));
  },
};
const consoleInterpreter = new Interpreter({
  globals: { console: mockConsole },
});

consoleInterpreter.evaluate(ts`
  console.log("Hello from sandbox!");
  console.log("Number:", 42);
`);

const customAPI = {
  version: "1.0.0",
  getValue() {
    return 42;
  },
  calculate(x: number, y: number) {
    return x * y + 10;
  },
};
const apiInterpreter = new Interpreter({ globals: { api: customAPI } });

apiInterpreter.evaluate(ts`api.getValue()`);
apiInterpreter.evaluate(ts`api.calculate(5, 3)`);
apiInterpreter.evaluate(ts`api.version`);

const secureInterpreter = new Interpreter({ globals: { Math } });

try {
  secureInterpreter.evaluate(ts`Math.PI = 3`);
} catch {
  // Blocked
}

try {
  secureInterpreter.evaluate(ts`Math.__proto__`);
} catch {
  // Blocked
}

try {
  secureInterpreter.evaluate(ts`Math.constructor`);
} catch {
  // Blocked
}
