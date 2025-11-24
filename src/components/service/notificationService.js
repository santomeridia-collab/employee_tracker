import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

export async function markNotificationAsSeen(id) {
  try {
    await updateDoc(doc(db, "notifications", id), {
      seen: true,
    });
  } catch (err) {
    console.error("Failed to update notification:", err);
  }
}
