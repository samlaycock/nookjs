import CodeEditor from "@uiw/react-textarea-code-editor";
import { useCallback, useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "ts" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group rounded bg-neutral-900 border border-neutral-800">
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-600"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <CodeEditor
        value={code}
        language={language}
        padding={16}
        disabled
        style={{
          backgroundColor: "transparent",
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      />
    </div>
  );
}
