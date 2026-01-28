# NookJS - JavaScript/TypeScript(ish) Interpreter

A simple, secure JavaScript interpreter built with TypeScript and a zero-dependency custom AST parser. This interpreter evaluates a subset of JavaScript, supporting mathematical operations, variables, boolean logic, control flow, functions, strings, and arrays. It also accepts TypeScript-style type annotations that are stripped at parse time (types-as-comments).

## Features

Currently supports:

### Language Feature Docs

See `docs/README.md` for one-page descriptions of each supported `LanguageFeature`,
including implementation notes and interpreter-specific gotchas.

### TypeScript Annotations (Stripped)

The parser accepts TypeScript-style annotations and removes them from the AST, so runtime behavior matches plain JavaScript. This is the same model as TC39 “Types as Comments” and Node’s `--experimental-strip-types`.

Supported (stripped):

- Variable/parameter/property type annotations
- Function return types
- `as` assertions
- Optional (`?`) and definite assignment (`!`) markers
- `implements` clauses
- `type` and `interface` declarations (parsed and dropped)

Not supported:

- TSX/JSX
- `enum` / `namespace`
- `import` / `export` (not allowed in the interpreter)

### Injected Globals & Host Functions

The interpreter supports injecting global variables and **calling host functions** from the host environment:

- **Constructor Globals**: Pass globals when creating the interpreter - available for all `evaluate()` calls and persist across invocations
- **Per-call Globals**: Pass globals as options to individual `evaluate()` calls - available ONLY for that single execution, then cleaned up
- **Host Functions**: Functions passed as globals CAN be called from sandbox code (sync functions only in `evaluate()`)
- **Property Protection**: Property access on host functions is blocked for security (no `.name`, `.__proto__`, etc.)
- **Merged Globals**: Constructor and per-call globals are merged during execution, with per-call taking precedence
- **Temporary Override**: Per-call globals can temporarily override constructor globals, but the original values are restored after execution
- **Immutable**: Globals are declared as `const` and cannot be reassigned by interpreted code
- **User Variable Protection**: User-declared variables take precedence over late-injected globals

### Security Features

The interpreter is designed to safely execute untrusted JavaScript code in a sandboxed environment.

**Trust Boundary**: The interpreter establishes a security boundary between:

- **Host (Trusted)**: The TypeScript/JavaScript code running the interpreter
- **Sandbox (Untrusted)**: The JavaScript code being evaluated by the interpreter

**Goal**: Prevent sandbox code from:

1. Accessing the host runtime environment
2. Modifying global objects or prototypes
3. Executing arbitrary host code
4. Escaping the sandbox

#### Built-in Protections

**1. Prototype Pollution Prevention**

The interpreter blocks access to dangerous property names:

```typescript
// These are blocked for security
obj.__proto__;
obj.constructor;
obj.prototype;
obj.__defineGetter__;
obj.__defineSetter__;
obj.__lookupGetter__;
obj.__lookupSetter__;
```

**2. Prototype Chain Access Blocked (Strict Mode)**

Sandbox object property access is restricted to own properties only. Inherited prototype properties (e.g., `obj.toString`, `arr.toString`, `fn.call`) are blocked. Arrays and strings still expose supported methods through explicit interpreter shims, and template-literal coercion does not rely on prototype `toString`.

**3. No Built-in Global Access**

Sandbox code does not have access to: `eval`, `Function` constructor, `Promise` constructor, `globalThis` / `window` / `global`, `require` / `import`, or any Node.js/Bun/browser APIs.

**4. Host Function Protection**

Host functions passed as globals are wrapped and protected:

```javascript
// Host passes: { myFunc: () => "secret" }
myFunc.name; // Error: Cannot access properties on host functions
myFunc.toString(); // Error: Cannot access properties on host functions
await myFunc; // Error: Cannot await a host function (must call it)
```

**5. Whitelisted AST Nodes Only**

Only explicitly supported AST node types are evaluated. Any unsupported node type throws an error.

**6. Async/Await Protections**

Sync mode (`evaluate()`) cannot call async functions or use await, preventing mixing sync/async contexts.

#### What the Interpreter Does NOT Protect Against

**Denial of Service (DoS)**: Infinite loops and memory exhaustion are not prevented. Host should implement timeouts:

```typescript
const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
const result = await Promise.race([interpreter.evaluateAsync(untrustedCode), timeout]);
```

**Reference Leakage**: Globals are passed by reference. Clone objects before passing as globals:

```typescript
const interpreter = new Interpreter({
  globals: { state: structuredClone(sharedState) },
});
```

**Side Effects via Host Functions**: Host functions have full access to the host environment. Only expose safe, sandboxed host functions with argument validation.

#### Security Best Practices

1. **Minimize Host Function Surface Area**: Only expose what's necessary
2. **Use AST Validators**: Restrict language features based on use case
3. **Implement Timeouts**: Protect against infinite loops
4. **Clone Sensitive Data**: Prevent reference leakage
5. **Validate Host Function Arguments**: Never trust sandbox input
6. **Use Per-Call Globals for Isolation**: Isolate per-execution state

### Feature Control System

The interpreter supports fine-grained feature control to target specific ECMAScript versions:

- **Whitelist Mode**: Enable only specific features (restrictive, everything else disabled)
- **Blacklist Mode**: Disable specific features (permissive, everything else enabled)
- **Constructor Configuration**: Set feature control when creating the interpreter (applies to all evaluations)
- **Per-call Configuration**: Override feature control for individual `evaluate()` calls
- **30+ Controllable Features**: Including ES5 features (loops, functions, operators) and ES6+ features (arrow functions, generators, async/await, optional chaining, logical assignment, destructuring, etc.)
- **Version Targeting**: Simulate ES5, ES2015, ES2017, or any ECMAScript version
- **Error Messages**: Clear error when disabled features are used (e.g., "ArrowFunctions is not enabled")

Example - ES5 only (no modern features):

```typescript
const es5Interpreter = new Interpreter({
  featureControl: {
    mode: "whitelist",
    features: ["FunctionDeclarations", "ForStatement", "IfStatement", "VariableDeclarations", ...]
  }
});
```

### ECMAScript Version Presets

Pre-configured presets for different ECMAScript versions (ES5 through ES2024):

- **ES5 (2009)**: Baseline JavaScript - `var`, functions, for/while loops, objects/arrays
- **ES2015/ES6 (2015)**: Modern JavaScript - `let`/`const`, arrow functions, template literals, destructuring, spread/rest, for-of, generators, Promises
- **ES2016 (2016)**: Exponentiation operator (`**`), Array.includes
- **ES2017 (2017)**: **async/await**
- **ES2018-ES2024**: Progressive enhancements (mostly prototype methods)
- **ESNext**: All features enabled (latest capabilities)

