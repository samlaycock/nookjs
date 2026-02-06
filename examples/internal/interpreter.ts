import { ES2022, Interpreter, preset } from "../../src/index";

const interpreter = new Interpreter(
  preset(ES2022, {
    globals: {
      scale: (value: number, factor: number) => value * factor,
    },
    security: {
      sanitizeErrors: true,
      hideHostErrorMessages: true,
    },
  }),
);

const value = interpreter.evaluate("scale(7, 6)");
const stats = interpreter.getStats();

console.log({ value, stats });
