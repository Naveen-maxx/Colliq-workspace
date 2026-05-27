import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const before = [
  "Endless file versions named “final-v7-FINAL”",
  "Scattered feedback across email and chat",
  "Disconnected communication, lost context",
  "Slow approvals that stall every project",
  "Messy collaboration with no source of truth",
];

const after = [
  "Live collaboration in a single shared canvas",
  "A workspace where context lives with the work",
  "Instant syncing across every device, always",
  "Streamlined teamwork that keeps moving",
  "Faster execution with one source of truth",
];

export function WhyColliq() {
  return (
    <section id="why" className="relative bg-surface-muted/40 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
            Why Colliq
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Goodbye, old workflows.
          </h2>
          <p className="mt-6 font-serif text-2xl italic text-foreground/80 sm:text-3xl">
            The way teams write is broken. We fixed it.
          </p>
          <p className="mt-5 text-[15.5px] text-muted-foreground">
            Here's what changes when you switch to Colliq.
          </p>
        </motion.div>

        <div className="relative mt-16 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border-soft bg-white/70 p-8"
          >
            <p className="mb-5 text-[12.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Before
            </p>
            <ul className="space-y-4">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[15px] text-foreground/75">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[oklch(0.94_0.05_25)] text-[oklch(0.55_0.18_25)]">
                    <X size={12} strokeWidth={3} />
                  </span>
                  <span className="line-through decoration-foreground/15">{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl border border-primary/15 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(80,60,200,0.25)]"
          >
            <div
              className="absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--primary) 40%, transparent), transparent 70%)",
              }}
            />
            <p className="mb-5 text-[12.5px] font-medium uppercase tracking-[0.14em] text-primary">
              With Colliq
            </p>
            <ul className="space-y-4">
              {after.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[15px] text-foreground/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
