import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlockComponent({
  node,
  updateAttributes,
  extension,
}: any) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="code-block relative group my-4 rounded-xl overflow-hidden bg-surface-muted border border-border-soft">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <select
          contentEditable={false}
          value={node.attrs.language || ""}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          className="h-7 rounded-md border border-border-soft bg-white/80 px-2 text-[11px] font-medium text-muted-foreground outline-none backdrop-blur-sm transition-colors hover:bg-white"
        >
          <option value="">auto</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
          <option value="bash">Bash</option>
        </select>
        <button
          contentEditable={false}
          onClick={copyToClipboard}
          className="grid h-7 w-7 place-items-center rounded-md border border-border-soft bg-white/80 text-muted-foreground backdrop-blur-sm transition-all hover:bg-white hover:text-primary"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="!m-0 !bg-transparent !p-4 !pt-10 overflow-x-auto text-[13.5px] leading-relaxed">
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
