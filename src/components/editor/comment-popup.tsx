import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";

export interface CommentPopupProps {
  isOpen: boolean;
  selectedText: string;
  anchorRect: DOMRect | null;
  onSubmit: (message: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Compact floating popup for writing a new comment.
 * Positioned below the selected text via anchorRect.
 */
export function CommentPopup({
  isOpen,
  selectedText,
  anchorRect,
  onSubmit,
  onCancel,
}: CommentPopupProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when popup opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(message.trim());
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  // Position: horizontally centered under anchorRect
  const popupStyle: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        top: anchorRect.bottom + window.scrollY + 8,
        left: Math.min(
          Math.max(anchorRect.left + anchorRect.width / 2 - 160, 12),
          window.innerWidth - 332
        ),
        zIndex: 60,
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 60 };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-50" onClick={onCancel} />

          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={popupStyle}
            className="w-80 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_20px_60px_-15px_rgba(40,40,90,0.25)] z-[60]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" />
                <span className="text-[13px] font-semibold text-foreground">Add comment</span>
              </div>
              <button
                onClick={onCancel}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            {/* Selected text preview */}
            {selectedText && (
              <div className="border-b border-border-soft bg-amber-50/60 px-4 py-2.5">
                <p className="line-clamp-2 text-[12px] italic text-amber-800/80">
                  "{selectedText.slice(0, 120)}{selectedText.length > 120 ? "…" : ""}"
                </p>
              </div>
            )}

            {/* Textarea */}
            <div className="p-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment…"
                rows={3}
                className="w-full resize-none rounded-xl border border-border-soft bg-surface-muted/60 px-3.5 py-2.5 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground/50">Enter to submit, Shift + Enter for new line</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-[#FAFAFA] px-4 py-3">
              <button
                onClick={onCancel}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send size={13} />
                )}
                Comment
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