Usage:

```typescript
import { Interpreter } from "./interpreter";
import { ES5, ES2015, ES2017, ES2020 } from "./presets";

const es5Interp = new Interpreter(ES5); // Only ES5 features
const es2015Interp = new Interpreter(ES2015); // ES5 + ES2015 features
const es2017Interp = new Interpreter(ES2017); // Includes async/await
```

**Preset Accuracy**: ES5, ES2015-2019, and ES2023-2024 have 90-100% accuracy. See implementation for details on missing features (classes, optional chaining, nullish coalescing).

### AST Validation

The interpreter supports custom AST validation for security and policy enforcement:

- **Constructor Validator**: Pass a validator function when creating the interpreter - applied to all `evaluate()` calls
- **Per-call Validator**: Pass a validator function to individual `evaluate()` calls - applied only to that execution
- **Validator Precedence**: Per-call validators override constructor validators
- **Validation Function**: Takes parsed AST (`ESTree.Program`) and returns `true` (allow) or `false` (reject)
- **Error Handling**: Rejected code throws `InterpreterError` with message "AST validation failed"
- **Use Cases**: Restrict loops, limit complexity, block dangerous patterns, enforce read-only operations

### Literals

- **Numeric Literals**: Integers and floating-point numbers
- **Boolean Literals**: `true` and `false`
- **String Literals**: String values with quotes (single or double)
- **Array Literals**: Arrays with `[]` syntax

### Arithmetic Operators

- **Binary Operations**:
  - Addition (`+`) - also works for string concatenation
  - Subtraction (`-`)
  - Multiplication (`*`)
  - Division (`/`)
  - Modulo (`%`)
  - Exponentiation (`**`)
- **Unary Operations**:
  - Unary plus (`+`)
  - Unary minus (`-`)
- **Update Operations**:
  - Increment (`++`) - prefix and postfix
  - Decrement (`--`) - prefix and postfix
- **Operator Precedence**: Respects standard JavaScript operator precedence
- **Parentheses**: Support for grouping expressions

### Comparison Operators

- Strict equality (`===`)
- Strict inequality (`!==`)
- Less than (`<`)
- Less than or equal (`<=`)
- Greater than (`>`)
- Greater than or equal (`>=`)
- Works with numbers, strings, and booleans

### Logical Operators

- Logical AND (`&&`) with short-circuit evaluation
- Logical OR (`||`) with short-circuit evaluation
- Logical NOT (`!`)

### Ternary Operator

- Conditional expression: `condition ? valueIfTrue : valueIfFalse`
- Short-circuit evaluation (only evaluates chosen branch)
- Supports nesting: `a ? (b ? x : y) : z`
- Works in all contexts (variables, functions, loops, etc.)

### typeof Operator

- Returns a string indicating the type of a value
- Supported types: `"number"`, `"string"`, `"boolean"`, `"function"`, `"object"`, `"undefined"`
- Special handling: Does not throw on undefined variables (returns `"undefined"`)
- Works with all JavaScript values including functions, arrays, and objects

### Variables

- **Variable Declarations**:
  - `let` - block-scoped, reassignable
  - `const` - block-scoped, immutable
  - `var` - function-scoped, allows re-declaration
- **Variable Assignment**: Reassigning `let` and `var` variables
- **Variable References**: Using variables in expressions
- **Block Scoping**: `let`/`const` are properly block-scoped in `{ }` blocks
- **Function Scoping**: `var` is function-scoped (hoists to nearest function or global scope)
- **Variable Shadowing**: Inner scopes can shadow outer variables
- **Scope Chain**: Inner blocks can access variables from outer scopes
- **Re-declaration**: `var` allows re-declaration, `let`/`const` do not
- **Error Handling**: Prevents redeclaration (for let/const), undefined variable access, and const reassignment

### Control Flow

- **if Statements**: Execute code conditionally
- **if...else Statements**: Choose between two branches
- **if...else if...else Chains**: Multiple conditional branches
- **Nested Conditionals**: if statements inside other if statements
- **while Loops**: Repeat code while condition is true
- **for Loops**: C-style for loops with init, test, and update
- **Nested Loops**: Both while and for loops can be nested
- **break Statement**: Exit a loop early (or exit switch)
- **continue Statement**: Skip to the next iteration of a loop
- **Block Statements**: Group multiple statements with `{ }`
- **Loop Scoping**: For loop variables are scoped to the loop
- **for...of Loops**: Iterate over array elements with `for (let item of array)`
- **for...in Loops**: Iterate over object property names with `for (let key in obj)`
- **const in loops**: Supports `const` loop variables (new scope per iteration)
- **switch Statements**: Multi-way branching with case matching
- **Fall-through**: Switch cases without break fall through to next case
- **Default case**: Catch-all case when no other cases match

### Functions

- **Function Declarations**: Define named functions with parameters
- **Arrow Functions**: Concise function syntax with expression or block body
- **Function Calls**: Call functions with arguments
- **Return Statements**: Return values from functions
- **Closures**: Functions capture their defining environment
- **Recursion**: Functions can call themselves
- **Higher-Order Functions**: Functions can be passed as values and called
- **Expression Body**: Arrow functions with implicit return (`x => x * 2`)
- **Block Body**: Arrow functions with explicit return (`x => { return x * 2; }`)
- **Generator Functions**: `function*` syntax with `yield` expressions
- **Async Generator Functions**: `async function*` for async iteration
- **Iterator Protocol**: Generator `next()`, `return()`, and `throw()` methods
- **Generator State Management**: Proper state tracking (suspended-start, suspended-yield, executing, completed)
- **Yields in Control Flow**: Yields work correctly inside for, while, do-while loops and conditionals

Generator example:

```javascript
function* counter() {
  yield 1;
  yield 2;
  yield 3;
}

const g = counter();
g.next().value; // 1
g.next().value; // 2
g.next().value; // 3
g.next().done; // true
```

### Strings

- **String Literals**: Single or double quoted strings
- **String Concatenation**: Using the `+` operator
- **String Comparison**: All comparison operators work with strings
- **String Length**: Access `.length` property
- **String Methods**: Comprehensive string method support
  - **Extraction methods**: `substring()`, `slice()`, `charAt()`
  - **Search methods**: `indexOf()`, `lastIndexOf()`, `includes()`
  - **Matching methods**: `startsWith()`, `endsWith()`
  - **Case methods**: `toUpperCase()`, `toLowerCase()`
  - **Trimming methods**: `trim()`, `trimStart()`, `trimEnd()`
  - **Transformation methods**: `split()`, `replace()`, `repeat()`
  - **Padding methods**: `padStart()`, `padEnd()`
  - **Method chaining**: Methods return strings that can be chained (e.g., `str.trim().toLowerCase().split(",")`)

