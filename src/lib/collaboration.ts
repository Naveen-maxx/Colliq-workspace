/**
 * collaboration.ts
 *
 * Manages Yjs document and y-websocket provider lifecycle.
 * - Provider URL is fully configurable via VITE_YJS_SERVER_URL
 * - SSR-safe: WebsocketProvider is only created in browser environments
 * - Single provider instance per documentId (ref-counted)
 * - Offline-safe: editor stays editable when disconnected
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollabProvider {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
}

interface ProviderCacheItem extends CollabProvider {
  refCount: number;
}

const cache = new Map<string, ProviderCacheItem>();

const COLLAB_SERVER_URL = (() => {
  // Must be set in .env as VITE_YJS_SERVER_URL
  const url = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_YJS_SERVER_URL;
  if (!url || url === '') {
    console.warn('[collab] VITE_YJS_SERVER_URL is not set. Using demo server for development.');
    return 'wss://demos.yjs.dev/ws';
  }
  return url.trim();
})();

/**
 * Get (or create) a shared Y.Doc + WebsocketProvider for a given document room.
 * The provider connects to `VITE_YJS_SERVER_URL` and uses the room name `colliq-{documentId}`.
 */
export function getCollabProvider(documentId: string): CollabProvider {
  const existing = cache.get(documentId);
  if (existing) {
    existing.refCount += 1;
    console.log(`[collab] Reusing provider for "${documentId}" (refCount=${existing.refCount})`);
    return { doc: existing.doc, provider: existing.provider };
  }

  const doc = new Y.Doc();
  let provider: WebsocketProvider | null = null;

  if (typeof window !== 'undefined') {
    const roomName = `colliq-${documentId}`;
    console.log(`[collab] Creating WebsocketProvider → server="${COLLAB_SERVER_URL}" room="${roomName}"`);
    provider = new WebsocketProvider(COLLAB_SERVER_URL, roomName, doc);
  }

  cache.set(documentId, { doc, provider, refCount: 1 });
  return { doc, provider };
}

/**
 * Decrement ref count. Destroys provider + doc when no more consumers.
 */
export function releaseCollabProvider(documentId: string): void {
  const item = cache.get(documentId);
  if (!item) return;

  item.refCount -= 1;
  console.log(`[collab] Released provider for "${documentId}" (refCount=${item.refCount})`);

  if (item.refCount <= 0) {
    item.provider?.destroy();
    item.doc.destroy();
    cache.delete(documentId);
    console.log(`[collab] Destroyed provider for "${documentId}"`);
  }
}
