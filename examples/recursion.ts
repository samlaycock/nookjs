import { Interpreter, ts } from "../src/index";

const interpreter = new Interpreter();

interpreter.evaluate(ts`
  let factorial = n => {
    if (n <= 1) {
      return 1;
    }
    return n * factorial(n - 1);
  };
  factorial(6)
`);

interpreter.evaluate(ts`
  let fib = n => {
    if (n <= 1) {
      return n;
    }
    let a = 0;
    let b = 1;
    let temp = 0;
    for (let i = 2; i <= n; i++) {
      temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  };
  fib(10)
`);
