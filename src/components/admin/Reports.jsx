import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Download, Users, Briefcase, Clock, CheckCircle, TrendingUp } from 'lucide-react';

// Helper function to calculate duration from history
const calculateWorkDuration = (taskHistory) => {
    let totalSeconds = 0;
    let startTimestamp = null;

    for (const item of taskHistory) {
        if (item.action === 'started') {
            startTimestamp = new Date(item.timestamp).getTime();
        } else if (item.action === 'paused' || item.action === 'completed') {
            if (startTimestamp) {
                totalSeconds += (new Date(item.timestamp).getTime() - startTimestamp) / 1000;
                startTimestamp = null; // Reset for next segment
            }
        } else if (item.action === 'resumed') {
            startTimestamp = new Date(item.timestamp).getTime();
        }
    }
    // If task is still in progress, count time until now
    if (startTimestamp) {
        totalSeconds += (Date.now() - startTimestamp) / 1000;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

// Function to calculate task distribution for the chart
const calculateWorkload = (tasks, employees) => {
    const workload = {};
    
    // Initialize workload with all employees
    Object.keys(employees).forEach(uid => {
        workload[uid] = { 
            name: employees[uid], 
            count: 0 
        };
    });

    tasks.forEach(task => {
        // Only count tasks that are NOT completed
        if (task.status !== 'completed' && task.assignedTo && workload[task.assignedTo]) {
            workload[task.assignedTo].count += 1;
        }
    });

    // Convert object to array and filter out employees with 0 active tasks
    return Object.values(workload).filter(w => w.count > 0);
};

// Component for Simple Bar Chart Visualization
const WorkloadChart = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                All assigned tasks are completed, or no tasks assigned yet.
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="flex justify-evenly items-end h-64 p-2 space-x-2">
            {data.map((item, index) => {
                const height = (item.count / (maxCount || 1)) * 100; 

                return (
                    <div key={index} className="flex flex-col items-center h-full justify-end w-1/5 max-w-24">
                        <div 
                            className="w-full bg-teal-500 rounded-t-lg transition-all duration-500 hover:bg-teal-600 cursor-pointer"
                            style={{ height: `${height}%` }}
                            title={`${item.name}: ${item.count} active tasks`}
                        ></div>
                        <span className="mt-1 text-sm font-bold text-gray-700 dark:text-gray-200">{item.count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center truncate w-full" title={item.name}>
                            {item.name.split(' ')[0]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// Component for Task Status Breakdown
const StatusBreakdown = ({ tasks }) => {
    const counts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});

    const statuses = [
        { key: 'pending', label: 'Pending', color: 'bg-yellow-500' },
        { key: 'in-progress', label: 'In Progress', color: 'bg-indigo-500' },
        { key: 'paused', label: 'Paused', color: 'bg-red-500' },
        { key: 'completed', label: 'Completed', color: 'bg-green-500' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statuses.map(status => (
                <div key={status.key} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg shadow-inner">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{status.label}</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{counts[status.key] || 0}</p>
                </div>
            ))}
        </div>
    );
};

// KPI Card Component
const KPICard = ({ title, value, icon, iconColor, bgColor }) => (
    <div className={`p-5 rounded-xl shadow-lg ${bgColor} dark:bg-slate-800 border dark:border-slate-700`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            {React.cloneElement(icon, { size: 24, className: iconColor })}
        </div>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
    </div>
);


const Reports = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState({});
    const [workloadData, setWorkloadData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Employees (for mapping UIDs to names)
                const employeeSnap = await getDocs(collection(db, 'users'));
                const employeeMap = {};
                let totalEmployees = 0;
                employeeSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.isActive) {
                        employeeMap[doc.id] = data.name;
                        totalEmployees++;
                    }
                });
                setEmployees(employeeMap);

                // Fetch all tasks
                const taskSnap = await getDocs(collection(db, 'tasks'));
                const taskList = taskSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    assignedName: employeeMap[doc.data().assignedTo] || 'Unknown',
                    duration: doc.data().status === 'completed' ? calculateWorkDuration(doc.data().history || []) : 'N/A',
                }));
                
                // Calculate KPI Metrics
                const activeTasks = taskList.filter(t => t.status !== 'completed').length;
                const completedTasks = taskList.filter(t => t.status === 'completed').length;

                setTasks(taskList);
                setWorkloadData(calculateWorkload(taskList, employeeMap));

                // Save KPIs to state (for simplicity, we'll use a single state object)
                setKPIs({
                    totalEmployees,
                    activeTasks,
                    completedTasks,
                });

            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [kpis, setKPIs] = useState({
        totalEmployees: 0,
        activeTasks: 0,
        completedTasks: 0,
    });

    // Function to handle CSV export (kept from original code)
    const exportToCSV = (data, filename) => {
        if (data.length === 0) return alert("No data to export.");

        const header = Object.keys(data[0]).join(',');
        const csv = [
            header,
            ...data.map(row => Object.values(row).map(value => {
                if (Array.isArray(value)) return `"${value.length} actions"`;
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const taskReportData = tasks.map(task => ({
        id: task.id,
        title: task.title,
        assigned_to: task.assignedName,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        work_duration: task.duration,
        created_at: task.createdAt?.toDate ? task.createdAt.toDate().toLocaleString() : 'N/A'
    }));

    if (loading) return <div className="text-center p-8 text-indigo-500 flex items-center justify-center"><TrendingUp size={24} className="animate-spin mr-2"/> Generating Reports...</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h2>

            {/* --- 1. KPI Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard 
                    title="Active Employees" 
                    value={kpis.totalEmployees} 
                    icon={<Users />} 
                    iconColor="text-indigo-500" 
                    bgColor="bg-white"
                />
                <KPICard 
                    title="Active Tasks" 
                    value={kpis.activeTasks} 
                    icon={<Briefcase />} 
                    iconColor="text-yellow-500" 
                    bgColor="bg-white"
                />
                <KPICard 
                    title="Completed Tasks (Total)" 
                    value={kpis.completedTasks} 
                    icon={<CheckCircle />} 
                    iconColor="text-green-500" 
                    bgColor="bg-white"
                />
            </div>
            
            <hr className="border-gray-200 dark:border-slate-700" />

            {/* --- 2. Distribution Charts & Data --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Workload Distribution Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Users size={20} className="mr-2 text-teal-500"/> Workload Distribution (Active Tasks)</h3>
                    <WorkloadChart data={workloadData} />
                    <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        *Chart shows the number of Pending, In-Progress, or Paused tasks per employee.*
                    </p>
                </div>
                
                {/* Task Status Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Briefcase size={20} className="mr-2 text-purple-500"/> Task Status Breakdown</h3>
                    <StatusBreakdown tasks={tasks} />
                    <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                        Total tasks: {tasks.length}
                    </p>
                </div>

            </div>

            <hr className="border-gray-200 dark:border-slate-700" />

            {/* --- 3. Exportable Reports Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Download size={20} className="mr-2 text-indigo-500"/> Task Activity Report</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Export a list of all tasks, their statuses, and calculated work durations.</p>
                    <button
                        onClick={() => exportToCSV(taskReportData, 'Task_Activity_Report')}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-150"
                    >
                        <Download size={18} className="mr-2" /> Export Task CSV
                    </button>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Clock size={20} className="mr-2 text-red-500"/> Overdue Task Report</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Identify tasks whose deadline has passed but are not yet completed. (Action required)</p>
                    <button
                        disabled
                        className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                    >
                        <Download size={18} className="mr-2" /> Export Overdue CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reports;