// src/components/EmployeeLayout.jsx
import React from "react";
import { LogOut, Home, ClipboardList, User, Clock, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EmployeeLayout = ({ children, activeItem, setActiveItem }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();       // call AuthContext logout
      navigate("/login");   // redirect to login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { id: "home", label: "Dashboard", icon: <Home size={18} /> },
    { id: "tasks", label: "My Tasks", icon: <ClipboardList size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl p-5 flex flex-col">
        {/* Company Logo + Name */}
        <div className="p-6 border-b border-gray-200 text-center">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="w-20 h-20 mx-auto object-contain mb-3"
          />
          <h1 className="text-2xl font-bold text-indigo-600">SantoMeridia</h1>
        </div>

        {/* Menu */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className={`flex items-center gap-3 p-3 mb-2 rounded-lg text-left transition
              ${activeItem === item.id
                ? "bg-indigo-600 text-white shadow-md"
                : "hover:bg-gray-200 text-gray-700"
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}  // Correct logout function
          className="mt-auto bg-red-500 text-white flex items-center gap-2 p-3 rounded-lg hover:bg-red-600"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Page Content */}
      <div className="flex-1 p-8 overflow-y-auto">{children}</div>
    </div>
  );
};

export default EmployeeLayout;
