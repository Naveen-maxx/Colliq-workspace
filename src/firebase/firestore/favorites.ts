import { db } from "../config";
import { doc, updateDoc, query, collection, where, getDocs, serverTimestamp } from "firebase/firestore";
import type { DocumentData } from "./documents";

/**
 * Scalable Firestore architecture for Favorites.
 */

export async function toggleFavorite(documentId: string, favorite: boolean) {
  const docRef = doc(db, "documents", documentId);
  await updateDoc(docRef, {
    favorite,
    updatedAt: serverTimestamp(),
  });
}

export async function getFavoriteDocuments(ownerId: string): Promise<DocumentData[]> {
  const q = query(
    collection(db, "documents"),
    where("ownerId", "==", ownerId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs
    .map(d => d.data() as DocumentData)
    .filter(d => !d.deleted && d.favorite);
    
  docs.sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
  
  return docs;
}
