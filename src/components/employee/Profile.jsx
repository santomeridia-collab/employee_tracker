// src/components/employee/Profile.jsx

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updatePassword } from "firebase/auth";

const Profile = () => {
  const { user, profile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setMsg("");

      await updatePassword(user, newPassword);
      setMsg("Password updated successfully!");
      setNewPassword("");
      setShowPasswordBox(false);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-xl p-6">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-2">
          My Profile
        </h1>

        {/* Profile info */}
        <div className="space-y-4">

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Name</span>
            <span className="text-gray-900 dark:text-white">{profile?.name}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Email</span>
            <span className="text-gray-900 dark:text-white">{user?.email}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Department</span>
            <span className="text-gray-900 dark:text-white">{profile?.department}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Role</span>
            <span className="text-gray-900 dark:text-white">{profile?.role}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Account Created</span>
            <span className="text-gray-900 dark:text-white">
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : "-"}
            </span>
          </div>

          {/* <div className="flex justify-between pb-3">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>
            <span
              className={`font-semibold px-3 py-1 rounded-full ${
                profile?.active ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {profile?.active ? "Active" : "Disabled"}
            </span>
          </div> */}
        </div>

        {/* Change password section */}
        <div className="mt-8">
          <button
            onClick={() => setShowPasswordBox(!showPasswordBox)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
          >
            Change Password
          </button>

          {showPasswordBox && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg space-y-3">
              <input
                type="password"
                value={newPassword}
                placeholder="New Password"
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800"
              />

              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              {msg && (
                <p className="text-center text-sm font-medium text-red-500 dark:text-red-400">
                  {msg}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
