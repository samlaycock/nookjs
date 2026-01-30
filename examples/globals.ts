import { Interpreter, ts } from "../src/index";

const interpreterWithGlobals = new Interpreter({
  globals: {
    PI: 3.14159,
    E: 2.71828,
    MAX_ITERATIONS: 1000,
  },
});

interpreterWithGlobals.evaluate(ts`
  let radius = 10;
  PI * radius * radius
`);

const interpreterForGlobals = new Interpreter();
interpreterForGlobals.evaluate(ts`multiplier * value`, {
  globals: { multiplier: 5, value: 20 },
});

const interpreterMerged = new Interpreter({ globals: { x: 10 } });
interpreterMerged.evaluate(ts`x + y + z`, {
  globals: { y: 20, z: 30 },
});

const interpreterWithConfig = new Interpreter({
  globals: {
    config: {
      maxRetries: 3,
      timeout: 5000,
      debug: true,
    },
  },
});

interpreterWithConfig.evaluate(ts`
  let retries = 0;
  while (retries < config.maxRetries) {
    retries = retries + 1;
  }
  retries
`);
