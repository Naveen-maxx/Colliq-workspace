/**
 * collaboration.ts
 *
 * SSR-safe Yjs provider factory.
 * - NEVER runs on the server (Node.js context)
 * - Single Y.Doc + WebsocketProvider per documentId per browser session
 * - Ref-counted so cleanup is safe when multiple mounts exist (e.g., React StrictMode)
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollabProvider {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
}

interface CacheEntry extends CollabProvider {
  refCount: number;
}

// Module-level cache — only ever populated in browser context
const cache = new Map<string, CacheEntry>();

function getServerUrl(): string {
  try {
    const url = (import.meta as any).env?.VITE_YJS_SERVER_URL;
    if (url && url.trim()) return url.trim();
  } catch {}
  return 'ws://localhost:1234';
}

/**
 * Get (or create) a cached Y.Doc + WebsocketProvider for a document.
 * Returns { doc, provider: null } during SSR — never cached server-side.
 */
export function getCollabProvider(documentId: string, connect: boolean = true): CollabProvider {
  // ── SSR guard ──────────────────────────────────────────────────────────────
  // The server has no WebSocket or BroadcastChannel. Return a throwaway doc.
  // This doc is NOT cached, so it doesn't leak between SSR requests.
  if (typeof window === 'undefined') {
    return { doc: new Y.Doc(), provider: null };
  }

  // ── Client: use cache ──────────────────────────────────────────────────────
  const existing = cache.get(documentId);
  if (existing) {
    existing.refCount += 1;
    console.log(`[collab] Reusing provider for "${documentId}" (refCount=${existing.refCount})`);
    return { doc: existing.doc, provider: existing.provider };
  }

  const doc = new Y.Doc();
  const serverUrl = getServerUrl();
  const roomName = `colliq-${documentId}`;

  console.log(`[collab] Creating provider → server="${serverUrl}" room="${roomName}"`);
  const provider = new WebsocketProvider(serverUrl, roomName, doc, { connect });

  cache.set(documentId, { doc, provider, refCount: 1 });
  return { doc, provider };
}

/**
 * Decrement ref count. Destroys provider + doc when refCount reaches zero.
 */
export function releaseCollabProvider(documentId: string): void {
  if (typeof window === 'undefined') return; // SSR: nothing to release

  const entry = cache.get(documentId);
  if (!entry) return;

  entry.refCount -= 1;
  console.log(`[collab] Released provider for "${documentId}" (refCount=${entry.refCount})`);

  if (entry.refCount <= 0) {
    entry.provider?.destroy();
    entry.doc.destroy();
    cache.delete(documentId);
    console.log(`[collab] Destroyed provider for "${documentId}"`);
  }
}
