import { describe, it, expect } from "bun:test";

import type { ESTree } from "../src/ast";

import { parseModule, parseModuleWithProfile } from "../src/ast";

const parseFirstStatement = (code: string): ESTree.Statement => {
  const ast = parseModule(code);
  const first = ast.body[0];
  if (!first) {
    throw new Error("Expected at least one statement");
  }
  return first;
};

const parseFirstExpression = (code: string): ESTree.Expression => {
  const stmt = parseFirstStatement(code);
  if (stmt.type !== "ExpressionStatement") {
    throw new Error("Expected expression statement");
  }
  return stmt.expression;
};

describe("AST Parser", () => {
  describe("Program + basic statements", () => {
    it("parses empty program", () => {
      const ast = parseModule("");
      expect(ast.type).toBe("Program");
      expect(ast.body.length).toBe(0);
    });

    it("parses block statements", () => {
      const stmt = parseFirstStatement("{ let x = 1; x; }");
      expect(stmt.type).toBe("BlockStatement");
      expect((stmt as ESTree.BlockStatement).body.length).toBe(2);
    });

    it("parses if/else", () => {
      const stmt = parseFirstStatement("if (a) { b; } else { c; }");
      expect(stmt.type).toBe("IfStatement");
      const node = stmt as ESTree.IfStatement;
      expect(node.test.type).toBe("Identifier");
      expect(node.alternate?.type).toBe("BlockStatement");
    });

    it("parses while/do-while", () => {
      const whileStmt = parseFirstStatement("while (x) { x; }");
      expect(whileStmt.type).toBe("WhileStatement");
      const doWhile = parseFirstStatement("do { x; } while (x);");
      expect(doWhile.type).toBe("DoWhileStatement");
    });

    it("parses for/for-in/for-of", () => {
      const forStmt = parseFirstStatement("for (let i = 0; i < 2; i++) {}");
      expect(forStmt.type).toBe("ForStatement");
      const forIn = parseFirstStatement("for (let k in obj) {}");
      expect(forIn.type).toBe("ForInStatement");
      const forInExisting = parseFirstStatement("for (k in obj) {}");
      expect(forInExisting.type).toBe("ForInStatement");
      expect((forInExisting as ESTree.ForInStatement).left.type).toBe("Identifier");
      const forOf = parseFirstStatement("for (let v of arr) {}");
      expect(forOf.type).toBe("ForOfStatement");
    });

    it("parses variable declarations and binary expressions", () => {
      const ast = parseModule("let x = 1; x + 2;");
      expect(ast.type).toBe("Program");
      expect(ast.body.length).toBe(2);

      const decl = ast.body[0] as ESTree.VariableDeclaration;
      expect(decl.type).toBe("VariableDeclaration");
      expect(decl.declarations[0]?.id.type).toBe("Identifier");

      const expr = ast.body[1] as ESTree.ExpressionStatement;
      expect(expr.expression.type).toBe("BinaryExpression");
    });

    it("parses switch/case/default", () => {
      const stmt = parseFirstStatement("switch (x) { case 1: x; break; default: x; }");
      expect(stmt.type).toBe("SwitchStatement");
      const sw = stmt as ESTree.SwitchStatement;
      expect(sw.cases.length).toBe(2);
      expect(sw.cases[0]?.test?.type).toBe("Literal");
      expect(sw.cases[1]?.test).toBeNull();
    });
  });

  describe("Control flow", () => {
    it("parses return with and without value", () => {
      const withValue = parseFirstStatement("function f(){ return 1; }");
      expect(withValue.type).toBe("FunctionDeclaration");
      const fn = withValue as ESTree.FunctionDeclaration;
      const ret = fn.body.body[0] as ESTree.ReturnStatement;
      expect(ret.argument?.type).toBe("Literal");

      const withoutValue = parseFirstStatement("function f(){ return; }");
      const fn2 = withoutValue as ESTree.FunctionDeclaration;
      const ret2 = fn2.body.body[0] as ESTree.ReturnStatement;
      expect(ret2.argument).toBeNull();
    });

    it("parses break/continue", () => {
      const brk = parseFirstStatement("while(true){ break; }");
      expect(brk.type).toBe("WhileStatement");
      const cont = parseFirstStatement("while(true){ continue; }");
      expect(cont.type).toBe("WhileStatement");
    });

    it("parses throw/try/catch/finally", () => {
      const thr = parseFirstStatement("throw new Error('x');");
      expect(thr.type).toBe("ThrowStatement");
      const tri = parseFirstStatement("try { x; } catch (e) { y; } finally { z; }");
      expect(tri.type).toBe("TryStatement");
      const triNode = tri as ESTree.TryStatement;
      expect(triNode.handler?.param?.type).toBe("Identifier");
      expect(triNode.finalizer?.type).toBe("BlockStatement");
    });
  });

  describe("Expressions", () => {
    it("parses literals and identifiers", () => {
      const num = parseFirstExpression("42;");
      expect(num.type).toBe("Literal");
      const hex = parseFirstExpression("0x10;");
      expect((hex as ESTree.Literal).value).toBe(16);
      const bin = parseFirstExpression("0b10;");
      expect((bin as ESTree.Literal).value).toBe(2);
      const oct = parseFirstExpression("0o10;");
      expect((oct as ESTree.Literal).value).toBe(8);
      const str = parseFirstExpression('"hi";');
      expect((str as ESTree.Literal).value).toBe("hi");
      const bool = parseFirstExpression("true;");
      expect((bool as ESTree.Literal).value).toBe(true);
      const nul = parseFirstExpression("null;");
      expect((nul as ESTree.Literal).value).toBeNull();
      const id = parseFirstExpression("value;");
      expect(id.type).toBe("Identifier");
    });

    it("parses this/super", () => {
      const thisExpr = parseFirstExpression("this;");
      expect(thisExpr.type).toBe("ThisExpression");
      const superExpr = parseFirstExpression("super;");
      expect(superExpr.type).toBe("Super");
    });

    it("parses binary/logical/conditional", () => {
      const bin = parseFirstExpression("1 + 2;");
      expect(bin.type).toBe("BinaryExpression");
      const log = parseFirstExpression("a && b;");
      expect(log.type).toBe("LogicalExpression");
      const cond = parseFirstExpression("a ? b : c;");
      expect(cond.type).toBe("ConditionalExpression");
    });

    it("parses unary/update", () => {
      const un = parseFirstExpression("!flag;");
      expect(un.type).toBe("UnaryExpression");
      const pre = parseFirstExpression("++x;");
      expect(pre.type).toBe("UpdateExpression");
      const post = parseFirstExpression("x++;\n");
      expect(post.type).toBe("UpdateExpression");
    });

    it("parses assignment and logical assignment", () => {
      const assign = parseFirstExpression("a = 1;");
      expect(assign.type).toBe("AssignmentExpression");
      const logAssign = parseFirstExpression("a ||= b;");
      expect(logAssign.type).toBe("AssignmentExpression");
      expect((logAssign as ESTree.AssignmentExpression).operator).toBe("||=");
    });

    it("parses call/new/member expressions", () => {
      const call = parseFirstExpression("fn(1, 2);");
      expect(call.type).toBe("CallExpression");
      const newExpr = parseFirstExpression("new Foo(1);");
      expect(newExpr.type).toBe("NewExpression");
      const mem = parseFirstExpression("obj.prop;");
      expect(mem.type).toBe("MemberExpression");
      const comp = parseFirstExpression('obj["key"];');
      expect(comp.type).toBe("MemberExpression");
      expect((comp as ESTree.MemberExpression).computed).toBe(true);
    });
  });

  describe("Functions and arrows", () => {
    it("parses function declarations/expressions", () => {
      const decl = parseFirstStatement("function add(a, b) { return a + b; }");
      expect(decl.type).toBe("FunctionDeclaration");
      const expr = parseFirstExpression("(function named() { return 1; });");
      expect(expr.type).toBe("FunctionExpression");
    });

    it("parses async + generator functions", () => {
      const asyncDecl = parseFirstStatement("async function f() { return 1; }");
      expect(asyncDecl.type).toBe("FunctionDeclaration");
      expect((asyncDecl as ESTree.FunctionDeclaration).async).toBe(true);
      const gen = parseFirstStatement("function* g(){ yield 1; }");
      expect(gen.type).toBe("FunctionDeclaration");
      expect((gen as ESTree.FunctionDeclaration).generator).toBe(true);
    });

    it("parses arrow functions (expression and block)", () => {
      const expr = parseFirstExpression("x => x * 2;");
      expect(expr.type).toBe("ArrowFunctionExpression");
      const block = parseFirstExpression("(x, y) => { return x + y; };");
      expect(block.type).toBe("ArrowFunctionExpression");
    });

    it("parses rest + default params", () => {
      const expr = parseFirstExpression("(a = 1, ...rest) => a + rest[0];");
      const fn = expr as ESTree.ArrowFunctionExpression;
      expect(fn.params[0]?.type).toBe("AssignmentPattern");
      expect(fn.params[1]?.type).toBe("RestElement");
    });

    it("parses await/yield", () => {
      const awaitExpr = parseFirstExpression("await 1;");
      expect(awaitExpr.type).toBe("AwaitExpression");
      const yieldExpr = parseFirstStatement("function* g(){ yield 1; }");
      const g = yieldExpr as ESTree.FunctionDeclaration;
      const y = g.body.body[0] as ESTree.ExpressionStatement;
      expect(y.expression.type).toBe("YieldExpression");
    });
  });

  describe("TypeScript annotations (stripped)", () => {
    it("parses variable and parameter type annotations", () => {
      const ast = parseModule(
        "let x: number = 1; function f(a: string, b?: number): void { return; }",
      );
      expect(ast.type).toBe("Program");
      expect(ast.body.length).toBe(2);
      const decl = ast.body[0] as ESTree.VariableDeclaration;
      expect(decl.declarations[0]?.id.type).toBe("Identifier");
    });

    it("parses arrow return types and as-assertions", () => {
      const ast = parseModule("const f = (a: number): number => a as number;");
      const decl = ast.body[0] as ESTree.VariableDeclaration;
      const init = decl.declarations[0]?.init as ESTree.ArrowFunctionExpression;
      expect(init.type).toBe("ArrowFunctionExpression");
    });

    it("parses class fields with modifiers and implements clauses", () => {
      const stmt = parseFirstStatement(`
        class Box implements Sized {
          public readonly value!: number;
          optional?: string;
        }
      `);
      expect(stmt.type).toBe("ClassDeclaration");
      const cls = stmt as ESTree.ClassDeclaration;
      expect(cls.body.body.some((node) => node.type === "PropertyDefinition")).toBe(true);
    });

    it("drops type and interface declarations", () => {
      const ast = parseModule("type Foo = { a: number }; interface Bar { b: string } let x = 1;");
      expect(ast.body.length).toBe(1);
      expect(ast.body[0]?.type).toBe("VariableDeclaration");
    });
  });

  describe("Arrays, objects, patterns, and templates", () => {
    it("parses array literals and spread", () => {
      const expr = parseFirstExpression("[1, , 2, ...rest];");
      const arr = expr as ESTree.ArrayExpression;
      expect(arr.elements.length).toBe(4);
      expect(arr.elements[1]).toBeNull();
      expect(arr.elements[3]?.type).toBe("SpreadElement");
    });

    it("parses object literals with shorthand, computed, and spread", () => {
      const expr = parseFirstExpression("({ a, ['b']: 2, ...c });\n");
      const obj = expr as ESTree.ObjectExpression;
      expect(obj.properties.length).toBe(3);
      expect(obj.properties[0]?.type).toBe("Property");
      expect((obj.properties[1] as ESTree.Property).computed).toBe(true);
      expect(obj.properties[2]?.type).toBe("SpreadElement");
    });

    it("parses object pattern destructuring", () => {
      const stmt = parseFirstStatement("let { a, b: c = 2, ...rest } = obj;");
      const decl = stmt as ESTree.VariableDeclaration;
      const pattern = decl.declarations[0]?.id as ESTree.ObjectPattern;
      expect(pattern.type).toBe("ObjectPattern");
      expect(pattern.properties.some((p) => p.type === "RestElement")).toBe(true);
    });

    it("parses array pattern destructuring", () => {
      const stmt = parseFirstStatement("let [a, b = 2, ...rest] = arr;");
      const decl = stmt as ESTree.VariableDeclaration;
      const pattern = decl.declarations[0]?.id as ESTree.ArrayPattern;
      expect(pattern.type).toBe("ArrayPattern");
      expect(pattern.elements.some((e) => e?.type === "RestElement")).toBe(true);
    });

    it("parses template literals", () => {
      const expr = parseFirstExpression("`hello ${name}`;");
      expect(expr.type).toBe("TemplateLiteral");
      const tpl = expr as ESTree.TemplateLiteral;
      expect(tpl.quasis.length).toBe(2);
      expect(tpl.expressions.length).toBe(1);
    });
  });

  describe("Classes", () => {
    it("parses class declarations with fields, methods, getters, and static blocks", () => {
      const stmt = parseFirstStatement(`
        class Box extends Base {
          static count = 0;
          #value = 1;
          constructor(v) { this.#value = v; }
          get value() { return this.#value; }
          set value(v) { this.#value = v; }
          static { Box.count = Box.count + 1; }
        }
      `);
      expect(stmt.type).toBe("ClassDeclaration");
      const cls = stmt as ESTree.ClassDeclaration;
      expect(cls.superClass?.type).toBe("Identifier");
      const body = cls.body.body;
      expect(body.some((node) => node.type === "MethodDefinition")).toBe(true);
      expect(body.some((node) => node.type === "PropertyDefinition")).toBe(true);
      expect(body.some((node) => node.type === "StaticBlock")).toBe(true);
    });

    it("parses class expressions", () => {
      const expr = parseFirstExpression("(class { method() {} });");
      expect(expr.type).toBe("ClassExpression");
    });
  });

  describe("Optional chaining + chain expression", () => {
    it("wraps optional chaining in ChainExpression", () => {
      const expr = parseFirstExpression("obj?.method?.(1);");
      expect(expr.type).toBe("ChainExpression");
      const chain = expr as ESTree.ChainExpression;
      expect(chain.expression.type).toBe("CallExpression");
    });
  });

  describe("Errors", () => {
    it("rejects labeled break/continue", () => {
      expect(() => parseModule("break label;")).toThrow();
      expect(() => parseModule("continue label;")).toThrow();
    });

    it("rejects private identifiers in object literals", () => {
      expect(() => parseModule("let obj = { #x: 1 };")).toThrow();
    });

    it("rejects invalid assignment targets", () => {
      expect(() => parseModule("1 = 2;")).toThrow();
    });

    it("rejects invalid binding patterns", () => {
      expect(() => parseModule("let 1 = 2;")).toThrow();
    });

    it("rejects unterminated strings/templates", () => {
      expect(() => parseModule("'unterminated")).toThrow();
      expect(() => parseModule("`unterminated ${1}")).toThrow();
    });

    it("rejects throw with line break", () => {
      expect(() => parseModule("throw\n1")).toThrow();
    });
  });

  describe("Profiling helper", () => {
    it("reports profile data", () => {
      const result = parseModuleWithProfile("let x = 1; x + 2;");
      expect(result.ast.type).toBe("Program");
      expect(result.profile.tokens).toBeGreaterThan(0);
      expect(result.profile.tokenizeMs).toBeGreaterThanOrEqual(0);
      expect(result.profile.parseMs).toBeGreaterThanOrEqual(0);
    });
  });
});
