import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, FileText, Loader2 } from "lucide-react";
import { askAi } from "@/server/functions/askAi";
import { toast } from "sonner";
import { marked } from "marked";
import { type Editor } from "@tiptap/react";

export interface OutlinePopoverProps {
  isOpen: boolean;
  insertAt: number;
  documentContext: string;
  editor: Editor | null;
  onClose: () => void;
}

export function OutlinePopover({
  isOpen,
  insertAt,
  documentContext,
  editor,
  onClose,
}: OutlinePopoverProps) {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTopic("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generate = async (useDocument: boolean) => {
    if (!editor) return;
    if (!useDocument && !topic.trim()) {
      toast.error("Please enter a topic first.");
      return;
    }

    setIsLoading(true);

    const prompt = useDocument
      ? "Generate a detailed, structured document outline based on the content of this document. Use numbered sections with clear headings."
      : `Generate a detailed, structured outline for the topic: "${topic.trim()}". Include numbered sections with clear headings and brief descriptions.`;

    try {
      const res = await askAi({
        data: {
          prompt,
          documentContext: useDocument ? documentContext : undefined,
          mode: "text",
        },
      });

      if (res.response.type === "text") {
        const html = marked.parse(res.response.content, { async: false }) as string;
        editor.chain().focus().insertContentAt(insertAt, html).run();
        toast.success("Outline inserted.");
      }
      onClose();
    } catch {
      toast.error("Failed to generate outline.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate(false);
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px]"
        onClick={() => !isLoading && onClose()}
      />

      {/* Popover */}
      <div className="fixed left-1/2 top-1/2 z-[9999] w-[380px] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-sm">
              <Sparkles size={13} strokeWidth={2.5} />
            </div>
            <span className="font-display text-[14px] font-semibold text-foreground">Generate Outline</span>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center gap-3 py-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-[13.5px]">Creating outline…</span>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Topic
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. Machine Learning, Climate Change…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-border/60 bg-[#FAFAFA] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => generate(false)}
                  disabled={!topic.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13.5px] font-medium text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-40"
                >
                  <Sparkles size={14} strokeWidth={2.5} />
                  Generate from Topic
                </button>

                {documentContext.trim().length > 20 && (
                  <button
                    onClick={() => generate(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-[13.5px] font-medium text-foreground/80 transition-all hover:bg-black/5"
                  >
                    <FileText size={14} />
                    Generate from Current Document
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