### Arrays

- **Array Literals**: Create arrays with `[1, 2, 3]` syntax
- **Array Indexing**: Access elements with `arr[0]` syntax
- **Array Assignment**: Modify elements with `arr[i] = value`
- **Array Length**: Access `.length` property
- **Nested Arrays**: Multi-dimensional arrays supported
- **Reference Semantics**: Arrays are passed by reference
- **Array Methods**: Comprehensive array method support
  - **Mutation methods**: `push()`, `pop()`, `shift()`, `unshift()`, `reverse()`
  - **Non-mutation methods**: `slice()`, `concat()`, `indexOf()`, `includes()`, `join()`
  - **Higher-order methods**: `map()`, `filter()`, `reduce()`, `find()`, `findIndex()`, `every()`, `some()`
  - **Method chaining**: Methods return values that can be chained (e.g., `arr.map().filter().reduce()`)

### Objects

- **Object Literals**: Create objects with `{ key: value }` syntax
- **Property Access**: Dot notation (`obj.prop`) and bracket notation (`obj["prop"]`)
- **Property Assignment**: Add or modify properties (`obj.prop = value`)
- **Nested Objects**: Objects can contain other objects
- **Mixed Values**: Properties can be any type (numbers, strings, booleans, arrays, objects)
- **Reference Semantics**: Objects are passed by reference
- **Computed Properties**: Access properties dynamically (`obj[key]`)
- **Object Methods**: Functions as object properties with proper `this` binding
- **`this` Keyword**: Access object context in methods

## Usage

```typescript
import { Interpreter } from "./interpreter";

const interpreter = new Interpreter();

// Injected Globals - Constructor
const interpreterWithGlobals = new Interpreter({
  globals: {
    PI: 3.14159,
    E: 2.71828,
    MAX_VALUE: 1000,
  },
});
interpreterWithGlobals.evaluate("PI * 2"); // 6.28318
interpreterWithGlobals.evaluate("let radius = 5; PI * radius * radius"); // 78.53975

// Injected Globals - Per-call
interpreter.evaluate("x + y", { globals: { x: 10, y: 20 } }); // 30

// Injected Globals - Merged
const mergedInterpreter = new Interpreter({ globals: { x: 10 } });
mergedInterpreter.evaluate("x + y", { globals: { y: 5 } }); // 15

// Injected Globals - Objects
const configInterpreter = new Interpreter({
  globals: { config: { debug: true, maxRetries: 3 } },
});
configInterpreter.evaluate("config.maxRetries"); // 3

// Host Functions - Call functions from host environment
const interpreterWithFunctions = new Interpreter({
  globals: {
    double: (x: number) => x * 2,
    log: (msg: string) => console.log(msg),
    random: () => Math.random(),
  },
});
interpreterWithFunctions.evaluate("double(5)"); // 10
interpreterWithFunctions.evaluate('log("Hello from sandbox!")'); // Logs to console
interpreterWithFunctions.evaluate(`
  let value = double(random() * 100);
  log("Random doubled: " + value);
`);

// Host Functions - Per-call
interpreter.evaluate("calculate(10, 5)", {
  globals: {
    calculate: (a: number, b: number) => a + b,
  },
}); // 15

// AST Validator - Constructor
const noLoopsValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') && !code.includes('"ForStatement"');
};
const safeInterpreter = new Interpreter({ validator: noLoopsValidator });
safeInterpreter.evaluate("5 + 10"); // 15
safeInterpreter.evaluate("while (true) {}"); // Error: AST validation failed

// AST Validator - Per-call
const readOnlyValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"VariableDeclaration"');
};
interpreter.evaluate("10 + 20"); // 30 (no validator)
interpreter.evaluate("10 + 20", { validator: readOnlyValidator }); // 30 (allowed)
interpreter.evaluate("let x = 5", { validator: readOnlyValidator }); // Error

// AST Validator - Limit program size
const sizeValidator = (ast) => ast.body.length <= 3;
const limitedInterpreter = new Interpreter({ validator: sizeValidator });
limitedInterpreter.evaluate("let x = 1; let y = 2; x + y"); // 3 (allowed)
limitedInterpreter.evaluate("let a=1; let b=2; let c=3; let d=4;"); // Error

// Arithmetic
interpreter.evaluate("2 + 3"); // 5
interpreter.evaluate("2 ** 8"); // 256

// Variables
interpreter.evaluate("let x = 10"); // 10
interpreter.evaluate("const PI = 3.14"); // 3.14
interpreter.evaluate("x = x + 5"); // 15

// Strings
interpreter.evaluate('"Hello" + " " + "World"'); // "Hello World"
interpreter.evaluate('"Hello".length'); // 5

// String methods - extraction
interpreter.evaluate('"Hello World".substring(0, 5)'); // "Hello"
interpreter.evaluate('"Hello World".slice(6)'); // "World"
interpreter.evaluate('"Hello".charAt(0)'); // "H"

// String methods - search
interpreter.evaluate('"Hello World".indexOf("o")'); // 4
interpreter.evaluate('"Hello World".lastIndexOf("o")'); // 7
interpreter.evaluate('"Hello World".includes("World")'); // true

// String methods - matching
interpreter.evaluate('"Hello World".startsWith("Hello")'); // true
interpreter.evaluate('"Hello World".endsWith("World")'); // true

// String methods - case
interpreter.evaluate('"hello".toUpperCase()'); // "HELLO"
interpreter.evaluate('"HELLO".toLowerCase()'); // "hello"

// String methods - trimming
interpreter.evaluate('"  hello  ".trim()'); // "hello"
interpreter.evaluate('"  hello  ".trimStart()'); // "hello  "

// String methods - transformation
interpreter.evaluate('"a,b,c".split(",")'); // ["a", "b", "c"]
interpreter.evaluate('"hello world".replace("world", "there")'); // "hello there"
interpreter.evaluate('"abc".repeat(3)'); // "abcabcabc"

// String methods - padding
interpreter.evaluate('"5".padStart(3, "0")'); // "005"
interpreter.evaluate('"5".padEnd(3, "0")'); // "500"

// String method chaining
interpreter.evaluate('"  Hello World  ".trim().toLowerCase().replace("world", "there")'); // "hello there"

// Arrays
interpreter.evaluate("[1, 2, 3][1]"); // 2
interpreter.evaluate("let arr = [10, 20, 30]; arr.length"); // 3

// Array methods - mutation
interpreter.evaluate("let arr = [1, 2, 3]; arr.push(4); arr"); // [1, 2, 3, 4]
interpreter.evaluate("let arr = [1, 2, 3]; arr.pop()"); // 3
interpreter.evaluate("let arr = [1, 2, 3]; arr.shift()"); // 1
interpreter.evaluate("let arr = [1, 2, 3]; arr.unshift(0); arr"); // [0, 1, 2, 3]

// Array methods - non-mutation
interpreter.evaluate("[1, 2, 3, 4, 5].slice(1, 3)"); // [2, 3]
interpreter.evaluate("[1, 2].concat([3, 4])"); // [1, 2, 3, 4]
interpreter.evaluate("[1, 2, 3].indexOf(2)"); // 1
interpreter.evaluate("[1, 2, 3].includes(2)"); // true
interpreter.evaluate('[1, 2, 3].join("-")'); // "1-2-3"

// Array methods - higher-order
interpreter.evaluate("[1, 2, 3, 4].map(x => x * 2)"); // [2, 4, 6, 8]
interpreter.evaluate("[1, 2, 3, 4].filter(x => x > 2)"); // [3, 4]
interpreter.evaluate("[1, 2, 3, 4].reduce((acc, x) => acc + x, 0)"); // 10
interpreter.evaluate("[1, 2, 3, 4].find(x => x > 2)"); // 3
interpreter.evaluate("[1, 2, 3, 4].every(x => x > 0)"); // true
interpreter.evaluate("[1, 2, 3, 4].some(x => x > 3)"); // true

// Array method chaining
interpreter.evaluate(
  "[1, 2, 3, 4].map(x => x * 2).filter(x => x > 4).reduce((acc, x) => acc + x, 0)",
); // 14

// Objects
interpreter.evaluate("let obj = { x: 10, y: 20 }; obj.x"); // 10
interpreter.evaluate('let person = { name: "Alice", age: 30 }; person.name'); // "Alice"

// Comparisons and Logic
interpreter.evaluate("5 > 3"); // true
interpreter.evaluate("true && false"); // false

// Ternary operator
interpreter.evaluate("let age = 20");
interpreter.evaluate('age >= 18 ? "adult" : "minor"'); // "adult"
interpreter.evaluate("let max = 10 > 5 ? 10 : 5"); // 10

// typeof operator
interpreter.evaluate("typeof 42"); // "number"
interpreter.evaluate('typeof "hello"'); // "string"
interpreter.evaluate("typeof true"); // "boolean"
interpreter.evaluate("typeof undefinedVar"); // "undefined" (no error!)
interpreter.evaluate("let x = 10; typeof x"); // "number"
interpreter.evaluate("typeof [1, 2, 3]"); // "object"
interpreter.evaluate("function add(a, b) { return a + b; } typeof add"); // "function"

// Conditionals
interpreter.evaluate(`
  let x = 10;
  if (x > 5) {
    x = x * 2;
  } else {
    x = x + 1;
  }
  x
