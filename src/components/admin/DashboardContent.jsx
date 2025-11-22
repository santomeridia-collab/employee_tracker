import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, rtdb } from '../../firebase';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center justify-between transition-all duration-300 hover:shadow-xl border dark:border-slate-700">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      <p className={`text-4xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}>{value}</p>
    </div>
    <div className={`text-3xl p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-500`}>
      {icon}
    </div>
  </div>
);

// --- New Component for Simple Bar Chart Visualization ---
const TaskTrendChart = ({ data }) => {
    if (Object.keys(data).length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No tasks completed in the last 7 days to show trends.
            </div>
        );
    }

    // Determine the maximum value for scaling
    const maxCount = Math.max(...Object.values(data));
    const dates = Object.keys(data).sort(); // Sort keys (dates)

    return (
        <div className="flex justify-between items-end h-64 p-2 space-x-2">
            {dates.map((date, index) => {
                const count = data[date];
                // Calculate bar height as a percentage of the max count
                const height = (count / (maxCount || 1)) * 100; 

                return (
                    <div key={index} className="flex flex-col items-center h-full justify-end">
                        <div 
                            className="w-10 bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600"
                            style={{ height: `${height}%` }}
                        ></div>
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">{count}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" title={date}>
                            {date.split('-')[2]} {/* Display day number */}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};


const DashboardContent = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        workingNow: 0,
        totalTasks: 0,
        tasksCompleted: 0,
    });
    const [completionTrends, setCompletionTrends] = useState({});
    const [loading, setLoading] = useState(true);

    // --- Helper function to format date to YYYY-MM-DD ---
    const formatDate = (date) => {
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toISOString().split('T')[0];
    };

    // --- Data Aggregation Logic ---
    const aggregateTaskTrends = (tasks) => {
        const today = new Date();
        const trends = {};
        
        // Initialize trends for the last 7 days (including today)
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            trends[formatDate(date)] = 0;
        }

        tasks.forEach(task => {
            if (task.status === 'completed' && task.completedAt) {
                const completionDate = formatDate(task.completedAt);
                
                // Only count tasks completed in the last 7 days
                if (trends.hasOwnProperty(completionDate)) {
                    trends[completionDate] += 1;
                }
            }
        });

        return trends;
    };


    useEffect(() => {
        // 1. Setup Realtime DB listener for 'Working Now'
        const workingRef = ref(rtdb, 'presence');
        const unsubscribeRTDB = onValue(workingRef, (snapshot) => {
            let workingNow = 0;
            if (snapshot.exists()) {
                const presenceData = snapshot.val();
                workingNow = Object.values(presenceData).filter(p => p.state === 'online' && p.isWorking).length;
            }
            setStats(prev => ({ ...prev, workingNow }));
        });
        
        // 2. Fetch all Firestore stats
        const fetchFirestoreStats = async () => {
            try {
                // --- Total Employees ---
                const employeeSnap = await getDocs(collection(db, 'users'));
                const totalEmployees = employeeSnap.docs.length;
                console.log("Firestore Debug: Total Employees found:", totalEmployees);

                // --- Fetch ALL Tasks (needed for Trend aggregation) ---
                const totalTasksSnap = await getDocs(collection(db, 'tasks'));
                const allTasks = totalTasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const totalTasks = allTasks.length;
                console.log("Firestore Debug: Total Tasks found:", totalTasks);

                // --- Calculate Completed Tasks & Trends ---
                const completedTasks = allTasks.filter(t => t.status === 'completed');
                const tasksCompleted = completedTasks.length;
                console.log("Firestore Debug: Tasks Completed found:", tasksCompleted);

                // Aggregate trends for the chart
                setCompletionTrends(aggregateTaskTrends(completedTasks));

                setStats(prev => ({
                    ...prev,
                    totalEmployees,
                    totalTasks,
                    tasksCompleted,
                }));
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching Firestore stats. Check collection names and permissions:", error);
                setLoading(false);
            }
        };

        fetchFirestoreStats();

        // Cleanup Realtime DB listener
        return () => unsubscribeRTDB();
    }, []); 

    if (loading) return <div className="text-center p-8 text-indigo-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={stats.totalEmployees} icon="👨‍💼" color="indigo" />
                <StatCard title="Working Now" value={stats.workingNow} icon="💻" color="green" />
                <StatCard title="Total Tasks" value={stats.totalTasks} icon="📝" color="yellow" />
                <StatCard title="Tasks Completed" value={stats.tasksCompleted} icon="✅" color="teal" />
            </div>

            <hr className="border-gray-300 dark:border-slate-700" />

            {/* --- Task Completion Trends Chart --- */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Task Completion Trends (Last 7 Days)</h3>
                
                <TaskTrendChart data={completionTrends} />

                <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    *The bars represent the number of tasks completed each day.*
                </p>
            </div>
        </div>
    );
};

export default DashboardContent;