import React, { useState, useEffect } from 'react';
import { useOrganization, useAuth } from "@clerk/clerk-react";
import axios from 'axios';
import '../styles/components/Availability.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_AVAILABILITY = {
    start: "00:00",
    end: "23:59"
};

export default function Availability() {
    const [timeRanges, setTimeRanges] = useState(new Map(
        DAYS.map(day => [day, [DEFAULT_AVAILABILITY]])
    ));
    const [overlap, setOverlap] = useState({});
    const [userCount, setUserCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const { organization } = useOrganization();
    const { getToken } = useAuth();

    useEffect(() => {
        if (organization) {
            fetchAvailability();
            fetchOverlap();
        }
    }, [organization]);

    const fetchAvailability = async () => {
        try {
            const token = await getToken();
            const response = await axios.get("/api/availability/get-availability", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            if (response.data.timeRanges) {
                setTimeRanges(new Map(Object.entries(response.data.timeRanges)));
            }
        } catch (error) {
            console.error("Error fetching availability:", error);
        }
    };

    const fetchOverlap = async () => {
        try {
            const token = await getToken();
            const response = await axios.get("/api/availability/calculate-overlap", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            setOverlap(response.data.overlap);
            setUserCount(response.data.userCount);
        } catch (error) {
            console.error("Error fetching overlap:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTimeRange = (day) => {
        const ranges = timeRanges.get(day) || [];
        setTimeRanges(new Map(timeRanges.set(day, [...ranges, { start: "09:00", end: "17:00" }])));
    };

    const removeTimeRange = (day, index) => {
        const ranges = timeRanges.get(day) || [];
        if (ranges.length === 1) {
            // If it's the last range, set it to 24 hours instead of removing
            setTimeRanges(new Map(timeRanges.set(day, [DEFAULT_AVAILABILITY])));
        } else {
            ranges.splice(index, 1);
            setTimeRanges(new Map(timeRanges.set(day, [...ranges])));
        }
    };

    const updateTimeRange = (day, index, field, value) => {
        const ranges = timeRanges.get(day) || [];
        ranges[index] = { ...ranges[index], [field]: value };
        setTimeRanges(new Map(timeRanges.set(day, [...ranges])));
    };

    const saveAvailability = async () => {
        try {
            setSaving(true);
            const token = await getToken();
            await axios.post("/api/availability/update-availability", {
                timeRanges: Object.fromEntries(timeRanges)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            fetchOverlap();
        } catch (error) {
            console.error("Error saving availability:", error);
            alert("Failed to save availability. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    if (!organization) {
        return (
            <div className="no-organization-message">
                <h2>Welcome to Gatherly!</h2>
                <p>To set your availability, create or join a friend group using the organization switcher above.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Loading availability...</div>;
    }

    return (
        <div className="availability-container">
            <div className="availability-section">
                <h2>Your Available Times</h2>
                <p>Add the times you're typically free for each day of the week. By default, you're marked as available 24/7.</p>
                
                {DAYS.map(day => (
                    <div key={day} className="day-container">
                        <h3 className="day-title">{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                        {(timeRanges.get(day) || []).map((range, index) => (
                            <div key={index} className="time-range">
                                <input
                                    type="time"
                                    value={range.start}
                                    onChange={(e) => updateTimeRange(day, index, 'start', e.target.value)}
                                />
                                <span>to</span>
                                <input
                                    type="time"
                                    value={range.end}
                                    onChange={(e) => updateTimeRange(day, index, 'end', e.target.value)}
                                />
                                <button 
                                    className="remove-time"
                                    onClick={() => removeTimeRange(day, index)}
                                    title={timeRanges.get(day).length === 1 ? "Can't remove last time range" : "Remove time range"}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button 
                            className="add-time"
                            onClick={() => addTimeRange(day)}
                        >
                            + Add Another Time Range
                        </button>
                    </div>
                ))}
                
                <button 
                    className={`save-availability ${saving ? 'saving' : ''}`}
                    onClick={saveAvailability}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Availability'}
                </button>
            </div>

            <div className="overlap-section">
                <h2>Group Availability</h2>
                <p>{userCount} {userCount === 1 ? 'person has' : 'people have'} set their availability</p>
                
                {DAYS.map(day => (
                    <div key={day} className="day-container">
                        <h3 className="day-title">{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                        {overlap[day]?.length > 0 ? (
                            <div className="overlap-ranges">
                                {overlap[day].map((range, index) => (
                                    <div 
                                        key={index} 
                                        className="overlap-range"
                                        style={{
                                            opacity: Math.max(0.3, range.percentage / 100),
                                            backgroundColor: `var(--primary-dark)`
                                        }}
                                    >
                                        <span className="time">
                                            {formatTime(range.start)} - {formatTime(range.end)}
                                        </span>
                                        <span className="percentage">
                                            {Math.round(range.percentage)}% available
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-overlap">No overlapping free time</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 