`); // 20

// While loops
interpreter.evaluate(`
  let i = 0;
  let sum = 0;
  while (i < 10) {
    sum = sum + i;
    i = i + 1;
  }
  sum
`); // 45

// For loops
interpreter.evaluate(`
  let sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + i;
  }
  sum
`); // 55

// Break statement
interpreter.evaluate(`
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    if (i === 5) {
      break;
    }
    sum = sum + i;
  }
  sum
`); // 10 (0+1+2+3+4)

// Continue statement
interpreter.evaluate(`
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
      continue;
    }
    sum = sum + i;
  }
  sum
`); // 25 (1+3+5+7+9)

// for...of loops
interpreter.evaluate(`
  let arr = [1, 2, 3, 4, 5];
  let sum = 0;
  for (let num of arr) {
    sum = sum + num;
  }
  sum
`); // 15

interpreter.evaluate(`
  let words = ["hello", "world"];
  let result = "";
  for (const word of words) {
    result = result + word + " ";
  }
  result
`); // "hello world "

// for...in loops
interpreter.evaluate(`
  let obj = { x: 10, y: 20, z: 30 };
  let sum = 0;
  for (let key in obj) {
    sum = sum + obj[key];
  }
  sum
`); // 60

interpreter.evaluate(`
  let person = { name: "Alice", age: 30, city: "NYC" };
  let keys = [];
  for (const key in person) {
    keys[keys.length] = key;
  }
  keys
`); // ["name", "age", "city"]

// switch statements
interpreter.evaluate(`
  let day = 2;
  let dayName = "";
  switch (day) {
    case 0:
      dayName = "Sunday";
      break;
    case 1:
      dayName = "Monday";
      break;
    case 2:
      dayName = "Tuesday";
      break;
    default:
      dayName = "Unknown";
  }
  dayName
`); // "Tuesday"

// Fall-through in switch
interpreter.evaluate(`
  let grade = "B";
  let message = "";
  switch (grade) {
    case "A":
    case "B":
      message = "Good job!";
      break;
    case "C":
      message = "You passed";
      break;
    default:
      message = "Try harder";
  }
  message
`); // "Good job!"

// Update operators
interpreter.evaluate(`
  let x = 5;
  let a = x++;  // a = 5, x = 6
  let b = ++x;  // x = 7, b = 7
  b
`); // 7

// Functions
interpreter.evaluate(`
  function double(x) {
    return x * 2;
  }
  double(21)
`); // 42

// Arrow functions (expression body)
interpreter.evaluate(`
  let triple = x => x * 3;
  triple(7)
`); // 21

// Arrow functions (block body)
interpreter.evaluate(`
  let factorial = n => {
    let result = 1;
    for (let i = 1; i <= n; i++) {
      result = result * i;
    }
    return result;
  };
  factorial(5)
`); // 120

// Recursive Factorial
interpreter.evaluate(`
  function factorial(n) {
    if (n <= 1) {
      return 1;
    }
    return n * factorial(n - 1);
  }
  factorial(5)
`); // 120

// Closures
interpreter.evaluate(`
  function makeCounter() {
    let count = 0;
    function increment() {
      count = count + 1;
      return count;
    }
    return increment;
  }
  let counter = makeCounter();
  counter(); // 1
  counter(); // 2
  counter()  // 3
`); // 3

// Higher-order functions with arrow functions
interpreter.evaluate(`
  function map(arr, f) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      result[i] = f(arr[i]);
    }
    return result;
  }
  let nums = [1, 2, 3, 4];
  let squared = map(nums, x => x * x);
  squared[2]
`); // 9

// Arrays with loops
interpreter.evaluate(`
  let arr = [1, 2, 3, 4, 5];
  let sum = 0;
  let i = 0;
  while (i < arr.length) {
    sum = sum + arr[i];
    i = i + 1;
  }
  sum
`); // 15

// Array operations
interpreter.evaluate(`
  function findMax(arr) {
    let max = arr[0];
    let i = 1;
    while (i < arr.length) {
      if (arr[i] > max) {
        max = arr[i];
      }
      i = i + 1;
    }
    return max;
  }
  findMax([3, 7, 2, 9, 1])
