import { Interpreter, ts } from "../src/index";

const arrowExpr = new Interpreter();
const arrowExprCode = ts`
  let double = x => x * 2;
  let add = (a, b) => a + b;
  double(5) + add(3, 7)
`;
arrowExpr.evaluate(arrowExprCode);

const arrowBlock = new Interpreter();
const arrowBlockCode = ts`
  let factorial = n => {
    let result = 1;
    for (let i = 1; i <= n; i++) {
      result = result * i;
    }
    return result;
  };
  factorial(6)
`;
arrowBlock.evaluate(arrowBlockCode);

const arrowHigherOrder = new Interpreter();
const arrowHigherOrderCode = ts`
  function map(arr, f) {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      result[i] = f(arr[i]);
    }
    return result;
  }
  let nums = [1, 2, 3, 4, 5];
  let squared = map(nums, x => x * x);
  squared[3]
`;
arrowHigherOrder.evaluate(arrowHigherOrderCode);

const arrowClosure = new Interpreter();
const arrowClosureCode = ts`
  let makeAdder = x => y => x + y;
  let add10 = makeAdder(10);
  add10(5)
`;
arrowClosure.evaluate(arrowClosureCode);

const arrowFilter = new Interpreter();
const arrowFilterCode = ts`
  function filter(arr, pred) {
    let result = [];
    let j = 0;
    for (let i = 0; i < arr.length; i++) {
      if (pred(arr[i])) {
        result[j] = arr[i];
        j = j + 1;
      }
    }
    return result;
  }
  let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let evens = filter(nums, n => n % 2 === 0);
  evens.length
`;
arrowFilter.evaluate(arrowFilterCode);
