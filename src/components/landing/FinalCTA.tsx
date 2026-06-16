import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "./primitives/Buttons";

export function FinalCTA() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2rem] border border-border-soft bg-white px-8 py-20 text-center shadow-[0_30px_80px_-40px_rgba(40,40,90,0.25)] sm:px-12"
        >
          <div
            className="absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at 30% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 60%), radial-gradient(ellipse at 80% 100%, color-mix(in oklab, var(--accent-violet) 18%, transparent), transparent 60%)",
            }}
          />
          <h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            Start collaborating smarter.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
            Write, edit, and work together in real time with a workspace designed for modern teams.
          </p>
          <div className="mt-10 flex justify-center">
            <a href="/signup">
              <PrimaryButton className="!px-8 !py-4 text-[15px]">
                Get Started Free <ArrowRight size={16} />
              </PrimaryButton>
            </a>
          </div>
          <p className="mt-5 text-[12.5px] text-muted-foreground">
            Free forever for small teams
          </p>
        </motion.div>
      </div>
    </section>
  );
}
