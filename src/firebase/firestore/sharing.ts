import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../config";
import { updateDocument } from "./documents";

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
 * Fetch all collaborators for a document
 */
export async function getCollaborators(documentId: string): Promise<PermissionData[]> {
  const permsRef = collection(db, "document_permissions", documentId, "users");
  const snap = await getDocs(permsRef);
  return snap.docs.map(d => d.data() as PermissionData);
}

/**
 * Add a collaborator by email.
 * Looks up the email in the users collection. Throws an error if not found.
 */
export async function addCollaboratorByEmail(documentId: string, email: string, role: Role): Promise<PermissionData> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("USER_NOT_FOUND");
  }

  const userDoc = snap.docs[0].data();
  const userId = userDoc.uid;

  const permissionRef = doc(db, "document_permissions", documentId, "users", userId);
  
  const permData: PermissionData = {
    userId,
    email: userDoc.email,
    name: userDoc.displayName || email.split("@")[0],
    avatar: userDoc.photoURL || "",
    role,
    addedAt: serverTimestamp()
  };

  await setDoc(permissionRef, permData);
  return permData;
}

/**
 * Remove a collaborator
 */
export async function removeCollaborator(documentId: string, userId: string): Promise<void> {
  const permissionRef = doc(db, "document_permissions", documentId, "users", userId);
  await deleteDoc(permissionRef);
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
