import React, { useState, useEffect } from 'react';
import '../styles/components/RepeatOptions.css';

const WEEKDAYS = [
    { key: 'MO', label: 'Monday' },
    { key: 'TU', label: 'Tuesday' },
    { key: 'WE', label: 'Wednesday' },
    { key: 'TH', label: 'Thursday' },
    { key: 'FR', label: 'Friday' },
    { key: 'SA', label: 'Saturday' },
    { key: 'SU', label: 'Sunday' }
];

export default function RepeatOptions({ value, onChange, disabled }) {
    const [repeatType, setRepeatType] = useState('none');
    const [customFrequency, setCustomFrequency] = useState(1);
    const [selectedDays, setSelectedDays] = useState([]);
    const [showCustomOptions, setShowCustomOptions] = useState(false);

    useEffect(() => {
        if (value) {
            if (typeof value === 'string') {
                setRepeatType(value);
                setShowCustomOptions(false);
            } else {
                setRepeatType('custom');
                setCustomFrequency(value.frequency || 1);
                setSelectedDays(value.days || []);
                setShowCustomOptions(true);
            }
        }
    }, [value]);

    const handleRepeatTypeChange = (e) => {
        const type = e.target.value;
        setRepeatType(type);
        setShowCustomOptions(type === 'custom');
        
        if (type === 'custom') {
            onChange({ frequency: customFrequency, days: selectedDays });
        } else {
            onChange(type);
        }
    };

    const handleFrequencyChange = (e) => {
        const freq = parseInt(e.target.value) || 1;
        setCustomFrequency(freq);
        if (repeatType === 'custom') {
            onChange({ frequency: freq, days: selectedDays });
        }
    };

    const handleDayToggle = (day) => {
        const newDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];
        
        setSelectedDays(newDays);
        if (repeatType === 'custom') {
            onChange({ frequency: customFrequency, days: newDays });
        }
    };

    return (
        <div className="repeat-options">
            <select
                value={repeatType}
                onChange={handleRepeatTypeChange}
                disabled={disabled}
                className="repeat-select"
            >
                <option value="none">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom...</option>
            </select>

            {showCustomOptions && !disabled && (
                <div className="custom-options">
                    <div className="frequency-section">
                        <label>Repeat every</label>
                        <input
                            type="number"
                            min="1"
                            value={customFrequency}
                            onChange={handleFrequencyChange}
                            className="frequency-input"
                        />
                        <span>week(s)</span>
                    </div>

                    <div className="weekdays-section">
                        <label>Repeat on:</label>
                        <div className="weekdays-grid">
                            {WEEKDAYS.map(({ key, label }) => (
                                <label key={key} className="weekday-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(key)}
                                        onChange={() => handleDayToggle(key)}
                                    />
                                    <span>{label.slice(0, 3)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 