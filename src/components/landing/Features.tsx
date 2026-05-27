import { motion } from "framer-motion";
import { Cloud, Share2, Sparkles, Users, Lock, History, Globe, Zap } from "lucide-react";
import type { ReactNode } from "react";

function FeatureRow({
  eyebrow,
  title,
  copy,
  bullets,
  visual,
  flip = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  bullets: { icon: ReactNode; label: string }[];
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${flip ? "lg:[&>div:first-child]:order-2" : ""}`}
    >
      <div>{visual}</div>
      <div>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
          {eyebrow}
        </p>
        <h3 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          {title}
        </h3>
        <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">{copy}</p>
        <ul className="mt-7 space-y-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-3 text-[14.5px] text-foreground/85">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {b.icon}
              </span>
              {b.label}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ---------- Visuals ---------- */

function VisualRealtime() {
  const cursors = [
    { name: "Jake", color: "var(--cursor-blue)", x: "18%", y: "22%" },
    { name: "Emma", color: "var(--cursor-violet)", x: "62%", y: "48%" },
    { name: "Mia", color: "var(--cursor-pink)", x: "30%", y: "72%" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border-soft bg-white p-8 shadow-[0_24px_60px_-30px_rgba(40,40,90,0.25)]">
      <div className="flex items-center gap-1.5 pb-5">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.12_25)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.88_0.13_85)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.16_150)]" />
        <span className="ml-3 text-[11px] text-muted-foreground">team-roadmap.colliq</span>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-3/5 rounded bg-foreground/85" />
        <div className="h-2.5 w-full rounded bg-muted" />
        <div className="h-2.5 w-11/12 rounded bg-muted" />
        <div className="h-2.5 w-9/12 rounded bg-muted" />
        <div className="mt-5 h-2.5 w-4/5 rounded bg-muted" />
        <div className="h-2.5 w-3/4 rounded bg-muted" />
        <motion.div
          className="mt-5 h-7 rounded bg-[color-mix(in_oklab,var(--accent-warm)_18%,transparent)]"
          animate={{ width: ["20%", "55%", "20%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="h-2.5 w-2/3 rounded bg-muted" />
      </div>
      {cursors.map((c, i) => (
        <motion.div
          key={c.name}
          className="absolute"
          style={{ left: c.x, top: c.y, color: c.color }}
          animate={{ y: [0, -6, 0, 4, 0], x: [0, 5, -3, 2, 0] }}
          transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        >
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <path
              d="M3 2.5L18.5 11 11.5 12.5 8 19.5 3 2.5Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="ml-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: c.color }}
          >
            {c.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function VisualSharing() {
  const rows = [
    { name: "Emma Liu", role: "Can edit", color: "var(--cursor-violet)" },
    { name: "Jake Park", role: "Can comment", color: "var(--cursor-blue)" },
    { name: "Mia Adler", role: "Can view", color: "var(--cursor-pink)" },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border-soft bg-white p-7 shadow-[0_24px_60px_-30px_rgba(40,40,90,0.25)]">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium">Share “Q3 Launch Plan”</p>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary">
          Public link
        </span>
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border-soft bg-surface-muted px-3 py-2.5 text-[12.5px] text-muted-foreground">
        <Globe size={14} />
        colliq.app/d/q3-launch
        <span className="ml-auto rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
          Copy
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-xl border border-border-soft px-3 py-2.5"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{ backgroundColor: r.color }}
            >
              {r.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-medium">{r.name}</p>
              <p className="text-[11.5px] text-muted-foreground">{r.role}</p>
            </div>
            <Lock size={13} className="text-muted-foreground/60" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VisualCloud() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border-soft bg-white p-7 shadow-[0_24px_60px_-30px_rgba(40,40,90,0.25)]">
      <div className="mb-5 flex items-center gap-2 text-sm font-medium">
        <Cloud size={16} className="text-primary" /> Workspace
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          "Designs",
          "Notes",
          "Research",
          "Proposals",
          "Briefs",
          "Drafts",
          "Shared",
          "Archive",
          "Team",
        ].map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border-soft bg-surface-muted/60 p-3"
          >
            <div className="mb-2 h-12 rounded-md bg-white" />
            <p className="truncate text-[11.5px] font-medium">{name}</p>
            <p className="text-[10px] text-muted-foreground">Saved · just now</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11.5px] font-medium text-primary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Autosaved to cloud
      </motion.div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative bg-surface-muted/40 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
            What you'll feel
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            A workspace that moves at the speed of your team.
          </h2>
        </div>

        <div className="space-y-28">
          <FeatureRow
            eyebrow="Real-Time Editing"
            title="Edit together, in the same breath."
            copy="See every keystroke, every cursor, every idea as it lands. Colliq makes multiplayer editing feel as natural as thinking out loud."
            bullets={[
              { icon: <Users size={14} />, label: "Live cursors with name tags" },
              { icon: <Zap size={14} />, label: "Instant sync across every device" },
              { icon: <Sparkles size={14} />, label: "Collaborative writing that flows" },
            ]}
            visual={<VisualRealtime />}
          />
          <FeatureRow
            flip
            eyebrow="Smart Sharing"
            title="Share with intention, not friction."
            copy="One link, the right access, every time. Decide who can edit, comment, or just look — and change your mind whenever you want."
            bullets={[
              { icon: <Globe size={14} />, label: "Public or private workspace links" },
              { icon: <Lock size={14} />, label: "Edit, comment, and view permissions" },
              { icon: <Share2 size={14} />, label: "Secure collaboration by default" },
            ]}
            visual={<VisualSharing />}
          />
          <FeatureRow
            eyebrow="Cloud Workspace"
            title="Your work, always exactly where you left it."
            copy="Autosaved to the cloud, organized by intent, and ready on any device. Colliq remembers every version so you don't have to."
            bullets={[
              { icon: <Cloud size={14} />, label: "Autosave with cloud sync" },
              { icon: <History size={14} />, label: "Full version history" },
              { icon: <Globe size={14} />, label: "Access anywhere, from any device" },
            ]}
            visual={<VisualCloud />}
          />
        </div>
      </div>
    </section>
  );
}
