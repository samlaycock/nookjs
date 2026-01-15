# JavaScript Interpreter

A simple, secure JavaScript interpreter built with TypeScript and Meriyah AST parser. This interpreter evaluates a subset of JavaScript, supporting mathematical operations, variables, boolean logic, control flow, functions, strings, and arrays.

## Features

Currently supports:

### Injected Globals

The interpreter supports injecting global variables from the host environment:

- **Constructor Globals**: Pass globals when creating the interpreter - available for all `evaluate()` calls and persist across invocations
- **Per-call Globals**: Pass globals as options to individual `evaluate()` calls - available ONLY for that single execution, then cleaned up
- **Merged Globals**: Constructor and per-call globals are merged during execution, with per-call taking precedence
- **Temporary Override**: Per-call globals can temporarily override constructor globals, but the original values are restored after execution
- **Immutable**: Globals are declared as `const` and cannot be reassigned by interpreted code
- **User Variable Protection**: User-declared variables take precedence over late-injected globals

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

### Variables
- **Variable Declarations**: `let` and `const` (with proper immutability)
- **Variable Assignment**: Reassigning `let` variables
- **Variable References**: Using variables in expressions
- **Block Scoping**: Full lexical scoping - variables in `{ }` blocks are properly scoped
- **Variable Shadowing**: Inner scopes can shadow outer variables
- **Scope Chain**: Inner blocks can access variables from outer scopes
- **Error Handling**: Prevents redeclaration, undefined variable access, and const reassignment

Note: `var` is not supported for simplicity and security.

### Control Flow
- **if Statements**: Execute code conditionally
- **if...else Statements**: Choose between two branches
- **if...else if...else Chains**: Multiple conditional branches
- **Nested Conditionals**: if statements inside other if statements
- **while Loops**: Repeat code while condition is true
- **for Loops**: C-style for loops with init, test, and update
- **Nested Loops**: Both while and for loops can be nested
- **break Statement**: Exit a loop early
- **continue Statement**: Skip to the next iteration of a loop
- **Block Statements**: Group multiple statements with `{ }`
- **Loop Scoping**: For loop variables are scoped to the loop

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

### Strings
- **String Literals**: Single or double quoted strings
- **String Concatenation**: Using the `+` operator
- **String Comparison**: All comparison operators work with strings
- **String Length**: Access `.length` property

### Arrays
- **Array Literals**: Create arrays with `[1, 2, 3]` syntax
- **Array Indexing**: Access elements with `arr[0]` syntax
- **Array Assignment**: Modify elements with `arr[i] = value`
- **Array Length**: Access `.length` property
- **Nested Arrays**: Multi-dimensional arrays supported
- **Reference Semantics**: Arrays are passed by reference

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
import { Interpreter } from './interpreter';

const interpreter = new Interpreter();

// Injected Globals - Constructor
const interpreterWithGlobals = new Interpreter({
  PI: 3.14159,
  E: 2.71828,
  MAX_VALUE: 1000
});
interpreterWithGlobals.evaluate('PI * 2');  // 6.28318
interpreterWithGlobals.evaluate('let radius = 5; PI * radius * radius'); // 78.53975

// Injected Globals - Per-call
interpreter.evaluate('x + y', { globals: { x: 10, y: 20 } }); // 30

// Injected Globals - Merged
const mergedInterpreter = new Interpreter({ x: 10 });
mergedInterpreter.evaluate('x + y', { globals: { y: 5 } }); // 15

// Injected Globals - Objects
const configInterpreter = new Interpreter({
  globals: {config: { debug: true, maxRetries: 3 }}
});
configInterpreter.evaluate('config.maxRetries'); // 3

// AST Validator - Constructor
const noLoopsValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"WhileStatement"') && !code.includes('"ForStatement"');
};
const safeInterpreter = new Interpreter({ validator: noLoopsValidator });
safeInterpreter.evaluate('5 + 10'); // 15
safeInterpreter.evaluate('while (true) {}'); // Error: AST validation failed

// AST Validator - Per-call
const readOnlyValidator = (ast) => {
  const code = JSON.stringify(ast);
  return !code.includes('"VariableDeclaration"');
};
interpreter.evaluate('10 + 20'); // 30 (no validator)
interpreter.evaluate('10 + 20', { validator: readOnlyValidator }); // 30 (allowed)
interpreter.evaluate('let x = 5', { validator: readOnlyValidator }); // Error

