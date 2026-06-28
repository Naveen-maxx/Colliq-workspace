import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Send,
  Trash2,
  MessageCircle,
} from "lucide-react";
import type { CommentThread, CommentReply } from "@/firebase/firestore/comments";
import { addReply, resolveComment, reopenComment, deleteComment } from "@/firebase/firestore/comments";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

/* ──────────────────────────────────────────────────────────────
   MENTION TEXTAREA
   A textarea that detects @name and shows an autocomplete dropdown
   from the list of current document collaborators.
────────────────────────────────────────────────────────────── */

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
}

function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows,
  autoFocus,
  className,
  collaborators,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  className?: string;
  collaborators?: Collaborator[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);

    // Detect @mention pattern
    const cursorPos = e.target.selectionStart ?? 0;
    const textBefore = v.slice(0, cursorPos);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursorPos - match[0].length);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelect = (name: string) => {
    const v = value;
    const before = v.slice(0, mentionStart);
    const after = v.slice(textareaRef.current?.selectionStart ?? mentionStart + (mentionQuery?.length ?? 0) + 1);
    const newVal = `${before}@${name} ${after}`;
    onChange(newVal);
    setMentionQuery(null);
    setTimeout(() => {
      const pos = before.length + name.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    }, 0);
  };

  const filtered = (collaborators ?? []).filter((c) =>
    mentionQuery !== null && c.name.toLowerCase().startsWith(mentionQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      <AnimatePresence>
        {mentionQuery !== null && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-1 w-48 overflow-hidden rounded-xl border border-border-soft bg-white shadow-lg z-50"
          >
            {filtered.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(c.name); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-muted"
              >
                <div
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-[10px] font-bold"
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}

function Avatar({
  name,
  avatar,
  size = 28,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   COMMENT CARD
────────────────────────────────────────────────────────────── */

function CommentCard({
  thread,
  documentId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  canManage,
  isActive,
  onActivate,
  onResolved,
  onDeleted,
  onScrollToMark,
  collaborators,
}: {
  thread: CommentThread;
  documentId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  canManage: boolean;
  isActive: boolean;
  onActivate: () => void;
  onResolved: () => void;
  onDeleted: () => void;
  onScrollToMark: (commentId: string) => void;
  collaborators?: Collaborator[];
}) {
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const canDelete =
    canManage || thread.authorId === currentUserId;

  const handleCardClick = () => {
    onActivate();
    onScrollToMark(thread.commentId);
  };

  const handleReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    try {
      await addReply({
        documentId,
        commentId: thread.commentId,
        authorId: currentUserId,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
        message: replyText.trim(),
      });
      setReplyText("");
      setShowReplyInput(false);
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveComment(documentId, thread.commentId, currentUserId, currentUserName);
      onResolved();
    } catch {
      toast.error("Failed to resolve comment");
    } finally {
      setResolving(false);
    }
  };

  const handleReopen = async () => {
    try {
      await reopenComment(documentId, thread.commentId);
    } catch {
      toast.error("Failed to reopen comment");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(documentId, thread.commentId);
      onDeleted();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const isResolved = thread.status === "resolved";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={handleCardClick}
        className={`group cursor-pointer rounded-xl border transition-all duration-200 ${
          isActive
            ? "border-amber-300/60 bg-amber-50/60 shadow-[0_0_0_2px_rgba(251,191,36,0.15)]"
            : "border-border-soft bg-white hover:border-border hover:shadow-sm"
        }`}
      >
        <div className="p-4">
          {/* Author + time */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Avatar name={thread.authorName} avatar={thread.authorAvatar} size={28} />
              <div>
                <p className="text-[13px] font-semibold text-foreground">{thread.authorName}</p>
                <p className="text-[11px] text-muted-foreground/70">{formatTime(thread.createdAt)}</p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!isResolved && canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleResolve(); }}
                  title="Resolve"
                  disabled={resolving}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <CheckCircle2 size={14} />
                </button>
              )}
              {isResolved && canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleReopen(); }}
                  title="Reopen"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                  title="Delete"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Selected text preview */}
          {thread.selectedText && (
            <div className="mt-2.5 rounded-lg border-l-2 border-amber-300 bg-amber-50/50 px-2.5 py-1.5">
              <p className="line-clamp-1 text-[11.5px] italic text-amber-800/70">
                "{thread.selectedText}"
              </p>
            </div>
          )}

          {/* Comment message */}
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground">{thread.message}</p>

          {/* Resolved by badge */}
          {isResolved && thread.resolvedByName && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <p className="text-[11.5px] text-emerald-700">
                Resolved by <span className="font-semibold">{thread.resolvedByName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Replies */}
        {thread.replies && thread.replies.length > 0 && (
          <div className="border-t border-border-soft/60 px-4 py-3 space-y-3">
            {thread.replies.map((reply) => (
              <ReplyRow key={reply.replyId} reply={reply} />
            ))}
          </div>
        )}

        {/* Footer: reply button */}
        {!isResolved && (
          <div
            className="border-t border-border-soft/60 px-4 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {showReplyInput ? (
              <div className="space-y-2">
                <MentionTextarea
                  autoFocus
                  value={replyText}
                  onChange={setReplyText}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
                    if (e.key === "Escape") setShowReplyInput(false);
                  }}
                  placeholder="Reply… (type @ to mention)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border-soft bg-surface-muted/60 px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-all"
                  collaborators={collaborators}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowReplyInput(false)}
                    className="rounded-md px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying}
                    className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[12px] font-medium text-white disabled:opacity-40"
                  >
                    {replying ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send size={11} />
                    )}
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReplyInput(true)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle size={13} />
                {thread.replies && thread.replies.length > 0
                  ? `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}`
                  : "Reply"}
              </button>
            )}
          </div>
        )}
      </motion.div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Comment?"
        description="This action cannot be undone. The comment and all its replies will be permanently deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

