// src/hooks/useEmployeeStatus.js
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { useAuth } from './useAuth'; // Assuming you have a hook/context for user/auth details
import { rtdb } from '../firebase'; // Assuming rtdb is imported from firebase.js

/**
 * Hook to get the current employee's real-time presence status.
 */
export const useEmployeeStatus = () => {
    // Replace with your actual auth hook that provides the user object
    // For this example, we'll assume a dummy user:
    const { user } = useAuth(); 
    const currentUserId = user?.uid; 

    const [status, setStatus] = useState({
        isWorking: false,
        currentTask: null,
        state: 'offline',
        loading: true,
    });

    useEffect(() => {
        if (!currentUserId) {
            setStatus({ isWorking: false, currentTask: null, state: 'offline', loading: false });
            return;
        }

        const statusRef = ref(rtdb, `presence/${currentUserId}`);

        // Real-time listener for the user's presence data
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const data = snapshot.val() || {};
            setStatus({
                isWorking: data.isWorking || false,
                currentTask: data.currentTask || null,
                state: data.state || 'offline',
                loading: false,
            });
        }, (error) => {
            console.error("Error reading employee status:", error);
            setStatus(prev => ({ ...prev, loading: false }));
        });

        return () => unsubscribe(); // Cleanup the listener
    }, [currentUserId]);

    return status;
};

// NOTE: You will need to create or adapt a useAuth hook to get the logged-in user's UID.