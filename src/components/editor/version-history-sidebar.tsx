import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, RotateCcw, Clock, FileText } from "lucide-react";
import { getDocumentVersions, type DocumentSnapshot } from "@/firebase/firestore/versions";
import type { Editor } from "@tiptap/react";

export function VersionHistorySidebar({
  isOpen,
  onClose,
  documentId,
  editor,
}: {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  editor: Editor | null;
}) {
  const [versions, setVersions] = useState<DocumentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DocumentSnapshot | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDocumentVersions(documentId).then((data) => {
        setVersions(data);
        setLoading(false);
      });
    }
  }, [isOpen, documentId]);

  const handleRestore = (version: DocumentSnapshot) => {
    if (!editor) return;
    editor.commands.setContent(version.content);
    setRestoreTarget(null);
    onClose();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = versions.reduce(
    (acc, v) => {
      if (!v.createdAt) return acc;
      const d = new Date(v.createdAt.toMillis?.() || Date.now());
      if (d >= today) acc.today.push(v);
      else if (d >= yesterday && d < today) acc.yesterday.push(v);
      else acc.older.push(v);
      return acc;
    },
    { today: [] as DocumentSnapshot[], yesterday: [] as DocumentSnapshot[], older: [] as DocumentSnapshot[] }
  );

  // Generate heuristic summaries by comparing adjacent snapshots
  const getSummary = (v: DocumentSnapshot, index: number): string => {
    if (v.summary && v.summary !== "Manual save") return v.summary;

    const prev = versions[index + 1]; // older snapshot
    if (!prev) return "Initial version";

    const hints: string[] = [];

    // Title change
    if (v.title !== prev.title) hints.push(`Title changed to "${v.title}"`);

    // Content length comparison
    const curLen = JSON.stringify(v.content || "").length;
    const prevLen = JSON.stringify(prev.content || "").length;
    const diff = curLen - prevLen;
    if (diff > 500) hints.push(`Added ~${Math.round(diff / 5)} words`);
    else if (diff > 100) hints.push("Content expanded");
    else if (diff < -500) hints.push(`Removed ~${Math.round(Math.abs(diff) / 5)} words`);
    else if (diff < -100) hints.push("Content trimmed");
    else hints.push("Formatting changes");

    return hints.join(" · ") || v.summary;
  };

  // Get a text preview from the content
  const getPreview = (content: any): string => {
    if (!content) return "";
    try {
      const extract = (node: any): string => {
        if (node.text) return node.text;
        if (node.content) return node.content.map(extract).join(" ");
        return "";
      };
      const text = typeof content === "string" ? "" : extract(content);
      return text.slice(0, 120).trim() + (text.length > 120 ? "…" : "");
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/5"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border-soft bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4">
              <div className="flex items-center gap-2">
                <History className="text-muted-foreground" size={18} />
                <h2 className="font-display text-[16px] font-semibold tracking-tight text-foreground">
                  Version History
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current version indicator */}
            <div className="border-b border-border-soft px-5 py-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-2 w-2 rounded-full bg-emerald-400"
                />
                <span className="text-[12.5px] font-medium text-emerald-600">Current version — autosaved</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-5">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <Clock size={32} className="mb-2 opacity-20" />
                  <p className="text-[14px] font-medium">No saved versions yet</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground/70">Use File → Save to create a snapshot</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {grouped.today.length > 0 && (
                    <VersionGroup
                      title="Today"
                      versions={grouped.today}
                      allVersions={versions}
                      onRestore={setRestoreTarget}
                      getSummary={getSummary}
                      getPreview={getPreview}
                    />
                  )}
                  {grouped.yesterday.length > 0 && (
                    <VersionGroup
                      title="Yesterday"
                      versions={grouped.yesterday}
                      allVersions={versions}
                      onRestore={setRestoreTarget}
                      getSummary={getSummary}
                      getPreview={getPreview}
                    />
                  )}
                  {grouped.older.length > 0 && (
                    <VersionGroup
                      title="Older"
                      versions={grouped.older}
                      allVersions={versions}
                      onRestore={setRestoreTarget}
                      getSummary={getSummary}
                      getPreview={getPreview}
                      showDate
                    />
                  )}
                </div>
              )}
            </div>

            {/* Restore confirmation bar */}
            <AnimatePresence>
              {restoreTarget && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="border-t border-border-soft bg-white px-5 py-4"
                >
                  <p className="mb-3 text-[13px] text-foreground">
                    Restore to version from{" "}
                    <strong>
                      {restoreTarget.createdAt
                        ? new Date(restoreTarget.createdAt.toMillis?.() || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "unknown"}
                    </strong>
                    ? Unsaved changes will be lost.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRestoreTarget(null)}
                      className="flex-1 rounded-xl border border-border-soft px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRestore(restoreTarget)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      <RotateCcw size={13} />
                      Restore
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function VersionGroup({
  title,
  versions,
  allVersions,
  onRestore,
  getSummary,
  getPreview,
  showDate,
}: {
  title: string;
  versions: DocumentSnapshot[];
  allVersions: DocumentSnapshot[];
  onRestore: (v: DocumentSnapshot) => void;
  getSummary: (v: DocumentSnapshot, globalIndex: number) => string;
  getPreview: (content: any) => string;
  showDate?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</h3>
      <div className="relative flex flex-col gap-3">
        {/* Timeline connector */}
        {versions.length > 1 && (
          <div className="absolute left-[11px] top-6 bottom-6 w-px bg-border-soft" />
        )}

        {versions.map((v) => {
          const globalIndex = allVersions.indexOf(v);
          const time = v.createdAt
            ? new Date(v.createdAt.toMillis?.() || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const date = v.createdAt
            ? new Date(v.createdAt.toMillis?.() || Date.now()).toLocaleDateString()
            : "";
          const preview = getPreview(v.content);
          const summary = getSummary(v, globalIndex);

          return (
            <div key={v.id} className="group relative flex gap-3">
              {/* Timeline dot */}
              <div className="relative z-10 mt-4 flex shrink-0">
                <div className="h-[9px] w-[9px] rounded-full border-2 border-primary/60 bg-white transition-colors group-hover:border-primary group-hover:bg-primary/10" />
              </div>

              {/* Card */}
              <div className="flex-1 rounded-xl border border-border-soft bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="mb-1.5 flex items-start justify-between">
                  <div>
                    <span className="text-[13px] font-medium text-foreground">{time}</span>
                    {showDate && <span className="ml-1.5 text-[11px] text-muted-foreground/60">{date}</span>}
                  </div>
                  <button
                    onClick={() => onRestore(v)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary opacity-0 transition-all hover:bg-primary/20 group-hover:opacity-100"
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                </div>
                <p className="mb-1.5 truncate font-display text-[14px] font-semibold text-foreground">{v.title}</p>

                {/* Summary badge */}
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span>{summary}</span>
                </div>

                {/* Content preview */}
                {preview && (
                  <p className="rounded-lg bg-surface-muted/60 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground/80">
                    {preview}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
