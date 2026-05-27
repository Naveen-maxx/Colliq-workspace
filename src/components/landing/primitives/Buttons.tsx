import { motion } from "framer-motion";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

export function PrimaryButton({ children, className = "", ...rest }: Props) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] ring-1 ring-inset ring-white/10 transition-shadow hover:shadow-[0_14px_32px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({ children, className = "", ...rest }: Props) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-foreground/80 hover:bg-surface-muted hover:text-foreground ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
