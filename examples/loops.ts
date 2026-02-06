import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({ env: "es2022" });

const oddSum = await sandbox.run<number>(ts`
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

const primeCount = await sandbox.run<number>(ts`
  const isPrime = (n) => {
    if (n <= 1) {
      return false;
    }
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
  };

  let count = 0;
  for (let i = 2; i <= 20; i++) {
    if (isPrime(i)) {
      count = count + 1;
    }
  }
  count
`);

console.log({ oddSum, primeCount });
