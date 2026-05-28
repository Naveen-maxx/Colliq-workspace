import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Star, Clock, ArrowRight, CornerDownLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export type SearchableDoc = {
  id: string;
  title: string;
  edited: string;
  category: "recent" | "favorite" | "shared";
  tint: string;
};

export function SearchOverlay({ documents }: { documents: SearchableDoc[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = query.trim()
    ? documents.filter((d) =>
        d.title.toLowerCase().includes(query.toLowerCase())
      )
    : documents.slice(0, 8);

  // Group results by category
  const grouped = results.reduce(
    (acc, doc) => {
      if (doc.category === "favorite") acc.favorites.push(doc);
      else if (doc.category === "shared") acc.shared.push(doc);
      else acc.recent.push(doc);
      return acc;
    },
    { recent: [] as SearchableDoc[], favorites: [] as SearchableDoc[], shared: [] as SearchableDoc[] }
  );

  const flatResults = [...grouped.recent, ...grouped.favorites, ...grouped.shared];

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const doc = flatResults[selectedIndex];
        if (doc) {
          setFocused(false);
          setQuery("");
          inputRef.current?.blur();
          navigate({ to: "/editor/$documentId", params: { documentId: doc.id } });
        }
      } else if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    },
    [flatResults, selectedIndex, navigate]
  );

  const handleSelect = (doc: SearchableDoc) => {
    setFocused(false);
    setQuery("");
    inputRef.current?.blur();
    navigate({ to: "/editor/$documentId", params: { documentId: doc.id } });
  };

  const showDropdown = focused && documents.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Search Input */}
      <Search
        size={15}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search documents, templates..."
        className="h-10 w-full rounded-full border border-border-soft bg-white/80 pl-10 pr-4 text-[13.5px] text-foreground placeholder:text-muted-foreground/80 shadow-[0_1px_2px_rgba(40,40,90,0.04)] outline-none transition-all focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
      />

      {/* Keyboard hint */}
      <AnimatePresence>
        {!focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
          >
            <kbd className="rounded-md border border-border-soft bg-surface-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Invisible backdrop to capture outside clicks */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setFocused(false);
                inputRef.current?.blur();
              }}
            />

            <motion.div
              ref={listRef}
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto overflow-x-hidden rounded-2xl border border-border-soft bg-white p-2 shadow-[0_20px_60px_-16px_rgba(40,40,90,0.22)]"
            >
              {flatResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Search size={28} strokeWidth={1.2} className="mb-2 opacity-30" />
                  <p className="text-[13.5px] font-medium">No documents found</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground/70">Try a different search term</p>
                </div>
              ) : (
                <>
                  {grouped.recent.length > 0 && (
                    <ResultGroup
                      label="Recent"
                      icon={Clock}
                      docs={grouped.recent}
                      selectedIndex={selectedIndex}
                      baseIndex={0}
                      onSelect={handleSelect}
                    />
                  )}
                  {grouped.favorites.length > 0 && (
                    <ResultGroup
                      label="Favorites"
                      icon={Star}
                      docs={grouped.favorites}
                      selectedIndex={selectedIndex}
                      baseIndex={grouped.recent.length}
                      onSelect={handleSelect}
                    />
                  )}
                  {grouped.shared.length > 0 && (
                    <ResultGroup
                      label="Shared"
                      icon={FileText}
                      docs={grouped.shared}
                      selectedIndex={selectedIndex}
                      baseIndex={grouped.recent.length + grouped.favorites.length}
                      onSelect={handleSelect}
                    />
                  )}

                  {/* Footer hint */}
                  <div className="mt-1 flex items-center gap-3 border-t border-border-soft/60 px-3 pt-2.5 pb-1 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border-soft bg-surface-muted px-1 py-0.5 text-[10px]">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <CornerDownLeft size={10} />
                      Open
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border-soft bg-surface-muted px-1 py-0.5 text-[10px]">Esc</kbd>
                      Close
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultGroup({
  label,
  icon: Icon,
  docs,
  selectedIndex,
  baseIndex,
  onSelect,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  docs: SearchableDoc[];
  selectedIndex: number;
  baseIndex: number;
  onSelect: (doc: SearchableDoc) => void;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
        <Icon size={12} strokeWidth={2} />
        {label}
      </div>
      {docs.map((doc, i) => {
        const globalIndex = baseIndex + i;
        const isSelected = globalIndex === selectedIndex;
        return (
          <button
            key={doc.id}
            data-index={globalIndex}
            onClick={() => onSelect(doc)}
            onMouseEnter={() => {}}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              isSelected
                ? "bg-primary-soft text-foreground"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${doc.tint} 18%, white) 0%, white 100%)`,
              }}
            >
              <FileText size={14} strokeWidth={1.5} className="text-muted-foreground/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">{doc.title}</p>
              <p className="truncate text-[11.5px] text-muted-foreground/70">{doc.edited}</p>
            </div>
            {isSelected && (
              <ArrowRight size={14} strokeWidth={1.8} className="shrink-0 text-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
