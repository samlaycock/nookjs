// Placeholder for API parity with external parsers and future hooks.
interface ParseOptions {
  readonly next?: boolean;
  readonly profile?: boolean;
}

export interface ParseProfile {
  readonly tokens: number;
  readonly tokenizeMs: number;
  readonly parseMs: number;
}

export namespace ESTree {
  export interface Node {
    readonly type: string;
  }

  export interface Program extends Node {
    readonly type: "Program";
    readonly body: Statement[];
    readonly sourceType: "module";
  }

  export type Statement =
    | BlockStatement
    | ExpressionStatement
    | EmptyStatement
    | VariableDeclaration
    | IfStatement
    | WhileStatement
    | DoWhileStatement
    | ForStatement
    | ForOfStatement
    | ForInStatement
    | SwitchStatement
    | FunctionDeclaration
    | ReturnStatement
    | BreakStatement
    | ContinueStatement
    | ThrowStatement
    | TryStatement
    | ClassDeclaration;

  export type Expression =
    | Identifier
    | Literal
    | ThisExpression
    | Super
    | BinaryExpression
    | UnaryExpression
    | UpdateExpression
    | LogicalExpression
    | ConditionalExpression
    | AssignmentExpression
    | CallExpression
    | NewExpression
    | MemberExpression
    | ArrayExpression
    | ObjectExpression
    | FunctionExpression
    | ArrowFunctionExpression
    | AwaitExpression
    | YieldExpression
    | TemplateLiteral
    | ChainExpression
    | ClassExpression;

  export type Pattern =
    | Identifier
    | ObjectPattern
    | ArrayPattern
    | AssignmentPattern
    | RestElement;

  export interface Identifier extends Node {
    readonly type: "Identifier";
    readonly name: string;
  }

  export interface PrivateIdentifier extends Node {
    readonly type: "PrivateIdentifier";
    readonly name: string;
  }

  export interface Literal extends Node {
    readonly type: "Literal";
    readonly value: string | number | boolean | null;
    readonly raw?: string;
  }

  export interface ThisExpression extends Node {
    readonly type: "ThisExpression";
  }

  export interface Super extends Node {
    readonly type: "Super";
  }

  export interface ProgramBodyNode extends Node {}

  export interface ExpressionStatement extends Node {
    readonly type: "ExpressionStatement";
    readonly expression: Expression;
  }

  export interface EmptyStatement extends Node {
    readonly type: "EmptyStatement";
  }

  export interface BlockStatement extends Node {
    readonly type: "BlockStatement";
    readonly body: Statement[];
  }

  export interface VariableDeclaration extends Node {
    readonly type: "VariableDeclaration";
    readonly declarations: VariableDeclarator[];
    readonly kind: "let" | "const" | "var";
  }

  export interface VariableDeclarator extends Node {
    readonly type: "VariableDeclarator";
    readonly id: Pattern;
    readonly init: Expression | null;
  }

  export interface IfStatement extends Node {
    readonly type: "IfStatement";
    readonly test: Expression;
    readonly consequent: Statement;
    readonly alternate: Statement | null;
  }

  export interface WhileStatement extends Node {
    readonly type: "WhileStatement";
    readonly test: Expression;
    readonly body: Statement;
  }

  export interface DoWhileStatement extends Node {
    readonly type: "DoWhileStatement";
    readonly body: Statement;
    readonly test: Expression;
  }

  export interface ForStatement extends Node {
    readonly type: "ForStatement";
    readonly init: VariableDeclaration | Expression | null;
    readonly test: Expression | null;
    readonly update: Expression | null;
    readonly body: Statement;
  }

  export interface ForOfStatement extends Node {
    readonly type: "ForOfStatement";
    readonly left: VariableDeclaration | Pattern;
    readonly right: Expression;
    readonly body: Statement;
    readonly await: boolean;
  }

  export interface ForInStatement extends Node {
    readonly type: "ForInStatement";
    readonly left: VariableDeclaration | Pattern;
    readonly right: Expression;
    readonly body: Statement;
  }

  export interface SwitchStatement extends Node {
    readonly type: "SwitchStatement";
    readonly discriminant: Expression;
    readonly cases: SwitchCase[];
  }

  export interface SwitchCase extends Node {
    readonly type: "SwitchCase";
    readonly test: Expression | null;
    readonly consequent: Statement[];
  }

  export interface FunctionDeclaration extends Node {
    readonly type: "FunctionDeclaration";
    readonly id: Identifier;
    readonly params: Pattern[];
    readonly body: BlockStatement;
    readonly async: boolean;
    readonly generator: boolean;
  }

  export interface FunctionExpression extends Node {
    readonly type: "FunctionExpression";
    readonly id: Identifier | null;
    readonly params: Pattern[];
    readonly body: BlockStatement;
    readonly async: boolean;
    readonly generator: boolean;
  }

  export interface ArrowFunctionExpression extends Node {
    readonly type: "ArrowFunctionExpression";
    readonly params: Pattern[];
    readonly body: BlockStatement | Expression;
    readonly async: boolean;
    readonly generator?: boolean;
  }

  export interface ReturnStatement extends Node {
    readonly type: "ReturnStatement";
    readonly argument: Expression | null;
  }

  export interface BreakStatement extends Node {
    readonly type: "BreakStatement";
    readonly label?: Identifier | null;
  }

  export interface ContinueStatement extends Node {
    readonly type: "ContinueStatement";
    readonly label?: Identifier | null;
  }

  export interface ThrowStatement extends Node {
    readonly type: "ThrowStatement";
    readonly argument: Expression;
  }

  export interface TryStatement extends Node {
    readonly type: "TryStatement";
    readonly block: BlockStatement;
    readonly handler: CatchClause | null;
    readonly finalizer: BlockStatement | null;
  }

  export interface CatchClause extends Node {
    readonly type: "CatchClause";
    readonly param: Pattern | null;
    readonly body: BlockStatement;
  }

  export interface BinaryExpression extends Node {
    readonly type: "BinaryExpression";
    readonly operator: string;
    readonly left: Expression;
    readonly right: Expression;
  }

  export interface UnaryExpression extends Node {
    readonly type: "UnaryExpression";
    readonly operator: string;
    readonly prefix: boolean;
    readonly argument: Expression;
  }

  export interface UpdateExpression extends Node {
    readonly type: "UpdateExpression";
    readonly operator: string;
    readonly argument: Expression;
    readonly prefix: boolean;
  }

  export interface LogicalExpression extends Node {
    readonly type: "LogicalExpression";
    readonly operator: string;
    readonly left: Expression;
    readonly right: Expression;
  }

  export interface ConditionalExpression extends Node {
    readonly type: "ConditionalExpression";
    readonly test: Expression;
    readonly consequent: Expression;
    readonly alternate: Expression;
  }

  export interface AssignmentExpression extends Node {
    readonly type: "AssignmentExpression";
    readonly operator: string;
    readonly left: Pattern | MemberExpression;
    readonly right: Expression;
  }

  export interface MemberExpression extends Node {
    readonly type: "MemberExpression";
    readonly object: Expression | Super;
    readonly property: Expression | PrivateIdentifier;
    readonly computed: boolean;
    readonly optional: boolean;
  }

  export interface CallExpression extends Node {
    readonly type: "CallExpression";
    readonly callee: Expression | Super;
    readonly arguments: (Expression | SpreadElement)[];
    readonly optional: boolean;
  }

  export interface NewExpression extends Node {
    readonly type: "NewExpression";
    readonly callee: Expression;
    readonly arguments: (Expression | SpreadElement)[];
  }

  export interface ArrayExpression extends Node {
    readonly type: "ArrayExpression";
    readonly elements: (Expression | SpreadElement | null)[];
  }

  export interface ObjectExpression extends Node {
    readonly type: "ObjectExpression";
    readonly properties: (Property | SpreadElement)[];
  }

  export interface Property extends Node {
    readonly type: "Property";
    readonly key: Expression;
    readonly value: Expression | Pattern;
    readonly kind: "init" | "get" | "set";
    readonly method: boolean;
    readonly shorthand: boolean;
    readonly computed: boolean;
  }

  export interface PropertyDefinition extends Node {
    readonly type: "PropertyDefinition";
    readonly key: Expression | PrivateIdentifier;
    readonly value: Expression | null;
    readonly computed: boolean;
    readonly static: boolean;
  }

  export interface MethodDefinition extends Node {
    readonly type: "MethodDefinition";
    readonly key: Expression | PrivateIdentifier;
    readonly value: FunctionExpression;
    readonly kind: "constructor" | "method" | "get" | "set";
    readonly computed: boolean;
    readonly static: boolean;
  }

  export interface ClassBody extends Node {
    readonly type: "ClassBody";
    readonly body: (MethodDefinition | PropertyDefinition | StaticBlock)[];
  }

  export interface ClassDeclaration extends Node {
    readonly type: "ClassDeclaration";
    readonly id: Identifier | null;
    readonly superClass: Expression | null;
    readonly body: ClassBody;
  }

  export interface ClassExpression extends Node {
    readonly type: "ClassExpression";
    readonly id: Identifier | null;
    readonly superClass: Expression | null;
    readonly body: ClassBody;
  }

  export interface StaticBlock extends Node {
    readonly type: "StaticBlock";
    readonly body: Statement[];
  }

  export interface AwaitExpression extends Node {
    readonly type: "AwaitExpression";
    readonly argument: Expression;
  }

  export interface YieldExpression extends Node {
    readonly type: "YieldExpression";
    readonly argument: Expression | null;
    readonly delegate: boolean;
  }

  export interface ChainExpression extends Node {
    readonly type: "ChainExpression";
    readonly expression: Expression;
  }

  export interface TemplateLiteral extends Node {
    readonly type: "TemplateLiteral";
    readonly quasis: TemplateElement[];
    readonly expressions: Expression[];
  }

  export interface TemplateElement extends Node {
    readonly type: "TemplateElement";
    readonly value: TemplateValue;
    readonly tail: boolean;
  }

  export interface TemplateValue {
    readonly raw: string;
    readonly cooked: string;
  }

  export interface ArrayPattern extends Node {
    readonly type: "ArrayPattern";
    readonly elements: (Pattern | RestElement | null)[];
  }

