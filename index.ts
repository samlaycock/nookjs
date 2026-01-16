import { Interpreter } from "./src/interpreter";

console.log("🚀 JavaScript Interpreter Demo\n");

console.log("--- Arrow Functions: Expression Body ---");
const arrowExpr = new Interpreter();
const arrowExprCode = `
  let double = x => x * 2;
  let add = (a, b) => a + b;
  double(5) + add(3, 7)
`;
console.log("Code: Arrow functions with expression body");
console.log("Result:", arrowExpr.evaluate(arrowExprCode));

console.log("\n--- Arrow Functions: Block Body ---");
const arrowBlock = new Interpreter();
const arrowBlockCode = `
  let factorial = n => {
    let result = 1;
    for (let i = 1; i <= n; i++) {
      result = result * i;
    }
    return result;
  };
  factorial(6)
`;
console.log("Code: Arrow function with block body");
console.log("Result:", arrowBlock.evaluate(arrowBlockCode));

console.log("\n--- Arrow Functions: Higher-Order Functions ---");
const arrowHigherOrder = new Interpreter();
const arrowHigherOrderCode = `
  function map(arr, f) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      result[i] = f(arr[i]);
    }
    return result;
  }
  let nums = [1, 2, 3, 4, 5];
  let squared = map(nums, x => x * x);
  squared[3]
`;
console.log("Code: Using map with arrow function");
console.log("Result:", arrowHigherOrder.evaluate(arrowHigherOrderCode));

console.log("\n--- Arrow Functions: Closures ---");
const arrowClosure = new Interpreter();
const arrowClosureCode = `
  let makeAdder = x => y => x + y;
  let add10 = makeAdder(10);
  add10(5)
`;
console.log("Code: Curried arrow functions");
console.log("Result:", arrowClosure.evaluate(arrowClosureCode));

console.log("\n--- Arrow Functions: Filter Array ---");
const arrowFilter = new Interpreter();
const arrowFilterCode = `
  function filter(arr, pred) {
    let result = [];
    let j = 0;
    for (let i = 0; i < arr.length; i++) {
      if (pred(arr[i])) {
        result[j] = arr[i];
        j = j + 1;
      }
    }
    return result;
  }
  let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let evens = filter(nums, n => n % 2 === 0);
  evens.length
`;
console.log("Code: Filter even numbers with arrow function");
console.log("Result:", arrowFilter.evaluate(arrowFilterCode));

console.log("\n--- Break and Continue ---");
const breakContinue = new Interpreter();
const breakContinueCode = `
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
`;
console.log("Code: Sum odd numbers up to 15");
console.log("Result:", breakContinue.evaluate(breakContinueCode));

console.log("\n--- Objects: Array of Objects ---");
const objArray = new Interpreter();
const objArrayCode = `
  let people = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 }
  ];
  let totalAge = 0;
  for (let i = 0; i < people.length; i++) {
    totalAge = totalAge + people[i].age;
  }
  totalAge
`;
console.log("Code: Sum ages from array of objects");
console.log("Result:", objArray.evaluate(objArrayCode));

console.log("\n--- For Loop: Count Primes ---");
const countPrimes = new Interpreter();
const countPrimesCode = `
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
`;
console.log("Code: Count primes with arrow functions");
console.log("Result:", countPrimes.evaluate(countPrimesCode));

console.log("\n--- Factorial (Recursive Arrow Function) ---");
const factorial = new Interpreter();
const factCode = `
  let factorial = n => {
    if (n <= 1) {
      return 1;
    }
    return n * factorial(n - 1);
  };
  factorial(6)
`;
console.log("Code: Recursive factorial with arrow function");
console.log("factorial(6) =", factorial.evaluate(factCode));

console.log("\n--- Fibonacci (Iterative) ---");
const fibonacci = new Interpreter();
const fibCode = `
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
`;
console.log("Code: Iterative fibonacci with arrow function");
console.log("fib(10) =", fibonacci.evaluate(fibCode));