`); // 9

// Object operations
interpreter.evaluate(`
  let person = {
    name: "Alice",
    address: {
      city: "NYC",
      zip: 10001
    }
  };
  person.address.city
`); // "NYC"

interpreter.evaluate(`
  function distance(p1, p2) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  }
  distance({ x: 0, y: 0 }, { x: 3, y: 4 })
`); // 25

// Object methods with 'this'
interpreter.evaluate(`
  let counter = {
    count: 0,
    increment: function() {
      this.count = this.count + 1;
      return this.count;
    },
    getCount: function() {
      return this.count;
    }
  };
  counter.increment();
  counter.increment();
  counter.getCount()
`); // 2

// Object methods with parameters
interpreter.evaluate(`
  let rect = {
    width: 10,
    height: 5,
    area: function() {
      return this.width * this.height;
    },
    scale: function(factor) {
      this.width = this.width * factor;
      this.height = this.height * factor;
      return this;
    }
  };
  rect.scale(2);
  rect.area()
`); // 200
```

## Running

```bash
# Run the demo
bun run index.ts

# Run tests
bun test
```

## Dependencies

This project has **zero runtime dependencies**. The parser is implemented in `src/ast.ts`.

## Architecture

The interpreter works by:

1. **Parsing**: Uses the built-in zero-dependency parser in `src/ast.ts` to parse JavaScript into an ESTree-compatible AST
2. **Evaluation**: Walks the AST recursively, evaluating each node
3. **Environment**: Maintains variable scope with proper `let`/`const` semantics and closures
4. **Control Flow**: Evaluates conditions and loops, executing appropriate branches
5. **Return Values**: Propagates return statements through control structures
6. **Short-circuit Evaluation**: Logical operators properly short-circuit
7. **Security**: Only supports a whitelisted subset of operations

## Error Handling

The interpreter throws `InterpreterError` for:

