import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { auth } from "@/firebase/config";
import { updateProfile, sendPasswordResetEmail, signOut, type User } from "firebase/auth";
import { getRecentDocuments } from "@/firebase/firestore/documents";
import { upsertUserProfile } from "@/firebase/firestore";
import { uploadImage } from "@/services/cloudinary/uploadImage";
import { ChevronLeft, Camera, Loader2, Copy, LogOut, Check } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);
  const [stats, setStats] = useState({ documents: 0, favorites: 0, templates: 0 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u: User | null) => {
      if (!u) {
        navigate({ to: "/login" });
      } else {
        setUser(u);
        setLoading(false);
        // Fetch stats
        getRecentDocuments(u.uid).then((docs) => {
          setStats({
            documents: docs.length,
            favorites: docs.filter((d) => d.favorite).length,
            templates: docs.filter((d) => d.templateType).length,
          });
        });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      await updateProfile(user, { photoURL: url });
      await upsertUserProfile(user);
      // Force re-render with new user object
      setUser({ ...user });
    } catch (err: any) {
      alert(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasswordReset = async () => {
    try {
      setResetError("");
      await sendPasswordResetEmail(auth, user.email!);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Colliq Workspace",
      text: "Colliq Workspace is a real-time collaborative workspace built for fast-moving teams to think, write, edit, collaborate, and share seamlessly — all in one place.",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate({ to: "/login" });
  };

  const joinDate = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-foreground font-sans">
      <div className="mx-auto max-w-2xl px-6 py-12 md:py-20">
        {/* Back Button */}
        <Link
          to="/workspace"
          className="group mb-8 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Workspace
        </Link>

        <h1 className="mb-10 text-3xl font-semibold tracking-tight text-foreground">Settings</h1>

        <div className="flex flex-col gap-12">
          {/* Section 1: User Identity */}
          <section className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div
              className="group relative h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-border-soft bg-surface-muted shadow-sm transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
              onClick={handleAvatarClick}
            >
              {uploadingAvatar ? (
                <div className="flex h-full w-full items-center justify-center bg-black/5">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-semibold text-primary">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="text-white" size={24} />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h2 className="text-2xl font-medium tracking-tight text-foreground">
                {user.displayName || "Member"}
              </h2>
              <p className="mt-1 text-[14.5px] text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground/70">Joined {joinDate}</p>
            </div>
          </section>

          <hr className="border-border-soft" />

          {/* Section 2: User Stats */}
          <section>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Activity</h3>
            <div className="flex flex-wrap gap-4 sm:gap-8 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
              <div className="flex flex-col">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{stats.documents}</span>
                <span className="text-[13px] font-medium text-muted-foreground">Documents Created</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{stats.favorites}</span>
                <span className="text-[13px] font-medium text-muted-foreground">Favorites</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{stats.templates}</span>
                <span className="text-[13px] font-medium text-muted-foreground">Templates Used</span>
              </div>
            </div>
          </section>

          <hr className="border-border-soft" />

          {/* Section 3: Password Reset */}
          <section>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Security</h3>
            <div className="flex items-center justify-between rounded-xl border border-border-soft bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-[14.5px] font-medium text-foreground">Password Reset</p>
                <p className="text-[13px] text-muted-foreground">Send a secure link to {user.email}</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={resetSent}
                className="rounded-lg bg-surface-muted px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                {resetSent ? "Sent!" : "Send Email"}
              </button>
            </div>
            {resetError && <p className="mt-2 text-[13px] text-red-500">{resetError}</p>}
          </section>

          <hr className="border-border-soft" />

          {/* Section 4: Share Colliq */}
          <section>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Share Colliq</h3>
            <div className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
              <p className="mb-4 text-[14.5px] leading-relaxed text-muted-foreground">
                Colliq Workspace is a real-time collaborative workspace built for fast-moving teams to think, write, edit, collaborate, and share seamlessly — all in one place.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-lg border border-border-soft bg-[#FAFAFA] px-3 py-2 text-[13px] text-muted-foreground">
                  {window.location.origin}
                </div>
                <button
                  onClick={handleShare}
                  className="flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>
          </section>

          <hr className="border-border-soft" />

          {/* Section 5: Logout */}
          <section className="flex justify-start">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              Sign out of Colliq
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