  export interface ObjectPattern extends Node {
    readonly type: "ObjectPattern";
    readonly properties: (Property | RestElement)[];
  }

  export interface AssignmentPattern extends Node {
    readonly type: "AssignmentPattern";
    readonly left: Pattern;
    readonly right: Expression;
  }

  export interface RestElement extends Node {
    readonly type: "RestElement";
    readonly argument: Pattern;
  }

  export interface SpreadElement extends Node {
    readonly type: "SpreadElement";
    readonly argument: Expression;
  }
}

// Numeric token kinds to avoid per-token object allocations.
const TOKEN = {
  EOF: 0,
  Identifier: 1,
  Keyword: 2,
  Number: 3,
  String: 4,
  Punctuator: 5,
  PrivateIdentifier: 6,
} as const;

type TokenType = (typeof TOKEN)[keyof typeof TOKEN];

const KEYWORDS = new Set([
  "let",
  "const",
  "var",
  "if",
  "else",
  "while",
  "do",
  "for",
  "of",
  "in",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "function",
  "return",
  "class",
  "extends",
  "new",
  "this",
  "super",
  "try",
  "catch",
  "finally",
  "throw",
  "delete",
  "async",
  "await",
  "yield",
  "get",
  "set",
  "static",
  "true",
  "false",
  "null",
  "typeof",
]);

const STOP_TOKENS_TYPE_EQUALS = new Set(["="]);
const STOP_TOKENS_TYPE_SEMICOLON = new Set([";"]);
const STOP_TOKENS_TYPE_INTERFACE = new Set(["{", "extends"]);
const STOP_TOKENS_TYPE_IMPLEMENTS = new Set([",", "{"]);
const STOP_TOKENS_TYPE_RETURN_BLOCK = new Set(["{"]);
const STOP_TOKENS_TYPE_PARAM = new Set(["=", ",", ")"]);
const STOP_TOKENS_TYPE_REST = new Set([",", ")"]);
const STOP_TOKENS_TYPE_VAR = new Set(["=", ",", ";", ")"]);
const STOP_TOKENS_TYPE_CLASS_FIELD = new Set(["=", ";", "}"]);
const STOP_TOKENS_TYPE_ASSERTION = new Set([",", ";", ")", "]", "}"]);
const STOP_TOKENS_TYPE_ARROW = new Set(["=>"]);

const ASSIGNMENT_OPERATORS = [
  "=",
  "||=",
  "&&=",
  "??=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
] as const;

const UNARY_OPERATORS = new Set(["+", "-", "!", "typeof"]);

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

class Tokenizer {
  private readonly input: string;
  private index = 0;
  private currentType: TokenType = TOKEN.EOF;
  private currentValue = "";
  private currentLineBreakBefore = false;
  private lookaheadType: TokenType = TOKEN.EOF;
  private lookaheadValue = "";
  private lookaheadLineBreakBefore = false;
  private hasLookahead = false;
  private readonly profiler?: { tokens: number; tokenizeMs: number };

  constructor(
    input: string,
    profiler?: { tokens: number; tokenizeMs: number },
  ) {
    this.input = input;
    this.profiler = profiler;
  }

  peekType(): TokenType {
    if (!this.hasLookahead) {
      this.readTokenInto(false);
    }
    return this.lookaheadType;
  }

  peekValue(): string {
    if (!this.hasLookahead) {
      this.readTokenInto(false);
    }
    return this.lookaheadValue;
  }

  peekLineBreakBefore(): boolean {
    if (!this.hasLookahead) {
      this.readTokenInto(false);
    }
    return this.lookaheadLineBreakBefore;
  }

  next(): TokenType {
    if (this.hasLookahead) {
      this.currentType = this.lookaheadType;
      this.currentValue = this.lookaheadValue;
      this.currentLineBreakBefore = this.lookaheadLineBreakBefore;
      this.hasLookahead = false;
      return this.currentType;
    }
    this.readTokenInto(true);
    return this.currentType;
  }

  currentTypeValue(): TokenType {
    return this.currentType;
  }

  currentValueValue(): string {
    return this.currentValue;
  }

  currentLineBreakValue(): boolean {
    return this.currentLineBreakBefore;
  }

  // Save enough lexer state to allow parser backtracking (e.g. arrow lookahead).
  snapshot(): {
    index: number;
    currentType: TokenType;
    currentValue: string;
    currentLineBreakBefore: boolean;
    lookaheadType: TokenType;
    lookaheadValue: string;
    lookaheadLineBreakBefore: boolean;
    hasLookahead: boolean;
  } {
    return {
      index: this.index,
      currentType: this.currentType,
      currentValue: this.currentValue,
      currentLineBreakBefore: this.currentLineBreakBefore,
      lookaheadType: this.lookaheadType,
      lookaheadValue: this.lookaheadValue,
      lookaheadLineBreakBefore: this.lookaheadLineBreakBefore,
      hasLookahead: this.hasLookahead,
    };
  }

  // Restore a snapshot taken by snapshot().
  restore(snapshot: {
    index: number;
    currentType: TokenType;
    currentValue: string;
    currentLineBreakBefore: boolean;
    lookaheadType: TokenType;
    lookaheadValue: string;
    lookaheadLineBreakBefore: boolean;
    hasLookahead: boolean;
  }): void {
    this.index = snapshot.index;
    this.currentType = snapshot.currentType;
    this.currentValue = snapshot.currentValue;
    this.currentLineBreakBefore = snapshot.currentLineBreakBefore;
    this.lookaheadType = snapshot.lookaheadType;
    this.lookaheadValue = snapshot.lookaheadValue;
    this.lookaheadLineBreakBefore = snapshot.lookaheadLineBreakBefore;
    this.hasLookahead = snapshot.hasLookahead;
  }

  // Reads a template element, returning raw/cooked values and tail flag.
  readTemplateElement(): { raw: string; cooked: string; tail: boolean } {
    const start = this.index;
    let raw = "";
    let cooked = "";
    const input = this.input;
    const length = input.length;

    while (this.index < length) {
      const ch = input[this.index] ?? "";
      if (ch === "`") {
        this.index += 1;
        return { raw, cooked, tail: true };
      }
      if (ch === "$" && input[this.index + 1] === "{") {
        this.index += 2;
        return { raw, cooked, tail: false };
      }
      if (ch === "\\") {
        const escapeResult = this.readEscapeSequence();
        raw += escapeResult.raw;
        cooked += escapeResult.cooked;
        continue;
      }
      raw += ch;
      cooked += ch;
      this.index += 1;
    }

    throw new ParseError("Unterminated template literal starting at " + start);
  }

  // Minimal escape handling for templates; leaves full unicode parsing to future.
  private readEscapeSequence(): { raw: string; cooked: string } {
    const input = this.input;
    const start = this.index;
    this.index += 1;
    const ch = input[this.index] ?? "";
    this.index += 1;

    switch (ch) {
      case "n":
        return { raw: "\\n", cooked: "\n" };
      case "r":
        return { raw: "\\r", cooked: "\r" };
      case "t":
        return { raw: "\\t", cooked: "\t" };
      case "\\":
        return { raw: "\\\\", cooked: "\\" };
      case "`":
        return { raw: "\\`", cooked: "`" };
      case "$":
        return { raw: "\\$", cooked: "$" };
      case "u":
        return { raw: "\\u", cooked: "u" };
      case "x":
        return { raw: "\\x", cooked: "x" };
      default:
        if (ch === "\n") {
          return { raw: "\\\n", cooked: "\n" };
        }
        return { raw: input.slice(start, this.index), cooked: ch };
    }
  }

