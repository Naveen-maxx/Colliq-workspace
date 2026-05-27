import { db } from "../config";

/**
 * Scalable Firestore architecture for Comments.
 * Features to implement in future phases:
 * - Add, resolve, and reply to comments in documents
 * - Track comment anchoring to TipTap marks
 */

export async function addComment(documentId: string, authorId: string, content: string) {
  // TODO: Implement comment creation
  throw new Error("Not implemented");
}
