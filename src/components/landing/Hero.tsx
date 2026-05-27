import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "./primitives/Buttons";
import { CollabCursors } from "./CollabCursors";
import { EditingOutline } from "./EditingOutline";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-32">
      {/* Background ambience */}
      <div className="absolute inset-0 -z-10 bg-grid mask-fade-edges opacity-60" />
      <div
        className="absolute left-1/2 top-0 -z-10 h-[520px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--primary) 25%, transparent), transparent 65%)",
        }}
      />

      <CollabCursors />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground"
        >
          Work Together.
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-br from-primary via-[var(--accent-violet)] to-primary bg-clip-text text-transparent">
              Instantly.
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-muted-foreground sm:text-lg"
        >
          Colliq Workspace is a real-time collaborative workspace built for fast-moving teams to
          think, write, edit, collaborate, and share seamlessly — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-6"
        >
          <a href="/signup">
            <PrimaryButton className="!px-7 !py-3.5 text-[15px]">
              Start Collaborating
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </PrimaryButton>
          </a>

          <div className="mt-2 text-[13.5px] text-muted-foreground">
            <EditingOutline>Free to start • Real-time sync • Built for teams</EditingOutline>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
