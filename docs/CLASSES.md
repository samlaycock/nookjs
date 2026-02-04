# Classes

## What it is

ES6 class declarations and expressions for object-oriented programming.

## Interpreter implementation

- Implemented via `ClassValue` plus `buildClassValue` / `instantiateClass`.
- Methods are stored on class metadata (no JS prototype chain).
- `super` resolution walks the class chain explicitly.

## Class Declarations

```javascript
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  get area() {
    return this.width * this.height;
  }

  static createSquare(size) {
    return new Rectangle(size, size);
  }
}
```

## Class Expressions

Class expressions are also supported:

```javascript
const MyClass = class {
  constructor(value) {
    this.value = value;
  }
};

const instance = new MyClass(42);
```

See [CLASS_EXPRESSION](CLASS_EXPRESSION.md) for more details on class expressions.

## Gotchas

- No native JS prototype chain; `instanceof` is implemented via interpreter metadata.
- Class constructors cannot be called without `new`.
- Some standard class reflection is unavailable.
- Class expression names are only visible inside the class body.
