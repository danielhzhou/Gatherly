import Modal from "react-modal";
import React, { useState, useEffect } from "react";
import Datetime from "react-datetime";
import moment from "moment";
import "react-datetime/css/react-datetime.css";
import "../styles/components/EventModal.css";

export default function EventModal({ isOpen, onClose, event, onEventUpdate, onEventDelete, canEdit }) {
    const [title, setTitle] = useState("");
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date());
    const [allDay, setAllDay] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && event) {
            setTitle(event.title);
            setStart(moment(event.start).toDate());
            setEnd(moment(event.end).toDate());
            setAllDay(event.allDay || false);
        }
    }, [isOpen, event]);

    const handleStartChange = (date) => {
        if (!canEdit) return;
        
        const newStart = moment(date);
        setStart(allDay ? newStart.startOf('day').toDate() : newStart.toDate());
        
        if (moment(end).isBefore(newStart)) {
            const newEnd = allDay 
                ? newStart.clone().endOf('day').toDate()
                : newStart.clone().add(1, 'hour').toDate();
            setEnd(newEnd);
        }
        setError("");
    };

    const handleEndChange = (date) => {
        if (!canEdit) return;
        
        const newEnd = moment(date);
        const proposedEnd = allDay ? newEnd.endOf('day').toDate() : newEnd.toDate();
        
        if (moment(proposedEnd).isSameOrBefore(start)) {
            setError("End time must be after start time");
            return;
        }
        
        setEnd(proposedEnd);
        setError("");
    };

    const handleAllDayChange = (checked) => {
        if (!canEdit) return;
        
        setAllDay(checked);
        if (checked) {
            setStart(moment(start).startOf('day').toDate());
            setEnd(moment(end).endOf('day').toDate());
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        
        if (!canEdit) return;
        
        if (moment(end).isSameOrBefore(start)) {
            setError("End time must be after start time");
            return;
        }

        onEventUpdate({
            _id: event._id,
            title,
            start,
            end,
            allDay
        });
    };

    const handleDelete = () => {
        if (!canEdit) return;
        
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
                    <h2>{canEdit ? 'Edit Event' : 'View Event'}</h2>
                    <button type="button" className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="form-group">
                    <label htmlFor="event-title">Event Title</label>
                    <input
                        id="event-title"
                        value={title}
                        onChange={e => canEdit && setTitle(e.target.value)}
                        disabled={!canEdit}
                        required
                    />
                </div>

                {event?.creatorEmail && (
                    <div className="form-group creator-info">
                        <label>Created by</label>
                        <div className="creator-email">{event.creatorEmail}</div>
                    </div>
                )}

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={e => handleAllDayChange(e.target.checked)}
                            disabled={!canEdit}
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
                            disabled: !canEdit,
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
                            disabled: !canEdit,
                            placeholder: `Select end ${allDay ? 'date' : 'date and time'}`
                        }}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                    {canEdit && (
                        <>
                            <button type="button" className="delete-button" onClick={handleDelete}>
                                Delete
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