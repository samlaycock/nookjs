import { describe, test, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Generator Functions", () => {
  describe("Basic sync generators", () => {
    test("simple generator with yield", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("generator returns done: true when exhausted", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        g.next(); // value: 1, done: false
        const final = g.next(); // value: undefined, done: true
        final.done;
      `);
      expect(result).toBe(true);
    });

    test("generator with return statement", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          return 42;
          yield 2; // never reached
        }
        const g = gen();
        const first = g.next();
        const second = g.next();
        second.value;
      `);
      expect(result).toBe(42);
    });

    test("generator without yields returns immediately", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          return 10;
        }
        const g = gen();
        const r = g.next();
        r.value;
      `);
      expect(result).toBe(10);
    });

    test("generator with expression yield", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1 + 1;
          yield 2 * 3;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([2, 6]);
    });
  });

  describe("Generator with parameters", () => {
    test("generator accepts parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* range(start, end) {
          yield start;
          yield start + 1;
          yield end;
        }
        const g = range(5, 10);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([5, 6, 10]);
    });

    test("generator with rest parameters", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* yieldAll(...values) {
          yield values[0];
          yield values[1];
          yield values[2];
        }
        const g = yieldAll(10, 20, 30);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe("Generator with control flow", () => {
    test("generator with if statement", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* conditional(flag) {
          if (flag) {
            yield 1;
          } else {
            yield 2;
          }
          yield 3;
        }
        const g1 = conditional(true);
        const g2 = conditional(false);
        const results = [];
        results.push(g1.next().value);
        results.push(g1.next().value);
        results.push(g2.next().value);
        results.push(g2.next().value);
        results;
      `);
      expect(result).toEqual([1, 3, 2, 3]);
    });

    test("generator with for loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* counter(max) {
          for (var i = 0; i < max; i++) {
            yield i;
          }
        }
        const g = counter(3);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([0, 1, 2]);
    });

    test("generator with while loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* countdown(n) {
          while (n > 0) {
            yield n;
            n = n - 1;
          }
        }
        const g = countdown(3);
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([3, 2, 1]);
    });
  });

  describe("Generator expressions", () => {
    test("generator function expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const gen = function*() {
          yield 1;
          yield 2;
        };
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2]);
    });

    test("named generator function expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const gen = function* myGen() {
          yield 42;
        };
        const g = gen();
        g.next().value;
      `);
      expect(result).toBe(42);
    });
  });

  describe("Generator state management", () => {
    test("multiple generator instances are independent", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
        }
        const g1 = gen();
        const g2 = gen();
        const results = [];
        results.push(g1.next().value); // 1 from g1
        results.push(g2.next().value); // 1 from g2
        results.push(g1.next().value); // 2 from g1
        results.push(g2.next().value); // 2 from g2
        results;
      `);
      expect(result).toEqual([1, 1, 2, 2]);
    });

    test("generator maintains closure state", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* counter() {
          var count = 0;
          while (true) {
            count = count + 1;
            yield count;
            if (count >= 3) return;
          }
        }
        const g = counter();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("Async generators", () => {
    test("simple async generator", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = asyncGen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("async generator with await", async () => {
      const interpreter = new Interpreter({
        globals: {
          asyncValue: async () => 42,
        },
      });
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          const val = await asyncValue();
          yield val;
          yield val + 1;
        }
        const g = asyncGen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([42, 43]);
    });

    test("async generator returns done: true when exhausted", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* asyncGen() {
          yield 1;
        }
        const g = asyncGen();
        await g.next(); // value: 1, done: false
        const final = await g.next(); // value: undefined, done: true
        final.done;
      `);
      expect(result).toBe(true);
    });
  });

  describe("Generator methods", () => {
    test("generator.return() completes generator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        g.next(); // 1
        const returnResult = g.return(99);
        const after = g.next();
        returnResult.done && after.done;
      `);
      expect(result).toBe(true);
    });

    test("generator.return() returns provided value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        const returnResult = g.return(42);
        returnResult.value;
      `);
      expect(result).toBe(42);
    });

    test("generator.throw() throws error", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function* gen() {
            yield 1;
          }
          const g = gen();
          g.throw("error");
        `);
      }).toThrow();
    });
  });

  describe("Error handling", () => {
    test("cannot use yield outside generator", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function notAGenerator() {
            yield 1;
          }
          notAGenerator();
        `);
      }).toThrow();
    });

    test("cannot call async generator in sync mode", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          async function* asyncGen() {
            yield 1;
          }
          asyncGen();
        `);
      }).toThrow("Cannot call async generator in synchronous evaluate");
    });
  });

  describe("yield* delegation", () => {
    test("yield* with array", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield* [1, 2, 3];
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().done);
        results;
      `);
      expect(result).toEqual([1, 2, 3, true]);
    });

    test("yield* with another generator", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* inner() {
          yield 'a';
          yield 'b';
        }
        function* outer() {
          yield 1;
          yield* inner();
          yield 2;
        }
        const g = outer();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, "a", "b", 2]);
    });

    test("yield* with string (iterable)", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield* "hi";
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual(["h", "i"]);
    });

    test("yield* with nested delegation", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* level3() {
          yield 'c';
        }
        function* level2() {
          yield 'b';
          yield* level3();
        }
        function* level1() {
          yield 'a';
          yield* level2();
          yield 'd';
        }
        const g = level1();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual(["a", "b", "c", "d"]);
    });

    test("async yield* with array", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield* [1, 2, 3];
        }
        const g = gen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("async yield* with another async generator", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* inner() {
          yield 'x';
          yield 'y';
        }
        async function* outer() {
          yield 1;
          yield* inner();
          yield 2;
        }
        const g = outer();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([1, "x", "y", 2]);
    });
  });

  describe("Yields in for...of and for...in loops", () => {
    test("generator with yield inside for...of loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          for (const x of [1, 2, 3]) {
            yield x * 10;
          }
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([10, 20, 30]);
    });

    test("generator with yield inside for...in loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const obj = { a: 1, b: 2, c: 3 };
          for (const key in obj) {
            yield key;
          }
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual(["a", "b", "c"]);
    });

    test("generator with break in for...of loop", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          for (const x of [1, 2, 3, 4, 5]) {
            if (x > 3) break;
            yield x;
          }
          yield 99;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results.push(g.next().value);
        results;
      `);
      expect(result).toEqual([1, 2, 3, 99]);
    });

    test("generator with return in for...of loop", () => {
      const interpreter = new Interpreter();
      // First call should yield 1
      const result1 = interpreter.evaluate(`
        function* gen() {
          for (const x of [1, 2, 3]) {
            if (x === 2) return 42;
            yield x;
          }
        }
        gen().next().value;
      `);
      expect(result1).toBe(1);

      // Second call on same generator should return 42
      const result2 = interpreter.evaluate(`
        function* gen() {
          for (const x of [1, 2, 3]) {
            if (x === 2) return 42;
            yield x;
          }
        }
        const g = gen();
        g.next(); // yields 1
        g.next(); // returns 42
      `);
      expect(result2).toEqual({ value: 42, done: true });
    });

    test("async generator with yield inside for...of loop", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          for (const x of [1, 2, 3]) {
            yield x * 10;
          }
        }
        const g = gen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results.push((await g.next()).value);
        results;
      `);
      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe("Iterator protocol (@@iterator)", () => {
    test("generator is iterable with for...of", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const results = [];
        for (const x of gen()) {
          results.push(x);
        }
        results;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("generator instance is iterable with for...of", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 'a';
          yield 'b';
        }
        const g = gen();
        const results = [];
        for (const x of g) {
          results.push(x);
        }
        results;
      `);
      expect(result).toEqual(["a", "b"]);
    });

    test("spread operator works with generators", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const arr = [...gen()];
        arr;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    test("for...of with generator that has early return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          return 42;
          yield 2;
        }
        const results = [];
        for (const x of gen()) {
          results.push(x);
        }
        results;
      `);
      // for...of doesn't include the return value, only yielded values
      expect(result).toEqual([1]);
    });
  });

  describe("return() respecting finally blocks", () => {
    test("return() executes finally block when generator paused inside try", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const log = [];
        function* gen() {
          try {
            log.push('try-start');
            yield 1;
            log.push('after-yield');
          } finally {
            log.push('finally');
          }
          log.push('after-finally');
        }
        const g = gen();
        g.next(); // pauses at yield 1
        g.return(42); // should execute finally
        log;
      `);
      expect(result).toEqual(["try-start", "finally"]);
    });

    test("return() returns the value from finally if finally has return", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          try {
            yield 1;
          } finally {
            return 'from-finally';
          }
        }
        const g = gen();
        g.next();
        const r = g.return(42);
        r.value;
      `);
      expect(result).toBe("from-finally");
    });

    test("return() with nested try-finally executes all finally blocks", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const log = [];
        function* gen() {
          try {
            log.push('outer-try');
            try {
              log.push('inner-try');
              yield 1;
              log.push('after-inner-yield');
            } finally {
              log.push('inner-finally');
            }
            log.push('after-inner');
          } finally {
            log.push('outer-finally');
          }
        }
        const g = gen();
        g.next();
        g.return();
        log;
      `);
      expect(result).toEqual(["outer-try", "inner-try", "inner-finally", "outer-finally"]);
    });

    test("async return() executes finally block", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        const log = [];
        async function* gen() {
          try {
            log.push('try-start');
            yield 1;
            log.push('after-yield');
          } finally {
            log.push('finally');
          }
        }
        const g = gen();
        await g.next();
        await g.return(42);
        log;
      `);
      expect(result).toEqual(["try-start", "finally"]);
    });

    test("for...of calls return() when breaking early", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        const log = [];
        function* gen() {
          try {
            log.push('start');
            yield 1;
            yield 2;
            yield 3;
          } finally {
            log.push('cleanup');
          }
        }
        for (const x of gen()) {
          log.push('got-' + x);
          if (x === 1) break;
        }
        log;
      `);
      expect(result).toEqual(["start", "got-1", "cleanup"]);
    });
  });

  describe("next(value) two-way communication", () => {
    test("next(value) passes value to yield expression", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const x = yield 1;
          yield x + 10;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);   // yields 1
        results.push(g.next(5).value);  // x = 5, yields 15
        results;
      `);
      expect(result).toEqual([1, 15]);
    });

    test("first next() value is ignored", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const x = yield 1;
          yield x;
        }
        const g = gen();
        g.next(999);  // this value is ignored (no yield to receive it)
        const second = g.next(42);
        second.value;
      `);
      expect(result).toBe(42);
    });

    test("multiple yields with values passed in", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const a = yield 'first';
          const b = yield 'second';
          const c = yield 'third';
          yield a + '-' + b + '-' + c;
        }
        const g = gen();
        g.next();          // yields 'first'
        g.next('A');       // a = 'A', yields 'second'
        g.next('B');       // b = 'B', yields 'third'
        const result = g.next('C');  // c = 'C', yields 'A-B-C'
        result.value;
      `);
      expect(result).toBe("A-B-C");
    });

    test("yield expression value is undefined if next() called without argument", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const x = yield 1;
          yield x;
        }
        const g = gen();
        g.next();
        const second = g.next();  // no value passed
        second.value;
      `);
      expect(result).toBe(undefined);
    });

    test("async generator next(value) passes value to yield", async () => {
      const interpreter = new Interpreter();
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          const x = yield 1;
          yield x * 2;
        }
        const g = gen();
        const results = [];
        results.push((await g.next()).value);
        results.push((await g.next(10)).value);
        results;
      `);
      expect(result).toEqual([1, 20]);
    });

    test("yield in expression position receives value", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function* gen() {
          const sum = (yield 1) + (yield 2);
          yield sum;
        }
        const g = gen();
        g.next();       // yields 1
        g.next(10);     // first yield = 10, yields 2
        const result = g.next(20);  // second yield = 20, sum = 30, yields 30
        result.value;
      `);
      expect(result).toBe(30);
    });
  });

  describe("throw() injection", () => {
    test("basic throw() terminates generator", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
          yield 2;
          yield 3;
        }
        const g = gen();
        g.next(); // yields 1
        let caught = null;
        try {
          g.throw(new Error('injected'));
        } catch (e) {
          caught = e.message;
        }
        caught;
      `);
      expect(result).toBe("injected");
    });

    test("throw() can be caught inside generator with try/catch", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        function* gen() {
          try {
            yield 1;
            yield 2;
          } catch (e) {
            yield 'caught: ' + e.message;
          }
          yield 3;
        }
        const g = gen();
        const results = [];
        results.push(g.next().value);  // yields 1
        results.push(g.throw(new Error('oops')).value);  // caught, yields 'caught: oops'
        results.push(g.next().value);  // yields 3
        results;
      `);
      expect(result).toEqual([1, "caught: oops", 3]);
    });

    test("throw() on unstarted generator throws immediately", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        let caught = null;
        try {
          g.throw(new Error('early'));
        } catch (e) {
          caught = e.message;
        }
        caught;
      `);
      expect(result).toBe("early");
    });

    test("throw() on completed generator throws immediately", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        function* gen() {
          yield 1;
        }
        const g = gen();
        g.next();  // yields 1
        g.next();  // done
        let caught = null;
        try {
          g.throw(new Error('after done'));
        } catch (e) {
          caught = e.message;
        }
        caught;
      `);
      expect(result).toBe("after done");
    });

    test("throw() with finally block", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        const log = [];
        function* gen() {
          try {
            yield 1;
            yield 2;
          } finally {
            log.push('finally');
          }
          yield 3;
        }
        const g = gen();
        g.next();  // yields 1
        try {
          g.throw(new Error('oops'));
        } catch (e) {
          log.push('outer catch: ' + e.message);
        }
        log;
      `);
      expect(result).toEqual(["finally", "outer catch: oops"]);
    });

    test("throw() caught in inner try, finally still runs", () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = interpreter.evaluate(`
        const log = [];
        function* gen() {
          try {
            yield 1;
          } catch (e) {
            log.push('caught: ' + e.message);
          } finally {
            log.push('finally');
          }
          yield 2;
        }
        const g = gen();
        log.push('value: ' + g.next().value);  // yields 1
        log.push('value: ' + g.throw(new Error('injected')).value);  // caught, yields 2
        log;
      `);
      expect(result).toEqual(["value: 1", "caught: injected", "finally", "value: 2"]);
    });

    test("async generator throw() basic", async () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          yield 1;
          yield 2;
        }
        const g = gen();
        await g.next();  // yields 1
        let caught = null;
        try {
          await g.throw(new Error('async error'));
        } catch (e) {
          caught = e.message;
        }
        caught;
      `);
      expect(result).toBe("async error");
    });

    test("async generator throw() with try/catch", async () => {
      const interpreter = new Interpreter({ globals: { Error } });
      const result = await interpreter.evaluateAsync(`
        async function* gen() {
          try {
            yield 1;
            yield 2;
          } catch (e) {
            yield 'caught: ' + e.message;
          }
          yield 3;
        }
        const g = gen();
        const results = [];
        results.push((await g.next()).value);  // yields 1
        results.push((await g.throw(new Error('oops'))).value);  // caught, yields 'caught: oops'
        results.push((await g.next()).value);  // yields 3
        results;
      `);
      expect(result).toEqual([1, "caught: oops", 3]);
    });
  });
});