  // Cooked-only escape parsing for strings to avoid allocating raw+object pairs.
  private readEscapeSequenceCooked(): string {
    const input = this.input;
    this.index += 1;
    const ch = input[this.index] ?? "";
    this.index += 1;

    switch (ch) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "\\":
        return "\\";
      case "`":
        return "`";
      case "$":
        return "$";
      case "u":
        return "u";
      case "x":
        return "x";
      default:
        return ch === "\n" ? "\n" : ch;
    }
  }

  private readTokenInto(setCurrent: boolean): void {
    const start = this.profiler ? now() : 0;
    const input = this.input;
    const length = input.length;
    const lineBreakBefore = this.skipWhitespaceAndComments();

    if (this.index >= length) {
      this.setToken(setCurrent, TOKEN.EOF, "", lineBreakBefore);
      this.recordToken(start);
      return;
    }

    const ch = input[this.index] ?? "";
    const code = input.charCodeAt(this.index);

    const isAlpha =
      (code >= 97 && code <= 122) ||
      (code >= 65 && code <= 90) ||
      code === 95 ||
      code === 36;
    if (isAlpha) {
      const ident = this.readIdentifier();
      const type: TokenType = KEYWORDS.has(ident)
        ? TOKEN.Keyword
        : TOKEN.Identifier;
      this.setToken(setCurrent, type, ident, lineBreakBefore);
      this.recordToken(start);
      return;
    }

    if (code === 35) {
      const nextCode = input.charCodeAt(this.index + 1);
      const nextIsAlpha =
        (nextCode >= 97 && nextCode <= 122) ||
        (nextCode >= 65 && nextCode <= 90) ||
        nextCode === 95 ||
        nextCode === 36;
      if (nextIsAlpha) {
        this.index += 1;
        const name = this.readIdentifier();
        this.setToken(
          setCurrent,
          TOKEN.PrivateIdentifier,
          name,
          lineBreakBefore,
        );
        this.recordToken(start);
        return;
      }
    }

    if (code >= 48 && code <= 57) {
      this.setToken(
        setCurrent,
        TOKEN.Number,
        this.readNumber(),
        lineBreakBefore,
      );
      this.recordToken(start);
      return;
    }

    if (code === 39 || code === 34) {
      this.setToken(
        setCurrent,
        TOKEN.String,
        this.readString(ch),
        lineBreakBefore,
      );
      this.recordToken(start);
      return;
    }

    if (code === 96) {
      this.index += 1;
      this.setToken(setCurrent, TOKEN.Punctuator, "`", lineBreakBefore);
      this.recordToken(start);
      return;
    }

    const punctuator = this.readPunctuator();
    if (punctuator) {
      this.setToken(setCurrent, TOKEN.Punctuator, punctuator, lineBreakBefore);
      this.recordToken(start);
      return;
    }

    throw new ParseError(`Unexpected character: ${ch}`);
  }

  private setToken(
    setCurrent: boolean,
    type: TokenType,
    value: string,
    lineBreakBefore: boolean,
  ): void {
    if (setCurrent) {
      this.currentType = type;
      this.currentValue = value;
      this.currentLineBreakBefore = lineBreakBefore;
      return;
    }
    this.lookaheadType = type;
    this.lookaheadValue = value;
    this.lookaheadLineBreakBefore = lineBreakBefore;
    this.hasLookahead = true;
  }

  private recordToken(start: number): void {
    if (!this.profiler) {
      return;
    }
    const elapsed = now() - start;
    this.profiler.tokens += 1;
    this.profiler.tokenizeMs += elapsed;
  }

  private skipWhitespaceAndComments(): boolean {
    let lineBreak = false;
    const input = this.input;
    const length = input.length;

    while (this.index < length) {
      const ch = input[this.index] ?? "";

      if (ch === " " || ch === "\t" || ch === "\r") {
        this.index += 1;
        continue;
      }
      if (ch === "\n") {
        lineBreak = true;
        this.index += 1;
        continue;
      }
      if (ch === "/" && input[this.index + 1] === "/") {
        this.index += 2;
        while (this.index < length && input[this.index] !== "\n") {
          this.index += 1;
        }
        continue;
      }
      if (ch === "/" && input[this.index + 1] === "*") {
        this.index += 2;
        while (this.index < length) {
          if (input[this.index] === "*" && input[this.index + 1] === "/") {
            this.index += 2;
            break;
          }
          if (input[this.index] === "\n") {
            lineBreak = true;
          }
          this.index += 1;
        }
        continue;
      }
      break;
    }

    return lineBreak;
  }

  private readIdentifier(): string {
    const start = this.index;
    const input = this.input;
    const length = input.length;
    // ASCII identifier scan: [$A-Za-z_][$0-9A-Za-z_]*
    let index = this.index + 1;
    while (index < length) {
      const code = input.charCodeAt(index);
      const isAlpha =
        (code >= 97 && code <= 122) ||
        (code >= 65 && code <= 90) ||
        code === 95 ||
        code === 36;
      if (!isAlpha && (code < 48 || code > 57)) {
        break;
      }
      index += 1;
    }
    this.index = index;
    return input.slice(start, index);
  }

  private readNumber(): string {
    const start = this.index;
    const input = this.input;
    const length = input.length;
    let index = this.index;
    if (input.charCodeAt(index) === 48 && index + 1 < length) {
      const prefix = input.charCodeAt(index + 1);
      if (prefix === 120 || prefix === 88) {
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          const isHex =
            (code >= 48 && code <= 57) ||
            (code >= 97 && code <= 102) ||
            (code >= 65 && code <= 70);
          if (!isHex) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
      if (prefix === 98 || prefix === 66) {
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          if (code !== 48 && code !== 49) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
      if (prefix === 111 || prefix === 79) {
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          if (code < 48 || code > 55) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
    }

    while (index < length) {
      const code = input.charCodeAt(index);
      if (code < 48 || code > 57) {
        break;
      }
      index += 1;
    }
    if (input.charCodeAt(index) === 46) {
      const nextCode = input.charCodeAt(index + 1);
      if (nextCode >= 48 && nextCode <= 57) {
        index += 1;
        while (index < length) {
          const code = input.charCodeAt(index);
          if (code < 48 || code > 57) {
            break;
          }
          index += 1;
        }
      }
    }
    this.index = index;
    return input.slice(start, index);
  }

  private readString(quote: string): string {
    const input = this.input;
    const length = input.length;
    const start = this.index + 1;
    let index = start;

    while (index < length) {
      const ch = input[index] ?? "";
      if (ch === quote) {
        const value = input.slice(start, index);
        this.index = index + 1;
        return value;
      }
      if (ch === "\\") {
        // Fall back to the slower path only when escapes are present.
        this.index = start - 1;
        return this.readStringWithEscapes(quote);
      }
      if (ch === "\n") {
        throw new ParseError("Unterminated string literal");
      }
      index += 1;
    }
    throw new ParseError("Unterminated string literal");
  }

  private readStringWithEscapes(quote: string): string {
    let value = "";
    const input = this.input;
    const length = input.length;
    this.index += 1;
    while (this.index < length) {
      const ch = input[this.index] ?? "";
      if (ch === quote) {
        this.index += 1;
        return value;
      }
      if (ch === "\\") {
        value += this.readEscapeSequenceCooked();
        continue;
      }
      if (ch === "\n") {
        throw new ParseError("Unterminated string literal");
      }
      value += ch;
      this.index += 1;
    }
    throw new ParseError("Unterminated string literal");
  }

  private readPunctuator(): string | null {
    const start = this.index;
    const input = this.input;
    const code = input.charCodeAt(start);

    switch (code) {
      case 46: // .
        if (
          input.charCodeAt(start + 1) === 46 &&
          input.charCodeAt(start + 2) === 46
        ) {
          this.index += 3;
          return "...";
        }
        this.index += 1;
        return ".";
      case 63: // ?
        if (input.charCodeAt(start + 1) === 46) {
          this.index += 2;
          return "?.";
        }
        if (input.charCodeAt(start + 1) === 63) {
          if (input.charCodeAt(start + 2) === 61) {
            this.index += 3;
            return "??=";
          }
          this.index += 2;
          return "??";
        }
        this.index += 1;
        return "?";
      case 124: // |
        if (input.charCodeAt(start + 1) === 124) {
          if (input.charCodeAt(start + 2) === 61) {
            this.index += 3;
            return "||=";
          }
          this.index += 2;
          return "||";
        }
        return null;
      case 38: // &
        if (input.charCodeAt(start + 1) === 38) {
          if (input.charCodeAt(start + 2) === 61) {
            this.index += 3;
            return "&&=";
          }
          this.index += 2;
          return "&&";
        }
        return null;
      case 61: // =
        if (input.charCodeAt(start + 1) === 61) {
          if (input.charCodeAt(start + 2) === 61) {
            this.index += 3;
            return "===";
          }
          this.index += 2;
          return "==";
        }
        if (input.charCodeAt(start + 1) === 62) {
          this.index += 2;
          return "=>";
        }
        this.index += 1;
        return "=";
      case 33: // !
        if (input.charCodeAt(start + 1) === 61) {
          if (input.charCodeAt(start + 2) === 61) {
            this.index += 3;
            return "!==";
          }
          this.index += 2;
          return "!=";
        }
        this.index += 1;
        return "!";
      case 60: // <
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "<=";
        }
        if (
          input.charCodeAt(start + 1) === 60 &&
          input.charCodeAt(start + 2) === 61
        ) {
          this.index += 3;
          return "<<=";
        }
        this.index += 1;
        return "<";
      case 62: // >
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return ">=";
        }
        if (
          input.charCodeAt(start + 1) === 62 &&
          input.charCodeAt(start + 2) === 61
        ) {
          this.index += 3;
          return ">>=";
        }
        if (
          input.charCodeAt(start + 1) === 62 &&
          input.charCodeAt(start + 2) === 62 &&
          input.charCodeAt(start + 3) === 61
        ) {
          this.index += 4;
          return ">>>=";
        }
        this.index += 1;
        return ">";
      case 42: // *
        if (input.charCodeAt(start + 1) === 42) {
          this.index += 2;
          return "**";
        }
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "*=";
        }
        this.index += 1;
        return "*";
      case 47: // /
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "/=";
        }
        this.index += 1;
        return "/";
      case 37: // %
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "%=";
        }
        this.index += 1;
        return "%";
      case 43: // +
        if (input.charCodeAt(start + 1) === 43) {
          this.index += 2;
          return "++";
        }
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "+=";
        }
        this.index += 1;
        return "+";
      case 45: // -
        if (input.charCodeAt(start + 1) === 45) {
          this.index += 2;
          return "--";
        }
        if (input.charCodeAt(start + 1) === 61) {
          this.index += 2;
          return "-=";
        }
        this.index += 1;
        return "-";
      case 44:
        this.index += 1;
        return ",";
      case 58:
        this.index += 1;
        return ":";
      case 59:
        this.index += 1;
        return ";";
      case 40:
        this.index += 1;
        return "(";
      case 41:
        this.index += 1;
        return ")";
      case 123:
        this.index += 1;
        return "{";
      case 125:
        this.index += 1;
        return "}";
      case 91:
        this.index += 1;
        return "[";
      case 93:
        this.index += 1;
        return "]";
      default:
        return null;
    }
  }
}

class Parser {
  private readonly tokenizer: Tokenizer;
  private currentType: TokenType = TOKEN.EOF;
  private currentValue = "";
  private currentLineBreakBefore = false;
  private inFunction = false;
  private inGenerator = false;
  private inAsync = false;
  private allowTopLevelAwait = false;

  constructor(
    input: string,
    allowTopLevelAwait: boolean,
    profiler?: { tokens: number; tokenizeMs: number },
  ) {
    this.tokenizer = new Tokenizer(input, profiler);
    this.tokenizer.next();
    this.syncCurrent();
    this.allowTopLevelAwait = allowTopLevelAwait;
  }

  parseProgram(): ESTree.Program {
    const body: ESTree.Statement[] = [];
    while (!this.match(TOKEN.EOF)) {
      if (this.consumePunctuator(";")) {
        continue;
      }
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
    }
    return {
      type: "Program",
      body,
      sourceType: "module",
    };
  }