- Unsupported operations or node types
- Division by zero / Modulo by zero
- Undefined variable access
- Variable redeclaration
- Assignment to const variables
- Assignment to undefined variables
- Invalid function calls
- Invalid array operations
- Invalid syntax (via the built-in parser's ParseError)
- Security violations (accessing `__proto__`, `constructor`, etc.)

## Testing

Comprehensive test suite with **1150 tests** across 28 files:

**Arithmetic Tests (43 tests)**:

- All supported operators
- Edge cases (division by zero, empty programs)
- Complex nested expressions
- Operator precedence

**Variable Tests (39 tests)**:

- `let` and `const` declarations
- Variable assignment and reassignment
- Const immutability enforcement
- Undefined variable detection
- Duplicate declaration prevention

**Comparison & Logical Tests (67 tests)**:

- All comparison operators
- All logical operators
- Short-circuit evaluation
- Complex logical expressions
- Boolean literals and operations

**Conditional Tests (41 tests)**:

- Basic if statements
- if...else statements
- if...else if...else chains
- Nested conditionals
- Practical patterns

**Loop Tests (37 tests)**:

- Basic while loops
- Counter and accumulator patterns
- Loops with conditionals
- Nested loops (2 and 3 levels deep)
- Complex boolean conditions
- Practical algorithms (factorial, fibonacci, GCD, etc.)

**For Loop Tests (47 tests)**:

- Basic for loops with increment/decrement
- For loop scoping and variable shadowing
- Nested for loops (2 and 3 levels deep)
- For loops with conditionals
- For loops with arrays
- For loops with functions and early returns
- Update expressions (++, --) prefix and postfix
- Practical algorithms (primes, matrices, etc.)

**Scoping Tests (36 tests)**:

- Basic block scoping
- Nested blocks and shadowing
- Block scoping with conditionals
- Block scoping with loops
- Const in blocks
- Complex scoping scenarios

**Function Tests (49 tests)**:

- Function declarations
- Function calls with arguments
- Return statements
- Recursion (factorial, fibonacci)
- Closures and environment capture
- Functions with loops and conditionals
- Higher-order function patterns
- Multiple function declarations

**String Tests (53 tests)**:

- String literals
- String concatenation
- String comparison
- String length property
- Strings in variables and functions
- Mixed string operations

**Array Tests (48 tests)**:

- Array literals and creation
- Array indexing and access
- Array length property
- Array element assignment
- Arrays in loops and functions
- Array operations (find max, reverse, etc.)
- Nested arrays (2D matrices)
- Reference semantics
- Edge cases and error handling

**Object Tests (44 tests)**:

- Object literals with various property types
- Property access (dot and bracket notation)
- Property assignment and modification
- Nested objects
- Objects with functions
- Objects in loops
- Arrays of objects
- Reference semantics
- Complex object operations
- Edge cases

**Break and Continue Tests (33 tests)**:

- Break in while loops
- Continue in while loops
- Break in for loops
- Continue in for loops
- Nested loops with break
- Nested loops with continue
- Break and continue with arrays
- Break and continue with objects
- Break and continue in functions
- Complex patterns and edge cases

**Arrow Function Tests (32 tests)**:

- Expression body arrow functions
- Block body arrow functions
- Closures with arrow functions
- Arrow functions as parameters
- Returning arrow functions
- Arrow functions with objects and arrays
- Higher-order functions (map, filter, reduce)
- Recursion with arrow functions
- Function composition
- Edge cases and complex patterns

**Object Methods and This Tests (25 tests)**:

- Basic object methods with `this` keyword
- Methods modifying object properties
- Methods with parameters
- Nested objects with methods
- Methods calling other methods
- Methods with loops and conditionals
- Array of objects with methods
- Methods returning objects
- Complex method patterns (counter, rectangle, shopping cart)
- Recursive methods with object state
- Computed property access in methods
- Edge cases with `this` binding

**Injected Globals Tests (51 tests)**:

- Constructor globals - basic access and immutability
- Constructor globals - objects, arrays, booleans, strings
- Constructor globals - modifying properties
- evaluate() options globals - per-call injection
- Merge behavior - constructor + evaluate() globals
- Merge behavior - evaluate() overrides constructor globals
- Stateful behavior - globals persist across calls
- User variable protection - user variables take precedence
- Edge cases - undefined, null, zero, empty string, negative numbers
- Practical use cases - math constants, configuration objects, data processing

**AST Validator Tests (18 tests)**:

- Constructor validator - validation applied to all code
- Per-call validator - validation for specific calls only
- Validator precedence - per-call overrides constructor
- Practical validators - restrict loops, read-only operations, limit complexity
- Validator with globals - combined functionality
- Error cases - clear error messages, exception handling

**Security Tests (49 tests)**:

- Prototype pollution prevention - blocks `__proto__` access/assignment
- Constructor access prevention - blocks `constructor` property
- Prototype property blocking - blocks `prototype` property
- Legacy method blocking - blocks `__defineGetter__`, `__defineSetter__`, etc.
- Host function protection - property access blocking, async function blocking
- Complex attack scenarios - nested objects, loops, function returns
- Safe operations verification - normal properties still work

**Host Function Tests (37 tests)**:

- Calling sync host functions with various argument types
- Returning various types from host functions (objects, arrays, primitives)
- Host functions with closures and data structures
- Error handling from host functions
- Per-call host function globals
- Property access blocking on host functions
- Async host function blocking in sync mode
- Edge cases and mixed host/sandbox functions

**Async Tests (42 tests)**:

- Calling async host functions with evaluateAsync()
- Awaiting async host function results
- Async functions with various argument and return types
- Error handling in async host functions
- Nested async host function calls
- Sync host functions in async mode (evaluateAsync)
- Mixed sync and async host functions
- Basic async operations (arithmetic, variables, objects, arrays)
- Async control flow (if/else, while loops, for loops)
- Async sandbox functions (regular and arrow functions)
- Per-call globals in async mode
- Complex async scenarios

**Async/Await Syntax Tests (26 tests)**:

- Async function declarations
- Async function expressions
- Async arrow functions (expression and block body)
- Await expressions with async host functions
- Await expressions with async sandbox functions
- Nested async/await calls
- Await in control flow (if/else, for loops, while loops)
- Mixed sync and async functions
- Error handling (calling async in sync mode)
- Async function closures
- Async function return values

**Security Tests (22 tests)**:

- Host function protection (blocking property access, blocking await on host functions)
- Sandbox function security in async context
- Prototype pollution prevention (`__proto__`, `constructor`, `prototype`)
- Built-in object access blocking (Promise, Function, eval, globalThis)
- Environment isolation between interpreter instances
- Error handling and propagation in async contexts
- State management and const immutability
- Closure security across async boundaries

**Ternary Operator Tests (34 tests)**:

- Basic ternary expressions (true/false conditions, numbers, strings)
- Ternary with variables (in condition, in branches, assignment)
- Nested ternary expressions (in consequent, in alternate, multiple levels)
- Ternary with expressions (arithmetic, function calls, complex conditions)
- Ternary with objects and arrays (returning, property access)
- Falsy values handling (0, empty string, null, undefined, truthy values)
- Ternary in return statements (functions, arrow functions)
- Ternary in loops (for loops, while conditions)
- Async ternary expressions (evaluateAsync, async host functions, await in branches)
- Edge cases (short-circuit evaluation, function arguments, array/object literals)

**typeof Operator Tests (40 tests)**:

- Primitive types (number, string, boolean, null, undefined)
- Complex types (objects, arrays, functions)
- With variables (declared and undefined)
- With expressions (arithmetic, comparisons, ternary)
- With function calls (sandbox and host functions)
- In control flow (if/else, for loops, while loops)
- In return statements (functions, arrow functions)
- Type guards (runtime type checking patterns)
- Async support (evaluateAsync, typeof in async context)
- Edge cases (undefined variables don't throw, functions return "function", nested typeof)

**for...of Loop Tests (37 tests)**:

- Basic for...of iteration (with let and const)
- for...of with existing variables
- Iterating over arrays of objects
- Nested for...of loops (2D arrays, flattening)
- for...of with break (early exit, finding elements)
- for...of with continue (filtering, skipping)
- for...of in functions (regular and arrow functions, early return)
- for...of scoping (variable shadowing, outer scope access)
- for...of with conditionals (if/else in body, nested conditionals)
- Building and filtering arrays with for...of
- Async for...of (evaluateAsync, async host functions, nested async loops)
- Error cases (non-array iterables, null, objects)
- Edge cases (null values, mixed types, function call results)

**for...in Loop Tests (32 tests)**:

- Basic for...in with objects (iterating keys, accessing values)
- for...in with arrays (iterating indices as strings)
- for...in with break and continue
- for...in in functions (regular and arrow functions, early return)
- Nested for...in loops (nested objects, cross-product iteration)
- for...in scoping (let/const scoping, outer scope access)
- for...in with conditionals (filtering properties, if/else in body)
- for...in with array methods (building arrays with push)
- for...in with string methods (building strings from keys)
- Mixed for...in and for...of (objects containing arrays)
- Async for...in (evaluateAsync, async host functions)
- Edge cases (empty objects/arrays, null/undefined, primitives, numeric keys)

**Switch Statement Tests (36 tests)**:

- Basic switch (single case match, string cases, strict equality, booleans)
- Default case (at end, beginning, middle positions)
- Fall-through behavior (no break, multiple statements, fall to default, grouped cases)
- Switch with expressions (discriminant expressions, case expressions, function calls)
- Switch in functions (inside functions, early return, return without break)
- Switch with variables (assignments in cases, outer scope access)
- Switch with arrays and objects (array elements, object properties, modifying arrays)
- Nested switches (nested switch statements, break in nested switch)
- Switch in loops (inside for loop, inside while loop)
- Error cases (continue in switch throws parser error)
- Async switch (evaluateAsync, async host functions, async operations in cases)
- Edge cases (empty switch, only default, null case, computed case values)

**Array Methods Tests (57 tests)**:

- Mutation methods (push, pop, shift, unshift, reverse)
- Non-mutation methods (slice, concat, indexOf, includes, join)
- Higher-order methods (map, filter, reduce, find, findIndex, every, some)
- Methods with callbacks (arrow functions, regular functions, index/array parameters)
- Method chaining (map().filter().reduce(), multiple chains)
- Async array methods (async host functions in callbacks, evaluateAsync support)
- Edge cases (empty arrays, undefined values, not found results)
- Return values and side effects (proper mutation behavior, return types)

**String Methods Tests (76 tests)**:

- Extraction methods (substring, slice, charAt with various indices)
- Search methods (indexOf, lastIndexOf, includes with positions)
- Matching methods (startsWith, endsWith with positions)
- Case methods (toUpperCase, toLowerCase, immutability)
- Trimming methods (trim, trimStart, trimEnd with whitespace variations)
- Transformation methods (split with separators/limits, replace, repeat)
- Padding methods (padStart, padEnd with custom strings)
- Method chaining (multiple string methods chained together)
- Integration with functions and loops (string methods in various contexts)
- Async string methods (evaluateAsync support)
- Edge cases (empty strings, not found results, out of bounds)

Run tests with `bun test`.

## Implementation Details

### Environment System

Variables are stored in an `Environment` class with full lexical scoping:

- Tracks variable names, values, and kinds (`let` or `const`)
- Tracks whether variables are injected globals (for override protection)
- Enforces const immutability
- Prevents redeclaration within same scope
- **Block Scoping**: Each `{ }` block creates a new child environment
- **Scope Chain**: Child environments can access parent scope variables
- **Variable Shadowing**: Inner scopes can declare variables with same name as outer scope
- **Closures**: Functions capture their defining environment
- **`this` Context**: Stores and propagates `this` value through environment chain
- **Injected Globals**: Pre-populates root environment with host-provided values

### Function System

Functions are first-class values with closure support:

- **FunctionValue**: Stores parameters, body, and closure environment
- **Closure Capture**: Functions capture environment at declaration time
- **Call Evaluation**: Creates new environment with parameter bindings
- **Return Propagation**: Returns exit through control structures cleanly
- **Method Calls**: Detects method calls (`obj.method()`) and binds `this` to the object
- **`this` Binding**: Method calls pass the object as `this` context to the function

### Control Flow

- **Conditionals**: Evaluate test expression, execute appropriate branch
- **While Loops**: Re-evaluate condition before each iteration, execute body while truthy
- **For Loops**: Create new scope, evaluate init/test/update, execute body
- **Break/Continue**: BreakValue and ContinueValue markers propagate through control structures
- **Returns**: ReturnValue wrapper propagates through blocks, loops, and conditionals

### Injected Globals System

The interpreter supports injecting global variables from the host environment:

- **Constructor Injection**: Globals passed to `new Interpreter({ globals: { ... } })` are injected into the root environment and persist
- **Per-call Injection**: Globals passed to `evaluate(code, { globals: { ... } })` are injected before execution and cleaned up after
- **Merge Strategy**: Per-call globals can temporarily override constructor globals (but not user variables)
- **Cleanup**: Per-call globals are removed after execution; overridden constructor globals are restored to original values
- **Immutability**: All globals are declared as `const` to prevent reassignment
- **User Protection**: The `forceSet()` method checks if a variable is marked as a global before allowing override
- **Stateful Constructor Globals**: Constructor globals persist in the environment for all subsequent calls
- **Stateless Per-call Globals**: Per-call globals do not persist - they're cleaned up via `removePerCallGlobals()`

### Global Objects via ReadOnlyProxy

All injected globals are automatically wrapped with `ReadOnlyProxy` for security and consistency:

**Features:**

- **Automatic Function Wrapping**: Functions are automatically wrapped as `HostFunctionValue` (both top-level and methods)
- **Async Function Detection**: Async functions are detected and wrapped with `isAsync: true` flag
- **Property Access Protection**: Blocks dangerous properties (`__proto__`, `constructor`, `prototype`)
- **Strict Read-Only**: ALL properties on global objects are read-only and cannot be modified
- **Recursive Wrapping**: Nested objects are recursively wrapped for consistent protection
- **Method Binding**: Preserves `this` context when calling methods on wrapped objects

**Supported Global Objects:**

```javascript
const interpreter = new Interpreter({
  globals: {
    Math, // Math.floor(4.7), Math.PI, Math.random()
    console, // console.log("hello")
    customAPI: {
      // Your own objects with methods
      getValue() {
        return 42;
      },
    },
  },
});

interpreter.evaluate("Math.floor(4.7)"); // 4
interpreter.evaluate("Math.PI * 2"); // 6.283...
```

**Property Modification Rules:**

- **All properties are read-only**: No property modifications allowed on ANY global object
- **Applies universally**: Both built-in constants (`Math.PI`) and user objects (`obj.count`) are protected
- **Recursive protection**: Nested objects are automatically wrapped, so `config.level1.level2.value = x` is blocked
- **Array elements protected**: Cannot modify array elements (e.g., `arr[0] = 10` throws error)
- **Enforcement**: Read-only status is enforced by the proxy, not by the underlying object's property descriptors
- **Security-first**: Prevents any mutation of global objects at any depth, ensuring consistent and predictable behavior

### AST Validation System

The interpreter supports custom AST validation for security policies:

- **Validator Function Type**: `(ast: ESTree.Program) => boolean`
- **Constructor Validator**: Stored and applied to every `evaluate()` call
- **Per-call Validator**: Takes precedence over constructor validator when provided
- **Validation Timing**: Runs after parsing but before evaluation
- **Error Handling**: Returns false or throws to reject code
- **Use Cases**: Block dangerous patterns, enforce complexity limits, restrict language features
- **Example Validators**: No loops, read-only code, limited AST depth, statement count limits

### Short-Circuit Evaluation

Logical operators implement proper short-circuit behavior:

- `&&`: Returns first falsy value or last value if all truthy
- `||`: Returns first truthy value or last value if all falsy

### Supported AST Nodes

- `Program`
- `ExpressionStatement`
- `Literal` (numbers, booleans, strings)
- `Identifier`
- `ThisExpression`
- `BinaryExpression` (arithmetic and comparison)
- `UnaryExpression` (arithmetic and logical)
- `UpdateExpression` (`++`, `--`)
- `LogicalExpression` (`&&`, `||`)
- `AssignmentExpression` (variables, array elements, object properties)
- `VariableDeclaration` (`let`, `const`)
- `BlockStatement`
- `IfStatement`
- `WhileStatement`
- `ForStatement`
- `ForOfStatement`
- `ForInStatement`
- `SwitchStatement`
- `SwitchCase`
- `BreakStatement`
- `ContinueStatement`
- `FunctionDeclaration`
- `FunctionExpression`
- `ArrowFunctionExpression`
- `CallExpression` (with method call detection for `this` binding)
- `ReturnStatement`
- `MemberExpression` (property access, array indexing, computed properties)
- `ArrayExpression`
- `ObjectExpression`

## Practical Examples

The interpreter can execute real algorithms:

```javascript
// Recursive Factorial
function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
factorial(6); // 720

// Recursive Fibonacci
function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
fib(10); // 55

// GCD (Euclidean algorithm)
function gcd(a, b) {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
}
gcd(48, 18); // 6

// isPrime checker (with for loop)
function isPrime(n) {
  if (n <= 1) {
    return 0;
  }
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      return 0;
    }
  }
  return 1;
}
isPrime(17); // 1 (true)

// Sum array elements (with for loop)
function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum = sum + arr[i];
  }
  return sum;
}
sumArray([10, 20, 30, 40]); // 100

// Factorial (iterative with for loop)
function factorial(n) {
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result = result * i;
  }
  return result;
}
factorial(6); // 720

// Find maximum in array
function findMax(arr) {
  if (arr.length === 0) {
    return 0;
  }
  let max = arr[0];
  let i = 1;
  while (i < arr.length) {
    if (arr[i] > max) {
      max = arr[i];
    }
    i = i + 1;
  }
  return max;
}
findMax([3, 7, 2, 9, 1, 5]); // 9

// Reverse array
function reverse(arr) {
  let result = [];
  let i = arr.length - 1;
  while (i >= 0) {
    result[arr.length - 1 - i] = arr[i];
    i = i - 1;
  }
  return result;
}
reverse([1, 2, 3, 4, 5]); // [5, 4, 3, 2, 1]

// Counter with closure
let counter = 0;
function increment() {
  counter = counter + 1;
  return counter;
}
increment(); // 1
increment(); // 2
increment(); // 3

// Higher-order functions with arrow functions
function map(arr, f) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    result[i] = f(arr[i]);
  }
  return result;
}
let nums = [1, 2, 3, 4];
let squared = map(nums, (x) => x * x);
squared; // [1, 4, 9, 16]

// Filter with arrow function
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
let numbers = [1, 2, 3, 4, 5, 6];
let evens = filter(numbers, (n) => n % 2 === 0);
evens; // [2, 4, 6]

// Point distance calculation
function distance(p1, p2) {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}
let point1 = { x: 0, y: 0 };
let point2 = { x: 3, y: 4 };
distance(point1, point2); // 25

// Array of objects
let people = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
  { name: "Charlie", age: 35 },
];
let totalAge = 0;
for (let i = 0; i < people.length; i++) {
  totalAge = totalAge + people[i].age;
}
totalAge; // 90

// Array of objects with for...of
let users = [
  { name: "Alice", active: true },
  { name: "Bob", active: false },
  { name: "Charlie", active: true },
];
let activeCount = 0;
for (let user of users) {
  if (user.active) {
    activeCount = activeCount + 1;
  }
}
activeCount; // 2

// Nested objects
let user = {
  name: "John",
  address: {
    city: "NYC",
    zip: 10001,
  },
  scores: [85, 90, 95],
};
user.address.city; // "NYC"
user.scores[1]; // 90

// Object methods with 'this'
let cart = {
  items: [],
  total: 0,
  addItem: function (price) {
    let len = this.items.length;
    this.items[len] = price;
    this.total = this.total + price;
    return this.total;
  },
  getTotal: function () {
    return this.total;
  },
};
cart.addItem(10);
cart.addItem(25);
cart.getTotal(); // 35

// Methods calling other methods
let calculator = {
  value: 0,
  add: function (n) {
    this.value = this.value + n;
    return this;
  },
  multiply: function (n) {
    this.value = this.value * n;
    return this;
  },
  getValue: function () {
    return this.value;
  },
};
calculator.add(5).multiply(3).getValue(); // 15
```

### Async/Await Support

The interpreter supports **async host functions** through the `evaluateAsync()` method, which returns a `Promise`:

```typescript
// Async host functions - using evaluateAsync()
const asyncInterpreter = new Interpreter({
  globals: {
    fetchData: async (id: number) => {
      // Simulate async operation
      return await someAsyncAPI(id);
    },
    asyncDouble: async (x: number) => x * 2,
  },
});

// Call async host functions (must use evaluateAsync)
await asyncInterpreter.evaluateAsync("fetchData(42)"); // Returns promise
await asyncInterpreter.evaluateAsync("asyncDouble(5) + asyncDouble(10)"); // 30

// Mixing sync and async host functions
const mixedInterpreter = new Interpreter({
  globals: {
    syncAdd: (a: number, b: number) => a + b, // sync function
    asyncMultiply: async (a: number, b: number) => a * b, // async function
  },
});
await mixedInterpreter.evaluateAsync("asyncMultiply(syncAdd(2, 3), 10)"); // 50

// Async functions in control flow
await asyncInterpreter.evaluateAsync(`
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    sum = sum + asyncDouble(i);
  }
  sum
`); // 20 (0+2+4+6+8)

// Async functions in conditionals
await asyncInterpreter.evaluateAsync(`
  let result;
  if (asyncDouble(5) > 8) {
    result = "greater";
  } else {
    result = "not greater";
  }
  result
`); // "greater"

// Complex async operations
const userInterpreter = new Interpreter({
  globals: {
    asyncGetUser: async (id: number) => ({
      id,
      name: `User${id}`,
      active: true,
    }),
  },
});
await userInterpreter.evaluateAsync(`
  let user = asyncGetUser(123);
  user.name
`); // "User123"
```

**Async/Await Syntax in Sandbox Code:**

The interpreter now supports `async` function declarations and `await` expressions in sandbox code:

```typescript
// Async function declarations
const interpreter = new Interpreter();
await interpreter.evaluateAsync(`
  async function fetchData() {
    return { name: "Alice", age: 30 };
  }
  
  async function getUsername() {
    let data = await fetchData();
    return data.name;
  }
  
  getUsername()
`); // "Alice"

// Async arrow functions
await interpreter.evaluateAsync(`
  let asyncDouble = async (x) => x * 2;
  let asyncProcess = async (x) => {
    let doubled = await asyncDouble(x);
    return doubled + 10;
  };
  asyncProcess(5)
`); // 20

// Await in control flow
await interpreter.evaluateAsync(`
  async function sum() {
    let total = 0;
    for (let i = 0; i < 5; i++) {
      total = total + (await asyncDouble(i));
    }
    return total;
  }
  sum()
`);

// Mixing async sandbox functions with async host functions
const mixedInterpreter = new Interpreter({
  globals: {
    asyncFetch: async (id: number) => `Data${id}`,
  },
});
await mixedInterpreter.evaluateAsync(`
  async function processData(id) {
    let data = await asyncFetch(id);
    return data + " processed";
  }
  processData(999)
`); // "Data999 processed"
```

**Important Notes:**

- **Sync mode** (`evaluate()`): Cannot call async functions or use await. Throws error if you try.
- **Async mode** (`evaluateAsync()`): Supports both sync AND async functions, `async`/`await` syntax. Returns a Promise.
- **Async functions**: Can be declared with `async function`, `async () =>`, or `async function() {}` syntax.
- **Await expressions**: Can only be used inside async functions (standard JavaScript behavior).
- **All operations await**: In async mode, ALL operations are awaited, ensuring proper execution order.

## Turing Completeness

This interpreter is **Turing complete** because it has:

1. **Conditional branching** (if/else statements)
2. **Arbitrary memory** (variables can store any values)
3. **Unbounded loops** (while loops + recursion)

This means it can theoretically compute any computable function, given enough time and memory.

## Limitations

- **No labeled statements**: Labeled break/continue not supported
- **No instanceof**: instanceof operator not supported
- **No try/catch**: Error handling not supported
- **No spread/rest operators**: Not supported
- **No destructuring**: Not supported
- **No arrow functions as methods**: Use function expressions for object methods

## Future Extensions

Potential additions:

- Labeled statements (labeled break/continue)
- Math object (Math.floor, Math.ceil, Math.random, etc.)
- instanceof operator
- Template literals
- Rest/spread operators
- Classes and constructors
- Prototypes
