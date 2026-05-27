# Project Architecture

Colliq Workspace is designed to scale securely while providing an elegant, smooth client-side experience.

## Routing Architecture

We utilize **TanStack Router** to manage all client-side navigation.

- The root layout is managed in `src/routes/__root.tsx`.
- Protected routes (such as `/workspace` and `/editor`) rely on `useAuth()` to verify Firebase authentication state before rendering, automatically redirecting unauthenticated users to `/login`.

## Firebase Structure

The Firebase integration is heavily modularized to support long-term scalability.

- **Initialization:** Handled globally in `src/firebase/config.ts` using Vite environment variables.
- **Authentication:** Wrapped in the `AuthContext` (`src/contexts/AuthContext.tsx`) which listens for `onAuthStateChanged`.
- **Firestore Operations:** Organized by domain in `src/firebase/firestore/`.
  - `documents.ts`
  - `comments.ts`
  - `favorites.ts`
  - `sharing.ts`
  - `templates.ts`

This domain-driven separation ensures our database queries don't pollute React components.

## Editor Architecture

The rich-text editor is built on top of **TipTap** (a headless ProseMirror wrapper).

- **Core Component:** `src/routes/editor.tsx` acts as the primary orchestrator for the editing space.
- **Custom Extensions:** Complex interactions like Slash Commands are implemented as custom TipTap extensions (`@tiptap/suggestion`) combined with `tippy.js` for robust DOM measuring and positioning.
- **Aesthetics over Convention:** The editor intentionally avoids the "Microsoft Word" aesthetic. We utilize minimal borders, custom `::selection` classes, and carefully curated spacing to ensure it feels like a modern startup workspace rather than enterprise software.

## Future Collaboration Architecture Plans

In future phases, the Editor will integrate a robust real-time synchronization backend.

- We plan to utilize CRDTs (Conflict-free Replicated Data Types), likely implemented via Yjs.
- This will hook into TipTap's collaborative extensions to broadcast operational transforms and sync multiplayer cursors over WebSockets.
- _Note:_ Do not implement these systems yet. The current phase is strictly focused on Firestore document persistence.
