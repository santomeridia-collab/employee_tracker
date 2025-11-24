import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";      // ✅ FIXED
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function AttendanceScreen() {
  const user = auth.currentUser;
  const today = new Date().toISOString().split("T")[0];

  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    const ref = doc(db, "attendance", user.uid, "days", today);
    const snap = await getDoc(ref);
    if (snap.exists()) setAttendance(snap.data());
    else setAttendance(null);
  }

  async function checkIn() {
    const ref = doc(db, "attendance", user.uid, "days", today);
    await setDoc(ref, {
      checkIn: serverTimestamp(),
      checkOut: null,
      totalMinutes: 0,
      status: "Present",
      date: today,
    });
    loadAttendance();
  }

  async function checkOut() {
    const ref = doc(db, "attendance", user.uid, "days", today);

    const now = new Date();
    const checkInTime = attendance?.checkIn?.toDate();

    const diff = Math.floor((now - checkInTime) / 60000);

    await updateDoc(ref, {
      checkOut: serverTimestamp(),
      totalMinutes: diff,
    });

    loadAttendance();
  }

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Attendance</h1>

      {attendance ? (
        <>
          <p>Check In: {attendance.checkIn?.toDate().toLocaleTimeString() || "-"}</p>
          <p>Check Out: {attendance.checkOut?.toDate?.().toLocaleTimeString() || "-"}</p>
          <p>Total: {(attendance.totalMinutes / 60).toFixed(2)} hrs</p>

          {!attendance.checkOut ? (
            <button
              onClick={checkOut}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
            >
              Check Out
            </button>
          ) : (
            <p className="mt-4 text-green-600 font-semibold">You completed today</p>
          )}
        </>
      ) : (
        <button
          onClick={checkIn}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Check In
        </button>
      )}
    </div>
  );
}
