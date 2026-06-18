import { useState, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { Sparkles, X, Check, ArrowDownToLine, RefreshCw, Loader2, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askAi } from "@/server/functions/askAi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { marked } from "marked";

export interface AIStateSnapshot {
  from: number;
  to: number;
  selectedText: string;
  documentContext: string;
}

export interface SelectionAIOverlayProps {
  editor: Editor | null;
  isOpen: boolean;
  snapshot: AIStateSnapshot | null;
  onClose: () => void;
}

const ACTIONS = [
  { label: "Make Shorter", prompt: "Rewrite the selected text in fewer words while preserving meaning." },
  { label: "Make Longer", prompt: "Expand the selected text with additional clarity and detail." },
  { label: "Fix Grammar", prompt: "Correct grammar, spelling, punctuation, and sentence structure while preserving tone." },
  { label: "Rewrite", prompt: "Rewrite the selected text to improve readability and flow." },
  { label: "Improve Writing", prompt: "Improve the overall quality, clarity, professionalism, and impact of the writing." }
];

export function SelectionAIOverlay({ editor, isOpen, snapshot, onClose }: SelectionAIOverlayProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [suggestion, setSuggestion] = useState("");
  const [currentAction, setCurrentAction] = useState<typeof ACTIONS[0] | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Position the overlay exactly at the selection snapshot
  useEffect(() => {
    if (isOpen && snapshot && editor) {
      try {
        const endCoords = editor.view.coordsAtPos(snapshot.to);
        // Position slightly below the end of the selection
        setCoords({
          top: endCoords.bottom + window.scrollY + 10,
          left: Math.max(20, endCoords.left + window.scrollX - 150) // center somewhat
        });
      } catch (e) {
        // Fallback if coordsAtPos fails (e.g. node deleted)
        console.warn("Could not calculate TipTap coords for AI overlay.");
      }
    }
  }, [isOpen, snapshot, editor]);

  // Reset state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setSuggestion("");
      setCurrentAction(null);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Use a slight timeout so the triggering click doesn't immediately close it
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !coords || !snapshot || !editor) return null;

  const runAction = async (action: typeof ACTIONS[0]) => {
    setCurrentAction(action);
    setStatus("loading");
    
    try {
      const res = await askAi({
        data: {
          prompt: action.prompt,
          selectedText: snapshot.selectedText,
          documentContext: snapshot.documentContext
        }
      });
      setSuggestion(res.response);
      setStatus("success");
    } catch(e) {
      setStatus("error");
      toast.error("Failed to generate AI suggestion");
    }
  };

  const handleReplace = () => {
    if (!suggestion) return;
    
    const htmlContent = marked.parse(suggestion, { async: false }) as string;

    // Replace exact original range
    editor.chain().focus().insertContentAt(
      { from: snapshot.from, to: snapshot.to }, 
      htmlContent
    ).run();
    onClose();
  };

  const handleInsertBelow = () => {
    if (!suggestion) return;
    
    const htmlContent = marked.parse(suggestion, { async: false }) as string;

    // Insert safely below the block
    editor.chain().focus().insertContentAt(
      snapshot.to, 
      htmlContent
    ).run();
    onClose();
  };

  const handleTryAgain = () => {
    if (currentAction) {
      runAction(currentAction);
    }
  };

  const renderContent = () => {
    if (status === "idle") {
      return (
        <div className="flex w-48 flex-col py-1">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => runAction(action)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground"
            >
              <Sparkles size={14} className="text-primary/70" />
              {action.label}
            </button>
          ))}
        </div>
      );
    }

    if (status === "loading") {
      return (
        <div className="flex w-56 items-center gap-3 px-4 py-3.5">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-[13px] font-medium text-foreground/80">
            {currentAction?.label === "Fix Grammar" ? "Fixing grammar..." : "Improving writing..."}
          </span>
        </div>
      );
    }

    if (status === "success") {
      return (
        <div className="flex w-[450px] flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 bg-black/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[12px] font-medium text-muted-foreground">{currentAction?.label}</span>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Original</span>
              <p className="line-clamp-3 text-[13px] leading-relaxed text-foreground/60 line-through decoration-black/20">
                {snapshot.selectedText}
              </p>
            </div>
            
            <div className="h-px w-full bg-border/40" />
            
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary/60">Suggested</span>
              <div className="prose prose-sm colliq-prose min-w-0 flex-1 leading-[1.6] text-foreground/90 prose-p:my-1 prose-headings:my-2 prose-pre:bg-surface-muted prose-pre:text-[12px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestion}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border/50 bg-black/5 px-4 py-3">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTryAgain}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-black/5"
              >
                <RefreshCw size={12} />
                Try Again
              </button>
              <button
                onClick={handleInsertBelow}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-black/5"
              >
                <ArrowDownToLine size={12} />
                Insert Below
              </button>
              <button
                onClick={handleReplace}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                <Check size={12} />
                Replace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // We use createPortal to ensure this always stays completely on top and escapes any overflow hidden parents.
  return createPortal(
    <div
      ref={overlayRef}
      className="absolute z-[9999] rounded-xl border border-border-soft bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: coords.top,
        left: coords.left,
      }}
      // Prevent clicks inside the overlay from stealing focus from the editor before we process them
      onMouseDown={(e) => {
        // If we are replacing, we want to let the click through, but generally 
        // preventDefault stops the editor from blurring and losing our anchor point logically,
        // although we don't strictly need it since we saved the coords.
        e.stopPropagation();
      }}
    >
      {renderContent()}
    </div>,
    document.body
  );
}