function ReplyRow({ reply }: { reply: CommentReply }) {
  return (
    <div className="flex gap-2.5">
      <Avatar name={reply.authorName} avatar={reply.authorAvatar} size={22} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold text-foreground">{reply.authorName}</span>
          <span className="text-[10.5px] text-muted-foreground/60">{formatTime(reply.createdAt)}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed text-foreground/85">{reply.message}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   COMMENTS SIDEBAR
────────────────────────────────────────────────────────────── */

export function CommentsSidebar({
  isOpen,
  onClose,
  documentId,
  threads,
  loading,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  userRole,
  activeCommentId,
  onActivateComment,
  onScrollToMark,
  onResolveComment,
  collaborators,
}: {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  threads: CommentThread[];
  loading: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  userRole: string | null;
  activeCommentId: string | null;
  onActivateComment: (id: string | null) => void;
  onScrollToMark: (commentId: string) => void;
  onResolveComment?: (commentId: string) => void;
  collaborators?: Collaborator[];
}) {
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const canManage = userRole === "owner" || userRole === "editor" || userRole === "commenter";

  const openThreads = threads.filter((t) => t.status === "open");
  const resolvedThreads = threads.filter((t) => t.status === "resolved");
  const displayed = tab === "open" ? openThreads : resolvedThreads;

  // Auto-switch tab when an active comment is in the resolved list
  useEffect(() => {
    if (activeCommentId) {
      const inResolved = resolvedThreads.some((t) => t.commentId === activeCommentId);
      if (inResolved) setTab("resolved");
    }
  }, [activeCommentId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Soft backdrop — does NOT block editing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/5 pointer-events-none"
          />

          {/* Sidebar panel */}
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
                <MessageSquare size={17} className="text-primary" strokeWidth={1.8} />
                <h2 className="font-display text-[16px] font-semibold tracking-tight text-foreground">
                  Comments
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X size={17} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 border-b border-border-soft">
              {(["open", "resolved"] as const).map((t) => {
                const count = t === "open" ? openThreads.length : resolvedThreads.length;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-[13px] font-medium transition-colors ${
                      tab === t
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="capitalize">{t}</span>
                    <span
                      className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                        tab === t
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-4">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : displayed.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-48 flex-col items-center justify-center gap-3 text-center"
                >
                  {tab === "open" ? (
                    <>
                      <MessageSquare size={32} className="text-muted-foreground/20" strokeWidth={1.2} />
                      <div>
                        <p className="text-[14px] font-medium text-foreground/70">No open comments</p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground/60">
                          Select text and click{" "}
                          <span className="font-semibold">💬 Add Comment</span> to start a discussion.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={32} className="text-muted-foreground/20" strokeWidth={1.2} />
                      <div>
                        <p className="text-[14px] font-medium text-foreground/70">No resolved comments</p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground/60">
                          Resolved discussions will appear here.
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {displayed.map((thread) => (
                      <CommentCard
                        key={thread.commentId}
                        thread={thread}
                        documentId={documentId}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserAvatar={currentUserAvatar}
                        canManage={canManage}
                        isActive={activeCommentId === thread.commentId}
                        onActivate={() => onActivateComment(thread.commentId)}
                        onResolved={() => {
                          onResolveComment?.(thread.commentId);
                          // Switch to resolved tab after resolve animation
                          setTimeout(() => setTab("resolved"), 400);
                        }}
                        onDeleted={() => {
                          if (activeCommentId === thread.commentId) onActivateComment(null);
                        }}
                        onScrollToMark={onScrollToMark}
                        collaborators={collaborators}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
