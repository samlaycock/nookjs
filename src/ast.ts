export interface Location {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

interface ParseOptions {
  readonly next?: boolean;
  readonly profile?: boolean;
}

interface ParseProfile {
  readonly tokens: number;
  readonly tokenizeMs: number;
  readonly parseMs: number;
}

export namespace ESTree {
  export interface Node {
    readonly type: string;
    readonly loc?: Location;
    readonly line?: number;
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
    | ClassDeclaration
    | LabeledStatement;

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
    | TaggedTemplateExpression
    | SequenceExpression
    | ChainExpression
    | ClassExpression;

  export type Pattern = Identifier | ObjectPattern | ArrayPattern | AssignmentPattern | RestElement;

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
    readonly value: string | number | boolean | null | RegExp | bigint;
    readonly raw?: string;
    readonly regex?: { pattern: string; flags: string };
    readonly bigint?: string;
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

  export interface LabeledStatement extends Node {
    readonly type: "LabeledStatement";
    readonly label: Identifier;
    readonly body: Statement;
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

  export interface TaggedTemplateExpression extends Node {
    readonly type: "TaggedTemplateExpression";
    readonly tag: Expression;
    readonly quasi: TemplateLiteral;
  }

  export interface SequenceExpression extends Node {
    readonly type: "SequenceExpression";
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
  RegExp: 7,
  BigInt: 8,
} as const;

type TokenType = (typeof TOKEN)[keyof typeof TOKEN];

const isKeyword = (value: string): boolean => {
  switch (value) {
    case "let":
    case "const":
    case "var":
    case "if":
    case "else":
    case "while":
    case "do":
    case "for":
    case "of":
    case "in":
    case "instanceof":
    case "switch":
    case "case":
    case "default":
    case "break":
    case "continue":
    case "function":
    case "return":
    case "class":
    case "extends":
    case "new":
    case "this":
    case "super":
    case "try":
    case "catch":
    case "finally":
    case "throw":
    case "delete":
    case "async":
    case "await":
    case "yield":
    case "get":
    case "set":
    case "static":
    case "true":
    case "false":
    case "null":
    case "typeof":
    case "void":
      return true;
    default:
      return false;
  }
};

// Fast lookup for single-character punctuators with no multi-char variants.
const SINGLE_CHAR_PUNCTUATORS: Record<number, string> = {
  44: ",",
  58: ":",
  59: ";",
  40: "(",
  41: ")",
  123: "{",
  125: "}",
  91: "[",
  93: "]",
  126: "~",
};

const STOP_TOKEN = {
  Equals: 0,
  Semicolon: 1,
  Interface: 2,
  Implements: 3,
  ReturnBlock: 4,
  Param: 5,
  Rest: 6,
  Var: 7,
  ClassField: 8,
  Assertion: 9,
  Arrow: 10,
} as const;

type StopToken = (typeof STOP_TOKEN)[keyof typeof STOP_TOKEN];

export class ParseError extends Error {
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
  currentLine = 1;
  currentColumn = 1;

  constructor(input: string, profiler?: { tokens: number; tokenizeMs: number }) {
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

  // Rescan the current `/` or `/=` token as a regex literal.
  // Called by the parser when it determines `/` starts a regex, not division.
  // The tokenizer index has already advanced past `/` (or `/=`), so we back up.
  rescanAsRegExp(currentPunctuator: string): {
    pattern: string;
    flags: string;
  } {
    // Back up past the `/` or `/=` that was already consumed.
    this.index -= currentPunctuator.length;
    // Now this.index should point at `/`.
    const input = this.input;
    const length = input.length;
    this.index += 1; // skip the opening `/`
    let pattern = "";
    let inCharClass = false;

    while (this.index < length) {
      const code = input.charCodeAt(this.index);
      if (code === 10 || code === 13) {
        throw new ParseError("Unterminated regular expression literal");
      }
      if (inCharClass) {
        if (code === 93) {
          // ]
          inCharClass = false;
          pattern += input[this.index]!;
          this.index += 1;
        } else if (code === 92) {
          // backslash
          pattern += input[this.index]!;
          this.index += 1;
          if (this.index < length) {
            pattern += input[this.index]!;
            this.index += 1;
          }
        } else {
          pattern += input[this.index]!;
          this.index += 1;
        }
      } else if (code === 47) {
        // closing `/`
        this.index += 1;
        break;
      } else if (code === 91) {
        // [
        inCharClass = true;
        pattern += input[this.index]!;
        this.index += 1;
      } else if (code === 92) {
        // backslash
        pattern += input[this.index]!;
        this.index += 1;
        if (this.index < length) {
          pattern += input[this.index]!;
          this.index += 1;
        }
      } else {
        pattern += input[this.index]!;
        this.index += 1;
      }
    }

    // Read flags (g, i, m, s, u, v, y, d)
    let flags = "";
    while (this.index < length) {
      const code = input.charCodeAt(this.index);
      const isFlag =
        (code >= 97 && code <= 122) || // a-z
        (code >= 65 && code <= 90); // A-Z
      if (!isFlag) break;
      flags += input[this.index]!;
      this.index += 1;
    }

    // Clear lookahead since we've changed the index.
    this.hasLookahead = false;

    return { pattern, flags };
  }

  // Reads a template element, returning raw/cooked values and tail flag.
  readTemplateElement(): { raw: string; cooked: string; tail: boolean } {
    const start = this.index;
    const input = this.input;
    const length = input.length;
    // Accumulate raw/cooked chunks to avoid per-char string concatenation.
    let rawParts: string[] | null = null;
    let cookedParts: string[] | null = null;
    let segmentStart = this.index;

    while (this.index < length) {
      const code = input.charCodeAt(this.index);
      if (code === 96) {
        const tailSegment = input.slice(segmentStart, this.index);
        const raw = rawParts ? (rawParts.push(tailSegment), rawParts.join("")) : tailSegment;
        const cooked = cookedParts
          ? (cookedParts.push(tailSegment), cookedParts.join(""))
          : tailSegment;
        this.index += 1;
        return { raw, cooked, tail: true };
      }
      if (code === 36 && input.charCodeAt(this.index + 1) === 123) {
        const tailSegment = input.slice(segmentStart, this.index);
        const raw = rawParts ? (rawParts.push(tailSegment), rawParts.join("")) : tailSegment;
        const cooked = cookedParts
          ? (cookedParts.push(tailSegment), cookedParts.join(""))
          : tailSegment;
        this.index += 2;
        return { raw, cooked, tail: false };
      }
      if (code === 92) {
        if (!rawParts) {
          rawParts = [];
          cookedParts = [];
        }
        if (segmentStart < this.index) {
          const segment = input.slice(segmentStart, this.index);
          rawParts.push(segment);
          cookedParts = cookedParts ?? [];
          cookedParts.push(segment);
        }
        const escapeResult = this.readEscapeSequence();
        rawParts.push(escapeResult.raw);
        cookedParts = cookedParts ?? [];
        cookedParts.push(escapeResult.cooked);
        segmentStart = this.index;
        continue;
      }
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

    const code = input.charCodeAt(this.index);

    const isAlpha =
      (code >= 97 && code <= 122) || (code >= 65 && code <= 90) || code === 95 || code === 36;
    if (isAlpha) {
      const ident = this.readIdentifier();
      const type: TokenType = isKeyword(ident) ? TOKEN.Keyword : TOKEN.Identifier;
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
        this.setToken(setCurrent, TOKEN.PrivateIdentifier, name, lineBreakBefore);
        this.recordToken(start);
        return;
      }
    }

    if (code >= 48 && code <= 57) {
      const numStr = this.readNumber();
      // Check for BigInt suffix 'n'
      if (input.charCodeAt(this.index) === 110) {
        this.index += 1;
        this.setToken(setCurrent, TOKEN.BigInt, numStr, lineBreakBefore);
      } else {
        this.setToken(setCurrent, TOKEN.Number, numStr, lineBreakBefore);
      }
      this.recordToken(start);
      return;
    }

    if (code === 39 || code === 34) {
      this.setToken(setCurrent, TOKEN.String, this.readString(code), lineBreakBefore);
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

    throw new ParseError(`Unexpected character: ${input[this.index] ?? ""}`);
  }

  private setToken(
    setCurrent: boolean,
    type: TokenType,
    value: string,
    lineBreakBefore: boolean,
    column?: number,
  ): void {
    if (setCurrent) {
      this.currentType = type;
      this.currentValue = value;
      this.currentLineBreakBefore = lineBreakBefore;
      if (column !== undefined) {
        this.currentColumn = column;
      }
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
    let index = this.index;

    while (index < length) {
      const code = input.charCodeAt(index);
      switch (code) {
        case 32: // space
        case 9: // \t
          index += 1;
          this.currentColumn++;
          continue;
        case 13: // \r
          index += 1;
          this.currentColumn++;
          if (index < length && input.charCodeAt(index) === 10) {
            index++;
            this.currentColumn++;
          }
          lineBreak = true;
          this.currentLine = 1;
          this.currentColumn = 1;
          continue;
        case 10: // \n
          lineBreak = true;
          this.currentLine++;
          index += 1;
          this.currentColumn = 1;
          continue;
        case 47: {
          const next = input.charCodeAt(index + 1);
          if (next === 47) {
            const end = input.indexOf("\n", index + 2);
            if (end === -1) {
              this.index = length;
              return lineBreak;
            }
            lineBreak = true;
            this.currentLine++;
            index = end + 1;
            this.currentColumn = 1;
            continue;
          }
          if (next === 42) {
            const end = input.indexOf("*/", index + 2);
            if (end === -1) {
              for (let i = index + 2; i < length; i++) {
                if (input.charCodeAt(i) === 10) {
                  lineBreak = true;
                  this.currentLine++;
                }
              }
              this.index = length;
              return lineBreak;
            }
            for (let i = index + 2; i < end; i++) {
              if (input.charCodeAt(i) === 10) {
                lineBreak = true;
                this.currentLine++;
              }
            }
            index = end + 2;
            this.currentColumn = index - input.lastIndexOf("\n", index - 1);
            continue;
          }
          break;
        }
        default:
          break;
      }
      break;
    }

    this.index = index;
    this.currentColumn = index - input.lastIndexOf("\n", index - 1);
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
        (code >= 97 && code <= 122) || (code >= 65 && code <= 90) || code === 95 || code === 36;
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
        // Hexadecimal: 0x or 0X
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          const isHex =
            (code >= 48 && code <= 57) ||
            (code >= 97 && code <= 102) ||
            (code >= 65 && code <= 70) ||
            code === 95; // underscore
          if (!isHex) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
      if (prefix === 98 || prefix === 66) {
        // Binary: 0b or 0B
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          if (code !== 48 && code !== 49 && code !== 95) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
      if (prefix === 111 || prefix === 79) {
        // Octal: 0o or 0O
        index += 2;
        while (index < length) {
          const code = input.charCodeAt(index);
          if ((code < 48 || code > 55) && code !== 95) {
            break;
          }
          index += 1;
        }
        this.index = index;
        return input.slice(start, index);
      }
    }

    // Decimal integer part
    while (index < length) {
      const code = input.charCodeAt(index);
      if ((code < 48 || code > 57) && code !== 95) {
        break;
      }
      index += 1;
    }
    // Decimal fraction part
    if (input.charCodeAt(index) === 46) {
      const nextCode = input.charCodeAt(index + 1);
      if (nextCode >= 48 && nextCode <= 57) {
        index += 1;
        while (index < length) {
          const code = input.charCodeAt(index);
          if ((code < 48 || code > 57) && code !== 95) {
            break;
          }
          index += 1;
        }
      }
    }
    this.index = index;
    return input.slice(start, index);
  }

  private readString(quoteCode: number): string {
    const input = this.input;
    const length = input.length;
    const start = this.index + 1;
    let index = start;

    while (index < length) {
      // Use char codes to avoid per-char string allocations in hot lexing loops.
      const code = input.charCodeAt(index);
      if (code === quoteCode) {
        const value = input.slice(start, index);
        this.index = index + 1;
        return value;
      }
      if (code === 92) {
        // Fall back to the slower path only when escapes are present.
        this.index = start - 1;
        return this.readStringWithEscapes(quoteCode);
      }
      if (code === 10) {
        throw new ParseError("Unterminated string literal");
      }
      index += 1;
    }
    throw new ParseError("Unterminated string literal");
  }

  private readStringWithEscapes(quoteCode: number): string {
    const input = this.input;
    const length = input.length;
    this.index += 1;
    // Collect chunks to avoid quadratic string concatenation for escaped strings.
    let parts: string[] | null = null;
    let segmentStart = this.index;
    while (this.index < length) {
      const code = input.charCodeAt(this.index);
      if (code === quoteCode) {
        this.index += 1;
        if (!parts) {
          return input.slice(segmentStart, this.index - 1);
        }
        if (segmentStart < this.index - 1) {
          parts.push(input.slice(segmentStart, this.index - 1));
        }
        return parts.join("");
      }
      if (code === 92) {
        if (!parts) {
          parts = [];
        }
        if (segmentStart < this.index) {
          parts.push(input.slice(segmentStart, this.index));
        }
        parts.push(this.readEscapeSequenceCooked());
        segmentStart = this.index;
        continue;
      }
      if (code === 10) {
        throw new ParseError("Unterminated string literal");
      }
      this.index += 1;
    }
    throw new ParseError("Unterminated string literal");
  }

  private readPunctuator(): string | null {
    const start = this.index;
    const input = this.input;
    const code = input.charCodeAt(start);

    // Fast path for simple single-character punctuators.
    const single = SINGLE_CHAR_PUNCTUATORS[code];
    if (single) {
      this.index += 1;
      return single;
    }

    switch (code) {
      case 46: // .
        if (input.charCodeAt(start + 1) === 46 && input.charCodeAt(start + 2) === 46) {
          this.index += 3;
          return "...";
        }
        this.index += 1;
        return ".";
      case 63: {
        // ?
        const next = input.charCodeAt(start + 1);
        if (next === 46) {
          this.index += 2;
          return "?.";
        }
        if (next === 63) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "??=";
          }
          this.index += 2;
          return "??";
        }
        this.index += 1;
        return "?";
      }
      case 124: {
        // |
        const next = input.charCodeAt(start + 1);
        if (next === 124) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "||=";
          }
          this.index += 2;
          return "||";
        }
        if (next === 61) {
          this.index += 2;
          return "|=";
        }
        this.index += 1;
        return "|";
      }
      case 38: {
        // &
        const next = input.charCodeAt(start + 1);
        if (next === 38) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "&&=";
          }
          this.index += 2;
          return "&&";
        }
        if (next === 61) {
          this.index += 2;
          return "&=";
        }
        this.index += 1;
        return "&";
      }
      case 61: {
        // =
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "===";
          }
          this.index += 2;
          return "==";
        }
        if (next === 62) {
          this.index += 2;
          return "=>";
        }
        this.index += 1;
        return "=";
      }
      case 33: {
        // !
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "!==";
          }
          this.index += 2;
          return "!=";
        }
        this.index += 1;
        return "!";
      }
      case 60: {
        // <
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          this.index += 2;
          return "<=";
        }
        if (next === 60) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "<<=";
          }
          this.index += 2;
          return "<<";
        }
        this.index += 1;
        return "<";
      }
      case 62: {
        // >
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          this.index += 2;
          return ">=";
        }
        if (next === 62) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return ">>=";
          }
          if (next2 === 62) {
            const next3 = input.charCodeAt(start + 3);
            if (next3 === 61) {
              this.index += 4;
              return ">>>=";
            }
            this.index += 3;
            return ">>>";
          }
          this.index += 2;
          return ">>";
        }
        this.index += 1;
        return ">";
      }
      case 42: {
        // *
        const next = input.charCodeAt(start + 1);
        if (next === 42) {
          const next2 = input.charCodeAt(start + 2);
          if (next2 === 61) {
            this.index += 3;
            return "**=";
          }
          this.index += 2;
          return "**";
        }
        if (next === 61) {
          this.index += 2;
          return "*=";
        }
        this.index += 1;
        return "*";
      }
      case 47: {
        // /
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          this.index += 2;
          return "/=";
        }
        this.index += 1;
        return "/";
      }
      case 37: {
        // %
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          this.index += 2;
          return "%=";
        }
        this.index += 1;
        return "%";
      }
      case 43: {
        // +
        const next = input.charCodeAt(start + 1);
        if (next === 43) {
          this.index += 2;
          return "++";
        }
        if (next === 61) {
          this.index += 2;
          return "+=";
        }
        this.index += 1;
        return "+";
      }
      case 45: {
        // -
        const next = input.charCodeAt(start + 1);
        if (next === 45) {
          this.index += 2;
          return "--";
        }
        if (next === 61) {
          this.index += 2;
          return "-=";
        }
        this.index += 1;
        return "-";
      }
      case 94: {
        // ^
        const next = input.charCodeAt(start + 1);
        if (next === 61) {
          this.index += 2;
          return "^=";
        }
        this.index += 1;
        return "^";
      }
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
    while ((this.currentType as TokenType) !== TOKEN.EOF) {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ";") {
        this.next();
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
    const line = this.tokenizer.currentLine;
    const type = this.currentType;
    const value = this.currentValue;

    if (type === TOKEN.Punctuator && value === "{") {
      return this.parseBlockStatement();
    }
    if (type === TOKEN.Identifier || type === TOKEN.Keyword) {
      if (value === "type" || value === "interface") {
        this.parseTypeOnlyStatement(value);
        return null;
      }
    }
    let result: ESTree.Statement | null = null;
    if (type === TOKEN.Keyword) {
      switch (value) {
        case "if":
          result = this.parseIfStatement();
          break;
        case "while":
          result = this.parseWhileStatement();
          break;
        case "do":
          result = this.parseDoWhileStatement();
          break;
        case "for":
          result = this.parseForStatement();
          break;
        case "switch":
          result = this.parseSwitchStatement();
          break;
        case "return":
          result = this.parseReturnStatement();
          break;
        case "break":
          result = this.parseBreakStatement();
          break;
        case "continue":
          result = this.parseContinueStatement();
          break;
        case "throw":
          result = this.parseThrowStatement();
          break;
        case "try":
          result = this.parseTryStatement();
          break;
        case "function":
          result = this.parseFunctionDeclaration();
          break;
        case "class":
          result = this.parseClassDeclaration();
          break;
        case "let":
        case "const":
        case "var":
          result = this.parseVariableDeclaration(false);
          break;
        case "async":
          if (
            this.tokenizer.peekType() === TOKEN.Keyword &&
            this.tokenizer.peekValue() === "function"
          ) {
            result = this.parseFunctionDeclaration();
          }
          break;
      }
    }
    if (result === null) {
      result = this.parseExpressionStatement();
    }
    (result as any).line = line;
    return result;
  }

  private parseStatementOrEmpty(): ESTree.Statement {
    return this.parseStatement() ?? { type: "EmptyStatement" };
  }

  private parseTypeOnlyStatement(kind: "type" | "interface"): void {
    if (kind === "type") {
      this.next();
      this.parseIdentifier();
      if (this.currentType === TOKEN.Punctuator && this.currentValue === "<") {
        this.skipType(STOP_TOKEN.Equals);
      }
      this.expectPunctuator("=");
      this.skipType(STOP_TOKEN.Semicolon);
      this.consumeSemicolon();
      return;
    }

    this.next();
    this.parseIdentifier();
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "<") {
      this.skipType(STOP_TOKEN.Interface);
    }
    if (
      (this.currentType === TOKEN.Identifier || this.currentType === TOKEN.Keyword) &&
      this.currentValue === "extends"
    ) {
      this.next();
      while (true) {
        this.skipType(STOP_TOKEN.Implements);
        if (!this.consumePunctuator(",")) {
          break;
        }
      }
    }
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "{") {
      this.skipTypeBlock();
      return;
    }
    throw new ParseError("Interface declaration missing body");
  }

  private parseBlockStatement(): ESTree.BlockStatement {
    this.expectPunctuator("{");
    const body: ESTree.Statement[] = [];
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "}") {
      if (this.currentType === TOKEN.EOF) {
        throw new ParseError("Unterminated block statement");
      }
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ";") {
        this.next();
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
    const alternate =
      this.currentType === TOKEN.Keyword && this.currentValue === "else"
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

  private parseForStatement(): ESTree.ForStatement | ESTree.ForOfStatement | ESTree.ForInStatement {
    this.expectKeyword("for");

    // Check for `for await (...)`
    const isAwait =
      (this.currentType === TOKEN.Keyword || this.currentType === TOKEN.Identifier) &&
      this.currentValue === "await";
    if (isAwait) {
      this.next();
    }

    this.expectPunctuator("(");

    if (this.currentType === TOKEN.Punctuator && this.currentValue === ";") {
      this.expectPunctuator(";");
      const test =
        this.currentType === TOKEN.Punctuator && this.currentValue === ";"
          ? null
          : this.parseExpression();
      this.expectPunctuator(";");
      const update =
        (this.currentType as TokenType) === TOKEN.Punctuator &&
        (this.currentValue as string) === ")"
          ? null
          : this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return { type: "ForStatement", init: null, test, update, body };
    }

    if (
      this.currentType === TOKEN.Keyword &&
      (this.currentValue === "let" || this.currentValue === "const" || this.currentValue === "var")
    ) {
      const declaration = this.parseVariableDeclaration(true);
      if (
        (this.currentType as TokenType) === TOKEN.Keyword &&
        (this.currentValue as string) === "of"
      ) {
        this.expectKeyword("of");
        const right = this.parseExpression();
        this.expectPunctuator(")");
        const body = this.parseStatementOrEmpty();
        return {
          type: "ForOfStatement",
          left: declaration,
          right,
          body,
          await: isAwait,
        };
      }
      if (
        (this.currentType as TokenType) === TOKEN.Keyword &&
        (this.currentValue as string) === "in"
      ) {
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
      const test =
        (this.currentType as TokenType) === TOKEN.Punctuator &&
        (this.currentValue as string) === ";"
          ? null
          : this.parseExpression();
      this.expectPunctuator(";");
      const update =
        (this.currentType as TokenType) === TOKEN.Punctuator &&
        (this.currentValue as string) === ")"
          ? null
          : this.parseExpression();
      this.expectPunctuator(")");
      const body = this.parseStatementOrEmpty();
      return { type: "ForStatement", init: declaration, test, update, body };
    }

    // Disallow "in" so `for (x in obj)` is parsed as ForInStatement.
    const initExpression = this.parseExpression(false);

    if (this.currentType === TOKEN.Keyword && this.currentValue === "of") {
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
        await: isAwait,
      };
    }

    if (this.currentType === TOKEN.Keyword && this.currentValue === "in") {
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
    const test =
      this.currentType === TOKEN.Punctuator && this.currentValue === ";"
        ? null
        : this.parseExpression();
    this.expectPunctuator(";");
    const update =
      this.currentType === TOKEN.Punctuator && this.currentValue === ")"
        ? null
        : this.parseExpression();
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
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "}") {
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Keyword && value === "case") {
        this.next();
        const test = this.parseExpression();
        this.expectPunctuator(":");
        const consequent = this.parseSwitchConsequent();
        cases.push({ type: "SwitchCase", test, consequent });
        continue;
      }
      if (type === TOKEN.Keyword && value === "default") {
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
    while (true) {
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator && value === "}") {
        break;
      }
      if (type === TOKEN.Keyword && (value === "case" || value === "default")) {
        break;
      }
      if (type === TOKEN.Punctuator && value === ";") {
        this.next();
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
    const type = this.currentType;
    const value = this.currentValue;
    if (
      (type === TOKEN.Punctuator && value === ";") ||
      type === TOKEN.EOF ||
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
    let label: ESTree.Identifier | null = null;
    if (this.currentType === TOKEN.Identifier && !this.currentLineBreakBefore) {
      label = { type: "Identifier", name: this.currentValue };
      this.next();
    }
    this.consumeSemicolon();
    return { type: "BreakStatement", label };
  }

  private parseContinueStatement(): ESTree.ContinueStatement {
    this.expectKeyword("continue");
    let label: ESTree.Identifier | null = null;
    if (this.currentType === TOKEN.Identifier && !this.currentLineBreakBefore) {
      label = { type: "Identifier", name: this.currentValue };
      this.next();
    }
    this.consumeSemicolon();
    return { type: "ContinueStatement", label };
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
    const handler =
      this.currentType === TOKEN.Keyword && this.currentValue === "catch"
        ? this.parseCatchClause()
        : null;
    const finalizer =
      this.currentType === TOKEN.Keyword && this.currentValue === "finally"
        ? (this.next(), this.parseBlockStatement())
        : null;

    if (!handler && !finalizer) {
      throw new ParseError("Try statement must have catch or finally");
    }

    return { type: "TryStatement", block, handler, finalizer };
  }

  private parseCatchClause(): ESTree.CatchClause {
    this.expectKeyword("catch");
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "{") {
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
    const { id, params, body, asyncFlag, generator } = this.parseFunctionSignature(true);
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
    const { id, params, body, asyncFlag, generator } = this.parseFunctionSignature(false);
    return {
      type: "FunctionExpression",
      id,
      params,
      body,
      async: asyncFlag,
      generator,
    };
  }

  private parseFunctionSignature(requireId: true): {
    id: ESTree.Identifier;
    params: ESTree.Pattern[];
    body: ESTree.BlockStatement;
    asyncFlag: boolean;
    generator: boolean;
  };
  private parseFunctionSignature(requireId: false): {
    id: ESTree.Identifier | null;
    params: ESTree.Pattern[];
    body: ESTree.BlockStatement;
    asyncFlag: boolean;
    generator: boolean;
  };
  private parseFunctionSignature(requireId: boolean): {
    id: ESTree.Identifier | null;
    params: ESTree.Pattern[];
    body: ESTree.BlockStatement;
    asyncFlag: boolean;
    generator: boolean;
  } {
    const asyncFlag = this.currentType === TOKEN.Keyword && this.currentValue === "async";
    if (asyncFlag) {
      this.next();
    }
    this.expectKeyword("function");
    const generator =
      this.currentType === TOKEN.Punctuator && this.currentValue === "*"
        ? (this.next(), true)
        : false;
    const id = requireId
      ? this.parseIdentifier()
      : this.currentType === TOKEN.Identifier
        ? this.parseIdentifier()
        : null;
    const { params, body } = this.parseFunctionParamsAndBody(asyncFlag, generator);
    return { id, params, body, asyncFlag, generator };
  }

  private parseFunctionParamsAndBody(
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
    this.consumeTypeAnnotation(STOP_TOKEN.ReturnBlock);
    const body = this.parseBlockStatement();

    this.inFunction = prevFunction;
    this.inGenerator = prevGenerator;
    this.inAsync = prevAsync;

    return { params, body };
  }

  private parseFunctionParams(): ESTree.Pattern[] {
    const params: ESTree.Pattern[] = [];
    if (this.currentType === TOKEN.Punctuator && this.currentValue === ")") {
      return params;
    }
    while (true) {
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator && value === "...") {
        this.next();
        const argument = this.parseBindingPattern();
        this.consumeTypeAnnotation(STOP_TOKEN.Rest);
        params.push({ type: "RestElement", argument });
      } else {
        this.consumeTypeScriptModifiers();
        const param = this.parseBindingPattern();
        if (this.currentType === TOKEN.Punctuator && this.currentValue === "?") {
          this.next();
          // Optional parameter marker (TypeScript).
        }
        if (this.currentType === TOKEN.Punctuator && this.currentValue === ":") {
          this.next();
          this.skipType(STOP_TOKEN.Param);
        }
        if (this.currentType === TOKEN.Punctuator && this.currentValue === "=") {
          this.next();
          const right = this.parseAssignmentExpression();
          params.push({ type: "AssignmentPattern", left: param, right });
        } else {
          params.push(param);
        }
      }
      if (this.currentType !== TOKEN.Punctuator || this.currentValue !== ",") {
        break;
      }
      this.next();
    }
    return params;
  }

  private parseClassDeclaration(): ESTree.ClassDeclaration {
    const { id, superClass, body } = this.parseClassSignature();
    return { type: "ClassDeclaration", id, superClass, body };
  }

  private parseClassExpression(): ESTree.ClassExpression {
    const { id, superClass, body } = this.parseClassSignature();
    return { type: "ClassExpression", id, superClass, body };
  }

  private parseClassSignature(): {
    id: ESTree.Identifier | null;
    superClass: ESTree.Expression | null;
    body: ESTree.ClassBody;
  } {
    this.expectKeyword("class");
    const id = this.currentType === TOKEN.Identifier ? this.parseIdentifier() : null;
    const superClass =
      this.currentType === TOKEN.Keyword && this.currentValue === "extends"
        ? (this.next(), this.parseExpression())
        : null;
    if (
      (this.currentType === TOKEN.Identifier || this.currentType === TOKEN.Keyword) &&
      this.currentValue === "implements"
    ) {
      this.next();
      while (true) {
        this.skipType(STOP_TOKEN.Implements);
        if (!this.consumePunctuator(",")) {
          break;
        }
      }
    }
    const body = this.parseClassBody();
    return { id, superClass, body };
  }

  private parseClassBody(): ESTree.ClassBody {
    this.expectPunctuator("{");
    const elements: (ESTree.MethodDefinition | ESTree.PropertyDefinition | ESTree.StaticBlock)[] =
      [];
    while (this.currentType !== TOKEN.Punctuator || this.currentValue !== "}") {
      if (this.currentType === TOKEN.Punctuator && this.currentValue === ";") {
        this.next();
        continue;
      }
      if (this.currentType === TOKEN.Keyword && this.currentValue === "static") {
        const peekType = this.tokenizer.peekType();
        const peekValue = this.tokenizer.peekValue();
        if (peekType === TOKEN.Punctuator && peekValue === "{") {
          this.next();
          const block = this.parseBlockStatement();
          elements.push({ type: "StaticBlock", body: block.body });
          continue;
        }
      }
      const element = this.parseClassElement();
      elements.push(element);
    }
    this.expectPunctuator("}");
    return { type: "ClassBody", body: elements };
  }

  private parseClassElement(): ESTree.MethodDefinition | ESTree.PropertyDefinition {
    let isStatic = false;
    let asyncFlag = false;
    let generator = false;
    let kind: "method" | "get" | "set" | "constructor" = "method";

    while (true) {
      if (
        (this.currentType === TOKEN.Identifier || this.currentType === TOKEN.Keyword) &&
        this.currentValue === "static"
      ) {
        const peekType = this.tokenizer.peekType();
        const peekValue = this.tokenizer.peekValue();
        if (peekType === TOKEN.Punctuator && peekValue === "{") {
          break;
        }
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

    if (this.currentType === TOKEN.Keyword && this.currentValue === "get") {
      this.next();
      kind = "get";
    } else if (this.currentType === TOKEN.Keyword && this.currentValue === "set") {
      this.next();
      kind = "set";
    } else if (this.currentType === TOKEN.Keyword && this.currentValue === "async") {
      this.next();
      asyncFlag = true;
    }

    if (this.currentType === TOKEN.Punctuator && this.currentValue === "*") {
      this.next();
      generator = true;
    }

    const keyResult = this.parsePropertyKey();
    const { key, computed } = keyResult;

    if (kind === "method" && !generator && !asyncFlag && !isStatic) {
      if (key.type === "Identifier" && key.name === "constructor") {
        kind = "constructor";
      }
    }

    if (this.currentType === TOKEN.Punctuator && this.currentValue === "?") {
      this.next();
      // Optional class element marker (TypeScript).
    }
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "!") {
      this.next();
      // Definite assignment assertion (TypeScript).
    }

    if (this.currentType === TOKEN.Punctuator && this.currentValue === "(") {
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

    this.consumeTypeAnnotation(STOP_TOKEN.ClassField);
    const value =
      this.currentType === TOKEN.Punctuator && this.currentValue === "="
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

  private parseMethodFunction(asyncFlag: boolean, generator: boolean): ESTree.FunctionExpression {
    const { params, body } = this.parseFunctionParamsAndBody(asyncFlag, generator);
    return {
      type: "FunctionExpression",
      id: null,
      params,
      body,
      async: asyncFlag,
      generator,
    };
  }

  private parseVariableDeclaration(isForInit: boolean): ESTree.VariableDeclaration {
    const kind = this.currentValue as "let" | "const" | "var";
    this.next();
    const declarations: ESTree.VariableDeclarator[] = [];

    while (true) {
      const id = this.parseBindingPattern();
      this.consumeTypeAnnotation(STOP_TOKEN.Var);
      const init =
        this.currentType === TOKEN.Punctuator && this.currentValue === "="
          ? (this.next(), this.parseAssignmentExpression())
          : null;
      declarations.push({ type: "VariableDeclarator", id, init });
      if (this.currentType !== TOKEN.Punctuator || this.currentValue !== ",") {
        break;
      }
      this.next();
    }

    if (!isForInit) {
      this.consumeSemicolon();
    }

    return { type: "VariableDeclaration", declarations, kind };
  }

  private parseExpressionStatement(): ESTree.ExpressionStatement | ESTree.LabeledStatement {
    // Check for labeled statement: identifier followed by ':'
    if (this.currentType === TOKEN.Identifier && this.tokenizer.peekValue() === ":") {
      const label: ESTree.Identifier = {
        type: "Identifier",
        name: this.currentValue,
      };
      this.next(); // consume identifier
      this.next(); // consume ':'
      const body = this.parseStatementOrEmpty();
      return { type: "LabeledStatement", label, body };
    }

    const expression = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ExpressionStatement", expression };
  }

  private consumeTypeAnnotation(stopTokens: StopToken): void {
    if (this.currentType !== TOKEN.Punctuator || this.currentValue !== ":") {
      return;
    }
    this.next();
    this.skipType(stopTokens);
  }

  private consumeTypeAssertions(expression: ESTree.Expression): ESTree.Expression {
    if (this.currentType !== TOKEN.Identifier || this.currentValue !== "as") {
      return expression;
    }
    while (this.currentType === TOKEN.Identifier && this.currentValue === "as") {
      this.next();
      this.skipType(STOP_TOKEN.Assertion);
      if (this.currentType !== TOKEN.Identifier) {
        break;
      }
    }
    return expression;
  }

  private consumeTypeScriptModifiers(): void {
    while (this.isTypeScriptModifier()) {
      this.next();
    }
  }

  private isTypeScriptModifier(): boolean {
    if (this.currentType !== TOKEN.Identifier) {
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

  private skipType(stopTokens: StopToken): void {
    // Inline stop checks to avoid per-iteration method calls in type skipping.
    const stopToken = stopTokens;
    const isStop = (value: string): boolean => {
      switch (stopToken) {
        case STOP_TOKEN.Equals:
          return value === "=";
        case STOP_TOKEN.Semicolon:
          return value === ";";
        case STOP_TOKEN.Interface:
          return value === "{" || value === "extends";
        case STOP_TOKEN.Implements:
          return value === "," || value === "{";
        case STOP_TOKEN.ReturnBlock:
          return value === "{";
        case STOP_TOKEN.Param:
          return value === "=" || value === "," || value === ")";
        case STOP_TOKEN.Rest:
          return value === "," || value === ")";
        case STOP_TOKEN.Var:
          return value === "=" || value === "," || value === ";" || value === ")";
        case STOP_TOKEN.ClassField:
          return value === "=" || value === ";" || value === "}";
        case STOP_TOKEN.Assertion:
          return value === "," || value === ";" || value === ")" || value === "]" || value === "}";
        case STOP_TOKEN.Arrow:
          return value === "=>";
        default:
          return false;
      }
    };

    // Fast exit when already at a stop token.
    if (
      (this.currentType === TOKEN.Punctuator || this.currentType === TOKEN.Keyword) &&
      isStop(this.currentValue)
    ) {
      return;
    }
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;

    while ((this.currentType as TokenType) !== TOKEN.EOF) {
      if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
        if (
          (this.currentType === TOKEN.Punctuator || this.currentType === TOKEN.Keyword) &&
          isStop(this.currentValue)
        ) {
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
    if (this.currentType !== TOKEN.Punctuator || this.currentValue !== "{") {
      throw new ParseError("Expected '{' for interface body");
    }
    let depth = 0;
    while ((this.currentType as TokenType) !== TOKEN.EOF) {
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
    const expr = this.parseAssignmentExpression(allowIn);

    // Handle comma operator (sequence expression)
    if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
      const expressions: ESTree.Expression[] = [expr];
      while (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
        this.next();
        expressions.push(this.parseAssignmentExpression(allowIn));
      }
      return { type: "SequenceExpression", expressions };
    }

    return expr;
  }

  // Try arrow parsing first since it shares a prefix with grouping/expressions.
  private parseAssignmentExpression(allowIn = true): ESTree.Expression {
    const arrow = this.tryParseArrowFunction();
    if (arrow) {
      return arrow;
    }

    let leftExpression = this.parseConditionalExpression(allowIn);
    leftExpression = this.consumeTypeAssertions(leftExpression);
    if (this.currentType === TOKEN.Punctuator) {
      const operator = this.currentValue;
      switch (operator) {
        case "=":
        case "||=":
        case "&&=":
        case "??=":
        case "+=":
        case "-=":
        case "*=":
        case "/=":
        case "%=":
        case "**=":
        case "<<=":
        case ">>=":
        case ">>>=":
        case "&=":
        case "|=":
        case "^=":
          this.next();
          const right = this.parseAssignmentExpression(allowIn);
          const left = this.normalizeAssignmentTarget(leftExpression);
          return { type: "AssignmentExpression", operator, left, right };
        default:
          break;
      }
    }
    return leftExpression;
  }

  private parseConditionalExpression(allowIn = true): ESTree.Expression {
    const test = this.parseLogicalExpression(allowIn);
    if (this.currentType !== TOKEN.Punctuator || this.currentValue !== "?") {
      return test;
    }
    this.next();
    const consequent = this.parseAssignmentExpression(allowIn);
    this.expectPunctuator(":");
    const alternate = this.parseAssignmentExpression(allowIn);
    return { type: "ConditionalExpression", test, consequent, alternate };
  }

  private parseLogicalExpression(allowIn = true): ESTree.Expression {
    return this.parseLogicalPrecedence(0, allowIn);
  }

  // Precedence-climbing for logical operators (&& > ||/??).
  private parseLogicalPrecedence(minPrecedence: number, allowIn: boolean): ESTree.Expression {
    let left = this.parseBinaryExpression(allowIn);
    while (true) {
      if (this.currentType !== TOKEN.Punctuator) {
        break;
      }
      const operator = this.currentValue;
      let precedence = -1;
      switch (operator) {
        case "&&":
          precedence = 2;
          break;
        case "||":
        case "??":
          precedence = 1;
          break;
        default:
          break;
      }
      if (precedence < minPrecedence) {
        break;
      }
      // Precedence climbing: parse tighter RHS before combining.
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
  private parseBinaryPrecedence(minPrecedence: number, allowIn: boolean): ESTree.Expression {
    let left = this.parseExponentExpression();
    while (true) {
      const type = this.currentType;
      if (type === TOKEN.Keyword) {
        if (this.currentValue === "in") {
          if (!allowIn) {
            break;
          }
        } else if (this.currentValue !== "instanceof") {
          break;
        }
      } else if (type !== TOKEN.Punctuator) {
        break;
      }
      const operator = this.currentValue;
      let precedence = -1;
      switch (operator) {
        case "*":
        case "/":
        case "%":
          precedence = 11;
          break;
        case "+":
        case "-":
          precedence = 10;
          break;
        case "<<":
        case ">>":
        case ">>>":
          precedence = 9;
          break;
        case "<":
        case "<=":
        case ">":
        case ">=":
        case "in":
        case "instanceof":
          precedence = 8;
          break;
        case "==":
        case "!=":
        case "===":
        case "!==":
          precedence = 7;
          break;
        case "&":
          precedence = 6;
          break;
        case "^":
          precedence = 5;
          break;
        case "|":
          precedence = 4;
          break;
        default:
          break;
      }
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
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "**") {
      const operator = "**";
      this.next();
      const right = this.parseExponentExpression();
      return { type: "BinaryExpression", operator, left, right };
    }
    return left;
  }

  private parseUnaryExpression(): ESTree.Expression {
    const type = this.currentType;
    const value = this.currentValue;

    if (type === TOKEN.Punctuator) {
      if (value === "++" || value === "--") {
        this.next();
        const argument = this.parseUnaryExpression();
        return {
          type: "UpdateExpression",
          operator: value,
          argument,
          prefix: true,
        };
      }
      if (value === "+" || value === "-" || value === "!" || value === "~") {
        this.next();
        const argument = this.parseUnaryExpression();
        return {
          type: "UnaryExpression",
          operator: value,
          argument,
          prefix: true,
        };
      }
    } else if (type === TOKEN.Keyword) {
      if (value === "await" && (this.inAsync || (!this.inFunction && this.allowTopLevelAwait))) {
        this.next();
        const argument = this.parseUnaryExpression();
        return { type: "AwaitExpression", argument };
      }
      if (value === "yield" && this.inGenerator) {
        this.next();
        const delegate = this.consumePunctuator("*");
        // Yield arguments are disallowed after line breaks or before terminators.
        const shouldParseArgument =
          !this.currentLineBreakBefore &&
          !(
            this.currentType === TOKEN.Punctuator &&
            (this.currentValue === ";" || this.currentValue === ")" || this.currentValue === "}")
          );
        const argument = shouldParseArgument ? this.parseAssignmentExpression() : null;
        return { type: "YieldExpression", argument, delegate };
      }
      if (value === "typeof" || value === "delete" || value === "void") {
        this.next();
        const argument = this.parseUnaryExpression();
        return {
          type: "UnaryExpression",
          operator: value,
          argument,
          prefix: true,
        };
      }
    }

    const expression = this.parseLeftHandSideExpression();
    if (
      this.currentType === TOKEN.Punctuator &&
      (this.currentValue === "++" || this.currentValue === "--")
    ) {
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
      const value = this.currentValue;
      switch (value) {
        case "?.": {
          const peekType = this.tokenizer.peekType();
          const peekValue = this.tokenizer.peekValue();
          if (peekType === TOKEN.Punctuator && peekValue === "(") {
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
          if (peekType === TOKEN.Punctuator && peekValue === "[") {
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
          if (peekType === TOKEN.Identifier || peekType === TOKEN.PrivateIdentifier) {
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
        case "`": {
          const quasi = this.parseTemplateLiteral();
          expression = {
            type: "TaggedTemplateExpression",
            tag: expression,
            quasi,
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
    if (this.currentType === TOKEN.Keyword && this.currentValue === "new") {
      this.next();
      const callee = this.parseNewExpression();
      const args =
        (this.currentType as TokenType) === TOKEN.Punctuator &&
        (this.currentValue as string) === "("
          ? this.parseArguments()
          : [];
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
      case TOKEN.BigInt: {
        const raw = this.currentValue;
        this.next();
        return {
          type: "Literal",
          value: this.parseBigIntLiteral(raw),
          raw: raw + "n",
          bigint: raw,
        };
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
            if (this.tokenizer.peekType() === TOKEN.Keyword) {
              const peekValue = this.tokenizer.peekValue();
              if (peekValue === "function") {
                return this.parseFunctionExpression();
              }
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
          case "/":
          case "/=": {
            const { pattern, flags } = this.tokenizer.rescanAsRegExp(this.currentValue);
            let value: RegExp | null;
            try {
              value = new RegExp(pattern, flags);
            } catch {
              throw new ParseError(`Invalid regular expression: /${pattern}/${flags}`);
            }
            const raw = `/${pattern}/${flags}`;
            // Advance to the next token after the regex.
            this.next();
            return {
              type: "Literal",
              value,
              raw,
              regex: { pattern, flags },
            };
          }
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
    if (this.currentType !== TOKEN.Punctuator || this.currentValue !== "`") {
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
      if (
        (this.currentType as TokenType) !== TOKEN.Punctuator ||
        (this.currentValue as string) !== "}"
      ) {
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
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator) {
        if (value === ",") {
          this.next();
          elements.push(null);
          continue;
        }
        if (value === "...") {
          this.next();
          const argument = this.parseAssignmentExpression();
          elements.push({ type: "SpreadElement", argument });
        } else {
          elements.push(this.parseAssignmentExpression());
        }
      } else {
        elements.push(this.parseAssignmentExpression());
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
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator && value === ",") {
        this.next();
        continue;
      }
      if (type === TOKEN.Punctuator && value === "...") {
        this.next();
        const argument = this.parseAssignmentExpression();
        properties.push({ type: "SpreadElement", argument });
        if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
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

    // Check for getter/setter: get name() { } or set name(v) { }
    if (
      (this.currentType === TOKEN.Identifier || this.currentType === TOKEN.Keyword) &&
      (this.currentValue === "get" || this.currentValue === "set")
    ) {
      const kind = this.currentValue as "get" | "set";
      // Peek: if next token is an identifier, string, number, or '[', it's an accessor
      const nextType = this.tokenizer.peekType();
      const nextValue = this.tokenizer.peekValue();
      const isAccessor =
        nextType === TOKEN.Identifier ||
        nextType === TOKEN.String ||
        nextType === TOKEN.Number ||
        nextType === TOKEN.Keyword ||
        (nextType === TOKEN.Punctuator && nextValue === "[");
      if (isAccessor) {
        this.next(); // consume 'get'/'set'
        const keyResult = this.parsePropertyKey();
        const accessorKey = keyResult.key;
        const accessorComputed = keyResult.computed;
        if (accessorKey.type === "PrivateIdentifier") {
          throw new ParseError("Private identifiers are not valid in object literals");
        }
        const value = this.parseMethodFunction(false, false);
        return {
          type: "Property",
          key: accessorKey as ESTree.Expression,
          value,
          kind,
          method: false,
          shorthand: false,
          computed: accessorComputed,
        };
      }
    }

    const keyResult = this.parsePropertyKey();
    const key = keyResult.key;
    const computed = keyResult.computed;
    if (key.type === "PrivateIdentifier") {
      throw new ParseError("Private identifiers are not valid in object literals");
    }

    if (this.currentType === TOKEN.Punctuator && this.currentValue === "(") {
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

    if (this.currentType === TOKEN.Punctuator && this.currentValue === ":") {
      this.next();
      const value = this.parseAssignmentExpression();
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
      if (this.currentType === TOKEN.Punctuator && this.currentValue === "=") {
        this.next();
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
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator && value === "...") {
        this.next();
        const argument = this.parseAssignmentExpression();
        args.push({ type: "SpreadElement", argument });
      } else {
        args.push(this.parseAssignmentExpression());
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
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator) {
        if (value === ",") {
          this.next();
          elements.push(null);
          continue;
        }
        if (value === "...") {
          this.next();
          const argument = this.parseBindingPattern();
          elements.push({ type: "RestElement", argument });
          // Rest elements cannot have default initializers.
        } else {
          const element = this.parseBindingPattern();
          elements.push(this.parseAssignmentPatternForBinding(element));
        }
      } else {
        const element = this.parseBindingPattern();
        elements.push(this.parseAssignmentPatternForBinding(element));
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
      const type = this.currentType;
      const value = this.currentValue;
      if (type === TOKEN.Punctuator && value === ",") {
        this.next();
        continue;
      }
      if (type === TOKEN.Punctuator && value === "...") {
        this.next();
        const argument = this.parseBindingPattern();
        properties.push({ type: "RestElement", argument });
        if (this.currentType === TOKEN.Punctuator && this.currentValue === ",") {
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
      throw new ParseError("Private identifiers are not valid in object patterns");
    }

    if (this.currentType === TOKEN.Punctuator && this.currentValue === ":") {
      this.next();
      const value = this.parseBindingPattern();
      const normalized = this.parseAssignmentPatternForBinding(value);
      return {
        type: "Property",
        key,
        value: normalized,
        kind: "init",
        method: false,
        shorthand: false,
        computed,
      };
    }

    if (key.type !== "Identifier") {
      throw new ParseError("Object pattern shorthand requires identifier key");
    }

    const normalized = this.parseAssignmentPatternForBinding(key);
    if (normalized.type !== "Identifier") {
      return {
        type: "Property",
        key,
        value: normalized,
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

  // Parses optional default values for binding patterns (e.g. `{ a = 1 }`).
  private parseAssignmentPatternForBinding(left: ESTree.Pattern): ESTree.Pattern {
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "=") {
      this.next();
      const right = this.parseAssignmentExpression();
      return { type: "AssignmentPattern", left, right };
    }
    return left;
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
        const value = this.currentValue;
        if (value === "await") {
          if (this.inAsync || this.allowTopLevelAwait) {
            break;
          }
        } else if (value === "yield" && this.inGenerator) {
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
    // Strip numeric separators (underscores) before parsing
    const stripped = raw.includes("_") ? raw.replace(/_/g, "") : raw;
    if (stripped.length > 1 && stripped.charCodeAt(0) === 48) {
      const prefix = stripped.charCodeAt(1);
      if (prefix === 120 || prefix === 88) {
        return Number.parseInt(stripped.slice(2), 16);
      }
      if (prefix === 98 || prefix === 66) {
        return Number.parseInt(stripped.slice(2), 2);
      }
      if (prefix === 111 || prefix === 79) {
        return Number.parseInt(stripped.slice(2), 8);
      }
    }
    return Number.parseFloat(stripped);
  }

  private parseBigIntLiteral(raw: string): bigint {
    // Strip numeric separators (underscores) before parsing
    const stripped = raw.includes("_") ? raw.replace(/_/g, "") : raw;
    if (stripped.length > 1 && stripped.charCodeAt(0) === 48) {
      const prefix = stripped.charCodeAt(1);
      if (prefix === 120 || prefix === 88) {
        // Hexadecimal
        return BigInt("0x" + stripped.slice(2));
      }
      if (prefix === 98 || prefix === 66) {
        // Binary
        return BigInt("0b" + stripped.slice(2));
      }
      if (prefix === 111 || prefix === 79) {
        // Octal
        return BigInt("0o" + stripped.slice(2));
      }
    }
    return BigInt(stripped);
  }

  private tryParseArrowFunction(): ESTree.ArrowFunctionExpression | null {
    if (
      this.currentType === TOKEN.Keyword &&
      this.currentValue === "async" &&
      !this.tokenizer.peekLineBreakBefore()
    ) {
      const snapshot = this.snapshot();
      this.next();
      const params = this.tryParseArrowParams();
      if (params) {
        const body = this.parseArrowFunctionBody();
        return { type: "ArrowFunctionExpression", params, body, async: true };
      }
      this.restore(snapshot);
    }

    if (
      this.currentType !== TOKEN.Identifier &&
      (this.currentType !== TOKEN.Punctuator || this.currentValue !== "(")
    ) {
      return null;
    }

    if (this.currentType === TOKEN.Identifier && this.currentValue !== "async") {
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
    if (this.currentType === TOKEN.Punctuator && this.currentValue === "{") {
      return this.parseBlockStatement();
    }
    return this.parseAssignmentExpression();
  }

  private tryParseArrowParams(): ESTree.Pattern[] | null {
    const snapshot = this.snapshot();
    try {
      if (this.currentType === TOKEN.Identifier) {
        const param = this.parseIdentifier();
        if (this.consumePunctuator(":")) {
          this.skipType(STOP_TOKEN.Arrow);
        }
        if (this.consumePunctuator("=>")) {
          return [param];
        }
        this.restore(snapshot);
        return null;
      }
      if (this.currentType === TOKEN.Punctuator && this.currentValue === "(") {
        this.next();
        const params =
          (this.currentType as TokenType) === TOKEN.Punctuator &&
          (this.currentValue as string) === ")"
            ? []
            : this.parseFunctionParams();
        this.expectPunctuator(")");
        this.consumeTypeAnnotation(STOP_TOKEN.Arrow);
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

  private convertArrayExpressionToPattern(expression: ESTree.ArrayExpression): ESTree.ArrayPattern {
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
        const value = this.normalizePatternElement(property.value as ESTree.Expression);
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

  private normalizePatternElement(element: ESTree.Expression | ESTree.Pattern): ESTree.Pattern {
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

  private isAssignablePattern(node: ESTree.Expression | ESTree.Pattern): boolean {
    return (
      node.type === "Identifier" ||
      node.type === "ArrayPattern" ||
      node.type === "ObjectPattern" ||
      node.type === "AssignmentPattern" ||
      node.type === "RestElement"
    );
  }

  private next(): void {
    this.tokenizer.next();
    this.syncCurrent();
  }

  private expectKeyword(value: string): void {
    if (this.currentType !== TOKEN.Keyword || this.currentValue !== value) {
      throw new ParseError(`Expected keyword '${value}'`);
    }
    this.next();
  }

  private expectPunctuator(value: string): void {
    if (this.currentType !== TOKEN.Punctuator || this.currentValue !== value) {
      throw new ParseError(`Expected '${value}'`);
    }
    this.next();
  }

  private consumePunctuator(value: string): boolean {
    if (this.currentType === TOKEN.Punctuator && this.currentValue === value) {
      this.next();
      return true;
    }
    return false;
  }

  private consumeSemicolon(): void {
    const type = this.currentType;
    const value = this.currentValue;

    if (type === TOKEN.Punctuator && value === ";") {
      this.next();
      return;
    }
    if (type === TOKEN.Punctuator && value === "}") {
      return;
    }
    if (type === TOKEN.EOF || this.currentLineBreakBefore) {
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

export function parseModule(input: string, _options: ParseOptions = {}): ESTree.Program {
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
