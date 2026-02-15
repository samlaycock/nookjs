import { describe, it, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2024 } from "../src/presets";

describe("Objects", () => {
  describe("ES5", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("Object literals", () => {
      it("should create an empty object", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `let obj = {}; obj`;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({});
      });

      it("should create object with properties", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `let obj = { x: 10, y: 20 }; obj`;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({ x: 10, y: 20 });
      });

      it("should support string literal keys", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `let obj = { "first name": "John", "last name": "Doe" }; obj`;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({ "first name": "John", "last name": "Doe" });
      });

      it("should evaluate property values", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let x = 5;
            let obj = { a: x + 3, b: x * 2 };
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({ a: 8, b: 10 });
      });

      it("should support nested objects", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              name: "John",
              address: {
                city: "NYC",
                zip: 10001
              }
            };
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({
          name: "John",
          address: {
            city: "NYC",
            zip: 10001,
          },
        });
      });

      it("should support arrays as property values", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              numbers: [1, 2, 3],
              names: ["Alice", "Bob"]
            };
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({
          numbers: [1, 2, 3],
          names: ["Alice", "Bob"],
        });
      });

      it("should support boolean values", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              active: true,
              verified: false
            };
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({ active: true, verified: false });
      });

      it("should support mixed value types", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              id: 42,
              name: "Test",
              active: true,
              tags: ["a", "b"]
            };
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({
          id: 42,
          name: "Test",
          active: true,
          tags: ["a", "b"],
        });
      });
    });

    describe("Property access", () => {
      it("should access object property with dot notation", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10, y: 20 };
            obj.x
          `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      it("should access multiple properties", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { a: 1, b: 2, c: 3 };
            obj.a + obj.b + obj.c
          `;
        expect(interpreter.evaluate(code)).toBe(6);
      });

      it("should access nested object properties", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              person: {
                name: "Alice",
                age: 30
              }
            };
            obj.person.name
          `;
        expect(interpreter.evaluate(code)).toBe("Alice");
      });

      it("should access deeply nested properties", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              a: {
                b: {
                  c: {
                    value: 42
                  }
                }
              }
            };
            obj.a.b.c.value
          `;
        expect(interpreter.evaluate(code)).toBe(42);
      });

      it("should access computed properties with bracket notation", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10, y: 20 };
            let key = "x";
            obj[key]
          `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      it("should access property with string literal in brackets", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { "first name": "John" };
            obj["first name"]
          `;
        expect(interpreter.evaluate(code)).toBe("John");
      });

      it("should return undefined for non-existent property", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10 };
            obj.y
          `;
        expect(interpreter.evaluate(code)).toBeUndefined();
      });

      it("should access array property from object", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { numbers: [1, 2, 3] };
            obj.numbers[1]
          `;
        expect(interpreter.evaluate(code)).toBe(2);
      });
    });

    describe("Property assignment", () => {
      it("should assign property with dot notation", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10 };
            obj.x = 20;
            obj.x
          `;
        expect(interpreter.evaluate(code)).toBe(20);
      });

      it("should add new property to object", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10 };
            obj.y = 20;
            obj
          `;
        const result = interpreter.evaluate(code);
        expect(result).toEqual({ x: 10, y: 20 });
      });

      it("should assign nested property", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {
              person: {
                name: "Alice",
                age: 30
              }
            };
            obj.person.age = 31;
            obj.person.age
          `;
        expect(interpreter.evaluate(code)).toBe(31);
      });

      it("should assign property with computed key", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { x: 10, y: 20 };
            let key = "x";
            obj[key] = 30;
            obj.x
          `;
        expect(interpreter.evaluate(code)).toBe(30);
      });

      it("should assign property with string literal in brackets", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = {};
            obj["first name"] = "John";
            obj["first name"]
          `;
        expect(interpreter.evaluate(code)).toBe("John");
      });

      it("should modify object passed to function", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function setName(obj, name) {
              obj.name = name;
              return obj;
            }
            let person = { age: 25 };
            setName(person, "Alice");
            person.name
          `;
        expect(interpreter.evaluate(code)).toBe("Alice");
      });
    });

    describe("Property deletion", () => {
      it("should remove a property from the object", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { a: 1, b: 2 };
            delete obj.a;
            obj.a
          `;
        expect(interpreter.evaluate(code)).toBeUndefined();
      });
    });

    describe("Objects with functions", () => {
      it("should pass object as function parameter", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function getX(obj) {
              return obj.x;
            }
            let point = { x: 10, y: 20 };
            getX(point)
          `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      it("should return object from function", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function createPoint(x, y) {
              return { x: x, y: y };
            }
            let p = createPoint(5, 10);
            p.x + p.y
          `;
        expect(interpreter.evaluate(code)).toBe(15);
      });

      it("should modify and return object", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function doubleValues(obj) {
              obj.x = obj.x * 2;
              obj.y = obj.y * 2;
              return obj;
            }
            let point = { x: 3, y: 4 };
            let result = doubleValues(point);
            result.x + result.y
          `;
        expect(interpreter.evaluate(code)).toBe(14);
      });

      it("should handle object destructuring in logic", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function sum(obj) {
              let total = 0;
              total = total + obj.a;
              total = total + obj.b;
              total = total + obj.c;
              return total;
            }
            sum({ a: 1, b: 2, c: 3 })
          `;
        expect(interpreter.evaluate(code)).toBe(6);
      });
    });

    describe("Objects in loops", () => {
      it("should create object in loop", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let result = 0;
            for (let i = 0; i < 3; i++) {
              let obj = { value: i * 2 };
              result = result + obj.value;
            }
            result
          `;
        expect(interpreter.evaluate(code)).toBe(6); // 0 + 2 + 4
      });

      it("should modify object properties in loop", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { count: 0, sum: 0 };
            for (let i = 1; i <= 5; i++) {
              obj.count = obj.count + 1;
              obj.sum = obj.sum + i;
            }
            obj.sum
          `;
        expect(interpreter.evaluate(code)).toBe(15);
      });

      it("should iterate with object data", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { start: 2, end: 5 };
            let sum = 0;
            for (let i = obj.start; i <= obj.end; i++) {
              sum = sum + i;
            }
            sum
          `;
        expect(interpreter.evaluate(code)).toBe(14); // 2+3+4+5
      });

      it("should iterate properties with for...in", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { a: 1, b: 2, c: 3 };
            let sum = 0;
            for (let key in obj) {
              sum = sum + obj[key];
            }
            sum
          `;
        expect(interpreter.evaluate(code)).toBe(6);
      });
    });

    describe("Arrays of objects", () => {
      it("should create array of objects", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let arr = [
              { x: 1, y: 2 },
              { x: 3, y: 4 },
              { x: 5, y: 6 }
            ];
            arr[1].x
          `;
        expect(interpreter.evaluate(code)).toBe(3);
      });

      it("should iterate over array of objects", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
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
        expect(interpreter.evaluate(code)).toBe(90);
      });

      it("should modify objects in array", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let points = [
              { x: 1, y: 2 },
              { x: 3, y: 4 }
            ];
            points[0].x = 10;
            points[0].x
          `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      it("should find object in array", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function findByName(arr, name) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i].name === name) {
                  return arr[i].age;
                }
              }
              return -1;
            }
            let people = [
              { name: "Alice", age: 30 },
              { name: "Bob", age: 25 }
            ];
            findByName(people, "Bob")
          `;
        expect(interpreter.evaluate(code)).toBe(25);
      });
    });

    describe("Object reference semantics", () => {
      it("should have reference semantics", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj1 = { x: 10 };
            let obj2 = obj1;
            obj2.x = 20;
            obj1.x
          `;
        expect(interpreter.evaluate(code)).toBe(20);
      });

      it("should share reference in function", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function modify(obj) {
              obj.value = 42;
            }
            let myObj = { value: 0 };
            modify(myObj);
            myObj.value
          `;
        expect(interpreter.evaluate(code)).toBe(42);
      });
    });

    describe("Complex object operations", () => {
      it("should calculate distance between points", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function distance(p1, p2) {
              let dx = p2.x - p1.x;
              let dy = p2.y - p1.y;
              return dx * dx + dy * dy;
            }
            let point1 = { x: 0, y: 0 };
            let point2 = { x: 3, y: 4 };
            distance(point1, point2)
          `;
        expect(interpreter.evaluate(code)).toBe(25); // 3^2 + 4^2
      });

      it("should merge object properties", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function merge(obj1, obj2) {
              obj1.a = obj2.a;
              obj1.b = obj2.b;
              return obj1;
            }
            let target = { a: 1, b: 2, c: 3 };
            let source = { a: 10, b: 20 };
            merge(target, source);
            target.a + target.b + target.c
          `;
        expect(interpreter.evaluate(code)).toBe(33); // 10 + 20 + 3
      });

      it("should count object properties matching condition", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function countAdults(people) {
              let count = 0;
              for (let i = 0; i < people.length; i++) {
                if (people[i].age >= 18) {
                  count = count + 1;
                }
              }
              return count;
            }
            let group = [
              { name: "Alice", age: 25 },
              { name: "Bob", age: 15 },
              { name: "Charlie", age: 30 },
              { name: "Dave", age: 17 }
            ];
            countAdults(group)
          `;
        expect(interpreter.evaluate(code)).toBe(2);
      });

      it("should calculate average from object array", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            function averageScore(students) {
              let total = 0;
              for (let i = 0; i < students.length; i++) {
                total = total + students[i].score;
              }
              return total / students.length;
            }
            let students = [
              { name: "Alice", score: 90 },
              { name: "Bob", score: 80 },
              { name: "Charlie", score: 70 }
            ];
            averageScore(students)
          `;
        expect(interpreter.evaluate(code)).toBeCloseTo(80, 0.1);
      });

      it("should build object from loop", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let stats = { min: 999, max: 0, sum: 0 };
            let numbers = [5, 2, 8, 1, 9, 3];
            for (let i = 0; i < numbers.length; i++) {
              let num = numbers[i];
              if (num < stats.min) {
                stats.min = num;
              }
              if (num > stats.max) {
                stats.max = num;
              }
              stats.sum = stats.sum + num;
            }
            stats.max - stats.min
          `;
        expect(interpreter.evaluate(code)).toBe(8); // 9 - 1
      });
    });

    describe("Edge cases", () => {
      it("should handle object with no properties used", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `let obj = {}; 42`;
        expect(interpreter.evaluate(code)).toBe(42);
      });

      it("should handle empty object comparison", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj1 = {};
            let obj2 = {};
            obj1 === obj2
          `;
        expect(interpreter.evaluate(code)).toBe(false);
      });

      it("should handle object with numeric string keys", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { "123": "value" };
            obj["123"]
          `;
        expect(interpreter.evaluate(code)).toBe("value");
      });

      it("should handle nested empty objects", () => {
        const interpreter = new Interpreter(ES2024);
        const code = `
            let obj = { inner: {} };
            obj.inner.x = 5;
            obj.inner.x
          `;
        expect(interpreter.evaluate(code)).toBe(5);
      });
    });

    describe("Object getters and setters", () => {
      describe("Getters", () => {
        it("should support a basic getter", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              get name() { return "hello"; }
            };
            obj.name;
          `);
          expect(result).toBe("hello");
        });

        it("should support a getter that uses this", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              _x: 10,
              get x() { return this._x; }
            };
            obj.x;
          `);
          expect(result).toBe(10);
        });

        it("should support a getter with computed logic", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              first: "John",
              last: "Doe",
              get fullName() { return this.first + " " + this.last; }
            };
            obj.fullName;
          `);
          expect(result).toBe("John Doe");
        });

        it("should call getter each time the property is accessed", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            let count = 0;
            const obj = {
              get value() { return ++count; }
            };
            const a = obj.value;
            const b = obj.value;
            const c = obj.value;
            [a, b, c];
          `);
          expect(result).toEqual([1, 2, 3]);
        });
      });

      describe("Setters", () => {
        it("should support a basic setter", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            let stored = 0;
            const obj = {
              set val(v) { stored = v; }
            };
            obj.val = 42;
            stored;
          `);
          expect(result).toBe(42);
        });

        it("should support a setter that uses this", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              _data: null,
              set data(v) { this._data = v; }
            };
            obj.data = "test";
            obj._data;
          `);
          expect(result).toBe("test");
        });

        it("should support a setter with transformation", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              _val: 0,
              set val(v) { this._val = v * 2; }
            };
            obj.val = 5;
            obj._val;
          `);
          expect(result).toBe(10);
        });
      });

      describe("Combined getters and setters", () => {
        it("should support getter and setter on the same property", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              _val: 0,
              get val() { return this._val; },
              set val(v) { this._val = v * 2; }
            };
            obj.val = 5;
            obj.val;
          `);
          expect(result).toBe(10);
        });

        it("should support multiple getter/setter pairs", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              _x: 0,
              _y: 0,
              get x() { return this._x; },
              set x(v) { this._x = v; },
              get y() { return this._y; },
              set y(v) { this._y = v; }
            };
            obj.x = 10;
            obj.y = 20;
            obj.x + obj.y;
          `);
          expect(result).toBe(30);
        });

        it("should work alongside regular properties", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = {
              normal: "hello",
              _backing: 0,
              get computed() { return this._backing + 1; },
              set computed(v) { this._backing = v; }
            };
            obj.computed = 10;
            obj.normal + ":" + obj.computed;
          `);
          expect(result).toBe("hello:11");
        });
      });

      describe("Computed property getters/setters", () => {
        it("should support computed getter names", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const key = "value";
            const obj = {
              get [key]() { return 42; }
            };
            obj.value;
          `);
          expect(result).toBe(42);
        });

        it("should support computed setter names", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const key = "value";
            let stored = 0;
            const obj = {
              set [key](v) { stored = v; }
            };
            obj.value = 99;
            stored;
          `);
          expect(result).toBe(99);
        });
      });

      describe("Async evaluation", () => {
        it("should support getters in async evaluation", async () => {
          const interpreter = new Interpreter(ES2024);
          const result = await interpreter.evaluateAsync(`
            const obj = {
              _x: 5,
              get x() { return this._x * 2; }
            };
            obj.x;
          `);
          expect(result).toBe(10);
        });

        it("should support setters in async evaluation", async () => {
          const interpreter = new Interpreter(ES2024);
          const result = await interpreter.evaluateAsync(`
            const obj = {
              _val: 0,
              get val() { return this._val; },
              set val(v) { this._val = v + 1; }
            };
            obj.val = 10;
            obj.val;
          `);
          expect(result).toBe(11);
        });
      });
    });

    describe("Object Static Methods", () => {
      describe("Object.create", () => {
        it("should create object with prototype properties", () => {
          const result = interpreter.evaluate(`
            const proto = { a: 1 };
            const obj = Object.create(proto);
            obj.a;
          `);
          expect(result).toBe(1);
        });
      });

      describe("Object.keys", () => {
        it("should return array of property keys", () => {
          expect(interpreter.evaluate("Object.keys({ a: 1, b: 2 })")).toEqual([
            "a",
            "b",
          ]);
        });

        it("should return empty array for empty object", () => {
          expect(interpreter.evaluate("Object.keys({})")).toEqual([]);
        });

        it("should order numeric-like keys before string keys", () => {
          const result = interpreter.evaluate(`
            const obj = { b: 1, "2": 2, "1": 1, a: 3 };
            Object.keys(obj);
          `);
          expect(result).toEqual(["1", "2", "b", "a"]);
        });

        it("should return indices for arrays", () => {
          const result = interpreter.evaluate(`Object.keys(["a", "b"])`);
          expect(result).toEqual(["0", "1"]);
        });

        it("should include keys with undefined values", () => {
          const result = interpreter.evaluate(
            `Object.keys({ a: undefined, b: 1 })`,
          );
          expect(result).toEqual(["a", "b"]);
        });
      });
    });

    describe("This and Object Methods", () => {
      describe("Basic object methods", () => {
        it("should call method with this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    value: 10,
                    getValue: function() {
                      return this.value;
                    }
                  };
                  obj.getValue()
                `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        it("should modify object property via this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let counter = {
                    count: 0,
                    increment: function() {
                      this.count = this.count + 1;
                      return this.count;
                    }
                  };
                  counter.increment();
                  counter.increment();
                  counter.count
                `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should access multiple properties via this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let person = {
                    firstName: "John",
                    lastName: "Doe",
                    fullName: function() {
                      return this.firstName + " " + this.lastName;
                    }
                  };
                  person.fullName()
                `;
          expect(interpreter.evaluate(code)).toBe("John Doe");
        });
      });

      describe("Methods with parameters", () => {
        it("should call method with parameters", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let calculator = {
                    result: 0,
                    add: function(x) {
                      this.result = this.result + x;
                      return this.result;
                    }
                  };
                  calculator.add(5);
                  calculator.add(3)
                `;
          expect(interpreter.evaluate(code)).toBe(8);
        });

        it("should use method parameters and this together", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    factor: 3,
                    multiply: function(x) {
                      return this.factor * x;
                    }
                  };
                  obj.multiply(4)
                `;
          expect(interpreter.evaluate(code)).toBe(12);
        });
      });

      describe("Nested objects with methods", () => {
        it("should access nested properties in methods", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let user = {
                    name: "Alice",
                    address: {
                      city: "NYC"
                    },
                    getCity: function() {
                      return this.address.city;
                    }
                  };
                  user.getCity()
                `;
          expect(interpreter.evaluate(code)).toBe("NYC");
        });

        it("should modify nested properties in methods", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let user = {
                    settings: {
                      theme: "light"
                    },
                    setTheme: function(newTheme) {
                      this.settings.theme = newTheme;
                      return this.settings.theme;
                    }
                  };
                  user.setTheme("dark")
                `;
          expect(interpreter.evaluate(code)).toBe("dark");
        });
      });

      describe("Methods calling other methods", () => {
        it("should call other methods via this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    value: 5,
                    getValue: function() {
                      return this.value;
                    },
                    double: function() {
                      return this.getValue() * 2;
                    }
                  };
                  obj.double()
                `;
          expect(interpreter.evaluate(code)).toBe(10);
        });

        it("should chain method calls", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let calculator = {
                    value: 0,
                    add: function(x) {
                      this.value = this.value + x;
                      return this;
                    },
                    multiply: function(x) {
                      this.value = this.value * x;
                      return this;
                    },
                    getValue: function() {
                      return this.value;
                    }
                  };
                  calculator.add(5).multiply(3).getValue()
                `;
          expect(interpreter.evaluate(code)).toBe(15);
        });
      });

      describe("Methods with loops and conditionals", () => {
        it("should use this in loop", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    numbers: [1, 2, 3, 4, 5],
                    sum: function() {
                      let total = 0;
                      for (let i = 0; i < this.numbers.length; i++) {
                        total = total + this.numbers[i];
                      }
                      return total;
                    }
                  };
                  obj.sum()
                `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        it("should use this in conditional", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let account = {
                    balance: 100,
                    withdraw: function(amount) {
                      if (amount <= this.balance) {
                        this.balance = this.balance - amount;
                        return 1;
                      }
                      return 0;
                    }
                  };
                  account.withdraw(30);
                  account.balance
                `;
          expect(interpreter.evaluate(code)).toBe(70);
        });
      });

      describe("Array of objects with methods", () => {
        it("should call methods on objects in array", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let people = [
                    {
                      name: "Alice",
                      age: 25,
                      greet: function() {
                        return "Hi, I'm " + this.name;
                      }
                    },
                    {
                      name: "Bob",
                      age: 30,
                      greet: function() {
                        return "Hi, I'm " + this.name;
                      }
                    }
                  ];
                  people[1].greet()
                `;
          expect(interpreter.evaluate(code)).toBe("Hi, I'm Bob");
        });
      });

      describe("Methods returning objects", () => {
        it("should return object with methods", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let factory = {
                    create: function(name) {
                      return {
                        name: name,
                        getName: function() {
                          return this.name;
                        }
                      };
                    }
                  };
                  let obj = factory.create("Test");
                  obj.getName()
                `;
          expect(interpreter.evaluate(code)).toBe("Test");
        });
      });

      describe("Complex method patterns", () => {
        it("should implement counter with methods", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let counter = {
                    count: 0,
                    increment: function() {
                      this.count = this.count + 1;
                    },
                    decrement: function() {
                      this.count = this.count - 1;
                    },
                    reset: function() {
                      this.count = 0;
                    },
                    getValue: function() {
                      return this.count;
                    }
                  };
                  counter.increment();
                  counter.increment();
                  counter.increment();
                  counter.decrement();
                  counter.getValue()
                `;
          expect(interpreter.evaluate(code)).toBe(2);
        });

        it("should implement rectangle with methods", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let rect = {
                    width: 5,
                    height: 10,
                    area: function() {
                      return this.width * this.height;
                    },
                    perimeter: function() {
                      return 2 * (this.width + this.height);
                    },
                    scale: function(factor) {
                      this.width = this.width * factor;
                      this.height = this.height * factor;
                    }
                  };
                  rect.scale(2);
                  rect.area()
                `;
          expect(interpreter.evaluate(code)).toBe(200); // 10 * 20
        });

        it("should implement shopping cart", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let cart = {
                    items: [],
                    total: 0,
                    addItem: function(price) {
                      let len = this.items.length;
                      this.items[len] = price;
                      this.total = this.total + price;
                    },
                    getTotal: function() {
                      return this.total;
                    }
                  };
                  cart.addItem(10);
                  cart.addItem(20);
                  cart.addItem(30);
                  cart.getTotal()
                `;
          expect(interpreter.evaluate(code)).toBe(60);
        });
      });

      describe("Methods with recursion", () => {
        it("should use this in recursive method", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    factorial: function(n) {
                      if (n <= 1) {
                        return 1;
                      }
                      return n * this.factorial(n - 1);
                    }
                  };
                  obj.factorial(5)
                `;
          expect(interpreter.evaluate(code)).toBe(120);
        });

        it("should use recursive method with object state", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    count: 0,
                    countDown: function(n) {
                      this.count = this.count + 1;
                      if (n <= 0) {
                        return this.count;
                      }
                      return this.countDown(n - 1);
                    }
                  };
                  obj.countDown(5)
                `;
          expect(interpreter.evaluate(code)).toBe(6); // counts 5,4,3,2,1,0
        });
      });

      describe("Computed property access in methods", () => {
        it("should access properties with bracket notation in this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    x: 10,
                    y: 20,
                    getProperty: function(key) {
                      return this[key];
                    }
                  };
                  obj.getProperty("y")
                `;
          expect(interpreter.evaluate(code)).toBe(20);
        });

        it("should set properties with bracket notation in this", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    setProperty: function(key, value) {
                      this[key] = value;
                      return this[key];
                    }
                  };
                  obj.setProperty("newProp", 42)
                `;
          expect(interpreter.evaluate(code)).toBe(42);
        });
      });

      describe("Edge cases", () => {
        it("should handle this in nested function calls", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    value: 10,
                    process: function() {
                      function helper() {
                        return 5;
                      }
                      return this.value + helper();
                    }
                  };
                  obj.process()
                `;
          expect(interpreter.evaluate(code)).toBe(15);
        });

        it("should return undefined for this in non-method context", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  function test() {
                    return this;
                  }
                  test()
                `;
          expect(interpreter.evaluate(code)).toBeUndefined();
        });

        it("should handle method assigned to variable", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    value: 42,
                    getValue: function() {
                      return this.value;
                    }
                  };
                  let method = obj.getValue;
                  obj.getValue()
                `;
          expect(interpreter.evaluate(code)).toBe(42);
        });
      });
    });
  });

  describe("ES2015", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("Computed property names", () => {
      describe("Object literals", () => {
        it("should support variable as computed key", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const key = "hello";
            const obj = { [key]: "world" };
            obj.hello;
          `);
          expect(result).toBe("world");
        });

        it("should support expression as computed key", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = { ["a" + "b"]: 42 };
            obj.ab;
          `);
          expect(result).toBe(42);
        });

        it("should support number expression as computed key", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const i = 0;
            const obj = { [i]: "zero", [i + 1]: "one" };
            obj[0] + ":" + obj[1];
          `);
          expect(result).toBe("zero:one");
        });

        it("should support function call as computed key", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            function getKey() { return "dynamic"; }
            const obj = { [getKey()]: true };
            obj.dynamic;
          `);
          expect(result).toBe(true);
        });

        it("should mix computed and static keys", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const k = "x";
            const obj = { a: 1, [k]: 2, b: 3 };
            obj.a + obj.x + obj.b;
          `);
          expect(result).toBe(6);
        });

        it("should support template literal as computed key", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(
            'const prefix = `item`; const obj = { [`${prefix}_1`]: "first" }; obj.item_1;',
          );
          expect(result).toBe("first");
        });

        it("should allow computed key to override earlier property", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const obj = { a: 1, ["a"]: 2 };
            obj.a;
          `);
          expect(result).toBe(2);
        });

        it("should evaluate computed keys in order", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            let counter = 0;
            function next() { return "k" + counter++; }
            const obj = { [next()]: "a", [next()]: "b", [next()]: "c" };
            obj.k0 + obj.k1 + obj.k2;
          `);
          expect(result).toBe("abc");
        });
      });

      describe("Computed methods in classes", () => {
        it("should support computed method names", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const method = "greet";
            class Foo {
              [method]() { return "hello"; }
            }
            const f = new Foo();
            f.greet();
          `);
          expect(result).toBe("hello");
        });

        it("should support computed static methods", () => {
          const interpreter = new Interpreter(ES2024);
          const result = interpreter.evaluate(`
            const name = "create";
            class Bar {
              static [name]() { return "created"; }
            }
            Bar.create();
          `);
          expect(result).toBe("created");
        });
      });

      describe("Async computed properties", () => {
        it("should support computed keys in async evaluation", async () => {
          const interpreter = new Interpreter(ES2024);
          const result = await interpreter.evaluateAsync(`
            const key = "value";
            const obj = { [key]: 99 };
            obj.value;
          `);
          expect(result).toBe(99);
        });
      });
    });

    describe("Object Static Methods", () => {
      describe("Object.assign", () => {
        it("should copy properties from source to target", () => {
          expect(
            interpreter.evaluate(`
                  const target = {};
                  const source = { a: 1, b: 2 };
                  Object.assign(target, source);
                  target.a + target.b
                `),
          ).toBe(3);
        });

        it("should keep existing properties when source is empty", () => {
          const result = interpreter.evaluate(`
            const target = { a: 1 };
            Object.assign(target, {});
            target.a;
          `);
          expect(result).toBe(1);
        });

        it("should copy from multiple sources", () => {
          expect(
            interpreter.evaluate(`
                  const obj = {};
                  Object.assign(obj, { a: 1 }, { b: 2 }, { c: 3 });
                  obj.a + obj.b + obj.c
                `),
          ).toBe(6);
        });

        it("should overwrite existing keys with later sources", () => {
          const result = interpreter.evaluate(`
            const target = { a: 1 };
            Object.assign(target, { a: 2, b: 3 });
            [target.a, target.b];
          `);
          expect(result).toEqual([2, 3]);
        });

        it("should copy symbol-keyed enumerable properties", () => {
          const result = interpreter.evaluate(`
            const key = Symbol("k");
            const target = {};
            const source = { [key]: 42 };
            Object.assign(target, source);
            target[key];
          `);
          expect(result).toBe(42);
        });

        it("should evaluate getters while assigning", () => {
          const result = interpreter.evaluate(`
            let calls = [];
            const source = {
              get a() {
                calls.push("a");
                return 1;
              },
              get b() {
                calls.push("b");
                return 2;
              },
            };
            const target = {};
            Object.assign(target, source);
            calls.join(",");
          `);
          expect(result).toBe("a,b");
        });

        it("should skip null and undefined sources", () => {
          const result = interpreter.evaluate(`
            const target = { a: 1 };
            Object.assign(target, null, undefined, { b: 2 });
            target.a + target.b
          `);
          expect(result).toBe(3);
        });
      });

      describe("Object.is", () => {
        it("should return true for same values", () => {
          expect(interpreter.evaluate("Object.is(5, 5)")).toBe(true);
        });

        it("should return true for same object", () => {
          expect(
            interpreter.evaluate(`
                  const obj = {};
                  Object.is(obj, obj)
                `),
          ).toBe(true);
        });

        it("should return false for different objects", () => {
          expect(interpreter.evaluate("Object.is({}, {})")).toBe(false);
        });

        it("should distinguish +0 and -0", () => {
          expect(interpreter.evaluate("Object.is(0, -0)")).toBe(false);
        });

        it("should identify NaN as equal", () => {
          expect(interpreter.evaluate("Object.is(NaN, NaN)")).toBe(true);
        });
      });
    });

    describe("This and Object Methods", () => {
      describe("Methods with arrow functions", () => {
        it("should use arrow function as method", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let obj = {
                    value: 42,
                    getValue: () => 42
                  };
                  obj.getValue()
                `;
          expect(interpreter.evaluate(code)).toBe(42);
        });

        it("should call arrow function method with parameters", () => {
          const interpreter = new Interpreter(ES2024);
          const code = `
                  let math = {
                    double: x => x * 2,
                    add: (a, b) => a + b
                  };
                  math.double(5) + math.add(3, 7)
                `;
          expect(interpreter.evaluate(code)).toBe(20);
        });
      });
    });
  });

  describe("ES2017", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("Object Static Methods", () => {
      describe("Object.values", () => {
        it("should return array of object values", () => {
          expect(interpreter.evaluate("Object.values({ a: 1, b: 2 })")).toEqual(
            [1, 2],
          );
        });

        it("should return empty array for empty object", () => {
          expect(interpreter.evaluate("Object.values({})")).toEqual([]);
        });

        it("should order numeric-like keys before string keys", () => {
          const result = interpreter.evaluate(`
            const obj = { b: 1, "2": 2, "1": 1, a: 3 };
            Object.values(obj);
          `);
          expect(result).toEqual([1, 2, 1, 3]);
        });

        it("should work with arrays", () => {
          expect(interpreter.evaluate("Object.values([1, 2, 3])")).toEqual([
            1, 2, 3,
          ]);
        });

        it("should include undefined values", () => {
          expect(
            interpreter.evaluate("Object.values({ a: undefined, b: 1 })"),
          ).toEqual([undefined, 1]);
        });

        it("should skip symbol keys", () => {
          const result = interpreter.evaluate(`
            const sym = Symbol("s");
            const obj = { a: 1 };
            obj[sym] = 2;
            Object.values(obj).length;
          `);
          expect(result).toBe(1);
        });
      });

      describe("Object.entries", () => {
        it("should return array of entries", () => {
          expect(
            interpreter.evaluate(`
                  const entries = Object.entries({ a: 1, b: 2 });
                  entries.length
                `),
          ).toBe(2);
        });

        it("should return empty array for empty object", () => {
          expect(interpreter.evaluate("Object.entries({})")).toEqual([]);
        });

        it("should order numeric-like keys before string keys", () => {
          const result = interpreter.evaluate(`
            const obj = { b: 1, "2": 2, "1": 1, a: 3 };
            Object.entries(obj);
          `);
          expect(result).toEqual([
            ["1", 1],
            ["2", 2],
            ["b", 1],
            ["a", 3],
          ]);
        });

        it("should work with arrays", () => {
          expect(interpreter.evaluate("Object.entries([1, 2])")).toEqual([
            ["0", 1],
            ["1", 2],
          ]);
        });

        it("should include undefined values", () => {
          const result = interpreter.evaluate(
            "Object.entries({ a: undefined, b: 1 })",
          );
          expect(result).toEqual([
            ["a", undefined],
            ["b", 1],
          ]);
        });

        it("should support for...of iteration over entries", () => {
          const result = interpreter.evaluate(`
            const entries = Object.entries({ a: 1, b: 2, c: 3 });
            let sum = 0;
            for (const [key, value] of entries) {
              if (key !== "b") {
                sum = sum + value;
              }
            }
            sum;
          `);
          expect(result).toBe(4);
        });

        it("should skip symbol keys", () => {
          const result = interpreter.evaluate(`
            const sym = Symbol("s");
            const obj = { a: 1 };
            obj[sym] = 2;
            Object.entries(obj).length;
          `);
          expect(result).toBe(1);
        });
      });
    });
  });

  describe("ES2018", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Object spread", () => {
      it("should shallow copy properties with spread", () => {
        const result = interpreter.evaluate(`
          const base = { a: 1, b: 2 };
          ({ ...base });
        `);
        expect(result).toEqual({ a: 1, b: 2 });
      });

      it("should merge objects and override properties", () => {
        const result = interpreter.evaluate(`
          const base = { a: 1, b: 2 };
          ({ ...base, b: 3, c: 4 });
        `);
        expect(result).toEqual({ a: 1, b: 3, c: 4 });
      });
    });

    describe("Object rest", () => {
      it("should collect remaining properties with rest", () => {
        const result = interpreter.evaluate(`
          const obj = { a: 1, b: 2, c: 3 };
          const { a, ...rest } = obj;
          ({ a, rest });
        `);
        expect(result).toEqual({ a: 1, rest: { b: 2, c: 3 } });
      });
    });
  });

  describe("ES2019", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("Object Static Methods", () => {
      describe("Object.fromEntries", () => {
        it("should create object from entries", () => {
          expect(
            interpreter.evaluate("Object.fromEntries([['a', 1], ['b', 2]])"),
          ).toEqual({
            a: 1,
            b: 2,
          });
        });

        it("should handle empty entries", () => {
          expect(interpreter.evaluate("Object.fromEntries([])")).toEqual({});
        });
      });
    });
  });

  describe("ES2022", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });
    describe("Object Static Methods", () => {
      describe("Object.hasOwn", () => {
        it("should return true for own property", () => {
          expect(
            interpreter.evaluate(`
                  const obj = { a: 1 };
                  Object.hasOwn(obj, 'a')
                `),
          ).toBe(true);
        });

        it("should return false for inherited property", () => {
          expect(
            interpreter.evaluate(`
                  const obj = { a: 1 };
                  Object.hasOwn(obj, 'toString')
                `),
          ).toBe(false);
        });
      });
    });
  });

  describe("ES2024", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Object.groupBy", () => {
      it("should group elements by key", () => {
        const result = interpreter.evaluate(`
              const arr = [{type: "fruit", name: "apple"}, {type: "vegetable", name: "carrot"}, {type: "fruit", name: "banana"}];
              Object.groupBy(arr, item => item.type);
            `);
        expect(result.fruit).toHaveLength(2);
        expect(result.vegetable).toHaveLength(1);
        expect(result.fruit[0].name).toBe("apple");
        expect(result.fruit[1].name).toBe("banana");
      });

      it("should handle empty arrays", () => {
        const result = interpreter.evaluate("Object.groupBy([], x => x)");
        expect(result).toEqual({});
      });

      it("should work with number keys converted to strings", () => {
        const result = interpreter.evaluate(`
              const arr = [1, 2, 3, 4, 5, 6];
              Object.groupBy(arr, x => x % 2);
            `);
        expect(result["0"]).toEqual([2, 4, 6]);
        expect(result["1"]).toEqual([1, 3, 5]);
      });

      it("should preserve element order within groups", () => {
        const result = interpreter.evaluate(`
              const arr = [{id: 1, cat: "a"}, {id: 2, cat: "b"}, {id: 3, cat: "a"}, {id: 4, cat: "a"}];
              const grouped = Object.groupBy(arr, x => x.cat);
              grouped.a.map(x => x.id);
            `);
        expect(result).toEqual([1, 3, 4]);
      });

      it("should work with computed keys", () => {
        const result = interpreter.evaluate(`
              const words = ["one", "two", "three", "four", "five"];
              Object.groupBy(words, word => word.length);
            `);
        expect(result["3"]).toEqual(["one", "two"]);
        expect(result["4"]).toEqual(["four", "five"]);
        expect(result["5"]).toEqual(["three"]);
      });
    });
  });
});
