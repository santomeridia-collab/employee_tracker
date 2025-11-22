// src/routes/TaskManagement.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    async function fetchData() {
      const empSnap = await getDocs(collection(db, "users"));
      setEmployees(empSnap.docs.map(d => ({ uid: d.id, ...d.data() })));

      const taskSnap = await getDocs(collection(db, "tasks"));
      setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchData();
  }, []);

  const handleAddTask = async () => {
    if (!title || !assignedTo) return alert("Title & Employee required");

    const newTask = {
      title,
      description,
      assignedTo,
      priority,
      status: "pending",
      createdAt: new Date().toISOString(),
      history: [{ action: "assigned", timestamp: new Date().toISOString() }]
    };

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    setTasks(prev => [...prev, { id: docRef.id, ...newTask }]);
    setTitle(""); setDescription(""); setAssignedTo(""); setPriority("medium");
  };

  const handleStatusChange = async (taskId, status) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      status,
      history: [...tasks.find(t => t.id === taskId).history, { action: status, timestamp: new Date().toISOString() }]
    });

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Task Management</h2>

      <div className="mb-6">
        <input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 mr-2"/>
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 mr-2"/>
        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="border p-2 mr-2">
          <option value="">Select Employee</option>
          {employees.map(emp => <option key={emp.uid} value={emp.uid}>{emp.name}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="border p-2 mr-2">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={handleAddTask} className="bg-indigo-600 text-white px-4 py-2 rounded">Assign Task</button>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th>Title</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{employees.find(e => e.uid === task.assignedTo)?.name}</td>
              <td>{task.priority}</td>
              <td>{task.status}</td>
              <td>
                <button onClick={() => handleStatusChange(task.id, "in-progress")} className="mr-2 bg-green-500 text-white px-2 py-1 rounded">Start</button>
                <button onClick={() => handleStatusChange(task.id, "paused")} className="mr-2 bg-yellow-500 text-white px-2 py-1 rounded">Pause</button>
                <button onClick={() => handleStatusChange(task.id, "completed")} className="bg-purple-500 text-white px-2 py-1 rounded">Complete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TaskManagement;
