import { describe, it, test, expect, beforeEach } from "bun:test";

import { Interpreter } from "../src/interpreter";
import { ES2023, ES2024 } from "../src/presets";

describe("Arrays", () => {
  describe("ES5", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter();
    });

    describe("Array literals", () => {
      test("empty array", () => {
        const result = interpreter.evaluate("[]");
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      test("array with numbers", () => {
        const result = interpreter.evaluate("[1, 2, 3]");
        expect(result).toEqual([1, 2, 3]);
      });

      test("array with mixed types", () => {
        const result = interpreter.evaluate('[1, "two", true]');
        expect(result).toEqual([1, "two", true]);
      });

      test("array with expressions", () => {
        const result = interpreter.evaluate("[1 + 1, 2 * 3, 10 - 5]");
        expect(result).toEqual([2, 6, 5]);
      });

      test("nested arrays", () => {
        const result = interpreter.evaluate("[[1, 2], [3, 4]]");
        expect(result).toEqual([
          [1, 2],
          [3, 4],
        ]);
      });

      test("array in variable", () => {
        const code = `
              let arr = [1, 2, 3];
              arr
            `;
        expect(interpreter.evaluate(code)).toEqual([1, 2, 3]);
      });
    });

    describe("Array indexing", () => {
      test("access first element", () => {
        expect(interpreter.evaluate("[10, 20, 30][0]")).toBe(10);
      });

      test("access middle element", () => {
        expect(interpreter.evaluate("[10, 20, 30][1]")).toBe(20);
      });

      test("access last element", () => {
        expect(interpreter.evaluate("[10, 20, 30][2]")).toBe(30);
      });

      test("access from variable", () => {
        const code = `
              let arr = [5, 10, 15];
              arr[1]
            `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      test("access with expression index", () => {
        const code = `
              let arr = [1, 2, 3, 4, 5];
              let i = 2;
              arr[i + 1]
            `;
        expect(interpreter.evaluate(code)).toBe(4);
      });

      test("out of bounds returns undefined", () => {
        expect(interpreter.evaluate("[1, 2, 3][10]")).toBeUndefined();
      });

      test("negative index returns undefined", () => {
        expect(interpreter.evaluate("[1, 2, 3][-1]")).toBeUndefined();
      });

      test("access nested array", () => {
        expect(interpreter.evaluate("[[1, 2], [3, 4]][0][1]")).toBe(2);
      });
    });

    describe("Array length property", () => {
      test("length of empty array", () => {
        expect(interpreter.evaluate("[].length")).toBe(0);
      });

      test("length of array with elements", () => {
        expect(interpreter.evaluate("[1, 2, 3, 4, 5].length")).toBe(5);
      });

      test("length from variable", () => {
        const code = `
              let arr = [10, 20, 30];
              arr.length
            `;
        expect(interpreter.evaluate(code)).toBe(3);
      });

      test("use length in expression", () => {
        const code = `
              let arr = [1, 2, 3];
              arr.length + 10
            `;
        expect(interpreter.evaluate(code)).toBe(13);
      });

      test("use length in conditional", () => {
        const code = `
              let arr = [1, 2];
              if (arr.length > 1) {
                1
              } else {
                0
              }
            `;
        expect(interpreter.evaluate(code)).toBe(1);
      });
    });

    describe("Array assignment", () => {
      test("assign to array element", () => {
        const code = `
              let arr = [1, 2, 3];
              arr[1] = 99;
              arr[1]
            `;
        expect(interpreter.evaluate(code)).toBe(99);
      });

      test("modify first element", () => {
        const code = `
              let arr = [10, 20, 30];
              arr[0] = 5;
              arr
            `;
        expect(interpreter.evaluate(code)).toEqual([5, 20, 30]);
      });

      test("modify last element", () => {
        const code = `
              let arr = [1, 2, 3];
              arr[2] = 100;
              arr
            `;
        expect(interpreter.evaluate(code)).toEqual([1, 2, 100]);
      });

      test("assignment with expression", () => {
        const code = `
              let arr = [0, 0, 0];
              let i = 1;
              arr[i] = i * 10;
              arr[i]
            `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      test("assignment returns value", () => {
        const code = `
              let arr = [1, 2, 3];
              arr[0] = 42
            `;
        expect(interpreter.evaluate(code)).toBe(42);
      });
    });

    describe("Arrays in loops", () => {
      test("iterate over array with while", () => {
        const code = `
              let arr = [1, 2, 3];
              let sum = 0;
              let i = 0;
              while (i < arr.length) {
                sum = sum + arr[i];
                i = i + 1;
              }
              sum
            `;
        expect(interpreter.evaluate(code)).toBe(6);
      });

      test("build array in loop", () => {
        const code = `
              let arr = [0, 0, 0];
              let i = 0;
              while (i < arr.length) {
                arr[i] = i * 10;
                i = i + 1;
              }
              arr
            `;
        expect(interpreter.evaluate(code)).toEqual([0, 10, 20]);
      });

      test("find element in array", () => {
        const code = `
              let arr = [5, 10, 15, 20];
              let target = 15;
              let found = 0;
              let i = 0;
              while (i < arr.length) {
                if (arr[i] === target) {
                  found = 1;
                }
                i = i + 1;
              }
              found
            `;
        expect(interpreter.evaluate(code)).toBe(1);
      });

      test("find max in array", () => {
        const code = `
              let arr = [3, 9, 1, 7, 5];
              let max = arr[0];
              let i = 1;
              while (i < arr.length) {
                if (arr[i] > max) {
                  max = arr[i];
                }
                i = i + 1;
              }
              max
            `;
        expect(interpreter.evaluate(code)).toBe(9);
      });
    });

    describe("Arrays in functions", () => {
      test("function returns array", () => {
        const code = `
              function getArray() {
                return [1, 2, 3];
              }
              getArray()
            `;
        expect(interpreter.evaluate(code)).toEqual([1, 2, 3]);
      });

      test("function takes array parameter", () => {
        const code = `
              function getFirst(arr) {
                return arr[0];
              }
              getFirst([10, 20, 30])
            `;
        expect(interpreter.evaluate(code)).toBe(10);
      });

      test("function modifies array", () => {
        const code = `
              function doubleFirst(arr) {
                arr[0] = arr[0] * 2;
                return arr;
              }
              let myArr = [5, 10, 15];
              doubleFirst(myArr)
            `;
        expect(interpreter.evaluate(code)).toEqual([10, 10, 15]);
      });

      test("function sums array", () => {
        const code = `
              function sum(arr) {
                let total = 0;
                let i = 0;
                while (i < arr.length) {
                  total = total + arr[i];
                  i = i + 1;
                }
                return total;
              }
              sum([1, 2, 3, 4, 5])
            `;
        expect(interpreter.evaluate(code)).toBe(15);
      });

      test("function creates and returns array", () => {
        const code = `
              function makeArray(n) {
                let arr = [0, 0, 0];
                let i = 0;
                while (i < arr.length) {
                  arr[i] = n + i;
                  i = i + 1;
                }
                return arr;
              }
              makeArray(10)
            `;
        expect(interpreter.evaluate(code)).toEqual([10, 11, 12]);
      });
    });

    describe("Array operations", () => {
      test("copy array elements", () => {
        const code = `
              let src = [1, 2, 3];
              let dst = [0, 0, 0];
              let i = 0;
              while (i < src.length) {
                dst[i] = src[i];
                i = i + 1;
              }
              dst
            `;
        expect(interpreter.evaluate(code)).toEqual([1, 2, 3]);
      });

      test("reverse array", () => {
        const code = `
              let arr = [1, 2, 3];
              let rev = [0, 0, 0];
              let i = 0;
              while (i < arr.length) {
                rev[arr.length - 1 - i] = arr[i];
                i = i + 1;
              }
              rev
            `;
        expect(interpreter.evaluate(code)).toEqual([3, 2, 1]);
      });

      test("count matching elements", () => {
        const code = `
              let arr = [1, 2, 3, 2, 4, 2];
              let target = 2;
              let count = 0;
              let i = 0;
              while (i < arr.length) {
                if (arr[i] === target) {
                  count = count + 1;
                }
                i = i + 1;
              }
              count
            `;
        expect(interpreter.evaluate(code)).toBe(3);
      });

      test("multiply all elements", () => {
        const code = `
              let arr = [2, 3, 4];
              let i = 0;
              while (i < arr.length) {
                arr[i] = arr[i] * 2;
                i = i + 1;
              }
              arr
            `;
        expect(interpreter.evaluate(code)).toEqual([4, 6, 8]);
      });
    });

    describe("Nested arrays", () => {
      test("access nested array element", () => {
        const code = `
              let matrix = [[1, 2], [3, 4]];
              matrix[1][0]
            `;
        expect(interpreter.evaluate(code)).toBe(3);
      });

      test("modify nested array element", () => {
        const code = `
              let matrix = [[1, 2], [3, 4]];
              matrix[0][1] = 99;
              matrix[0][1]
            `;
        expect(interpreter.evaluate(code)).toBe(99);
      });

      test("iterate over 2D array", () => {
        const code = `
              let matrix = [[1, 2], [3, 4]];
              let sum = 0;
              let i = 0;
              while (i < matrix.length) {
                let j = 0;
                while (j < matrix[i].length) {
                  sum = sum + matrix[i][j];
                  j = j + 1;
                }
                i = i + 1;
              }
              sum
            `;
        expect(interpreter.evaluate(code)).toBe(10);
      });
    });

    describe("Arrays with strings", () => {
      test("array of strings", () => {
        const result = interpreter.evaluate('["hello", "world"]');
        expect(result).toEqual(["hello", "world"]);
      });

      test("concatenate strings from array", () => {
        const code = `
              let words = ["hello", " ", "world"];
              let result = "";
              let i = 0;
              while (i < words.length) {
                result = result + words[i];
                i = i + 1;
              }
              result
            `;
        expect(interpreter.evaluate(code)).toBe("hello world");
      });
    });

    describe("Edge cases", () => {
      test("array with single element", () => {
        expect(interpreter.evaluate("[42]")).toEqual([42]);
      });

      test("array length is dynamic", () => {
        const code = `
              let arr = [1, 2];
              let len1 = arr.length;
              arr[2] = 3;
              let len2 = arr.length;
              len2
            `;
        expect(interpreter.evaluate(code)).toBe(3);
      });

      test("array reference semantics", () => {
        const code = `
              let arr1 = [1, 2, 3];
              let arr2 = arr1;
              arr2[0] = 99;
              arr1[0]
            `;
        expect(interpreter.evaluate(code)).toBe(99);
      });

      test("empty array in conditional", () => {
        const code = `
              let arr = [];
              if (arr.length === 0) {
                1
              } else {
                0
              }
            `;
        expect(interpreter.evaluate(code)).toBe(1);
      });
    });

    describe("Error handling", () => {
      test("non-number index throws", () => {
        const code = `
              let arr = [1, 2, 3];
              arr["hello"]
            `;
        expect(() => interpreter.evaluate(code)).toThrow("Array index must be a number");
      });

      test("assigning to non-array throws", () => {
        const code = `
              let x = 5;
              x[0] = 10
            `;
        expect(() => interpreter.evaluate(code)).toThrow("Assignment target is not an array");
      });
    });

    describe("Array Methods", () => {
      describe("push", () => {
        it("should add element to end of array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.push(4);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should return new length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2];
                    arr.push(3)
                  `);
          expect(result).toBe(3);
        });

        it("should add multiple elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1];
                    arr.push(2, 3, 4);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3, 4]);
        });
      });

      describe("pop", () => {
        it("should remove and return last element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.pop()
                  `);
          expect(result).toBe(3);
        });

        it("should modify the array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.pop();
                    arr
                  `);
          expect(result).toEqual([1, 2]);
        });

        it("should return undefined for empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [];
                    arr.pop()
                  `);
          expect(result).toBe(undefined);
        });
      });

      describe("shift", () => {
        it("should remove and return first element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.shift()
                  `);
          expect(result).toBe(1);
        });

        it("should modify the array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.shift();
                    arr
                  `);
          expect(result).toEqual([2, 3]);
        });
      });

      describe("unshift", () => {
        it("should add element to beginning", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [2, 3];
                    arr.unshift(1);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should return new length", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1];
                    arr.unshift(0)
                  `);
          expect(result).toBe(2);
        });

        it("should add multiple elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [4, 5];
                    arr.unshift(1, 2, 3);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });
      });

      describe("slice", () => {
        it("should return subarray", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5];
                    arr.slice(1, 3)
                  `);
          expect(result).toEqual([2, 3]);
        });

        it("should not modify original array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.slice(0, 2);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should work with single argument", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4];
                    arr.slice(2)
                  `);
          expect(result).toEqual([3, 4]);
        });

        it("should work with no arguments (copy)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.slice()
                  `);
          expect(result).toEqual([1, 2, 3]);
        });
      });

      describe("concat", () => {
        it("should concatenate arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr1 = [1, 2];
                    let arr2 = [3, 4];
                    arr1.concat(arr2)
                  `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should not modify original arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr1 = [1, 2];
                    let arr2 = [3, 4];
                    arr1.concat(arr2);
                    arr1
                  `);
          expect(result).toEqual([1, 2]);
        });

        it("should concatenate multiple arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1];
                    arr.concat([2], [3], [4])
                  `);
          expect(result).toEqual([1, 2, 3, 4]);
        });

        it("should concatenate single values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2];
                    arr.concat(3, 4, 5)
                  `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should only flatten one level of nested arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1];
                    arr.concat([2, [3]])
                  `);
          expect(result).toEqual([1, 2, [3]]);
        });
      });

      describe("indexOf", () => {
        it("should find element index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [10, 20, 30, 40];
                    arr.indexOf(30)
                  `);
          expect(result).toBe(2);
        });

        it("should return -1 when not found", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.indexOf(5)
                  `);
          expect(result).toBe(-1);
        });

        it("should work with fromIndex", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 2, 1];
                    arr.indexOf(2, 2)
                  `);
          expect(result).toBe(3);
        });
      });

      describe("join", () => {
        it("should join with default comma separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.join()
                  `);
          expect(result).toBe("1,2,3");
        });

        it("should join with custom separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = ["hello", "world"];
                    arr.join(" ")
                  `);
          expect(result).toBe("hello world");
        });

        it("should join with empty separator", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = ["a", "b", "c"];
                    arr.join("")
                  `);
          expect(result).toBe("abc");
        });

        it("should join non-string elements with string coercion", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, true, null, undefined, "x"];
                    arr.join("|")
                  `);
          expect(result).toBe("1|true|||x");
        });
      });

      describe("reverse", () => {
        it("should reverse array in place", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4];
                    arr.reverse();
                    arr
                  `);
          expect(result).toEqual([4, 3, 2, 1]);
        });

        it("should return the reversed array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.reverse()
                  `);
          expect(result).toEqual([3, 2, 1]);
        });
      });

      describe("map", () => {
        it("should map elements with function", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.map(x => x * 2)
                  `);
          expect(result).toEqual([2, 4, 6]);
        });

        it("should pass index to callback", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [10, 20, 30];
                    arr.map((val, i) => val + i)
                  `);
          expect(result).toEqual([10, 21, 32]);
        });

        it("should work with regular functions", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.map(function(x) { return x + 10; })
                  `);
          expect(result).toEqual([11, 12, 13]);
        });

        it("should not modify original array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.map(x => x * 2);
                    arr
                  `);
          expect(result).toEqual([1, 2, 3]);
        });
      });

      describe("filter", () => {
        it("should filter elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5, 6];
                    arr.filter(x => x % 2 === 0)
                  `);
          expect(result).toEqual([2, 4, 6]);
        });

        it("should pass index to callback", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [10, 20, 30, 40];
                    arr.filter((val, i) => i < 2)
                  `);
          expect(result).toEqual([10, 20]);
        });

        it("should return empty array when no matches", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.filter(x => x > 10)
                  `);
          expect(result).toEqual([]);
        });

        it("should skip holes in sparse arrays", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, , 3];
                    let visited = [];
                    arr.filter((val, idx) => {
                      visited.push(idx);
                      return true;
                    });
                    visited
                  `);
          expect(result).toEqual([0, 1, 2]);
        });
      });

      describe("reduce", () => {
        it("should reduce with initial value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4];
                    arr.reduce((acc, val) => acc + val, 0)
                  `);
          expect(result).toBe(10);
        });

        it("should reduce without initial value", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4];
                    arr.reduce((acc, val) => acc + val)
                  `);
          expect(result).toBe(10);
        });

        it("should pass index and array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [10, 20, 30];
                    arr.reduce((acc, val, i) => acc + (val * i), 0)
                  `);
          expect(result).toBe(80); // (10*0) + (20*1) + (30*2)
        });

        it("should throw error for empty array without initial value", () => {
          const interpreter = new Interpreter({
            security: { hideHostErrorMessages: false },
          });
          expect(() => {
            interpreter.evaluate(`
                      let arr = [];
                      arr.reduce((acc, val) => acc + val)
                    `);
          }).toThrow("Reduce of empty array with no initial value");
        });

        it("should work for building objects", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.reduce((acc, val) => {
                      acc[val] = val * 2;
                      return acc;
                    }, {})
                  `);
          expect(result).toEqual({ 1: 2, 2: 4, 3: 6 });
        });
      });

      describe("every", () => {
        it("should return true when all match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [2, 4, 6, 8];
                    arr.every(x => x % 2 === 0)
                  `);
          expect(result).toBe(true);
        });

        it("should return false when one doesn't match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [2, 4, 5, 8];
                    arr.every(x => x % 2 === 0)
                  `);
          expect(result).toBe(false);
        });

        it("should return true for empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [];
                    arr.every(x => x > 100)
                  `);
          expect(result).toBe(true);
        });
      });

      describe("some", () => {
        it("should return true when at least one matches", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 3, 5, 6];
                    arr.some(x => x % 2 === 0)
                  `);
          expect(result).toBe(true);
        });

        it("should return false when none match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 3, 5, 7];
                    arr.some(x => x % 2 === 0)
                  `);
          expect(result).toBe(false);
        });

        it("should return false for empty array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [];
                    arr.some(x => true)
                  `);
          expect(result).toBe(false);
        });
      });

      describe("Method chaining", () => {
        it("should chain map and filter", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5];
                    arr.map(x => x * 2).filter(x => x > 5)
                  `);
          expect(result).toEqual([6, 8, 10]);
        });

        it("should chain multiple methods", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4];
                    arr
                      .map(x => x * 2)
                      .filter(x => x > 4)
                      .reduce((acc, val) => acc + val, 0)
                  `);
          expect(result).toBe(14); // 6 + 8
        });

        it("should chain with slice", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5, 6];
                    arr.slice(1, 4).map(x => x * 10)
                  `);
          expect(result).toEqual([20, 30, 40]);
        });
      });

      describe("Async array methods", () => {
        it("should work with evaluateAsync", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
                    let arr = [1, 2, 3];
                    arr.map(x => x * 2)
                  `);
          expect(result).toEqual([2, 4, 6]);
        });

        it("should work in async functions", async () => {
          const interpreter = new Interpreter();
          const result = await interpreter.evaluateAsync(`
                    async function processArray() {
                      let arr = [1, 2, 3, 4, 5];
                      return arr.filter(x => x > 2).reduce((acc, val) => acc + val, 0);
                    }
                    processArray()
                  `);
          expect(result).toBe(12); // 3 + 4 + 5
        });
      });
    });

    describe("Extended array methods", () => {
      describe("sort", () => {
        it("should sort an array in place (default)", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [3, 1, 2];
                    arr.sort();
                    arr;
                  `);
          expect(result).toEqual([1, 2, 3]);
        });

        it("should sort lexicographically by default", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [10, 2, 1];
                    arr.sort();
                    arr;
                  `);
          expect(result).toEqual([1, 10, 2]);
        });

        it("should sort with a comparison function", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [3, 1, 2];
                    arr.sort((a, b) => b - a);
                    arr;
                  `);
          expect(result).toEqual([3, 2, 1]);
        });

        it("should sort in place and return sorted array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [2, 1];
                    const sorted = arr.sort();
                    sorted[0] + "," + sorted[1];
                  `);
          expect(result).toBe("1,2");
        });
      });

      describe("reduceRight", () => {
        it("should reduce from right to left", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = ["a", "b", "c"];
                    arr.reduceRight((acc, val) => acc + val, "");
                  `);
          expect(result).toBe("cba");
        });

        it("should use last element as initial when no initialValue", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    arr.reduceRight((acc, val) => acc - val);
                  `);
          // 3 - 2 - 1 = 0
          expect(result).toBe(0);
        });
      });

      describe("forEach", () => {
        it("should iterate over all elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    let sum = 0;
                    arr.forEach(x => { sum = sum + x; });
                    sum;
                  `);
          expect(result).toBe(6);
        });

        it("should pass index and array to callback", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = ["a", "b"];
                    let indices = [];
                    arr.forEach((val, idx) => { indices.push(idx); });
                    indices;
                  `);
          expect(result).toEqual([0, 1]);
        });

        it("should return undefined", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1];
                    arr.forEach(x => x);
                  `);
          expect(result).toBeUndefined();
        });
      });

      describe("splice", () => {
        it("should remove elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4, 5];
                    const removed = arr.splice(1, 2);
                    removed;
                  `);
          expect(result).toEqual([2, 3]);
        });

        it("should modify the original array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4, 5];
                    arr.splice(1, 2);
                    arr;
                  `);
          expect(result).toEqual([1, 4, 5]);
        });

        it("should insert elements", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 4, 5];
                    arr.splice(1, 0, 2, 3);
                    arr;
                  `);
          expect(result).toEqual([1, 2, 3, 4, 5]);
        });

        it("should remove to end when no deleteCount", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4];
                    arr.splice(2);
                  `);
          expect(result).toEqual([3, 4]);
        });
      });

      describe("lastIndexOf", () => {
        it("should find last occurrence", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 2, 1];
                    arr.lastIndexOf(2);
                  `);
          expect(result).toBe(3);
        });

        it("should return -1 when not found", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    arr.lastIndexOf(5);
                  `);
          expect(result).toBe(-1);
        });

        it("should accept fromIndex parameter", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 2, 1];
                    arr.lastIndexOf(2, 2);
                  `);
          expect(result).toBe(1);
        });
      });
    });
  });

  describe("ES2015", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Array static methods", () => {
      it("should create array from iterable with Array.from", () => {
        const result = interpreter.evaluate("Array.from('abc')");
        expect(result).toEqual(["a", "b", "c"]);
      });

      it("should map values with Array.from mapping function", () => {
        const result = interpreter.evaluate("Array.from([1, 2, 3], x => x * 2)");
        expect(result).toEqual([2, 4, 6]);
      });

      it("should create array from Set with Array.from", () => {
        const result = interpreter.evaluate(`
          const s = new Set([1, 2, 3]);
          Array.from(s);
        `);
        expect(result).toEqual([1, 2, 3]);
      });

      it("should create array from Map entries with Array.from", () => {
        const result = interpreter.evaluate(`
          const m = new Map([["a", 1], ["b", 2]]);
          Array.from(m);
        `);
        expect(result).toEqual([
          ["a", 1],
          ["b", 2],
        ]);
      });

      it("should create array from arguments with Array.of", () => {
        const result = interpreter.evaluate("Array.of(1, 2, 3)");
        expect(result).toEqual([1, 2, 3]);
      });
    });

    describe("Array Methods", () => {
      describe("find", () => {
        it("should find first matching element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5];
                    arr.find(x => x > 3)
                  `);
          expect(result).toBe(4);
        });

        it("should return undefined when not found", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.find(x => x > 10)
                  `);
          expect(result).toBe(undefined);
        });

        it("should work with objects", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [
                      { id: 1, name: "Alice" },
                      { id: 2, name: "Bob" },
                      { id: 3, name: "Charlie" }
                    ];
                    arr.find(x => x.id === 2)
                  `);
          expect(result).toEqual({ id: 2, name: "Bob" });
        });
      });

      describe("findIndex", () => {
        it("should find first matching index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3, 4, 5];
                    arr.findIndex(x => x > 3)
                  `);
          expect(result).toBe(3);
        });

        it("should return -1 when not found", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.findIndex(x => x > 10)
                  `);
          expect(result).toBe(-1);
        });
      });
    });

    describe("Extended array methods", () => {
      describe("fill", () => {
        it("should fill entire array", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    arr.fill(0);
                    arr;
                  `);
          expect(result).toEqual([0, 0, 0]);
        });

        it("should fill with start and end", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4];
                    arr.fill(9, 1, 3);
                    arr;
                  `);
          expect(result).toEqual([1, 9, 9, 4]);
        });
      });
    });

    describe("Array.prototype.copyWithin", () => {
      it("should copy within array", () => {
        expect(interpreter.evaluate("[1, 2, 3, 4, 5].copyWithin(0, 3)")).toEqual([4, 5, 3, 4, 5]);
      });
    });
  });

  describe("ES2016", () => {
    describe("Array Methods", () => {
      describe("includes", () => {
        it("should return true when element exists", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.includes(2)
                  `);
          expect(result).toBe(true);
        });

        it("should return false when element doesn't exist", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    let arr = [1, 2, 3];
                    arr.includes(5)
                  `);
          expect(result).toBe(false);
        });
      });
    });
  });

  describe("ES2019", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Extended array methods", () => {
      describe("flat", () => {
        it("should flatten one level by default", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, [2, 3], [4, [5]]];
                    arr.flat();
                  `);
          expect(result).toEqual([1, 2, 3, 4, [5]]);
        });

        it("should flatten to specified depth", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, [2, [3, [4]]]];
                    arr.flat(2);
                  `);
          expect(result).toEqual([1, 2, 3, [4]]);
        });
      });

      describe("flatMap", () => {
        it("should map and flatten one level", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    arr.flatMap(x => [x, x * 2]);
                  `);
          expect(result).toEqual([1, 2, 2, 4, 3, 6]);
        });

        it("should handle non-array return values", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3];
                    arr.flatMap(x => x * 10);
                  `);
          expect(result).toEqual([10, 20, 30]);
        });
      });
    });

    describe("Array.prototype.flat", () => {
      it("should flatten array by one level", () => {
        expect(interpreter.evaluate("[1, [2, 3], [4, [5]]].flat()")).toEqual([1, 2, 3, 4, [5]]);
      });

      it("should flatten nested arrays with depth", () => {
        expect(interpreter.evaluate("[1, [2, [3, [4]]]].flat(2)")).toEqual([1, 2, 3, [4]]);
      });

      it("should handle empty array", () => {
        expect(interpreter.evaluate("[].flat()")).toEqual([]);
      });
    });

    describe("Array.prototype.flatMap", () => {
      it("should map and flatten", () => {
        expect(interpreter.evaluate("[1, 2, 3].flatMap(x => [x, x * 2])")).toEqual([
          1, 2, 2, 4, 3, 6,
        ]);
      });

      it("should handle returning empty array", () => {
        expect(interpreter.evaluate("[1, 2, 3].flatMap(x => x === 2 ? [] : [x])")).toEqual([1, 3]);
      });

      it("should handle non-array return", () => {
        expect(interpreter.evaluate("[1, 2, 3].flatMap(x => x * 2)")).toEqual([2, 4, 6]);
      });
    });
  });

  describe("ES2022", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Extended array methods", () => {
      describe("at", () => {
        it("should access element at positive index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = ["a", "b", "c"];
                    arr.at(1);
                  `);
          expect(result).toBe("b");
        });

        it("should access element at negative index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = ["a", "b", "c"];
                    arr.at(-1);
                  `);
          expect(result).toBe("c");
        });

        it("should return undefined for out-of-range index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2];
                    arr.at(5);
                  `);
          expect(result).toBeUndefined();
        });
      });
    });

    describe("Array.prototype.at", () => {
      it("should get element at positive index", () => {
        expect(interpreter.evaluate("[1, 2, 3].at(0)")).toBe(1);
      });

      it("should get element at last index", () => {
        expect(interpreter.evaluate("[1, 2, 3].at(2)")).toBe(3);
      });

      it("should get element at negative index", () => {
        expect(interpreter.evaluate("[1, 2, 3].at(-1)")).toBe(3);
      });

      it("should return undefined for out of bounds", () => {
        expect(interpreter.evaluate("[1, 2, 3].at(10)")).toBeUndefined();
      });

      it("should return undefined for negative out of bounds", () => {
        expect(interpreter.evaluate("[1, 2, 3].at(-10)")).toBeUndefined();
      });
    });
  });

  describe("ES2023", () => {
    let interpreter: Interpreter;

    beforeEach(() => {
      interpreter = new Interpreter(ES2024);
    });

    describe("Extended array methods", () => {
      describe("findLast", () => {
        it("should find last matching element", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4, 5];
                    arr.findLast(x => x % 2 === 0);
                  `);
          expect(result).toBe(4);
        });

        it("should return undefined when no match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 3, 5];
                    arr.findLast(x => x % 2 === 0);
                  `);
          expect(result).toBeUndefined();
        });
      });

      describe("findLastIndex", () => {
        it("should find last matching index", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 2, 3, 4, 5];
                    arr.findLastIndex(x => x % 2 === 0);
                  `);
          expect(result).toBe(3);
        });

        it("should return -1 when no match", () => {
          const interpreter = new Interpreter();
          const result = interpreter.evaluate(`
                    const arr = [1, 3, 5];
                    arr.findLastIndex(x => x % 2 === 0);
                  `);
          expect(result).toBe(-1);
        });
      });
    });

    describe("Array.prototype.findLast", () => {
      it("should find last matching element", () => {
        expect(interpreter.evaluate("[1, 2, 3, 4, 3, 2, 1].findLast(x => x > 2)")).toBe(3);
      });

      it("should return undefined when not found", () => {
        expect(interpreter.evaluate("[1, 2, 3].findLast(x => x > 10)")).toBeUndefined();
      });
    });

    describe("Array.prototype.findLastIndex", () => {
      it("should find last matching index", () => {
        expect(interpreter.evaluate("[1, 2, 3, 4, 3, 2, 1].findLastIndex(x => x > 2)")).toBe(4);
      });

      it("should return -1 when not found", () => {
        expect(interpreter.evaluate("[1, 2, 3].findLastIndex(x => x > 10)")).toBe(-1);
      });
    });

    describe("Array.prototype.toReversed", () => {
      it("should return reversed array without modifying original", () => {
        expect(
          interpreter.evaluate(`
                  const arr = [1, 2, 3];
                  const reversed = arr.toReversed();
                  arr[0] + "-" + reversed[0]
                `),
        ).toBe("1-3");
      });

      it("should reverse array correctly", () => {
        expect(interpreter.evaluate("[1, 2, 3].toReversed()")).toEqual([3, 2, 1]);
      });
    });

    describe("Array.prototype.toSorted", () => {
      it("should return sorted array without modifying original", () => {
        expect(
          interpreter.evaluate(`
                  const arr = [3, 1, 2];
                  const sorted = arr.toSorted();
                  arr[0] + "-" + sorted[0]
                `),
        ).toBe("3-1");
      });

      it("should sort array correctly", () => {
        expect(interpreter.evaluate("[3, 1, 2].toSorted()")).toEqual([1, 2, 3]);
      });
    });

    describe("Array.prototype.toSpliced", () => {
      it("should insert elements", () => {
        expect(interpreter.evaluate("[1, 2, 3].toSpliced(1, 0, 'a', 'b')")).toEqual([
          1,
          "a",
          "b",
          2,
          3,
        ]);
      });

      it("should remove elements", () => {
        expect(interpreter.evaluate("[1, 2, 3, 4].toSpliced(1, 2)")).toEqual([1, 4]);
      });
    });

    describe("Array.prototype.with", () => {
      it("should return new array with modified element", () => {
        expect(
          interpreter.evaluate(`
                  const arr = [1, 2, 3];
                  const newArr = arr.with(1, "modified");
                  arr[1] + "-" + newArr[1]
                `),
        ).toBe("2-modified");
      });

      it("should modify at index", () => {
        expect(interpreter.evaluate("[1, 2, 3].with(0, 'a')")).toEqual(["a", 2, 3]);
      });
    });

    describe("findLast", () => {
      it("should find the last element matching a predicate", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[1, 2, 3, 4, 5].findLast(x => x < 4)")).toBe(3);
      });

      it("should return undefined if no element matches", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[1, 2, 3].findLast(x => x > 10)")).toBe(undefined);
      });

      it("should work with objects", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate(`
                  const arr = [{id: 1, active: true}, {id: 2, active: false}, {id: 3, active: true}];
                  arr.findLast(x => x.active).id;
                `);
        expect(result).toBe(3);
      });
    });

    describe("findLastIndex", () => {
      it("should find the last index matching a predicate", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[1, 2, 3, 4, 5].findLastIndex(x => x < 4)")).toBe(2);
      });

      it("should return -1 if no element matches", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[1, 2, 3].findLastIndex(x => x > 10)")).toBe(-1);
      });

      it("should work with duplicates", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[1, 2, 2, 2, 3].findLastIndex(x => x === 2)")).toBe(3);
      });
    });

    describe("toReversed", () => {
      it("should return a reversed copy without mutating original", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate(`
                  const arr = [1, 2, 3];
                  const reversed = arr.toReversed();
                  [reversed, arr];
                `);
        expect(result[0]).toEqual([3, 2, 1]);
        expect(result[1]).toEqual([1, 2, 3]);
      });

      it("should work with empty arrays", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[].toReversed()")).toEqual([]);
      });

      it("should work with single element", () => {
        const interpreter = new Interpreter(ES2023);
        expect(interpreter.evaluate("[42].toReversed()")).toEqual([42]);
      });
    });

    describe("toSorted", () => {
      it("should return a sorted copy without mutating original", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate(`
                  const arr = [3, 1, 2];
                  const sorted = arr.toSorted();
                  [sorted, arr];
                `);
        expect(result[0]).toEqual([1, 2, 3]);
        expect(result[1]).toEqual([3, 1, 2]);
      });

      it("should accept a compare function", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate("[3, 1, 2].toSorted((a, b) => b - a)");
        expect(result).toEqual([3, 2, 1]);
      });

      it("should handle strings correctly", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate('["banana", "apple", "cherry"].toSorted()');
        expect(result).toEqual(["apple", "banana", "cherry"]);
      });
    });

    describe("toSpliced", () => {
      it("should return a spliced copy without mutating original", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate(`
                  const arr = [1, 2, 3, 4];
                  const spliced = arr.toSpliced(1, 2, "a", "b");
                  [spliced, arr];
                `);
        expect(result[0]).toEqual([1, "a", "b", 4]);
        expect(result[1]).toEqual([1, 2, 3, 4]);
      });

      it("should work with only deletion", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate("[1, 2, 3, 4, 5].toSpliced(1, 3)");
        expect(result).toEqual([1, 5]);
      });

      it("should work with only insertion", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate('[1, 2, 3].toSpliced(1, 0, "a", "b")');
        expect(result).toEqual([1, "a", "b", 2, 3]);
      });

      it("should handle negative start index", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate("[1, 2, 3, 4, 5].toSpliced(-2, 1)");
        expect(result).toEqual([1, 2, 3, 5]);
      });
    });

    describe("with", () => {
      it("should return a copy with element replaced", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate(`
                  const arr = [1, 2, 3];
                  const updated = arr.with(1, "x");
                  [updated, arr];
                `);
        expect(result[0]).toEqual([1, "x", 3]);
        expect(result[1]).toEqual([1, 2, 3]);
      });

      it("should handle negative index", () => {
        const interpreter = new Interpreter(ES2023);
        const result = interpreter.evaluate('[1, 2, 3].with(-1, "last")');
        expect(result).toEqual([1, 2, "last"]);
      });

      it("should throw for out of bounds index", () => {
        const interpreter = new Interpreter(ES2023);
        expect(() => interpreter.evaluate("[1, 2, 3].with(10, 'x')")).toThrow();
      });
    });
  });
});
