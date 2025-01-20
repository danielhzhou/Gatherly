import Modal from "react-modal";
import React, { useState, useEffect } from "react";
import Datetime from "react-datetime";
import moment from "moment";
import "react-datetime/css/react-datetime.css";
import "../styles/components/EventModal.css";
import RepeatOptions from "./RepeatOptions";

export default function EventModal({ isOpen, onClose, event, onEventUpdate, onEventDelete }) {
    const [title, setTitle] = useState("");
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [allDay, setAllDay] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [repeatOption, setRepeatOption] = useState("none");

    useEffect(() => {
        if (isOpen && event) {
            setTitle(event.title);
            setStart(moment(event.start).toDate());
            setEnd(moment(event.end).toDate());
            setAllDay(event.allDay || false);
            setRepeatOption(event.repeat || "none");
            setIsEditing(false);
        }
    }, [isOpen, event]);

    const handleStartChange = (date) => {
        const newStart = moment(date);
        setStart(allDay ? newStart.startOf('day').toDate() : newStart.toDate());
        
        if (moment(end).isBefore(newStart)) {
            setEnd(allDay ? newStart.endOf('day').toDate() : newStart.add(1, 'hour').toDate());
        }
    };

    const handleEndChange = (date) => {
        const newEnd = moment(date);
        setEnd(allDay ? newEnd.endOf('day').toDate() : newEnd.toDate());
    };

    const handleAllDayChange = (checked) => {
        setAllDay(checked);
        if (checked) {
            setStart(moment(start).startOf('day').toDate());
            setEnd(moment(end).endOf('day').toDate());
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        onEventUpdate({
            ...event,
            title,
            start,
            end,
            allDay,
            repeat: repeatOption
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            onEventDelete(event);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Event Modal"
            ariaHideApp={false}
            className="event-modal"
        >
            <form onSubmit={handleSave} className="event-form">
                <div className="modal-header">
                    <h2>{isEditing ? "Edit Event" : "Event Details"}</h2>
                    <button type="button" className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="form-group">
                    <label htmlFor="event-title">Event Title</label>
                    <input
                        id="event-title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        disabled={!isEditing}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={e => handleAllDayChange(e.target.checked)}
                            disabled={!isEditing}
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
                            disabled: !isEditing,
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
                            disabled: !isEditing,
                            placeholder: `Select end ${allDay ? 'date' : 'date and time'}`
                        }}
                    />
                </div>

                <div className="form-group">
                    <label>Repeat</label>
                    <RepeatOptions
                        value={repeatOption}
                        onChange={setRepeatOption}
                        disabled={!isEditing}
                    />
                </div>

                <div className="form-actions">
                    {!isEditing ? (
                        <>
                            <button type="button" className="edit-button" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                            <button type="button" className="delete-button" onClick={handleDelete}>
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="cancel-button" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="save-button">
                                Save
                            </button>
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
} 