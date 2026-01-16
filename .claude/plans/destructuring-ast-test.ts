import { parseScript } from "meriyah";

console.log("=== Meriyah Destructuring AST Analysis ===\n");

const examples = [
  {
    name: "1. Array Destructuring",
    code: "let [a, b] = [1, 2];",
  },
  {
    name: "2. Object Destructuring",
    code: "let {x, y} = {x: 1, y: 2};",
  },
  {
    name: "3. Nested Array Destructuring",
    code: "let [a, [b, c]] = [1, [2, 3]];",
  },
  {
    name: "4. Array Destructuring with Defaults",
    code: "let [a = 5] = [];",
  },
  {
    name: "5. Array Destructuring with Rest",
    code: "let [a, ...rest] = [1, 2, 3];",
  },
  {
    name: "6. Object Destructuring with Rename",
    code: "let {x: newName} = {x: 1};",
  },
  {
    name: "7. Object Destructuring with Defaults",
    code: "let {x = 5} = {};",
  },
  {
    name: "8. Nested Object Destructuring",
    code: "let {a: {b}} = {a: {b: 1}};",
  },
  {
    name: "9. Mixed Destructuring",
    code: "let [{x}, [y]] = [{x: 1}, [2]];",
  },
  {
    name: "10. Destructuring Assignment (not declaration)",
    code: "[a, b] = [1, 2];",
  },
];

for (const example of examples) {
  console.log(`${example.name}`);
  console.log(`Code: ${example.code}`);
  console.log("-".repeat(60));

  try {
    const ast = parseScript(example.code, { module: false });
    const statement = ast.body[0];

    if (statement.type === "VariableDeclaration") {
      const declarator = statement.declarations[0];
      console.log(`Declarator ID type: ${declarator.id.type}`);
      console.log(`Full ID structure:`);
      console.log(JSON.stringify(declarator.id, null, 2));
    } else if (statement.type === "ExpressionStatement") {
      const expr = statement.expression;
      console.log(`Expression type: ${expr.type}`);
      if (expr.type === "AssignmentExpression") {
        console.log(`Left type: ${expr.left.type}`);
        console.log(`Full left structure:`);
        console.log(JSON.stringify(expr.left, null, 2));
      }
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }

  console.log("\n");
}

console.log("=== Key Takeaways ===");
console.log("ArrayPattern: Used for array destructuring [a, b]");
console.log("ObjectPattern: Used for object destructuring {x, y}");
console.log("Property: Used for object properties in ObjectPattern");
console.log("RestElement: Used for ...rest syntax");
console.log("AssignmentPattern: Used for default values (a = 5)");
console.log("Identifier: The actual variable name");
