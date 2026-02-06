import { createSandbox, ts } from "../src/index";

const sandbox = createSandbox({ env: "es2022" });

const totalAge = await sandbox.run<number>(ts`
  const people = [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
    { name: "Charlie", age: 35 },
  ];
  people.reduce((sum, person) => sum + person.age, 0);
`);

const counterValue = await sandbox.run<number>(ts`
  const counter = {
    count: 0,
    increment() {
      this.count = this.count + 1;
      return this.count;
    },
    decrement() {
      this.count = this.count - 1;
      return this.count;
    },
  };
  counter.increment();
  counter.increment();
  counter.decrement();
  counter.count;
`);

const cartTotal = await sandbox.run<number>(ts`
  const cart = {
    items: [],
    addItem(price) {
      this.items.push(price);
    },
    total() {
      return this.items.reduce((sum, item) => sum + item, 0);
    },
  };
  cart.addItem(10);
  cart.addItem(25);
  cart.addItem(15);
  cart.total();
`);

console.log({ totalAge, counterValue, cartTotal });
