// src/routes/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, User } from 'lucide-react';
import { auth, db } from "../firebase"; // <- your initialized Firebase

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const nav = useNavigate();
  const defaultRole = "employee";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUserId = cred.user.uid;

      // 2. Save user details in Firestore
      const userRef = doc(db, "users", newUserId);
      await setDoc(userRef, {
        name,
        email,
        role: defaultRole,
        createdAt: new Date().toISOString(),
      });

      // 3. Navigate to Employee Dashboard
      nav("/employee");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full transition-all duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-4xl text-indigo-600 dark:text-indigo-400 mb-2">📝</div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Get Started</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your Employee Tracker Account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (min. 6 chars)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm font-medium text-center bg-red-50 dark:bg-slate-700 p-2 rounded-lg border border-red-200">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 rounded-lg font-semibold text-white transition duration-200 ease-in-out transform mt-6 ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-indigo-500/50'
            }`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 ml-1">Sign In</Link>
        </p>

        {/* Footer */}
        <p className="mt-8 pt-4 border-t border-gray-200 dark:border-slate-700 text-center text-gray-400 dark:text-gray-500 text-xs">
          Employee Tracker &copy; 2025
        </p>
      </div>
    </div>
  );
}

export default Register;
