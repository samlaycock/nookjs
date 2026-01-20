import { describe, it, expect } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Objects", () => {
  describe("Object literals", () => {
    it("should create an empty object", () => {
      const interpreter = new Interpreter();
      const code = `let obj = {}; obj`;
      const result = interpreter.evaluate(code);
      expect(result).toEqual({});
    });

    it("should create object with properties", () => {
      const interpreter = new Interpreter();
      const code = `let obj = { x: 10, y: 20 }; obj`;
      const result = interpreter.evaluate(code);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it("should support string literal keys", () => {
      const interpreter = new Interpreter();
      const code = `let obj = { "first name": "John", "last name": "Doe" }; obj`;
      const result = interpreter.evaluate(code);
      expect(result).toEqual({ "first name": "John", "last name": "Doe" });
    });

    it("should evaluate property values", () => {
      const interpreter = new Interpreter();
      const code = `
        let x = 5;
        let obj = { a: x + 3, b: x * 2 };
        obj
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual({ a: 8, b: 10 });
    });

    it("should support nested objects", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10, y: 20 };
        obj.x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should access multiple properties", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { a: 1, b: 2, c: 3 };
        obj.a + obj.b + obj.c
      `;
      expect(interpreter.evaluate(code)).toBe(6);
    });

    it("should access nested object properties", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10, y: 20 };
        let key = "x";
        obj[key]
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    it("should access property with string literal in brackets", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { "first name": "John" };
        obj["first name"]
      `;
      expect(interpreter.evaluate(code)).toBe("John");
    });

    it("should return undefined for non-existent property", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10 };
        obj.y
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });

    it("should access array property from object", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { numbers: [1, 2, 3] };
        obj.numbers[1]
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });
  });

  describe("Property assignment", () => {
    it("should assign property with dot notation", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10 };
        obj.x = 20;
        obj.x
      `;
      expect(interpreter.evaluate(code)).toBe(20);
    });

    it("should add new property to object", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10 };
        obj.y = 20;
        obj
      `;
      const result = interpreter.evaluate(code);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it("should assign nested property", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `
        let obj = { x: 10, y: 20 };
        let key = "x";
        obj[key] = 30;
        obj.x
      `;
      expect(interpreter.evaluate(code)).toBe(30);
    });

    it("should assign property with string literal in brackets", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = {};
        obj["first name"] = "John";
        obj["first name"]
      `;
      expect(interpreter.evaluate(code)).toBe("John");
    });

    it("should modify object passed to function", () => {
      const interpreter = new Interpreter();
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

  describe("Objects with functions", () => {
    it("should pass object as function parameter", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
  });

  describe("Arrays of objects", () => {
    it("should create array of objects", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `
        let obj1 = { x: 10 };
        let obj2 = obj1;
        obj2.x = 20;
        obj1.x
      `;
      expect(interpreter.evaluate(code)).toBe(20);
    });

    it("should share reference in function", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `let obj = {}; 42`;
      expect(interpreter.evaluate(code)).toBe(42);
    });

    it("should handle empty object comparison", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj1 = {};
        let obj2 = {};
        obj1 === obj2
      `;
      expect(interpreter.evaluate(code)).toBe(false);
    });

    it("should handle object with numeric string keys", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { "123": "value" };
        obj["123"]
      `;
      expect(interpreter.evaluate(code)).toBe("value");
    });

    it("should handle nested empty objects", () => {
      const interpreter = new Interpreter();
      const code = `
        let obj = { inner: {} };
        obj.inner.x = 5;
        obj.inner.x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });
  });
});
