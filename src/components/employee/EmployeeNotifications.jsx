import React from "react";
import useNotifications from "../../hooks/useNotifications";
import { markNotificationAsSeen } from "../service/notificationService";

import { useAuth } from "../../context/AuthContext";

export default function EmployeeNotifications() {
  const { currentUser } = useAuth();
  const notifications = useNotifications(currentUser?.uid);

  const handleClick = (notif) => {
    if (!notif.seen) {
      markNotificationAsSeen(notif.id);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">Notifications</h2>

      {notifications.length === 0 && (
        <p className="text-gray-500">No notifications</p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => handleClick(n)}
          className={`border p-3 rounded-lg mb-3 cursor-pointer ${
            n.seen ? "bg-gray-100" : "bg-blue-50"
          }`}
        >
          <h3 className="font-semibold">{n.title}</h3>
          <p className="text-sm">{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(n.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
