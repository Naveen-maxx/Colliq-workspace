import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./config";

/**
 * Writes/updates the user profile document.
 * NOTE: This is intentionally non-throwing — Firestore failures (rules, network,
 * Firestore not enabled) must NOT break the auth flow. Errors are logged.
 */
export async function upsertUserProfile(user: User, extra?: { displayName?: string }) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const base = {
      uid: user.uid,
      email: user.email,
      displayName: extra?.displayName ?? user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
      console.log("[firestore] created user profile", user.uid);
    } else {
      await setDoc(ref, base, { merge: true });
      console.log("[firestore] updated user profile", user.uid);
    }
  } catch (err) {
    // Do not throw — auth has already succeeded. Profile can be backfilled later.
    console.error("[firestore] upsertUserProfile failed (non-fatal):", err);
  }
}

export { db };
