import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import colliqLogo from "@/assets/landing/colliq-logo.png";

type CursorSpec = {
  name: string;
  color: string;
  start: { x: number; y: number };
  bounds: { x: [number, number]; y: [number, number] };
  delay: number;
  // behavior tuning per persona
  paceMs: [number, number]; // min/max wait between drifts
  stepRange: [number, number]; // % distance per move
  fadeIdle: boolean;
};

const CURSORS: CursorSpec[] = [
  {
    name: "Jake",
    color: "var(--cursor-blue)",
    start: { x: 18, y: 22 },
    bounds: { x: [8, 42], y: [14, 48] },
    delay: 0.2,
    paceMs: [900, 2400],
    stepRange: [6, 18],
    fadeIdle: false,
  },
  {
    name: "Emma",
    color: "var(--cursor-violet)",
    start: { x: 70, y: 30 },
    bounds: { x: [55, 88], y: [16, 52] },
    delay: 0.9,
    paceMs: [1400, 3200],
    stepRange: [4, 14],
    fadeIdle: true,
  },
  {
    name: "Mia",
    color: "var(--cursor-pink)",
    start: { x: 28, y: 74 },
    bounds: { x: [10, 48], y: [58, 88] },
    delay: 1.6,
    paceMs: [1100, 2800],
    stepRange: [5, 16],
    fadeIdle: false,
  },
  {
    name: "Alex",
    color: "var(--cursor-teal)",
    start: { x: 76, y: 70 },
    bounds: { x: [55, 90], y: [56, 86] },
    delay: 2.4,
    paceMs: [1800, 3600],
    stepRange: [4, 12],
    fadeIdle: true,
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function OrganicCursor({ c }: { c: CursorSpec }) {
  const x = useMotionValue(c.start.x);
  const y = useMotionValue(c.start.y);
  const opacity = useMotionValue(0);

  const left = useTransform(x, (v) => `${v}%`);
  const top = useTransform(y, (v) => `${v}%`);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      await wait(c.delay * 1000);
      animate(opacity, 1, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });

      while (alive) {
        // pick next organic target
        const angle = rand(0, Math.PI * 2);
        const dist = rand(c.stepRange[0], c.stepRange[1]);
        const nx = clamp(x.get() + Math.cos(angle) * dist, c.bounds.x[0], c.bounds.x[1]);
        const ny = clamp(y.get() + Math.sin(angle) * dist, c.bounds.y[0], c.bounds.y[1]);

        const dur = rand(1.6, 3.4);
        const ease: [number, number, number, number] = [0.42, 0, 0.2, 1];

        await Promise.all([
          animate(x, nx, { duration: dur, ease }).finished,
          animate(y, ny, { duration: dur * rand(0.85, 1.15), ease }).finished,
        ]);

        // occasional idle fade
        if (c.fadeIdle && Math.random() < 0.35) {
          await animate(opacity, 0.4, { duration: 0.9, ease: "easeOut" }).finished;
          await wait(rand(1200, 2400));
          if (!alive) return;
          animate(opacity, 1, { duration: 0.9, ease: "easeOut" });
        }

        // small organic pause
        await wait(rand(c.paceMs[0], c.paceMs[1]));
      }
    };

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      style={{ left, top, opacity, color: c.color }}
    >
      <div className="relative -translate-x-1 -translate-y-1">
        <svg
          width="20"
          height="20"
          viewBox="0 0 22 22"
          fill="none"
          className="drop-shadow-[0_3px_6px_rgba(20,20,40,0.14)]"
        >
          <path
            d="M3 2.5L18.5 11 11.5 12.5 8 19.5 3 2.5Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="absolute left-4 top-5 whitespace-nowrap rounded-full px-2 py-[3px] text-[10.5px] font-medium text-white shadow-[0_4px_10px_-2px_rgba(20,20,40,0.18)]"
          style={{ backgroundColor: c.color }}
        >
          {c.name}
        </span>
      </div>
    </motion.div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  side,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  side: "login" | "signup";
}) {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-grid mask-fade-edges opacity-[0.22]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* LEFT — brand panel */}
        <div className="relative hidden overflow-hidden border-r border-border-soft lg:block">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 55%), radial-gradient(80% 70% at 100% 100%, color-mix(in oklab, var(--accent-violet) 14%, transparent), transparent 60%)",
            }}
          />

          {CURSORS.map((c) => (
            <OrganicCursor key={c.name} c={c} />
          ))}

          <div className="relative flex h-full flex-col justify-between p-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src={colliqLogo} alt="Colliq" className="h-14 w-14 object-contain" />
              <span className="font-display text-[20px] font-semibold tracking-tight">Colliq</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md"
            >
              <h2 className="font-display text-[40px] leading-[1.05] tracking-tight">
                Where teams
                <br />
                <span className="italic font-serif text-[44px]">think together.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Colliq Workspace is a real-time collaborative workspace built for fast-moving teams
                to think, write, edit, collaborate, and share seamlessly — all in one place.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["#7c6cf2", "#ec6aa0", "#52b6c4", "#f0a955"].map((c, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Joining <span className="font-medium text-foreground">12,400+</span> creators &
                  teams
                </p>
              </div>
            </motion.div>

            <div className="space-y-1">
              <p className="text-[12px] tracking-[0.02em] text-muted-foreground/80">
                Realtime collaboration, reimagined.
              </p>
              <p className="text-[12px] text-muted-foreground/70">
                © {new Date().getFullYear()} Colliq Workspace
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="absolute left-5 top-5 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={colliqLogo} alt="Colliq" className="h-11 w-11 object-contain" />
              <span className="font-display text-[18px] font-semibold">Colliq</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            <div className="mb-8">
              <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            <p className="mt-8 text-center text-[13.5px] text-muted-foreground">
              {side === "login" ? (
                <>
                  New to Colliq?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Log in
                  </Link>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
