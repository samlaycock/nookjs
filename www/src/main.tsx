import "./index.css";

import CodeEditor from "@uiw/react-textarea-code-editor";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Interpreter, InterpreterError, ES2024, preset, ParseError } from "../../src/index";

const CODE_LOCAL_STORAGE_KEY = "nookjs-code";

function App() {
  const [code, setCode] = useState(window.localStorage.getItem(CODE_LOCAL_STORAGE_KEY) ?? "");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const execute = useCallback(async () => {
    setError(null);

    const interpreter = new Interpreter(
      preset(
        ES2024,
        { globals: { console, alert: alert.bind(window) } },
        { security: { hideHostErrorMessages: false } },
      ),
    );

    try {
      const result = await interpreter.evaluate(code);

      if (result) {
        setOutput(String(result));
      } else {
        setOutput(null);
      }
    } catch (error) {
      if (error instanceof InterpreterError || error instanceof ParseError) {
        setError(error.message);
      } else {
        console.error(error);
        setError("An unknown error occurred during execution.");
      }
    }
  }, [code]);
  const clear = useCallback(() => {
    setCode("");
    setOutput(null);
    setError(null);
    window.localStorage.removeItem(CODE_LOCAL_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.location.replace("/");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.localStorage.setItem(CODE_LOCAL_STORAGE_KEY, code);
    }, 500);

    return () => clearTimeout(timeout);
  }, [code]);

  return (
    <main className="flex flex-col h-screen w-screen font-mono bg-neutral-950">
      <header className="flex flex-col p-6">
        <h1 className="text-amber-50 text-xl font-semibold">
          Nook<span className="text-amber-500">JS</span>
        </h1>
        <p className="text-neutral-50">JavaScript/TypeScript(ish) Interpreter</p>
      </header>
      <div className="flex-1 flex flex-col w-full">
        <section className="flex-1 flex flex-col w-full bg-neutral-900 border-t border-neutral-700">
          <div className="relative flex-1 p-6 z-10 focus-within:ring-2 focus-within:ring-amber-500">
            <form className="h-full w-full">
              <CodeEditor
                id="input"
                value={code}
                language="ts"
                placeholder="Please enter JavaScript/TypeScript code."
                onChange={(evn) => setCode(evn.target.value)}
                padding={0}
                style={{
                  backgroundColor: "transparent",
                  fontSize: 16,
                  height: "100%",
                  width: "100%",
                }}
              />
            </form>
          </div>
          <div className="flex flex-row gap-6 justify-between items-center p-6 border-t border-neutral-700">
            <div className="flex-1 overflow-hidden">
              {output !== null && (
                <div className="flex flex-row gap-4 overflow-hidden">
                  <span className="text-neutral-600">Output:</span>
                  <pre className="text-neutral-50 whitespace-pre-wrap">{output}</pre>
                </div>
              )}
              {error !== null && (
                <div className="flex flex-row gap-4 overflow-hidden">
                  <span className="text-red-600">Error:</span>
                  <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>
                </div>
              )}
            </div>
            <div className="shrink-0 flex flex-row gap-4">
              <button
                className="px-4 py-2 bg-neutral-600 text-neutral-50 cursor-pointer hover:bg-neutral-500"
                onClick={clear}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 bg-amber-500 text-amber-950 cursor-pointer hover:bg-amber-400"
                onClick={execute}
              >
                Run
              </button>
            </div>
          </div>
        </section>
      </div>
      <footer className="flex flex-row justify-center px-6 py-3 border-t border-neutral-700">
        <span className="text-neutral-600 text-sm">
          🧱 &copy; Samuel Laycock {new Date().getFullYear()}
        </span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
