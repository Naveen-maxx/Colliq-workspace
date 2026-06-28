import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";

/* ──────────────────────────────────────────────────────────────
   TYPES
────────────────────────────────────────────────────────────── */

export type CommentStatus = "open" | "resolved";

export interface CommentReply {
  replyId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  message: string;
  createdAt: any; // Firestore Timestamp
}

export interface CommentThread {
  commentId: string;
  documentId: string;
  selectedText: string;  // snapshot of highlighted text at creation time
  authorId: string;
  authorName: string;
  authorAvatar: string;
  message: string;
  status: CommentStatus;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: any;
  createdAt: any;
  updatedAt: any;
  replies?: CommentReply[]; // populated client-side from subcollection
}

/* ──────────────────────────────────────────────────────────────
   HELPERS — paths
────────────────────────────────────────────────────────────── */

const threadsCol = (documentId: string) =>
  collection(db, "comments", documentId, "threads");

const threadDoc = (documentId: string, commentId: string) =>
  doc(db, "comments", documentId, "threads", commentId);

const repliesCol = (documentId: string, commentId: string) =>
  collection(db, "comments", documentId, "threads", commentId, "replies");

const replyDoc = (documentId: string, commentId: string, replyId: string) =>
  doc(db, "comments", documentId, "threads", commentId, "replies", replyId);

/* ──────────────────────────────────────────────────────────────
   CREATE
────────────────────────────────────────────────────────────── */

export interface CreateCommentArgs {
  documentId: string;
  selectedText: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  message: string;
}

export async function createComment(args: CreateCommentArgs): Promise<CommentThread> {
  const ref = doc(threadsCol(args.documentId));
  const thread: CommentThread = {
    commentId: ref.id,
    documentId: args.documentId,
    selectedText: args.selectedText,
    authorId: args.authorId,
    authorName: args.authorName,
    authorAvatar: args.authorAvatar,
    message: args.message,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, thread);
  return { ...thread, createdAt: new Date(), updatedAt: new Date() };
}

/* ──────────────────────────────────────────────────────────────
   READ
────────────────────────────────────────────────────────────── */

async function _hydrateReplies(documentId: string, commentId: string): Promise<CommentReply[]> {
  const snap = await getDocs(
    query(repliesCol(documentId, commentId), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => d.data() as CommentReply);
}

export async function getComments(documentId: string): Promise<CommentThread[]> {
  const snap = await getDocs(
    query(threadsCol(documentId), orderBy("createdAt", "asc"))
  );
  const threads = snap.docs.map((d) => d.data() as CommentThread);

  // Hydrate replies for each thread
  await Promise.all(
    threads.map(async (t) => {
      t.replies = await _hydrateReplies(documentId, t.commentId);
    })
  );

  return threads;
}

/* ──────────────────────────────────────────────────────────────
   REAL-TIME SUBSCRIPTION
   Subscribes to thread-level changes. Replies are fetched on-demand.
────────────────────────────────────────────────────────────── */

export function subscribeToComments(
  documentId: string,
  onChange: (threads: CommentThread[]) => void
): Unsubscribe {
  const q = query(threadsCol(documentId), orderBy("createdAt", "asc"));

  return onSnapshot(q, async (snap) => {
    const threads = snap.docs.map((d) => d.data() as CommentThread);
    // Hydrate replies in parallel
    await Promise.all(
      threads.map(async (t) => {
        t.replies = await _hydrateReplies(documentId, t.commentId);
      })
    );
    onChange(threads);
  });
}

/* ──────────────────────────────────────────────────────────────
   REPLIES
────────────────────────────────────────────────────────────── */

export interface AddReplyArgs {
  documentId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  message: string;
}

export async function addReply(args: AddReplyArgs): Promise<CommentReply> {
  const ref = doc(repliesCol(args.documentId, args.commentId));
  const reply: CommentReply = {
    replyId: ref.id,
    authorId: args.authorId,
    authorName: args.authorName,
    authorAvatar: args.authorAvatar,
    message: args.message,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, reply);
  // Bump parent thread's updatedAt for real-time listener to re-fire
  await updateDoc(threadDoc(args.documentId, args.commentId), {
    updatedAt: serverTimestamp(),
  });
  return { ...reply, createdAt: new Date() };
}

/* ──────────────────────────────────────────────────────────────
   RESOLVE / REOPEN
────────────────────────────────────────────────────────────── */

export async function resolveComment(
  documentId: string,
  commentId: string,
  resolvedById: string,
  resolvedByName: string
): Promise<void> {
  await updateDoc(threadDoc(documentId, commentId), {
    status: "resolved",
    resolvedBy: resolvedById,
    resolvedByName,
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function reopenComment(documentId: string, commentId: string): Promise<void> {
  await updateDoc(threadDoc(documentId, commentId), {
    status: "open",
    resolvedBy: null,
    resolvedByName: null,
    resolvedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/* ──────────────────────────────────────────────────────────────
   DELETE
────────────────────────────────────────────────────────────── */

export async function deleteComment(documentId: string, commentId: string): Promise<void> {
  // Delete all replies first (Firestore doesn't cascade)
  const repliesSnap = await getDocs(repliesCol(documentId, commentId));
  const batch = writeBatch(db);
  repliesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(threadDoc(documentId, commentId));
  await batch.commit();
}
