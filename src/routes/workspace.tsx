import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Home,
  Clock,
  Star,
  Users,
  LayoutTemplate,
  Search,
  Plus,
  FileText,
  FileSignature,
  NotebookPen,
  ClipboardList,
  Microscope,
  GraduationCap,
  Mail,
  Newspaper,
  BarChart3,
  Lightbulb,
  User as UserIcon,
  Settings,
  LogOut,
  Trash,
  StarOff,
  Copy,
  Pencil,
  ChevronDown,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/firebase/auth";
import { createDocument, getRecentDocuments, deleteDocument, updateDocument, duplicateDocument } from "@/firebase/firestore/documents";
import { getFavoriteDocuments, toggleFavorite } from "@/firebase/firestore/favorites";
import { toast } from "sonner";
import { TEMPLATES, TEMPLATE_TITLE_MAP } from "@/lib/templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchOverlay, type SearchableDoc } from "@/components/workspace/search-overlay";
import colliqLogo from "@/assets/landing/colliq-logo.png";
import { DocumentPreview } from "@/components/workspace/document-preview";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Colliq" },
      { name: "description", content: "Your Colliq collaborative workspace." },
    ],
  }),
  component: WorkspacePage,
});

const SECTIONS = [
  { id: "home", label: "Home", icon: Home },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "shared", label: "Shared", icon: Users },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
];

const START_TEMPLATES = [
  { title: "Blank", icon: Plus, blank: true },
  { title: "Resume", icon: FileSignature },
  { title: "Letter", icon: Mail },
  { title: "Meeting Notes", icon: NotebookPen },
  { title: "Project Proposal", icon: ClipboardList },
  { title: "Research Notes", icon: Microscope },
];

const SHARED = [
  { id: "mock-shared-1", title: "Partner Brief — Acme", edited: "Shared 1h ago", people: ["Acme team"], tint: "var(--accent-warm)" },
  { id: "mock-shared-2", title: "Investor Update — May", edited: "Shared yesterday", people: ["Board"], tint: "var(--cursor-violet)" },
  { id: "mock-shared-3", title: "Launch Checklist", edited: "Shared 2d ago", people: ["Marketing"], tint: "var(--cursor-pink)" },
  { id: "mock-shared-4", title: "Customer Interviews", edited: "Shared 4d ago", people: ["Research"], tint: "var(--cursor-teal)" },
];

const TEMPLATE_CARDS = [
  { title: "Class Notes", icon: GraduationCap },
  { title: "Resume", icon: FileSignature },
  { title: "Letter", icon: Mail },
  { title: "Project Proposal", icon: ClipboardList },
  { title: "Meeting Notes", icon: NotebookPen },
  { title: "Newsletter", icon: Newspaper },
  { title: "Report", icon: BarChart3 },
  { title: "Lesson Plan", icon: GraduationCap },
  { title: "Brainstorming", icon: Lightbulb },
];

/* ================================================================
   TOAST SYSTEM
================================================================ */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-2.5 rounded-full border border-border-soft bg-white px-5 py-3 text-[13.5px] font-medium text-foreground shadow-[0_14px_40px_-10px_rgba(40,40,90,0.2)]"
        >
          <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={12} strokeWidth={2.5} />
          </div>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================
   WORKSPACE PAGE
