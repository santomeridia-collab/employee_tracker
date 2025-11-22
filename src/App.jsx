import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./routes/login";
import EmployeeDashboard from "./routes/EmployeeDashboard";
import AdminDashboard from "./routes/AdminDashboard";
import Register from "./routes/register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reg" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
