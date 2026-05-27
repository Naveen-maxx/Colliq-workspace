import { motion } from "framer-motion";

type CursorProps = {
  name: string;
  color: string;
  initial: { x: string; y: string };
  pathX: string[];
  pathY: string[];
  duration: number;
  delay?: number;
};

function Cursor({ name, color, initial, pathX, pathY, duration, delay = 0 }: CursorProps) {
  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      initial={{ left: initial.x, top: initial.y, opacity: 0 }}
      animate={{
        left: pathX,
        top: pathY,
        opacity: [0, 1, 1, 1, 1, 1, 0.95],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      style={{ color }}
    >
      <div className="relative">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
        >
          <path
            d="M3 2.5L18.5 11 11.5 12.5 8 19.5 3 2.5Z"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="absolute left-4 top-5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      </div>
    </motion.div>
  );
}

export function CollabCursors() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Cursor
        name="Jake"
        color="var(--cursor-blue)"
        initial={{ x: "8%", y: "18%" }}
        pathX={["8%", "14%", "22%", "12%", "8%"]}
        pathY={["18%", "28%", "22%", "32%", "18%"]}
        duration={18}
      />
      <Cursor
        name="Emma"
        color="var(--cursor-violet)"
        initial={{ x: "82%", y: "22%" }}
        pathX={["82%", "76%", "88%", "78%", "82%"]}
        pathY={["22%", "30%", "36%", "26%", "22%"]}
        duration={22}
        delay={1.2}
      />
      <Cursor
        name="Alex"
        color="var(--cursor-teal)"
        initial={{ x: "14%", y: "72%" }}
        pathX={["14%", "20%", "10%", "18%", "14%"]}
        pathY={["72%", "66%", "78%", "82%", "72%"]}
        duration={20}
        delay={0.6}
      />
      <Cursor
        name="Mia"
        color="var(--cursor-pink)"
        initial={{ x: "84%", y: "74%" }}
        pathX={["84%", "78%", "88%", "82%", "84%"]}
        pathY={["74%", "80%", "68%", "76%", "74%"]}
        duration={24}
        delay={2}
      />
    </div>
  );
}
