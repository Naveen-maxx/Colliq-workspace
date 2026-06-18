import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Copy, ArrowDownToLine, Check, Loader2 } from "lucide-react";
import { type Editor } from "@tiptap/react";
import { marked } from "marked";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface AIPreviewCardProps {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  content: string;
  insertAt: number;
  editor: Editor | null;
  onClose: () => void;
}

export function AIPreviewCard({
  isOpen,
  isLoading,
  title,
  content,
  insertAt,
  editor,
  onClose,
}: AIPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (!editor || !content) return;
    const html = marked.parse(content, { async: false }) as string;
    editor.chain().focus().insertContentAt(insertAt, html).run();
    onClose();
    toast.success("Content inserted.");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Card */}
      <div className="fixed left-1/2 top-1/2 z-[9999] w-[560px] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.18)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-sm">
              <Sparkles size={13} strokeWidth={2.5} />
            </div>
            <span className="font-display text-[14px] font-semibold text-foreground">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center gap-3 py-4 text-muted-foreground">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-[13.5px]">Generating{title.toLowerCase().includes("outline") ? " outline" : " summary"}…</span>
            </div>
          ) : (
            <div className="prose prose-sm colliq-prose min-w-0 leading-[1.7] text-foreground/90 prose-p:my-2 prose-headings:my-3 prose-li:my-0.5 prose-pre:bg-surface-muted">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && content && (
          <div className="flex items-center justify-between border-t border-border/50 bg-black/[0.02] px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/5"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleInsert}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                <ArrowDownToLine size={13} />
                Insert
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
