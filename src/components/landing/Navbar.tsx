import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GhostButton, PrimaryButton } from "./primitives/Buttons";
import colliqLogo from "@/assets/landing/colliq-logo.png";

const links = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Why Colliq", href: "#why" },
  { label: "Testimonials", href: "#testimonials" },
];

function LogoMark() {
  return <img src={colliqLogo} alt="Colliq" className="h-12 w-12 object-contain" />;
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-border-soft bg-white/70 px-3 py-2 pl-4 shadow-[0_8px_30px_-12px_rgba(40,40,90,0.12)] backdrop-blur-xl"
      >
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[19px] font-semibold tracking-tight">Colliq</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/login">
            <GhostButton>Login</GhostButton>
          </Link>
          <Link to="/signup">
            <PrimaryButton className="!px-4 !py-2 text-[13px]">Get Started</PrimaryButton>
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="md:hidden rounded-full p-2 text-foreground/70 hover:bg-surface-muted"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-auto absolute top-16 mx-4 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border-soft bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-surface-muted"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border-soft pt-3">
                <Link to="/login" onClick={() => setOpen(false)}>
                  <GhostButton className="w-full">Login</GhostButton>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <PrimaryButton className="w-full">Get Started</PrimaryButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
