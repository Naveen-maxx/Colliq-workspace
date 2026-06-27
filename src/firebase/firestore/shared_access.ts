import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import type { Role } from "./sharing";
import type { DocumentData } from "./documents";

export interface SharedAccessEntry {
  documentId: string;
  accessedAt: any; // Firestore Timestamp
  accessType: "invite" | "link";
  role: Role;
  ownerName?: string;
}

export interface SharedDocumentCard extends Omit<DocumentData, "content"> {
  /** The accessor's role for this document */
  accessRole: Role;
  /** When was the shared_access entry first created (used for sorting) */
  accessedAt: any;
  /** Display name of the document owner */
  ownerName: string;
}

/**
 * Log (or update) a shared document access record for a user.
 * Called when a non-owner successfully opens a shared document.
 */
export async function logSharedDocumentAccess(
  userId: string,
  documentId: string,
  role: Role,
  accessType: "invite" | "link"
): Promise<void> {
  const ref = doc(db, "users", userId, "shared_access", documentId);
  // Use setDoc with merge so we don't overwrite an older accessedAt if already logged
  const existing = await getDoc(ref);
  const entry: SharedAccessEntry = {
    documentId,
    accessedAt: existing.exists() ? existing.data().accessedAt : serverTimestamp(),
    accessType,
    role,
  };
  await setDoc(ref, entry, { merge: true });
}

/**
 * Remove a shared document access record for a user.
 * Called when an owner revokes access.
 */
export async function removeSharedDocumentAccess(
  userId: string,
  documentId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "shared_access", documentId);
  await deleteDoc(ref).catch(() => {
    // Silently ignore — the record may never have been created if the
    // collaborator was added but never opened the document.
  });
}

/**
 * Fetch all shared documents for a user.
 * Queries the user's shared_access collection, fetches corresponding document
 * data in parallel, and filters out deleted/revoked documents.
 * Returns results sorted by most recently accessed first.
 */
export async function getSharedDocuments(userId: string): Promise<SharedDocumentCard[]> {
  try {
    const accessRef = collection(db, "users", userId, "shared_access");
    const q = query(accessRef, orderBy("accessedAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) return [];

    const entries = snap.docs.map((d) => d.data() as SharedAccessEntry);

    // Fetch each referenced document in parallel
    const results = await Promise.all(
      entries.map(async (entry) => {
        try {
          const docRef = doc(db, "documents", entry.documentId);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) return null;
          const docData = docSnap.data() as DocumentData;

          // Skip soft-deleted documents
          if (docData.deleted) return null;

          // Verify access is still valid
          const isInvited = await _checkInviteAccess(userId, entry.documentId);
          const isLinkShared = docData.shareMode === "anyone_with_link";

          if (!isInvited && !isLinkShared) {
            // Access was revoked — clean up the stale entry
            removeSharedDocumentAccess(userId, entry.documentId).catch(() => {});
            return null;
          }

          // Fetch owner name for display
          const ownerName = await _getOwnerName(docData.ownerId);

          const card: SharedDocumentCard = {
            id: docData.id,
            title: docData.title,
            ownerId: docData.ownerId,
            collaborators: docData.collaborators,
            favorite: docData.favorite,
            templateType: docData.templateType,
            createdAt: docData.createdAt,
            updatedAt: docData.updatedAt,
            lastOpenedAt: docData.lastOpenedAt,
            deleted: docData.deleted,
            shareMode: docData.shareMode,
            linkRole: docData.linkRole,
            accessRole: entry.role,
            accessedAt: entry.accessedAt,
            ownerName,
          };
          return card;
        } catch {
          return null;
        }
      })
    );

    return results.filter((r): r is SharedDocumentCard => r !== null);
  } catch (err) {
    console.error("[shared_access] getSharedDocuments failed", err);
    return [];
  }
}

/** Check if user has an explicit invite in document_permissions */
async function _checkInviteAccess(userId: string, documentId: string): Promise<boolean> {
  try {
    const permRef = doc(db, "document_permissions", documentId, "users", userId);
    const snap = await getDoc(permRef);
    return snap.exists();
  } catch {
    return false;
  }
}

/** Fetch owner display name from the users collection */
async function _getOwnerName(ownerId: string): Promise<string> {
  try {
    const userRef = doc(db, "users", ownerId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return "Someone";
    const data = snap.data();
    return data.displayName || data.email?.split("@")[0] || "Someone";
  } catch {
    return "Someone";
  }
}
