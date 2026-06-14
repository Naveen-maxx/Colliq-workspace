import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { type Editor } from "@tiptap/react";
import { X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

// ─── Lazy-load react-pageflip to prevent SSR / module-level crashes ───────────
const HTMLFlipBook = React.lazy(() =>
  import("react-pageflip").then((module: any) => ({
    default: module.default || module,
  }))
);

// ─── Dimensions ───────────────────────────────────────────────────────────────
// Each individual page occupies PAGE_WIDTH × PAGE_HEIGHT pixels.
// In desktop spread mode the book canvas is (2 × PAGE_WIDTH) wide.
const PAGE_WIDTH   = 430;
const PAGE_HEIGHT  = 620;
const PADDING_X    = 44;
const PADDING_Y    = 52;
// Content area inside each page
const CONTENT_W    = PAGE_WIDTH  - PADDING_X * 2;
const CONTENT_H    = PAGE_HEIGHT - PADDING_Y * 2;
// Column gap used by the hidden measurement container
const COLUMN_GAP   = 80;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReadModeViewProps {
  editor: Editor;
  onClose: () => void;
}

// ─── Single page component (required by react-pageflip) ───────────────────────
// react-pageflip MUST receive a forwarded-ref component as children.
const BookPage = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; html: string; totalPages: number; isLeft: boolean }
>(({ pageNumber, html, totalPages, isLeft }, ref) => {
  return (
    <div
      ref={ref}
      style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, position: "relative", overflow: "hidden" }}
      className="bg-[#FEFDF8] select-none"
    >
      {/* ── Spine gradient (inner-edge shadow to suggest binding) ─────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLeft
            ? "linear-gradient(to right, transparent 85%, rgba(0,0,0,0.06) 100%)"
            : "linear-gradient(to left,  transparent 85%, rgba(0,0,0,0.06) 100%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      {/* ── Outer edge shadow ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.04)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: PADDING_Y,
          left: PADDING_X,
          width: CONTENT_W,
          height: CONTENT_H,
          overflow: "hidden",
        }}
      >
        {/*
          CSS multi-column trick:
          All pages share the same HTML. Each page "window" reveals a
          different horizontal slice of the multi-column stream by
          offsetting the container leftward.
          Page 1 → offset 0
          Page 2 → offset -(CONTENT_W + COLUMN_GAP)
          Page 3 → offset -(CONTENT_W + COLUMN_GAP) × 2
          …etc.
        */}
        <div
          className="colliq-prose text-[15px] leading-[1.8] text-[#1a1a1a] max-w-none"
          style={{
            position: "absolute",
            top: 0,
            left: -((pageNumber - 1) * (CONTENT_W + COLUMN_GAP)),
            width: CONTENT_W,
            columnWidth: CONTENT_W,
            columnGap: COLUMN_GAP,
            height: CONTENT_H,
            columnFill: "auto",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* ── Page number ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "rgba(0,0,0,0.35)",
          fontFamily: "serif",
          letterSpacing: "0.04em",
          userSelect: "none",
        }}
      >
        {pageNumber}
      </div>
    </div>
  );
});
BookPage.displayName = "BookPage";

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReadModeView({ editor, onClose }: ReadModeViewProps) {
  const [html, setHtml]               = useState("");
  const [totalPages, setTotalPages]   = useState(0);
  // currentPage = the 0-indexed left page as reported by react-pageflip
  const [flipIndex, setFlipIndex]     = useState(0);
  const [isMounted, setIsMounted]     = useState(false);
  const [isPortrait, setIsPortrait]   = useState(false); // true on mobile

  const measureRef = useRef<HTMLDivElement>(null);
  const bookRef    = useRef<any>(null);

  // ── Mount guard ─────────────────────────────────────────────────────────────
  useEffect(() => { setIsMounted(true); }, []);

  // ── Responsive: switch to portrait (single-page) below 900 px ───────────────
  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── 1. Extract editor HTML, inject break-inside CSS ─────────────────────────
  useEffect(() => {
    const content = editor.getHTML();
    const style = `<style>
      .colliq-prose img,
      .colliq-prose figure,
      .colliq-prose table,
      .colliq-prose pre,
      .colliq-prose blockquote,
      .colliq-prose .resizable-image {
        break-inside: avoid;
        page-break-inside: avoid;
        max-width: 100%;
        height: auto;
      }
    </style>`;
    setHtml(style + content);
  }, [editor]);

  // ── 2. Measure total pages via invisible column container ────────────────────
  useEffect(() => {
    if (!html || !measureRef.current) return;

    const timeout = setTimeout(() => {
      if (!measureRef.current) return;
      const scrollWidth = measureRef.current.scrollWidth;
      // Each column slot = CONTENT_W + COLUMN_GAP
      // scrollWidth includes N columns and (N-1) gaps → add one gap to round up
      let pages = Math.ceil((scrollWidth + COLUMN_GAP) / (CONTENT_W + COLUMN_GAP));
      if (pages < 2) pages = 2; // flipbook needs ≥ 2 pages
      setTotalPages(pages);
    }, 120);

    return () => clearTimeout(timeout);
  }, [html]);

  // ── 3. Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (!bookRef.current) return;
      if (
        e.key === "ArrowRight" ||
        e.key === "PageDown"   ||
        (e.key === " " && !e.shiftKey)
      ) {
        e.preventDefault();
        bookRef.current.pageFlip().flipNext();
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "PageUp"    ||
        (e.key === " " && e.shiftKey)
      ) {
        e.preventDefault();
        bookRef.current.pageFlip().flipPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Flip callback (0-indexed left page from react-pageflip) ─────────────────
  const onFlip = useCallback((e: any) => {
    setFlipIndex(e.data); // e.data = 0-indexed left-page index
  }, []);

  // ── Derived spread display ───────────────────────────────────────────────────
  // In spread mode the visible left page is flipIndex, right is flipIndex+1.
  // showCover=true means index 0 is the cover (single page), then spreads begin.
  const spreadLeft  = flipIndex + 1;           // human page number (1-indexed)
  const spreadRight = flipIndex + 2;
  const progress    = totalPages > 0
    ? Math.round((spreadRight / totalPages) * 100)
    : 0;

  // Spread label: "Pages X–Y of N" (or "Page X of N" in portrait)
  const spreadLabel = isPortrait
    ? `Page ${spreadLeft} of ${totalPages}`
    : spreadRight <= totalPages
      ? `Pages ${spreadLeft}–${spreadRight} of ${totalPages}`
      : `Page ${spreadLeft} of ${totalPages}`;

  // Total book width on desktop = two pages side by side
  const bookWidth  = isPortrait ? PAGE_WIDTH : PAGE_WIDTH * 2;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(160deg, #EDE8DF 0%, #E4DFD5 100%)" }}
    >
      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-6 border-b border-black/8"
        style={{ background: "rgba(237,232,223,0.85)", backdropFilter: "blur(12px)" }}
      >
        {/* Left: mode label */}
        <div className="flex items-center gap-2 text-[#5a5248] min-w-[120px]">
          <BookOpen size={17} strokeWidth={1.6} />
          <span className="font-semibold text-sm tracking-wide">Read Mode</span>
        </div>

        {/* Center: progress */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-[#5a5248]/80">{spreadLabel}</span>
          <div className="w-36 h-[3px] rounded-full overflow-hidden bg-black/10">
            <div
              className="h-full rounded-full bg-[#8B7355] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-[#5a5248]/55">{progress}% read</span>
        </div>

        {/* Right: exit */}
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <span className="hidden sm:block text-[11px] text-[#5a5248]/50">Esc to exit</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-all"
            style={{
              background: "rgba(255,255,255,0.7)",
              borderColor: "rgba(0,0,0,0.12)",
              color: "#3a3530",
            }}
          >
            <X size={15} strokeWidth={2} />
            Exit
          </button>
        </div>
      </div>

      {/* ══ INVISIBLE PAGE MEASUREMENT CONTAINER ═════════════════════════════ */}
      {html && totalPages === 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            height: CONTENT_H,
            width: "100vw",
            overflow: "hidden",
          }}
        >
          <div
            ref={measureRef}
            className="colliq-prose text-[15px] leading-[1.8] text-[#1a1a1a] max-w-none"
            style={{
              columnWidth: CONTENT_W,
              columnGap: COLUMN_GAP,
              height: CONTENT_H,
              columnFill: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      {/* ══ BOOK STAGE ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
        {/* Loading state */}
        {(!isMounted || totalPages === 0) && (
          <div className="flex flex-col items-center gap-3 text-[#8B7355]/60">
            <div className="w-8 h-8 rounded-full border-2 border-[#8B7355]/30 border-t-[#8B7355] animate-spin" />
            <span className="text-sm font-medium">Preparing your book…</span>
          </div>
        )}

        {/* Book + nav buttons */}
        {isMounted && totalPages > 0 && (
          <div className="relative flex items-center justify-center">
            {/* ─ Prev button ───────────────────────────────────────────────── */}
            <button
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              title="Previous spread (←)"
              className="absolute z-20 p-3 rounded-full text-[#5a5248]/60 hover:text-[#3a3530] transition-all hover:scale-110 active:scale-95"
              style={{
                left: isPortrait ? -56 : -72,
                background: "rgba(255,255,255,0.55)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <ChevronLeft size={26} strokeWidth={1.8} />
            </button>

            {/* ─ Book shadow backdrop ───────────────────────────────────────── */}
            <div
              style={{
                position: "relative",
                width: bookWidth,
                height: PAGE_HEIGHT,
                borderRadius: 4,
                boxShadow: "0 30px 80px rgba(0,0,0,0.28), 0 8px 20px rgba(0,0,0,0.16)",
              }}
            >
              {/* Center spine line (desktop only) */}
              {!isPortrait && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: 2,
                    transform: "translateX(-50%)",
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.14) 50%, rgba(0,0,0,0.08) 100%)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* react-pageflip */}
              <Suspense
                fallback={
                  <div
                    style={{ width: bookWidth, height: PAGE_HEIGHT }}
                    className="flex items-center justify-center bg-[#FEFDF8] rounded"
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-[#8B7355]/30 border-t-[#8B7355] animate-spin" />
                  </div>
                }
              >
                {/* @ts-ignore – react-pageflip types are loose */}
                <HTMLFlipBook
                  ref={bookRef}
                  width={PAGE_WIDTH}
                  height={PAGE_HEIGHT}
                  size="fixed"
                  minWidth={220}
                  maxWidth={PAGE_WIDTH}
                  minHeight={360}
                  maxHeight={PAGE_HEIGHT}
                  maxShadowOpacity={0.45}
                  showCover={false}
                  mobileScrollSupport={false}
                  usePortrait={isPortrait}
                  startPage={0}
                  drawShadow={true}
                  flippingTime={700}
                  useMouseEvents={true}
                  onFlip={onFlip}
                  className=""
                  style={{ borderRadius: 3 }}
                >
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <BookPage
                      key={i}
                      pageNumber={i + 1}
                      html={html}
                      totalPages={totalPages}
                      isLeft={i % 2 === 0}
                    />
                  ))}
                </HTMLFlipBook>
              </Suspense>
            </div>

            {/* ─ Next button ───────────────────────────────────────────────── */}
            <button
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              title="Next spread (→)"
              className="absolute z-20 p-3 rounded-full text-[#5a5248]/60 hover:text-[#3a3530] transition-all hover:scale-110 active:scale-95"
              style={{
                right: isPortrait ? -56 : -72,
                background: "rgba(255,255,255,0.55)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <ChevronRight size={26} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {/* ══ FOOTER: keyboard hints ════════════════════════════════════════════ */}
      <div
        className="shrink-0 flex items-center justify-center gap-6 h-9 text-[11px]"
        style={{ color: "rgba(90,82,72,0.45)" }}
      >
        <span>← → to turn pages</span>
        <span>·</span>
        <span>Space / Shift+Space</span>
        <span>·</span>
        <span>Click page edge to flip</span>
      </div>
    </div>
  );
}