  private parseStatement(): ESTree.Statement | null {
    if (this.matchPunctuator("{")) {
      return this.parseBlockStatement();
    }
    if (this.isTypeOnlyStatementStart()) {
      this.parseTypeOnlyStatement();
      return null;
    }
    if (this.matchKeyword("if")) {
      return this.parseIfStatement();
    }
    if (this.matchKeyword("while")) {
      return this.parseWhileStatement();
    }
    if (this.matchKeyword("do")) {
      return this.parseDoWhileStatement();
    }
    if (this.matchKeyword("for")) {
      return this.parseForStatement();
    }
    if (this.matchKeyword("switch")) {
      return this.parseSwitchStatement();
    }
    if (this.matchKeyword("return")) {
      return this.parseReturnStatement();
    }
    if (this.matchKeyword("break")) {
      return this.parseBreakStatement();
    }
    if (this.matchKeyword("continue")) {
      return this.parseContinueStatement();
    }
    if (this.matchKeyword("throw")) {
      return this.parseThrowStatement();
    }
    if (this.matchKeyword("try")) {
      return this.parseTryStatement();
    }
    if (this.matchKeyword("function") || this.isAsyncFunctionDeclaration()) {
      return this.parseFunctionDeclaration();
    }
    if (this.matchKeyword("class")) {
      return this.parseClassDeclaration();
    }
    if (
      this.matchKeyword("let") ||
      this.matchKeyword("const") ||
      this.matchKeyword("var")
    ) {
      return this.parseVariableDeclaration(false);
    }
    return this.parseExpressionStatement();
  }

  private parseStatementOrEmpty(): ESTree.Statement {
    return this.parseStatement() ?? { type: "EmptyStatement" };
  }

  private isTypeOnlyStatementStart(): boolean {
    return (
      this.matchIdentifierValue("type") ||
      this.matchIdentifierValue("interface")
    );
  }

  private parseTypeOnlyStatement(): void {
    if (this.matchIdentifierValue("type")) {
      this.next();
      this.parseIdentifier();
      if (this.matchPunctuator("<")) {
        this.skipType(STOP_TOKENS_TYPE_EQUALS);
      }
      this.expectPunctuator("=");
      this.skipType(STOP_TOKENS_TYPE_SEMICOLON);
      this.consumeSemicolon();
      return;
    }

    if (this.matchIdentifierValue("interface")) {
      this.next();
      this.parseIdentifier();
      if (this.matchPunctuator("<")) {
        this.skipType(STOP_TOKENS_TYPE_INTERFACE);
      }
      if (this.matchIdentifierValue("extends")) {
        this.next();
        while (true) {
          this.skipType(STOP_TOKENS_TYPE_IMPLEMENTS);
          if (!this.consumePunctuator(",")) {
            break;
          }
        }
      }
      if (this.matchPunctuator("{")) {
        this.skipTypeBlock();
        return;
      }
      throw new ParseError("Interface declaration missing body");
    }
  }

  private parseBlockStatement(): ESTree.BlockStatement {
    this.expectPunctuator("{");
    const body: ESTree.Statement[] = [];
    while (!this.matchPunctuator("}")) {
      if (this.match(TOKEN.EOF)) {
        throw new ParseError("Unterminated block statement");
      }
      if (this.consumePunctuator(";")) {
        continue;
      }
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
    }
    this.expectPunctuator("}");
    return { type: "BlockStatement", body };
  }

  private parseIfStatement(): ESTree.IfStatement {
    this.expectKeyword("if");
    this.expectPunctuator("(");
    const test = this.parseExpression();
    this.expectPunctuator(")");
    const consequent = this.parseStatementOrEmpty();
    const alternate = this.matchKeyword("else")
      ? (this.next(), this.parseStatementOrEmpty())
      : null;
    return { type: "IfStatement", test, consequent, alternate };
  }

  private parseWhileStatement(): ESTree.WhileStatement {
    this.expectKeyword("while");
    this.expectPunctuator("(");
    const test = this.parseExpression();
    this.expectPunctuator(")");
    const body = this.parseStatementOrEmpty();
    return { type: "WhileStatement", test, body };
  }

  private parseDoWhileStatement(): ESTree.DoWhileStatement {
    this.expectKeyword("do");
    const body = this.parseStatementOrEmpty();
    this.expectKeyword("while");
    this.expectPunctuator("(");
    const test = this.parseExpression();
    this.expectPunctuator(")");
    this.consumeSemicolon();
    return { type: "DoWhileStatement", body, test };
  }

  private parseForStatement():
    | ESTree.ForStatement
    | ESTree.ForOfStatement
    | ESTree.ForInStatement {
    this.expectKeyword("for");
    this.expectPunctuator("(");

    if (this.matchPunctuator(";")) {
      this.expectPunctuator(";");
      const test = this.matchPunctuator(";") ? null : this.parseExpression();
      this.expectPunctuator(";");
      const update = this.matchPunctuator(")") ? null : this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return { type: "ForStatement", init: null, test, update, body };
    }

    if (
      this.matchKeyword("let") ||
      this.matchKeyword("const") ||
      this.matchKeyword("var")
    ) {
      const declaration = this.parseVariableDeclaration(true);
      if (this.matchKeyword("of")) {
        this.expectKeyword("of");
        const right = this.parseExpression();
        this.expectPunctuator(")");
        const body = this.parseStatementOrEmpty();
        return {
          type: "ForOfStatement",
          left: declaration,
          right,
          body,
          await: false,
        };
      }
      if (this.matchKeyword("in")) {
        this.expectKeyword("in");
        const right = this.parseExpression();
        this.expectPunctuator(")");
        const body = this.parseStatementOrEmpty();
        return {
          type: "ForInStatement",
          left: declaration,
          right,
          body,
        };
      }
      this.expectPunctuator(";");
      const test = this.matchPunctuator(";") ? null : this.parseExpression();
      this.expectPunctuator(";");
      const update = this.matchPunctuator(")") ? null : this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return { type: "ForStatement", init: declaration, test, update, body };
    }

    // Disallow "in" so `for (x in obj)` is parsed as ForInStatement.
    const initExpression = this.parseExpression(false);

    if (this.matchKeyword("of")) {
      if (!this.isAssignablePattern(initExpression)) {
        throw new ParseError("Invalid left-hand side in for..of");
      }
      this.expectKeyword("of");
      const right = this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return {
        type: "ForOfStatement",
        left: initExpression as ESTree.Pattern,
        right,
        body,
        await: false,
      };
    }

    if (this.matchKeyword("in")) {
      if (!this.isAssignablePattern(initExpression)) {
        throw new ParseError("Invalid left-hand side in for..in");
      }
      this.expectKeyword("in");
      const right = this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return {
        type: "ForInStatement",
        left: initExpression as ESTree.Pattern,
        right,
        body,
      };
    }

    this.expectPunctuator(";");
    const test = this.matchPunctuator(";") ? null : this.parseExpression();
    this.expectPunctuator(";");
    const update = this.matchPunctuator(")") ? null : this.parseExpression();
    this.expectPunctuator(")");
    const body = this.parseStatementOrEmpty();
    return { type: "ForStatement", init: initExpression, test, update, body };
  }

  private parseSwitchStatement(): ESTree.SwitchStatement {
    this.expectKeyword("switch");
    this.expectPunctuator("(");
    const discriminant = this.parseExpression();
    this.expectPunctuator(")");
    this.expectPunctuator("{");

    const cases: ESTree.SwitchCase[] = [];
    while (!this.matchPunctuator("}")) {
      if (this.matchKeyword("case")) {
        this.next();
        const test = this.parseExpression();
        this.expectPunctuator(":");
        const consequent = this.parseSwitchConsequent();
        cases.push({ type: "SwitchCase", test, consequent });
        continue;
      }
      if (this.matchKeyword("default")) {
        this.next();
        this.expectPunctuator(":");
        const consequent = this.parseSwitchConsequent();
        cases.push({ type: "SwitchCase", test: null, consequent });
        continue;
      }
      throw new ParseError("Unexpected token in switch statement");
    }
    this.expectPunctuator("}");
    return { type: "SwitchStatement", discriminant, cases };
  }

  private parseSwitchConsequent(): ESTree.Statement[] {
    const statements: ESTree.Statement[] = [];
    while (
      !this.matchPunctuator("}") &&
      !this.matchKeyword("case") &&
      !this.matchKeyword("default")
    ) {
      if (this.consumePunctuator(";")) {
        continue;
      }
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
    }
    return statements;
  }

  private parseReturnStatement(): ESTree.ReturnStatement {
    this.expectKeyword("return");
    if (
      this.matchPunctuator(";") ||
      this.match(TOKEN.EOF) ||
      this.currentLineBreakBefore
    ) {
      this.consumeSemicolon();
      return { type: "ReturnStatement", argument: null };
    }
    const argument = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ReturnStatement", argument };
  }

  private parseBreakStatement(): ESTree.BreakStatement {
    this.expectKeyword("break");
    if (this.match(TOKEN.Identifier)) {
      throw new ParseError("Labeled break is not supported");
    }
    this.consumeSemicolon();
    return { type: "BreakStatement", label: null };
  }

  private parseContinueStatement(): ESTree.ContinueStatement {
    this.expectKeyword("continue");
    if (this.match(TOKEN.Identifier)) {
      throw new ParseError("Labeled continue is not supported");
    }
    this.consumeSemicolon();
    return { type: "ContinueStatement", label: null };
  }

  private parseThrowStatement(): ESTree.ThrowStatement {
    this.expectKeyword("throw");
    if (this.currentLineBreakBefore) {
      throw new ParseError("Line terminator not allowed after throw");
    }
    const argument = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ThrowStatement", argument };
  }

  private parseTryStatement(): ESTree.TryStatement {
    this.expectKeyword("try");
    const block = this.parseBlockStatement();
    const handler = this.matchKeyword("catch") ? this.parseCatchClause() : null;
    const finalizer = this.matchKeyword("finally")
      ? (this.next(), this.parseBlockStatement())
      : null;

    if (!handler && !finalizer) {
      throw new ParseError("Try statement must have catch or finally");
    }

    return { type: "TryStatement", block, handler, finalizer };
  }

  private parseCatchClause(): ESTree.CatchClause {
    this.expectKeyword("catch");
    if (this.matchPunctuator("{")) {
      const body = this.parseBlockStatement();
      return { type: "CatchClause", param: null, body };
    }
    this.expectPunctuator("(");
    const param = this.parseBindingPattern();
    this.expectPunctuator(")");
    const body = this.parseBlockStatement();
    return { type: "CatchClause", param, body };
  }

