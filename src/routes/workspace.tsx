import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/firebase/auth";
import { createDocument, getRecentDocuments } from "@/firebase/firestore/documents";
import { getFavoriteDocuments } from "@/firebase/firestore/favorites";
import colliqLogo from "@/assets/landing/colliq-logo.png";

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

const RECENT_DOCS = [
  {
    title: "Q3 Product Strategy",
    edited: "2h ago",
    people: ["Emma", "Jake"],
    tint: "var(--cursor-violet)",
  },
  {
    title: "Onboarding Flow Notes",
    edited: "Yesterday",
    people: ["Mia"],
    tint: "var(--cursor-pink)",
  },
  {
    title: "Brand Voice Guidelines",
    edited: "2d ago",
    people: ["Alex", "Emma"],
    tint: "var(--cursor-teal)",
  },
  { title: "Weekly Sync — Eng", edited: "3d ago", people: ["Jake"], tint: "var(--cursor-blue)" },
  {
    title: "Pricing Page Copy",
    edited: "5d ago",
    people: ["Mia", "Alex"],
    tint: "var(--accent-warm)",
  },
  {
    title: "User Research — Studio",
    edited: "1w ago",
    people: ["Emma"],
    tint: "var(--cursor-violet)",
  },
];

const FAVORITES = [
  { title: "Company Wiki", edited: "Pinned", people: ["Team"], tint: "var(--cursor-blue)" },
  { title: "Design Principles", edited: "Pinned", people: ["Alex"], tint: "var(--cursor-violet)" },
  { title: "Hiring Playbook", edited: "Pinned", people: ["Emma"], tint: "var(--cursor-pink)" },
  { title: "Roadmap 2026", edited: "Pinned", people: ["Jake", "Mia"], tint: "var(--cursor-teal)" },
];

const SHARED = [
  {
    title: "Partner Brief — Acme",
    edited: "Shared 1h ago",
    people: ["Acme team"],
    tint: "var(--accent-warm)",
  },
  {
    title: "Investor Update — May",
    edited: "Shared yesterday",
    people: ["Board"],
    tint: "var(--cursor-violet)",
  },
  {
    title: "Launch Checklist",
    edited: "Shared 2d ago",
    people: ["Marketing"],
    tint: "var(--cursor-pink)",
  },
  {
    title: "Customer Interviews",
    edited: "Shared 4d ago",
    people: ["Research"],
    tint: "var(--cursor-teal)",
  },
];

const TEMPLATES = [
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

function WorkspacePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

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
        <Topbar />
        <Main />
      </div>
      <FloatingCreate />
    </div>
  );
}

/* ---------------- Sidebar ---------------- */

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
              <MenuItem icon={UserIcon} label="User Profile" />
              <MenuItem icon={Settings} label="Settings" />
              <div className="my-1 h-px bg-border-soft" />
              <MenuItem icon={LogOut} label="Logout" onClick={onLogout} danger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function MenuItem({
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

/* ---------------- Topbar ---------------- */

function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-soft/70 bg-[#FAFAFA]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center px-6">
        <div className="relative mx-auto w-full max-w-xl">
          <Search
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            placeholder="Search documents, templates..."
            className="h-10 w-full rounded-full border border-border-soft bg-white/80 pl-10 pr-4 text-[13.5px] text-foreground placeholder:text-muted-foreground/80 shadow-[0_1px_2px_rgba(40,40,90,0.04)] outline-none transition-all focus:border-primary/40 focus:bg-white focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
          />
        </div>
      </div>
    </header>
  );
}

/* ---------------- Main ---------------- */

function Main() {
  const { user } = useAuth();
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    getRecentDocuments(user.uid).then(docs => {
      setRecentDocs(docs.map(d => ({
        id: d.id,
        title: d.title,
        edited: new Date(d.updatedAt?.toMillis?.() || Date.now()).toLocaleDateString(),
        people: ["You"],
        tint: "var(--cursor-violet)"
      })));
    });

    getFavoriteDocuments(user.uid).then(docs => {
      setFavoriteDocs(docs.map(d => ({
        id: d.id,
        title: d.title,
        edited: "Pinned",
        people: ["You"],
        tint: "var(--cursor-blue)"
      })));
    });
  }, [user]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 pt-10 sm:px-8">
      <StartSection />
      <DocsSection id="recent" eyebrow="Workspace" title="Recent documents" items={recentDocs.length > 0 ? recentDocs : []} />
      <DocsSection
        id="favorites"
        eyebrow="Pinned by you"
        title="Favorites"
        items={favoriteDocs.length > 0 ? favoriteDocs : []}
        compact
      />
      <DocsSection
        id="shared"
        eyebrow="From your team"
        title="Shared with you"
        items={SHARED}
        compact
      />
      <TemplatesSection />
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[22px] font-semibold tracking-tight">{title}</h2>
      </div>
    </div>
  );
}

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
  
  const handleCreate = async () => {
    if (blank && user) {
      try {
        const id = await createDocument(user.uid);
        navigate({ to: "/editor/$documentId", params: { documentId: id } });
      } catch (err: any) {
        console.error("Failed to create document:", err);
        alert("Failed to create document. Check console or Firestore permissions: " + err.message);
      }
    } else {
      // Future: handle templates
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
      className="group flex flex-col items-center"
    >
      <div
        className={`relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-white shadow-[0_1px_2px_rgba(40,40,90,0.05)] transition-all duration-300 group-hover:shadow-[0_14px_30px_-14px_rgba(40,40,90,0.25)] ${
          blank ? "" : ""
        }`}
      >
        {blank ? (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary transition-transform group-hover:scale-110">
            <Icon size={22} strokeWidth={1.8} />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-10/12 rounded-full bg-foreground/15" />
              <div className="h-1 w-9/12 rounded-full bg-foreground/8" />
              <div className="h-1 w-7/12 rounded-full bg-foreground/8" />
            </div>
            <div className="mt-3 space-y-1">
              <div className="h-1 w-full rounded-full bg-foreground/6" />
              <div className="h-1 w-11/12 rounded-full bg-foreground/6" />
              <div className="h-1 w-10/12 rounded-full bg-foreground/6" />
              <div className="h-1 w-9/12 rounded-full bg-foreground/6" />
            </div>
            <div className="mt-auto">
              <Icon size={16} strokeWidth={1.6} className="text-muted-foreground/70" />
            </div>
          </div>
        )}
      </div>
      <p className="mt-2.5 text-[13px] font-medium text-foreground">{title}</p>
    </motion.button>
  );
}

