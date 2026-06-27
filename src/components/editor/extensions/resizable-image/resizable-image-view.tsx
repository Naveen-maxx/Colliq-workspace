import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { AlignLeft, AlignCenter, AlignRight, Maximize, Loader2, RotateCw, Crop, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export function ResizableImageView({ node, updateAttributes, selected, deleteNode, editor }: NodeViewProps) {
  const { src, originalSrc, width, align, caption, loading, rotate, crop } = node.attrs;
  
  const isEditable = editor.isEditable;
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<"nw" | "ne" | "sw" | "se" | null>(null);
  const [startDrag, setStartDrag] = useState({ x: 0, w: 0 });

  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState(crop || { x: 0, y: 0, w: 100, h: 100 });
  const [cropDragging, setCropDragging] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Auto-set originalSrc if it's missing (for older images in DB)
  useEffect(() => {
    if (src && !originalSrc && !loading) {
      updateAttributes({ originalSrc: src });
    }
  }, [src, originalSrc, loading, updateAttributes]);

  // --- RESIZE LOGIC ---
  const handleResizeStart = (e: ReactMouseEvent<HTMLDivElement>, dir: "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    if (!containerRef.current) return;
    setIsResizing(true);
    setResizeDirection(dir);
    setStartDrag({ x: e.clientX, w: containerRef.current.offsetWidth });
  };

  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !containerRef.current.parentElement) return;
      const parentWidth = containerRef.current.parentElement.offsetWidth || 800;
      
      const deltaX = e.clientX - startDrag.x;
      // If pulling left handle, moving left (negative delta) increases width
      // If pulling right handle, moving right (positive delta) increases width
      const isLeft = resizeDirection === "nw" || resizeDirection === "sw";
      const widthChange = isLeft ? -deltaX : deltaX;
      
      const newWidthPx = startDrag.w + widthChange;
      const percentage = Math.max(10, Math.min(100, (newWidthPx / parentWidth) * 100));
      updateAttributes({ width: `${percentage}%` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeDirection, startDrag, updateAttributes]);

  // --- CROP LOGIC ---
  const handleCropStart = (e: ReactMouseEvent<HTMLDivElement>, action: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    setCropDragging(action);
  };

  useEffect(() => {
    if (!cropDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      setCropBox((prev: any) => {
        let newBox = { ...prev };
        
        if (cropDragging === "nw") {
          newBox.w = prev.w + (prev.x - xPercent);
          newBox.h = prev.h + (prev.y - yPercent);
          newBox.x = xPercent;
          newBox.y = yPercent;
        } else if (cropDragging === "ne") {
          newBox.w = xPercent - prev.x;
          newBox.h = prev.h + (prev.y - yPercent);
          newBox.y = yPercent;
        } else if (cropDragging === "sw") {
          newBox.w = prev.w + (prev.x - xPercent);
          newBox.h = yPercent - prev.y;
          newBox.x = xPercent;
        } else if (cropDragging === "se") {
          newBox.w = xPercent - prev.x;
          newBox.h = yPercent - prev.y;
        } else if (cropDragging === "move") {
          newBox.x = Math.max(0, Math.min(100 - prev.w, xPercent - prev.w / 2));
          newBox.y = Math.max(0, Math.min(100 - prev.h, yPercent - prev.h / 2));
        }

        // Clamp minimum size to 5%
        if (newBox.w < 5) newBox.w = 5;
        if (newBox.h < 5) newBox.h = 5;

        return newBox;
      });
    };

    const handleMouseUp = () => setCropDragging(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [cropDragging]);

  const applyCrop = () => {
    const baseSrc = originalSrc || src;
    if (!baseSrc) return;

    if (baseSrc.includes("res.cloudinary.com") && baseSrc.includes("/upload/")) {
      const parts = baseSrc.split("/upload/");
      const transform = `c_crop,w_${(cropBox.w / 100).toFixed(4)},h_${(cropBox.h / 100).toFixed(4)},x_${(cropBox.x / 100).toFixed(4)},y_${(cropBox.y / 100).toFixed(4)}`;
      
      // Clean up any existing crop transformation in the original URL if present
      const cleanPath = parts[1].replace(/^(c_[^/]+\/)+/, '');
      const newSrc = `${parts[0]}/upload/${transform}/${cleanPath}`;
      
      updateAttributes({ src: newSrc, crop: cropBox });
    } else {
      toast.error("Crop is only supported for Cloudinary images.");
    }
    
    setIsCropping(false);
  };

  const cancelCrop = () => {
    setCropBox(crop || { x: 0, y: 0, w: 100, h: 100 });
    setIsCropping(false);
  };

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
        selected && !isCropping ? "ring-2 ring-primary ring-offset-2" : ""
      } ${alignmentClass}`}
      style={{ width: align === "full" ? "100%" : width }}
      draggable="true"
      data-drag-handle
    >
      {/* ALIGNMENT TOOLBAR (Shows on hover/select) */}
      {!isCropping && isEditable && (
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
          
          <div className="mx-0.5 h-4 w-px bg-border-soft" />
          
          <button
            type="button"
            onClick={() => updateAttributes({ rotate: (rotate + 90) % 360 })}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted"
            title="Rotate"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsCropping(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted"
            title="Crop"
          >
            <Crop size={14} />
          </button>
          
          <div className="mx-0.5 h-4 w-px bg-border-soft" />
          
          <button
            type="button"
            onClick={deleteNode}
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* IMAGE / LOADING STATE */}
      <div className="relative overflow-hidden rounded-xl bg-surface-muted">
        {loading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative">
            <img
              ref={imageRef}
              src={isCropping ? (originalSrc || src) : src}
              alt={caption || "Editor Image"}
              className="block h-auto w-full rounded-xl object-contain transition-transform duration-200"
              style={{ transform: `rotate(${rotate}deg)` }}
            />
            
            {/* CROP OVERLAY */}
            {isCropping && (
              <div className="absolute inset-0 z-20 bg-black/40 rounded-xl overflow-hidden">
                <div 
                  className="absolute border-2 border-white cursor-move ring-2 ring-black/50"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.w}%`,
                    height: `${cropBox.h}%`
                  }}
                  onMouseDown={(e) => handleCropStart(e, "move")}
                >
                  {/* Crop Handles */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-black/20 cursor-nwse-resize rounded-sm" onMouseDown={(e) => handleCropStart(e, "nw")} />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-black/20 cursor-nesw-resize rounded-sm" onMouseDown={(e) => handleCropStart(e, "ne")} />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-black/20 cursor-nesw-resize rounded-sm" onMouseDown={(e) => handleCropStart(e, "sw")} />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-black/20 cursor-nwse-resize rounded-sm" onMouseDown={(e) => handleCropStart(e, "se")} />
                </div>
                
                {/* Crop Actions */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-lg p-1 shadow-xl z-30">
                  <button onClick={cancelCrop} className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-surface-muted rounded-md transition-colors">
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={applyCrop} className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-md transition-colors">
                    <Check size={14} /> Apply Crop
                  </button>
                </div>
              </div>
            )}
            
            {/* 4-CORNER RESIZE HANDLES */}
            {!loading && selected && !isCropping && align !== "full" && isEditable && (
              <>
                <div
                  className="absolute -top-1.5 -left-1.5 z-10 h-3.5 w-3.5 cursor-nwse-resize rounded-full bg-white border border-border-soft shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  onMouseDown={(e) => handleResizeStart(e, "nw")}
                />
                <div
                  className="absolute -top-1.5 -right-1.5 z-10 h-3.5 w-3.5 cursor-nesw-resize rounded-full bg-white border border-border-soft shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  onMouseDown={(e) => handleResizeStart(e, "ne")}
                />
                <div
                  className="absolute -bottom-1.5 -left-1.5 z-10 h-3.5 w-3.5 cursor-nesw-resize rounded-full bg-white border border-border-soft shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  onMouseDown={(e) => handleResizeStart(e, "sw")}
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 z-10 h-3.5 w-3.5 cursor-nwse-resize rounded-full bg-white border border-border-soft shadow-sm ring-1 ring-black/5 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
                  onMouseDown={(e) => handleResizeStart(e, "se")}
                />
              </>
            )}
          </div>
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
