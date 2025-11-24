import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

function TaskListScreen() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all"); // all, today, pending, completed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ---------------------------------------------------
  // 🔵 FETCH EMPLOYEE TASKS
  // ---------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, where("assignedTo", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setTasks(list);
    });

    return () => unsubscribe();
  }, [user]);

  // ---------------------------------------------------
  // 🔵 FILTERED LIST
  // ---------------------------------------------------
  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return task.status === "pending";
    if (filter === "completed") return task.status === "completed";
    if (filter === "today") {
      if (!task.createdAt) return false;
      return task.createdAt.toDate() >= today;
    }
    return true; // all
  });

  // ---------------------------------------------------
  // 🔵 MARK TASK COMPLETED
  // ---------------------------------------------------
  const markCompleted = async (taskId) => {
    await updateDoc(doc(db, "tasks", taskId), {
      status: "completed",
    });
  };

  return (
  <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6 transition-colors">
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-indigo-200 mt-1">
          All tasks assigned to you appear here.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3">

          {[
            { key: "all", label: "All", color: "indigo" },
            { key: "today", label: "Today", color: "blue" },
            { key: "pending", label: "Pending", color: "yellow" },
            { key: "completed", label: "Completed", color: "green" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-2 rounded-lg font-medium shadow-md transition-all
                ${
                  filter === item.key
                    ? `bg-${item.color}-600 text-white`
                    : "bg-gray-200 dark:bg-slate-700 dark:text-gray-300"
                }
              `}
            >
              {item.label}
            </button>
          ))}

        </div>
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No tasks found.
          </p>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 flex justify-between items-start"
            >
              <div>
                {/* TITLE */}
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {task.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {task.description}
                </p>

                {/* STATUS BADGE */}
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold shadow-md
                      ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                  >
                    {task.status.toUpperCase()}
                  </span>
                </div>

                {/* DUE DATE */}
                {task.dueDate && (
                  <p className="text-sm mt-3 text-gray-700 dark:text-gray-300">
                    <strong>Due:</strong>{" "}
                    {task.dueDate.toDate().toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* MARK COMPLETED BUTTON */}
              {task.status !== "completed" && (
                <button
                  onClick={() => markCompleted(task.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md transition-all"
                >
                  Complete ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

}

export default TaskListScreen;
