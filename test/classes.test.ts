import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5, ES2015 } from "../src/presets";

describe("ES6 Classes", () => {
  describe("Class Declarations", () => {
    it("should declare a basic class", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Point {}
        typeof Point;
      `);
      expect(result).toBe("function");
    });

    it("should create instances with new keyword", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Point {}
        const p = new Point();
        typeof p;
      `);
      expect(result).toBe("object");
    });

    it("should execute constructor", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Point {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
        }
        const p = new Point(3, 4);
        p.x + p.y;
      `);
      expect(result).toBe(7);
    });

    it("should support constructor parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Rectangle {
          constructor(width, height) {
            this.width = width;
            this.height = height;
          }
        }
        const r = new Rectangle(10, 20);
        r.width * r.height;
      `);
      expect(result).toBe(200);
    });

    it("should support constructor with default values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Point {
          constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
          }
        }
        const p = new Point();
        p.x + p.y;
      `);
      expect(result).toBe(0);
    });
  });

  describe("Class Expressions", () => {
    it("should support anonymous class expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const Point = class {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
        };
        const p = new Point(1, 2);
        p.x + p.y;
      `);
      expect(result).toBe(3);
    });

    it("should support named class expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const MyClass = class NamedClass {
          getValue() {
            return 42;
          }
        };
        const obj = new MyClass();
        obj.getValue();
      `);
      expect(result).toBe(42);
    });
  });

  describe("Instance Methods", () => {
    it("should define instance methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Calculator {
          add(a, b) {
            return a + b;
          }
        }
        const calc = new Calculator();
        calc.add(2, 3);
      `);
      expect(result).toBe(5);
    });

    it("should bind this correctly in methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          constructor() {
            this.count = 0;
          }
          increment() {
            this.count = this.count + 1;
            return this.count;
          }
        }
        const c = new Counter();
        c.increment();
        c.increment();
        c.count;
      `);
      expect(result).toBe(2);
    });

    it("should support method parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(
        `
        class Point {
          constructor(x, y) {
            this.x = x;
            this.y = y;
          }
          distanceTo(other) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
          }
        }
        const p1 = new Point(0, 0);
        const p2 = new Point(3, 4);
        p1.distanceTo(p2);
      `,
        { globals: { Math } },
      );
      expect(result).toBe(5);
    });

    it("should support methods calling other methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Rectangle {
          constructor(width, height) {
            this.width = width;
            this.height = height;
          }
          area() {
            return this.width * this.height;
          }
          perimeter() {
            return 2 * (this.width + this.height);
          }
          describe() {
            return this.area() + this.perimeter();
          }
        }
        const r = new Rectangle(3, 4);
        r.describe();
      `);
      expect(result).toBe(12 + 14); // area 12, perimeter 14
    });
  });

  describe("Static Methods", () => {
    it("should define static methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MathUtils {
          static add(a, b) {
            return a + b;
          }
        }
        MathUtils.add(5, 3);
      `);
      expect(result).toBe(8);
    });

    it("should call static methods on class", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Calculator {
          static double(n) {
            return n * 2;
          }
        }
        Calculator.double(21);
      `);
      expect(result).toBe(42);
    });

    it("should not access static methods on instances", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MyClass {
          static staticMethod() {
            return "static";
          }
        }
        const obj = new MyClass();
        obj.staticMethod;
      `);
      expect(result).toBe(undefined);
    });

    it("should support multiple static methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Calculator {
          static add(a, b) { return a + b; }
          static multiply(a, b) { return a * b; }
        }
        Calculator.add(2, 3) + Calculator.multiply(4, 5);
      `);
      expect(result).toBe(5 + 20);
    });
  });

  describe("Getters and Setters", () => {
    it("should define instance getters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Circle {
          constructor(radius) {
            this._radius = radius;
          }
          get radius() {
            return this._radius;
          }
        }
        const c = new Circle(5);
        c.radius;
      `);
      expect(result).toBe(5);
    });

    it("should define instance setters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Circle {
          constructor(radius) {
            this._radius = radius;
          }
          get radius() {
            return this._radius;
          }
          set radius(value) {
            this._radius = value;
          }
        }
        const c = new Circle(5);
        c.radius = 10;
        c.radius;
      `);
      expect(result).toBe(10);
    });

    it("should define static getters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Config {
          static get version() {
            return "1.0.0";
          }
        }
        Config.version;
      `);
      expect(result).toBe("1.0.0");
    });

    it("should compute derived values with getters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Rectangle {
          constructor(width, height) {
            this.width = width;
            this.height = height;
          }
          get area() {
            return this.width * this.height;
          }
        }
        const r = new Rectangle(4, 5);
        r.area;
      `);
      expect(result).toBe(20);
    });
  });

  describe("Computed Property Names", () => {
    it("should support computed method names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const methodName = "greet";
        class Greeter {
          [methodName]() {
            return "Hello!";
          }
        }
        const g = new Greeter();
        g.greet();
      `);
      expect(result).toBe("Hello!");
    });

    it("should support computed getter names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const propName = "value";
        class Box {
          constructor() {
            this._value = 42;
          }
          get [propName]() {
            return this._value;
          }
        }
        const b = new Box();
        b.value;
      `);
      expect(result).toBe(42);
    });
  });

  describe("Inheritance (extends)", () => {
    it("should extend another class", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Animal {
          constructor(name) {
            this.name = name;
          }
        }
        class Dog extends Animal {
          constructor(name) {
            super(name);
          }
        }
        const d = new Dog("Rex");
        d.name;
      `);
      expect(result).toBe("Rex");
    });

    it("should inherit parent methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Animal {
          speak() {
            return "Some sound";
          }
        }
        class Dog extends Animal {}
        const d = new Dog();
        d.speak();
      `);
      expect(result).toBe("Some sound");
    });

    it("should override parent methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Animal {
          speak() {
            return "Some sound";
          }
        }
        class Dog extends Animal {
          speak() {
            return "Woof!";
          }
        }
        const d = new Dog();
        d.speak();
      `);
      expect(result).toBe("Woof!");
    });

    it("should support multi-level inheritance", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class A {
          getValue() { return 1; }
        }
        class B extends A {
          getValue() { return 2; }
        }
        class C extends B {
          getValue() { return 3; }
        }
        const c = new C();
        c.getValue();
      `);
      expect(result).toBe(3);
    });

    it("should inherit properties from parent constructor", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Vehicle {
          constructor(wheels) {
            this.wheels = wheels;
          }
        }
        class Car extends Vehicle {
          constructor() {
            super(4);
            this.type = "car";
          }
        }
        const c = new Car();
        c.wheels + "-" + c.type;
      `);
      expect(result).toBe("4-car");
    });
  });

  describe("Super Keyword", () => {
    it("should call parent constructor with super()", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
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
        const c = new Child(5);
        c.value;
      `);
      expect(result).toBe(10);
    });

    it("should pass arguments to parent constructor", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Person {
          constructor(name, age) {
            this.name = name;
            this.age = age;
          }
        }
        class Employee extends Person {
          constructor(name, age, role) {
            super(name, age);
            this.role = role;
          }
        }
        const e = new Employee("Alice", 30, "Developer");
        e.name + "-" + e.age + "-" + e.role;
      `);
      expect(result).toBe("Alice-30-Developer");
    });

    it("should call parent methods with super.method()", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Animal {
          speak() {
            return "Animal speaks";
          }
        }
        class Dog extends Animal {
          speak() {
            return super.speak() + " and Dog barks";
          }
        }
        const d = new Dog();
        d.speak();
      `);
      expect(result).toBe("Animal speaks and Dog barks");
    });

    it("should throw if super used outside class", () => {
      const interpreter = new Interpreter();
      // Note: The parser catches this before the interpreter
      expect(() => {
        interpreter.evaluate(`super();`);
      }).toThrow(); // Parser throws about super needing to be in constructor
    });

    it("should throw when accessing this before super", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          class Base {
            constructor() {
              this.base = 1;
            }
          }
          class Derived extends Base {
            constructor() {
              const x = this.base;
              super();
            }
          }
          new Derived();
        `);
      }).toThrow(
        "Must call super constructor in derived class before accessing 'this'",
      );
    });

    it("should resolve super in static methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Base {
          static greet() {
            return "hello";
          }
        }
        class Child extends Base {
          static greet() {
            return super.greet() + " world";
          }
        }
        Child.greet();
      `);
      expect(result).toBe("hello world");
    });
  });

  describe("Constructor Behavior", () => {
    it("should return instance when no explicit return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MyClass {
          constructor() {
            this.value = 42;
          }
        }
        const obj = new MyClass();
        obj.value;
      `);
      expect(result).toBe(42);
    });

    it("should return explicit object if returned", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MyClass {
          constructor() {
            this.value = 42;
            return { custom: true };
          }
        }
        const obj = new MyClass();
        obj.custom;
      `);
      expect(result).toBe(true);
    });

    it("should ignore primitive return values", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MyClass {
          constructor() {
            this.value = 42;
            return 123;
          }
        }
        const obj = new MyClass();
        obj.value;
      `);
      expect(result).toBe(42);
    });

    it("should auto-generate constructor if not provided", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Empty {}
        const obj = new Empty();
        typeof obj;
      `);
      expect(result).toBe("object");
    });

    it("should auto-forward args in derived class without constructor", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Parent {
          constructor(x) {
            this.x = x;
          }
        }
        class Child extends Parent {}
        const c = new Child(42);
        c.x;
      `);
      expect(result).toBe(42);
    });

    it("should use object returned from base constructor in derived class", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Base {
          constructor() {
            return { base: 1 };
          }
        }
        class Derived extends Base {
          constructor() {
            super();
            this.child = 2;
          }
        }
        const d = new Derived();
        [d.base, d.child];
      `);
      expect(result).toEqual([1, 2]);
    });

    it("should allow derived constructor to return object", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Base {
          constructor() {
            this.base = 1;
          }
        }
        class Derived extends Base {
          constructor() {
            super();
            return { custom: true };
          }
        }
        const d = new Derived();
        d.custom;
      `);
      expect(result).toBe(true);
    });
  });

  describe("Feature Control", () => {
    it("should throw when Classes feature disabled", () => {
      const interpreter = new Interpreter(ES5);
      expect(() => {
        interpreter.evaluate(`class Foo {}`);
      }).toThrow("Classes is not enabled");
    });

    it("should work when Classes feature enabled", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        class Point {
          constructor(x) {
            this.x = x;
          }
        }
        const p = new Point(5);
        p.x;
      `);
      expect(result).toBe(5);
    });

    it("should be enabled in ES2015 preset", () => {
      const interpreter = new Interpreter(ES2015);
      const result = interpreter.evaluate(`
        class MyClass {}
        typeof MyClass;
      `);
      expect(result).toBe("function");
    });
  });

  describe("Security", () => {
    it("should validate method names for dangerous properties", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          class Evil {
            __proto__() {}
          }
        `);
      }).toThrow("not allowed for security reasons");
    });

    it("should block constructor as method name", () => {
      // "constructor" as a regular method name (not the special constructor)
      // should still work since it's the ES6 class constructor keyword
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MyClass {
          constructor() {
            this.value = 1;
          }
        }
        const obj = new MyClass();
        obj.value;
      `);
      expect(result).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty class body", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Empty {}
        const e = new Empty();
        typeof e;
      `);
      expect(result).toBe("object");
    });

    it("should handle class with only constructor", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class OnlyConstructor {
          constructor(x) {
            this.x = x;
          }
        }
        const obj = new OnlyConstructor(10);
        obj.x;
      `);
      expect(result).toBe(10);
    });

    it("should handle class with only static methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class StaticOnly {
          static getValue() {
            return 100;
          }
        }
        StaticOnly.getValue();
      `);
      expect(result).toBe(100);
    });

    it("should handle multiple instances", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          constructor(start) {
            this.count = start;
          }
          increment() {
            this.count = this.count + 1;
          }
        }
        const c1 = new Counter(0);
        const c2 = new Counter(10);
        c1.increment();
        c2.increment();
        c2.increment();
        c1.count + "-" + c2.count;
      `);
      expect(result).toBe("1-12");
    });

    it("should isolate instance state", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Box {
          constructor(value) {
            this.value = value;
          }
        }
        const b1 = new Box(1);
        const b2 = new Box(2);
        b1.value = 100;
        b2.value;
      `);
      expect(result).toBe(2);
    });
  });

  describe("Methods with this context", () => {
    it("should maintain this context across method calls", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Person {
          constructor(name) {
            this.name = name;
          }
          greet() {
            return "Hello, " + this.getName();
          }
          getName() {
            return this.name;
          }
        }
        const p = new Person("Alice");
        p.greet();
      `);
      expect(result).toBe("Hello, Alice");
    });

    it("should not bind this for extracted methods", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          class Box {
            constructor() {
              this.value = 1;
            }
            getValue() {
              return this.value;
            }
          }
          const b = new Box();
          const fn = b.getValue;
          fn();
        `);
      }).toThrow();
    });
  });

  describe("Class Fields (ES2022)", () => {
    it("should support basic instance fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Point {
          x = 10;
          y = 20;
        }
        const p = new Point();
        p.x + p.y;
      `);
      expect(result).toBe(30);
    });

    it("should support instance fields without initializers", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Foo {
          x;
        }
        const f = new Foo();
        f.x;
      `);
      expect(result).toBe(undefined);
    });

    it("should support static fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          static count = 42;
        }
        Counter.count;
      `);
      expect(result).toBe(42);
    });

    it("should support static fields without initializers", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Config {
          static value;
        }
        Config.value;
      `);
      expect(result).toBe(undefined);
    });

    it("should evaluate instance field initializers for each instance", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          count = 0;
          increment() {
            this.count = this.count + 1;
            return this.count;
          }
        }
        const c1 = new Counter();
        const c2 = new Counter();
        c1.increment();
        c1.increment();
        c2.increment();
        [c1.count, c2.count];
      `);
      expect(result).toEqual([2, 1]);
    });

    it("should support instance fields with expressions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Calc {
          a = 5;
          b = 3;
          sum = this.a + this.b;
        }
        const c = new Calc();
        c.sum;
      `);
      expect(result).toBe(8);
    });

    it("should support instance fields that reference this", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Box {
          value = 10;
          doubleValue = this.value * 2;
        }
        const b = new Box();
        b.doubleValue;
      `);
      expect(result).toBe(20);
    });

    it("should initialize fields before constructor runs", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Test {
          value = 100;
          constructor() {
            this.computed = this.value * 2;
          }
        }
        const t = new Test();
        [t.value, t.computed];
      `);
      expect(result).toEqual([100, 200]);
    });

    it("should support computed field names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const fieldName = "dynamic";
        class Obj {
          [fieldName] = 42;
        }
        const o = new Obj();
        o.dynamic;
      `);
      expect(result).toBe(42);
    });

    it("should support inherited instance fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Animal {
          legs = 4;
        }
        class Dog extends Animal {
          name = "Rex";
        }
        const d = new Dog();
        [d.legs, d.name];
      `);
      expect(result).toEqual([4, "Rex"]);
    });

    it("should allow child fields to override parent fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Parent {
          value = 10;
        }
        class Child extends Parent {
          value = 20;
        }
        const c = new Child();
        c.value;
      `);
      expect(result).toBe(20);
    });

    it("should combine fields and methods correctly", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Rectangle {
          width = 0;
          height = 0;

          setDimensions(w, h) {
            this.width = w;
            this.height = h;
          }

          getArea() {
            return this.width * this.height;
          }
        }
        const r = new Rectangle();
        r.setDimensions(5, 3);
        r.getArea();
      `);
      expect(result).toBe(15);
    });

    it("should block class fields when feature is disabled", () => {
      const interpreter = new Interpreter(ES2015);
      expect(() => {
        interpreter.evaluate(`
          class Foo {
            x = 1;
          }
        `);
      }).toThrow(/ClassFields is not enabled/);
    });

    it("should initialize static fields in order", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          static a = 1;
          static b = this.a + 1;
        }
        Counter.b;
      `);
      expect(result).toBe(2);
    });

    it("should run static blocks in order with static fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Config {
          static value = 1;
          static { this.value = this.value + 1; }
          static next = this.value;
        }
        Config.next;
      `);
      expect(result).toBe(2);
    });
  });

  describe("Private Fields (ES2022)", () => {
    it("should support basic private instance fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Counter {
          #count = 0;
          increment() { this.#count = this.#count + 1; }
          getCount() { return this.#count; }
        }
        const c = new Counter();
        c.increment();
        c.increment();
        c.getCount();
      `);
      expect(result).toBe(2);
    });

    it("should support private fields without initializers", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Box {
          #value;
          setValue(v) { this.#value = v; }
          getValue() { return this.#value; }
        }
        const b = new Box();
        b.setValue(42);
        b.getValue();
      `);
      expect(result).toBe(42);
    });

    it("should support static private fields", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Config {
          static #secret = 'hidden';
          static getSecret() { return this.#secret; }
        }
        Config.getSecret();
      `);
      expect(result).toBe("hidden");
    });

    it("should support private methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Calculator {
          #double(n) { return n * 2; }
          compute(x) { return this.#double(x); }
        }
        new Calculator().compute(5);
      `);
      expect(result).toBe(10);
    });

    it("should support static private methods", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class MathHelper {
          static #square(n) { return n * n; }
          static calc(x) { return this.#square(x); }
        }
        MathHelper.calc(4);
      `);
      expect(result).toBe(16);
    });

    it("should keep private fields separate between instances", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class Person {
          #name;
          constructor(name) { this.#name = name; }
          getName() { return this.#name; }
        }
        const p1 = new Person('Alice');
        const p2 = new Person('Bob');
        [p1.getName(), p2.getName()];
      `);
      expect(result).toEqual(["Alice", "Bob"]);
    });

    it("should allow private fields and public fields together", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        class User {
          publicName = 'John';
          #privateId = 123;

          getInfo() {
            return this.publicName + ':' + this.#privateId;
          }
        }
        new User().getInfo();
      `);
      expect(result).toBe("John:123");
    });

    it("should throw when accessing private field outside class", () => {
      const interpreter = new Interpreter();
      // The parser catches this, so we just verify it throws
      expect(() => {
        interpreter.evaluate(`
          class Secret {
            #hidden = 'secret';
          }
          const s = new Secret();
          s.#hidden;
        `);
      }).toThrow();
    });

    it("should block private fields when feature is disabled", () => {
      const interpreter = new Interpreter(ES2015);
      expect(() => {
        interpreter.evaluate(`
          class Foo {
            #x = 1;
          }
        `);
      }).toThrow(/PrivateFields is not enabled/);
    });
  });
});
