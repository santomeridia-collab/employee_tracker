// src/lib/sessions.js
import { db, rtdb, serverTs } from "../firebase";
import { doc, setDoc, addDoc, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

// helper function
async function updateUserStatus(uid, data){
  const uRef = doc(db, "users", uid);
  await updateDoc(uRef, data);
}

/**
 * Start a session:
 */
export async function startSession(uid){
  const sessionId = uuidv4();
  const sessionRef = doc(db, "work_sessions", sessionId);
  await setDoc(sessionRef, {
    userId: uid,
    startTime: serverTimestamp(),
    endTime: null,
    totalMinutes: null,
  });
  await updateUserStatus(uid, { isWorking: true, currentSessionId: sessionId });
  await set(ref(rtdb, `status/${uid}`), { state: "online", last_changed: Date.now(), isWorking: true });
  return sessionId;
}

/**
 * Stop a session:
 */
export async function stopSession(uid, sessionId){
  const sessionRef = doc(db, "work_sessions", sessionId);
  const now = new Date();
  await updateDoc(sessionRef, { endTime: serverTimestamp() });
  await updateUserStatus(uid, { isWorking: false, currentSessionId: null });
  await set(ref(rtdb, `status/${uid}`), { state: "online", last_changed: Date.now(), isWorking: false });
}
