import Modal from "react-modal";
import React, { useState, useEffect } from "react";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import "../styles/components/AddEventModal.css";

export default function AddEventModal({isOpen, onClose, onEventAdded, initialStart, initialEnd, initialAllDay}) {
    const [title, setTitle] = useState("");
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [allDay, setAllDay] = useState(false);

    useEffect(() => {
        if (isOpen && initialStart && initialEnd) {
            setStart(initialStart);
            setEnd(initialEnd);
            setAllDay(initialAllDay || false);
        }
    }, [isOpen, initialStart, initialEnd, initialAllDay]);

    const onSubmit = (event) => {
        event.preventDefault();
        onEventAdded({title, start, end, allDay});
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
                            onChange={e => setAllDay(e.target.checked)}
                        />
                        All Day Event
                    </label>
                </div>

                <div className="form-group">
                    <label>Start {allDay ? 'Date' : 'Date & Time'}</label>
                    <Datetime 
                        value={start} 
                        onChange={date => setStart(date)}
                        timeFormat={!allDay}
                        inputProps={{
                            placeholder: `Select start ${allDay ? 'date' : 'date and time'}`
                        }}
                    />
                </div>

                <div className="form-group">
                    <label>End {allDay ? 'Date' : 'Date & Time'}</label>
                    <Datetime 
                        value={end} 
                        onChange={date => setEnd(date)}
                        timeFormat={!allDay}
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
