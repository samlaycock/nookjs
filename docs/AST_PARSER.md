# AST Parser

This interpreter ships with a zero-dependency JavaScript parser implemented in `src/ast.ts`. It produces a strict ESTree-compatible AST for the supported feature set.

## Scope and Design

- Target: only the syntax the interpreter can execute.
- Output: ESTree nodes used by the evaluator and validators.
- Performance: zero allocations per token (numeric token kinds + current/lookahead fields).
- Simplicity: single-pass recursive descent with small, explicit helpers.
- TypeScript annotations are accepted and stripped (types-as-comments).

## Tokenizer

- The tokenizer tracks `current` and `lookahead` token fields instead of allocating token objects.
- `snapshot()`/`restore()` support limited backtracking (used for arrow lookahead).
- Minimal string and template escape handling; full Unicode escape support is intentionally limited.
- **Hashbang (`#!`)** is automatically stripped and ignored at the start of the input (ES2023+).
- **Numeric separators** (`1_000_000`) are automatically stripped before parsing numeric literals.

## TypeScript Annotations (Stripped)

Type syntax is parsed and discarded so runtime behavior matches plain JavaScript. This covers:

- Variable/parameter/property annotations and function return types
- `as` assertions
- Optional (`?`) and definite assignment (`!`) markers
- `implements` clauses
- `type` and `interface` declarations (parsed and dropped)

Deliberately unsupported:

- TSX/JSX
- `enum` / `namespace`
- `import` / `export` (not allowed in the interpreter)

## Expression Parsing

- Uses precedence climbing:
  - Binary operators by `getBinaryPrecedence()`.
  - Logical operators by `getLogicalPrecedence()` (`&&` binds tighter than `||`/`??`).
- `allowIn` flag suppresses the `in` operator when parsing `for (x in obj)` initializers.
- Assignment parsing tries arrow function parsing first because arrow syntax shares prefixes with grouping.

## Statements

- Standard block/if/while/do/for/for-in/for-of/switch/try/catch/finally/return/throw/break/continue.
- `for (x in obj)` vs `for (x; ... )` distinction is handled by disallowing `in` in the init expression.

## Optional Chaining

- Member/call chains with optional access are wrapped in `ChainExpression`.
- Optional call vs optional member are tracked with the `optional` flag on `CallExpression`/`MemberExpression`.

## Templates

- `readTemplateElement()` returns `{ raw, cooked, tail }`.
- Escape handling is intentionally minimal and mirrors the supported feature set.

## Errors

- Parser throws `ParseError` for unsupported or malformed syntax.
- Some errors are intentionally aligned with existing tests (e.g., invalid assignment target).

## Profiling

- `parseModuleWithProfile()` returns parse timings and token counts.
