import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo, forwardRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { ResizableImage } from "@/components/editor/extensions/resizable-image";
import { ImageUpload, triggerImageUpload } from "@/components/editor/extensions/image-upload";
import { Table as TableExt } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Highlight } from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import FontFamily from "@tiptap/extension-font-family";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import * as Popover from "@radix-ui/react-popover";
import { Indent } from "@/components/editor/extensions/indent";
import { PageBreak } from "@/components/editor/extensions/page-break";
import { CodeBlockComponent } from "@/components/editor/extensions/code-block";
import { EDITOR_FONTS, loadGoogleFont } from "@/lib/fonts";
import { SlashCommand, getSlashCommandConfig } from "@/components/editor/slash-command";
import { getDocument, updateDocument, deleteDocument, createDocument } from "@/firebase/firestore/documents";
import { toggleFavorite } from "@/firebase/firestore/favorites";
import { FileBrowserModal } from "@/components/editor/file-browser-modal";
import { createVersionSnapshot } from "@/firebase/firestore/versions";
import { VersionHistorySidebar } from "@/components/editor/version-history-sidebar";
import CharacterCount from "@tiptap/extension-character-count";
import { exportToDocx, exportToHtml, exportToTxt, exportToPdf, importDocx, importTxt } from "@/components/editor/import-export";
import { AskAISidebar } from "@/components/editor/ask-ai-sidebar";
import { SelectionAIOverlay, type AIStateSnapshot } from "@/components/editor/selection-ai-overlay";
import { AIPreviewCard } from "@/components/editor/ai-preview-card";
import { OutlinePopover } from "@/components/editor/outline-popover";
import { ShareModal, getInitials } from "@/components/editor/share-modal";
import { getCollaborators, type PermissionData, type Role } from "@/firebase/firestore/sharing";
import { logSharedDocumentAccess } from "@/firebase/firestore/shared_access";
import { Lock } from "lucide-react";
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { getCollabProvider, releaseCollabProvider } from "@/lib/collaboration";
import { FontSize } from "@/components/editor/extensions/font-size";
import { TextFormattingToolbar, CommenterToolbar } from "@/components/editor/text-formatting-toolbar";
import { useEditorTypography, UnifiedFontFamilyDropdown, UnifiedFontSizeDropdown, UnifiedFontSizeControl } from "@/components/editor/typography-controls";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { ReadModeView } from "@/components/editor/read-mode-view";
import { CommentMark, applyCommentMark, removeCommentMark, scrollEditorToComment } from "@/components/editor/extensions/comment-mark";
import { CommentsSidebar } from "@/components/editor/comments-sidebar";
import { CommentPopup } from "@/components/editor/comment-popup";
import { createComment, subscribeToComments, type CommentThread } from "@/firebase/firestore/comments";
import React from "react";

const lowlight = createLowlight(common);

import {
  FileText,
  Star,
  Cloud,
  CloudUpload,
  Check,
  CheckCircle2,
  History,
  MessageSquare,
  Share2,
  Sparkles,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Undo2,
  Redo2,
  SpellCheck,
  Link2,
  LayoutTemplate,
  Image as ImageIcon,
  ListChecks,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent as IndentIcon,
  Outdent,
  ChevronDown,
  ChevronUp,
  Palette,
  Minus,
  MessageCirclePlus,
  FilePlus,
  FolderOpen,
  Download,
  Pencil,
  Trash2,
  Save,
  Type,
  Eye,
  Maximize,
  Table as TableIcon,
  Code,
  Quote,
  Eraser,
  Calculator,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  Strikethrough,
  Code2,
  Columns3,
  Rows3,
  TableProperties,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ExternalLink,
  X,
  SplitSquareHorizontal,
  BookOpen,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import colliqLogo from "@/assets/landing/colliq-logo.png";

class ReadModeErrorBoundary extends React.Component<{children: React.ReactNode, onClose: () => void}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode, onClose: () => void}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("ReadMode crashed:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#EFEBE4]">
          <p className="text-muted-foreground mb-4">Read Mode encountered an error rendering the document.</p>
          <button onClick={this.props.onClose} className="px-4 py-2 bg-white rounded-md shadow">Return to Editor</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/editor/$documentId")({
  head: () => ({
    meta: [
      { title: "Editor — Colliq" },
      { name: "description", content: "Write, edit, and collaborate in Colliq." },
    ],
  }),
  component: EditorPage,
});

