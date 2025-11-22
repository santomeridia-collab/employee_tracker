// src/components/admin/Settings.jsx
import React, { useState } from 'react';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Key, Clock, Bell } from 'lucide-react';

// Using a dedicated 'settings' document in Firestore
const settingsDocRef = doc(db, 'settings', 'company_config');

const Settings = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [companySettings, setCompanySettings] = useState({
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        maxBreakMinutes: 30,
    });

    // NOTE: Admin password change is complex as it involves Firebase Auth for the admin user, 
    // and is omitted for this non-Auth hardcoded admin flow, focusing on config.

    // Load settings on component mount
    React.useEffect(() => {
        const loadSettings = async () => {
            const snap = await getDoc(settingsDocRef);
            if (snap.exists()) {
                setCompanySettings(snap.data());
            } else {
                // Initialize settings if they don't exist
                await setDoc(settingsDocRef, companySettings);
            }
        };
        loadSettings();
    }, []);

    const handleSettingChange = (e) => {
        setCompanySettings({ ...companySettings, [e.target.name]: e.target.value });
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(settingsDocRef, companySettings);
            alert("Company settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Settings</h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Company-Wide Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Clock size={20} className="mr-2 text-indigo-500"/> Company Work Policies</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="workingHoursStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                            <input
                                id="workingHoursStart"
                                type="time"
                                name="workingHoursStart"
                                value={companySettings.workingHoursStart}
                                onChange={handleSettingChange}
                                className="mt-1 w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="workingHoursEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                            <input
                                id="workingHoursEnd"
                                type="time"
                                name="workingHoursEnd"
                                value={companySettings.workingHoursEnd}
                                onChange={handleSettingChange}
                                className="mt-1 w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="maxBreakMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Break/Pause Time (minutes)</label>
                            <input
                                id="maxBreakMinutes"
                                type="number"
                                name="maxBreakMinutes"
                                value={companySettings.maxBreakMinutes}
                                onChange={handleSettingChange}
                                className="mt-1 w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition duration-200 ${
                            isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                        }`}
                    >
                        {isSaving ? 'Saving...' : 'Save Company Settings'}
                    </button>
                </div>
            </form>

            {/* Admin Credentials Management Placeholder */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center"><Key size={20} className="mr-2 text-red-500"/> Admin Credentials</h3>
                <p className="text-gray-500 dark:text-gray-400">Since you are using hardcoded admin credentials, credential management is disabled. For a production app, use Firebase Authentication for the admin user and `updatePassword`.</p>
            </div>
        </div>
    );
};

export default Settings;