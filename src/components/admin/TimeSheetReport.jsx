import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Clock, Download, AlertTriangle, Users, Loader2 } from 'lucide-react';
//                                                      ^^^^^^^^^ Add Loader2 here

// --- Helper Functions for Time Calculation ---

// Converts milliseconds to Hh Mm format
const formatDuration = (ms) => {
    if (ms < 0) ms = 0;
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

/**
 * Core function to process session history and calculate work/break times.
 * This assumes actions are always logged in order: start -> (pause/resume) -> end.
 */
const analyzeSessions = (sessions) => {
    let totalWorkMs = 0;
    let totalBreakMs = 0;
    let sessionStartMs = null; // Tracks the start of a paid work segment
    let breakStartMs = null; // Tracks the start of a break segment
    let historyDetails = [];

    // Sort chronologically just in case the query didn't guarantee it
    sessions.sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());

    for (const entry of sessions) {
        const timestampMs = entry.timestamp.toDate().getTime();
        const action = entry.action;
        const actionTime = new Date(timestampMs).toLocaleTimeString();

        if (action === 'start_day' || action === 'resume') {
            if (breakStartMs) {
                // End the break and calculate break duration
                totalBreakMs += (timestampMs - breakStartMs);
                historyDetails.push({ action: 'Break Ended', duration: formatDuration(timestampMs - breakStartMs), time: actionTime });
                breakStartMs = null;
            }
            if (action === 'start_day' && !sessionStartMs) {
                sessionStartMs = timestampMs; // Start of the work day
                historyDetails.push({ action: 'Day Started', time: actionTime });
            } else if (action === 'resume' && !sessionStartMs) {
                // Resume should only happen if work was paused within a session
                sessionStartMs = timestampMs;
                historyDetails.push({ action: 'Work Resumed', time: actionTime });
            }
        } else if (action === 'pause') {
            if (sessionStartMs) {
                // Work paused: calculate work duration up to this point
                totalWorkMs += (timestampMs - sessionStartMs);
                historyDetails.push({ action: 'Work Paused', duration: formatDuration(timestampMs - sessionStartMs), time: actionTime });
                sessionStartMs = null;
                
                // Start tracking break time
                breakStartMs = timestampMs;
                historyDetails.push({ action: 'Break Started', time: actionTime });
            }
        } else if (action === 'end_day') {
            if (sessionStartMs) {
                // Day ended while working: calculate final work segment
                totalWorkMs += (timestampMs - sessionStartMs);
                historyDetails.push({ action: 'Day Ended', duration: formatDuration(timestampMs - sessionStartMs), time: actionTime });
            } else if (breakStartMs) {
                 // Day ended while on break: calculate final break segment
                totalBreakMs += (timestampMs - breakStartMs);
                historyDetails.push({ action: 'Day Ended (on break)', duration: formatDuration(timestampMs - breakStartMs), time: actionTime });
            } else {
                historyDetails.push({ action: 'Day Ended (untracked)', time: actionTime });
            }
            sessionStartMs = null;
            breakStartMs = null;
        }
    }

    // Handle session still in progress (started but not ended)
    if (sessionStartMs) {
        const now = Date.now();
        const currentWork = now - sessionStartMs;
        totalWorkMs += currentWork;
        historyDetails.push({ action: 'Currently Working (Unended)', duration: formatDuration(currentWork), time: new Date(now).toLocaleTimeString() });
    } else if (breakStartMs) {
        const now = Date.now();
        const currentBreak = now - breakStartMs;
        totalBreakMs += currentBreak;
        historyDetails.push({ action: 'Currently On Break (Unended)', duration: formatDuration(currentBreak), time: new Date(now).toLocaleTimeString() });
    }

    return {
        totalWork: formatDuration(totalWorkMs),
        totalBreak: formatDuration(totalBreakMs),
        rawWorkMs: totalWorkMs,
        rawBreakMs: totalBreakMs,
        history: historyDetails
    };
};

