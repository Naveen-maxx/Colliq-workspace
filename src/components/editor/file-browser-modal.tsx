import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, FileText, Star, Clock, Users, LayoutTemplate } from "lucide-react";
import { getRecentDocuments, type DocumentData } from "@/firebase/firestore/documents";
import { auth } from "@/firebase/config";
import { useNavigate } from "@tanstack/react-router";

export function FileBrowserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"recents" | "favorites" | "shared" | "templates">("recents");
  const [search, setSearch] = useState("");
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      setLoading(true);
      getRecentDocuments(auth.currentUser.uid).then((data) => {
        setDocs(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const filteredDocs = docs.filter((doc) => {
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === "recents") return true;
    if (activeTab === "favorites") return doc.favorite;
    if (activeTab === "shared") return false; // Future
    if (activeTab === "templates") return doc.templateType !== null;
    return true;
  });

  const handleOpenDoc = (id: string) => {
    onClose();
    navigate({ to: "/editor/$documentId", params: { documentId: id } });
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
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[90vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 flex-col gap-4 border-b border-border-soft p-5 pb-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Open Document</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border-soft bg-surface-muted py-2.5 pl-9 pr-4 text-[14px] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1">
                <TabButton active={activeTab === "recents"} onClick={() => setActiveTab("recents")} icon={Clock} label="Recents" />
                <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} icon={Star} label="Favorites" />
                <TabButton active={activeTab === "shared"} onClick={() => setActiveTab("shared")} icon={Users} label="Shared" />
                <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={LayoutTemplate} label="Templates" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAFA]">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredDocs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleOpenDoc(doc.id)}
                      className="group flex flex-col items-center text-left"
                    >
                      <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-white p-4 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/30">
                        {doc.favorite && (
                          <div className="absolute right-2 top-2 text-amber-400">
                            <Star size={14} fill="currentColor" />
                          </div>
                        )}
                        <FileText size={32} strokeWidth={1} className="text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
                      </div>
                      <div className="mt-2.5 w-full">
                        <p className="truncate text-[13px] font-medium text-foreground">{doc.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {doc.updatedAt ? new Date(doc.updatedAt.toMillis?.() || Date.now()).toLocaleDateString() : "Just now"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p className="text-[14px]">No documents found.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon size={15} />
      {label}
      {active && (
        <motion.div
          layoutId="modal-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
