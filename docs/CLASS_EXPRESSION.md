# ClassExpression

## What it is

Class expressions that define anonymous or named classes: `const MyClass = class { ... }`.

## Interpreter implementation

- Parsed as `ClassExpression` and handled in `evaluateClassExpression` / `evaluateClassExpressionAsync`.
- Creates a `ClassValue` similar to class declarations.
- Supports optional identifier binding.
- Merged with class declaration implementation via `buildClassValue`.

## Gotchas

- The class name in a class expression is only visible inside the class body.
- Class expressions can be named or anonymous.
- Referenced the same way as class declarations.

## Examples

```javascript
// Anonymous class expression
const MyClass = class {
  constructor(value) {
    this.value = value;
  }
};

// Named class expression
const NamedClass = class MyInnerClass {
  constructor() {
    // MyInnerClass is accessible here
  }
};

// Using the class
const instance = new MyClass(42);
instance instanceof MyClass; // true
```

## Relationship to Classes

Class expressions and class declarations share the same implementation. See [CLASSES](CLASSES.md) for full details on class features including:

- Constructor methods
- Instance and static methods (including getters/setters)
- Instance and static fields
- Private fields and methods
- Static initialization blocks
- `extends` inheritance
- `super` keyword usage

## Availability

Class expressions are available when `Classes` feature is enabled (ES2015+).
