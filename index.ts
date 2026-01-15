import { Interpreter } from "./interpreter";

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
  PI: 3.14159,
  E: 2.71828,
  MAX_ITERATIONS: 1000,
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
const interpreterMerged = new Interpreter({ x: 10 });
const mergedResult = interpreterMerged.evaluate("x + y + z", {
  globals: { y: 20, z: 30 },
});
console.log("Code: x + y + z with constructor x=10 and per-call y=20, z=30");
console.log("Result:", mergedResult);

console.log("\n--- Injected Globals: Configuration Object ---");
const interpreterWithConfig = new Interpreter({
  config: {
    maxRetries: 3,
    timeout: 5000,
    debug: true,
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

console.log("\n✅ All demos completed successfully!");
console.log("\nSupported Features:");
console.log("- Numbers, strings, booleans, arrays, objects");
console.log("- Arithmetic, comparison, and logical operators");
console.log("- Update operators (++, --)");
console.log("- Variables (let/const) with lexical scoping");
console.log("- Conditionals (if/else)");
console.log("- Loops (while, for) with break and continue");
console.log("- Functions (regular and arrow) with closures and recursion");
console.log("- Arrays and objects with full property access");
console.log("- Higher-order functions with arrow functions");
console.log("- Object methods with 'this' keyword binding");
console.log("- Injected globals (constructor and per-call)");
console.log("- AST validation (constructor and per-call)");
