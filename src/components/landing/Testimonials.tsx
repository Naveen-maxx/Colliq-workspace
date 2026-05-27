import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type Quote = {
  text: string;
  name: string;
  role: string;
  color: string;
};

const quotes: Quote[] = [
  {
    text: "It finally feels like our team works in the same room — even when we're on three continents.",
    name: "Priya Shah",
    role: "Design Lead, Northwind",
    color: "var(--cursor-violet)",
  },
  {
    text: "We replaced four tools with Colliq in a week. The cursors aren't a gimmick — they're how we think now.",
    name: "Marcus Lee",
    role: "Founder, Tideboard",
    color: "var(--cursor-blue)",
  },
  {
    text: "It's the first writing tool that feels emotionally calm. My team actually wants to open it in the morning.",
    name: "Sara Okafor",
    role: "Head of Content, Folio",
    color: "var(--cursor-pink)",
  },
  {
    text: "Reviews used to take a week of email chains. Now they happen in twenty minutes, in one document.",
    name: "Daniel Roth",
    role: "PM, Loomstack",
    color: "var(--cursor-teal)",
  },
  {
    text: "I'm a student and Colliq feels like the first tool that wasn't designed for spreadsheets first.",
    name: "Aiko Tanaka",
    role: "MSc, ETH Zürich",
    color: "var(--accent-violet)",
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((p) => (p + 1) % quotes.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  const q = quotes[i];

  return (
    <section id="testimonials" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary/80">
            Testimonials
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Hear what teams are saying.
          </h2>
        </div>

        <div
          className="relative mx-auto max-w-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-border-soft bg-white p-10 shadow-[0_24px_60px_-30px_rgba(40,40,90,0.2)] sm:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-display text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
                  “{q.text}”
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: q.color }}
                  >
                    {q.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold">{q.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">{q.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {quotes.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-6 bg-primary" : "w-1.5 bg-foreground/15 hover:bg-foreground/25"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous"
                onClick={() => setI((p) => (p - 1 + quotes.length) % quotes.length)}
                className="rounded-full border border-border-soft bg-white p-2 text-foreground/70 transition hover:text-foreground"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                aria-label={paused ? "Play" : "Pause"}
                onClick={() => setPaused((p) => !p)}
                className="rounded-full border border-border-soft bg-white p-2 text-foreground/70 transition hover:text-foreground"
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                aria-label="Next"
                onClick={() => setI((p) => (p + 1) % quotes.length)}
                className="rounded-full border border-border-soft bg-white p-2 text-foreground/70 transition hover:text-foreground"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
