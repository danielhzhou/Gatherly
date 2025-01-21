import Modal from "react-modal";
import React, { useState, useEffect } from "react";
import Datetime from "react-datetime";
import moment from "moment";
import "react-datetime/css/react-datetime.css";
import "../styles/components/AddEventModal.css";

export default function AddEventModal({isOpen, onClose, onEventAdded, initialStart, initialEnd, initialAllDay}) {
    const [title, setTitle] = useState("");
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [allDay, setAllDay] = useState(false);

    useEffect(() => {
        if (isOpen && initialStart && initialEnd) {
            setStart(moment(initialStart).toDate());
            setEnd(moment(initialEnd).toDate());
            setAllDay(initialAllDay || false);
        }
    }, [isOpen, initialStart, initialEnd, initialAllDay]);

    const handleAllDayChange = (checked) => {
        setAllDay(checked);
        if (checked) {
            // For all-day events, set start to beginning of day and end to end of day
            setStart(moment(start).startOf('day').toDate());
            setEnd(moment(end).endOf('day').toDate());
        }
    };

    const handleStartChange = (date) => {
        const newStart = moment(date);
        setStart(allDay ? newStart.startOf('day').toDate() : newStart.toDate());
        
        // If end is before new start, adjust it
        if (moment(end).isBefore(newStart)) {
            setEnd(allDay ? newStart.endOf('day').toDate() : newStart.add(1, 'hour').toDate());
        }
    };

    const handleEndChange = (date) => {
        const newEnd = moment(date);
        setEnd(allDay ? newEnd.endOf('day').toDate() : newEnd.toDate());
    };

    const onSubmit = (event) => {
        event.preventDefault();
        
        // Ensure proper start/end times for all-day events
        const eventStart = allDay ? moment(start).startOf('day').toDate() : start;
        const eventEnd = allDay ? moment(end).endOf('day').toDate() : end;
        
        onEventAdded({
            title,
            start: eventStart,
            end: eventEnd,
            allDay
        });
        
        onClose();
        // Reset form
        setTitle("");
        setStart(new Date());
        setEnd(new Date());
        setAllDay(false);
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onClose}
            contentLabel="Add Event Modal"
            ariaHideApp={false}
            className="event-modal"
        >
            <form onSubmit={onSubmit} className="event-form">
                <div className="form-group">
                    <label htmlFor="event-title">Event Title</label>
                    <input 
                        id="event-title"
                        placeholder="Enter event title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox"
                            checked={allDay}
                            onChange={e => handleAllDayChange(e.target.checked)}
                        />
                        All Day Event
                    </label>
                </div>

                <div className="form-group">
                    <label>Start {allDay ? 'Date' : 'Date & Time'}</label>
                    <Datetime 
                        value={start} 
                        onChange={handleStartChange}
                        timeFormat={!allDay}
                        dateFormat="MMMM D, YYYY"
                        inputProps={{
                            placeholder: `Select start ${allDay ? 'date' : 'date and time'}`
                        }}
                    />
                </div>

                <div className="form-group">
                    <label>End {allDay ? 'Date' : 'Date & Time'}</label>
                    <Datetime 
                        value={end} 
                        onChange={handleEndChange}
                        timeFormat={!allDay}
                        dateFormat="MMMM D, YYYY"
                        inputProps={{
                            placeholder: `Select end ${allDay ? 'date' : 'date and time'}`
                        }}
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-button">
                        Add Event
                    </button>
                </div>
            </form>
        </Modal>
    );
}
