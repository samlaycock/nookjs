import { Interpreter, ts } from "../src/index";

const interpreter = new Interpreter();

interpreter.evaluate(ts`
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
`);

interpreter.evaluate(ts`
  let counter = {
    count: 0,
    increment: function() {
      this.count = this.count + 1;
      return this.count;
    },
    decrement: function() {
      this.count = this.count - 1;
      return this.count;
    },
    getCount: function() {
      return this.count;
    }
  };
  counter.increment();
  counter.increment();
  counter.increment();
  counter.decrement();
  counter.getCount()
`);

interpreter.evaluate(ts`
  let rect = {
    width: 10,
    height: 5,
    area: function() {
      return this.width * this.height;
    },
    perimeter: function() {
      return 2 * (this.width + this.height);
    },
    scale: function(factor) {
      this.width = this.width * factor;
      this.height = this.height * factor;
      return this;
    }
  };
  rect.scale(2);
  rect.area()
`);

interpreter.evaluate(ts`
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
    },
    getItemCount: function() {
      return this.items.length;
    }
  };
  cart.addItem(10);
  cart.addItem(25);
  cart.addItem(15);
  cart.getTotal()
`);
