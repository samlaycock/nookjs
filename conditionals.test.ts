import { describe, test, expect, beforeEach } from 'bun:test';
import { Interpreter, InterpreterError } from './interpreter';

describe('Conditional Statements', () => {
  let interpreter: Interpreter;

  beforeEach(() => {
    interpreter = new Interpreter();
  });

  describe('Basic if statements', () => {
    test('executes consequent when condition is true', () => {
      const code = `
        let x = 0;
        if (true) {
          x = 5;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('skips consequent when condition is false', () => {
      const code = `
        let x = 0;
        if (false) {
          x = 5;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(0);
    });

    test('evaluates condition expression', () => {
      const code = `
        let x = 0;
        if (5 > 3) {
          x = 10;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('handles truthy values', () => {
      const code = `
        let x = 0;
        if (1) {
          x = 1;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('handles falsy values', () => {
      const code = `
        let x = 5;
        if (0) {
          x = 10;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('supports single statement without braces', () => {
      const code = `
        let x = 0;
        if (true)
          x = 5;
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('if with variable condition', () => {
      const code = `
        let shouldExecute = true;
        let x = 0;
        if (shouldExecute) {
          x = 10;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('if with complex condition', () => {
      const code = `
        let a = 10;
        let b = 5;
        let x = 0;
        if (a > b && b > 0) {
          x = 1;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });
  });

  describe('if...else statements', () => {
    test('executes consequent when true', () => {
      const code = `
        let x = 0;
        if (true) {
          x = 5;
        } else {
          x = 10;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('executes alternate when false', () => {
      const code = `
        let x = 0;
        if (false) {
          x = 5;
        } else {
          x = 10;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('else without braces', () => {
      const code = `
        let x = 0;
        if (false)
          x = 5;
        else
          x = 10;
        x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('if...else with comparison', () => {
      const code = `
        let age = 20;
        let status = 0;
        if (age >= 18) {
          status = 1;
        } else {
          status = 2;
        }
        status
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('if...else branching with variables', () => {
      const code = `
        let value = 5;
        let result = 0;
        if (value > 10) {
          result = value * 2;
        } else {
          result = value + 10;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });
  });

  describe('if...else if...else chains', () => {
    test('executes first true branch', () => {
      const code = `
        let x = 15;
        let result = 0;
        if (x < 10) {
          result = 1;
        } else if (x < 20) {
          result = 2;
        } else {
          result = 3;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    test('executes final else when all conditions false', () => {
      const code = `
        let x = 25;
        let result = 0;
        if (x < 10) {
          result = 1;
        } else if (x < 20) {
          result = 2;
        } else {
          result = 3;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    test('multiple else if branches', () => {
      const code = `
        let score = 75;
        let grade = 0;
        if (score >= 90) {
          grade = 1;
        } else if (score >= 80) {
          grade = 2;
        } else if (score >= 70) {
          grade = 3;
        } else if (score >= 60) {
          grade = 4;
        } else {
          grade = 5;
        }
        grade
      `;
      expect(interpreter.evaluate(code)).toBe(3);
    });

    test('stops at first true condition', () => {
      const code = `
        let x = 15;
        let count = 0;
        if (x > 5) {
          count = 1;
        } else if (x > 10) {
          count = 2;
        } else if (x > 0) {
          count = 3;
        }
        count
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('else if without final else', () => {
      const code = `
        let x = 30;
        let result = 0;
        if (x < 10) {
          result = 1;
        } else if (x < 20) {
          result = 2;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(0);
    });
  });

  describe('Nested if statements', () => {
    test('nested if inside if', () => {
      const code = `
        let x = 10;
        let y = 5;
        let result = 0;
        if (x > 5) {
          if (y > 3) {
            result = 1;
          }
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('nested if...else', () => {
      const code = `
        let a = 10;
        let b = 20;
        let result = 0;
        if (a > 5) {
          if (b > 15) {
            result = 1;
          } else {
            result = 2;
          }
        } else {
          result = 3;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('deeply nested conditionals', () => {
      const code = `
        let x = 5;
        let result = 0;
        if (x > 0) {
          if (x > 3) {
            if (x > 4) {
              result = 1;
            }
          }
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });
  });

  describe('if statements with multiple statements in blocks', () => {
    test('multiple statements in consequent', () => {
      const code = `
        let x = 0;
        let y = 0;
        if (true) {
          x = 5;
          y = 10;
        }
        x + y
      `;
      expect(interpreter.evaluate(code)).toBe(15);
    });

    test('multiple statements in both branches', () => {
      const code = `
        let x = 0;
        let y = 0;
        if (false) {
          x = 5;
          y = 10;
        } else {
          x = 2;
          y = 3;
        }
        x + y
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('complex operations in blocks', () => {
      const code = `
        let balance = 100;
        let amount = 50;
        if (amount <= balance) {
          balance = balance - amount;
          amount = 0;
        }
        balance
      `;
      expect(interpreter.evaluate(code)).toBe(50);
    });
  });

  describe('if statements with return-like behavior', () => {
    test('if statement returns undefined when not executed', () => {
      const result = interpreter.evaluate('if (false) { 5 }');
      expect(result).toBeUndefined();
    });

    test('if statement returns last expression value when executed', () => {
      const result = interpreter.evaluate('if (true) { 5 }');
      expect(result).toBe(5);
    });

    test('if...else returns appropriate branch value', () => {
      const result = interpreter.evaluate('if (true) { 10 } else { 20 }');
      expect(result).toBe(10);
    });
  });

  describe('Practical patterns', () => {
    test('min/max pattern', () => {
      const code = `
        let a = 10;
        let b = 20;
        let max = 0;
        if (a > b) {
          max = a;
        } else {
          max = b;
        }
        max
      `;
      expect(interpreter.evaluate(code)).toBe(20);
    });

    test('clamp pattern', () => {
      const code = `
        let value = 150;
        let min = 0;
        let max = 100;
        if (value < min) {
          value = min;
        } else if (value > max) {
          value = max;
        }
        value
      `;
      expect(interpreter.evaluate(code)).toBe(100);
    });

    test('sign function pattern', () => {
      const code = `
        let x = -5;
        let sign = 0;
        if (x > 0) {
          sign = 1;
        } else if (x < 0) {
          sign = -1;
        }
        sign
      `;
      expect(interpreter.evaluate(code)).toBe(-1);
    });

    test('validation pattern', () => {
      const code = `
        let age = 25;
        let hasID = true;
        let canEnter = false;
        if (age >= 21 && hasID) {
          canEnter = true;
        }
        canEnter
      `;
      expect(interpreter.evaluate(code)).toBe(true);
    });

    test('error handling pattern', () => {
      const code = `
        let value = 0;
        let error = false;
        if (value === 0) {
          error = true;
          value = 1;
        }
        error
      `;
      expect(interpreter.evaluate(code)).toBe(true);
    });

    test('state machine pattern', () => {
      const code = `
        let state = 1;
        let nextState = 0;
        if (state === 1) {
          nextState = 2;
        } else if (state === 2) {
          nextState = 3;
        } else {
          nextState = 1;
        }
        nextState
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });
  });

  describe('Edge cases', () => {
    test('empty if block', () => {
      const code = `
        let x = 5;
        if (true) {
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('empty else block', () => {
      const code = `
        let x = 5;
        if (false) {
          x = 10;
        } else {
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });

    test('condition with side effects', () => {
      const code = `
        let x = 0;
        let y = 5;
        if ((x = 10) > 5) {
          y = x;
        }
        y
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });

    test('if statement as final statement', () => {
      const code = `
        let x = 0;
        if (true) {
          x = 5;
        }
      `;
      expect(interpreter.evaluate(code)).toBe(5);
    });
  });

  describe('Integration with other features', () => {
    test('if with arithmetic in condition', () => {
      const code = `
        let result = 0;
        if (2 + 2 === 4) {
          result = 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('if with logical operators in condition', () => {
      const code = `
        let a = true;
        let b = false;
        let result = 0;
        if (a || b) {
          result = 1;
        }
        result
      `;
      expect(interpreter.evaluate(code)).toBe(1);
    });

    test('modifying variables in conditional blocks', () => {
      const code = `
        let counter = 0;
        if (counter === 0) {
          counter = counter + 1;
        }
        if (counter === 1) {
          counter = counter + 1;
        }
        counter
      `;
      expect(interpreter.evaluate(code)).toBe(2);
    });

    test('using const in conditional blocks', () => {
      const code = `
        let x = 0;
        if (true) {
          const temp = 10;
          x = temp;
        }
        x
      `;
      expect(interpreter.evaluate(code)).toBe(10);
    });
  });
});
