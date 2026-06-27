import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, where, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../config";
import { updateDocument } from "./documents";
import { removeSharedDocumentAccess } from "./shared_access";

export type Role = "owner" | "editor" | "commenter" | "viewer";

export interface PermissionData {
  userId: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
  addedAt: any;
}

/**
 * Fetch all collaborators for a document.
 * Returns an empty array on any failure to avoid blocking the UI.
 */
export async function getCollaborators(documentId: string): Promise<PermissionData[]> {
  const path = `document_permissions/${documentId}/users`;
  console.log(`[sharing] getCollaborators → querying Firestore path: "${path}"`);
  try {
    const permsRef = collection(db, "document_permissions", documentId, "users");
    const snap = await getDocs(permsRef);
    const results = snap.docs.map(d => d.data() as PermissionData);
    console.log(`[sharing] getCollaborators → found ${results.length} collaborator(s)`, results.map(r => ({ userId: r.userId, email: r.email, role: r.role })));
    return results;
  } catch (err: any) {
    console.error(`[sharing] getCollaborators FAILED for path "${path}"`, {
      code: err?.code,
      message: err?.message,
      err,
    });
    // Return empty instead of throwing so callers can handle gracefully
    return [];
  }
}

/**
 * Add a collaborator by email.
 * Looks up the email in the users collection. Throws an error if not found.
 */
export async function addCollaboratorByEmail(documentId: string, rawEmail: string, role: Role): Promise<PermissionData> {
  // Normalize email to lowercase to avoid case-sensitivity issues
  const email = rawEmail.trim().toLowerCase();
  console.log(`[sharing] addCollaboratorByEmail → looking up email: "${email}" in collection: "users"`);

  let userId: string | null = null;
  let userDoc: any = null;

  // --- Strategy 1: Query by email field ---
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snap = await getDocs(q);

    console.log(`[sharing] email query result count: ${snap.size}`);

    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      userDoc = firstDoc.data();
      userId = userDoc.uid || firstDoc.id;
      console.log(`[sharing] found user via email query → userId: "${userId}", email: "${userDoc.email}"`);
    }
  } catch (err: any) {
    console.error(`[sharing] email query FAILED`, { code: err?.code, message: err?.message, err });
    throw new Error(`QUERY_ERROR: ${err?.message}`);
  }

  if (!userId || !userDoc) {
    console.warn(`[sharing] user not found for email: "${email}"`);
    throw new Error("USER_NOT_FOUND");
  }

  // Write the permission entry
  const permissionRef = doc(db, "document_permissions", documentId, "users", userId);
  const permData: PermissionData = {
    userId,
    email: userDoc.email ?? email,
    name: userDoc.displayName || email.split("@")[0],
    avatar: userDoc.photoURL || "",
    role,
    addedAt: serverTimestamp()
  };

  console.log(`[sharing] writing permission to document_permissions/${documentId}/users/${userId}`, permData);
  await setDoc(permissionRef, permData);
  console.log(`[sharing] permission written successfully`);
  return permData;
}

/**
 * Remove a collaborator and clean up their shared_access log entry.
 */
export async function removeCollaborator(documentId: string, userId: string): Promise<void> {
  const permissionRef = doc(db, "document_permissions", documentId, "users", userId);
  await deleteDoc(permissionRef);
  // Also remove the Workspace "Shared with you" entry for immediate revocation
  await removeSharedDocumentAccess(userId, documentId);
}

/**
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(documentId: string, userId: string, role: Role): Promise<void> {
  const permissionRef = doc(db, "document_permissions", documentId, "users", userId);
  await updateDoc(permissionRef, { role });
}

/**
 * Update link sharing settings for the document
 */
export async function updateLinkSharing(documentId: string, shareMode: "restricted" | "anyone_with_link", linkRole: Role): Promise<void> {
  await updateDocument(documentId, {
    shareMode,
    linkRole: linkRole as "viewer" | "commenter" | "editor"
  });
}
