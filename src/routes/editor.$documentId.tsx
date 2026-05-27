import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
import ImageExt from "@tiptap/extension-image";
import { Table as TableExt } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Highlight } from "@tiptap/extension-highlight";
import { SlashCommand, getSlashCommandConfig } from "@/components/editor/slash-command";
import { getDocument, updateDocument } from "@/firebase/firestore/documents";
import { toggleFavorite } from "@/firebase/firestore/favorites";
import {
  FileText,
  Star,
  Cloud,
  CloudUpload,
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
  Image as ImageIcon,
  ListChecks,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import colliqLogo from "@/assets/landing/colliq-logo.png";

export const Route = createFileRoute("/editor/$documentId")({
  head: () => ({
    meta: [
      { title: "Editor — Colliq" },
      { name: "description", content: "Write, edit, and collaborate in Colliq." },
    ],
  }),
  component: EditorPage,
});

type SaveStatus = "idle" | "saving" | "saved" | "error";

function EditorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { documentId } = Route.useParams();

  const [isDocLoading, setIsDocLoading] = useState(true);

  const [title, setTitle] = useState("Untitled document");
  const [favorite, setFavorite] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [chromeCollapsed, setChromeCollapsed] = useState(false);
  const [zoom, setZoom] = useState(100);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder: "Start writing, or press ‘/’ for commands…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageExt,
      TableExt.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({ multicolor: true }),
      SlashCommand.configure({
        suggestion: getSlashCommandConfig(),
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "colliq-prose focus:outline-none min-h-[1000px] px-[96px] py-[96px] text-[15.5px] leading-[1.75] text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateDocument(documentId, { content: editor.getJSON() });
          setSaveStatus("saved");
        } catch (e) {
          setSaveStatus("error");
        }
      }, 1200);
    },
  });

  useEffect(() => {
    if (!user || loading || !editor) return;
    
    let isMounted = true;
    getDocument(documentId).then(doc => {
      if (!isMounted) return;
      if (!doc) {
        navigate({ to: "/workspace" });
        return;
      }
      
      setTitle(doc.title);
      setFavorite(doc.favorite);
      if (doc.content && Object.keys(doc.content).length > 0) {
        editor.commands.setContent(doc.content, false);
      }
      setIsDocLoading(false);
    }).catch(() => {
      if (isMounted) navigate({ to: "/workspace" });
    });
    
    return () => { isMounted = false; };
  }, [documentId, user, loading, navigate, editor]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  if (loading || !user || isDocLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F2F5]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
            />
            <MenuBar editor={editor} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toolbar
        editor={editor}
        zoom={zoom}
        setZoom={setZoom}
        collapsed={chromeCollapsed}
        onToggleCollapse={() => setChromeCollapsed((c) => !c)}
      />

      <Ruler />

      <DocumentCanvas zoom={zoom}>
        <EditorContent editor={editor} />
      </DocumentCanvas>

      <EditorStyles />
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
}: {
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null };
  title: string;
  setTitle: (v: string) => void;
  favorite: boolean;
  setFavorite: (v: boolean) => void;
  saveStatus: SaveStatus;
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

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <HeaderBtn icon={History} label="Version history" />
          <HeaderBtn icon={MessageSquare} label="Comments" />
          <HeaderBtn icon={Sparkles} label="Ask AI" highlighted />
          <button className="ml-1 flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-medium text-white shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-all hover:bg-[color-mix(in_oklab,var(--primary)_92%,black)] active:scale-[0.98]">
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
      onClick={() => setEditing(true)}
      className="min-w-0 max-w-[300px] truncate rounded-md px-2 py-1 text-left font-display text-[15.5px] font-medium text-foreground transition-colors hover:bg-surface-muted"
    >
      {value}
    </button>
  );
}

