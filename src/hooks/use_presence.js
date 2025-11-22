// src/hooks/usePresence.js
import { useEffect } from "react";
import { ref, set } from "firebase/database";
import { rtdb } from "../firebase";

 function usePresence(uid, isWorking){
  useEffect(() => {
    if (!uid) return;
    const path = `status/${uid}`;
    const tick = () => set(ref(rtdb, path), { state: "online", last_changed: Date.now(), isWorking: !!isWorking });
    tick();
    const id = setInterval(tick, 20_000); // every 20s
    const onUnload = () => {
      set(ref(rtdb, path), { state: "offline", last_changed: Date.now(), isWorking: false });
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onUnload);
      set(ref(rtdb, path), { state: "offline", last_changed: Date.now(), isWorking: false });
    };
  }, [uid, isWorking]);
}
export default usePresence;