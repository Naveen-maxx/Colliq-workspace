import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FilePlus,
  Home,
  Settings,
  Star,
  Clock,
  Users,
  LayoutTemplate,
  Search,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, getRecentDocuments, type DocumentData } from "@/firebase/firestore/documents";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Toggle with Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load documents when opened
  useEffect(() => {
    if (open && user) {
      getRecentDocuments(user.uid).then(setDocs).catch(() => {});
    }
  }, [open, user]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  const handleNewDoc = async () => {
    if (!user) return;
    const id = await createDocument(user.uid);
    navigate({ to: "/editor/$documentId", params: { documentId: id } });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] bg-black/15 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[22%] z-[101] w-[90vw] max-w-[560px] -translate-x-1/2"
          >
            <Command
              className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_24px_80px_-20px_rgba(40,40,90,0.3)]"
              loop
            >
              {/* Input */}
              <div className="flex items-center gap-2.5 border-b border-border-soft px-4">
                <Search size={16} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="h-12 w-full bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <kbd className="shrink-0 rounded-md border border-border-soft bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[360px] overflow-y-auto overscroll-contain p-2">
                <Command.Empty className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Search size={28} strokeWidth={1.2} className="mb-2 opacity-25" />
                  <p className="text-[13.5px] font-medium">No results found</p>
                </Command.Empty>

                {/* Actions */}
                <Command.Group heading="Actions">
                  <PaletteItem
                    icon={FilePlus}
                    label="Create new document"
                    shortcut="N"
                    onSelect={() => runCommand(handleNewDoc)}
                  />
                  <PaletteItem
                    icon={Home}
                    label="Go to Workspace"
                    onSelect={() => runCommand(() => navigate({ to: "/workspace" }))}
                  />
                  <PaletteItem
                    icon={Settings}
                    label="Open Settings"
                    onSelect={() => runCommand(() => navigate({ to: "/settings" }))}
                  />
                </Command.Group>

                {/* Navigate */}
                <Command.Group heading="Navigate">
                  <PaletteItem
                    icon={Clock}
                    label="Recent documents"
                    onSelect={() =>
                      runCommand(() => {
                        navigate({ to: "/workspace" });
                        setTimeout(() => document.getElementById("recent")?.scrollIntoView({ behavior: "smooth" }), 100);
                      })
                    }
                  />
                  <PaletteItem
                    icon={Star}
                    label="Favorites"
                    onSelect={() =>
                      runCommand(() => {
                        navigate({ to: "/workspace" });
                        setTimeout(() => document.getElementById("favorites")?.scrollIntoView({ behavior: "smooth" }), 100);
                      })
                    }
                  />
                  <PaletteItem
                    icon={Users}
                    label="Shared with you"
                    onSelect={() =>
                      runCommand(() => {
                        navigate({ to: "/workspace" });
                        setTimeout(() => document.getElementById("shared")?.scrollIntoView({ behavior: "smooth" }), 100);
                      })
                    }
                  />
                  <PaletteItem
                    icon={LayoutTemplate}
                    label="Templates"
                    onSelect={() =>
                      runCommand(() => {
                        navigate({ to: "/workspace" });
                        setTimeout(() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" }), 100);
                      })
                    }
                  />
                </Command.Group>

                {/* Documents */}
                {docs.length > 0 && (
                  <Command.Group heading="Documents">
                    {docs.slice(0, 10).map((doc) => (
                      <PaletteItem
                        key={doc.id}
                        icon={FileText}
                        label={doc.title}
                        onSelect={() =>
                          runCommand(() =>
                            navigate({ to: "/editor/$documentId", params: { documentId: doc.id } })
                          )
                        }
                      />
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-foreground/90 transition-colors aria-selected:bg-primary-soft aria-selected:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
    >
      <Icon size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground/80" />
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="ml-auto shrink-0 rounded-md border border-border-soft bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
