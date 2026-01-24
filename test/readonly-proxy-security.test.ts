import { describe, expect, it } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ReadOnlyProxy } from "../src/readonly-proxy";

describe("ReadOnlyProxy Security", () => {
  describe("Prototype chain protection", () => {
    it("should block Object.getPrototypeOf from returning the real prototype", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const proto = Object.getPrototypeOf(wrapped);
      expect(proto).toBe(null);
    });

    it("should prevent prototype pollution via Object.getPrototypeOf", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const proto = Object.getPrototypeOf(wrapped);

      // proto is null, so attempting to add properties should fail
      expect(() => {
        (proto as any).evil = "EVIL";
      }).toThrow();

      // Verify the wrapped object is not affected
      expect((wrapped as any).evil).toBeUndefined();
    });

    it("should prevent prototype pollution in interpreter context", () => {
      const testObj = { value: 42 };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      // Accessing obj in the interpreter should return a proxied version
      expect(interpreter.evaluate("obj.value")).toBe(42);

      // Verify the original object is not polluted
      expect((testObj as any).evil).toBeUndefined();
    });
  });

  describe("Dangerous property access via proxy", () => {
    it("should block __proto__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).__proto__;
      }).toThrow("Cannot access __proto__ on global 'obj'");
    });

    it("should block constructor access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).constructor;
      }).toThrow("Cannot access constructor on global 'obj'");
    });

    it("should block prototype access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).prototype;
      }).toThrow("Cannot access prototype on global 'obj'");
    });

    it("should block __defineGetter__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).__defineGetter__;
      }).toThrow("Cannot access __defineGetter__ on global 'obj'");
    });

    it("should block __defineSetter__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).__defineSetter__;
      }).toThrow("Cannot access __defineSetter__ on global 'obj'");
    });

    it("should block __lookupGetter__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).__lookupGetter__;
      }).toThrow("Cannot access __lookupGetter__ on global 'obj'");
    });

    it("should block __lookupSetter__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).__lookupSetter__;
      }).toThrow("Cannot access __lookupSetter__ on global 'obj'");
    });

    it("should block valueOf access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).valueOf;
      }).toThrow("Cannot access valueOf on global 'obj'");
    });

    it("should block toLocaleString access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).toLocaleString;
      }).toThrow("Cannot access toLocaleString on global 'obj'");
    });

    it("should block hasOwnProperty access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).hasOwnProperty;
      }).toThrow("Cannot access hasOwnProperty on global 'obj'");
    });

    it("should block isPrototypeOf access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).isPrototypeOf;
      }).toThrow("Cannot access isPrototypeOf on global 'obj'");
    });

    it("should block propertyIsEnumerable access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).propertyIsEnumerable;
      }).toThrow("Cannot access propertyIsEnumerable on global 'obj'");
    });

    it("should block apply access in interpreter context", () => {
      const testFunc = () => 42;
      const testObj = { method: testFunc };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.method.apply");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should block call access in interpreter context", () => {
      const testFunc = () => 42;
      const testObj = { method: testFunc };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.method.call");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should block bind access in interpreter context", () => {
      const testFunc = () => 42;
      const testObj = { method: testFunc };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.method.bind");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should block arguments access in interpreter context", () => {
      const testFunc = () => 42;
      const testObj = { method: testFunc };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.method.arguments");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should block caller access in interpreter context", () => {
      const testFunc = () => 42;
      const testObj = { method: testFunc };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.method.caller");
      }).toThrow("Cannot access properties on host functions");
    });
  });

  describe("Property modification protection via proxy", () => {
    it("should block setting properties", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        (wrapped as any).value = 100;
      }).toThrow("Cannot modify property 'value' on global 'obj' (read-only)");
    });

    it("should block adding new properties", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        (wrapped as any).newProp = "test";
      }).toThrow("Cannot modify property 'newProp' on global 'obj' (read-only)");
    });

    it("should block deleting properties", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        delete (wrapped as any).value;
      }).toThrow("Cannot delete property 'value' from global 'obj' (read-only)");
    });

    it("should block Object.defineProperty", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Object.defineProperty(wrapped, "newProp", { value: 100 });
      }).toThrow("Cannot define property 'newProp' on global 'obj' (read-only)");
    });

    it("should block Object.setPrototypeOf", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Object.setPrototypeOf(wrapped, {});
      }).toThrow("Cannot set prototype of global 'obj' (read-only)");
    });
  });

  describe("Nested object protection", () => {
    it("should recursively protect nested objects", () => {
      const testObj = {
        level1: {
          level2: {
            value: 42,
          },
        },
      };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      // Can read nested values
      expect((wrapped as any).level1.level2.value).toBe(42);

      // Cannot modify nested values
      expect(() => {
        (wrapped as any).level1.level2.value = 100;
      }).toThrow("Cannot modify property 'value' on global 'obj.level1.level2' (read-only)");
    });

    it("should block __proto__ on nested objects", () => {
      const testObj = {
        nested: { value: 42 },
      };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any).nested.__proto__;
      }).toThrow("Cannot access __proto__ on global 'obj.nested'");
    });

    it("should block Object.getPrototypeOf on nested objects", () => {
      const testObj = {
        nested: { value: 42 },
      };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const nested = (wrapped as any).nested;
      const proto = Object.getPrototypeOf(nested);
      expect(proto).toBe(null);
    });
  });

  describe("Array protection", () => {
    it("should protect array elements from modification", () => {
      const arr = [1, 2, 3];
      const wrapped = ReadOnlyProxy.wrap(arr, "arr");

      expect(() => {
        (wrapped as any)[0] = 999;
      }).toThrow("Cannot modify property '0' on global 'arr' (read-only)");
    });

    it("should block __proto__ on arrays", () => {
      const arr = [1, 2, 3];
      const wrapped = ReadOnlyProxy.wrap(arr, "arr");

      expect(() => {
        void (wrapped as any).__proto__;
      }).toThrow("Cannot access __proto__ on global 'arr'");
    });
  });

  describe("Symbol access protection", () => {
    const symbolCases: Array<{ symbol: symbol; name: string }> = [
      { symbol: Symbol.toStringTag, name: "Symbol(Symbol.toStringTag)" },
      { symbol: Symbol.toPrimitive, name: "Symbol(Symbol.toPrimitive)" },
      { symbol: Symbol.hasInstance, name: "Symbol(Symbol.hasInstance)" },
      { symbol: Symbol.unscopables, name: "Symbol(Symbol.unscopables)" },
      { symbol: Symbol.species, name: "Symbol(Symbol.species)" },
      { symbol: Symbol.match, name: "Symbol(Symbol.match)" },
      { symbol: Symbol.matchAll, name: "Symbol(Symbol.matchAll)" },
      { symbol: Symbol.replace, name: "Symbol(Symbol.replace)" },
      { symbol: Symbol.search, name: "Symbol(Symbol.search)" },
      { symbol: Symbol.split, name: "Symbol(Symbol.split)" },
      {
        symbol: Symbol.isConcatSpreadable,
        name: "Symbol(Symbol.isConcatSpreadable)",
      },
    ];

    it("should block Symbol.toStringTag access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any)[Symbol.toStringTag];
      }).toThrow("Cannot access Symbol(Symbol.toStringTag) on global 'obj'");
    });

    it("should block Symbol.toPrimitive access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any)[Symbol.toPrimitive];
      }).toThrow("Cannot access Symbol(Symbol.toPrimitive) on global 'obj'");
    });

    it("should block Symbol.hasInstance access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        void (wrapped as any)[Symbol.hasInstance];
      }).toThrow("Cannot access Symbol(Symbol.hasInstance) on global 'obj'");
    });

    symbolCases.forEach(({ symbol, name }) => {
      it(`should block ${name} access`, () => {
        const testObj = { value: 42 };
        const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

        expect(() => {
          void (wrapped as any)[symbol];
        }).toThrow(`Cannot access ${name} on global 'obj'`);
      });
    });
  });

  describe("Iterator wrapping", () => {
    it("should wrap values yielded by iterators", () => {
      const arr = [{ secret: "TOP" }];
      const wrapped = ReadOnlyProxy.wrap(arr, "arr");

      const iterator = (wrapped as any)[Symbol.iterator]();
      const first = iterator.next().value;

      expect(() => {
        first.secret = "HACKED";
      }).toThrow("Cannot modify property 'secret' on global 'arr[]' (read-only)");
    });

    it("should wrap values when iterating inside interpreter", () => {
      const interpreter = new Interpreter({
        globals: { arr: [{ secret: "TOP" }] },
      });

      expect(() => {
        interpreter.evaluate(`
          const obj = [...arr][0];
          obj.secret = "HACKED";
        `);
      }).toThrow("Cannot modify property 'secret' on global 'arr[]' (read-only)");
    });

    it("should wrap values yielded by async iterators", async () => {
      async function* gen() {
        yield { secret: "TOP" };
      }

      const wrapped = ReadOnlyProxy.wrap(gen(), "gen");
      const iterator = (wrapped as any)[Symbol.asyncIterator]();
      const result = await iterator.next();

      expect(() => {
        result.value.secret = "HACKED";
      }).toThrow("Cannot modify property 'secret' on global 'gen[]' (read-only)");
    });
  });

  describe("Reflect API bypass prevention", () => {
    it("should block Reflect.set", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Reflect.set(wrapped, "value", 100);
      }).toThrow("Cannot modify property 'value' on global 'obj' (read-only)");
    });

    it("should block Reflect.get with dangerous properties", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Reflect.get(wrapped, "__proto__");
      }).toThrow("Cannot access __proto__ on global 'obj'");
    });

    it("should block Reflect.defineProperty", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Reflect.defineProperty(wrapped, "newProp", { value: 100 });
      }).toThrow("Cannot define property 'newProp' on global 'obj' (read-only)");
    });

    it("should block Reflect.setPrototypeOf", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      expect(() => {
        Reflect.setPrototypeOf(wrapped, {});
      }).toThrow("Cannot set prototype of global 'obj' (read-only)");
    });

    it("should return null for Reflect.getPrototypeOf", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const proto = Reflect.getPrototypeOf(wrapped);
      expect(proto).toBe(null);
    });
  });

  describe("Computed property access", () => {
    it("should block computed __proto__ access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const propName = "__proto__";
      expect(() => {
        void (wrapped as any)[propName];
      }).toThrow("Cannot access __proto__ on global 'obj'");
    });

    it("should block computed constructor access", () => {
      const testObj = { value: 42 };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      const propName = "constructor";
      expect(() => {
        void (wrapped as any)[propName];
      }).toThrow("Cannot access constructor on global 'obj'");
    });
  });

  describe("valueOf() exploit prevention", () => {
    it("should block valueOf() access that could bypass proxy", () => {
      const testObj = { secret: "CONFIDENTIAL" };
      const wrapped = ReadOnlyProxy.wrap(testObj, "obj");

      // valueOf() used to return the unwrapped object, allowing bypass
      expect(() => {
        void (wrapped as any).valueOf;
      }).toThrow("Cannot access valueOf on global 'obj'");
    });

    it("should prevent modification via valueOf() bypass", () => {
      const testObj = { secret: "CONFIDENTIAL" };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      // This used to work: obj.valueOf().secret = "HACKED"
      expect(() => {
        interpreter.evaluate("obj.valueOf()");
      }).toThrow("Cannot access valueOf on global 'obj'");

      // Original object should remain unmodified
      expect(testObj.secret).toBe("CONFIDENTIAL");
    });

    it("should block hasOwnProperty() which could probe internal state", () => {
      const testObj = { secret: "CONFIDENTIAL" };
      const interpreter = new Interpreter({ globals: { obj: testObj } });

      expect(() => {
        interpreter.evaluate("obj.hasOwnProperty('secret')");
      }).toThrow("Cannot access hasOwnProperty on global 'obj'");
    });
  });
});
