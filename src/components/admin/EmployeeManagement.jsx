import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { db, auth, rtdb } from '../../firebase';
import { PlusCircle, User, CheckCircle, Clock, Loader2 } from 'lucide-react'; // Import Loader2 icon

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [presence, setPresence] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW STATE FOR SUBMISSION

  useEffect(() => {
    // 1. Firestore: Real-time listener for Employees
    const q = collection(db, 'users');
    const unsubscribeEmployees = onSnapshot(q, (snapshot) => {
      const employeeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeeList);
    }, (error) => {
      console.error("Error fetching employees:", error);
    });

    // 2. Realtime DB: Real-time listener for Presence
    const presenceRef = ref(rtdb, 'presence');
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      setPresence(snapshot.val() || {});
    });

    return () => {
      unsubscribeEmployees();
      unsubscribePresence();
    };
  }, []);

  const handleToggleActive = async (employeeId, currentStatus) => {
    const userRef = doc(db, 'users', employeeId);
    await updateDoc(userRef, { isActive: !currentStatus });
  };

  const handleInputChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.email || !newEmployee.password) return alert("Email and Password are required.");

    setIsSubmitting(true); // START LOADING
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, newEmployee.email, newEmployee.password);
      const uid = userCredential.user.uid;

      // 2. Store user details in Firestore 'users' collection
      await setDoc(doc(db, 'users', uid), {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      alert(`Employee ${newEmployee.name} created successfully!`);
      setIsModalOpen(false);
      setNewEmployee({ name: '', email: '', password: '', role: 'employee', department: '' });
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(`Failed to add employee: ${error.message}`);
    } finally {
      setIsSubmitting(false); // STOP LOADING
    }
  };

  const getStatus = (employeeId) => {
    const p = presence[employeeId];
    if (!p) return { status: 'Offline', color: 'gray' };
    if (p.state === 'online' && p.isWorking) return { status: 'Working', color: 'green' };
    if (p.state === 'online' && !p.isWorking) return { status: 'Online (Idle)', color: 'yellow' };
    return { status: 'Offline', color: 'gray' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Employee Roster</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-150"
        >
          <PlusCircle size={20} className="mr-2" /> Add Employee
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Presence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {employees.map(employee => {
              const status = getStatus(employee.id);
              return (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.department || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900 dark:text-${status.color}-300`}>
                      <span className={`w-2 h-2 mr-1 rounded-full bg-${status.color}-500`}></span>
                      {status.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                      employee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {employee.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(employee.id, employee.isActive)}
                      className={`text-sm font-semibold ${
                        employee.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      } transition-colors duration-150`}
                    >
                      {employee.isActive ? 'Disable' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Add New Employee</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input
                type="text"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                type="email"
                name="email"
                value={newEmployee.email}
                onChange={handleInputChange}
                placeholder="Email (for login)"
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                type="password"
                name="password"
                value={newEmployee.password}
                onChange={handleInputChange}
                placeholder="Initial Password"
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                type="text"
                name="department"
                value={newEmployee.department}
                onChange={handleInputChange}
                placeholder="Department/Team"
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <select
                name="role"
                value={newEmployee.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting} // Disable cancel during submission
                  className={`px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 transition-colors duration-150 ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting} // Disable submission button
                  className={`px-4 py-2 text-white rounded-lg flex items-center justify-center transition-colors duration-150 ${
                    isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;