import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect, MouseEvent } from "react";
import { AlignLeft, AlignCenter, AlignRight, Maximize, Loader2 } from "lucide-react";

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, width, align, caption, loading } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleResizeStart = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.parentElement?.offsetWidth || 800;
      const rect = containerRef.current.getBoundingClientRect();
      const rawWidth = e.clientX - rect.left;
      const percentage = Math.max(20, Math.min(100, (rawWidth / containerWidth) * 100));
      updateAttributes({ width: `${percentage}%` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, updateAttributes]);

  const alignmentClass = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
    full: "w-full mx-auto",
  }[align as string] || "mx-auto";

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`group relative flex flex-col transition-all ${
        selected ? "ring-2 ring-primary ring-offset-2" : ""
      } ${alignmentClass}`}
      style={{ width: align === "full" ? "100%" : width }}
      draggable="true"
      data-drag-handle
    >
      {/* ALIGNMENT TOOLBAR (Shows on hover/select) */}
      <div
        className={`absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border-soft bg-white p-1 shadow-md transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } z-10`}
      >
        <button
          type="button"
          onClick={() => updateAttributes({ align: "left" })}
          className={`rounded-md p-1.5 transition-colors ${align === "left" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"}`}
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => updateAttributes({ align: "center" })}
          className={`rounded-md p-1.5 transition-colors ${align === "center" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"}`}
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => updateAttributes({ align: "right" })}
          className={`rounded-md p-1.5 transition-colors ${align === "right" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"}`}
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => updateAttributes({ width: "100%", align: "full" })}
          className={`rounded-md p-1.5 transition-colors ${align === "full" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"}`}
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* IMAGE / LOADING STATE */}
      <div className="relative overflow-hidden rounded-xl bg-surface-muted">
        {loading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <img
            ref={imageRef}
            src={src}
            alt={caption || "Editor Image"}
            className="block h-auto w-full rounded-xl object-contain"
          />
        )}

        {/* RESIZE HANDLE */}
        {!loading && selected && align !== "full" && (
          <div
            className="absolute -right-2 top-1/2 z-10 h-10 w-4 -translate-y-1/2 cursor-col-resize rounded-full bg-primary/90 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 shadow-sm"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>

      {/* CAPTION */}
      <input
        type="text"
        placeholder="Add a caption..."
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        className="mt-2 w-full bg-transparent px-2 py-1 text-center text-[13px] text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:text-foreground"
      />
    </NodeViewWrapper>
  );
}
