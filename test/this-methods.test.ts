import { describe, it, expect } from "bun:test";
import { Interpreter, InterpreterError } from "../src/interpreter";

describe("This and Object Methods", () => {
  describe("Basic object methods", () => {
    it("should call method with this", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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

  describe("Methods with arrow functions", () => {
    it("should use arrow function as method", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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

  describe("Methods with parameters", () => {
    it("should call method with parameters", () => {
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
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
      const interpreter = new Interpreter();
      const code = `
        function test() {
          return this;
        }
        test()
      `;
      expect(interpreter.evaluate(code)).toBeUndefined();
    });

    it("should handle method assigned to variable", () => {
      const interpreter = new Interpreter();
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
