// src/routes/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hardcoded admin credentials
  const adminEmail = "admin@company.com";
  const adminPassword = "Admin123"; // replace with your desired password

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Check if admin credentials
      if (email === adminEmail && password === adminPassword) {
        nav("/admin");
        return;
      }

      // 2. Normal user login with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 3. Get user role from Firestore
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? snap.data().role : "employee";

      if (role === "admin") nav("/admin");
      else nav("/employee");
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-10 max-w-sm w-full transition-all duration-700 hover:shadow-indigo-500/30">
        <div className="flex flex-col items-center mb-8">
          <div className="text-4xl text-indigo-600 dark:text-indigo-400 mb-2">🚀</div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Employee Tracker</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm font-medium text-center bg-red-50 dark:bg-slate-700 p-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 rounded-lg font-semibold text-white transition duration-200 ease-in-out transform ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-indigo-500/50'
            }`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/reg" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Register
          </Link>
        </p>

        <p className="mt-4 text-center text-gray-400 dark:text-gray-500 text-xs">
          Employee Tracker &copy; 2025. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
