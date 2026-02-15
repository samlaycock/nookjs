import { describe, it, expect } from "bun:test";

import { Interpreter } from "../src/interpreter";

/**
 * Comprehensive fuzzing test suite for the JavaScript interpreter
 * Tests randomly generated code to discover edge cases and potential bugs
 *
 * This suite covers:
 * - Spread and rest operators (arrays, objects, functions, destructuring)
 * - All interpreter features (arithmetic, control flow, functions, etc.)
 * - Edge cases and stress testing
 */

describe("Interpreter - Comprehensive Fuzzing", () => {
  describe("API", () => {
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    // Helper to generate random integers
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper to generate random booleans
    const randomBool = () => Math.random() > 0.5;

    // Helper to generate random strings
    const randomString = (length?: number) => {
      const len = length ?? randomInt(0, 10);
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from({ length: len }, () => chars[randomInt(0, chars.length - 1)]).join("");
    };

    // Helper to generate random arrays
    const randomArray = (length?: number) => {
      const len = length ?? randomInt(0, 10);
      return Array.from({ length: len }, () => randomInt(-100, 100));
    };

    // Helper to generate random objects
    const randomObject = (keyCount?: number) => {
      const count = keyCount ?? randomInt(0, 10);
      const obj: Record<string, any> = {};
      for (let i = 0; i < count; i++) {
        obj[`key${i}`] = randomInt(-100, 100);
      }
      return obj;
    };

    // Helper to pick random element from array
    const randomElement = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)]!;

    // ============================================================================
    // SPREAD AND REST OPERATORS FUZZING
    // ============================================================================

    describe("Spread and Rest Operators", () => {
      describe("Array Spread Fuzzing", () => {
        it("should handle random nested array spreads", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const depth = randomInt(1, 3);
            const arr = randomArray(3);

            // Build valid nested spread: [...[...[...arr]]]
            let code = `const arr = ${JSON.stringify(arr)};\n`;
            let innerCode = "arr";
            for (let d = 0; d < depth; d++) {
              innerCode = `[...${innerCode}]`;
            }
            code += innerCode + ";";

            const result = interpreter.evaluate(code);
            expect(result).toEqual(arr);
          }
        });

        it("should handle random mix of spreads and elements", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const elementCount = randomInt(1, 10);
            let code = "const arr = [1, 2, 3];\n[";
            const elements: string[] = [];

            for (let j = 0; j < elementCount; j++) {
              if (Math.random() > 0.5) {
                elements.push("...arr");
              } else {
                elements.push(String(randomInt(-100, 100)));
              }
            }

            code += elements.join(", ") + "];";
            const result = interpreter.evaluate(code);
            expect(Array.isArray(result)).toBe(true);
          }
        });

        it("should handle spreading random length arrays", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const arr = randomArray();
            const code = `[...${JSON.stringify(arr)}]`;
            const result = interpreter.evaluate(code);
            expect(result).toEqual(arr);
          }
        });

        it("should handle multiple random arrays spread together", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const arrayCount = randomInt(2, 5);
            const arrays: number[][] = [];
            let code = "";

            for (let j = 0; j < arrayCount; j++) {
              const arr = randomArray();
              arrays.push(arr);
              code += `const arr${j} = ${JSON.stringify(arr)};\n`;
            }

            code += "[" + arrays.map((_, idx) => `...arr${idx}`).join(", ") + "];";

            const result = interpreter.evaluate(code);
            const expected = arrays.flat();
            expect(result).toEqual(expected);
          }
        });
      });

      describe("Object Spread Fuzzing", () => {
        it("should handle random nested object spreads", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const depth = randomInt(1, 3);
            const obj = randomObject(3);

            // Build valid nested spread: {...{...{...obj}}}
            let code = `const obj = ${JSON.stringify(obj)};\n`;
            let innerCode = "obj";
            for (let d = 0; d < depth; d++) {
              innerCode = `{...${innerCode}}`;
            }
            code += `(${innerCode});`;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(obj);
          }
        });

        it("should handle random mix of spreads and properties", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const propCount = randomInt(1, 8);
            let code = "const obj = {x: 1, y: 2};\n({";
            const props: string[] = [];

            for (let j = 0; j < propCount; j++) {
              if (Math.random() > 0.5) {
                props.push("...obj");
              } else {
                props.push(`p${j}: ${randomInt(-100, 100)}`);
              }
            }

            code += props.join(", ") + "});";
            const result = interpreter.evaluate(code);
            expect(typeof result).toBe("object");
            expect(result).not.toBeNull();
          }
        });

        it("should handle spreading random objects", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const obj = randomObject();
            const code = `({...${JSON.stringify(obj)}})`;
            const result = interpreter.evaluate(code);
            expect(result).toEqual(obj);
          }
        });

        it("should handle random property overrides", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const key = `key${randomInt(0, 5)}`;
            const val1 = randomInt(-100, 100);
            const val2 = randomInt(-100, 100);

            const code = `({${key}: ${val1}, ...{${key}: ${val2}}})`;
            const result = interpreter.evaluate(code);
            expect(result[key]).toBe(val2); // Later value should win
          }
        });
      });

      describe("Call Spread Fuzzing", () => {
        it("should handle random number of spread arguments", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const argCount = randomInt(0, 10);
            const args = randomArray(argCount);

            const code = `
            function collect(...items) {
              return items;
            }
            collect(...${JSON.stringify(args)});
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(args);
          }
        });

        it("should handle random mix of spread and regular arguments", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const spreadCount = randomInt(1, 4);
            const regularCount = randomInt(0, 3);

            let code = "function fn(...args) { return args; }\n";
            const allArgs: number[] = [];

            code += "fn(";
            const argParts: string[] = [];

            for (let j = 0; j < spreadCount; j++) {
              const arr = randomArray(randomInt(0, 5));
              allArgs.push(...arr);
              argParts.push(`...${JSON.stringify(arr)}`);
            }

            for (let j = 0; j < regularCount; j++) {
              const val = randomInt(-100, 100);
              allArgs.push(val);
              argParts.push(String(val));
            }

            code += argParts.join(", ") + ");";

            const result = interpreter.evaluate(code);
            expect(result).toEqual(allArgs);
          }
        });

        it("should handle spreading into functions with varying parameter counts", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const paramCount = randomInt(0, 5);
            const argCount = randomInt(paramCount, paramCount + 5); // Always enough args

            const params = Array.from({ length: paramCount }, (_, idx) => `p${idx}`).join(", ");
            const args = randomArray(argCount);

            const code = `
            function fn(${params}) {
              return [${Array.from({ length: paramCount }, (_, idx) => `p${idx}`).join(", ")}];
            }
            fn(...${JSON.stringify(args)});
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(args.slice(0, paramCount));
          }
        });
      });

      describe("Array Rest Fuzzing", () => {
        it("should handle rest at random positions", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const totalLength = randomInt(5, 15);
            const restPosition = randomInt(0, totalLength - 1);
            const arr = randomArray(totalLength);

            const beforeParams = Array.from({ length: restPosition }, (_, idx) => `a${idx}`);
            const pattern = `[${beforeParams.join(", ")}${
              beforeParams.length > 0 ? ", " : ""
            }...rest]`;

            const code = `
            const ${pattern} = ${JSON.stringify(arr)};
            rest;
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(arr.slice(restPosition));
          }
        });

        it("should handle rest with random length arrays", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const arr = randomArray();
            const code = `
            const [first, ...rest] = ${JSON.stringify(arr)};
            rest;
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(arr.slice(1));
          }
        });

        it("should handle multiple destructuring patterns with rest", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const arr1 = randomArray(randomInt(3, 10));
            const arr2 = randomArray(randomInt(3, 10));

            const code = `
            const [a1, ...rest1] = ${JSON.stringify(arr1)};
            const [a2, ...rest2] = ${JSON.stringify(arr2)};
            [rest1, rest2];
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual([arr1.slice(1), arr2.slice(1)]);
          }
        });
      });

      describe("Object Rest Fuzzing", () => {
        it("should handle rest with random number of extracted properties", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const obj = randomObject(randomInt(3, 10));
            const keys = Object.keys(obj);
            const extractCount = randomInt(0, keys.length);
            const extractKeys = keys.slice(0, extractCount);

            const pattern = `{${extractKeys.join(", ")}${
              extractKeys.length > 0 ? ", " : ""
            }...rest}`;
            const code = `
            const ${pattern} = ${JSON.stringify(obj)};
            rest;
          `;

            const result = interpreter.evaluate(code);
            const expected: Record<string, any> = {};
            for (const key of keys.slice(extractCount)) {
              expected[key] = obj[key];
            }
            expect(result).toEqual(expected);
          }
        });

        it("should handle rest with random objects", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const obj = randomObject();
            const code = `
            const {key0, ...rest} = ${JSON.stringify(obj)};
            rest;
          `;

            const result = interpreter.evaluate(code);
            const { key0: _key0, ...expected } = obj;
            expect(result).toEqual(expected);
          }
        });
      });

      describe("Rest Parameters Fuzzing", () => {
        it("should handle random number of arguments with rest", () => {
          for (let i = 0; i < 100; i++) {
            const interpreter = new Interpreter();
            const argCount = randomInt(0, 15);
            const args = randomArray(argCount);

            const code = `
            function fn(...rest) {
              return rest;
            }
            fn(...${JSON.stringify(args)});
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(args);
          }
        });

        it("should handle random mix of regular and rest parameters", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const regularCount = randomInt(0, 5);
            const restCount = randomInt(0, 10);
            const totalArgs = regularCount + restCount;
            const args = randomArray(totalArgs);

            const params = Array.from({ length: regularCount }, (_, idx) => `p${idx}`);
            params.push("...rest");

            const code = `
            function fn(${params.join(", ")}) {
              return rest;
            }
            fn(...${JSON.stringify(args)});
          `;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(args.slice(regularCount));
          }
        });

        it("should handle deeply nested function calls with rest", () => {
          for (let i = 0; i < 30; i++) {
            const interpreter = new Interpreter();
            const depth = randomInt(2, 5);
            const args = randomArray(randomInt(1, 8));

            let code = "";
            for (let d = 0; d < depth; d++) {
              code += `function fn${d}(...args${d}) {\n`;
              if (d < depth - 1) {
                code += `  return fn${d + 1}(...args${d});\n`;
              } else {
                code += `  return args${d};\n`;
              }
              code += "}\n";
            }

            code += `fn0(...${JSON.stringify(args)});`;

            const result = interpreter.evaluate(code);
            expect(result).toEqual(args);
          }
        });
      });

      describe("Combined Spread/Rest Operations", () => {
        it("should handle random combinations of spread and rest", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const arr = randomArray(randomInt(5, 15));

            const code = `
            function process(...items) {
              const [first, ...rest] = items;
              return [...rest, first];
            }
            process(...${JSON.stringify(arr)});
          `;

            const result = interpreter.evaluate(code);
            const expected = [...arr.slice(1), arr[0]];
            expect(result).toEqual(expected);
          }
        });

        it("should handle random spread/rest with object and array mixing", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const arr = randomArray(randomInt(3, 8));
            const obj = randomObject(randomInt(3, 8));

            const code = `
            function fn(...args) {
              return {
                arr: [...args],
                obj: {...${JSON.stringify(obj)}}
              };
            }
            fn(...${JSON.stringify(arr)});
          `;

            const result = interpreter.evaluate(code);
            expect(result.arr).toEqual(arr);
            expect(result.obj).toEqual(obj);
          }
        });

        it("should handle random destructuring with immediate spread", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const arr = randomArray(randomInt(5, 12));

            const code = `
            const [a, ...rest] = ${JSON.stringify(arr)};
            [...rest, a];
          `;

            const result = interpreter.evaluate(code);
            const expected = [...arr.slice(1), arr[0]];
            expect(result).toEqual(expected);
          }
        });
      });

      describe("Spread/Rest Edge Cases", () => {
        it("should handle empty spread/rest repeatedly", () => {
          for (let i = 0; i < 50; i++) {
            const interpreter = new Interpreter();
            const code = `
            const arr = [];
            const result = [...arr, ...arr, ...arr];
            result;
          `;
            const result = interpreter.evaluate(code);
            expect(result).toEqual([]);
          }
        });

        it("should handle very long spread chains", () => {
          const interpreter = new Interpreter();
          const chainLength = 50;
          let code = "const arr = [1];\n";
          code += "[" + Array(chainLength).fill("...arr").join(", ") + "];";

          const result = interpreter.evaluate(code);
          expect(result).toEqual(Array(chainLength).fill(1));
        });

        it("should handle large arrays with spread/rest", () => {
          const interpreter = new Interpreter();
          const largeArray = randomArray(1000);

          const code = `
          const arr = ${JSON.stringify(largeArray)};
          const [first, ...rest] = [...arr];
          rest.length;
        `;

          const result = interpreter.evaluate(code);
          expect(result).toBe(999);
        });
      });
    });

    // ============================================================================
    // GENERAL INTERPRETER FUZZING
    // ============================================================================

    describe("Arithmetic Operations", () => {
      it("should handle random arithmetic expressions", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-1000, 1000);
          const b = randomInt(1, 1000); // Avoid division by zero
          const op = randomElement(["+", "-", "*", "/"]);

          const code = `${a} ${op} ${b}`;
          const result = interpreter.evaluate(code);

          // eslint-disable-next-line no-eval
          const expected = eval(code);
          if (op === "/") {
            expect(Math.abs(result - expected)).toBeLessThan(0.0001);
          } else {
            expect(result).toBe(expected);
          }
        }
      });

      it("should handle random complex arithmetic chains", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const length = randomInt(3, 8);
          const values: number[] = [];
          const ops: string[] = [];

          for (let j = 0; j < length; j++) {
            values.push(randomInt(-100, 100));
            if (j < length - 1) {
              ops.push(randomElement(["+", "-", "*"]));
            }
          }

          let code = values[0]!.toString();
          for (let j = 0; j < ops.length; j++) {
            code += ` ${ops[j]} ${values[j + 1]}`;
          }

          const result = interpreter.evaluate(code);
          // eslint-disable-next-line no-eval
          const expected = eval(code);
          expect(result).toBe(expected);
        }
      });

      it("should handle random modulo operations", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-1000, 1000);
          const b = randomInt(1, 100);

          const code = `${a} % ${b}`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(a % b);
        }
      });

      it("should handle random exponentiation via multiplication", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const base = randomInt(-10, 10);
          const exp = randomInt(0, 5);

          // Manually compute power since ** may not be supported
          const code = `
          let result = 1;
          for (let i = 0; i < ${exp}; i = i + 1) {
            result = result * ${base};
          }
          result;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(Math.pow(base, exp));
        }
      });
    });

    describe("Comparison Operations", () => {
      it("should handle random comparisons", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-100, 100);
          const b = randomInt(-100, 100);
          const op = randomElement(["<", "<=", ">", ">=", "===", "!=="]);

          const code = `${a} ${op} ${b}`;
          const result = interpreter.evaluate(code);
          // eslint-disable-next-line no-eval
          const expected = eval(code);
          expect(result).toBe(expected);
        }
      });

      it("should handle random equality checks with different types", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const values = [randomInt(-100, 100), `"${randomString(5)}"`, randomBool(), "null"];
          const a = randomElement(values);
          const b = randomElement(values);

          const code = `${a} === ${b}`;
          const result = interpreter.evaluate(code);
          // eslint-disable-next-line no-eval
          const expected = eval(code);
          expect(result).toBe(expected);
        }
      });

      it("should handle random chained comparisons", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(0, 100);
          const b = randomInt(0, 100);
          const c = randomInt(0, 100);

          const code = `${a} < ${b} && ${b} < ${c}`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(a < b && b < c);
        }
      });
    });

    describe("Logical Operations", () => {
      it("should handle random logical AND/OR", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomBool();
          const b = randomBool();
          const op = randomElement(["&&", "||"]);

          const code = `${a} ${op} ${b}`;
          const result = interpreter.evaluate(code);
          // eslint-disable-next-line no-eval
          const expected = eval(code);
          expect(result).toBe(expected);
        }
      });

      it("should handle random logical NOT", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const value = randomBool();

          const code = `!${value}`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(!value);
        }
      });

      it("should handle random complex logical expressions", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const a = randomBool();
          const b = randomBool();
          const c = randomBool();

          const code = `(${a} && ${b}) || ${c}`;
          const result = interpreter.evaluate(code);
          expect(result).toBe((a && b) || c);
        }
      });
    });

    describe("Variable Operations", () => {
      it("should handle random variable declarations and access", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const varName = `var${randomInt(0, 1000)}`;
          const value = randomInt(-1000, 1000);

          const code = `
          const ${varName} = ${value};
          ${varName};
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(value);
        }
      });

      it("should handle random variable reassignments", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const val1 = randomInt(-100, 100);
          const val2 = randomInt(-100, 100);

          const code = `
          let x = ${val1};
          x = ${val2};
          x;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(val2);
        }
      });

      it("should handle random multiple variable declarations", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const varCount = randomInt(2, 10);
          const values: number[] = [];
          let code = "";

          for (let j = 0; j < varCount; j++) {
            const value = randomInt(-100, 100);
            values.push(value);
            code += `const v${j} = ${value};\n`;
          }

          const sumIdx = randomInt(0, varCount - 1);
          code += `v${sumIdx};`;

          const result = interpreter.evaluate(code);
          expect(result).toBe(values[sumIdx]);
        }
      });
    });

    describe("Array Operations", () => {
      it("should handle random array access", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(1, 20));
          const idx = randomInt(0, arr.length - 1);

          const code = `
          const arr = ${JSON.stringify(arr)};
          arr[${idx}];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(arr[idx]);
        }
      });

      it("should handle random array mutations", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(5);
          const idx = randomInt(0, arr.length - 1);
          const newVal = randomInt(-100, 100);

          const code = `
          const arr = ${JSON.stringify(arr)};
          arr[${idx}] = ${newVal};
          arr[${idx}];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(newVal);
        }
      });

      it("should handle random array pushes", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(3);
          const pushCount = randomInt(1, 5);
          const values: number[] = [];

          let code = `const arr = ${JSON.stringify(arr)};\n`;
          for (let j = 0; j < pushCount; j++) {
            const val = randomInt(-100, 100);
            values.push(val);
            code += `arr.push(${val});\n`;
          }
          code += "arr.length;";

          const result = interpreter.evaluate(code);
          expect(result).toBe(arr.length + pushCount);
        }
      });

      it("should handle random array slicing", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(5, 15));
          const start = randomInt(0, arr.length - 1);
          const end = randomInt(start, arr.length);

          const code = `
          const arr = ${JSON.stringify(arr)};
          arr.slice(${start}, ${end});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual(arr.slice(start, end));
        }
      });
    });

    describe("Object Operations", () => {
      it("should handle random object property access", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const obj = randomObject(randomInt(1, 10));
          const keys = Object.keys(obj);
          const key = randomElement(keys);

          const code = `
          const obj = ${JSON.stringify(obj)};
          obj.${key};
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(obj[key]);
        }
      });

      it("should handle random computed property access", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const obj = randomObject(randomInt(1, 10));
          const keys = Object.keys(obj);
          const key = randomElement(keys);

          const code = `
          const obj = ${JSON.stringify(obj)};
          obj["${key}"];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(obj[key]);
        }
      });

      it("should handle random property assignments", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const obj = randomObject(3);
          const newKey = `newKey${randomInt(0, 100)}`;
          const newVal = randomInt(-100, 100);

          const code = `
          const obj = ${JSON.stringify(obj)};
          obj.${newKey} = ${newVal};
          obj.${newKey};
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(newVal);
        }
      });
    });

    describe("Function Operations", () => {
      it("should handle random function calls", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-100, 100);
          const b = randomInt(-100, 100);

          const code = `
          function add(x, y) {
            return x + y;
          }
          add(${a}, ${b});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(a + b);
        }
      });

      it("should handle random recursive calls", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const n = randomInt(0, 10);

          const code = `
          function factorial(n) {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
          }
          factorial(${n});
        `;

          const result = interpreter.evaluate(code);

          // Calculate expected
          let expected = 1;
          for (let j = 2; j <= n; j++) {
            expected *= j;
          }
          expect(result).toBe(expected);
        }
      });

      it("should handle random arrow functions", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-100, 100);
          const b = randomInt(-100, 100);

          const code = `
          const multiply = (x, y) => x * y;
          multiply(${a}, ${b});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(a * b);
        }
      });

      it("should handle random closures", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const outer = randomInt(-100, 100);
          const inner = randomInt(-100, 100);

          const code = `
          function makeAdder(x) {
            return function(y) {
              return x + y;
            };
          }
          const add = makeAdder(${outer});
          add(${inner});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(outer + inner);
        }
      });
    });

    describe("Control Flow", () => {
      it("should handle random if statements", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const condition = randomBool();
          const trueVal = randomInt(-100, 100);
          const falseVal = randomInt(-100, 100);

          const code = `
          if (${condition}) {
            ${trueVal};
          } else {
            ${falseVal};
          }
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(condition ? trueVal : falseVal);
        }
      });

      it("should handle random ternary operators", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const condition = randomBool();
          const trueVal = randomInt(-100, 100);
          const falseVal = randomInt(-100, 100);

          const code = `${condition} ? ${trueVal} : ${falseVal}`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(condition ? trueVal : falseVal);
        }
      });

      it("should handle random while loops", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const iterations = randomInt(0, 10);

          const code = `
          let count = 0;
          let i = 0;
          while (i < ${iterations}) {
            count = count + 1;
            i = i + 1;
          }
          count;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(iterations);
        }
      });

      it("should handle random for loops", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const iterations = randomInt(0, 10);

          const code = `
          let sum = 0;
          for (let i = 0; i < ${iterations}; i = i + 1) {
            sum = sum + i;
          }
          sum;
        `;
          const result = interpreter.evaluate(code);

          let expected = 0;
          for (let j = 0; j < iterations; j++) {
            expected += j;
          }
          expect(result).toBe(expected);
        }
      });

      it("should handle random break statements", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const breakAt = randomInt(1, 10);

          const code = `
          let count = 0;
          for (let i = 0; i < 100; i = i + 1) {
            if (i === ${breakAt}) break;
            count = count + 1;
          }
          count;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(breakAt);
        }
      });

      it("should handle random continue statements", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const skipVal = randomInt(0, 9);

          const code = `
          let sum = 0;
          for (let i = 0; i < 10; i = i + 1) {
            if (i === ${skipVal}) continue;
            sum = sum + i;
          }
          sum;
        `;
          const result = interpreter.evaluate(code);

          let expected = 0;
          for (let j = 0; j < 10; j++) {
            if (j === skipVal) continue;
            expected += j;
          }
          expect(result).toBe(expected);
        }
      });
    });

    describe("String Operations", () => {
      it("should handle random string concatenation", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const str1 = randomString(5);
          const str2 = randomString(5);

          const code = `"${str1}" + "${str2}"`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(str1 + str2);
        }
      });

      it("should handle random string charAt operations", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const length = randomInt(1, 10);
          const str = randomString(length);
          if (str.length === 0) continue; // Skip empty strings

          const idx = randomInt(0, str.length - 1);

          // Use charAt since direct indexing may not be supported
          const code = `
          const s = ${JSON.stringify(str)};
          s.charAt(${idx});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(str.charAt(idx));
        }
      });

      it("should handle random string length", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const str = randomString();

          const code = `"${str}".length`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(str.length);
        }
      });
    });

    describe("Template Literals", () => {
      it("should handle random template literal expressions", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const val1 = randomInt(-100, 100);
          const val2 = randomInt(-100, 100);

          const code = `\`Result: \${${val1} + ${val2}}\``;
          const result = interpreter.evaluate(code);
          expect(result).toBe(`Result: ${val1 + val2}`);
        }
      });

      it("should handle random multi-expression templates", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-100, 100);
          const b = randomInt(-100, 100);
          const c = randomInt(-100, 100);

          const code = `\`\${${a}}, \${${b}}, \${${c}}\``;
          const result = interpreter.evaluate(code);
          expect(result).toBe(`${a}, ${b}, ${c}`);
        }
      });
    });

    describe("Destructuring", () => {
      it("should handle random array destructuring", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(2, 10));

          const code = `
          const [first, second] = ${JSON.stringify(arr)};
          [first, second];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([arr[0], arr[1]]);
        }
      });

      it("should handle random object destructuring", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const obj = {
            key0: randomInt(-100, 100),
            key1: randomInt(-100, 100),
          };

          const code = `
          const {key0, key1} = ${JSON.stringify(obj)};
          [key0, key1];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([obj.key0, obj.key1]);
        }
      });

      it("should handle random nested destructuring", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const inner = randomArray(2);
          const outer = [inner, randomInt(-100, 100)];

          const code = `
          const [[a, b], c] = ${JSON.stringify(outer)};
          [a, b, c];
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual([inner[0], inner[1], outer[1]]);
        }
      });
    });

    describe("Try-Catch", () => {
      it("should handle random error catching", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const shouldThrow = randomBool();
          const normalVal = randomInt(-100, 100);
          const errorVal = randomInt(-100, 100);

          const code = `
          try {
            ${shouldThrow ? "throw new Error('test');" : ""}
            ${normalVal};
          } catch (e) {
            ${errorVal};
          }
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(shouldThrow ? errorVal : normalVal);
        }
      });

      it("should handle random finally blocks", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const val = randomInt(-100, 100);

          const code = `
          let x = 0;
          try {
            x = ${val};
          } finally {
            x = x + 1;
          }
          x;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(val + 1);
        }
      });
    });

    describe("Complex Scenarios", () => {
      it("should handle random mixed operations", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const a = randomInt(-50, 50);
          const b = randomInt(-50, 50);
          const c = randomInt(-50, 50);

          const code = `
          function compute(x, y, z) {
            const sum = x + y;
            const product = sum * z;
            return product;
          }
          compute(${a}, ${b}, ${c});
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe((a + b) * c);
        }
      });

      it("should handle random data transformations", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(5, 10));

          const code = `
          const arr = ${JSON.stringify(arr)};
          const doubled = arr.map(x => x * 2);
          doubled;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual(arr.map((x) => x * 2));
        }
      });

      it("should handle random filtering operations", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(5, 10));
          const threshold = randomInt(-50, 50);

          const code = `
          const arr = ${JSON.stringify(arr)};
          const filtered = arr.filter(x => x > ${threshold});
          filtered;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toEqual(arr.filter((x) => x > threshold));
        }
      });

      it("should handle random reduce operations", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(3, 8));
          const initial = randomInt(-50, 50);

          const code = `
          const arr = ${JSON.stringify(arr)};
          const sum = arr.reduce((acc, x) => acc + x, ${initial});
          sum;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(arr.reduce((acc, x) => acc + x, initial));
        }
      });

      it("should handle random object transformations", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const obj = randomObject(randomInt(3, 6));
          const multiplier = randomInt(2, 5);
          const keys = Object.keys(obj);

          // Manually iterate since Object.keys may not be available
          const code = `
          const obj = ${JSON.stringify(obj)};
          const result = {};
          ${keys
            .map((key) => `result["${key}"] = obj["${key}"] * ${multiplier};`)
            .join("\n          ")}
          result;
        `;
          const result = interpreter.evaluate(code);

          const expected: Record<string, any> = {};
          for (const key of keys) {
            expected[key] = obj[key] * multiplier;
          }
          expect(result).toEqual(expected);
        }
      });
    });

    describe("Edge Cases and Stress Testing", () => {
      it("should handle deeply nested function calls", () => {
        for (let i = 0; i < 20; i++) {
          const interpreter = new Interpreter();
          const depth = randomInt(5, 15);
          const initial = randomInt(-10, 10);

          let code = `
          function nest(n, val) {
            if (n === 0) return val;
            return nest(n - 1, val + 1);
          }
          nest(${depth}, ${initial});
        `;

          const result = interpreter.evaluate(code);
          expect(result).toBe(initial + depth);
        }
      });

      it("should handle large array operations", () => {
        for (let i = 0; i < 10; i++) {
          const interpreter = new Interpreter();
          const size = randomInt(100, 500);

          const code = `
          const arr = [];
          for (let i = 0; i < ${size}; i = i + 1) {
            arr.push(i);
          }
          arr.length;
        `;

          const result = interpreter.evaluate(code);
          expect(result).toBe(size);
        }
      });

      it("should handle random variable scoping", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const outer = randomInt(-100, 100);
          const inner = randomInt(-100, 100);

          const code = `
          let x = ${outer};
          {
            let x = ${inner};
            x;
          }
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(inner);
        }
      });

      it("should handle random hoisting scenarios", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const val = randomInt(-100, 100);

          const code = `
          function test() {
            return x;
            const x = ${val};
          }
        `;

          // This should throw because of TDZ
          expect(() => interpreter.evaluate(`${code}\ntest();`)).toThrow();
        }
      });

      it("should handle random method chaining", () => {
        for (let i = 0; i < 30; i++) {
          const interpreter = new Interpreter();
          const arr = randomArray(randomInt(5, 10));

          const code = `
          const arr = ${JSON.stringify(arr)};
          arr
            .filter(x => x > 0)
            .map(x => x * 2)
            .reduce((a, b) => a + b, 0);
        `;

          const result = interpreter.evaluate(code);
          const expected = arr
            .filter((x) => x > 0)
            .map((x) => x * 2)
            .reduce((a, b) => a + b, 0);
          expect(result).toBe(expected);
        }
      });

      it("should handle deep nesting stress test", () => {
        const interpreter = new Interpreter();
        const depth = 10;
        let code = "";

        // Build nested functions with proper syntax
        for (let i = 0; i < depth; i++) {
          code += `function fn${i}(...args${i}) {\n`;
          if (i < depth - 1) {
            code += `  return fn${i + 1}(...args${i});\n`;
          } else {
            code += `  return args${i};\n`;
          }
          code += "}\n";
        }

        const args = randomArray(5);
        code += `fn0(...${JSON.stringify(args)});`;

        const result = interpreter.evaluate(code);
        expect(result).toEqual(args);
      });

      it("should handle spread/rest in loops", () => {
        const interpreter = new Interpreter();
        const iterations = 10;

        const code = `
        const results = [];
        for (let i = 0; i < ${iterations}; i++) {
          const arr = [i, i + 1, i + 2];
          const [first, ...rest] = arr;
          results.push([...rest, first]);
        }
        results;
      `;

        const result = interpreter.evaluate(code);
        expect(result.length).toBe(iterations);
        for (let i = 0; i < iterations; i++) {
          expect(result[i]).toEqual([i + 1, i + 2, i]);
        }
      });
    });

    describe("Type Coercion", () => {
      it("should handle random number to string coercion", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const num = randomInt(-1000, 1000);
          const str = randomString(5);

          const code = `${num} + "${str}"`;
          const result = interpreter.evaluate(code);
          expect(result).toBe(num + str);
        }
      });

      it("should handle random boolean coercion in conditions", () => {
        for (let i = 0; i < 50; i++) {
          const interpreter = new Interpreter();
          const values = [0, 1, "", "hello", null];
          const val = randomElement(values);
          const trueVal = randomInt(-100, 100);
          const falseVal = randomInt(-100, 100);

          const code = `
          const x = ${JSON.stringify(val)};
          if (x) {
            ${trueVal};
          } else {
            ${falseVal};
          }
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(val ? trueVal : falseVal);
        }
      });
    });

    describe("Nullish and Undefined", () => {
      it("should handle random null checks", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const isNull = randomBool();
          const val = randomInt(-100, 100);

          const code = `
          const x = ${isNull ? "null" : val};
          x === null;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(isNull);
        }
      });

      it("should handle random undefined checks", () => {
        for (let i = 0; i < 100; i++) {
          const interpreter = new Interpreter();
          const isDefined = randomBool();
          const val = randomInt(-100, 100);

          // Use explicit undefined variable check since void may not be supported
          const code = `
          let x;
          let undef;
          ${isDefined ? `x = ${val};` : ""}
          x === undef;
        `;
          const result = interpreter.evaluate(code);
          expect(result).toBe(!isDefined);
        }
      });
    });
  });
});
