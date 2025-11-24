// // src/components/employee/TasksTab.jsx
// import React, { useState, useEffect } from 'react';
// import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
// import { ref, update } from 'firebase/database';
// import { db, rtdb, auth } from '../../firebase'; // Import firebase setup
// import { PlayCircle, PauseCircle, CheckCircle, Clock, Loader2, List, Clipboard } from 'lucide-react';
// import { useEmployeeStatus } from '../../hooks/useEmployeeStatus'; // Import the hook
// import { useAuth } from '../../hooks/useAuth'; // Assuming you have a hook/context for user details

// const formatTime = (ms) => {
//     const totalSeconds = Math.floor(ms / 1000);
//     const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
//     const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
//     const s = String(totalSeconds % 60).padStart(2, '0');
//     return `${h}:${m}:${s}`;
// };

// const TasksTab = () => {
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [timerMs, setTimerMs] = useState(0);
//     const [lastAction, setLastAction] = useState(null); // Tracks the last button click for disabling
    
//     // Get live status from RTDB and user ID
//     const { isWorking, currentTask: currentTaskId, loading: statusLoading } = useEmployeeStatus();
//     const { user } = useAuth(); // Assuming useAuth provides the user object
//     const userId = user?.uid; 

//     // --- 1. Real-time Task Fetching ---
//     useEffect(() => {
//         if (!userId) {
//             setLoading(false);
//             return;
//         }
        
//         // Query tasks assigned to the current user, excluding completed ones for the main list
//         const tasksQuery = query(
//             collection(db, 'tasks'),
//             where('assignedTo', '==', userId),
//             where('status', '!=', 'completed'),
//             orderBy('priority', 'desc'),
//             orderBy('createdAt', 'asc')
//         );

//         const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
//             const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//             setTasks(taskList);
//             setLoading(false);
//         }, (error) => {
//             console.error("Error fetching tasks:", error);
//             setLoading(false);
//         });

//         return () => unsubscribe();
//     }, [userId]);


//     // --- 2. Real-time Timer Logic ---
//     useEffect(() => {
//         let interval = null;
        
//         const startTimer = async (taskId) => {
//             // Get the start time from the Firestore task document
//             const taskRef = doc(db, 'tasks', taskId);
//             const taskSnap = await getDoc(taskRef);

//             if (taskSnap.exists() && taskSnap.data().currentSessionStart) {
//                 const startTimeMs = taskSnap.data().currentSessionStart.toDate().getTime();
                
//                 // Start the local timer calculation
//                 interval = setInterval(() => {
//                     const elapsed = Date.now() - startTimeMs;
//                     setTimerMs(elapsed);
//                 }, 1000);
//             }
//         };

//         if (isWorking && currentTaskId) {
//             startTimer(currentTaskId);
//         } else {
//             // Stop the timer when not working or task is null
//             clearInterval(interval);
//             setTimerMs(0);
//         }

//         return () => clearInterval(interval);
//     }, [isWorking, currentTaskId]);


//     // --- 3. Action Handlers (Start, Pause, Complete) ---

//     const updatePresence = async (newStatus) => {
//         const presenceRef = ref(rtdb, `presence/${userId}`);
//         await update(presenceRef, newStatus);
//     };

//     const handleStartWork = async (task) => {
//         if (isWorking) {
//              alert("Please pause your current task before starting a new one.");
//              return;
//         }
//         setLastAction(task.id);
//         const now = serverTimestamp();

//         try {
//             // 1. Update Tasks (Firestore)
//             await updateDoc(doc(db, 'tasks', task.id), {
//                 status: 'in_progress',
//                 currentSessionStart: now,
//             });

//             // 2. Create new Time Segment (Firestore)
//             await addDoc(collection(db, 'taskTimeSegments'), {
//                 taskId: task.id,
//                 userId: userId,
//                 startTime: now,
//                 endTime: null, // Active segment
//                 date: new Date().toISOString().substring(0, 10),
//             });
            
//             // 3. Update RTDB Presence
//             await updatePresence({ isWorking: true, currentTask: task.id });

//         } catch (error) {
//             console.error("Error starting work:", error);
//             alert("Failed to start work. Check console.");
//         } finally {
//             setLastAction(null);
//         }
//     };

//     const handlePauseWork = async (taskId) => {
//         setLastAction(taskId);
//         const now = serverTimestamp();
        
//         try {
//             // 1. End active Time Segment (Firestore)
//             const activeSegmentQuery = query(
//                 collection(db, 'taskTimeSegments'),
//                 where('taskId', '==', taskId),
//                 where('endTime', '==', null)
//             );
//             const segmentSnap = await getDocs(activeSegmentQuery);
//             if (!segmentSnap.empty) {
//                 await updateDoc(segmentSnap.docs[0].ref, { endTime: now });
//             }

