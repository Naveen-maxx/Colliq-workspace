import { db } from "../config";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from "firebase/firestore";

export type DocumentData = {
  id: string;
  title: string;
  content: any; // TipTap JSON
  ownerId: string;
  collaborators: string[];
  favorite: boolean;
  templateType: string | null;
  createdAt: any;
  updatedAt: any;
  lastOpenedAt: any;
  deleted: boolean;
};

/**
 * Scalable Firestore architecture for Documents.
 */

export async function createDocument(ownerId: string): Promise<string> {
  const docRef = doc(collection(db, "documents"));
  const newDoc: DocumentData = {
    id: docRef.id,
    title: "Untitled document",
    content: "", // Empty string to prevent TipTap from crashing on empty JSON object
    ownerId,
    collaborators: [],
    favorite: false,
    templateType: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastOpenedAt: serverTimestamp(),
    deleted: false,
  };
  await setDoc(docRef, newDoc);
  return docRef.id;
}

export async function getDocument(documentId: string): Promise<DocumentData | null> {
  const docRef = doc(db, "documents", documentId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  if (data.deleted) return null;
  
  // Optimistically update last opened
  updateDoc(docRef, { lastOpenedAt: serverTimestamp() }).catch(() => {});
  
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const docRef = doc(db, "documents", documentId);
  await updateDoc(docRef, { deleted: true });
}

export async function updateDocument(documentId: string, data: Partial<DocumentData>): Promise<void> {
  const docRef = doc(db, "documents", documentId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getRecentDocuments(ownerId: string): Promise<DocumentData[]> {
  // To avoid requiring users to manually create composite indexes during development,
  // we use a simple query and sort/filter locally. 
  // In production, this would use: where("ownerId", "==", ownerId), where("deleted", "==", false), orderBy("updatedAt", "desc")
  const q = query(
    collection(db, "documents"),
    where("ownerId", "==", ownerId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs
    .map(d => d.data() as DocumentData)
    .filter(d => !d.deleted);
    
  docs.sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
  
  return docs;
}