/* ---------------- Docs sections ---------------- */

type Doc = { id?: string; title: string; edited: string; people: string[]; tint: string };

function DocsSection({
  id,
  eyebrow,
  title,
  items,
  compact,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  items: Doc[];
  compact?: boolean;
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-24">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div
        className={`grid gap-4 ${
          compact
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {items.map((d, i) => (
          <DocCard key={d.title} doc={d} index={i} />
        ))}
      </div>
    </section>
  );
}

function DocCard({ doc, index }: { doc: Doc; index: number }) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => {
        if (doc.id) {
          navigate({ to: "/editor/$documentId", params: { documentId: doc.id } });
        }
      }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-soft bg-white text-left shadow-[0_1px_2px_rgba(40,40,90,0.04)] transition-all duration-300 hover:shadow-[0_14px_30px_-16px_rgba(40,40,90,0.2)]"
    >
      <div
        className="relative h-28 w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${doc.tint} 14%, white) 0%, white 100%)`,
        }}
      >
        <div className="absolute inset-0 p-4">
          <div className="space-y-1.5">
            <div className="h-1.5 w-9/12 rounded-full bg-foreground/12" />
            <div className="h-1 w-8/12 rounded-full bg-foreground/8" />
            <div className="h-1 w-7/12 rounded-full bg-foreground/8" />
            <div className="mt-2 h-1 w-10/12 rounded-full bg-foreground/6" />
            <div className="h-1 w-9/12 rounded-full bg-foreground/6" />
          </div>
        </div>
        <FileText
          size={14}
          strokeWidth={1.7}
          className="absolute right-3 top-3 text-muted-foreground/60"
        />
      </div>
      <div className="flex flex-col gap-1 px-3.5 py-3">
        <p className="truncate text-[13.5px] font-medium text-foreground">{doc.title}</p>
        <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
          <span>{doc.edited}</span>
          <span className="truncate pl-2">{doc.people.join(" • ")}</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------------- Templates ---------------- */

function TemplatesSection() {
  return (
    <section id="templates" className="mt-16 scroll-mt-24">
      <SectionHeader eyebrow="Build faster" title="Templates" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {TEMPLATES.map((t, i) => (
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
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => navigate({ to: "/editor" })}
      className="group flex items-center gap-4 rounded-xl border border-border-soft bg-white p-4 text-left shadow-[0_1px_2px_rgba(40,40,90,0.04)] transition-all duration-300 hover:shadow-[0_14px_30px_-16px_rgba(40,40,90,0.2)]"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary-soft to-white text-primary transition-transform group-hover:scale-105">
        <Icon size={20} strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-foreground">{title}</p>
        <p className="truncate text-[12px] text-muted-foreground">Open template</p>
      </div>
    </motion.button>
  );
}

/* ---------------- Floating create ---------------- */

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
        alert("Failed to create document. Check console or Firestore permissions: " + err.message);
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