================================================================ */
function WorkspacePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Lifted doc state — shared between Main and Topbar search
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<any[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(true);
  const [docToDelete, setDocToDelete] = useState<Doc | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const refreshDocs = useCallback(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [recent, favs] = await Promise.all([
        getRecentDocuments(user.uid),
        getFavoriteDocuments(user.uid),
      ]);
      setRecentDocs(
        recent.map((d) => ({
          id: d.id,
          title: d.title,
          edited: formatRelativeTime(d.updatedAt),
          people: ["You"],
          tint: "var(--cursor-violet)",
          content: d.content,
        }))
      );
      setFavoriteDocs(
        favs.map((d) => ({
          id: d.id,
          title: d.title,
          edited: "Pinned",
          people: ["You"],
          tint: "var(--cursor-blue)",
          updatedAt: d.updatedAt,
          content: d.content,
        }))
      );
      setIsDocsLoading(false);
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    refreshDocs();
  }, [refreshDocs]);

  // Build searchable docs for the search overlay
  const searchableDocs: SearchableDoc[] = useMemo(() => {
    const recent: SearchableDoc[] = recentDocs.map((d) => ({
      id: d.id,
      title: d.title,
      edited: d.edited,
      category: "recent" as const,
      tint: d.tint,
    }));
    const favs: SearchableDoc[] = favoriteDocs
      .filter((f) => !recent.some((r) => r.id === f.id))
      .map((d) => ({
        id: d.id,
        title: d.title,
        edited: d.edited,
        category: "favorite" as const,
        tint: d.tint,
      }));
    return [...recent, ...favs];
  }, [recentDocs, favoriteDocs]);

  const handleDelete = async () => {
    if (docToDelete?.id) {
      if (!docToDelete.id.startsWith("mock-")) {
        await deleteDocument(docToDelete.id);
      }
      setDocToDelete(null);
      refreshDocs();
    }
  };

  const handleUnfavorite = async (id: string) => {
    try {
      await toggleFavorite(id, false);
      refreshDocs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!user || !id || id.startsWith("mock-")) return;
    try {
      await duplicateDocument(id, user.uid);
      refreshDocs();
      showToast("Document duplicated");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    if (!id || id.startsWith("mock-")) return;
    try {
      await updateDocument(id, { title: newTitle });
      refreshDocs();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-foreground">
      <Sidebar
        user={user}
        onLogout={async () => {
          await logout();
          navigate({ to: "/" });
        }}
      />
      <div className="md:pl-[72px]">
        <Topbar searchableDocs={searchableDocs} />
        <main className="mx-auto max-w-6xl px-6 pb-32 pt-10 sm:px-8">
          <StartSection />
          <DocsSection
            id="recent"
            eyebrow="Workspace"
            title="Recent documents"
            items={recentDocs}
            loading={isDocsLoading}
            onDeleteRequest={setDocToDelete}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            emptyIcon={Clock}
            emptyTitle="No documents yet"
            emptyMessage="Create your first document above to get started."
          />
          <DocsSection
            id="favorites"
            eyebrow="Pinned by you"
            title="Favorites"
            items={favoriteDocs}
            loading={isDocsLoading}
            compact
            isFavoriteSection
            onDeleteRequest={setDocToDelete}
            onUnfavorite={handleUnfavorite}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
            emptyIcon={Star}
            emptyTitle="No favorites yet"
            emptyMessage="Pin your most important documents here for quick access."
          />
          <DocsSection
            id="shared"
            eyebrow="From your team"
            title="Shared with you"
            items={SHARED}
            loading={false}
            compact
            onDeleteRequest={setDocToDelete}
            emptyIcon={Users}
            emptyTitle="Nothing shared yet"
            emptyMessage="Documents shared with you will appear here."
          />
          <TemplatesSection />

          <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete <strong>{docToDelete?.title}</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
      <FloatingCreate />
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}

/* ================================================================
   SIDEBAR
================================================================ */

function Sidebar({
  user,
  onLogout,
}: {
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null };
  onLogout: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const src = user.displayName || user.email || "U";
    return src.trim().slice(0, 1).toUpperCase();
  }, [user]);

  const handleNav = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.aside
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => {
        setExpanded(false);
        setMenuOpen(false);
      }}
      animate={{ width: expanded ? 232 : 72 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border-soft bg-white/70 backdrop-blur-xl md:flex"
    >
      {/* Logo */}
      <Link to="/" className="flex h-[68px] items-center gap-2.5 px-4">
        <img src={colliqLogo} alt="Colliq" className="h-9 w-9 shrink-0 object-contain" />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.18 }}
              className="font-display text-[17px] font-semibold tracking-tight whitespace-nowrap"
            >
              Colliq
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleNav(s.id)}
              className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? "bg-primary-soft text-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={18} strokeWidth={1.6} className="shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {s.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="relative p-3">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-muted"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--accent-violet)_70%,white)] text-[13px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(80,60,200,0.45)]">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 text-left"
              >
                <p className="truncate text-[13px] font-medium">{user.displayName || "Member"}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[60px] left-3 w-52 overflow-hidden rounded-xl border border-border-soft bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(40,40,90,0.18)]"
            >
              <SidebarMenuItem icon={Settings} label="Settings" onClick={() => navigate({ to: "/settings" })} />
              <div className="my-1 h-px bg-border-soft" />
              <SidebarMenuItem icon={LogOut} label="Logout" onClick={onLogout} danger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function SidebarMenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/8"
          : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <Icon size={15} strokeWidth={1.7} />
      {label}
    </button>
  );
}

