# Super

## What it is

The `super` keyword for calling parent class methods and constructors in class inheritance.

## Interpreter implementation

- Parsed as `Super` node and handled in `evaluateSuper` / `evaluateSuperAsync`.
- `super` binding is tracked via `currentSuperBinding` on the interpreter.
- Used in member access (`super.prop`), computed access (`super[expr]`), and calls (`super()`).
- Enforces that `super()` is called before `this` access in derived class constructors.

## Gotchas

- `super` can only be used inside class methods and constructors.
- `super()` must be called before accessing `this` in a derived class constructor.
- `super.prop` and `super[expr]` access parent class properties.
- Private fields cannot be accessed via `super`.

## Examples

### super() in constructor

```javascript
class Parent {
  constructor(value) {
    this.value = value;
  }
}

class Child extends Parent {
  constructor(value) {
    super(value * 2);
  }
}
```

### super.method()

```javascript
class Parent {
  greet() {
    return 'Hello';
  }
}

class Child extends Parent {
  greet() {
    return super.greet() + ', World!';
  }
}
```

## Availability

This feature is automatically available when `Classes` is enabled (ES2015+).
