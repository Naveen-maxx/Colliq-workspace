import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface InputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  inputType?: string;
}

export function InputModal({
  open,
  onClose,
  onSubmit,
  title = "Enter a value",
  description,
  placeholder = "",
  defaultValue = "",
  submitLabel = "Save",
  cancelLabel = "Cancel",
  inputType = "text",
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      // Focus the input after the animation settles
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    onSubmit(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-soft bg-white p-6 shadow-[0_24px_60px_-12px_rgba(40,40,90,0.25)]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}

            {/* Input */}
            <input
              ref={inputRef}
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onClose();
              }}
              className="mt-4 w-full rounded-xl border border-border-soft bg-surface-muted/50 px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-primary px-4 py-2 text-[13px] font-medium text-white transition-all hover:opacity-90 active:opacity-80"
              >
                {submitLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
