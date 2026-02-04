# Array Methods

The interpreter exposes `Array.prototype` methods via explicit wrappers for callback-aware
methods and native delegation for the rest. These methods are automatically available on arrays
in all presets.

## Supported Methods by ECMAScript Version

### ES5+ (Always Available)

| Method          | Description                       | Example                                             |
| --------------- | --------------------------------- | --------------------------------------------------- |
| `push()`        | Adds elements to end              | `[1,2].push(3)` → `[1,2,3]`                         |
| `pop()`         | Removes and returns last element  | `[1,2].pop()` → `2`                                 |
| `shift()`       | Removes and returns first element | `[1,2].shift()` → `1`                               |
| `unshift()`     | Adds elements to start            | `[2].unshift(1)` → `[1,2]`                          |
| `slice()`       | Extracts a portion                | `[1,2,3].slice(1,2)` → `[2]`                        |
| `splice()`      | Adds/removes elements             | `[1,2,3].splice(1,1)` → `[2]`                       |
| `concat()`      | Merges arrays                     | `[1].concat([2])` → `[1,2]`                         |
| `join()`        | Joins elements as string          | `[1,2].join(',')` → `"1,2"`                         |
| `indexOf()`     | Finds first index                 | `[1,2,1].indexOf(1)` → `0`                          |
| `lastIndexOf()` | Finds last index                  | `[1,2,1].lastIndexOf(1)` → `2`                      |
| `includes()`    | Checks if value exists            | `[1,2].includes(2)` → `true`                        |
| `reverse()`     | Reverses in place                 | `[1,2].reverse()` → `[2,1]`                         |
| `sort()`        | Sorts in place                    | `[2,1].sort()` → `[1,2]`                            |
| `map()`         | Maps each element                 | `[1,2].map(x => x*2)` → `[2,4]`                     |
| `filter()`      | Filters elements                  | `[1,2,3].filter(x => x>1)` → `[2,3]`                |
| `reduce()`      | Reduces to single value           | `[1,2,3].reduce((a,b) => a+b)` → `6`                |
| `reduceRight()` | Reduces from right                | `['a','b','c'].reduceRight((a,b) => a+b)` → `"cba"` |
| `forEach()`     | Executes for each                 | `[1,2].forEach(x => console.log(x))`                |
| `every()`       | Tests all elements                | `[1,2,3].every(x => x>0)` → `true`                  |
| `some()`        | Tests some elements               | `[1,2,3].some(x => x>2)` → `true`                   |
| `find()`        | Finds first match                 | `[1,2,3].find(x => x>1)` → `2`                      |
| `findIndex()`   | Finds first index                 | `[1,2,3].findIndex(x => x>1)` → `1`                 |
| `copyWithin()`  | Copies within array               | `[1,2,3,4].copyWithin(0,2)` → `[3,4,3,4]`           |
| `fill()`        | Fills with value                  | `[1,2,3].fill(0)` → `[0,0,0]`                       |
| `entries()`     | Returns iterator                  | `[1,2].entries().next().value` → `[0,1]`            |
| `keys()`        | Returns keys iterator             | `[1,2].keys().next().value` → `0`                   |
| `values()`      | Returns values iterator           | `[1,2].values().next().value` → `1`                 |

### ES2019+ Additions

| Method      | Description            | Example                                      |
| ----------- | ---------------------- | -------------------------------------------- |
| `flat()`    | Flattens nested arrays | `[1,[2,[3]]].flat(2)` → `[1,2,3]`            |
| `flatMap()` | Maps then flattens     | `[1,2].flatMap(x => [x, x*2])` → `[1,2,2,4]` |

### ES2022+ Additions

| Method | Description           | Example                |
| ------ | --------------------- | ---------------------- |
| `at()` | Gets element at index | `[1,2,3].at(-1)` → `3` |

### ES2023+ Additions

| Method            | Description              | Example                                   |
| ----------------- | ------------------------ | ----------------------------------------- |
| `findLast()`      | Finds last match         | `[1,2,3,2].findLast(x => x<3)` → `2`      |
| `findLastIndex()` | Finds last index         | `[1,2,3,2].findLastIndex(x => x<3)` → `3` |
| `toReversed()`    | Returns reversed copy    | `[1,2,3].toReversed()` → `[3,2,1]`        |
| `toSorted()`      | Returns sorted copy      | `[3,1,2].toSorted()` → `[1,2,3]`          |
| `toSpliced()`     | Returns spliced copy     | `[1,2,3].toSpliced(1,1)` → `[1,3]`        |
| `with()`          | Returns copy with change | `[1,2,3].with(1,0)` → `[1,0,3]`           |

## Implementation Details

### Security

Array methods are exposed as `HostFunctionValue` wrappers (or via native delegation) and still
pass through property-name validation, so dangerous properties like `__proto__`, `constructor`,
and `prototype` are blocked.

### Iterator Methods

Methods that return iterators (`entries()`, `keys()`, `values()`) return native iterator objects
that implement the iterator protocol:

```javascript
const arr = [1, 2];
const iterator = arr.entries();
iterator.next(); // { value: [0, 1], done: false }
iterator.next(); // { value: [1, 2], done: false }
iterator.next(); // { value: undefined, done: true }

// Can be used with for...of
for (const [index, value] of [1, 2].entries()) {
  console.log(index, value);
}
```

### findLast / findLastIndex Behavior

These methods iterate from the end of the array:

```javascript
const arr = [1, 2, 3, 2, 1];
arr.findLast((x) => x < 3); // 2 (last value < 3)
arr.findLastIndex((x) => x < 3); // 3 (index of last value < 3)
```

### at() with Negative Indices

The `at()` method supports negative indices similar to Python:

```javascript
[1, 2, 3].at(0); // 1
[1, 2, 3].at(1); // 2
[1, 2, 3].at(-1); // 3 (last element)
[1, 2, 3].at(-2); // 2 (second to last)
[1, 2, 3].at(5); // undefined (out of bounds)
```

## Availability

All Array.prototype methods are available in all presets that include the `Array` global (ES5 and above). Methods introduced in later ECMAScript versions are automatically available when running in those preset contexts.