export type ActiveUser = {
  id: string;
  name: string;
  avatar: string | null;
  color: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline" | "reconnecting";

function EditorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { documentId } = Route.useParams();

  const [isDocLoading, setIsDocLoading] = useState(true);
  const [editorReady, setEditorReady] = useState(false);

  const [title, setTitle] = useState("Untitled document");
  const [favorite, setFavorite] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [chromeCollapsed, setChromeCollapsed] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [pageMode, setPageMode] = useState(true);
  const [pageWidth, setPageWidth] = useState<"narrow" | "standard" | "wide">("standard");
  const [marginState, setMarginState] = useState<"normal" | "narrow" | "moderate" | "wide" | "custom">("normal");
  const [customMargins, setCustomMargins] = useState({ top: 96, bottom: 96, left: 96, right: 96 });
  const [wordCountOpen, setWordCountOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isReadMode, setIsReadMode] = useState(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<PermissionData[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userRole, setUserRole] = useState<Role | "unauthorized" | null>(null);
  const [documentObj, setDocumentObj] = useState<any>(null);
  const [selectionAIState, setSelectionAIState] = useState<{ isOpen: boolean; snapshot: AIStateSnapshot | null }>({ isOpen: false, snapshot: null });
  const [summaryPreviewState, setSummaryPreviewState] = useState({ isOpen: false, title: "", content: "", insertAt: 0, isLoading: false });
  const [outlinePopoverState, setOutlinePopoverState] = useState({ isOpen: false, insertAt: 0, documentContext: "" });

  // ── Comment state ──────────────────────────────────────────────────────────
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentPopup, setCommentPopup] = useState<{
    isOpen: boolean;
    selectedText: string;
    anchorRect: DOMRect | null;
    from: number;
    to: number;
  }>({ isOpen: false, selectedText: "", anchorRect: null, from: 0, to: 0 });
  // Track previous comment count for new-comment notifications
  const prevCommentCountRef = useRef(0);
  const prevCommentIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a stable ref to the editor for the slash command config (avoids stale closure)
  const editorRef = useRef<any>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // --- AI Controller (stable across renders) ---
  const aiController = useMemo(() => ({
    openSelectionAI: (snapshot: AIStateSnapshot) =>
      setSelectionAIState({ isOpen: true, snapshot }),
    openSummaryPreview: (state: { title: string; content: string; insertAt: number; isLoading: boolean }) =>
      setSummaryPreviewState({ isOpen: true, ...state }),
    closeSummaryPreview: () =>
      setSummaryPreviewState(s => ({ ...s, isOpen: false })),
    openOutlinePopover: ({ insertAt, documentContext }: { insertAt: number; documentContext: string }) =>
      setOutlinePopoverState({ isOpen: true, insertAt, documentContext }),
  }), []);

  // --- Yjs collaboration setup ---
  // useMemo is SSR-safe now: collaboration.ts returns a non-cached doc on the server.
  // We pass `false` to initially NOT connect, until user role is confirmed.
  const { doc: ydoc, provider } = useMemo(() => getCollabProvider(documentId, false), [documentId]);

  // Tracks whether this user has been granted access (role resolved from Firestore)
  const [accessGranted, setAccessGranted] = useState(false);
  const firestoreContentRef = useRef<any>(null); // Raw Firestore JSON content
  const contentSeededRef = useRef(false);        // Guard: seed editor exactly once

  const editor = useEditor({
    editable: false, // Unlocked after role + seeding completes
    extensions: [
      // Disable StarterKit history — Collaboration extension provides Yjs-backed undo
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        history: false,
      } as any),
      // Collaboration must be registered before any extension that mutates the document
      Collaboration.configure({ document: ydoc }),
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.displayName || user?.email || "Anonymous",
            color: (() => {
              if (!user) return "#f87171";
              const colors = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"];
              const charCodeSum = user.uid.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
              return colors[charCodeSum % colors.length];
            })(),
          },
          selectionRender: (user) => {
            return {
              class: 'collaboration-cursor__selection',
              style: `background-color: ${user.color}40`,
            };
          }
        })
      ] : []),
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline underline-offset-2 transition-colors hover:text-primary-soft cursor-pointer" },
      }),
      Placeholder.configure({ placeholder: "Start writing, or press '/' for commands…" }),
      TaskList.configure({ HTMLAttributes: { class: "not-prose pl-2" } }),
      TaskItem.configure({ nested: true }),
      ResizableImage,
      ImageUpload,
      TableExt.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      CodeBlockLowlight.extend({
        addNodeView() { return ReactNodeViewRenderer(CodeBlockComponent); },
      }).configure({ lowlight }),
      Indent,
      PageBreak,
      CharacterCount,
      CommentMark,
      SlashCommand.configure({
        suggestion: getSlashCommandConfig(editorRef, aiController),
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "colliq-prose focus:outline-none min-h-[1000px] px-[96px] py-[96px] text-[15.5px] leading-[1.75] text-foreground",
      },
    },
    onCreate: ({ editor }) => { editorRef.current = editor; },
    onUpdate: ({ editor }) => {
      editorRef.current = editor;
      if (!editor.isEditable) return; // Don't save during hydration
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateDocument(documentId, { content: editor.getJSON() });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      }, 5000);
    },
  });

  // ── Effect 1: Fetch document + resolve permissions ────────────────────────
  // Does NOT depend on `editor` — fires as soon as auth resolves.
  useEffect(() => {
    if (!user || loading) return;
    let isMounted = true;

    getDocument(documentId).then(async doc => {
      if (!isMounted) return;
      if (!doc) { navigate({ to: "/workspace" }); return; }

      setDocumentObj(doc);

      // Store content for seeding (Effect 2 reads this ref)
      if (doc.content && Object.keys(doc.content).length > 0) {
        firestoreContentRef.current = doc.content;
      }

      const isOwner = user.uid === doc.ownerId;
      console.log(`[editor] doc loaded — isOwner=${isOwner}, shareMode=${doc.shareMode}, linkRole=${doc.linkRole}`);

      if (isOwner) {
        setUserRole("owner");
        setTitle(doc.title);
        setFavorite(doc.favorite);
        setIsDocLoading(false);
        setAccessGranted(true); // Triggers Effect 2
        return;
      }

      // Non-owner: resolve role from collaborators list
      const collabs = await getCollaborators(documentId);
      if (!isMounted) return;
      setCollaborators(collabs);

      let computedRole: Role | "unauthorized" = "unauthorized";
      const collab = collabs.find(c => c.userId === user.uid);
      if (collab) {
        computedRole = collab.role;
        console.log(`[editor] collaborator role: ${computedRole}`);
      } else if (doc.shareMode === "anyone_with_link") {
        computedRole = doc.linkRole as Role;
        console.log(`[editor] link sharing → role: ${computedRole}`);
      } else {
        console.log(`[editor] access denied`);
      }

      setUserRole(computedRole);
      setIsDocLoading(false);

      if (computedRole !== "unauthorized") {
        setTitle(doc.title);
        setFavorite(doc.favorite);
        setAccessGranted(true); // Triggers Effect 2
        // Log access so this document appears in Workspace "Shared with you"
        const accessType = collab ? "invite" : "link";
        logSharedDocumentAccess(user.uid, documentId, computedRole, accessType).catch(
          (err) => console.warn("[shared_access] failed to log access", err)
        );
      }
    }).catch(err => {
      console.error("[editor] failed to load document", err);
      if (isMounted) navigate({ to: "/workspace" });
    });

    return () => { isMounted = false; };
  }, [documentId, user, loading, navigate]);

  // ── Effect 2: Seed content + enable editor ────────────────────────────────
  // Runs only after access is granted AND editor is mounted.
  // Waits for Yjs provider sync (online) or falls back after 2s (offline).
  useEffect(() => {
    if (!accessGranted || !editor || contentSeededRef.current) return;

    const doSeed = () => {
      if (contentSeededRef.current) return;
      contentSeededRef.current = true;

      if (firestoreContentRef.current && editor.isEmpty) {
        console.log('[collab] Seeding editor from Firestore content');
        editor.commands.setContent(firestoreContentRef.current, { emitUpdate: false });
      } else if (!editor.isEmpty) {
        console.log('[collab] Editor already has content from Yjs peers — skipping Firestore seed');
      } else {
        console.log('[collab] No Firestore content to seed (new document)');
      }

      setEditorReady(true);
    };

    // No provider (SSR fallback or provider not initialized): seed immediately
    if (!provider) {
      doSeed();
      return;
    }

    // If provider is already synced (fast reconnect or same-tab reuse): seed now
    if ((provider as any).synced) {
      doSeed();
      return;
    }

    // Online: wait for sync event
    const handleSync = (isSynced: boolean) => { if (isSynced) doSeed(); };
    provider.on('sync', handleSync);

    // Offline fallback: seed from Firestore after 2s if sync never arrives
    const offlineFallback = setTimeout(() => {
      console.log('[collab] Offline fallback — seeding from Firestore after timeout');
      doSeed();
    }, 2000);

    return () => {
      provider.off('sync', handleSync);
      clearTimeout(offlineFallback);
    };
  }, [accessGranted, editor, provider]);

  // ── Track Provider Connection Status ──────────────────────────────────────
  useEffect(() => {
    if (!provider) return;

    const handleStatus = (event: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      if (event.status === 'disconnected') {
        setSaveStatus("offline");
      } else if (event.status === 'connecting') {
        setSaveStatus("reconnecting");
      } else if (event.status === 'connected') {
        // Only set to saved if we were offline/reconnecting,
        // otherwise let the save timer manage it.
        setSaveStatus((prev) => 
          (prev === "offline" || prev === "reconnecting") ? "saved" : prev
        );
      }
    };

    provider.on('status', handleStatus);
    
    // Check initial state
    if (provider.wsconnected) {
      // it's connected, saveStatus is likely default "saved"
    } else {
      setSaveStatus("reconnecting");
    }

    return () => {
      provider.off('status', handleStatus);
    };
  }, [provider]);

  // ── Track Provider Awareness (Active Users) ─────────────────────────────
  useEffect(() => {
    if (!provider || !user) return;

    const awareness = provider.awareness;
    
    // Assign a deterministic color based on the user's ID
    const colors = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"];
    const charCodeSum = user.uid.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
    const color = colors[charCodeSum % colors.length];

    awareness.setLocalStateField('user', {
      id: user.uid,
      name: user.displayName || user.email || "Anonymous",
      avatar: user.photoURL || null,
      color,
    });

    const updateActiveUsers = () => {
      const states = Array.from(awareness.getStates().values());
      const usersMap = new Map<string, ActiveUser>();
      
      states.forEach((state: any) => {
        if (state.user && state.user.id) {
          if (state.user.id !== user.uid) {
            usersMap.set(state.user.id, state.user as ActiveUser);
          }
        }
      });
      
      setActiveUsers(Array.from(usersMap.values()));
    };

    awareness.on('change', updateActiveUsers);
    updateActiveUsers(); // Initial fetch

    return () => {
      awareness.off('change', updateActiveUsers);
    };
  }, [provider, user]);

  // ── Cleanup provider on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => releaseCollabProvider(documentId);
  }, [documentId]);

  // ── Cleanup save timer on unmount ─────────────────────────────────────────
  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // ── Enable/disable editing based on role ──────────────────────────────────
  useEffect(() => {
    if (editorReady && editor && userRole !== "unauthorized") {
      editor.setEditable(userRole === "owner" || userRole === "editor");
    }
    
    // Connect WebSocket if authorized
    if (provider && userRole && userRole !== "unauthorized") {
      provider.connect();
    }
  }, [editorReady, editor, userRole, provider]);

  // ── Real-time comments subscription ───────────────────────────────────────
  useEffect(() => {
    if (!accessGranted) return;
    setCommentsLoading(true);
    const unsub = subscribeToComments(
      documentId,
      (threads) => {
        setCommentThreads(threads);
        setCommentsLoading(false);

        // Phase 12: Toast for NEW open comments from OTHER users
        const newIds = new Set(threads.map((t) => t.commentId));
        const prevIds = prevCommentIdsRef.current;
        const newOpenFromOthers = threads.filter(
          (t) =>
            t.status === "open" &&
            !prevIds.has(t.commentId) &&
            t.authorId !== user?.uid
        );
        if (newOpenFromOthers.length > 0 && prevIds.size > 0) {
          newOpenFromOthers.forEach((t) => {
            toast(`${t.authorName} commented`, {
              description: t.message.slice(0, 80),
              action: {
                label: "View",
                onClick: () => {
                  setIsCommentsSidebarOpen(true);
                  setActiveCommentId(t.commentId);
                  if (editor) scrollEditorToComment(editor, t.commentId);
                },
              },
            });
          });
        }
        prevCommentIdsRef.current = newIds;
      },
      (error) => {
        console.error("Comments subscription error:", error);
        toast.error(`Failed to load comments: ${error.message || String(error)}`);
        setCommentsLoading(false);
      }
    );
    return unsub;
  }, [accessGranted, documentId, user?.uid, editor]);

  // ── Click on comment mark → open sidebar + activate ──────────────────────
  useEffect(() => {
    if (!editor) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const markEl = target.closest(".comment-mark") as HTMLElement | null;
      if (!markEl) return;
      const commentId = markEl.getAttribute("data-comment-id");
      if (!commentId) return;
      setIsCommentsSidebarOpen(true);
      setActiveCommentId(commentId);
      // Highlight the mark as active
      document.querySelectorAll(".comment-mark.comment-mark--active").forEach((el) =>
        el.classList.remove("comment-mark--active")
      );
      document
        .querySelectorAll(`.comment-mark[data-comment-id="${commentId}"]`)
        .forEach((el) => el.classList.add("comment-mark--active"));
    };
    const editorEl = editor.view.dom;
    editorEl.addEventListener("click", handleClick);
    return () => editorEl.removeEventListener("click", handleClick);
  }, [editor]);

  // ── Sync resolved marks: remove marks for resolved threads ────────────────
  // When a thread becomes resolved, its mark is removed in onResolveComment.
  // When reopened, the Firestore snapshot fires and we keep the existing mark
  // (it was never removed for reopened threads) — no extra action needed.
  // This effect also handles cleanup if marks exist for threads that were
  // deleted externally (another user deleted a thread this user didn't close).
  useEffect(() => {
    if (!editor || commentThreads.length === 0) return;
    const resolvedIds = new Set(
      commentThreads.filter((t) => t.status === "resolved").map((t) => t.commentId)
    );
    resolvedIds.forEach((id) => removeCommentMark(editor, id));
  }, [commentThreads, editor]);

  // ── Apply margin/padding to editor ───────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    let padding = { top: 96, right: 96, bottom: 96, left: 96 };
    if (marginState === "narrow")   padding = { top: 48, right: 48, bottom: 48, left: 48 };
    if (marginState === "moderate") padding = { top: 96, right: 72, bottom: 96, left: 72 };
    if (marginState === "wide")     padding = { top: 96, right: 192, bottom: 96, left: 192 };
    if (marginState === "custom")   padding = customMargins;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: "colliq-prose focus:outline-none min-h-[1056px] text-[15.5px] leading-[1.75] text-foreground",
          style: `padding: ${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px;`,
        },
      },
    });
  }, [editor, marginState, customMargins]);



  if (loading || !user || isDocLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F2F5]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }


  if (userRole === "unauthorized") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F1F2F5] px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border">
          <Lock className="text-muted-foreground" size={28} />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="mb-6 max-w-sm text-[15px] text-muted-foreground">
          You don't have permission to access this document. Please request access from the owner.
        </p>
        <button
          onClick={() => navigate({ to: "/workspace" })}
          className="rounded-xl bg-primary px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-primary/90"
        >
          Return to Workspace
        </button>
      </main>
    );
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus("saving");
    updateDocument(documentId, { title: newTitle })
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  };

  const handleFavoriteToggle = (newFav: boolean) => {
    setFavorite(newFav);
    toggleFavorite(documentId, newFav);
  };

  const handleNew = async () => {
    const newId = await createDocument(user.uid);
    navigate({ to: "/editor/$documentId", params: { documentId: newId } });
  };

  const handleRename = () => {
    document.getElementById("document-title-button")?.click();
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDocument(documentId);
      toast.success("Document deleted");
      navigate({ to: "/workspace" });
    } catch (e) {
      toast.error("Failed to delete document");
    }
  };

  const openCommentPopup = (e?: React.MouseEvent) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    
    let anchorRect = null;
    if (e && e.currentTarget) {
      anchorRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    } else {
      // Fallback to text selection rect
      const domSelection = window.getSelection();
      anchorRect = domSelection && domSelection.rangeCount > 0
        ? domSelection.getRangeAt(0).getBoundingClientRect()
        : null;
    }
    
    setCommentPopup({ isOpen: true, selectedText, anchorRect, from, to });
  };

  const handleSubmitComment = async (message: string) => {
    if (!editor || !user) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    // Apply a temporary mark immediately (optimistic UI)
    applyCommentMark(editor, tempId, commentPopup.from, commentPopup.to);
    setCommentPopup((p) => ({ ...p, isOpen: false }));
    try {
      const saved = await createComment({
        documentId,
        selectedText: commentPopup.selectedText,
        authorId: user.uid,
        authorName: user.displayName || user.email || "Anonymous",
        authorAvatar: user.photoURL || "",
        message,
      });
      // Replace temp mark with the real Firestore commentId
      removeCommentMark(editor, tempId);
      applyCommentMark(editor, saved.commentId, commentPopup.from, commentPopup.to);
      setIsCommentsSidebarOpen(true);
    } catch (err: any) {
      console.error(err);
      removeCommentMark(editor, tempId);
      toast.error(`Failed to post comment: ${err.message || String(err)}`);
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await updateDocument(documentId, { content: editor.getJSON() });
      await createVersionSnapshot(documentId, title, editor.getJSON(), "Manual save by user");
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("error");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    if (file.name.endsWith(".docx")) {
      await importDocx(file, editor);
    } else if (file.name.endsWith(".txt")) {
      await importTxt(file, editor);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F1F2F5] text-foreground">
      <AnimatePresence initial={false}>
        {!chromeCollapsed && (
          <motion.div
            key="chrome"
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-40"
          >
            <TopHeader
              user={user}
              title={title}
              setTitle={handleTitleChange}
              favorite={favorite}
              setFavorite={handleFavoriteToggle}
              saveStatus={saveStatus}
              onReadMode={() => setIsReadMode(true)}
              onVersionHistory={() => setVersionHistoryOpen(true)}
              onAskAI={() => setIsAskAIOpen(true)}
              onShare={() => setShareModalOpen(true)}
              onComments={() => setIsCommentsSidebarOpen((o) => !o)}
              isCommentsSidebarOpen={isCommentsSidebarOpen}
              commentCount={commentThreads.filter((t) => t.status === "open").length}
              userRole={userRole}
              activeUsers={activeUsers}
            />
            {(userRole === "owner" || userRole === "editor") && (
              <MenuBar 
                editor={editor}
                onNewDocument={handleNew}
                onRenameDocument={handleRename}
                onDeleteDocument={handleDelete}
                onSaveDocument={handleSave}
                onOpenDocument={() => setFileBrowserOpen(true)}
                onVersionHistory={() => setVersionHistoryOpen(true)}
                onSetPageWidth={setPageWidth}
                onTogglePageMode={() => setPageMode((p) => !p)}
                onWordCount={() => setWordCountOpen(true)}
                onImport={() => fileInputRef.current?.click()}
                marginState={marginState}
                onSetMarginState={setMarginState}
                onReadMode={() => setIsReadMode(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt" onChange={handleImportFile} />

      <FileBrowserModal isOpen={fileBrowserOpen} onClose={() => setFileBrowserOpen(false)} />
      <VersionHistorySidebar isOpen={versionHistoryOpen} onClose={() => setVersionHistoryOpen(false)} documentId={documentId} editor={editor} />
      
      {documentObj && (
        <ShareModal
          documentId={documentId}
          document={documentObj}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onUpdate={async () => {
            const collabs = await getCollaborators(documentId);
            setCollaborators(collabs);
          }}
        />
      )}
      <AskAISidebar isOpen={isAskAIOpen} onClose={() => setIsAskAIOpen(false)} editor={editor} />
      <SelectionAIOverlay 
        editor={editor} 
        isOpen={selectionAIState.isOpen} 
        snapshot={selectionAIState.snapshot} 
        onClose={() => setSelectionAIState({ isOpen: false, snapshot: null })} 
      />
      <AIPreviewCard
        editor={editor}
        isOpen={summaryPreviewState.isOpen}
        isLoading={summaryPreviewState.isLoading}
        title={summaryPreviewState.title}
        content={summaryPreviewState.content}
        insertAt={summaryPreviewState.insertAt}
        onClose={() => setSummaryPreviewState(s => ({ ...s, isOpen: false }))}
      />
      <OutlinePopover
        editor={editor}
        isOpen={outlinePopoverState.isOpen}
        insertAt={outlinePopoverState.insertAt}
        documentContext={outlinePopoverState.documentContext}
        onClose={() => setOutlinePopoverState(s => ({ ...s, isOpen: false }))}
      />
      {wordCountOpen && <WordCountModal editor={editor} onClose={() => setWordCountOpen(false)} />}

      <Toolbar
        editor={editor}
        zoom={zoom}
        setZoom={setZoom}
        collapsed={chromeCollapsed}
        onToggleCollapse={() => setChromeCollapsed((c) => !c)}
      />

      {pageMode && <Ruler />}

      <DocumentCanvas 
        zoom={zoom} 
        pageMode={pageMode} 
        pageWidth={pageWidth}
        marginState={marginState}
        customMargins={customMargins}
      >
        <EditorContent editor={editor} />
        {editor && userRole !== "viewer" && userRole !== "commenter" && (
          <TextFormattingToolbar 
            editor={editor} 
            onOpenAI={() => {
              if (!editor) return;
              const { from, to } = editor.state.selection;
              setSelectionAIState({
                isOpen: true,
                snapshot: {
                  from,
                  to,
                  selectedText: editor.state.doc.textBetween(from, to),
                  documentContext: editor.getText()
                }
              });
            }}
            onAddComment={openCommentPopup}
          />
        )}
        {/* Commenter role: minimal toolbar with only Add Comment */}
        {editor && userRole === "commenter" && (
          <CommenterToolbar editor={editor} onAddComment={openCommentPopup} />
        )}
        {editor && userRole !== "viewer" && userRole !== "commenter" && <LinkBubbleMenu editor={editor} />}
        {editor && userRole !== "viewer" && userRole !== "commenter" && <TableBubbleMenu editor={editor} />}
      </DocumentCanvas>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        description="Are you sure you want to permanently delete this document? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <EditorStyles />

      {isReadMode && editor && (
        <ReadModeErrorBoundary onClose={() => setIsReadMode(false)}>
          <ReadModeView editor={editor} onClose={() => setIsReadMode(false)} />
        </ReadModeErrorBoundary>
      )}

      {/* ── Comments Sidebar ───────────────────────────────────── */}
      <CommentsSidebar
        isOpen={isCommentsSidebarOpen}
        onClose={() => setIsCommentsSidebarOpen(false)}
        documentId={documentId}
        threads={commentThreads}
        loading={commentsLoading}
        currentUserId={user.uid}
        currentUserName={user.displayName || user.email || "Anonymous"}
        currentUserAvatar={user.photoURL || ""}
        userRole={userRole}
        activeCommentId={activeCommentId}
        onResolveComment={(commentId) => {
          // Phase 7: remove the highlight mark from the editor
          if (editor) removeCommentMark(editor, commentId);
        }}
        onActivateComment={(id) => {
          setActiveCommentId(id);
          // Highlight active mark in editor
          document.querySelectorAll(".comment-mark.comment-mark--active").forEach((el) =>
            el.classList.remove("comment-mark--active")
          );
          if (id) {
            document
              .querySelectorAll(`.comment-mark[data-comment-id="${id}"]`)
              .forEach((el) => el.classList.add("comment-mark--active"));
            if (editor) scrollEditorToComment(editor, id);
          }
        }}
        onScrollToMark={(commentId) => {
          if (editor) scrollEditorToComment(editor, commentId);
        }}
        collaborators={collaborators.map((c) => ({
          id: c.userId,
          name: c.name || c.email || "User",
          avatar: c.avatar || undefined,
        }))}
      />

      {/* ── Comment Creation Popup ──────────────────────────────── */}
      <CommentPopup
        isOpen={commentPopup.isOpen}
        selectedText={commentPopup.selectedText}
        anchorRect={commentPopup.anchorRect}
        onSubmit={handleSubmitComment}
        onCancel={() => setCommentPopup((p) => ({ ...p, isOpen: false }))}
      />

      {/* ── Floating Ask AI Button ────────────────────────────────── */}
      <AnimatePresence>
        {!isAskAIOpen && userRole !== "viewer" && userRole !== "commenter" && (
          <motion.button
            key="ask-ai-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsAskAIOpen(true)}
            title="Open Colliq AI"
            className="fixed bottom-7 right-7 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-[0_4px_24px_-4px_rgba(80,60,200,0.55),0_0_0_0_rgba(80,60,200,0.3)] hover:shadow-[0_6px_32px_-4px_rgba(80,60,200,0.65),0_0_0_0_rgba(80,60,200,0.4)] transition-shadow duration-300"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <Sparkles size={22} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   TOP HEADER
============================================================ */
function TopHeader({
  user,
  title,
  setTitle,
  favorite,
  setFavorite,
  saveStatus,
  onReadMode,
  onVersionHistory,
  onAskAI,
  onShare,
  onComments,
  isCommentsSidebarOpen,
  commentCount,
  userRole,
  activeUsers,
}: {
  user: any;
  title: string;
  setTitle: (t: string) => void;
  favorite: boolean;
  setFavorite: (v: boolean) => void;
  saveStatus: SaveStatus;
  onReadMode: () => void;
  onVersionHistory?: () => void;
  onAskAI: () => void;
  onShare: () => void;
  onComments: () => void;
  isCommentsSidebarOpen: boolean;
  commentCount: number;
  userRole: Role | "unauthorized" | null;
  activeUsers: ActiveUser[];
}) {
  const initials = (user.displayName || user.email || "U").trim().slice(0, 1).toUpperCase();

  return (
    <header className="border-b border-border-soft bg-[#FAFAFA]/95 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-2.5">
        {/* Left: logo + doc icon + title */}
        <Link
          to="/workspace"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-surface-muted"
          aria-label="Back to workspace"
        >
          <img src={colliqLogo} alt="" className="h-7 w-7 object-contain" />
        </Link>

        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <FileText size={18} strokeWidth={1.7} />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <TitleInput value={title} onChange={setTitle} />

          <button
            onClick={() => setFavorite(!favorite)}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Favorite"
          >
            <Star
              size={16}
              strokeWidth={1.7}
              className={favorite ? "fill-[var(--accent-warm)] text-[var(--accent-warm)]" : ""}
            />
          </button>

          <SaveStatusPill status={saveStatus} />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReadMode}
            title="Read Mode"
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-foreground/75 transition-all hover:bg-surface-muted hover:text-foreground"
          >
            <BookOpen size={14} strokeWidth={1.8} />
            <span className="hidden lg:inline">Read Mode</span>
          </button>
          
          <div className="mx-1 h-4 w-px bg-border-soft" />
          
          {/* Permission Indicator */}
          {userRole && userRole !== "unauthorized" && (
            <div className="flex h-9 items-center px-3 text-[12.5px] font-medium text-foreground/75 bg-surface-muted/50 rounded-full">
              {userRole === "owner" || userRole === "editor" ? "Editing" : userRole === "commenter" ? "Commenting" : "Viewing"}
            </div>
          )}

          <HeaderBtn icon={History} label="Version history" onClick={onVersionHistory} />
          <div className="relative">
            <HeaderBtn
              icon={MessageSquare}
              label="Comments"
              onClick={onComments}
              isActive={isCommentsSidebarOpen}
            />
            {commentCount > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            )}
          </div>
          {userRole !== "viewer" && userRole !== "commenter" && (
            <HeaderBtn icon={Sparkles} label="Ask AI" highlighted onClick={onAskAI} />
          )}
          
          <div className="mx-1 h-4 w-px bg-border-soft" />
          
          {/* Active Users (Presence) Avatars */}
          {activeUsers.length > 0 && (
            <div className="mr-2 flex items-center gap-2">
              <div className="flex -space-x-2" title={`${activeUsers.length} collaborator${activeUsers.length > 1 ? 's' : ''} online`}>
                {activeUsers.slice(0, 4).map(c => (
                  <div key={c.id} className="z-10 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white text-xs font-semibold shadow-sm" style={{ backgroundColor: c.color + '40', color: c.color }}>
                    {c.avatar ? <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" /> : getInitials(c.name)}
                  </div>
                ))}
                {activeUsers.length > 4 && (
                  <div className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-surface-muted text-[10px] font-semibold text-muted-foreground shadow-sm">
                    +{activeUsers.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}

          <button onClick={onShare} className="ml-1 flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-medium text-white shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-all hover:bg-[color-mix(in_oklab,var(--primary)_92%,black)] active:scale-[0.98]">
            <Share2 size={14} strokeWidth={2} />
            Share
          </button>
          <div className="ml-1.5 grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-[var(--accent-violet)] text-[12.5px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(80,60,200,0.4)]">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function TitleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setTempValue(value);
      setTimeout(() => ref.current?.select(), 0);
    }
  }, [editing, value]);

  if (editing) {
    return (
      <input
        ref={ref}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          if (tempValue.trim()) onChange(tempValue.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (tempValue.trim()) onChange(tempValue.trim());
            setEditing(false);
          }
          if (e.key === "Escape") {
            setEditing(false);
          }
        }}
        className="min-w-[120px] max-w-[300px] flex-1 rounded-md bg-primary-soft/60 px-2 py-1 font-display text-[15.5px] font-medium text-foreground outline-none ring-2 ring-primary/30"
      />
    );
  }

  return (
    <button
      id="document-title-button"
      onClick={() => setEditing(true)}
      className="min-w-0 max-w-[300px] truncate rounded-md px-2 py-1 text-left font-display text-[15.5px] font-medium text-foreground transition-colors hover:bg-surface-muted"
    >
      {value}
    </button>
  );
}

function SaveStatusPill({ status }: { status: SaveStatus }) {
  const isSaving = status === "saving";
  const isOffline = status === "offline";
  const isReconnecting = status === "reconnecting";
  const isError = status === "error";

  return (
    <div className="ml-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] text-muted-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1.5"
          >
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <CloudUpload size={13} strokeWidth={1.8} className="text-primary" />
            </motion.span>
            <span>Saving…</span>
          </motion.div>
        ) : isOffline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1.5 text-amber-600/90"
          >
            <WifiOff size={13} strokeWidth={1.8} />
            <span>Offline</span>
          </motion.div>
        ) : isReconnecting ? (
          <motion.div
            key="reconnecting"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1.5 text-amber-600/90"
          >
            <RefreshCw size={13} strokeWidth={1.8} className="animate-spin" />
            <span>Reconnecting…</span>
          </motion.div>
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1.5 text-red-600/90"
          >
            <AlertCircle size={13} strokeWidth={1.8} />
            <span>Save error</span>
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            className="flex items-center gap-1.5"
          >
            <Cloud size={13} strokeWidth={1.8} className="text-emerald-600/80" />
            <CheckCircle2 size={11} strokeWidth={2} className="-ml-1 text-emerald-600/80" />
            <span>Saved to cloud</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function HeaderBtn({
  icon: Icon,
  label,
  highlighted,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  highlighted?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-all ${
        highlighted
          ? "bg-gradient-to-r from-[color-mix(in_oklab,var(--primary)_14%,white)] to-[color-mix(in_oklab,var(--accent-violet)_14%,white)] text-primary ring-1 ring-primary/15 hover:ring-primary/30"
          : isActive
          ? "bg-primary-soft text-primary"
          : "text-foreground/75 hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <Icon size={14} strokeWidth={1.8} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/* ============================================================
   MENU BAR
============================================================ */
type MenuItem = { label: string; icon: React.ComponentType<{ size?: number; className?: string }> };

const MENUS: Record<string, MenuItem[]> = {
  File: [
    { label: "New", icon: FilePlus },
    { label: "Open", icon: FolderOpen },
    { label: "Share", icon: Share2 },
    { label: "Rename", icon: Pencil },
    { label: "Delete", icon: Trash2 },
    { label: "Save", icon: Save },
    { label: "Version History", icon: History },
    { label: "Import DOCX/TXT", icon: FolderOpen },
    { label: "Download DOCX", icon: Download },
    { label: "Download PDF", icon: Download },
    { label: "Download HTML", icon: Download },
    { label: "Download TXT", icon: Download },
  ],
  Edit: [
    { label: "Undo", icon: Undo2 },
    { label: "Redo", icon: Redo2 },
    { label: "Select All", icon: Type },
    { label: "Delete", icon: Trash2 },
    { label: "Margins: Normal", icon: LayoutTemplate },
    { label: "Margins: Narrow", icon: LayoutTemplate },
    { label: "Margins: Moderate", icon: LayoutTemplate },
    { label: "Margins: Wide", icon: LayoutTemplate },
  ],
  View: [
    { label: "Read Mode", icon: BookOpen },
    { label: "Full screen", icon: Maximize },
    { label: "Page mode", icon: LayoutTemplate },
    { label: "Narrow width", icon: Eye },
    { label: "Standard width", icon: Eye },
    { label: "Wide width", icon: Eye },
  ],
  Insert: [
    { label: "Image", icon: ImageIcon },
    { label: "Table", icon: TableIcon },
    { label: "Link", icon: Link2 },
    { label: "Horizontal line", icon: Minus },
    { label: "Page break", icon: SplitSquareHorizontal },
    { label: "Code Block", icon: Code },
    { label: "Blockquote", icon: Quote },
  ],
  Format: [
    { label: "Bold", icon: Bold },
    { label: "Italic", icon: Italic },
    { label: "Underline", icon: UnderlineIcon },
    { label: "Strikethrough", icon: Strikethrough },
    { label: "Superscript", icon: SuperIcon },
    { label: "Subscript", icon: SubIcon },
    { label: "Code", icon: Code2 },
    { label: "Align Left", icon: AlignLeft },
    { label: "Align Center", icon: AlignCenter },
    { label: "Align Right", icon: AlignRight },
    { label: "Justify", icon: AlignJustify },
    { label: "Bullet List", icon: List },
    { label: "Numbered List", icon: ListOrdered },
    { label: "Checklist", icon: ListChecks },
    { label: "Clear Formatting", icon: Eraser },
  ],
  Tools: [
    { label: "Spelling & grammar", icon: SpellCheck },
    { label: "Word count", icon: Calculator },
  ],
};

function MenuBar({ 
  editor,
  onNewDocument,
  onRenameDocument,
  onDeleteDocument,
  onSaveDocument,
  onVersionHistory,
  onOpenDocument,
  onSetPageWidth,
  onTogglePageMode,
  onWordCount,
  onImport,
  marginState,
  onSetMarginState,
  onReadMode
}: { 
  editor: Editor | null;
  onNewDocument?: () => void;
  onRenameDocument?: () => void;
  onDeleteDocument?: () => void;
  onSaveDocument?: () => void;
  onVersionHistory?: () => void;
  onOpenDocument?: () => void;
  onSetPageWidth?: (width: "narrow" | "standard" | "wide") => void;
  onTogglePageMode?: () => void;
  onWordCount?: () => void;
  onImport?: () => void;
  marginState?: string;
  onSetMarginState?: (margin: any) => void;
  onReadMode?: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleItem = (menu: string, item: string) => {
    setOpen(null);
    if (!editor) return;

    if (menu === "Edit") {
      if (item === "Undo") editor.chain().focus().undo().run();
      if (item === "Redo") editor.chain().focus().redo().run();
      if (item === "Select All") editor.chain().focus().selectAll().run();
      if (item === "Delete") editor.chain().focus().deleteSelection().run();
      if (item === "Margins: Normal") onSetMarginState?.("normal");
      if (item === "Margins: Narrow") onSetMarginState?.("narrow");
      if (item === "Margins: Moderate") onSetMarginState?.("moderate");
      if (item === "Margins: Wide") onSetMarginState?.("wide");
    } else if (menu === "Insert") {
      if (item === "Table")
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      if (item === "Horizontal line") editor.chain().focus().setHorizontalRule().run();
      if (item === "Page break") editor.chain().focus().setPageBreak().run();
      if (item === "Blockquote") editor.chain().focus().toggleBlockquote().run();
      if (item === "Code Block") editor.chain().focus().toggleCodeBlock().run();
      if (item === "Link") {
        // Handled by LinkPopoverWrapper via MenuBar map
      }
      if (item === "Image") {
        triggerImageUpload(editor);
      }
    } else if (menu === "Format") {
      if (item === "Bold") editor.chain().focus().toggleBold().run();
      if (item === "Italic") editor.chain().focus().toggleItalic().run();
      if (item === "Underline") editor.chain().focus().toggleUnderline().run();
      if (item === "Strikethrough") editor.chain().focus().toggleStrike().run();
      if (item === "Superscript") editor.chain().focus().toggleSuperscript().run();
      if (item === "Subscript") editor.chain().focus().toggleSubscript().run();
      if (item === "Code") editor.chain().focus().toggleCode().run();
      if (item === "Align Left") editor.chain().focus().setTextAlign("left").run();
      if (item === "Align Center") editor.chain().focus().setTextAlign("center").run();
      if (item === "Align Right") editor.chain().focus().setTextAlign("right").run();
      if (item === "Justify") editor.chain().focus().setTextAlign("justify").run();
      if (item === "Bullet List") editor.chain().focus().toggleBulletList().run();
      if (item === "Numbered List") editor.chain().focus().toggleOrderedList().run();
      if (item === "Checklist") editor.chain().focus().toggleTaskList().run();
      if (item === "Clear Formatting") editor.chain().focus().unsetAllMarks().run();
    } else if (menu === "File" || menu === "View" || menu === "Tools") {
      if (menu === "File") {
        if (item === "New") onNewDocument?.();
        if (item === "Open") onOpenDocument?.();
        if (item === "Rename") onRenameDocument?.();
        if (item === "Delete") onDeleteDocument?.();
        if (item === "Save") onSaveDocument?.();
        if (item === "Version History") onVersionHistory?.();
        if (item === "Import DOCX/TXT") onImport?.();
        if (item === "Download DOCX") exportToDocx(editor, document.title);
        if (item === "Download HTML") exportToHtml(editor, document.title);
        if (item === "Download TXT") exportToTxt(editor, document.title);
        if (item === "Download PDF") exportToPdf(editor, document.title);
      }
      if (menu === "View") {
        if (item === "Read Mode") onReadMode?.();
        if (item === "Full screen") {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
          else document.exitFullscreen().catch(() => {});
        }
        if (item === "Page mode") onTogglePageMode?.();
        if (item === "Narrow width") onSetPageWidth?.("narrow");
        if (item === "Standard width") onSetPageWidth?.("standard");
        if (item === "Wide width") onSetPageWidth?.("wide");
      }
      if (menu === "Tools") {
        if (item === "Word count") onWordCount?.();
      }
      console.log(`Action: ${menu} -> ${item}`);
    }
  };

  return (
    <div
      ref={ref}
      className="relative flex items-center gap-0.5 border-b border-border-soft bg-[#FAFAFA]/95 px-4 py-1 backdrop-blur-xl"
    >
      {Object.keys(MENUS).map((m) => (
        <div key={m} className="relative">
          <button
            onMouseEnter={() => open && setOpen(m)}
            onClick={() => setOpen(open === m ? null : m)}
            className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
              open === m
                ? "bg-surface-muted text-foreground"
                : "text-foreground/75 hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {m}
          </button>
          <AnimatePresence>
            {open === m && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-border-soft bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(40,40,90,0.18)]"
              >
                {MENUS[m].map((item) => {
                  const Icon = item.icon;
                  const isActiveMargin = 
                    (item.label === "Margins: Normal" && marginState === "normal") ||
                    (item.label === "Margins: Narrow" && marginState === "narrow") ||
                    (item.label === "Margins: Moderate" && marginState === "moderate") ||
                    (item.label === "Margins: Wide" && marginState === "wide");

                  const btn = (
                    <button
                      key={item.label}
                      onClick={(e) => {
                        if (item.label === "Link") {
                          e.preventDefault();
                        } else {
                          handleItem(m, item.label);
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-surface-muted ${
                        isActiveMargin ? "bg-primary-soft text-primary font-medium" : "text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className={isActiveMargin ? "text-primary" : "text-muted-foreground"} />
                        {item.label}
                      </div>
                      {isActiveMargin && <Check size={14} />}
                    </button>
                  );

                  if (item.label === "Link") {
                    return (
                      <LinkPopoverWrapper key={item.label} editor={editor} onOpenChange={(open) => { if (!open) setOpen(null); }}>
                        {btn}
                      </LinkPopoverWrapper>
                    );
                  }
                  return btn;
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TOOLBAR
============================================================ */
function Toolbar({
  editor,
  zoom,
  setZoom,
  collapsed,
  onToggleCollapse,
}: {
  editor: Editor | null;
  zoom: number;
  setZoom: (z: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (!editor) {
    return (
      <div className="sticky top-0 z-30 h-[52px] border-b border-border-soft bg-[#FAFAFA]/95" />
    );
  }

  const { activeFont, activeSize } = useEditorTypography(editor);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-border-soft bg-[#FAFAFA]/95 px-4 py-2 backdrop-blur-xl">
      <ToolGroup>
        <IconBtn icon={Undo2} onClick={() => editor.chain().focus().undo().run()} label="Undo" />
        <IconBtn icon={Redo2} onClick={() => editor.chain().focus().redo().run()} label="Redo" />
        <IconBtn icon={SpellCheck} label="Spelling & grammar" />
      </ToolGroup>

      <ZoomDropdown zoom={zoom} setZoom={setZoom} />
      <TextStyleDropdown editor={editor} />
      <UnifiedFontFamilyDropdown editor={editor} activeFont={activeFont} />
      <UnifiedFontSizeControl editor={editor} activeSize={activeSize} />

      <ToolGroup>
        <IconBtn
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        />
        <IconBtn
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        />
        <IconBtn
          icon={UnderlineIcon}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Underline"
        />
        <IconBtn
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="Strikethrough"
        />
        <IconBtn
          icon={Code2}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          label="Inline Code"
        />
        <ColorButton editor={editor} />
        <IconBtn
          icon={Eraser}
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          label="Clear Formatting"
        />
      </ToolGroup>

      <ToolGroup>
        <IconBtn
          icon={SubIcon}
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          label="Subscript"
        />
        <IconBtn
          icon={SuperIcon}
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          label="Superscript"
        />
      </ToolGroup>

      <ToolGroup>
        <LinkToolbarButton editor={editor} />
        <IconBtn icon={MessageCirclePlus} label="Add comment" />
        <IconBtn icon={ImageIcon} label="Insert image" onClick={() => triggerImageUpload(editor)} />
      </ToolGroup>

      <ToolGroup>
        <IconBtn
          icon={AlignLeft}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          label="Align left"
        />
        <IconBtn
          icon={AlignCenter}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          label="Align center"
        />
        <IconBtn
          icon={AlignRight}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          label="Align right"
        />
        <IconBtn
          icon={AlignJustify}
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          label="Justify"
        />
      </ToolGroup>

      <ToolGroup>
        <IconBtn icon={Outdent} label="Decrease indent" />
        <IconBtn icon={IndentIcon} label="Increase indent" />
      </ToolGroup>

      <ToolGroup>
        <IconBtn
          icon={ListChecks}
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          label="Checklist"
        />
        <IconBtn
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        />
        <IconBtn
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Numbered list"
        />
      </ToolGroup>

      <div className="ml-auto">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand editor chrome" : "Collapse for distraction-free writing"}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            {collapsed ? (
              <ChevronDown size={16} strokeWidth={1.8} />
            ) : (
              <ChevronUp size={16} strokeWidth={1.8} />
            )}
          </motion.div>
        </button>
      </div>
    </div>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 border-r border-border-soft/70 pr-1.5 last:border-r-0">
      {children}
    </div>
  );
}

const IconBtn = forwardRef<HTMLButtonElement, {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  onClick?: () => void;
  label: string;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>>(({ icon: Icon, onClick, label, active, ...props }, ref) => {
  return (
    <button
      ref={ref}
      title={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
        active
          ? "bg-primary-soft text-primary"
          : "text-foreground/75 hover:bg-surface-muted hover:text-foreground"
      }`}
      {...props}
    >
      <Icon size={15} strokeWidth={1.8} />
    </button>
  );
});
IconBtn.displayName = "IconBtn";

/* ---------- Toolbar dropdowns ---------- */

function LinkPopoverWrapper({ editor, children, onOpenChange }: { editor: Editor | null; children: React.ReactNode; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  const submit = () => {
    if (!editor) return;
    if (url) {
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
    setOpen(false);
    setUrl("");
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-border-soft bg-white p-2 shadow-[0_12px_40px_-12px_rgba(40,40,90,0.15)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Paste or type a link..."
              className="h-8 w-full rounded-md border border-border-soft bg-transparent px-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-1">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function LinkToolbarButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  return (
    <LinkPopoverWrapper editor={editor} onOpenChange={setOpen}>
      <IconBtn icon={Link2} label="Insert link" active={editor.isActive("link") || open} />
    </LinkPopoverWrapper>
  );
}

function Dropdown({
  label,
  width = 180,
  children,
}: {
  label: React.ReactNode;
  width?: number;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {label}
        <ChevronDown size={12} strokeWidth={1.8} className="opacity-60" />
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

function DropdownItem({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
        active
          ? "bg-primary-soft text-primary"
          : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ZoomDropdown({ zoom, setZoom }: { zoom: number; setZoom: (z: number) => void }) {
  return (
    <Dropdown label={`${zoom}%`} width={120}>
      {(close) =>
        [50, 75, 100, 125, 150].map((z) => (
          <DropdownItem
            key={z}
            active={z === zoom}
            onClick={() => {
              setZoom(z);
              close();
            }}
          >
            {z}%
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}

function TextStyleDropdown({ editor }: { editor: Editor }) {
  const current = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
      ? "Heading 2"
      : editor.isActive("heading", { level: 3 })
        ? "Heading 3"
        : "Normal text";

  return (
    <Dropdown label={<span className="w-[88px] truncate text-left">{current}</span>} width={180}>
      {(close) => (
        <>
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setParagraph().run();
              close();
            }}
          >
            Normal text
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setHeading({ level: 1 }).run();
              close();
            }}
          >
            <span className="font-display text-[16px] font-semibold">Title</span>
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setHeading({ level: 2 }).run();
              close();
            }}
          >
            <span className="font-display text-[14px] font-medium text-muted-foreground">
              Subtitle
            </span>
          </DropdownItem>
          <div className="my-1 h-px bg-border-soft" />
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setHeading({ level: 1 }).run();
              close();
            }}
          >
            <span className="text-[15px] font-semibold">Heading 1</span>
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setHeading({ level: 2 }).run();
              close();
            }}
          >
            <span className="text-[13.5px] font-semibold">Heading 2</span>
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              editor.chain().focus().setHeading({ level: 3 }).run();
              close();
            }}
          >
            <span className="text-[12.5px] font-semibold">Heading 3</span>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

// unified controls replaced FontFamilyDropdown and FontSizeControl
function LineSpacingDropdown() {
  return (
    <Dropdown label={<span className="text-[12.5px]">Spacing</span>} width={140}>
      {(close) =>
        ["1.0", "1.15", "1.5", "2.0", "2.5"].map((s) => (
          <DropdownItem key={s} onClick={close}>
            {s}
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}

function ColorButton({ editor }: { editor: Editor }) {
  const colors = [
    "#0d0d0d",
    "#5b5bd6",
    "#9333ea",
    "#db2777",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];
  return (
    <Dropdown
      label={
        <span className="flex items-center gap-1">
          <Palette size={14} strokeWidth={1.8} />
        </span>
      }
      width={160}
    >
      {(close) => (
        <div className="grid grid-cols-4 gap-1.5 p-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                editor.chain().focus().setColor(c).run();
                close();
              }}
              className="h-7 w-7 rounded-md ring-1 ring-border-soft transition-transform hover:scale-110"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </Dropdown>
  );
}

/* ============================================================
   RULER
============================================================ */
function Ruler() {
  const ticks = Array.from({ length: 80 });
  return (
    <div className="sticky top-[52px] z-20 hidden border-b border-border-soft bg-[#FAFAFA]/95 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-6 max-w-[816px] items-center px-[96px] text-[9px] text-muted-foreground/70">
        {ticks.map((_, i) => (
          <div key={i} className="flex flex-1 items-end justify-start" style={{ height: 8 }}>
            <div
              className={
                i % 8 === 0
                  ? "h-2 w-px bg-foreground/30"
                  : i % 4 === 0
                    ? "h-1.5 w-px bg-foreground/20"
                    : "h-1 w-px bg-foreground/12"
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DOCUMENT CANVAS
============================================================ */
function DocumentCanvas({
  zoom,
  pageMode,
  pageWidth,
  marginState,
  customMargins,
  children,
}: {
  zoom: number;
  pageMode: boolean;
  pageWidth: "narrow" | "standard" | "wide";
  marginState: string;
  customMargins: any;
  children: React.ReactNode;
}) {
  const widthClass = pageWidth === "narrow" ? "max-w-[650px]" : pageWidth === "wide" ? "max-w-[1000px]" : "max-w-[816px]";
  const contentRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(1056);
  const pageHeight = 1056; // Standard US Letter/A4-ish height at 96dpi
  const pageGap = 32;

  useEffect(() => {
    if (!pageMode || !contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setEditorHeight(entry.contentRect.height);
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [pageMode]);

  if (!pageMode) {
    return (
      <div className="relative flex justify-center px-6 pb-32 pt-8">
        <motion.div
          animate={{ scale: zoom / 100 }}
          transition={{ type: "spring", stiffness: 240, damping: 30 }}
          style={{ transformOrigin: "top center" }}
          className={`w-full ${widthClass}`}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  const numPages = Math.max(1, Math.ceil(editorHeight / pageHeight));
  const pages = Array.from({ length: numPages });

  return (
    <div className="relative flex justify-center px-6 pb-32 pt-8">
      {/* Left vertical ruler */}
      <div className="pointer-events-none hidden md:block" style={{ width: 18 }}>
        <div className="sticky top-[100px] flex flex-col items-end gap-[6.5px] pr-1 text-[9px] text-muted-foreground/70">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={i % 4 === 0 ? "h-px w-2.5 bg-foreground/25" : "h-px w-1.5 bg-foreground/12"}
            />
          ))}
        </div>
      </div>

      <motion.div
        animate={{ scale: zoom / 100 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        style={{ transformOrigin: "top center" }}
        className={`relative w-full ${widthClass}`}
      >
        {/* Continuous Canvas Background */}
        <div 
          className="relative w-full rounded-[4px] bg-white shadow-[0_1px_3px_rgba(40,40,90,0.06),0_24px_60px_-30px_rgba(40,40,90,0.25)] ring-1 ring-border-soft/70 transition-all"
          style={{ minHeight: pageHeight }}
        >
          {/* Subtle Page Boundaries (Visual Only) */}
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[4px]">
            {pages.map((_, i) => {
              if (i === 0) return null; // No line at the very top
              const topPos = i * pageHeight;
              return (
                <div key={i} className="absolute left-0 right-0" style={{ top: topPos }}>
                  <div className="flex w-full items-center justify-center opacity-100">
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
                  </div>
                  <div className="absolute -top-[14px] left-full ml-6 flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                    Page {i + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* The single continuous TipTap editor sits on top */}
          <div ref={contentRef} className="relative z-10 min-h-[1056px]">
            {children}
          </div>
        </div>
      </motion.div>

      <div className="hidden md:block" style={{ width: 18 }} />
    </div>
  );
}

/* ============================================================
   PROSE STYLES
============================================================ */
function EditorStyles() {
  return (
    <style>{`
      .colliq-prose { font-family: var(--font-sans); caret-color: var(--primary); outline: none; }
      .colliq-prose h1 { font-family: var(--font-display); font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; margin: 0.6em 0 0.3em; }
      .colliq-prose h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.3; margin: 0.6em 0 0.25em; }
      .colliq-prose h3 { font-family: var(--font-display); font-size: 17px; font-weight: 600; line-height: 1.35; margin: 0.5em 0 0.2em; }
      .colliq-prose p { margin: 0.45em 0; }
      .colliq-prose ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
      .colliq-prose ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
      .colliq-prose ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
      .colliq-prose ul[data-type="taskList"] li { display: flex; gap: 0.55em; align-items: flex-start; margin: 0.2em 0; }
      .colliq-prose ul[data-type="taskList"] li > label { margin-top: 0.35em; }
      .colliq-prose ul[data-type="taskList"] input[type="checkbox"] { accent-color: var(--primary); width: 14px; height: 14px; }
      .colliq-prose blockquote { border-left: 3px solid var(--border); padding-left: 0.9em; color: var(--muted-foreground); margin: 0.6em 0; }
      .colliq-prose code { background: var(--surface-muted); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .colliq-prose pre { background: var(--surface-muted); padding: 0.9em 1.1em; border-radius: 10px; overflow-x: auto; margin: 0.6em 0; }
      .colliq-prose pre code { background: transparent; padding: 0; }
      .colliq-prose hr { border: none; border-top: 1px solid var(--border); margin: 1.2em 0; }
      .colliq-prose a { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
      
      /* New Extensions Styles */
      .colliq-prose table { border-collapse: collapse; margin: 1.5em 0; width: 100%; overflow: hidden; border-radius: 6px; box-shadow: 0 0 0 1px var(--border-soft); }
      .colliq-prose table td, .colliq-prose table th { border: 1px solid var(--border-soft); padding: 0.6em; vertical-align: top; min-width: 1em; position: relative; }
      .colliq-prose table th { background-color: var(--surface-muted); font-weight: 600; text-align: left; }
      .colliq-prose table .selectedCell::after { content: ""; position: absolute; inset: 0; background-color: color-mix(in oklch, var(--primary) 15%, transparent); pointer-events: none; }
      .colliq-prose mark { background-color: color-mix(in oklch, var(--accent-warm) 60%, transparent); border-radius: 2px; padding: 0.1em 0.2em; color: inherit; }
      
      .colliq-prose p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        color: color-mix(in oklab, var(--muted-foreground) 70%, transparent);
        float: left;
        height: 0;
        pointer-events: none;
      }
      
      .colliq-prose hr.page-break { border-top: 2px dashed var(--border-soft); margin: 3em 0; position: relative; page-break-after: always; }
      .colliq-prose hr.page-break::after { content: "Page Break"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background); padding: 0 16px; font-size: 11px; font-weight: 500; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; }
      
      .hljs-keyword, .hljs-operator, .hljs-pattern-match { color: var(--accent-violet); font-weight: 500; }
      .hljs-function, .hljs-title { color: var(--cursor-blue); font-weight: 500; }
      .hljs-string { color: var(--cursor-teal); }
      .hljs-comment { color: var(--muted-foreground); font-style: italic; }
      .hljs-number { color: var(--cursor-pink); }
      .hljs-class, .hljs-type { color: var(--accent-warm); font-weight: 500; }
    `}</style>
  );
}

/* ============================================================
   BUBBLE MENUS
============================================================ */
function LinkBubbleMenu({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editor.isActive("link")) {
      setUrl(editor.getAttributes("link").href || "");
    } else {
      setUrl("");
      setIsEditing(false);
    }
  }, [editor.state.selection]);

  const handleSubmit = () => {
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setIsEditing(false);
  };

  return (
    // @ts-ignore
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }: any) => editor.isActive("link")}
      // @ts-ignore
      tippyOptions={{ duration: 100, placement: "bottom", theme: "light-border", interactive: true }}
      className="flex items-center gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-[0_8px_30px_-8px_rgba(40,40,90,0.18)]"
    >
      {isEditing ? (
        <div className="flex items-center gap-1.5 px-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            placeholder="Paste link..."
            className="h-7 w-[200px] bg-transparent text-[13px] outline-none"
            autoFocus
          />
          <button onClick={handleSubmit} className="rounded-md bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20">
            Save
          </button>
        </div>
      ) : (
        <>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 max-w-[200px] items-center gap-1.5 truncate px-2.5 text-[13px] font-medium text-primary hover:underline"
          >
            {url}
          </a>
          <div className="h-4 w-px bg-border-soft" />
          <IconBtn icon={Pencil} onClick={() => setIsEditing(true)} label="Edit link" />
          <IconBtn icon={ExternalLink} onClick={() => window.open(url, "_blank")} label="Open in new tab" />
          <IconBtn icon={Trash2} onClick={() => editor.chain().focus().unsetLink().run()} label="Remove link" />
        </>
      )}
    </BubbleMenu>
  );
}

function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    // @ts-ignore
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }: any) => editor.isActive("table")}
      // @ts-ignore
      tippyOptions={{ duration: 100, placement: "top", theme: "light-border", interactive: true }}
      className="flex items-center gap-0.5 rounded-xl border border-border-soft bg-white p-1 shadow-[0_8px_30px_-8px_rgba(40,40,90,0.18)]"
    >
      <IconBtn icon={Columns3} onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add Column" />
      <IconBtn icon={Rows3} onClick={() => editor.chain().focus().addRowAfter().run()} label="Add Row" />
      <div className="mx-1 h-4 w-px bg-border-soft" />
      <IconBtn icon={Trash2} onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete Column" />
      <IconBtn icon={Trash2} onClick={() => editor.chain().focus().deleteRow().run()} label="Delete Row" />
      <div className="mx-1 h-4 w-px bg-border-soft" />
      <IconBtn icon={TableProperties} onClick={() => editor.chain().focus().deleteTable().run()} label="Delete Table" />
    </BubbleMenu>
  );
}

/* ============================================================
   WORD COUNT MODAL
============================================================ */
function WordCountModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  if (!editor) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5" onClick={onClose}>
      <div className="relative w-64 rounded-xl border border-border-soft bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-[13px] font-semibold text-foreground">Word Count</h3>
        <div className="flex flex-col gap-2 text-[13px] text-muted-foreground">
          <div className="flex justify-between"><span>Words</span> <span className="font-medium text-foreground">{editor.storage.characterCount.words()}</span></div>
          <div className="flex justify-between"><span>Characters</span> <span className="font-medium text-foreground">{editor.storage.characterCount.characters()}</span></div>
        </div>
      </div>
    </div>
  );
}
