import { parseModuleWithProfile } from "../src/ast";

const samples: { name: string; code: string }[] = [
  { name: "Tiny Expression", code: "2 + 3" },
  {
    name: "Control Flow",
    code: `
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          sum = sum + i;
        }
      }
      sum
    `,
  },
  {
    name: "Functions + Closures",
    code: `
      function makeAdder(x) {
        return y => x + y;
      }
      let add10 = makeAdder(10);
      add10(5)
    `,
  },
  {
    name: "Objects + Destructuring",
    code: `
      let obj = { a: 1, b: 2, c: { d: 4 } };
      let { a, c: { d } } = obj;
      a + d
    `,
  },
  {
    name: "Classes + Fields",
    code: `
      class Box {
        static count = 0;
        #value = 1;
        constructor(v) { this.#value = v; }
        get value() { return this.#value; }
        static { Box.count = Box.count + 1; }
      }
      new Box(2).value
    `,
  },
  { name: "Optional Chaining", code: "obj?.value?.()" },
  { name: "Template Literal", code: "`Hello ${1 + 2}`" },
];

console.log("========================================");
console.log("PARSER PROFILE (TOKENIZE vs PARSE)");
console.log("========================================\n");

for (const sample of samples) {
  const result = parseModuleWithProfile(sample.code);
  const total = result.profile.tokenizeMs + result.profile.parseMs;
  const tokenizePct = total > 0 ? (result.profile.tokenizeMs / total) * 100 : 0;
  const parsePct = total > 0 ? (result.profile.parseMs / total) * 100 : 0;

  console.log(`${sample.name}:`);
  console.log(
    `  tokens=${result.profile.tokens} tokenize=${result.profile.tokenizeMs.toFixed(
      2,
    )}ms (${tokenizePct.toFixed(1)}%) parse=${result.profile.parseMs.toFixed(
      2,
    )}ms (${parsePct.toFixed(1)}%)`,
  );
}