const TimeSheetReport = () => {
    const [reportData, setReportData] = useState([]);
    const [employees, setEmployees] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

    useEffect(() => {
        const fetchEmployees = async () => {
            const employeeSnap = await getDocs(collection(db, 'users'));
            const employeeMap = {};
            employeeSnap.forEach(doc => {
                employeeMap[doc.id] = doc.data().name;
            });
            setEmployees(employeeMap);
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        const fetchTimeData = async () => {
            if (!selectedDate || Object.keys(employees).length === 0) return;
            setLoading(true);

            try {
                // Fetch all work sessions for the selected day
                const sessionsQuery = query(
                    collection(db, 'workSessions'),
                    where('date', '==', selectedDate),
                    orderBy('timestamp', 'asc')
                );
                const sessionSnap = await getDocs(sessionsQuery);
                const rawSessions = sessionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Group sessions by employee
                const employeeSessions = rawSessions.reduce((acc, session) => {
                    if (session.userId) {
                        acc[session.userId] = acc[session.userId] || [];
                        acc[session.userId].push(session);
                    }
                    return acc;
                }, {});

                // Process and finalize report data
                const finalReport = Object.keys(employees).map(uid => {
                    const sessions = employeeSessions[uid] || [];
                    const analysis = analyzeSessions(sessions);
                    
                    return {
                        employeeId: uid,
                        name: employees[uid],
                        totalWork: analysis.totalWork,
                        totalBreak: analysis.totalBreak,
                        historyDetails: analysis.history,
                        rawWorkMs: analysis.rawWorkMs,
                        rawBreakMs: analysis.rawBreakMs,
                        hasData: sessions.length > 0
                    };
                });

                setReportData(finalReport.sort((a, b) => b.rawWorkMs - a.rawWorkMs)); // Sort by work time

            } catch (error) {
                console.error("Error fetching timesheet data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (Object.keys(employees).length > 0) {
            fetchTimeData();
        }
    }, [selectedDate, employees]);

    // Function to handle CSV export (adapted for this report)
    const exportToCSV = (data, filename) => {
        if (data.length === 0) return alert("No data to export.");

        // Create a flat data structure suitable for CSV
        const csvData = data.map(item => ({
            Name: item.name,
            Date: selectedDate,
            Total_Work_Time: item.totalWork,
            Total_Break_Time: item.totalBreak,
            Session_Details: item.historyDetails.map(h => `${h.action} @ ${h.time}${h.duration ? ` (${h.duration})` : ''}`).join('; ')
        }));

        const header = Object.keys(csvData[0]).join(',');
        const csv = [
            header,
            ...csvData.map(row => Object.values(row).map(value => {
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${selectedDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) return <div className="text-center p-8 text-indigo-500 flex items-center justify-center"><Loader2 size={24} className="animate-spin mr-2"/> Generating Daily Timesheet...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><Clock size={28} className="mr-2 text-indigo-500"/> Daily Time Sheet Report</h2>
            
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                <div className='flex items-center space-x-4'>
                    <label className="text-gray-700 dark:text-gray-300 font-medium">Select Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                </div>
                <button
                    onClick={() => exportToCSV(reportData, 'Daily_Timesheet')}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-150"
                    disabled={reportData.length === 0}
                >
                    <Download size={18} className="mr-2" /> Export CSV
                </button>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Work Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Break Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily History (Time Entries)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {reportData.map(data => (
                            <tr key={data.employeeId} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition duration-100">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{data.name}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${data.hasData ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                                    {data.totalWork}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                    {data.totalBreak}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                                    {data.historyDetails.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-1">
                                            {data.historyDetails.map((h, index) => (
                                                <li key={index} className="text-xs">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{h.action}</span> 
                                                    {h.duration && <span className="text-sm font-medium ml-1">({h.duration})</span>}
                                                    <span className='ml-2 text-gray-400'>@{h.time}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-400 italic">No time entries recorded for this day.</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {reportData.length === 0 && !loading && (
                <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="mr-2"/> No work session data found for the selected date.
                </div>
            )}
        </div>
    );
};

export default TimeSheetReport;