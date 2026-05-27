import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./config";
import { upsertUserProfile } from "./firestore";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  console.log("[auth] signUpWithEmail:start", email);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  console.log("[auth] signUpWithEmail:account created", cred.user.uid);
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (err) {
      console.error("[auth] updateProfile failed (non-fatal):", err);
    }
  }
  // Fire-and-forget — must never block the auth flow.
  void upsertUserProfile(cred.user, { displayName });
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  console.log("[auth] loginWithEmail:start", email);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  console.log("[auth] loginWithEmail:success", cred.user.uid);
  void upsertUserProfile(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  console.log("[auth] loginWithGoogle:start");
  const cred = await signInWithPopup(auth, googleProvider);
  console.log("[auth] loginWithGoogle:success", cred.user.uid);
  void upsertUserProfile(cred.user);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export type { User };
