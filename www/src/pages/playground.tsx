import CodeEditor from "@uiw/react-textarea-code-editor";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSandbox, InterpreterError, ParseError } from "../../../src/index";
import { Button } from "../components/button";

const CODE_LOCAL_STORAGE_KEY = "nookjs-code";
const DEFAULT_CODE = `// Welcome to NookJS!

const main = (length: number) => {
  const arr = Array.from({ length });
  let i = 0;

  for (const item of arr) {
    i += 1;
    console.log(\`Simon says: \${i}\`);
  }
}

main(10);
alert("Check your console!");
`;
const CODE_EDITOR_STYLES = {
  backgroundColor: "transparent",
  fontSize: 16,
  height: "100%",
  width: "100%",
};

export function Playground() {
  const [code, setCode] = useState(
    window.localStorage.getItem(CODE_LOCAL_STORAGE_KEY) ?? DEFAULT_CODE,
  );
  const usageCode = useMemo(
    () => `import { createSandbox } from "nookjs";

const sandbox = createSandbox({
  env: "es2024",
  globals: { console, alert: alert.bind(globalThis) },
  security: { hideHostErrorMessages: false },
});

const code = \`${code.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;

const result = await sandbox.run(code);`,
    [code],
  );
  const [mode, setMode] = useState<"code" | "usage">("code");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onRun = useCallback(async () => {
    setError(null);

    const sandbox = createSandbox({
      env: "es2024",
      globals: { console, alert: alert.bind(globalThis) },
      security: { hideHostErrorMessages: false },
    });

    try {
      const result = await sandbox.run(code);

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
  const onClear = useCallback(() => {
    setCode("");
    setOutput(null);
    setError(null);
    window.localStorage.removeItem(CODE_LOCAL_STORAGE_KEY);
  }, []);
  const onSetMode = useCallback((newMode: "code" | "usage") => {
    setMode(newMode);
  }, []);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const onCopyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(usageCode);

    setCopyButtonText("Copied!");

    setTimeout(() => {
      setCopyButtonText("Copy");
    }, 2000);
  }, [usageCode]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (code) {
        window.localStorage.setItem(CODE_LOCAL_STORAGE_KEY, code);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [code]);

  return (
    <main className="flex-1 flex flex-col w-full">
      <section className="flex-1 flex flex-col w-full bg-neutral-900">
        <div className="relative flex-1 p-4 z-10 focus-within:ring-2 focus-within:ring-amber-500 sm:p-6">
          {mode === "code" && (
            <form
              className="h-full w-full"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <CodeEditor
                id="input"
                value={code}
                language="ts"
                placeholder="Please enter JavaScript/TypeScript code."
                onChange={(evn) => setCode(evn.target.value)}
                padding={0}
                style={CODE_EDITOR_STYLES}
              />
            </form>
          )}
          {mode === "usage" && (
            <form
              className="h-full w-full"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <CodeEditor
                id="input"
                value={usageCode}
                language="ts"
                padding={0}
                style={CODE_EDITOR_STYLES}
                disabled
              />
            </form>
          )}
          <div className="flex flex-row absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              className={`px-3 py-1 text-neutral-50 text-sm ${
                mode === "code"
                  ? "bg-neutral-500"
                  : "bg-neutral-600 cursor-pointer hover:bg-neutral-500"
              }`}
              onClick={() => onSetMode("code")}
            >
              Code
            </button>
            <button
              className={`px-3 py-1 text-neutral-50 text-sm ${
                mode === "usage"
                  ? "bg-neutral-500"
                  : "bg-neutral-600 cursor-pointer hover:bg-neutral-500"
              }`}
              onClick={() => onSetMode("usage")}
            >
              Usage
            </button>
          </div>
          {mode === "usage" && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
              <button
                className="px-3 py-1 bg-neutral-600 text-neutral-50 text-sm cursor-pointer hover:bg-neutral-500"
                onClick={onCopyToClipboard}
              >
                {copyButtonText}
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-row gap-4 justify-between items-center p-4 border-t border-neutral-700 sm:gap-6 sm:p-6">
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
            <Button variant="secondary" onClick={onClear}>
              Clear
            </Button>
            <Button onClick={onRun}>Run</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
