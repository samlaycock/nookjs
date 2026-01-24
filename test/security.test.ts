import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

describe("Security: Prototype Pollution Prevention", () => {
  describe("__proto__ access blocking", () => {
    it("should prevent __proto__ assignment via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj["__proto__"]["polluted"] = "hacked";
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent __proto__ assignment via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj.__proto__ = {};
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent __proto__ access via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let proto = obj["__proto__"];
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent __proto__ access via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let proto = obj.__proto__;
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent __proto__ in object literals", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {
            "__proto__": { polluted: true }
          };
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent __proto__ pollution through nested objects", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = { nested: {} };
          obj.nested["__proto__"] = { evil: true };
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });
  });

  describe("constructor access blocking", () => {
    it("should prevent constructor assignment via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj["constructor"] = null;
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });

    it("should prevent constructor assignment via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj.constructor = null;
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });

    it("should prevent constructor access via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let ctor = obj["constructor"];
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });

    it("should prevent constructor access via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let ctor = obj.constructor;
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });

    it("should prevent constructor in object literals", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {
            constructor: null
          };
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });
  });

  describe("prototype access blocking", () => {
    it("should prevent prototype assignment via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj["prototype"] = {};
        `);
      }).toThrow(
        "Property name 'prototype' is not allowed for security reasons",
      );
    });

    it("should prevent prototype assignment via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          obj.prototype = {};
        `);
      }).toThrow(
        "Property name 'prototype' is not allowed for security reasons",
      );
    });

    it("should prevent prototype access via computed property", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let proto = obj["prototype"];
        `);
      }).toThrow(
        "Property name 'prototype' is not allowed for security reasons",
      );
    });

    it("should prevent prototype access via dot notation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let proto = obj.prototype;
        `);
      }).toThrow(
        "Property name 'prototype' is not allowed for security reasons",
      );
    });

    it("should prevent prototype in object literals", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {
            prototype: {}
          };
        `);
      }).toThrow(
        "Property name 'prototype' is not allowed for security reasons",
      );
    });
  });

  describe("other dangerous properties blocking", () => {
    const dangerousProps = [
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__",
    ];

    dangerousProps.forEach((prop) => {
      it(`should prevent ${prop} assignment via computed property`, () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            obj["${prop}"] = null;
          `);
        }).toThrow(
          `Property name '${prop}' is not allowed for security reasons`,
        );
      });

      it(`should prevent ${prop} access via computed property`, () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {};
            let val = obj["${prop}"];
          `);
        }).toThrow(
          `Property name '${prop}' is not allowed for security reasons`,
        );
      });

      it(`should prevent ${prop} in object literals`, () => {
        const interpreter = new Interpreter();
        expect(() => {
          interpreter.evaluate(`
            let obj = {
              "${prop}": null
            };
          `);
        }).toThrow(
          `Property name '${prop}' is not allowed for security reasons`,
        );
      });
    });
  });

  describe("complex attack scenarios", () => {
    it("should prevent pollution through function returns", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function getObject() {
            return {};
          }
          let obj = getObject();
          obj["__proto__"]["polluted"] = true;
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent pollution through array of objects", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let arr = [{}];
          arr[0]["__proto__"] = { evil: true };
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent pollution through nested property chains", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = { a: { b: { c: {} } } };
          obj.a.b.c["__proto__"] = { bad: true };
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent pollution through computed property with string concatenation", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {};
          let key = "__" + "proto" + "__";
          obj[key] = { polluted: true };
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent constructor access through method calls", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = {
            getData: function() {
              return this;
            }
          };
          let self = obj.getData();
          let ctor = self["constructor"];
        `);
      }).toThrow(
        "Property name 'constructor' is not allowed for security reasons",
      );
    });

    it("should prevent prototype pollution through loops", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let props = ["__proto__"];
          for (let i = 0; i < props.length; i++) {
            let obj = {};
            obj[props[i]] = { evil: true };
          }
        `);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });
  });

  describe("safe operations still work", () => {
    it("should allow normal property assignment", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        obj.normalProp = "safe";
        obj.normalProp
      `);
      expect(result).toBe("safe");
    });

    it("should allow normal property access", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = { key: "value" };
        obj.key
      `);
      expect(result).toBe("value");
    });

    it("should allow computed property with safe names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        let key = "safe" + "Key";
        obj[key] = 42;
        obj[key]
      `);
      expect(result).toBe(42);
    });

    it("should allow object literals with safe properties", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {
          name: "test",
          value: 123,
          nested: { inner: true }
        };
        obj.name + obj.value
      `);
      expect(result).toBe("test123");
    });

    it("should allow property names that contain dangerous words but aren't exact matches", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {
          myConstructor: "safe",
          proto: "also safe",
          __protoCustom: "still safe"
        };
        obj.myConstructor + obj.proto
      `);
      expect(result).toBe("safealso safe");
    });

    it("should allow .length property access", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let arr = [1, 2, 3];
        let str = "hello";
        arr.length + str.length
      `);
      expect(result).toBe(8);
    });
  });

  describe("host function protection", () => {
    it("should allow calling host functions passed as globals", () => {
      const hostFunction = (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { myFunc: hostFunction },
      });

      // Host functions CAN now be called
      expect(interpreter.evaluate("myFunc(5)")).toBe(10);
    });

    it("should prevent accessing properties on host functions", () => {
      const hostFunction = (x: number) => x * 2;
      const interpreter = new Interpreter({
        globals: { myFunc: hostFunction },
      });

      // Cannot access properties on host functions
      expect(() => {
        interpreter.evaluate("myFunc.name");
      }).toThrow("Cannot access properties on host functions");
    });

    it("should allow accessing host object properties", () => {
      const hostObject = {
        value: 100,
        name: "test",
        nested: {
          inner: 42,
        },
      };
      const interpreter = new Interpreter({
        globals: { obj: hostObject },
      });

      // Can access object properties
      expect(interpreter.evaluate("obj.value")).toBe(100);
      expect(interpreter.evaluate("obj.name")).toBe("test");
      expect(interpreter.evaluate("obj.nested.inner")).toBe(42);
    });

    it("should wrap and allow calling methods on host objects", () => {
      const hostObject = {
        value: 100,
        method: function () {
          return this.value * 2;
        },
      };
      const interpreter = new Interpreter({
        globals: { obj: hostObject },
      });

      // With ReadOnlyProxy architecture, methods on host objects ARE wrapped as HostFunctionValue
      // This is necessary to support Math.floor(), console.log(), etc.
      const result = interpreter.evaluate("obj.method()");
      expect(result).toBe(200);
    });

    it("should allow calling interpreter-created functions", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        function myFunc(x) {
          return x * 2;
        }
        myFunc(5)
      `);
      expect(result).toBe(10);
    });

    it("should allow calling arrow functions in globals (created in sandbox)", () => {
      const interpreter = new Interpreter();
      // First create a function in the sandbox
      interpreter.evaluate(`
        let myFunc = x => x * 2;
      `);
      // Then call it
      const result = interpreter.evaluate("myFunc(5)");
      expect(result).toBe(10);
    });
  });

  describe("strict prototype access policy", () => {
    it("should block inherited Object.prototype access", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let obj = { a: 1 };
          obj.toString
        `);
      }).toThrow("Access to inherited property 'toString' is not allowed");
    });

    it("should block inherited Array.prototype access", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          let arr = [1, 2, 3];
          arr.toString
        `);
      }).toThrow("Array method 'toString' not supported");
    });

    it("should block inherited Function.prototype access on sandbox functions", () => {
      const interpreter = new Interpreter();
      expect(() => {
        interpreter.evaluate(`
          function foo() { return 1; }
          foo.call
        `);
      }).toThrow("Property name 'call' is not allowed for security reasons");
    });
  });

  describe("edge cases", () => {
    it("should handle empty property name differently from dangerous ones", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        obj[""] = "empty key is allowed";
        obj[""]
      `);
      expect(result).toBe("empty key is allowed");
    });

    it("should handle numeric property names", () => {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(`
        let obj = {};
        obj[123] = "numeric key";
        obj["123"]
      `);
      expect(result).toBe("numeric key");
    });

    it("should prevent dangerous properties even with injected globals", () => {
      const interpreter = new Interpreter({
        globals: { data: { value: 100 } },
      });
      expect(() => {
        interpreter.evaluate(`data["__proto__"] = { evil: true }`);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });

    it("should prevent pollution across multiple evaluate calls", () => {
      const interpreter = new Interpreter();
      interpreter.evaluate(`let obj = { safe: true }`);

      expect(() => {
        interpreter.evaluate(`obj["__proto__"] = { bad: true }`);
      }).toThrow(
        "Property name '__proto__' is not allowed for security reasons",
      );
    });
  });
});
