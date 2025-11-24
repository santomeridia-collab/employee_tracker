// src/components/AdminLayout.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'employees', name: 'Employees', icon: '👥' },
  { id: 'tasks', name: 'Tasks', icon: '📋' },
  { id: 'time', name: 'Time', icon: '🕗' },
  { id: 'reports', name: 'Reports', icon: '📈' },
  { id: 'settings', name: 'Settings', icon: '⚙️' },
];

const AdminLayout = ({ children }) => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const currentNavItem = navItems.find(item => item.id === activeItem);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900">

      {/* --- Sidebar (Always White) --- */}
      <div className="w-64 flex-shrink-0 bg-white shadow-xl transition-all duration-300 overflow-y-auto">

        {/* Company Logo + Name */}
        <div className="p-6 border-b border-gray-200 text-center">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="w-20 h-20 mx-auto object-contain mb-3"
          />

          <h1 className="text-2xl font-bold text-indigo-600">
            SantoMeridia
          </h1>
          <p className="text-xs text-gray-500">
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 ${
                activeItem === item.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center h-16 bg-white dark:bg-slate-800 shadow-md p-4 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {currentNavItem?.icon} {currentNavItem?.name}
          </h2>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children(activeItem)}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
