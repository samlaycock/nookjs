import { describe, test, expect, beforeEach } from "bun:test";

import { Interpreter, InterpreterError } from "../src/interpreter";

describe("Arrays", () => {
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
});
