import { useEffect, useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { EDITOR_FONTS, EDITOR_FONT_SIZES, preloadAllGoogleFonts, loadGoogleFont } from "@/lib/fonts";
import { ChevronDown, Check, Minus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function useEditorTypography(editor: Editor | null) {
  const [activeFont, setActiveFont] = useState("Inter");
  const [activeSize, setActiveSize] = useState(15.5);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const attrs = editor.getAttributes("textStyle");
      if (attrs.fontFamily) {
        setActiveFont(attrs.fontFamily.replace(/['"]/g, ""));
      } else {
        setActiveFont("Inter");
      }
      
      if (attrs.fontSize) {
        const sizeStr = attrs.fontSize.replace(/['"px]+/g, "");
        const parsed = parseFloat(sizeStr);
        if (!isNaN(parsed)) {
          setActiveSize(parsed);
        } else {
          setActiveSize(15.5);
        }
      } else {
        setActiveSize(15.5);
      }
    };
    
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    
    // Initial call
    update();
    
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  return { activeFont, activeSize };
}

// Reusable Dropdown component that protects editor focus
export function TypographyDropdown({
  label,
  width = 180,
  children,
  onOpen
}: {
  label: React.ReactNode;
  width?: number;
  children: (close: () => void) => React.ReactNode;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && onOpen) onOpen();
  }, [open, onOpen]);

  useEffect(() => {
    const cb = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", cb);
    return () => document.removeEventListener("mousedown", cb);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-foreground hover:bg-surface-muted transition-colors"
      >
        {label}
        <ChevronDown size={14} className="opacity-60" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{ width }}
            className="absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border-soft bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(40,40,90,0.18)]"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UnifiedFontFamilyDropdown({ editor, activeFont }: { editor: Editor; activeFont: string }) {
  return (
    <TypographyDropdown 
      label={<span className="w-[100px] truncate text-left">{activeFont}</span>} 
      width={220}
      onOpen={preloadAllGoogleFonts}
    >
      {(close) => (
        <div className="max-h-[300px] overflow-y-auto pr-1">
          {EDITOR_FONTS.map((f) => (
            <button
              key={f}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                loadGoogleFont(f);
                editor.chain().focus().setFontFamily(f).run();
                close();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-surface-muted ${
                activeFont === f ? "text-primary bg-primary-soft font-medium" : "text-foreground"
              }`}
            >
              <span style={{ fontFamily: f, fontSize: "14px" }}>{f}</span>
              {activeFont === f && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </TypographyDropdown>
  );
}

export function UnifiedFontSizeDropdown({ editor, activeSize }: { editor: Editor; activeSize: number }) {
  // Convert standard sizes array to strings to match display, but keep them as numbers internally.
  return (
    <TypographyDropdown 
      label={<span className="w-8 text-center">{activeSize}</span>} 
      width={100}
    >
      {(close) => (
        <div className="max-h-[300px] overflow-y-auto pr-1">
          {EDITOR_FONT_SIZES.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().setFontSize(`${s}px`).run();
                close();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-muted ${
                activeSize === s ? "text-primary bg-primary-soft font-medium" : "text-foreground"
              }`}
            >
              <span>{s}</span>
              {activeSize === s && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </TypographyDropdown>
  );
}

export function UnifiedFontSizeControl({ editor, activeSize }: { editor: Editor; activeSize: number }) {
  const decreaseSize = () => {
    // Find the next smallest standard size, or just subtract 1
    const currentIndex = EDITOR_FONT_SIZES.indexOf(activeSize);
    let newSize = Math.max(8, activeSize - 1);
    if (currentIndex > 0) {
      newSize = EDITOR_FONT_SIZES[currentIndex - 1];
    }
    editor.chain().focus().setFontSize(`${newSize}px`).run();
  };

  const increaseSize = () => {
    // Find the next largest standard size, or just add 1
    const currentIndex = EDITOR_FONT_SIZES.indexOf(activeSize);
    let newSize = Math.min(96, activeSize + 1);
    if (currentIndex !== -1 && currentIndex < EDITOR_FONT_SIZES.length - 1) {
      newSize = EDITOR_FONT_SIZES[currentIndex + 1];
    }
    editor.chain().focus().setFontSize(`${newSize}px`).run();
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={decreaseSize}
        className="grid h-7 w-7 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <Minus size={12} strokeWidth={2} />
      </button>
      
      <UnifiedFontSizeDropdown editor={editor} activeSize={activeSize} />
      
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={increaseSize}
        className="grid h-7 w-7 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <span className="text-[14px] leading-none">+</span>
      </button>
    </div>
  );
}