console.log("\n--- Object Methods and 'this' Keyword ---");
const objectMethods = new Interpreter();
const objectMethodsCode = `
  let counter = {
    count: 0,
    increment: function() {
      this.count = this.count + 1;
      return this.count;
    },
    decrement: function() {
      this.count = this.count - 1;
      return this.count;
    },
    getCount: function() {
      return this.count;
    }
  };
  counter.increment();
  counter.increment();
  counter.increment();
  counter.decrement();
  counter.getCount()
`;
console.log("Code: Counter object with methods");
console.log("Result:", objectMethods.evaluate(objectMethodsCode));

console.log("\n--- Object Methods: Rectangle ---");
const rectangle = new Interpreter();
const rectangleCode = `
  let rect = {
    width: 10,
    height: 5,
    area: function() {
      return this.width * this.height;
    },
    perimeter: function() {
      return 2 * (this.width + this.height);
    },
    scale: function(factor) {
      this.width = this.width * factor;
      this.height = this.height * factor;
      return this;
    }
  };
  rect.scale(2);
  rect.area()
`;
console.log("Code: Rectangle with methods that return 'this'");
console.log("Result:", rectangle.evaluate(rectangleCode));

console.log("\n--- Object Methods: Shopping Cart ---");
const shoppingCart = new Interpreter();
const shoppingCartCode = `
  let cart = {
    items: [],
    total: 0,
    addItem: function(price) {
      let len = this.items.length;
      this.items[len] = price;
      this.total = this.total + price;
      return this.total;
    },
    getTotal: function() {
      return this.total;
    },
    getItemCount: function() {
      return this.items.length;
    }
  };
  cart.addItem(10);
  cart.addItem(25);
  cart.addItem(15);
  cart.getTotal()
`;
console.log("Code: Shopping cart with methods");
console.log("Result:", shoppingCart.evaluate(shoppingCartCode));

console.log("\n--- Injected Globals: Constructor ---");
const interpreterWithGlobals = new Interpreter({
  globals: {
    PI: 3.14159,
    E: 2.71828,
    MAX_ITERATIONS: 1000,
  },
});

const circleArea = interpreterWithGlobals.evaluate(`
  let radius = 10;
  PI * radius * radius
`);
console.log("Code: Circle area with PI global");
console.log("Result:", circleArea);

console.log("\n--- Injected Globals: Per-call ---");
const interpreterForGlobals = new Interpreter();
const perCallResult = interpreterForGlobals.evaluate("multiplier * value", {
  globals: { multiplier: 5, value: 20 },
});
console.log("Code: multiplier * value with per-call globals");
console.log("Result:", perCallResult);

console.log("\n--- Injected Globals: Merged ---");
const interpreterMerged = new Interpreter({ globals: { x: 10 } });
const mergedResult = interpreterMerged.evaluate("x + y + z", {
  globals: { y: 20, z: 30 },
});
console.log("Code: x + y + z with constructor x=10 and per-call y=20, z=30");
console.log("Result:", mergedResult);

console.log("\n--- Injected Globals: Configuration Object ---");
const interpreterWithConfig = new Interpreter({
  globals: {
    config: {
      maxRetries: 3,
      timeout: 5000,
      debug: true,
    },
  },
});

const configResult = interpreterWithConfig.evaluate(`
  let retries = 0;
  while (retries < config.maxRetries) {
    retries = retries + 1;
  }
  retries
`);
console.log("Code: Using config.maxRetries in a loop");
console.log("Result:", configResult);

console.log("\n--- AST Validator: Constructor ---");
const noLoopsValidator = (ast: any) => {
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') && !code.includes('"ForStatement"');
};

const validatedInterpreter = new Interpreter({
  globals: { MAX: 100 },
  validator: noLoopsValidator,
});

console.log("Code: 5 + 10 (no loops)");
console.log("Result:", validatedInterpreter.evaluate("5 + 10"));

try {
  validatedInterpreter.evaluate("let i = 0; while (i < 5) { i = i + 1; }");
  console.log("Error: Should have been blocked");
} catch (e) {
  console.log("Blocked: while loop rejected by validator ✓");
}

console.log("\n--- AST Validator: Per-call ---");
const simpleInterpreter = new Interpreter();

