import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths(), tanstackStart(), react()],
  // Ensure Yjs and y-websocket are treated as client-only packages.
  // They use browser APIs (WebSocket, BroadcastChannel) that don't exist in Node.js.
  ssr: {
    noExternal: [
      "yjs",
      "y-websocket",
      "y-protocols",
      "lib0",
      "@tiptap/extension-collaboration",
      "@tiptap/extension-collaboration-cursor",
      "@tiptap/y-tiptap",
    ],
  },
  optimizeDeps: {
    exclude: ["yjs", "y-websocket"],
  },
});
