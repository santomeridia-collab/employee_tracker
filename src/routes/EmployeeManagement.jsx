// src/routes/EmployeeManagement.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");

  useEffect(() => {
    async function fetchEmployees() {
      const snap = await getDocs(collection(db, "users"));
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!email || !password) return alert("Email & password required");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        username,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      setEmployees(prev => [...prev, { uid, name, email, username, role, isActive: true }]);
      setName(""); setEmail(""); setUsername(""); setPassword("");
    } catch (err) {
      console.error(err);
      alert("Error adding employee");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Employee Management</h2>

      <div className="mb-6">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 mr-2"/>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 mr-2"/>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="border p-2 mr-2"/>
        <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 mr-2"/>
        <select value={role} onChange={e => setRole(e.target.value)} className="border p-2 mr-2">
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleAddEmployee} className="bg-indigo-600 text-white px-4 py-2 rounded">Add Employee</button>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th>Name</th>
            <th>Email</th>
            <th>Username</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.uid}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.username}</td>
              <td>{emp.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeManagement;