const readOnlyValidator = (ast: any) => {
  const code = JSON.stringify(ast);
  return !code.includes('"VariableDeclaration"');
};

console.log("Normal call:", simpleInterpreter.evaluate("10 + 20"));
console.log(
  "With validator:",
  simpleInterpreter.evaluate("5 * 3", { validator: readOnlyValidator }),
);

try {
  simpleInterpreter.evaluate("let x = 10", { validator: readOnlyValidator });
  console.log("Error: Should have been blocked");
} catch (e) {
  console.log("Blocked: variable declaration rejected ✓");
}

console.log("\n--- AST Validator: Limit Program Size ---");
const sizeValidator = (ast: any) => {
  return ast.body.length <= 3;
};

const sizeLimitedInterpreter = new Interpreter({ validator: sizeValidator });
console.log(
  "Small program (2 statements):",
  sizeLimitedInterpreter.evaluate("let x = 5; x + 10"),
);

try {
  sizeLimitedInterpreter.evaluate(
    "let a = 1; let b = 2; let c = 3; let d = 4;",
  );
  console.log("Error: Should have been blocked");
} catch (e) {
  console.log("Blocked: too many statements ✓");
}

console.log("\n--- Host Functions ---");
const results: string[] = [];
const interpreterWithHostFunctions = new Interpreter({
  globals: {
    double: (x: number) => x * 2,
    add: (a: number, b: number) => a + b,
    log: (msg: string) => results.push(msg),
  },
});

console.log("Code: Calling host functions from sandbox");
const hostResult1 = interpreterWithHostFunctions.evaluate("double(5)");
console.log("double(5):", hostResult1);

const hostResult2 = interpreterWithHostFunctions.evaluate("add(3, 7)");
console.log("add(3, 7):", hostResult2);

interpreterWithHostFunctions.evaluate(`
  log("Hello from sandbox!");
  log("Calculated: " + add(double(5), 3));
`);
console.log("Logged messages:", results);

console.log("\n--- Host Functions: Per-call Globals ---");
const perCallInterpreter = new Interpreter();
const hostPerCallResult = perCallInterpreter.evaluate("multiply(4, 5)", {
  globals: {
    multiply: (a: number, b: number) => a * b,
  },
});
console.log("multiply(4, 5) with per-call global:", hostPerCallResult);

console.log("\n--- Host Functions: Mixed with Sandbox Functions ---");
const mixedInterpreter = new Interpreter({
  globals: {
    hostDouble: (x: number) => x * 2,
  },
});
const mixedResult = mixedInterpreter.evaluate(`
  function sandboxTriple(x) {
    return x * 3;
  }
  hostDouble(5) + sandboxTriple(5)
`);
console.log("hostDouble(5) + sandboxTriple(5):", mixedResult);

