# String.prototype RegExp Methods

The interpreter supports regex-related `String.prototype` methods via native delegation.
Availability depends on the host runtime, and methods are exposed on string instances.

## Supported Methods

| Method                          | Description                              | Example                        |
| ------------------------------- | ---------------------------------------- | ------------------------------ |
| `String.prototype.match()`      | Tests for a match and returns the result | `"hello".match(/l/)`           |
| `String.prototype.matchAll()`   | Returns an iterator of all matches       | `"test".matchAll(/t/g)`        |
| `String.prototype.search()`     | Tests for a match and returns the index  | `"hello".search(/l/)`          |
| `String.prototype.replace()`    | Replaces matched substrings              | `"hello".replace(/l/, "x")`    |
| `String.prototype.replaceAll()` | Replaces all matched substrings          | `"hello".replaceAll("l", "x")` |

## Usage Examples

### match()

```javascript
// Non-global regex: returns match details
const result = "hello".match(/l/);
// ["l", index: 2, input: "hello", groups: undefined]

// Global regex: returns array of all matches
const result = "hello".match(/l/g);
// ["l", "l"]

// No match returns null
const result = "hello".match(/x/);
// null
```

### matchAll()

```javascript
// Returns an iterator
const iterator = "test".matchAll(/t/g);

// Spread to get all matches
const matches = [..."test".matchAll(/t/g)];
// [["t", index: 0, ...], ["t", index: 3, ...]]
```

### search()

```javascript
// Returns index of first match
const result = "hello".search(/l/);
// 2

// Returns -1 if not found
const result = "hello".search(/x/);
// -1
```

### replace()

```javascript
// Simple replacement
const result = "hello".replace(/l/, "x");
// "hexlo"

// Global replacement
const result = "hello".replace(/l/g, "x");
// "hexxo"

// Replacement function
const result = "3+3".replace(/\d/g, (m) => String(Number(m) * 2));
// "6+6"

// Replacement function receives all arguments
const result = "3 + 4".replace(/\d+/g, (match, offset, string) => {
  return String(Number(match) * 2);
});
// "6 + 8"
```

### replaceAll()

```javascript
// Replace all occurrences
const result = "foo bar foo".replaceAll("foo", "baz");
// "baz bar baz"

// Works with global regex
const result = "foo foo".replaceAll(/foo/g, "bar");
// "bar bar"

// Throws TypeError with non-global regex
try {
  "foo".replaceAll(/foo/, "bar");
} catch (e) {
  // TypeError: String.prototype.replaceAll requires a global RegExp
}
```

## Implementation Details

### Security

String methods are exposed as `HostFunctionValue` wrappers or via native delegation, and
property-name validation blocks dangerous properties like `__proto__` and `constructor`.

### Well-Known Symbols

The following well-known symbols are intentionally blocked to prevent sandbox code from overriding regex behavior:

- `Symbol.match`
- `Symbol.matchAll`
- `Symbol.replace`
- `Symbol.search`
- `Symbol.split`

Call methods on string instances (e.g., `"hi".match(...)`). Accessing `String.prototype` is blocked.

### Host Function Arguments

When using replacement functions with `replace()`, the arguments are passed correctly:

1. `match` - The matched substring
2. `p1, p2, ...` - Captured groups (if any)
3. `offset` - The position of the matched substring
4. `string` - The entire string being searched

## Availability

These methods are available in all presets that include the `String` global (ES5 and above). The methods are on `String.prototype`, so they're automatically available on any string value.

## Compatibility

| Method         | ECMAScript Version |
| -------------- | ------------------ |
| `match()`      | ES3                |
| `search()`     | ES3                |
| `replace()`    | ES3                |
| `matchAll()`   | ES2020             |
| `replaceAll()` | ES2021             |
