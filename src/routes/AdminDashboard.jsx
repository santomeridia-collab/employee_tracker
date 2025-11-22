// src/routes/AdminDashboard.jsx
import React from 'react';
import AdminLayout from '../components/AdminLayout';
import DashboardContent from '../components/admin/DashboardContent';
import EmployeeManagement from '../components/admin/EmployeeManagement';
import TaskManagement from '../components/admin/TaskManagement';
// Import other components as they are created:
import Reports from '../components/admin/Reports';
import Settings from '../components/admin/Settings';
import TimeSheetReport from '../components/admin/TimeSheetReport';

const AdminDashboard = () => {
  const renderContent = (activeItem) => {
    switch (activeItem) {
      case 'dashboard':
        return <DashboardContent />;
      case 'employees':
        return <EmployeeManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'time': 
                return <TimeSheetReport />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <AdminLayout>
      {renderContent}
    </AdminLayout>
  );
};

export default AdminDashboard;