import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Users,
  Link as LinkIcon,
  Globe,
  Lock,
  ChevronDown,
  Check,
  UserPlus,
  Loader2,
  Copy,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import {
  getCollaborators,
  addCollaboratorByEmail,
  removeCollaborator,
  updateCollaboratorRole,
  updateLinkSharing,
  type PermissionData,
  type Role
} from "@/firebase/firestore/sharing";
import * as Popover from "@radix-ui/react-popover";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  editor: "Editor",
  commenter: "Commenter",
  viewer: "Viewer"
};

const ROLE_DESC: Record<Role, string> = {
  owner: "Can edit and share",
  editor: "Can edit document",
  commenter: "Can comment",
  viewer: "Can view only"
};

export function ShareModal({
  documentId,
  document,
  isOpen,
  onClose,
  onUpdate
}: {
  documentId: string;
  document: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [shareMode, setShareMode] = useState<"restricted" | "anyone_with_link">(document.shareMode || "restricted");
  const [linkRole, setLinkRole] = useState<Role>(document.linkRole || "viewer");
  const [updatingLink, setUpdatingLink] = useState(false);

  const isOwner = document.ownerId === user?.uid;

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      setShareMode(document.shareMode || "restricted");
      setLinkRole(document.linkRole || "viewer");
      setInviteError(null);
      setInviteEmail("");
    }
  }, [isOpen, document.shareMode, document.linkRole]);

  async function loadCollaborators() {
    try {
      setLoading(true);
      const data = await getCollaborators(documentId);
      setCollaborators(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await addCollaboratorByEmail(documentId, inviteEmail.trim(), inviteRole);
      toast.success("User added successfully");
      setInviteEmail("");
      loadCollaborators();
      onUpdate();
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND") {
        setInviteError("User not found. This person must create a Colliq account before you can share documents with them.");
      } else {
        setInviteError("Failed to add user. Please try again.");
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleUpdateRole(userId: string, role: Role) {
    try {
      await updateCollaboratorRole(documentId, userId, role);
      setCollaborators(prev => prev.map(c => c.userId === userId ? { ...c, role } : c));
      toast.success("Role updated");
      onUpdate();
    } catch (err) {
      toast.error("Failed to update role");
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeCollaborator(documentId, userId);
      setCollaborators(prev => prev.filter(c => c.userId !== userId));
      toast.success("Access removed");
      onUpdate();
    } catch (err) {
      toast.error("Failed to remove access");
    }
  }

  async function handleLinkModeChange(mode: "restricted" | "anyone_with_link") {
    setUpdatingLink(true);
    try {
      await updateLinkSharing(documentId, mode, linkRole);
      setShareMode(mode);
      toast.success("Link sharing updated");
      onUpdate();
    } catch (err) {
      toast.error("Failed to update link sharing");
    } finally {
      setUpdatingLink(false);
    }
  }

  async function handleLinkRoleChange(role: Role) {
    setUpdatingLink(true);
    try {
      await updateLinkSharing(documentId, shareMode, role);
      setLinkRole(role);
      toast.success("Link role updated");
      onUpdate();
    } catch (err) {
      toast.error("Failed to update link role");
    } finally {
      setUpdatingLink(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/editor/${documentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  async function shareApp() {
    const data = {
      title: "Colliq Workspace",
      text: "Join me on Colliq, a new collaborative workspace!",
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success("Colliq link copied to clipboard");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative flex w-full max-w-[500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Share document</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Invite Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Add people via email..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                disabled={!isOwner}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
              <RoleDropdown
                value={inviteRole}
                onChange={setInviteRole}
                disabled={!isOwner}
                options={["editor", "commenter", "viewer"]}
              />
              <button
                onClick={handleInvite}
                disabled={!isOwner || !inviteEmail.trim() || inviting}
                className="flex h-[42px] items-center justify-center rounded-xl bg-primary px-4 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {inviting ? <Loader2 size={16} className="animate-spin" /> : "Invite"}
              </button>
            </div>

            {inviteError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium mb-2">{inviteError}</p>
                <div className="flex items-center gap-3 mt-3">
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Invite your friend to Colliq</p>
                  <div className="h-px flex-1 bg-amber-200" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    toast.success("Invite link copied");
                  }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200 transition-colors">
                    <Copy size={14} /> Copy Invite Link
                  </button>
                  <button onClick={shareApp} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                    <ExternalLink size={14} /> Share Colliq
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* People with Access */}
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            People with access
          </div>
          <div className="mb-6 flex flex-col gap-1 max-h-[180px] overflow-y-auto">
            {/* Owner Row */}
            <div className="flex items-center justify-between rounded-lg p-2 hover:bg-surface-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {getInitials(document.ownerId === user?.uid ? user?.displayName || "Me" : "Owner")}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {document.ownerId === user?.uid ? "You" : "Owner"}
                  </span>
                  <span className="text-xs text-muted-foreground">{document.ownerId === user?.uid ? user?.email : ""}</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground px-2">Owner</span>
            </div>

            {/* Collaborators */}
            {loading ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              collaborators.map(c => (
                <div key={c.userId} className="flex items-center justify-between rounded-lg p-2 hover:bg-surface-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-medium text-sm">
                        {getInitials(c.name || c.email)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{c.name || c.email}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </div>
                  </div>
                  {isOwner ? (
                    <RoleDropdown
                      value={c.role}
                      onChange={(role) => handleUpdateRole(c.userId, role)}
                      onRemove={() => handleRemove(c.userId)}
                      options={["editor", "commenter", "viewer"]}
                      showRemove
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground px-2">{ROLE_LABELS[c.role]}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* General Access (Link Sharing) */}
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            General access
          </div>
          <div className="flex items-start justify-between rounded-xl bg-surface-muted/30 p-3">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${shareMode === "anyone_with_link" ? "bg-green-100 text-green-700" : "bg-surface-muted text-muted-foreground"}`}>
                {shareMode === "anyone_with_link" ? <Globe size={18} /> : <Lock size={18} />}
              </div>
              <div className="flex flex-col gap-1">
                {isOwner ? (
                  <select
                    value={shareMode}
                    onChange={(e) => handleLinkModeChange(e.target.value as "restricted" | "anyone_with_link")}
                    className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="restricted">Restricted</option>
                    <option value="anyone_with_link">Anyone with the link</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {shareMode === "restricted" ? "Restricted" : "Anyone with the link"}
                  </span>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {shareMode === "restricted" 
                    ? "Only people with access can open with the link"
                    : "Anyone on the internet with the link can view"}
                </span>
              </div>
            </div>
            
            {shareMode === "anyone_with_link" && (
              isOwner ? (
                <RoleDropdown
                  value={linkRole}
                  onChange={handleLinkRoleChange}
                  options={["editor", "commenter", "viewer"]}
                />
              ) : (
                <span className="text-sm text-muted-foreground px-2 pt-1">{ROLE_LABELS[linkRole]}</span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 bg-surface-muted/20 px-5 py-4">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
          >
            <LinkIcon size={16} />
            Copy link
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleDropdown({
  value,
  onChange,
  onRemove,
  options,
  showRemove,
  disabled
}: {
  value: Role;
  onChange: (role: Role) => void;
  onRemove?: () => void;
  options: Role[];
  showRemove?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger disabled={disabled} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:hover:bg-transparent">
        {ROLE_LABELS[value]}
        {!disabled && <ChevronDown size={14} className="text-muted-foreground" />}
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content asChild align="end" sideOffset={4}>
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="z-[110] w-48 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-xl"
              >
                {options.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onChange(role);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>
                      <span className="text-[11px] text-muted-foreground">{ROLE_DESC[role]}</span>
                    </div>
                    {value === role && <Check size={16} className="text-primary" />}
                  </button>
                ))}
                {showRemove && (
                  <>
                    <div className="my-1 h-px bg-border-soft" />
                    <button
                      onClick={() => {
                        onRemove?.();
                        setOpen(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      Remove access
                    </button>
                  </>
                )}
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}