function SaveStatusPill({ status }: { status: SaveStatus }) {
  const isSaving = status === "saving";
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
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <button
      title={label}
      className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-all ${
        highlighted
          ? "bg-gradient-to-r from-[color-mix(in_oklab,var(--primary)_14%,white)] to-[color-mix(in_oklab,var(--accent-violet)_14%,white)] text-primary ring-1 ring-primary/15 hover:ring-primary/30"
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
    { label: "Download", icon: Download },
    { label: "Rename", icon: Pencil },
    { label: "Delete", icon: Trash2 },
    { label: "Save", icon: Save },
    { label: "Version History", icon: History },
  ],
  Edit: [
    { label: "Undo", icon: Undo2 },
    { label: "Redo", icon: Redo2 },
    { label: "Select All", icon: Type },
    { label: "Delete", icon: Trash2 },
  ],
  View: [
    { label: "Editing mode", icon: Pencil },
    { label: "Viewing mode", icon: Eye },
    { label: "Comments", icon: MessageSquare },
    { label: "Full screen", icon: Maximize },
  ],
  Insert: [
    { label: "Image", icon: ImageIcon },
    { label: "Table", icon: TableIcon },
    { label: "Link", icon: Link2 },
    { label: "Horizontal line", icon: Minus },
    { label: "Code Block", icon: Code },
    { label: "Blockquote", icon: Quote },
  ],
  Format: [
    { label: "Bold", icon: Bold },
    { label: "Italic", icon: Italic },
    { label: "Underline", icon: UnderlineIcon },
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

function MenuBar({ editor }: { editor: Editor | null }) {
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
    } else if (menu === "Insert") {
      if (item === "Table")
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      if (item === "Horizontal line") editor.chain().focus().setHorizontalRule().run();
      if (item === "Blockquote") editor.chain().focus().toggleBlockquote().run();
      if (item === "Code Block") editor.chain().focus().toggleCodeBlock().run();
      if (item === "Link") {
        const url = window.prompt("Link URL");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }
      if (item === "Image") {
        const url = window.prompt("Image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }
    } else if (menu === "Format") {
      if (item === "Bold") editor.chain().focus().toggleBold().run();
      if (item === "Italic") editor.chain().focus().toggleItalic().run();
      if (item === "Underline") editor.chain().focus().toggleUnderline().run();
      if (item === "Align Left") editor.chain().focus().setTextAlign("left").run();
      if (item === "Align Center") editor.chain().focus().setTextAlign("center").run();
      if (item === "Align Right") editor.chain().focus().setTextAlign("right").run();
      if (item === "Justify") editor.chain().focus().setTextAlign("justify").run();
      if (item === "Bullet List") editor.chain().focus().toggleBulletList().run();
      if (item === "Numbered List") editor.chain().focus().toggleOrderedList().run();
      if (item === "Checklist") editor.chain().focus().toggleTaskList().run();
      if (item === "Clear Formatting") editor.chain().focus().unsetAllMarks().run();
    } else if (menu === "File" || menu === "View" || menu === "Tools") {
      // Future backend phases
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
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleItem(m, item.label)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-foreground/80 transition-colors hover:bg-surface-muted hover:text-foreground"
                    >
                      <Icon size={14} className="text-muted-foreground" />
                      {item.label}
                    </button>
                  );
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

  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 border-b border-border-soft bg-[#FAFAFA]/95 px-4 py-2 backdrop-blur-xl">
      <ToolGroup>
        <IconBtn icon={Undo2} onClick={() => editor.chain().focus().undo().run()} label="Undo" />
        <IconBtn icon={Redo2} onClick={() => editor.chain().focus().redo().run()} label="Redo" />
        <IconBtn icon={SpellCheck} label="Spelling & grammar" />
      </ToolGroup>

      <ZoomDropdown zoom={zoom} setZoom={setZoom} />
      <TextStyleDropdown editor={editor} />
      <FontFamilyDropdown />
      <FontSizeControl />

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
        <ColorButton editor={editor} />
      </ToolGroup>

      <ToolGroup>
        <IconBtn
          icon={Link2}
          label="Insert link"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        />
        <IconBtn icon={MessageCirclePlus} label="Add comment" />
        <IconBtn icon={ImageIcon} label="Insert image" />
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
        <IconBtn icon={Indent} label="Increase indent" />
        <LineSpacingDropdown />
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

function IconBtn({
  icon: Icon,
  onClick,
  label,
  active,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  onClick?: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
        active
          ? "bg-primary-soft text-primary"
          : "text-foreground/75 hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <Icon size={15} strokeWidth={1.8} />
    </button>
  );
}

/* ---------- Toolbar dropdowns ---------- */

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

function FontFamilyDropdown() {
  const [font, setFont] = useState("Inter");
  return (
    <Dropdown label={<span className="w-[70px] truncate text-left">{font}</span>} width={160}>
      {(close) =>
        ["Inter", "Space Grotesk", "Instrument Serif", "Georgia", "Mono"].map((f) => (
          <DropdownItem
            key={f}
            active={f === font}
            onClick={() => {
              setFont(f);
              close();
            }}
          >
            <span style={{ fontFamily: f }}>{f}</span>
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}

function FontSizeControl() {
  const [size, setSize] = useState(11);
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setSize((s) => Math.max(8, s - 1))}
        className="grid h-7 w-7 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-surface-muted"
      >
        <Minus size={12} strokeWidth={2} />
      </button>
      <div className="grid h-7 min-w-[28px] place-items-center rounded-md border border-border-soft bg-white px-1.5 text-[12px] font-medium">
        {size}
      </div>
      <button
        onClick={() => setSize((s) => Math.min(96, s + 1))}
        className="grid h-7 w-7 place-items-center rounded-md text-foreground/70 transition-colors hover:bg-surface-muted"
      >
        <span className="text-[14px] leading-none">+</span>
      </button>
    </div>
  );
}

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
function DocumentCanvas({ zoom, children }: { zoom: number; children: React.ReactNode }) {
  return (
    <div className="relative flex justify-center px-6 pb-32 pt-8">
      {/* Left vertical ruler */}
      <div className="pointer-events-none hidden md:block" style={{ width: 18 }}>
        <div className="sticky top-[100px] flex flex-col items-end gap-[6.5px] pr-1 text-[9px] text-muted-foreground/70">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={
                i % 4 === 0 ? "h-px w-2.5 bg-foreground/25" : "h-px w-1.5 bg-foreground/12"
              }
            />
          ))}
        </div>
      </div>

      <motion.div
        animate={{ scale: zoom / 100 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        style={{ transformOrigin: "top center" }}
        className="w-full max-w-[816px]"
      >
        <div className="rounded-[2px] bg-white shadow-[0_1px_3px_rgba(40,40,90,0.06),0_24px_60px_-30px_rgba(40,40,90,0.25)] ring-1 ring-border-soft/70">
          {children}
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
    `}</style>
  );
}
