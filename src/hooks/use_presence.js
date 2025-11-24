// src/hooks/usePresence.js
import { useEffect } from "react";
import { ref, set, onDisconnect } from "firebase/database";
import { rtdb } from "../firebase";

export default function usePresence(uid, isWorking) {
  useEffect(() => {
    if (!uid) return;

    const path = `status/${uid}`;
    const userRef = ref(rtdb, path);

    // ---------------------------------------------------
    // 1️⃣ Set online on login
    // ---------------------------------------------------
    const goOnline = () =>
      set(userRef, {
        state: "online",
        isWorking: !!isWorking,
        lastActive: Date.now(),
      });

    goOnline();

    // ---------------------------------------------------
    // 2️⃣ Auto-set offline if browser closes unexpectedly
    // ---------------------------------------------------
    onDisconnect(userRef).set({
      state: "offline",
      isWorking: false,
      lastActive: Date.now(),
    });

    // ---------------------------------------------------
    // 3️⃣ Update lastActive when window becomes active
    // ---------------------------------------------------
    const handleFocus = () => {
      set(userRef, {
        state: "online",
        isWorking: !!isWorking,
        lastActive: Date.now(),
      });
    };
    window.addEventListener("focus", handleFocus);

    // ---------------------------------------------------
    // 4️⃣ Inactivity tracking — 2 minutes idle
    // ---------------------------------------------------
    let activityTimeout;

    const resetInactivityTimer = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        set(userRef, {
          state: "idle",
          isWorking: false,
          lastActive: Date.now(),
        });
      }, 2 * 60 * 1000); // 2 mins
    };

    // user activity events
    ["mousemove", "keydown", "click", "scroll"].forEach((evt) =>
      window.addEventListener(evt, resetInactivityTimer)
    );
    resetInactivityTimer(); // start timer

    // ---------------------------------------------------
    // 5️⃣ Keep presence updated every 20 seconds
    // ---------------------------------------------------
    const heartbeat = setInterval(() => {
      set(userRef, {
        state: "online",
        isWorking: !!isWorking,
        lastActive: Date.now(),
      });
    }, 20000);

    // ---------------------------------------------------
    // 6️⃣ On tab close or route change – offline
    // ---------------------------------------------------
    const onUnload = () =>
      set(userRef, {
        state: "offline",
        isWorking: false,
        lastActive: Date.now(),
      });

    window.addEventListener("beforeunload", onUnload);

    // ---------------------------------------------------
    // Cleanup
    // ---------------------------------------------------
    return () => {
      clearInterval(heartbeat);
      clearTimeout(activityTimeout);
      ["mousemove", "keydown", "click", "scroll"].forEach((evt) =>
        window.removeEventListener(evt, resetInactivityTimer)
      );
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", onUnload);

      // mark offline on unmount
      set(userRef, {
        state: "offline",
        isWorking: false,
        lastActive: Date.now(),
      });
    };
  }, [uid, isWorking]);
}
