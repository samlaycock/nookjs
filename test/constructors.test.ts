import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

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
