import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function EditingOutline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10 px-3 py-1.5">{children}</span>

      {/* Dotted breathing outline */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-md"
        style={{
          border: "1.5px dashed var(--accent-warm)",
          backgroundColor: "color-mix(in oklab, var(--accent-warm) 7%, transparent)",
        }}
        animate={{
          opacity: [0.55, 1, 0.55],
          scale: [1, 1.01, 1],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Corner ticks */}
      {[
        { top: -4, left: -4 },
        { top: -4, right: -4 },
        { bottom: -4, left: -4 },
        { bottom: -4, right: -4 },
      ].map((pos, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-[2px]"
          style={{ backgroundColor: "var(--accent-warm)", ...pos }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
        />
      ))}

      {/* Hovering interacting cursor */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ color: "var(--accent-warm)" }}
        initial={{ x: -20, y: 18, opacity: 0 }}
        animate={{
          x: [-20, 10, 60, 30, -20],
          y: [18, 26, 12, 30, 18],
          opacity: [0.9, 1, 1, 1, 0.9],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="relative block">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="drop-shadow-sm">
            <path
              d="M3 2.5L18.5 11 11.5 12.5 8 19.5 3 2.5Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: "var(--accent-warm)" }}
          >
            Noah
          </span>
        </span>
      </motion.span>
    </span>
  );
}
