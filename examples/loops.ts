import { Interpreter, ts } from "../src/index";

const interpreter = new Interpreter();

interpreter.evaluate(ts`
  let sum = 0;
  for (let i = 0; i < 20; i++) {
    if (i > 15) {
      break;
    }
    if (i % 2 === 0) {
      continue;
    }
    sum = sum + i;
  }
  sum
`);

interpreter.evaluate(ts`
  let isPrime = n => {
    if (n <= 1) {
      return 0;
    }
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) {
        return 0;
      }
    }
    return 1;
  };

  let countPrimes = max => {
    let count = 0;
    for (let i = 2; i <= max; i++) {
      if (isPrime(i)) {
        count = count + 1;
      }
    }
    return count;
  };

  countPrimes(20)
`);
