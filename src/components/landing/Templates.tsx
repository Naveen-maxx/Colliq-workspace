import { motion } from "framer-motion";
import { FileText, NotebookPen, BookOpen, Rocket, Mail, Layout, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { PrimaryButton } from "./primitives/Buttons";

type Tpl = {
  name: string;
  tag: string;
  icon: ReactNode;
  tint: string;
};

const templates: Tpl[] = [
  { name: "Resume", tag: "Personal", icon: <FileText size={16} />, tint: "var(--cursor-blue)" },
  {
    name: "Meeting Notes",
    tag: "Team",
    icon: <NotebookPen size={16} />,
    tint: "var(--cursor-violet)",
  },
  {
    name: "Research Notes",
    tag: "Study",
    icon: <BookOpen size={16} />,
    tint: "var(--cursor-teal)",
  },
  {
    name: "Product Proposal",
    tag: "Startup",
    icon: <Rocket size={16} />,
    tint: "var(--accent-warm)",
  },
  { name: "Letter", tag: "Personal", icon: <Mail size={16} />, tint: "var(--cursor-pink)" },
  { name: "Brochure", tag: "Marketing", icon: <Layout size={16} />, tint: "var(--primary)" },
];

function PaperPreview({ tint }: { tint: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border-soft bg-white p-4">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: tint }} />
      <div className="mt-2 h-3 w-1/2 rounded bg-foreground/80" />
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-muted" />
        <div className="h-1.5 w-11/12 rounded bg-muted" />
        <div className="h-1.5 w-10/12 rounded bg-muted" />
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 w-4/5 rounded bg-muted" />
        <div className="h-1.5 w-3/5 rounded bg-muted" />
      </div>
      <div
        className="absolute bottom-3 right-3 h-6 w-6 rounded-md"
        style={{ background: `color-mix(in oklab, ${tint} 22%, white)` }}
      />
    </div>
  );
}

export function Templates() {
  return (
    <section id="templates" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
            Templates
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Templates built for real work.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
            From meeting notes to proposals, Colliq helps teams move faster with beautifully crafted
            templates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.button
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-border-soft bg-white p-4 text-left shadow-[0_2px_0_rgba(40,40,90,0.02)] transition-shadow hover:shadow-[0_24px_50px_-24px_rgba(40,40,90,0.22)]"
            >
              <PaperPreview tint={t.tint} />
              <div className="mt-4 flex items-center justify-between px-1">
                <div>
                  <p className="text-[14.5px] font-semibold tracking-tight">{t.name}</p>
                  <p className="text-[12px] text-muted-foreground">{t.tag}</p>
                </div>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                  style={{}}
                >
                  {t.icon}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 flex justify-center"
        >
          <PrimaryButton className="!px-7 !py-3.5 text-[15px]">
            Explore Templates
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </PrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}
