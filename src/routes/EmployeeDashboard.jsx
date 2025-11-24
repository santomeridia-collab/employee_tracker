// src/routes/EmployeeDashboard.jsx
import React, { useState } from "react";
import EmployeeLayout from "../components/EmployeeLayout";

import EmployeeHome from "../components/employee/EmployeeHome";
// import WorkSession from "../components/employee/WorkSession";
import TaskListScreen from "../components/employee/TaskListScreen";

import Profile from "../components/employee/Profile";
import EmployeeNotifications from "../components/employee/EmployeeNotifications";
import AttendanceScreen from "../components/employee/AttendanceScreen";

const EmployeeDashboard = () => {
  const [activeItem, setActiveItem] = useState("home");

  const renderContent = () => {
    switch (activeItem) {
      case "home":
        return <EmployeeHome />;
      // case "session":
      //   return <WorkSession />;
      case "tasks":
        return <TaskListScreen />;
      case "notifications":
  return <EmployeeNotifications />;
      case "attendance":
        return <AttendanceScreen />;
      case "profile":
        return <Profile />;
      
      default:
        return <EmployeeHome />;
    }
  };

  return (
    <EmployeeLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {renderContent()}
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
