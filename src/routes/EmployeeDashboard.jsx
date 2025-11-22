// src/routes/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { startSession, stopSession } from "../lib/sessions";
import usePresence from "../hooks/use_presence";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

 function EmployeeDashboard(){
  const { user, profile, setProfile } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  usePresence(user?.uid, profile?.isWorking);

  useEffect(() => {
    // load current session if exists
    async function fetch() {
      if(!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : null;
      if(data?.currentSessionId) setCurrentSession(data.currentSessionId);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const handleStart = async () => {
    const sid = await startSession(user.uid);
    setCurrentSession(sid);
    // update local UI
  };

  const handleStop = async () => {
    if(!currentSession) return;
    await stopSession(user.uid, currentSession);
    setCurrentSession(null);
  };

  return (
    <div className="p-6">
      <h2>Welcome, {profile?.name || user?.email}</h2>
      <p>Status: {profile?.isWorking ? "Working" : "Not working"}</p>

      <div className="mt-4">
        {!currentSession ? (
          <button onClick={handleStart}>Start Work</button>
        ) : (
          <button onClick={handleStop}>Stop Work</button>
        )}
      </div>
    </div>
  );
}
export default EmployeeDashboard;
