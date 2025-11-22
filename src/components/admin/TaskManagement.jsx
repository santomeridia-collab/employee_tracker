import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db, serverTs } from '../../firebase';
import { PlusCircle, Loader, X, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'; // Import Loader2 for spinning icon

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', priority: 'medium', assignedTo: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW STATE FOR SUBMISSION

  useEffect(() => {
    // 1. Fetch Employees for assignment dropdown
    const employeesQuery = collection(db, 'users');
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Real-time listener for Tasks
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeTasks();
    };
  }, []);

  const handleInputChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) return alert("Title and Assigned Employee are required.");

    setIsSubmitting(true); // START LOADING

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending',
        createdAt: serverTs(),
        history: [{ action: "assigned", timestamp: new Date().toISOString() }],
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        completedAt: null,
      });

      alert(`Task "${newTask.title}" assigned successfully!`);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'medium', assignedTo: '' });
    } catch (error) {
      console.error("Error assigning task:", error);
      alert(`Failed to assign task: ${error.message}`);
    } finally {
        setIsSubmitting(false); // STOP LOADING
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', icon: <Clock size={16} />, color: 'yellow' };
      case 'in-progress':
        return { text: 'In Progress', icon: <Loader size={16} className="animate-spin" />, color: 'indigo' };
      case 'paused':
        return { text: 'Paused', icon: <AlertTriangle size={16} />, color: 'red' };
      case 'completed':
        return { text: 'Completed', icon: <CheckCircle size={16} />, color: 'green' };
      default:
        return { text: 'Unknown', icon: <X size={16} />, color: 'gray' };
    }
  };
  
  const getAssignedName = (uid) => {
    return employees.find(e => e.id === uid)?.name || 'Unknown User';
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const employeeMatch = filterEmployee === 'all' || task.assignedTo === filterEmployee;
    return statusMatch && employeeMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Task Board</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-150"
        >
          <PlusCircle size={20} className="mr-2" /> Assign New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Employee</label>
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md">
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {/* Task List Table */}
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredTasks.map(task => {
              const statusDisplay = getStatusDisplay(task.status);
              return (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition duration-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getAssignedName(task.assignedTo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-${statusDisplay.color}-100 text-${statusDisplay.color}-800 dark:bg-${statusDisplay.color}-900 dark:text-${statusDisplay.color}-300`}>
                      {statusDisplay.icon} <span className="ml-1">{statusDisplay.text}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Assign New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                type="text"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                placeholder="Task Title"
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <textarea
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                placeholder="Description"
                rows="3"
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                type="date"
                name="deadline"
                value={newTask.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <select
                name="priority"
                value={newTask.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <select
                name="assignedTo"
                value={newTask.assignedTo}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="">-- Assign Employee --</option>
                {employees.filter(e => e.isActive).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
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
                      Assigning...
                    </>
                  ) : (
                    'Assign Task'
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

export default TaskManagement;