console.log("\n--- Async/Await: Async Host Functions ---");
(async () => {
  const asyncInterpreter = new Interpreter({
    globals: {
      fetchData: async (id: number) => {
        // Simulate async operation
        return new Promise((resolve) => {
          setTimeout(() => resolve(`Data for ID ${id}`), 10);
        });
      },
      asyncDouble: async (x: number) => x * 2,
    },
  });

  console.log("Code: Calling async host function");
  const asyncResult1 = await asyncInterpreter.evaluateAsync("fetchData(42)");
  console.log("fetchData(42):", asyncResult1);

  console.log("\nCode: Async arithmetic");
  const asyncResult2 = await asyncInterpreter.evaluateAsync(
    "asyncDouble(5) + asyncDouble(10)",
  );
  console.log("asyncDouble(5) + asyncDouble(10):", asyncResult2);

  console.log("\n--- Async/Await: Complex Async Operations ---");
  const complexAsyncInterpreter = new Interpreter({
    globals: {
      asyncGetUser: async (id: number) => ({
        id,
        name: `User${id}`,
        active: true,
      }),
      asyncCalculate: async (a: number, b: number) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(a * b + 10), 5);
        });
      },
    },
  });

  console.log("Code: Async function returning object");
  const user = await complexAsyncInterpreter.evaluateAsync(`
    let user = asyncGetUser(123);
    user.name
  `);
  console.log("User name:", user);

  console.log("\nCode: Nested async calls");
  const calculated = await complexAsyncInterpreter.evaluateAsync(`
    asyncCalculate(5, asyncCalculate(2, 3))
  `);
  console.log("asyncCalculate(5, asyncCalculate(2, 3)):", calculated);

  console.log("\n--- Async/Await: Async Control Flow ---");
  const asyncLoopInterpreter = new Interpreter({
    globals: {
      asyncIncrement: async (x: number) => x + 1,
    },
  });

  console.log("Code: Async function in loop");
  const loopResult = await asyncLoopInterpreter.evaluateAsync(`
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      sum = sum + asyncIncrement(i);
    }
    sum
  `);
  console.log("Sum with async increments:", loopResult);

  console.log("\nCode: Async function in conditional");
  const condResult = await asyncLoopInterpreter.evaluateAsync(`
    let result;
    if (asyncIncrement(5) > 5) {
      result = "greater";
    } else {
      result = "not greater";
    }
    result
  `);
  console.log("Conditional result:", condResult);

  console.log("\n--- Async/Await: Mixed Sync and Async ---");
  const mixedAsyncInterpreter = new Interpreter({
    globals: {
      syncAdd: (a: number, b: number) => a + b,
      asyncMultiply: async (a: number, b: number) => a * b,
    },
  });

  console.log("Code: Mixing sync and async host functions");
  const mixedResult = await mixedAsyncInterpreter.evaluateAsync(`
    asyncMultiply(syncAdd(2, 3), syncAdd(4, 6))
  `);
  console.log("asyncMultiply(syncAdd(2, 3), syncAdd(4, 6)):", mixedResult);

  console.log("\n--- Async/Await: Sandbox Async Functions ---");
  const sandboxAsyncInterpreter = new Interpreter();

  console.log("Code: Async function with await");
  const sandboxResult1 = await sandboxAsyncInterpreter.evaluateAsync(`
    async function getData() {
      return 42;
    }
    async function process() {
      let data = await getData();
      return data * 2;
    }
    process()
  `);
  console.log("Async function with await:", sandboxResult1);

  console.log("\nCode: Nested async/await");
  const sandboxResult2 = await sandboxAsyncInterpreter.evaluateAsync(`
    async function fetchUser(id) {
      return { id: id, name: "User" + id, active: true };
    }
    async function getUsername(id) {
      let user = await fetchUser(id);
      return user.name;
    }
    getUsername(123)
  `);
  console.log("Nested async/await:", sandboxResult2);

  console.log("\nCode: Async functions with host functions");
  const mixedSandboxInterpreter = new Interpreter({
    globals: {
      asyncFetch: async (id: number) => `Data${id}`,
    },
  });
  const sandboxResult3 = await mixedSandboxInterpreter.evaluateAsync(`
    async function processData(id) {
      let data = await asyncFetch(id);
      return data + " processed";
    }
    processData(999)
  `);
  console.log("Async sandbox with host functions:", sandboxResult3);

  console.log("\nCode: Async arrow functions");
  const arrowAsyncResult = await sandboxAsyncInterpreter.evaluateAsync(`
    let asyncDouble = async (x) => x * 2;
    let asyncProcess = async (x) => {
      let doubled = await asyncDouble(x);
      return doubled + 10;
    };
    asyncProcess(5)
  `);
  console.log("Async arrow functions:", arrowAsyncResult);

  console.log("\n--- Async/Await: Control Flow ---");
  console.log("Code: Await in loops");
  const loopAsyncResult = await mixedSandboxInterpreter.evaluateAsync(`
    async function increment(x) {
      return x + 1;
    }
    async function sumSequence() {
      let sum = 0;
      for (let i = 0; i < 5; i++) {
        sum = sum + (await increment(i));
      }
      return sum;
    }
    sumSequence()
  `);
  console.log("Await in loops:", loopAsyncResult);

  console.log("\nCode: Await in conditionals");
  const condAsyncResult = await mixedSandboxInterpreter.evaluateAsync(`
    async function check(x) {
      return x > 10;
    }
    async function classify(x) {
      if (await check(x)) {
        return "big";
      } else {
        return "small";
      }
    }
    classify(15)
  `);
  console.log("Await in conditionals:", condAsyncResult);

  console.log("\n--- Global Objects: Math ---");
  const mathInterpreter = new Interpreter({ globals: { Math } });

  console.log("Code: Math.floor(4.7)");
  console.log("Result:", mathInterpreter.evaluate("Math.floor(4.7)"));

  console.log("\nCode: Math.PI * 2");
  console.log("Result:", mathInterpreter.evaluate("Math.PI * 2"));

  console.log("\nCode: Math.sqrt(16)");
  console.log("Result:", mathInterpreter.evaluate("Math.sqrt(16)"));

  console.log("\nCode: Math.max(10, 20, 5, 15)");
  console.log("Result:", mathInterpreter.evaluate("Math.max(10, 20, 5, 15)"));

  console.log("\nCode: Using Math in calculations");
  const circleCalc = mathInterpreter.evaluate(`
    let radius = 5;
    let area = Math.PI * Math.pow(radius, 2);
    Math.round(area)
  `);
  console.log("Circle area (rounded):", circleCalc);

  console.log("\n--- Global Objects: console ---");
  const logs: string[] = [];
  const mockConsole = {
    log: (...args: any[]) => {
      logs.push(args.join(" "));
    },
  };
  const consoleInterpreter = new Interpreter({
    globals: { console: mockConsole },
  });

  console.log("Code: console.log in sandbox");
  consoleInterpreter.evaluate(`
    console.log("Hello from sandbox!");
    console.log("Number:", 42);
  `);
  console.log("Logged messages:", logs);

  console.log("\n--- Global Objects: Custom API ---");
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

  console.log("Code: api.getValue()");
  console.log("Result:", apiInterpreter.evaluate("api.getValue()"));

  console.log("\nCode: api.calculate(5, 3)");
  console.log("Result:", apiInterpreter.evaluate("api.calculate(5, 3)"));

  console.log("\nCode: api.version");
  console.log("Result:", apiInterpreter.evaluate("api.version"));

  console.log("\n--- Global Objects: Security ---");
  const secureInterpreter = new Interpreter({ globals: { Math } });

  try {
    secureInterpreter.evaluate("Math.PI = 3");
    console.log("Error: Should have been blocked");
  } catch (e: any) {
    console.log("Blocked: Math.PI = 3 (read-only property) ✓");
  }

  try {
    secureInterpreter.evaluate("Math.__proto__");
    console.log("Error: Should have been blocked");
  } catch (e: any) {
    console.log("Blocked: Math.__proto__ access ✓");
  }

  try {
    secureInterpreter.evaluate("Math.constructor");
    console.log("Error: Should have been blocked");
  } catch (e: any) {
    console.log("Blocked: Math.constructor access ✓");
  }

  console.log("\n--- Try/Catch/Finally: Basic Error Handling ---");
  const tryCatchInterpreter = new Interpreter();

  console.log("Code: Try/catch with error");
  const tryCatchResult1 = tryCatchInterpreter.evaluate(`
    let result = "not executed";
    try {
      throw "Something went wrong!";
      result = "success"; // Not executed
    } catch (e) {
      result = "caught error";
    }
    result
  `);
  console.log("Result:", tryCatchResult1);

  console.log("\nCode: Try/catch without error");
  const tryCatchResult2 = tryCatchInterpreter.evaluate(`
    let result2;
    try {
      result2 = "success";
    } catch (e) {
      result2 = "error";
    }
    result2
  `);
  console.log("Result:", tryCatchResult2);

  console.log("\n--- Try/Catch/Finally: Finally Block ---");
  console.log("Code: Finally always executes");
  const finallyResult = tryCatchInterpreter.evaluate(`
    let log = [];
    try {
      log.push("try");
      throw "error";
    } catch (e) {
      log.push("catch");
    } finally {
      log.push("finally");
    }
    log
  `);
  console.log("Execution order:", finallyResult);

  console.log("\n--- Try/Catch/Finally: Control Flow ---");
  console.log("Code: Return in try, finally still executes");
  const returnFinally = tryCatchInterpreter.evaluate(`
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
  console.log("Result:", returnFinally);

  console.log("\nCode: Finally overrides return");
  const finallyOverride = tryCatchInterpreter.evaluate(`
    function testOverride() {
      try {
        return "from try";
      } finally {
        return "from finally";
      }
    }
    testOverride()
  `);
  console.log("Result:", finallyOverride);

  console.log("\n--- Try/Catch/Finally: Nested Try/Catch ---");
  console.log("Code: Nested error handling");
  const nestedTry = tryCatchInterpreter.evaluate(`
    let log2 = [];
    try {
      log2.push("outer try");
      try {
        log2.push("inner try");
        throw "inner error";
      } catch (e) {
        log2.push("inner catch");
      }
      log2.push("after inner");
    } catch (e) {
      log2.push("outer catch");
    }
    log2
  `);
  console.log("Execution order:", nestedTry);

  console.log("\n--- Try/Catch/Finally: Break/Continue in Loops ---");
  console.log("Code: Break in try block");
  const breakInTry = tryCatchInterpreter.evaluate(`
    let i2 = 0;
    while (i2 < 10) {
      try {
        i2++;
        if (i2 === 5) break;
      } finally {
        // Finally executes even with break
      }
    }
    i2
  `);
  console.log("Result:", breakInTry);

  console.log("\nCode: Continue in try block");
  const continueInTry = tryCatchInterpreter.evaluate(`
    let sum2 = 0;
    for (let i3 = 0; i3 < 10; i3++) {
      try {
        if (i3 % 2 === 0) continue;
        sum2 = sum2 + i3;
      } finally {
        // Finally executes even with continue
      }
    }
    sum2
  `);
  console.log("Sum of odd numbers:", continueInTry);

  console.log("\n--- Try/Catch/Finally: Error Objects ---");
  console.log("Code: Catch and examine error");
  const errorObject = tryCatchInterpreter.evaluate(`
    let caughtError;
    try {
      throw "My custom error message";
    } catch (e) {
      caughtError = e;
    }
    caughtError
  `);
  console.log("Caught error:", errorObject);

  console.log("\n--- Try/Catch/Finally: Practical Example ---");
  console.log("Code: Safe division with error handling");
  const safeDivision = tryCatchInterpreter.evaluate(`
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
        // Cleanup could happen here
      }
      return result;
    }

    let results = [];
    results.push(safeDivide(10, 2));
    results.push(safeDivide(10, 0));
    results.push(safeDivide(15, 3));
    results
  `);
  console.log("Division results:", safeDivision);

  console.log("\n--- Try/Catch/Finally: Async Error Handling ---");
  const asyncTryCatch = await tryCatchInterpreter.evaluateAsync(`
    let log3 = [];
    try {
      log3.push("async try");
      throw "async error";
    } catch (e) {
      log3.push("async catch");
    } finally {
      log3.push("async finally");
    }
    log3
  `);
  console.log("Async execution order:", asyncTryCatch);

  console.log("\n✅ All demos completed successfully!");
})().then(() => {
  console.log("\nSupported Features:");
  console.log("- Numbers, strings, booleans, arrays, objects");
  console.log("- Arithmetic, comparison, and logical operators");
  console.log("- Update operators (++, --)");
  console.log("- Variables (let/const) with lexical scoping");
  console.log("- Conditionals (if/else)");
  console.log(
    "- Loops (while, for, for...of, for...in) with break and continue",
  );
  console.log("- Functions (regular and arrow) with closures and recursion");
  console.log("- Arrays and objects with full property access");
  console.log("- Higher-order functions with arrow functions");
  console.log("- Object methods with 'this' keyword binding");
  console.log("- Try/catch/finally with proper control flow");
  console.log("- Throw statements for error handling");
  console.log("- Injected globals (constructor and per-call)");
  console.log("- Host functions (call host code from sandbox)");
  console.log(
    "- Global objects (Math, console, custom APIs via ReadOnlyProxy)",
  );
  console.log("- Async host functions (with evaluateAsync())");
  console.log("- Async/await syntax (async functions and await expressions)");
  console.log("- AST validation (constructor and per-call)");
});
