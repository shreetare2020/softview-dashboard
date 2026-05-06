import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// SIGNUP
export const signup = async (email, password, role = "viewer") => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", userCred.user.uid), {
    email,
    role
  });

  return userCred.user;
};

// LOGIN
export const login = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", userCred.user.uid));

  return {
    user: userCred.user,
    role: snap.exists() ? snap.data().role : "viewer"
  };
};

// LOGOUT
export const logout = () => signOut(auth);