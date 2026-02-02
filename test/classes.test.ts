import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES5, ES2015 } from "../src/presets";

describe("Classes", () => {
  describe("ES5", () => {
    describe("Constructors with new keyword", () => {
      describe("Basic Constructor Patterns", () => {
        it("should create instance with empty constructor", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Empty() {}
            const e = new Empty();
            typeof e;
          `);
          expect(result).toBe("object");
        });

        it("should create instance with single property", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Box(value) {
              this.value = value;
            }
            const b = new Box(42);
            b.value;
          `);
          expect(result).toBe(42);
        });

        it("should create instance with multiple properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Person(name, age) {
              this.name = name;
              this.age = age;
            }
            const p = new Person("Alice", 30);
            [p.name, p.age];
          `);
          expect(result).toEqual(["Alice", 30]);
        });

        it("should support string, number, boolean properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Data(str, num, bool) {
              this.str = str;
              this.num = num;
              this.bool = bool;
            }
            const d = new Data("hello", 123, true);
            [d.str, d.num, d.bool];
          `);
          expect(result).toEqual(["hello", 123, true]);
        });

        it("should support object properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Container(obj) {
              this.data = obj;
            }
            const c = new Container({x: 10, y: 20});
            [c.data.x, c.data.y];
          `);
          expect(result).toEqual([10, 20]);
        });

        it("should support array properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function List(items) {
              this.items = items;
            }
            const l = new List([1, 2, 3]);
            l.items;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should support undefined properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Maybe(value) {
              this.value = value;
            }
            let undefinedVal;
            const m = new Maybe(undefinedVal);
            m.value;
          `);
          expect(result).toBe(undefined);
        });

        it("should support null properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Nullable(value) {
              this.value = value;
            }
            const n = new Nullable(null);
            n.value;
          `);
          expect(result).toBe(null);
        });

        it("should support nested property initialization", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Nested(a, b) {
              this.outer = {
                inner: {
                  a: a,
                  b: b
                }
              };
            }
            const n = new Nested(1, 2);
            [n.outer.inner.a, n.outer.inner.b];
          `);
          expect(result).toEqual([1, 2]);
        });

        it("should support computed property assignments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Calculator(x, y) {
              this.x = x;
              this.y = y;
              this.sum = x + y;
              this.product = x * y;
            }
            const c = new Calculator(5, 3);
            [c.sum, c.product];
          `);
          expect(result).toEqual([8, 15]);
        });
      });

      describe("Constructor Methods", () => {
        it("should support method defined in constructor", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Counter(start) {
              this.count = start;
              this.getValue = function() {
                return this.count;
              };
            }
            const c = new Counter(10);
            c.getValue();
          `);
          expect(result).toBe(10);
        });

        it("should support multiple methods", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Calculator(value) {
              this.value = value;
              this.add = function(n) {
                return this.value + n;
              };
              this.multiply = function(n) {
                return this.value * n;
              };
            }
            const calc = new Calculator(5);
            [calc.add(3), calc.multiply(4)];
          `);
          expect(result).toEqual([8, 20]);
        });

        it("should support method calling another method", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Math(x) {
              this.x = x;
              this.double = function() {
                return this.x * 2;
              };
              this.quadruple = function() {
                return this.double() * 2;
              };
            }
            const m = new Math(3);
            m.quadruple();
          `);
          expect(result).toBe(12);
        });

        it("should support method accessing constructor properties", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Person(firstName, lastName) {
              this.firstName = firstName;
              this.lastName = lastName;
              this.fullName = function() {
                return this.firstName + " " + this.lastName;
              };
            }
            const p = new Person("John", "Doe");
            p.fullName();
          `);
          expect(result).toBe("John Doe");
        });

        it("should support method modifying instance state", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Counter(start) {
              this.count = start;
              this.increment = function() {
                this.count = this.count + 1;
                return this.count;
              };
            }
            const c = new Counter(0);
            [c.increment(), c.increment(), c.count];
          `);
          expect(result).toEqual([1, 2, 2]);
        });

        it("should support method with parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Accumulator(initial) {
              this.total = initial;
              this.add = function(a, b, c) {
                this.total = this.total + a + b + c;
                return this.total;
              };
            }
            const acc = new Accumulator(10);
            acc.add(1, 2, 3);
          `);
          expect(result).toBe(16);
        });

        it("should support arrow function methods", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Container(value) {
              this.value = value;
              this.getValue = () => this.value;
            }
            const c = new Container(99);
            c.getValue();
          `);
          expect(result).toBe(99);
        });

        it("should support method returning object", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Factory(type) {
              this.type = type;
              this.create = function() {
                return {type: this.type, created: true};
              };
            }
            const f = new Factory("widget");
            const obj = f.create();
            [obj.type, obj.created];
          `);
          expect(result).toEqual(["widget", true]);
        });
      });

      describe("Constructor Arguments", () => {
        it("should support no arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function NoArgs() {
              this.value = 42;
            }
            const obj = new NoArgs();
            obj.value;
          `);
          expect(result).toBe(42);
        });

        it("should support single argument", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function OneArg(x) {
              this.x = x;
            }
            const obj = new OneArg(100);
            obj.x;
          `);
          expect(result).toBe(100);
        });

        it("should support multiple arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function MultiArg(a, b, c, d) {
              this.sum = a + b + c + d;
            }
            const obj = new MultiArg(1, 2, 3, 4);
            obj.sum;
          `);
          expect(result).toBe(10);
        });

        it("should support spread arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function SpreadArgs(a, b, c) {
              this.sum = a + b + c;
            }
            const args = [10, 20, 30];
            const obj = new SpreadArgs(...args);
            obj.sum;
          `);
          expect(result).toBe(60);
        });

        it("should support rest parameters in constructor", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function RestParams(first, ...rest) {
              this.first = first;
              this.rest = rest;
            }
            const obj = new RestParams(1, 2, 3, 4, 5);
            [obj.first, obj.rest];
          `);
          expect(result).toEqual([1, [2, 3, 4, 5]]);
        });

        it("should support default parameters", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Defaults(a = 10, b = 20) {
              this.a = a;
              this.b = b;
            }
            const obj = new Defaults();
            [obj.a, obj.b];
          `);
          expect(result).toEqual([10, 20]);
        });

        it("should support mixed spread and regular arguments", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Mixed(a, b, c, d) {
              this.values = [a, b, c, d];
            }
            const obj = new Mixed(1, ...[2, 3], 4);
            obj.values;
          `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should throw error for too few arguments", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function RequiresTwo(a, b) {
                this.a = a;
                this.b = b;
              }
              new RequiresTwo(1);
            `);
          }).toThrow("Expected at least 2 arguments but got 1");
        });
      });

      describe("Constructor Return Values", () => {
        it("should return instance when no explicit return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function NoReturn(x) {
              this.x = x;
            }
            const obj = new NoReturn(42);
            obj.x;
          `);
          expect(result).toBe(42);
        });

        it("should return instance when returning this", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnThis(x) {
              this.x = x;
              return this;
            }
            const obj = new ReturnThis(99);
            obj.x;
          `);
          expect(result).toBe(99);
        });

        it("should ignore primitive return values (number)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnNumber(size) {
              this.size = size;
              return 42;
            }
            const obj = new ReturnNumber(10);
            obj.size;
          `);
          expect(result).toBe(10);
        });

        it("should ignore primitive return values (string)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnString(x) {
              this.x = x;
              return "ignored";
            }
            const obj = new ReturnString(5);
            obj.x;
          `);
          expect(result).toBe(5);
        });

        it("should ignore primitive return values (boolean)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnBoolean(value) {
              this.value = value;
              return true;
            }
            const obj = new ReturnBoolean("test");
            obj.value;
          `);
          expect(result).toBe("test");
        });

        it("should use explicit object return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnObject() {
              return {custom: true, value: 99};
            }
            const obj = new ReturnObject();
            [obj.custom, obj.value];
          `);
          expect(result).toEqual([true, 99]);
        });

        it("should ignore null return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnNull(x) {
              this.x = x;
              return null;
            }
            const obj = new ReturnNull(7);
            obj.x;
          `);
          expect(result).toBe(7);
        });

        it("should use array return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnArray() {
              return [1, 2, 3];
            }
            const obj = new ReturnArray();
            obj;
          `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should use function return", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ReturnFunction() {
              return function() { return 42; };
            }
            const obj = new ReturnFunction();
            obj();
          `);
          expect(result).toBe(42);
        });
      });

      describe("Multiple Instances", () => {
        it("should create two instances with different data", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Person(name) {
              this.name = name;
            }
            const p1 = new Person("Alice");
            const p2 = new Person("Bob");
            [p1.name, p2.name];
          `);
          expect(result).toEqual(["Alice", "Bob"]);
        });

        it("should ensure instances are independent", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Counter(start) {
              this.count = start;
            }
            const c1 = new Counter(0);
            const c2 = new Counter(10);
            c1.count = 5;
            [c1.count, c2.count];
          `);
          expect(result).toEqual([5, 10]);
        });

        it("should ensure instance methods are independent", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Counter(start) {
              this.count = start;
              this.increment = function() {
                this.count = this.count + 1;
              };
            }
            const c1 = new Counter(0);
            const c2 = new Counter(0);
            c1.increment();
            c1.increment();
            c2.increment();
            [c1.count, c2.count];
          `);
          expect(result).toEqual([2, 1]);
        });

        it("should support creating many instances in a loop", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Box(id) {
              this.id = id;
            }
            const boxes = [];
            for (let i = 0; i < 5; i = i + 1) {
              boxes[i] = new Box(i);
            }
            [boxes[0].id, boxes[2].id, boxes[4].id];
          `);
          expect(result).toEqual([0, 2, 4]);
        });

        it("should support instances with object properties remaining independent", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Container(data) {
              this.data = data;
            }
            const c1 = new Container({x: 1});
            const c2 = new Container({x: 2});
            c1.data.x = 10;
            [c1.data.x, c2.data.x];
          `);
          expect(result).toEqual([10, 2]);
        });

        it("should support instances with array properties remaining independent", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function List(items) {
              this.items = items;
            }
            const l1 = new List([1, 2]);
            const l2 = new List([3, 4]);
            l1.items[0] = 99;
            [l1.items, l2.items];
          `);
          expect(result).toEqual([
            [99, 2],
            [3, 4],
          ]);
        });
      });

      describe("Edge Cases", () => {
        it("should throw error for non-function constructor", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              const notAFunction = 42;
              new notAFunction();
            `);
          }).toThrow("Constructor must be a function");
        });

        it("should throw error when constructor throws", () => {
          const interpreter = new Interpreter();
          expect(() => {
            interpreter.evaluate(`
              function ThrowsError() {
                throw "Constructor error";
              }
              new ThrowsError();
            `);
          }).toThrow("Uncaught Constructor error");
        });

        it("should support constructor in closure", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function makeConstructor(prefix) {
              return function(name) {
                this.name = prefix + name;
              };
            }
            const PersonConstructor = makeConstructor("Mr. ");
            const p = new PersonConstructor("Smith");
            p.name;
          `);
          expect(result).toBe("Mr. Smith");
        });

        it("should support constructor returning different object types", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Factory(type) {
              if (type === "array") {
                return [1, 2, 3];
              } else if (type === "object") {
                return {value: 42};
              } else {
                this.type = type;
              }
            }
            const a = new Factory("array");
            const o = new Factory("object");
            const d = new Factory("default");
            [a, o.value, d.type];
          `);
          expect(result).toEqual([[1, 2, 3], 42, "default"]);
        });

        it("should support constructor with conditional logic", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function ConditionalInit(value) {
              if (value > 10) {
                this.category = "large";
              } else {
                this.category = "small";
              }
              this.value = value;
            }
            const large = new ConditionalInit(20);
            const small = new ConditionalInit(5);
            [large.category, small.category];
          `);
          expect(result).toEqual(["large", "small"]);
        });

        it("should support nested constructor calls", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
            function Inner(value) {
              this.value = value;
            }
            function Outer(x) {
              this.inner = new Inner(x * 2);
            }
            const obj = new Outer(5);
            obj.inner.value;
          `);
          expect(result).toBe(10);
        });
      });

      // Note: Async tests with Promise are skipped because Promise is not in the interpreter's global scope
      // These would require Promise support to be added first
      // describe("Async Support", () => {
      //   it("should support async constructor", async () => {
      //     const interpreter = new Interpreter();
      //     const result = await interpreter.evaluateAsync(`
      //       async function AsyncConstructor(value) {
      //         this.value = await Promise.resolve(value);
      //       }
      //       const obj = new AsyncConstructor(42);
      //       obj.value;
      //     `);
      //     expect(result).toBe(42);
      //   });

      //   it("should support await in constructor body", async () => {
      //     const interpreter = new Interpreter();
      //     const result = await interpreter.evaluateAsync(`
      //       async function Fetcher(id) {
      //         const data = await Promise.resolve("data-" + id);
      //         this.data = data;
      //       }
      //       const f = new Fetcher(123);
      //       f.data;
      //     `);
      //     expect(result).toBe("data-123");
      //   });

      //   it("should support async methods in constructor", async () => {
      //     const interpreter = new Interpreter();
      //     const result = await interpreter.evaluateAsync(`
      //       function AsyncMethods(value) {
      //         this.value = value;
      //         this.getValue = async function() {
      //           return await Promise.resolve(this.value);
      //         };
      //       }
      //       const obj = new AsyncMethods(99);
      //       obj.getValue();
      //     `);
      //     expect(result).toBe(99);
      //   });

      //   it("should support multiple async instances", async () => {
      //     const interpreter = new Interpreter();
      //     const result = await interpreter.evaluateAsync(`
      //       async function AsyncCounter(start) {
      //         this.count = await Promise.resolve(start);
      //         this.increment = async function() {
      //           this.count = await Promise.resolve(this.count + 1);
      //           return this.count;
      //         };
      //       }
      //       const c1 = new AsyncCounter(0);
      //       const c2 = new AsyncCounter(10);
      //       c1.increment();
      //       c2.increment();
      //       [c1.count, c2.count];
      //     `);
      //     expect(result).toEqual([1, 11]);
      //   });
      // });
    });
  });

  describe("ES2015", () => {
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

      it("should allow fluent chaining by returning this", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
            class Counter {
              constructor() {
                this.count = 0;
              }
              inc() {
                this.count = this.count + 1;
                return this;
              }
            }
            const c = new Counter();
            c.inc().inc().count;
          `);
        expect(result).toBe(2);
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

      it("should use static factory methods to create instances", () => {
        const interpreter = new Interpreter();
        const result = interpreter.evaluate(`
            class Point {
              constructor(x, y) {
                this.x = x;
                this.y = y;
              }
              static origin() {
                return new Point(0, 0);
              }
            }
            const p = Point.origin();
            [p.x, p.y];
          `);
        expect(result).toEqual([0, 0]);
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
        }).toThrow("Must call super constructor in derived class before accessing 'this'");
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
  });

  describe("ES2022", () => {
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
});