  private parseFunctionDeclaration(): ESTree.FunctionDeclaration {
    const asyncFlag = this.matchKeyword("async");
    if (asyncFlag) {
      this.next();
    }
    this.expectKeyword("function");
    const generator = this.consumePunctuator("*");
    const id = this.parseIdentifier();
    const { params, body } = this.parseFunctionBody(asyncFlag, generator);
    return {
      type: "FunctionDeclaration",
      id,
      params,
      body,
      async: asyncFlag,
      generator,
    };
  }

  private parseFunctionExpression(): ESTree.FunctionExpression {
    const asyncFlag = this.matchKeyword("async");
    if (asyncFlag) {
      this.next();
    }
    this.expectKeyword("function");
    const generator = this.consumePunctuator("*");
    const id = this.match(TOKEN.Identifier) ? this.parseIdentifier() : null;
    const { params, body } = this.parseFunctionBody(asyncFlag, generator);
    return {
      type: "FunctionExpression",
      id,
      params,
      body,
      async: asyncFlag,
      generator,
    };
  }

  private parseFunctionBody(
    asyncFlag: boolean,
    generator: boolean,
  ): { params: ESTree.Pattern[]; body: ESTree.BlockStatement } {
    const prevFunction = this.inFunction;
    const prevGenerator = this.inGenerator;
    const prevAsync = this.inAsync;
    this.inFunction = true;
    this.inGenerator = generator;
    this.inAsync = asyncFlag;

    this.expectPunctuator("(");
    const params = this.parseFunctionParams();
    this.expectPunctuator(")");
    this.consumeTypeAnnotation(STOP_TOKENS_TYPE_RETURN_BLOCK);
    const body = this.parseBlockStatement();

    this.inFunction = prevFunction;
    this.inGenerator = prevGenerator;
    this.inAsync = prevAsync;

    return { params, body };
  }

  private parseFunctionParams(): ESTree.Pattern[] {
    const params: ESTree.Pattern[] = [];
    if (this.matchPunctuator(")")) {
      return params;
    }
    while (true) {
      if (this.matchPunctuator("...")) {
        this.next();
        const argument = this.parseBindingPattern();
        this.consumeTypeAnnotation(STOP_TOKENS_TYPE_REST);
        params.push({ type: "RestElement", argument });
      } else {
        this.consumeTypeScriptModifiers();
        const param = this.parseBindingPattern();
        if (this.consumePunctuator("?")) {
          // Optional parameter marker (TypeScript).
        }
        this.consumeTypeAnnotation(STOP_TOKENS_TYPE_PARAM);
        if (this.matchPunctuator("=")) {
          this.next();
          const right = this.parseAssignmentExpression();
          params.push({ type: "AssignmentPattern", left: param, right });
        } else {
          params.push(param);
        }
      }
      if (!this.consumePunctuator(",")) {
        break;
      }
    }
    return params;
  }

  private parseClassDeclaration(): ESTree.ClassDeclaration {
    this.expectKeyword("class");
    const id = this.match(TOKEN.Identifier) ? this.parseIdentifier() : null;
    const superClass = this.matchKeyword("extends")
      ? (this.next(), this.parseExpression())
      : null;
    if (this.matchIdentifierValue("implements")) {
      this.next();
      while (true) {
        this.skipType(STOP_TOKENS_TYPE_IMPLEMENTS);
        if (!this.consumePunctuator(",")) {
          break;
        }
      }
    }
    const body = this.parseClassBody();
    return { type: "ClassDeclaration", id, superClass, body };
  }

  private parseClassExpression(): ESTree.ClassExpression {
    this.expectKeyword("class");
    const id = this.match(TOKEN.Identifier) ? this.parseIdentifier() : null;
    const superClass = this.matchKeyword("extends")
      ? (this.next(), this.parseExpression())
      : null;
    if (this.matchIdentifierValue("implements")) {
      this.next();
      while (true) {
        this.skipType(STOP_TOKENS_TYPE_IMPLEMENTS);
        if (!this.consumePunctuator(",")) {
          break;
        }
      }
    }
    const body = this.parseClassBody();
    return { type: "ClassExpression", id, superClass, body };
  }

  private parseClassBody(): ESTree.ClassBody {
    this.expectPunctuator("{");
    const elements: (
      | ESTree.MethodDefinition
      | ESTree.PropertyDefinition
      | ESTree.StaticBlock
    )[] = [];
    while (!this.matchPunctuator("}")) {
      if (this.consumePunctuator(";")) {
        continue;
      }
      if (this.matchKeyword("static") && this.peekPunctuator("{")) {
        this.next();
        const block = this.parseBlockStatement();
        elements.push({ type: "StaticBlock", body: block.body });
        continue;
      }
      const element = this.parseClassElement();
      elements.push(element);
    }
    this.expectPunctuator("}");
    return { type: "ClassBody", body: elements };
  }

  private parseClassElement():
    | ESTree.MethodDefinition
    | ESTree.PropertyDefinition {
    let isStatic = false;
    let asyncFlag = false;
    let generator = false;
    let kind: "method" | "get" | "set" | "constructor" = "method";

    while (true) {
      if (this.matchIdentifierValue("static") && !this.peekPunctuator("{")) {
        this.next();
        isStatic = true;
        continue;
      }
      if (this.isTypeScriptModifier()) {
        this.next();
        continue;
      }
      break;
    }

    if (this.matchKeyword("get")) {
      this.next();
      kind = "get";
    } else if (this.matchKeyword("set")) {
      this.next();
      kind = "set";
    } else if (this.matchKeyword("async")) {
      this.next();
      asyncFlag = true;
    }

    if (this.consumePunctuator("*")) {
      generator = true;
    }

    const keyResult = this.parsePropertyKey();
    const { key, computed } = keyResult;

    if (kind === "method" && !generator && !asyncFlag && !isStatic) {
      if (key.type === "Identifier" && key.name === "constructor") {
        kind = "constructor";
      }
    }

    if (this.consumePunctuator("?")) {
      // Optional class element marker (TypeScript).
    }
    if (this.consumePunctuator("!")) {
      // Definite assignment assertion (TypeScript).
    }

    if (this.matchPunctuator("(")) {
      const func = this.parseMethodFunction(asyncFlag, generator);
      return {
        type: "MethodDefinition",
        key,
        computed,
        kind: kind === "constructor" ? "constructor" : kind,
        static: isStatic,
        value: func,
      };
    }

    this.consumeTypeAnnotation(STOP_TOKENS_TYPE_CLASS_FIELD);
    const value = this.matchPunctuator("=")
      ? (this.next(), this.parseExpression())
      : null;
    this.consumeSemicolon();
    return {
      type: "PropertyDefinition",
      key,
      value,
      computed,
      static: isStatic,
    };
  }

  private parseMethodFunction(
    asyncFlag: boolean,
    generator: boolean,
  ): ESTree.FunctionExpression {
    const prevFunction = this.inFunction;
    const prevGenerator = this.inGenerator;
    const prevAsync = this.inAsync;
    this.inFunction = true;
    this.inGenerator = generator;
    this.inAsync = asyncFlag;

    this.expectPunctuator("(");
    const params = this.parseFunctionParams();
    this.expectPunctuator(")");
    this.consumeTypeAnnotation(STOP_TOKENS_TYPE_RETURN_BLOCK);
    const body = this.parseBlockStatement();

    this.inFunction = prevFunction;
    this.inGenerator = prevGenerator;
    this.inAsync = prevAsync;

    return {
      type: "FunctionExpression",
      id: null,
      params,
      body,
      async: asyncFlag,
      generator,
    };
  }

  private parseVariableDeclaration(
    isForInit: boolean,
  ): ESTree.VariableDeclaration {
    const kind = this.currentValue as "let" | "const" | "var";
    this.next();
    const declarations: ESTree.VariableDeclarator[] = [];

    while (true) {
      const id = this.parseBindingPattern();
      this.consumeTypeAnnotation(STOP_TOKENS_TYPE_VAR);
      const init = this.matchPunctuator("=")
        ? (this.next(), this.parseExpression())
        : null;
      declarations.push({ type: "VariableDeclarator", id, init });
      if (!this.consumePunctuator(",")) {
        break;
      }
    }

    if (!isForInit) {
      this.consumeSemicolon();
    }

    return { type: "VariableDeclaration", declarations, kind };
  }

  private parseExpressionStatement(): ESTree.ExpressionStatement {
    const expression = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ExpressionStatement", expression };
  }

  private consumeTypeAnnotation(stopTokens: Set<string>): void {
    if (!this.matchPunctuator(":")) {
      return;
    }
    this.next();
    this.skipType(stopTokens);
  }

  private consumeTypeAssertions(
    expression: ESTree.Expression,
  ): ESTree.Expression {
    if (!this.matchIdentifierValue("as")) {
      return expression;
    }
    while (this.matchIdentifierValue("as")) {
      this.next();
      this.skipType(STOP_TOKENS_TYPE_ASSERTION);
    }
    return expression;
  }

  private consumeTypeScriptModifiers(): void {
    while (this.isTypeScriptModifier()) {
      this.next();
    }
  }

  private isTypeScriptModifier(): boolean {
    if (!this.match(TOKEN.Identifier) && !this.match(TOKEN.Keyword)) {
      return false;
    }
    switch (this.currentValue) {
      case "public":
      case "private":
      case "protected":
      case "readonly":
      case "abstract":
      case "override":
      case "declare":
        break;
      default:
        return false;
    }
    const peekType = this.tokenizer.peekType();
    return (
      peekType === TOKEN.Identifier ||
      peekType === TOKEN.Keyword ||
      peekType === TOKEN.PrivateIdentifier
    );
  }

  private skipType(stopTokens: Set<string>): void {
    // Fast exit when already at a stop token.
    if (stopTokens.has(this.currentValue)) {
      return;
    }
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;

    while (!this.match(TOKEN.EOF)) {
      if (
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        angleDepth === 0
      ) {
        if (stopTokens.has(this.currentValue)) {
          return;
        }
      }

      if (this.currentType === TOKEN.Punctuator) {
        switch (this.currentValue) {
          case "(":
            parenDepth += 1;
            this.next();
            continue;
          case ")":
            if (parenDepth > 0) {
              parenDepth -= 1;
            }
            this.next();
            continue;
          case "{":
            braceDepth += 1;
            this.next();
            continue;
          case "}":
            if (braceDepth > 0) {
              braceDepth -= 1;
            }
            this.next();
            continue;
          case "[":
            bracketDepth += 1;
            this.next();
            continue;
          case "]":
            if (bracketDepth > 0) {
              bracketDepth -= 1;
            }
            this.next();
            continue;
          case "<":
            angleDepth += 1;
            this.next();
            continue;
          case ">":
            if (angleDepth > 0) {
              angleDepth -= 1;
            }
            this.next();
            continue;
        }
      }

      this.next();
    }
  }

