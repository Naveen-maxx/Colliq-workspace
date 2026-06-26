/**
 * yjs-server.mjs
 * 
 * Minimal Yjs WebSocket server for local development.
 * Run with: node yjs-server.mjs
 * 
 * Set VITE_YJS_SERVER_URL=ws://localhost:1234 in your .env
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

const PORT = process.env.PORT || 1234;

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// Map of roomName -> { doc, awareness, connections: Set<WebSocket> }
const rooms = new Map();

function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    rooms.set(roomName, { doc, awareness, connections: new Set() });
    console.log(`[server] Created room: "${roomName}"`);
  }
  return rooms.get(roomName);
}

function safeSend(conn, data) {
  if (conn.readyState === conn.OPEN) {
    conn.send(data, (err) => {
      if (err) console.error('[server] send error:', err.message);
    });
  }
}

function broadcast(room, message, excludeConn = null) {
  room.connections.forEach((conn) => {
    if (conn !== excludeConn) {
      safeSend(conn, message);
    }
  });
}

function setupConnection(conn, req) {
  // Room name comes from the URL path, e.g. ws://localhost:1234/colliq-abc123
  const roomName = req.url.slice(1).split('?')[0];
  console.log(`[server] Client connected → room: "${roomName}"`);

  const room = getRoom(roomName);
  room.connections.add(conn);
  conn.binaryType = 'arraybuffer';

  // ── STEP 1: Send sync step 1 (share what we know) ──
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    safeSend(conn, encoding.toUint8Array(encoder));
  }

  // ── STEP 2: Send current awareness states ──
  const states = room.awareness.getStates();
  if (states.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys()))
    );
    safeSend(conn, encoding.toUint8Array(encoder));
  }

  // ── Listen to doc updates and forward to all other clients ──
  const docUpdateHandler = (update, origin) => {
    if (origin === conn) return; // Don't echo back
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(room, encoding.toUint8Array(encoder), null);
  };
  room.doc.on('update', docUpdateHandler);

  // ── Listen to awareness updates ──
  const awarenessUpdateHandler = ({ added, updated, removed }) => {
    const changedClients = [...added, ...updated, ...removed];
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
    );
    broadcast(room, encoding.toUint8Array(encoder), null);
  };
  room.awareness.on('update', awarenessUpdateHandler);

  // ── Handle incoming messages ──
  conn.on('message', (rawData) => {
    const buf = new Uint8Array(rawData);
    const decoder = decoding.createDecoder(buf);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_SYNC) {
      const replyEncoder = encoding.createEncoder();
      encoding.writeVarUint(replyEncoder, MESSAGE_SYNC);
      const syncType = syncProtocol.readSyncMessage(decoder, replyEncoder, room.doc, conn);

      // Send reply (sync step 2 or update) back to this client
      if (encoding.length(replyEncoder) > 1) {
        safeSend(conn, encoding.toUint8Array(replyEncoder));
      }

      // If this was a Yjs update, broadcast to all OTHER clients
      if (
        syncType === syncProtocol.messageYjsUpdate ||
        syncType === syncProtocol.messageYjsSyncStep2
      ) {
        broadcast(room, buf, conn);
      }
    } else if (messageType === MESSAGE_AWARENESS) {
      awarenessProtocol.applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        conn
      );
      // Awareness is already forwarded by the awareness update handler above
    }
  });

  // ── Cleanup on disconnect ──
  conn.on('close', () => {
    console.log(`[server] Client disconnected from room: "${roomName}"`);
    room.connections.delete(conn);
    room.doc.off('update', docUpdateHandler);
    room.awareness.off('update', awarenessUpdateHandler);

    // Remove this client's awareness state
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [conn.clientID].filter(Boolean),
      'connection closed'
    );

    // Clean up empty rooms
    if (room.connections.size === 0) {
      rooms.delete(roomName);
      console.log(`[server] Cleaned up empty room: "${roomName}"`);
    }
  });

  conn.on('error', (err) => {
    console.error(`[server] Connection error in room "${roomName}":`, err.message);
  });
}

const wss = new WebSocketServer({ port: PORT });
wss.on('connection', setupConnection);
wss.on('error', (err) => console.error('[server] WebSocket server error:', err));

console.log(`✅ Yjs WebSocket server running on ws://localhost:${PORT}`);
console.log(`   Set VITE_YJS_SERVER_URL=ws://localhost:${PORT} in your .env`);
