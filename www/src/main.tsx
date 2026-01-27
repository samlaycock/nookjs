import "./index.css";

import CodeEditor from "@uiw/react-textarea-code-editor";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Interpreter, ES2024, preset } from "../../src/index";

const CODE_LOCAL_STORAGE_KEY = "nookjs-code";

function App() {
  const [code, setCode] = useState(window.localStorage.getItem(CODE_LOCAL_STORAGE_KEY) ?? "");
  const [output, setOutput] = useState<string | null>(null);
  const execute = useCallback(async () => {
    const interpreter = new Interpreter(
      preset(
        ES2024,
        { globals: { console, alert: alert.bind(window) } },
        { security: { hideHostErrorMessages: false } },
      ),
    );
    const result = await interpreter.evaluate(code);

    if (result) {
      setOutput(String(result));
    } else {
      setOutput(null);
    }
  }, [code]);
  const clear = useCallback(() => {
    setCode("");
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
      <header className="flex flex-row p-6">
        <h1 className="text-white">
          <span className="font-semibold">NookJS</span> <br />
          JavaScript/Typescript(ish) Interpreter
        </h1>
      </header>
      <div className="flex-1 grid h-full w-full">
        <section className="flex flex-col bg-neutral-900">
          <div className="flex-1 p-6 focus-within:ring-2 focus-within:ring-blue-500">
            <form className="h-full w-full">
              <CodeEditor
                id="input"
                value={code}
                language="ts"
                placeholder="Please enter JS/TS code."
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
          <div className="flex flex-row justify-between items-center p-6 border-t border-neutral-700">
            <div>
              {output !== null && (
                <div className="flex flex-row gap-4">
                  <span className="text-neutral-600">Output:</span>
                  <pre className="text-white whitespace-pre-wrap">{output}</pre>
                </div>
              )}
            </div>
            <div className="flex flex-row gap-4">
              <button
                className="px-4 py-2 bg-neutral-600 text-white hover:bg-netrual-700"
                onClick={clear}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
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
          &copy; Samuel Laycock {new Date().getFullYear()}
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
