// src/routes/EmployeeHome.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, onValue, update } from "firebase/database";
import { db, rtdb } from "../../firebase";

import { useNavigate } from "react-router-dom";

// Icons
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-cyan-500 dark:text-cyan-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const TaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-emerald-500 dark:text-emerald-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);
const TimeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

function EmployeeHome() {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [presence, setPresence] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [timer, setTimer] = useState("00:00:00");

  const [isPaused, setIsPaused] = useState(false);
  const [pauseStart, setPauseStart] = useState(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ---------------------------
  // PRESENCE + SESSIONS + TASKS
  // ---------------------------
  useEffect(() => {
    if (!user) return;

    // Presence
    const presenceRef = ref(rtdb, `presence/${user.uid}`);
    const unsubscribePresence = onValue(presenceRef, (snap) => {
      setPresence(snap.val());
    });

    // Sessions
    const sessionsRef = collection(db, "sessions");
    const qSessions = query(sessionsRef, where("userId", "==", user.uid));

    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const todayList = all.filter((s) => {
        if (!s.startTime) return false;
        return s.startTime.toDate() >= today;
      });

      setTodaySessions(todayList);

      const active = todayList.find((s) => !s.endTime);
      setActiveSession(active || null);

      if (active?.pausedSeconds !== undefined) {
        setTotalPausedSeconds(active.pausedSeconds);
      }
    });

    // Tasks
    const tasksRef = collection(db, "tasks");
    const qTasks = query(tasksRef, where("assignedTo", "==", user.uid));

    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const all = snapshot.docs.map((d) => ({ ...d.data() }));
      const todayCompleted = all.filter((t) => t.status === "completed");
      setCompletedTasks(todayCompleted.length);
    });

    return () => {
      unsubscribePresence();
      unsubscribeSessions();
      unsubscribeTasks();
    };
  }, [user]);

  // -------------------------
  // LIVE TIMER
  // -------------------------
  useEffect(() => {
    if (!activeSession || isPaused) return;

    const start = activeSession.startTime.toDate();

    const interval = setInterval(() => {
      const now = new Date();
      const elapsedTotalSeconds = Math.floor((now - start) / 1000);
      const diff = elapsedTotalSeconds - totalPausedSeconds;

      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");

      setTimer(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isPaused, totalPausedSeconds]);

  // -------------------------
  // WORK CONTROLS
  // -------------------------
  const startWork = async () => {
    await addDoc(collection(db, "sessions"), {
      userId: user.uid,
      startTime: serverTimestamp(),
      endTime: null,
      pausedSeconds: 0,
    });

    await update(ref(rtdb, `presence/${user.uid}`), {
      state: "online",
      isWorking: true,
      lastActive: Date.now(),
    });
  };

  const stopWork = async () => {
    if (!activeSession) return;

    const docRef = doc(db, "sessions", activeSession.id);

    await updateDoc(docRef, {
      endTime: serverTimestamp(),
      pausedSeconds: totalPausedSeconds,
    });

    await update(ref(rtdb, `presence/${user.uid}`), {
      state: "online",
      isWorking: false,
      lastActive: Date.now(),
    });

    setIsPaused(false);
    setTotalPausedSeconds(0);
    setTimer("00:00:00");
  };

  const pauseWork = async () => {
    setIsPaused(true);
    setPauseStart(Date.now());

    await update(ref(rtdb, `presence/${user.uid}`), {
      state: "online",
      isWorking: false,
      lastActive: Date.now(),
    });
  };

  const resumeWork = async () => {
    if (!pauseStart || !activeSession) return;

    const pausedTime = Math.floor((Date.now() - pauseStart) / 1000);
    const newTotal = totalPausedSeconds + pausedTime;

    setTotalPausedSeconds(newTotal);
    setPauseStart(null);
    setIsPaused(false);

    await updateDoc(doc(db, "sessions", activeSession.id), {
      pausedSeconds: newTotal,
    });

    await update(ref(rtdb, `presence/${user.uid}`), {
      state: "online",
      isWorking: true,
      lastActive: Date.now(),
    });
  };

  const status = isPaused
    ? "Paused"
    : presence?.isWorking
    ? "Working"
    : presence?.state === "online"
    ? "Online"
    : "Offline";

  const statusColor = {
    Working: "bg-emerald-600",
    Paused: "bg-yellow-500",
    Online: "bg-amber-500",
    Offline: "bg-gray-400",
  }[status];

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <p className="text-xl text-cyan-600 dark:text-cyan-400">
          Loading dashboard...
        </p>
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-900">
        <p className="text-xl text-red-500">Please login</p>
      </div>
    );

  // -------------------------
  // UI RETURN
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-start pt-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Employee Home
            </h1>

            <p className="mt-1 text-xl text-gray-600 dark:text-gray-300">
              Welcome,{" "}
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {profile?.name || user.email}
              </span>
            </p>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg ${statusColor}`}
            >
              {status}
            </span>
            <button
              onClick={logout}
              className="mt-2 text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timer Card */}
          <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 border-t-4 border-cyan-600">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <ClockIcon /> Current Session Time
            </h3>

            <p
              className={`mt-4 text-6xl font-mono font-extrabold ${
                isPaused
                  ? "text-yellow-500 dark:text-yellow-400"
                  : "text-cyan-600 dark:text-cyan-400"
              }`}
            >
              {timer}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPaused ? "Paused" : "Tracking..."}
            </p>
          </div>

          {/* Performance */}
          <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 border-t-4 border-emerald-600">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <TaskIcon /> Today’s Summary
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between py-2 border-b dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-300">
                  Completed Tasks:
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {completedTasks}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">
                  Total Sessions:
                </span>
                <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {todaySessions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6 flex flex-wrap gap-4 justify-center">
          {!activeSession && (
            <button
              onClick={startWork}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Start Work
            </button>
          )}

          {activeSession && !isPaused && (
            <button
              onClick={pauseWork}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={resumeWork}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Resume
            </button>
          )}

          {activeSession && (
            <button
              onClick={stopWork}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Stop
            </button>
          )}

          <button
            onClick={() => navigate("/tasks")}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            My Tasks →
          </button>
        </div>

        {/* SESSION LIST */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">
            Today’s Work History
          </h3>

          {todaySessions.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">
              No sessions today.
            </p>
          )}

          <div className="space-y-4">
            {todaySessions
              .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis())
              .map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex justify-between items-center"
                >
                  <div className="flex items-center space-x-3">
                    <TimeIcon />
                    <div>
                      <p className="text-lg font-medium">
                        {s.startTime
                          ?.toDate()
                          .toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                        -{" "}
                        {s.endTime
                          ? s.endTime
                              .toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                          : "Ongoing..."}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Paused: {s.pausedSeconds || 0}s
                      </p>
                    </div>
                  </div>

                  {!s.endTime && (
                    <span className="text-sm font-semibold text-cyan-600">
                      LIVE
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeHome;
