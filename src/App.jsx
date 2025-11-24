import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./routes/login";
import EmployeeDashboard from "./routes/EmployeeDashboard";
import AdminDashboard from "./routes/AdminDashboard";
import Register from "./routes/register";
import TaskListScreen from "./components/employee/TaskListScreen";

// 1. IMPORT the AuthProvider
import { AuthProvider } from "./context/AuthContext"; // Adjust path if necessary

function App() {
  return (
    // 2. WRAP the entire application (BrowserRouter) in AuthProvider
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/reg" element={<Register />} />
          <Route path="/tasks" element={<TaskListScreen />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;