  private skipTypeBlock(): void {
    if (!this.matchPunctuator("{")) {
      throw new ParseError("Expected '{' for interface body");
    }
    let depth = 0;
    while (!this.match(TOKEN.EOF)) {
      if (this.currentType === TOKEN.Punctuator) {
        if (this.currentValue === "{") {
          depth += 1;
          this.next();
          continue;
        }
        if (this.currentValue === "}") {
          depth -= 1;
          this.next();
          if (depth === 0) {
            return;
          }
          continue;
        }
      }
      this.next();
    }
    throw new ParseError("Unterminated interface body");
  }

  private parseExpression(allowIn = true): ESTree.Expression {
    return this.parseAssignmentExpression(allowIn);
  }

  // Try arrow parsing first since it shares a prefix with grouping/expressions.
  private parseAssignmentExpression(allowIn = true): ESTree.Expression {
    const arrow = this.tryParseArrowFunction();
    if (arrow) {
      return arrow;
    }

    let leftExpression = this.parseConditionalExpression(allowIn);
    leftExpression = this.consumeTypeAssertions(leftExpression);
    if (
      this.matchPunctuator("=") ||
      this.isAssignmentOperator(this.currentType, this.currentValue)
    ) {
      const operator = this.currentValue;
      this.next();
      const right = this.parseAssignmentExpression(allowIn);
      const left = this.normalizeAssignmentTarget(leftExpression);
      return { type: "AssignmentExpression", operator, left, right };
    }
    return leftExpression;
  }

  private parseConditionalExpression(allowIn = true): ESTree.Expression {
    const test = this.parseLogicalExpression(allowIn);
    if (!this.consumePunctuator("?")) {
      return test;
    }
    const consequent = this.parseAssignmentExpression(allowIn);
    this.expectPunctuator(":");
    const alternate = this.parseAssignmentExpression(allowIn);
    return { type: "ConditionalExpression", test, consequent, alternate };
  }

  private parseLogicalExpression(allowIn = true): ESTree.Expression {
    return this.parseLogicalPrecedence(0, allowIn);
  }

  // Precedence-climbing for logical operators (&& > ||/??).
  private parseLogicalPrecedence(
    minPrecedence: number,
    allowIn: boolean,
  ): ESTree.Expression {
    let left = this.parseBinaryExpression(allowIn);
    while (true) {
      const operator = this.currentValue;
      const precedence = this.getLogicalPrecedence(operator);
      if (precedence < minPrecedence) {
        break;
      }
      this.next();
      const right = this.parseLogicalPrecedence(precedence + 1, allowIn);
      left = {
        type: "LogicalExpression",
        operator,
        left,
        right,
      };
    }
    return left;
  }

  private parseBinaryExpression(allowIn = true): ESTree.Expression {
    return this.parseBinaryPrecedence(0, allowIn);
  }

  // Precedence-climbing for binary operators, with optional "in" suppression.
  private parseBinaryPrecedence(
    minPrecedence: number,
    allowIn: boolean,
  ): ESTree.Expression {
    let left = this.parseExponentExpression();
    while (true) {
      const operator = this.currentValue;
      if (!allowIn && operator === "in") {
        break;
      }
      const precedence = this.getBinaryPrecedence(operator);
      if (precedence < minPrecedence) {
        break;
      }
      this.next();
      const right = this.parseBinaryPrecedence(precedence + 1, allowIn);
      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }
    return left;
  }

  private parseExponentExpression(): ESTree.Expression {
    const left = this.parseUnaryExpression();
    if (this.matchPunctuator("**")) {
      const operator = this.currentValue;
      this.next();
      const right = this.parseExponentExpression();
      return { type: "BinaryExpression", operator, left, right };
    }
    return left;
  }

  private parseUnaryExpression(): ESTree.Expression {
    if (this.matchPunctuator("++") || this.matchPunctuator("--")) {
      const operator = this.currentValue;
      this.next();
      const argument = this.parseUnaryExpression();
      return { type: "UpdateExpression", operator, argument, prefix: true };
    }

    if (
      this.matchKeyword("await") &&
      (this.inAsync || (!this.inFunction && this.allowTopLevelAwait))
    ) {
      this.next();
      const argument = this.parseUnaryExpression();
      return { type: "AwaitExpression", argument };
    }

    if (this.matchKeyword("yield") && this.inGenerator) {
      this.next();
      const delegate = this.consumePunctuator("*");
      const argument = this.shouldParseYieldArgument()
        ? this.parseAssignmentExpression()
        : null;
      return { type: "YieldExpression", argument, delegate };
    }

    if (this.isUnaryOperator(this.currentType, this.currentValue)) {
      const operator = this.currentValue;
      this.next();
      const argument = this.parseUnaryExpression();
      return { type: "UnaryExpression", operator, argument, prefix: true };
    }

    const expression = this.parseLeftHandSideExpression();
    if (this.matchPunctuator("++") || this.matchPunctuator("--")) {
      const operator = this.currentValue;
      this.next();
      return {
        type: "UpdateExpression",
        operator,
        argument: expression,
        prefix: false,
      };
    }
    return expression;
  }

  // Builds member/call chains and wraps optional chains in ChainExpression.
  private parseLeftHandSideExpression(): ESTree.Expression {
    let expression = this.parseNewExpression();
    let usedOptional = false;

    while (true) {
      if (this.currentType !== TOKEN.Punctuator) {
        break;
      }
      switch (this.currentValue) {
        case "?.": {
          if (this.peekPunctuator("(")) {
            this.expectPunctuator("?.");
            const args = this.parseArguments();
            expression = {
              type: "CallExpression",
              callee: expression,
              arguments: args,
              optional: true,
            };
            usedOptional = true;
            continue;
          }
          if (this.peekPunctuator("[")) {
            this.expectPunctuator("?.");
            this.expectPunctuator("[");
            const property = this.parseExpression();
            this.expectPunctuator("]");
            expression = {
              type: "MemberExpression",
              object: expression,
              property,
              computed: true,
              optional: true,
            };
            usedOptional = true;
            continue;
          }
          if (
            this.peek(TOKEN.Identifier) ||
            this.peek(TOKEN.PrivateIdentifier)
          ) {
            this.expectPunctuator("?.");
            const property = this.parseMemberProperty();
            expression = {
              type: "MemberExpression",
              object: expression,
              property,
              computed: false,
              optional: true,
            };
            usedOptional = true;
            continue;
          }
          break;
        }
        case ".": {
          this.next();
          const property = this.parseMemberProperty();
          expression = {
            type: "MemberExpression",
            object: expression,
            property,
            computed: false,
            optional: false,
          };
          continue;
        }
        case "[": {
          this.next();
          const computedProperty = this.parseExpression();
          this.expectPunctuator("]");
          expression = {
            type: "MemberExpression",
            object: expression,
            property: computedProperty,
            computed: true,
            optional: false,
          };
          continue;
        }
        case "(": {
          const args = this.parseArguments();
          expression = {
            type: "CallExpression",
            callee: expression,
            arguments: args,
            optional: false,
          };
          continue;
        }
        default:
          break;
      }
      break;
    }

    if (usedOptional) {
      return { type: "ChainExpression", expression };
    }
    return expression;
  }