//             // 2. Update Tasks (Firestore)
//             await updateDoc(doc(db, 'tasks', taskId), {
//                 status: 'paused',
//                 currentSessionStart: null,
//             });

//             // 3. Update RTDB Presence
//             await updatePresence({ isWorking: false, currentTask: taskId });

//         } catch (error) {
//             console.error("Error pausing work:", error);
//         } finally {
//             setLastAction(null);
//         }
//     };
    
//     const handleCompleteTask = async (taskId) => {
//         // If task is currently active, pause it first (ending the segment)
//         if (isWorking && currentTaskId === taskId) {
//             await handlePauseWork(taskId);
//         }
        
//         setLastAction(taskId);
//         const now = serverTimestamp();

//         try {
//             // 1. Update Tasks (Firestore)
//             await updateDoc(doc(db, 'tasks', taskId), {
//                 status: 'completed',
//                 completedAt: now,
//                 currentSessionStart: null,
//             });
            
//             // 2. Update RTDB Presence (if this was the current task)
//             if (currentTaskId === taskId) {
//                 await updatePresence({ isWorking: false, currentTask: null });
//             }

//         } catch (error) {
//             console.error("Error completing task:", error);
//         } finally {
//             setLastAction(null);
//         }
//     };


//     if (loading || statusLoading) {
//         return <div className="p-8 text-center text-indigo-500"><Loader2 size={32} className="animate-spin mx-auto"/> Loading Tasks...</div>;
//     }

//     return (
//         <div className="space-y-6">
//             <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><Clipboard size={30} className="mr-3 text-indigo-500"/> Your Assigned Tasks</h2>
            
//             {/* Live Status Card */}
//             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl flex items-center justify-between">
//                 <div className="flex items-center">
//                     <Clock size={24} className={`mr-4 ${isWorking ? 'text-green-500' : 'text-yellow-500'}`} />
//                     <div>
//                         <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CURRENT STATUS</p>
//                         <p className="text-xl font-bold text-gray-900 dark:text-white">
//                             {isWorking ? 'WORKING' : (currentTaskId ? 'PAUSED' : 'IDLE')}
//                         </p>
//                     </div>
//                 </div>
//                 <div className="text-right">
//                     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">TIME ELAPSED (Active Task)</p>
//                     <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{formatTime(timerMs)}</p>
//                 </div>
//             </div>

//             {/* Task Table */}
//             <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
//                 <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
//                     <thead className="bg-gray-50 dark:bg-slate-700">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
//                             <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
//                         {tasks.length > 0 ? (
//                             tasks.map(task => {
//                                 const isCurrentTask = task.id === currentTaskId;
//                                 const isActionDisabled = lastAction === task.id;
                                
//                                 return (
//                                     <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition duration-100">
//                                         <td className="px-6 py-4">
//                                             <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
//                                             <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</p>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm">
//                                             <span className={`px-3 py-1 text-xs font-medium rounded-full ${
//                                                 task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
//                                                 task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
//                                                 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
//                                             }`}>
//                                                 {task.priority}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
//                                             {isCurrentTask && isWorking ? (
//                                                 <span className="text-indigo-600 font-semibold flex items-center"><PlayCircle size={16} className="mr-1"/> Working Now</span>
//                                             ) : (
//                                                 <span className="text-gray-500 dark:text-gray-400">{task.status.replace('_', ' ')}</span>
//                                             )}
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
//                                             {/* START/RESUME button */}
//                                             {(!isCurrentTask || task.status === 'paused') && (
//                                                 <button
//                                                     onClick={() => handleStartWork(task)}
//                                                     disabled={isWorking && !isCurrentTask || isActionDisabled}
//                                                     className={`p-2 rounded-full transition-colors duration-150 ${
//                                                         isWorking && !isCurrentTask ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
//                                                     }`}
//                                                     title={isWorking && !isCurrentTask ? 'Pause current task first' : 'Start/Resume Work'}
//                                                 >
//                                                     <PlayCircle size={20} />
//                                                 </button>
//                                             )}
                                            
//                                             {/* PAUSE button */}
//                                             {isCurrentTask && isWorking && (
//                                                 <button
//                                                     onClick={() => handlePauseWork(task.id)}
//                                                     disabled={isActionDisabled}
//                                                     className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors duration-150"
//                                                     title="Pause Work"
//                                                 >
//                                                     <PauseCircle size={20} />
//                                                 </button>
//                                             )}
                                            
//                                             {/* COMPLETE button */}
//                                             <button
//                                                 onClick={() => handleCompleteTask(task.id)}
//                                                 disabled={isActionDisabled}
//                                                 className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors duration-150"
//                                                 title="Mark as Completed"
//                                             >
//                                                 <CheckCircle size={20} />
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 );
//                             })
//                         ) : (
//                             <tr>
//                                 <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
//                                     <List size={24} className="mx-auto mb-2"/> No pending tasks assigned to you.
//                                 </td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// export default TasksTab;