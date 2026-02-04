# BigIntLiteral

## What it is

BigInt literals for arbitrary-precision integers, written with an `n` suffix: `10n`, `BigInt(42)`.

## Interpreter implementation

- Parsed as a numeric literal with `bigint` property.
- Handled via `parseBigIntLiteral` in the tokenizer with `BigInt` suffix support.
- BigInt operations use JavaScript's native `BigInt` type.

## Gotchas

- BigInt and number types are not interchangeable.
- Division truncates towards zero (no decimal part).
- Bitwise operations work on BigInt values.
- Requires `BigIntLiteral` feature to be enabled.

## Supported operations

| Operator       | Example     | Result  |
| -------------- | ----------- | ------- | ----- |
| Addition       | `10n + 20n` | `30n`   |
| Subtraction    | `20n - 10n` | `10n`   |
| Multiplication | `3n * 4n`   | `12n`   |
| Division       | `7n / 3n`   | `2n`    |
| Modulo         | `7n % 3n`   | `1n`    |
| Exponentiation | `2n ** 10n` | `1024n` |
| Comparison     | `10n < 20n` | `true`  |
| Bitwise AND    | `15n & 9n`  | `9n`    |
| Bitwise OR     | `8n         | 2n`     | `10n` |
| Bitwise XOR    | `15n ^ 9n`  | `6n`    |
| Bitwise NOT    | `~10n`      | `-11n`  |
| Left shift     | `2n << 3n`  | `16n`   |
| Right shift    | `16n >> 3n` | `2n`    |

## Examples

```javascript
// BigInt literals
const big = 12345678901234567890n;

// Operations
big + 1n; // 12345678901234567891n
big * 2n; // 24691357802469135780n

// Comparison
42n === 42n; // true

// Converting from Number
BigInt(42); // 42n

// String conversion
String(123n); // "123"
```

## Availability

| Preset           | Status                                |
| ---------------- | ------------------------------------- |
| ES2019 and below | Not available                         |
| ES2020+          | Available via `BigIntLiteral` feature |
| ESNext           | Available                             |

The `BigInt` constructor is available as a global in ES2020+ presets.