/* ================================================================
   TOPBAR
================================================================ */

function Topbar({ searchableDocs }: { searchableDocs: SearchableDoc[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-soft/70 bg-[#FAFAFA]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center px-6">
        <SearchOverlay documents={searchableDocs} />
      </div>
    </header>
  );
}

/* ================================================================
   EXPORTED TOPHEADER (used by editor)
================================================================ */
export { Topbar as TopHeader };

/* ================================================================
   START SECTION
================================================================ */

function StartSection() {
  return (
    <section id="home" className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
          Welcome back
        </p>
        <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight sm:text-[36px]">
          Start a new <span className="font-serif italic">document</span>
        </h1>
      </motion.div>

      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {START_TEMPLATES.map((t, i) => (
          <StartCard key={t.title} index={i} {...t} />
        ))}
      </div>
    </section>
  );
}

function StartCard({
  title,
  icon: Icon,
  blank,
  index,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  blank?: boolean;
  index: number;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const templateKey = TEMPLATE_TITLE_MAP[title];
  const template = templateKey ? TEMPLATES[templateKey] : null;

  const handleCreate = async () => {
    if (!user) return;
    try {
      const id = await createDocument(user.uid, template ? {
        title: template.title,
        content: template.content,
        templateType: template.id,
      } : undefined);

      navigate({ to: "/editor/$documentId", params: { documentId: id } });
    } catch (err: any) {
      console.error("Failed to create document:", err);
      toast.error("Failed to create document. Please try again.");
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleCreate}
      className="group flex flex-col items-start"
    >
      <div className="relative flex aspect-[1/1.414] w-full items-center justify-center overflow-hidden rounded-[4px] border border-[#dadce0] bg-white transition-all duration-300 group-hover:border-[#1a73e8] group-hover:shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        {blank ? (
          <div className="grid h-16 w-16 place-items-center">
            {/* The Google Docs plus sign is multi-colored, but we can use our primary color or the provided icon */}
            <Icon size={36} strokeWidth={1.5} className="text-[#1a73e8]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-white">
            <DocumentPreview content={template?.content} />
          </div>
        )}
      </div>
      <div className="mt-3 w-full text-left flex items-center justify-between">
        <p className="truncate text-[14px] font-medium text-[#202124]">{title}</p>
        {!blank && <Icon size={14} strokeWidth={1.8} className="text-gray-400" />}
      </div>
    </motion.button>
  );
}


/* ================================================================
   DOCS SECTION
================================================================ */

type Doc = { id?: string; title: string; edited: string; people: string[]; tint: string; updatedAt?: any; content?: any };

type SortMode = "newest" | "oldest" | "az" | "za";

function DocsSection({
  id,
  eyebrow,
  title,
  items,
  loading,
  compact,
  onDeleteRequest,
  onUnfavorite,
  onDuplicate,
  onRename,
  isFavoriteSection,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyMessage,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  items: Doc[];
  loading: boolean;
  compact?: boolean;
  onDeleteRequest?: (doc: Doc) => void;
  onUnfavorite?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  isFavoriteSection?: boolean;
  emptyIcon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortMode>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sort) {
      case "oldest":
        sorted.reverse();
        break;
      case "az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break; // newest is already the default order from Firestore
    }
    return sorted;
  }, [items, sort]);

  const sortLabels: Record<SortMode, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    az: "A → Z",
    za: "Z → A",
  };

  return (
    <section id={id} className="mt-16 scroll-mt-24">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-[22px] font-semibold tracking-tight">{title}</h2>
        </div>

        {/* Sort control */}
        {items.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <ArrowUpDown size={13} strokeWidth={1.8} />
              {sortLabels[sort]}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-xl border border-border-soft bg-white p-1 shadow-[0_12px_30px_-8px_rgba(40,40,90,0.18)]"
                  >
                    {(["newest", "oldest", "az", "za"] as SortMode[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSort(s);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                          sort === s ? "bg-primary-soft text-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        {sortLabels[s]}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div
          className={`grid gap-4 ${
            compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {Array.from({ length: compact ? 4 : 3 }).map((_, i) => (
            <SkeletonDocCard key={i} index={i} />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-soft bg-white/60 py-16 text-center"
        >
          {EmptyIcon && <EmptyIcon size={36} strokeWidth={1} className="mb-3 text-muted-foreground/25" />}
          <p className="text-[15px] font-medium text-foreground/80">{emptyTitle}</p>
          <p className="mt-1 max-w-xs text-[13px] text-muted-foreground/70">{emptyMessage}</p>
        </motion.div>
      ) : (
        <div
          className={`grid gap-4 ${
            compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {sortedItems.map((d, i) => (
            <DocCard
              key={d.id || d.title}
              doc={d}
              index={i}
              onDelete={() => onDeleteRequest?.(d)}
              onUnfavorite={isFavoriteSection && d.id ? () => onUnfavorite?.(d.id as string) : undefined}
              onDuplicate={d.id && !d.id.startsWith("mock-") ? () => onDuplicate?.(d.id as string) : undefined}
              onRename={d.id && !d.id.startsWith("mock-") ? (newTitle: string) => onRename?.(d.id as string, newTitle) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonDocCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="overflow-hidden rounded-xl border border-border-soft bg-white"
    >
      <div className="h-28 w-full animate-pulse bg-gradient-to-br from-surface-muted to-white" />
      <div className="px-3.5 py-3">
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-foreground/8" />
        <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded-full bg-foreground/5" />
      </div>
    </motion.div>
  );
}

function DocCard({
  doc,
  index,
  onDelete,
  onUnfavorite,
  onDuplicate,
  onRename,
}: {
  doc: Doc;
  index: number;
  onDelete?: () => void;
  onUnfavorite?: () => void;
  onDuplicate?: () => void;
  onRename?: (newTitle: string) => void;
}) {
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(doc.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      setRenameValue(doc.title);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [renaming, doc.title]);

  const commitRename = () => {
    if (renameValue.trim() && renameValue.trim() !== doc.title) {
      onRename?.(renameValue.trim());
    }
    setRenaming(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => {
        if (renaming) return;
        if (doc.id && !doc.id.startsWith("mock-")) {
          navigate({ to: "/editor/$documentId", params: { documentId: doc.id } });
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border-soft bg-white text-left shadow-[0_1px_2px_rgba(40,40,90,0.04)] transition-all duration-300 hover:shadow-[0_14px_30px_-16px_rgba(40,40,90,0.2)]"
    >
      <div
        className="relative h-36 w-full overflow-hidden border-b border-[#dadce0] bg-white"
      >
        {doc.content ? (
          <div className="absolute inset-0">
            <DocumentPreview content={doc.content} />
          </div>
        ) : (
          <div className="absolute inset-0 p-4">
            <div className="space-y-1.5 opacity-60">
              <div className="h-1.5 w-9/12 rounded-full bg-foreground/12" />
              <div className="h-1 w-8/12 rounded-full bg-foreground/8" />
              <div className="h-1 w-7/12 rounded-full bg-foreground/8" />
              <div className="mt-2 h-1 w-10/12 rounded-full bg-foreground/6" />
              <div className="h-1 w-9/12 rounded-full bg-foreground/6" />
            </div>
          </div>
        )}
      </div>
      <div className="flex w-full flex-col gap-1 px-3.5 py-3">
        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="truncate rounded-md bg-primary-soft/50 px-1.5 py-0.5 text-[13.5px] font-medium text-foreground outline-none ring-1 ring-primary/30"
          />
        ) : (
          <p className="truncate text-[13.5px] font-medium text-foreground">{doc.title}</p>
        )}
        <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>{doc.edited}</span>
          <span className="truncate pl-2">{doc.people.join(" • ")}</span>
        </div>
      </div>

      {/* Hover actions */}
      {(onDelete || onUnfavorite || onDuplicate || onRename) && !renaming && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onRename && (
            <CardAction
              icon={Pencil}
              label="Rename"
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
              }}
            />
          )}
          {onDuplicate && (
            <CardAction
              icon={Copy}
              label="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            />
          )}
          {onUnfavorite && (
            <CardAction
              icon={StarOff}
              label="Unfavorite"
              onClick={(e) => {
                e.stopPropagation();
                onUnfavorite();
              }}
            />
          )}
          {onDelete && (
            <CardAction
              icon={Trash}
              label="Delete"
              danger
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

function CardAction({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-md border border-border-soft bg-white/80 text-muted-foreground shadow-sm backdrop-blur-md transition-colors ${
        danger
          ? "hover:border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
          : "hover:bg-white hover:text-primary"
      }`}
    >
      <Icon size={14} strokeWidth={1.8} />
    </div>
  );
}

/* ================================================================
   TEMPLATES
================================================================ */

function TemplatesSection() {
  return (
    <section id="templates" className="mt-16 scroll-mt-24">
      <div className="mb-5">
        <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
          Build faster
        </p>
        <h2 className="font-display text-[22px] font-semibold tracking-tight">Templates</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TEMPLATE_CARDS.map((t, i) => (
          <TemplateCard key={t.title} index={i} {...t} />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({
  title,
  icon: Icon,
  index,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  index: number;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const templateKey = TEMPLATE_TITLE_MAP[title];
  const template = templateKey ? TEMPLATES[templateKey] : null;

  const handleOpen = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const id = await createDocument(user.uid, template ? {
        title: template.title,
        content: template.content,
        templateType: template.id,
      } : { title });

      navigate({ to: "/editor/$documentId", params: { documentId: id } });
    } catch (err: any) {
      console.error("Failed to open template:", err);
      toast.error("Failed to open template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      onClick={handleOpen}
      disabled={loading}
      className="group flex flex-col items-start disabled:opacity-60"
    >
      <div className="relative flex aspect-[1/1.414] w-full items-center justify-center overflow-hidden rounded-[4px] border border-[#dadce0] bg-white transition-all duration-300 group-hover:border-[#1a73e8] group-hover:shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-0 bg-white">
          <DocumentPreview content={template?.content} />
        </div>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      <div className="mt-3 w-full text-left flex items-start justify-between">
        <div>
          <p className="truncate text-[14px] font-medium text-[#202124]">{title}</p>
          <p className="truncate text-[12px] text-gray-500 mt-0.5">{loading ? "Creating…" : "Template"}</p>
        </div>
        <Icon size={14} strokeWidth={1.8} className="text-gray-400 mt-1" />
      </div>
    </motion.button>
  );
}

/* ================================================================
   FLOATING CREATE
================================================================ */

function FloatingCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setShow(window.scrollY > 320);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCreate = async () => {
    if (user) {
      try {
        const id = await createDocument(user.uid);
        navigate({ to: "/editor/$documentId", params: { documentId: id } });
      } catch (err: any) {
        console.error("Failed to create document:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Create new document"
          onClick={handleCreate}
          className="fixed bottom-7 right-7 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--accent-violet)_75%,var(--primary))] text-white shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
        >
          <Plus size={22} strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ================================================================
   UTILS
================================================================ */

function formatRelativeTime(timestamp: any): string {
  if (!timestamp?.toMillis) return "Just now";
  const ms = Date.now() - timestamp.toMillis();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp.toMillis()).toLocaleDateString();
}
