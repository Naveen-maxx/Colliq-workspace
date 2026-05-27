import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { PrimaryButton } from "./primitives/Buttons";
import img1 from "@/assets/landing/collab-1.jpg";
import img2 from "@/assets/landing/collab-2.jpg";
import img3 from "@/assets/landing/collab-3.jpg";
import img4 from "@/assets/landing/collab-4.jpg";

const images = [img1, img2, img3, img4];
const bullets = [
  "Real-time collaboration without interruptions",
  "Seamless teamwork from anywhere in the world",
  "Faster workflows with live multiplayer editing",
  "A beautiful, calm workspace experience",
];

function MarqueeColumn({ reverse = false, delay = 0 }: { reverse?: boolean; delay?: number }) {
  const loop = [...images, ...images];
  return (
    <div className="relative flex-1 overflow-hidden">
      <motion.div
        className="flex flex-col gap-4"
        animate={{ y: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear", delay }}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_8px_24px_-14px_rgba(40,40,90,0.18)]"
          >
            <img
              src={src}
              alt=""
              width={768}
              height={768}
              loading="lazy"
              className="block h-auto w-full"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left: animated showcase */}
        <div className="relative h-[520px] overflow-hidden rounded-3xl border border-border-soft bg-surface-muted/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] marquee-mask">
          <div className="flex h-full gap-3">
            <MarqueeColumn />
            <MarqueeColumn reverse delay={1.2} />
          </div>
        </div>

        {/* Right: copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
            Built for teams that move
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Loved by fast-moving teams, creators, and students.
          </h2>

          <ul className="mt-8 space-y-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-[15px] text-foreground/80">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <PrimaryButton className="!px-6">
              Start Exploring
              <ArrowRight size={16} />
            </PrimaryButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