// AST Validator - Limit program size
const sizeValidator = (ast) => ast.body.length <= 3;
const limitedInterpreter = new Interpreter({ validator: sizeValidator });
limitedInterpreter.evaluate('let x = 1; let y = 2; x + y'); // 3 (allowed)
limitedInterpreter.evaluate('let a=1; let b=2; let c=3; let d=4;'); // Error

// Arithmetic
interpreter.evaluate('2 + 3');           // 5
interpreter.evaluate('2 ** 8');          // 256

// Variables
interpreter.evaluate('let x = 10');      // 10
interpreter.evaluate('const PI = 3.14'); // 3.14
interpreter.evaluate('x = x + 5');       // 15

// Strings
interpreter.evaluate('"Hello" + " " + "World"'); // "Hello World"
interpreter.evaluate('"Hello".length');           // 5

// Arrays
interpreter.evaluate('[1, 2, 3][1]');            // 2
interpreter.evaluate('let arr = [10, 20, 30]; arr.length'); // 3

// Objects
interpreter.evaluate('let obj = { x: 10, y: 20 }; obj.x'); // 10
interpreter.evaluate('let person = { name: "Alice", age: 30 }; person.name'); // "Alice"

// Comparisons and Logic
interpreter.evaluate('5 > 3');           // true
interpreter.evaluate('true && false');   // false

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

## Architecture

The interpreter works by:

1. **Parsing**: Uses Meriyah to parse JavaScript code into an AST
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
- Invalid syntax (via Meriyah's ParseError)

## Testing

Comprehensive test suite with **663 tests** across 16 files:

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
- **Constructor Injection**: Globals passed to `new Interpreter({ ... })` are injected into the root environment and persist
- **Per-call Injection**: Globals passed to `evaluate(code, { globals: { ... } })` are injected before execution and cleaned up after
- **Merge Strategy**: Per-call globals can temporarily override constructor globals (but not user variables)
- **Cleanup**: Per-call globals are removed after execution; overridden constructor globals are restored to original values
- **Immutability**: All globals are declared as `const` to prevent reassignment
- **User Protection**: The `forceSet()` method checks if a variable is marked as a global before allowing override
- **Stateful Constructor Globals**: Constructor globals persist in the environment for all subsequent calls
- **Stateless Per-call Globals**: Per-call globals do not persist - they're cleaned up via `removePerCallGlobals()`

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
let squared = map(nums, x => x * x);
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
let evens = filter(numbers, n => n % 2 === 0);
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
  { name: "Charlie", age: 35 }
];
let totalAge = 0;
for (let i = 0; i < people.length; i++) {
  totalAge = totalAge + people[i].age;
}
totalAge; // 90

// Nested objects
let user = {
  name: "John",
  address: {
    city: "NYC",
    zip: 10001
  },
  scores: [85, 90, 95]
};
user.address.city; // "NYC"
user.scores[1]; // 90

// Object methods with 'this'
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
  }
};
cart.addItem(10);
cart.addItem(25);
cart.getTotal(); // 35

// Methods calling other methods
let calculator = {
  value: 0,
  add: function(n) {
    this.value = this.value + n;
    return this;
  },
  multiply: function(n) {
    this.value = this.value * n;
    return this;
  },
  getValue: function() {
    return this.value;
  }
};
calculator.add(5).multiply(3).getValue(); // 15
```

## Turing Completeness

This interpreter is **Turing complete** because it has:
1. **Conditional branching** (if/else statements)
2. **Arbitrary memory** (variables can store any values)
3. **Unbounded loops** (while loops + recursion)

This means it can theoretically compute any computable function, given enough time and memory.

## Limitations

- **No labeled statements**: Labeled break/continue not supported
- **No typeof/instanceof**: Type checking operators not supported
- **No ternary operator**: Use if/else instead
- **No try/catch**: Error handling not supported
- **No spread/rest operators**: Not supported
- **No destructuring**: Not supported
- **No arrow functions as methods**: Use function expressions for object methods

## Future Extensions

Potential additions:
- Labeled statements (labeled break/continue)
- for...of and for...in loops
- More array methods (push, pop, shift, unshift, slice, etc.)
- String methods (substring, indexOf, etc.)
- typeof operator
- Ternary operator
- Template literals
- Rest/spread operators
- Classes and constructors
- Prototypes