  private parseNewExpression(): ESTree.Expression {
    if (this.matchKeyword("new")) {
      this.next();
      const callee = this.parseNewExpression();
      const args = this.matchPunctuator("(") ? this.parseArguments() : [];
      return { type: "NewExpression", callee, arguments: args };
    }
    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ESTree.Expression {
    switch (this.currentType) {
      case TOKEN.Identifier:
        return this.parseIdentifier();
      case TOKEN.Number: {
        const raw = this.currentValue;
        this.next();
        return { type: "Literal", value: this.parseNumberLiteral(raw), raw };
      }
      case TOKEN.String: {
        const value = this.currentValue;
        this.next();
        return { type: "Literal", value };
      }
      case TOKEN.Keyword:
        switch (this.currentValue) {
          case "true":
          case "false":
          case "null": {
            const value = this.currentValue;
            this.next();
            return {
              type: "Literal",
              value: value === "true" ? true : value === "false" ? false : null,
            };
          }
          case "this":
            this.next();
            return { type: "ThisExpression" };
          case "super":
            this.next();
            return { type: "Super" };
          case "function":
            return this.parseFunctionExpression();
          case "async":
            if (this.peekKeyword("function")) {
              return this.parseFunctionExpression();
            }
            break;
          case "class":
            return this.parseClassExpression();
          default:
            break;
        }
        break;
      case TOKEN.Punctuator:
        switch (this.currentValue) {
          case "`":
            return this.parseTemplateLiteral();
          case "(":
            this.next();
            const expression = this.parseExpression();
            this.expectPunctuator(")");
            return expression;
          case "[":
            return this.parseArrayExpression();
          case "{":
            return this.parseObjectExpression();
          default:
            break;
        }
        break;
      default:
        break;
    }

    throw new ParseError(`Unexpected token: ${this.currentValue}`);
  }

  private parseTemplateLiteral(): ESTree.TemplateLiteral {
    if (!this.matchPunctuator("`")) {
      throw new ParseError("Expected template literal start");
    }
    const quasis: ESTree.TemplateElement[] = [];
    const expressions: ESTree.Expression[] = [];

    while (true) {
      const element = this.tokenizer.readTemplateElement();
      quasis.push({
        type: "TemplateElement",
        value: { raw: element.raw, cooked: element.cooked },
        tail: element.tail,
      });
      if (element.tail) {
        break;
      }
      this.next();
      const expr = this.parseExpression();
      expressions.push(expr);
      if (!this.matchPunctuator("}")) {
        throw new ParseError("Unterminated template expression");
      }
      // Do not advance tokens here; the tokenizer index is already after `}`.
    }

    this.next();
    return { type: "TemplateLiteral", quasis, expressions };
  }

  private parseArrayExpression(): ESTree.ArrayExpression {
    this.expectPunctuator("[");
    const elements: (ESTree.Expression | ESTree.SpreadElement | null)[] = [];
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "]") {
      this.next();
      return { type: "ArrayExpression", elements };
    }

    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "]") {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        elements.push(null);
        continue;
      }
      if (
        this.currentType === TOKEN.Punctuator &&
        this.currentValue === "..."
      ) {
        this.next();
        const argument = this.parseExpression();
        elements.push({ type: "SpreadElement", argument });
      } else {
        elements.push(this.parseExpression());
      }
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        continue;
      }
      break;
    }
    this.expectPunctuator("]");
    return { type: "ArrayExpression", elements };
  }

  private parseObjectExpression(): ESTree.ObjectExpression {
    this.expectPunctuator("{");
    const properties: (ESTree.Property | ESTree.SpreadElement)[] = [];
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "}") {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        continue;
      }
      if (
        this.currentType === TOKEN.Punctuator &&
        this.currentValue === "..."
      ) {
        this.next();
        const argument = this.parseExpression();
        properties.push({ type: "SpreadElement", argument });
        if (
          this.currentType === TOKEN.Punctuator &&
          this.currentValue === ","
        ) {
          this.next();
        }
        continue;
      }
      const property = this.parseObjectProperty();
      properties.push(property);
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
      }
    }
    this.expectPunctuator("}");
    return { type: "ObjectExpression", properties };
  }

  private parseObjectProperty(): ESTree.Property {
    const startValue = this.currentValue;
    const keyResult = this.parsePropertyKey();
    const key = keyResult.key;
    const computed = keyResult.computed;
    if (key.type === "PrivateIdentifier") {
      throw new ParseError(
        "Private identifiers are not valid in object literals",
      );
    }

    if (this.matchPunctuator("(")) {
      const value = this.parseMethodFunction(false, false);
      return {
        type: "Property",
        key,
        value,
        kind: "init",
        method: true,
        shorthand: false,
        computed,
      };
    }

    if (this.consumePunctuator(":")) {
      const value = this.parseExpression();
      return {
        type: "Property",
        key,
        value,
        kind: "init",
        method: false,
        shorthand: false,
        computed,
      };
    }

    if (key.type === "Identifier") {
      if (this.consumePunctuator("=")) {
        const right = this.parseAssignmentExpression();
        return {
          type: "Property",
          key,
          value: { type: "AssignmentPattern", left: key, right },
          kind: "init",
          method: false,
          shorthand: true,
          computed: false,
        };
      }
      return {
        type: "Property",
        key,
        value: key,
        kind: "init",
        method: false,
        shorthand: true,
        computed: false,
      };
    }

    throw new ParseError(`Invalid object property starting at ${startValue}`);
  }

  private parseArguments(): (ESTree.Expression | ESTree.SpreadElement)[] {
    this.expectPunctuator("(");
    const args: (ESTree.Expression | ESTree.SpreadElement)[] = [];
    if (this.currentType === TOKEN.Punctuator && this.currentValue === ")") {
      this.next();
      return args;
    }
    while (true) {
      if (
        this.currentType === TOKEN.Punctuator &&
        this.currentValue === "..."
      ) {
        this.next();
        const argument = this.parseExpression();
        args.push({ type: "SpreadElement", argument });
      } else {
        args.push(this.parseExpression());
      }
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        continue;
      }
      break;
    }
    this.expectPunctuator(")");
    return args;
  }

  private parseBindingPattern(): ESTree.Pattern {
    if (this.currentType === TOKEN.Identifier) {
      return this.parseIdentifier();
    }
    if (this.currentType === TOKEN.Punctuator) {
      if (this.currentValue === "[") {
        return this.parseArrayPattern();
      }
      if (this.currentValue === "{") {
        return this.parseObjectPattern();
      }
    }
    throw new ParseError("Invalid binding pattern");
  }

  private parseArrayPattern(): ESTree.ArrayPattern {
    this.expectPunctuator("[");
    const elements: (ESTree.Pattern | ESTree.RestElement | null)[] = [];
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "]") {
      this.next();
      return { type: "ArrayPattern", elements };
    }
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "]") {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        elements.push(null);
        continue;
      }
      if (
        this.currentType === TOKEN.Punctuator &&
        this.currentValue === "..."
      ) {
        this.next();
        const argument = this.parseBindingPattern();
        elements.push({ type: "RestElement", argument });
      } else {
        const element = this.parseBindingPattern();
        if (
          this.currentType === TOKEN.Punctuator &&
          this.currentValue === "="
        ) {
          this.next();
          const right = this.parseAssignmentExpression();
          elements.push({ type: "AssignmentPattern", left: element, right });
        } else {
          elements.push(element);
        }
      }
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        continue;
      }
      break;
    }
    this.expectPunctuator("]");
    return { type: "ArrayPattern", elements };
  }

  private parseObjectPattern(): ESTree.ObjectPattern {
    this.expectPunctuator("{");
    const properties: (ESTree.Property | ESTree.RestElement)[] = [];
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "}") {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        continue;
      }
      if (
        this.currentType === TOKEN.Punctuator &&
        this.currentValue === "..."
      ) {
        this.next();
        const argument = this.parseBindingPattern();
        properties.push({ type: "RestElement", argument });
        if (
          this.currentType === TOKEN.Punctuator &&
          this.currentValue === ","
        ) {
          this.next();
        }
        continue;
      }
      const property = this.parseObjectPatternProperty();
      properties.push(property);
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
      }
    }
    this.expectPunctuator("}");
    return { type: "ObjectPattern", properties };
  }

  private parseObjectPatternProperty(): ESTree.Property {
    const keyResult = this.parsePropertyKey();
    const key = keyResult.key;
    const computed = keyResult.computed;
    if (key.type === "PrivateIdentifier") {
      throw new ParseError(
        "Private identifiers are not valid in object patterns",
      );
    }

    if (this.consumePunctuator(":")) {
      const value = this.parseBindingPattern();
      if (this.matchPunctuator("=")) {
        this.next();
        const right = this.parseAssignmentExpression();
        return {
          type: "Property",
          key,
          value: { type: "AssignmentPattern", left: value, right },
          kind: "init",
          method: false,
          shorthand: false,
          computed,
        };
      }
      return {
        type: "Property",
        key,
        value,
        kind: "init",
        method: false,
        shorthand: false,
        computed,
      };
    }

    if (key.type !== "Identifier") {
      throw new ParseError("Object pattern shorthand requires identifier key");
    }

    if (this.consumePunctuator("=")) {
      const right = this.parseAssignmentExpression();
      return {
        type: "Property",
        key,
        value: { type: "AssignmentPattern", left: key, right },
        kind: "init",
        method: false,
        shorthand: true,
        computed: false,
      };
    }

    return {
      type: "Property",
      key,
      value: key,
      kind: "init",
      method: false,
      shorthand: true,
      computed: false,
    };
  }

  private parsePropertyKey(): {
    key: ESTree.Expression | ESTree.PrivateIdentifier;
    computed: boolean;
  } {
    switch (this.currentType) {
      case TOKEN.Punctuator:
        if (this.currentValue === "[") {
          this.next();
          const key = this.parseExpression();
          this.expectPunctuator("]");
          return { key, computed: true };
        }
        break;
      case TOKEN.PrivateIdentifier: {
        const name = this.currentValue;
        this.next();
        return { key: { type: "PrivateIdentifier", name }, computed: false };
      }
      case TOKEN.Identifier:
        return { key: this.parseIdentifier(), computed: false };
      case TOKEN.Keyword: {
        const name = this.currentValue;
        this.next();
        return { key: { type: "Identifier", name }, computed: false };
      }
      case TOKEN.String: {
        const value = this.currentValue;
        this.next();
        return { key: { type: "Literal", value }, computed: false };
      }
      case TOKEN.Number: {
        const raw = this.currentValue;
        this.next();
        return {
          key: { type: "Literal", value: this.parseNumberLiteral(raw), raw },
          computed: false,
        };
      }
    }
    throw new ParseError("Invalid property key");
  }

  private parseMemberProperty(): ESTree.Expression | ESTree.PrivateIdentifier {
    switch (this.currentType) {
      case TOKEN.PrivateIdentifier: {
        const name = this.currentValue;
        this.next();
        return { type: "PrivateIdentifier", name };
      }
      case TOKEN.Keyword: {
        const name = this.currentValue;
        this.next();
        return { type: "Identifier", name };
      }
      default:
        return this.parseIdentifier();
    }
  }

  private parseIdentifier(): ESTree.Identifier {
    switch (this.currentType) {
      case TOKEN.Identifier: {
        const name = this.currentValue;
        this.next();
        return { type: "Identifier", name };
      }
      case TOKEN.Keyword: {
        if (!this.isIdentifierKeyword(this.currentValue)) {
          break;
        }
        const name = this.currentValue;
        this.next();
        return { type: "Identifier", name };
      }
      default:
        break;
    }
    throw new ParseError(`Expected identifier but found ${this.currentValue}`);
  }

  private parseNumberLiteral(raw: string): number {
    if (raw.startsWith("0x") || raw.startsWith("0X")) {
      return Number.parseInt(raw.slice(2), 16);
    }
    if (raw.startsWith("0b") || raw.startsWith("0B")) {
      return Number.parseInt(raw.slice(2), 2);
    }
    if (raw.startsWith("0o") || raw.startsWith("0O")) {
      return Number.parseInt(raw.slice(2), 8);
    }
    return Number.parseFloat(raw);
  }

  private tryParseArrowFunction(): ESTree.ArrowFunctionExpression | null {
    if (this.matchKeyword("async") && !this.tokenizer.peekLineBreakBefore()) {
      const snapshot = this.snapshot();
      this.next();
      const params = this.tryParseArrowParams();
      if (params) {
        const body = this.parseArrowFunctionBody();
        return { type: "ArrowFunctionExpression", params, body, async: true };
      }
      this.restore(snapshot);
    }

    if (this.match(TOKEN.Identifier) && !this.matchIdentifierValue("async")) {
      const nextValue = this.tokenizer.peekValue();
      if (nextValue !== "=>" && nextValue !== ":") {
        return null;
      }
    }

    const params = this.tryParseArrowParams();
    if (params) {
      const body = this.parseArrowFunctionBody();
      return { type: "ArrowFunctionExpression", params, body, async: false };
    }
    return null;
  }

  private parseArrowFunctionBody(): ESTree.BlockStatement | ESTree.Expression {
    if (this.matchPunctuator("{")) {
      return this.parseBlockStatement();
    }
    return this.parseAssignmentExpression();
  }

  private tryParseArrowParams(): ESTree.Pattern[] | null {
    const snapshot = this.snapshot();
    try {
      if (this.match(TOKEN.Identifier)) {
        const param = this.parseIdentifier();
        if (this.consumePunctuator(":")) {
          this.skipType(STOP_TOKENS_TYPE_ARROW);
        }
        if (this.consumePunctuator("=>")) {
          return [param];
        }
        this.restore(snapshot);
        return null;
      }
      if (this.matchPunctuator("(")) {
        this.next();
        const params = this.matchPunctuator(")")
          ? []
          : this.parseFunctionParams();
        this.expectPunctuator(")");
        this.consumeTypeAnnotation(STOP_TOKENS_TYPE_ARROW);
        if (this.consumePunctuator("=>")) {
          return params;
        }
      }
      this.restore(snapshot);
      return null;
    } catch {
      this.restore(snapshot);
      return null;
    }
  }

  private normalizeAssignmentTarget(
    expression: ESTree.Expression | ESTree.Pattern,
  ): ESTree.Pattern | ESTree.MemberExpression {
    if (this.isAssignablePattern(expression)) {
      return expression as ESTree.Pattern;
    }
    if (expression.type === "MemberExpression") {
      return expression;
    }
    if (expression.type === "ArrayExpression") {
      return this.convertArrayExpressionToPattern(expression);
    }
    if (expression.type === "ObjectExpression") {
      return this.convertObjectExpressionToPattern(expression);
    }
    throw new ParseError("Invalid left-hand side in assignment");
  }

  private convertArrayExpressionToPattern(
    expression: ESTree.ArrayExpression,
  ): ESTree.ArrayPattern {
    const elements = expression.elements.map((element) => {
      if (!element) {
        return null;
      }
      if (element.type === "SpreadElement") {
        const argument = this.normalizePatternElement(element.argument);
        const rest: ESTree.RestElement = { type: "RestElement", argument };
        return rest;
      }
      return this.normalizePatternElement(element);
    });
    return { type: "ArrayPattern", elements };
  }

  private convertObjectExpressionToPattern(
    expression: ESTree.ObjectExpression,
  ): ESTree.ObjectPattern {
    const properties: (ESTree.Property | ESTree.RestElement)[] = [];
    for (const property of expression.properties) {
      if (property.type === "SpreadElement") {
        properties.push({
          type: "RestElement",
          argument: this.normalizePatternElement(property.argument),
        });
        continue;
      }
      if (property.type === "Property") {
        const value = this.normalizePatternElement(
          property.value as ESTree.Expression,
        );
        properties.push({
          type: "Property",
          key: property.key,
          value,
          kind: "init",
          method: false,
          shorthand: property.shorthand,
          computed: property.computed,
        });
      }
    }
    return { type: "ObjectPattern", properties };
  }

  private normalizePatternElement(
    element: ESTree.Expression | ESTree.Pattern,
  ): ESTree.Pattern {
    if (this.isAssignablePattern(element)) {
      return element as ESTree.Pattern;
    }
    if (element.type === "ArrayExpression") {
      return this.convertArrayExpressionToPattern(element);
    }
    if (element.type === "ObjectExpression") {
      return this.convertObjectExpressionToPattern(element);
    }
    throw new ParseError("Invalid destructuring pattern");
  }

  private isAssignablePattern(
    node: ESTree.Expression | ESTree.Pattern,
  ): boolean {
    return (
      node.type === "Identifier" ||
      node.type === "ArrayPattern" ||
      node.type === "ObjectPattern" ||
      node.type === "AssignmentPattern" ||
      node.type === "RestElement"
    );
  }

  private isUnaryOperator(type: TokenType, value: string): boolean {
    if (type === TOKEN.Punctuator) {
      return UNARY_OPERATORS.has(value);
    }
    if (type !== TOKEN.Keyword) {
      return false;
    }
    return value === "typeof" || value === "delete";
  }

  private shouldParseYieldArgument(): boolean {
    if (
      this.matchPunctuator(";") ||
      this.matchPunctuator(")") ||
      this.matchPunctuator("}")
    ) {
      return false;
    }
    if (this.currentLineBreakBefore) {
      return false;
    }
    return true;
  }

  private getBinaryPrecedence(operator: string): number {
    switch (operator) {
      case "**":
        return 7;
      case "*":
      case "/":
      case "%":
        return 6;
      case "+":
      case "-":
        return 5;
      case "<":
      case "<=":
      case ">":
      case ">=":
        return 4;
      case "in":
        return 4;
      case "==":
      case "!=":
      case "===":
      case "!==":
        return 3;
      default:
        return -1;
    }
  }

  private getLogicalPrecedence(operator: string): number {
    switch (operator) {
      case "&&":
        return 2;
      case "||":
      case "??":
        return 1;
      default:
        return -1;
    }
  }

  private isAssignmentOperator(type: TokenType, value: string): boolean {
    return type === TOKEN.Punctuator && this.isAssignmentOperatorValue(value);
  }

  private isAssignmentOperatorValue(value: string): boolean {
    switch (value) {
      case "=":
      case "||=":
      case "&&=":
      case "??=":
      case "+=":
      case "-=":
      case "*=":
      case "/=":
      case "%=":
        return true;
      default:
        return false;
    }
  }

  private isAsyncFunctionDeclaration(): boolean {
    return this.matchKeyword("async") && this.peekKeyword("function");
  }

  private isIdentifierKeyword(value: string): boolean {
    if (value === "await") {
      return !this.inAsync && !this.allowTopLevelAwait;
    }
    if (value === "yield") {
      return !this.inGenerator;
    }
    return false;
  }

  private match(type: TokenType): boolean {
    return this.currentType === type;
  }

  private matchKeyword(value: string): boolean {
    return this.currentType === TOKEN.Keyword && this.currentValue === value;
  }

  private matchIdentifierValue(value: string): boolean {
    return (
      (this.currentType === TOKEN.Identifier ||
        this.currentType === TOKEN.Keyword) &&
      this.currentValue === value
    );
  }

  private peekKeyword(value: string): boolean {
    return (
      this.tokenizer.peekType() === TOKEN.Keyword &&
      this.tokenizer.peekValue() === value
    );
  }

  private matchPunctuator(value: string): boolean {
    return this.currentType === TOKEN.Punctuator && this.currentValue === value;
  }

  private peekPunctuator(value: string): boolean {
    return (
      this.tokenizer.peekType() === TOKEN.Punctuator &&
      this.tokenizer.peekValue() === value
    );
  }

  private peek(type: TokenType): boolean {
    return this.tokenizer.peekType() === type;
  }

  private next(): void {
    this.tokenizer.next();
    this.syncCurrent();
  }

  private expectKeyword(value: string): void {
    if (!this.matchKeyword(value)) {
      throw new ParseError(`Expected keyword '${value}'`);
    }
    this.next();
  }

  private expectPunctuator(value: string): void {
    if (!this.matchPunctuator(value)) {
      throw new ParseError(`Expected '${value}'`);
    }
    this.next();
  }

  private consumePunctuator(value: string): boolean {
    if (this.matchPunctuator(value)) {
      this.next();
      return true;
    }
    return false;
  }

  private consumeSemicolon(): void {
    if (this.consumePunctuator(";")) {
      return;
    }
    if (this.matchPunctuator("}") || this.match(TOKEN.EOF)) {
      return;
    }
    if (this.currentLineBreakBefore) {
      return;
    }
  }

  private snapshot(): {
    type: TokenType;
    value: string;
    lineBreakBefore: boolean;
    tokenizer: {
      index: number;
      currentType: TokenType;
      currentValue: string;
      currentLineBreakBefore: boolean;
      lookaheadType: TokenType;
      lookaheadValue: string;
      lookaheadLineBreakBefore: boolean;
      hasLookahead: boolean;
    };
  } {
    return {
      type: this.currentType,
      value: this.currentValue,
      lineBreakBefore: this.currentLineBreakBefore,
      tokenizer: this.tokenizer.snapshot(),
    };
  }

  private restore(snapshot: {
    type: TokenType;
    value: string;
    lineBreakBefore: boolean;
    tokenizer: {
      index: number;
      currentType: TokenType;
      currentValue: string;
      currentLineBreakBefore: boolean;
      lookaheadType: TokenType;
      lookaheadValue: string;
      lookaheadLineBreakBefore: boolean;
      hasLookahead: boolean;
    };
  }): void {
    this.tokenizer.restore(snapshot.tokenizer);
    this.currentType = snapshot.type;
    this.currentValue = snapshot.value;
    this.currentLineBreakBefore = snapshot.lineBreakBefore;
  }

  private syncCurrent(): void {
    this.currentType = this.tokenizer.currentTypeValue();
    this.currentValue = this.tokenizer.currentValueValue();
    this.currentLineBreakBefore = this.tokenizer.currentLineBreakValue();
  }
}

export function parseModule(
  input: string,
  _options: ParseOptions = {},
): ESTree.Program {
  const parser = new Parser(input, true);
  return parser.parseProgram();
}

export function parseModuleWithProfile(input: string): {
  ast: ESTree.Program;
  profile: ParseProfile;
} {
  const profile = {
    tokens: 0,
    tokenizeMs: 0,
    parseMs: 0,
  };
  const start = now();
  const parser = new Parser(input, true, profile);
  const ast = parser.parseProgram();
  const end = now();
  const total = end - start;
  const parseMs = Math.max(0, total - profile.tokenizeMs);
  return {
    ast,
    profile: {
      tokens: profile.tokens,
      tokenizeMs: profile.tokenizeMs,
      parseMs,
    },
  };
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
