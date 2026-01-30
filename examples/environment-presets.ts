import { Interpreter } from "../src/interpreter";
import { Browser, WinterCG, NodeJS, Minimal } from "../src/presets";
import { ts } from "../src/utils";

const browserInterpreter = new Interpreter(Browser);
browserInterpreter.evaluate(ts`typeof fetch`);
browserInterpreter.evaluate(ts`typeof console`);
browserInterpreter.evaluate(ts`typeof setTimeout`);

const winterCGInterpreter = new Interpreter(WinterCG);
winterCGInterpreter.evaluate(ts`typeof fetch`);
winterCGInterpreter.evaluate(ts`typeof console`);
winterCGInterpreter.evaluate(ts`typeof setTimeout`);

const nodeJSInterpreter = new Interpreter(NodeJS);
nodeJSInterpreter.evaluate(ts`typeof fetch`);
nodeJSInterpreter.evaluate(ts`typeof console`);
nodeJSInterpreter.evaluate(ts`typeof setTimeout`);
nodeJSInterpreter.evaluate(ts`typeof ArrayBuffer`);

const minimalInterpreter = new Interpreter(Minimal);
minimalInterpreter.evaluate(ts`typeof Math`);
minimalInterpreter.evaluate(ts`typeof fetch`);
minimalInterpreter.evaluate(ts`typeof console`);
