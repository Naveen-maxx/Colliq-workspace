import { db } from "../config";
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

export type DocumentSnapshot = {
  id: string;
  documentId: string;
  title: string;
  content: any;
  summary: string;
  createdAt: any;
};

export async function createVersionSnapshot(documentId: string, title: string, content: any, summary: string = "Manual save") {
  const versionsRef = collection(db, "documents", documentId, "versions");
  const newSnapshotRef = doc(versionsRef);
  
  const snapshot: DocumentSnapshot = {
    id: newSnapshotRef.id,
    documentId,
    title,
    content,
    summary,
    createdAt: serverTimestamp(),
  };
  
  await setDoc(newSnapshotRef, snapshot);
  return snapshot;
}

export async function getDocumentVersions(documentId: string): Promise<DocumentSnapshot[]> {
  const versionsRef = collection(db, "documents", documentId, "versions");
  const q = query(versionsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  
  return snap.docs.map((d) => d.data() as DocumentSnapshot);
}
