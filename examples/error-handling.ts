import { Interpreter, ts } from "../src/index";

const tryCatchInterpreter = new Interpreter();

tryCatchInterpreter.evaluate(ts`
  let result = "not executed";
  try {
    throw "Something went wrong!";
    result = "success";
  } catch {
    result = "caught error";
  }
  result
`);

tryCatchInterpreter.evaluate(ts`
  let result2;
  try {
    result2 = "success";
  } catch {
    result2 = "error";
  }
  result2
`);

tryCatchInterpreter.evaluate(ts`
  let log = [];
  try {
    log.push("try");
    throw "error";
  } catch {
    log.push("catch");
  } finally {
    log.push("finally");
  }
  log
`);

tryCatchInterpreter.evaluate(ts`
  function test() {
    let executed = [];
    try {
      executed.push("try");
      return executed;
    } finally {
      executed.push("finally");
    }
  }
  test()
`);

tryCatchInterpreter.evaluate(ts`
  function testOverride() {
    try {
      return "from try";
    } finally {
      return "from finally";
    }
  }
  testOverride()
`);

tryCatchInterpreter.evaluate(ts`
  let log2 = [];
  try {
    log2.push("outer try");
    try {
      log2.push("inner try");
      throw "inner error";
    } catch {
      log2.push("inner catch");
    }
    log2.push("after inner");
  } catch {
    log2.push("outer catch");
  }
  log2
`);

tryCatchInterpreter.evaluate(ts`
  let i2 = 0;
  while (i2 < 10) {
    try {
      i2++;
      if (i2 === 5) break;
    } finally {
    }
  }
  i2
`);

tryCatchInterpreter.evaluate(ts`
  let sum2 = 0;
  for (let i3 = 0; i3 < 10; i3++) {
    try {
      if (i3 % 2 === 0) continue;
      sum2 = sum2 + i3;
    } finally {
    }
  }
  sum2
`);

tryCatchInterpreter.evaluate(ts`
  let caughtError;
  try {
    throw "My custom error message";
  } catch(e) {
    caughtError = e;
  }
  caughtError
`);

tryCatchInterpreter.evaluate(ts`
  function safeDivide(a, b) {
    let result;
    try {
      if (b === 0) {
        throw "Division by zero";
      }
      result = a / b;
    } catch (e) {
      result = "Error: " + e;
    } finally {
    }
    return result;
  }

  let results = [];
  results.push(safeDivide(10, 2));
  results.push(safeDivide(10, 0));
  results.push(safeDivide(15, 3));
  results
`);

await tryCatchInterpreter.evaluateAsync(ts`
  let log3 = [];
  try {
    log3.push("async try");
    throw "async error";
  } catch {
    log3.push("async catch");
  } finally {
    log3.push("async finally");
  }
  log3
`);
