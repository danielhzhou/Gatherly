import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import React, { useState, useRef } from "react";
import AddEventModal from "./AddEventModal";
import axios from "axios";
import moment from "moment";

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

export default function Calendar() {
    const [modalOpen, setModalOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const calendarRef = useRef(null);

    const onEventAdded = async (event) => {
        try {
            const calendarEvent = {
                title: event.title,
                start: moment(event.start).toDate(),
                end: moment(event.end).toDate(),
            };
            
            await handleEventAdd({ event: calendarEvent });
            let calendarApi = calendarRef.current.getApi();
            calendarApi.addEvent(calendarEvent);
        } catch (error) {
            console.error("Error adding event:", error);
            alert("Failed to add event. Please try again.");
        }
    }

    async function handleEventAdd(data) {
        try {
            await axios.post("/api/calendar/create-event", data.event);
        } catch (error) {
            console.error("Error saving event:", error);
            throw error;
        }
    }

    async function handleDatesSet(data) {
        try {
            const response = await axios.get("/api/calendar/get-events", {
                params: {
                    start: moment(data.start).toISOString(),
                    end: moment(data.end).toISOString()
                }
            });
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }

    return (
        <section>
            <button onClick={() => setModalOpen(true)}>Add Event</button>
            <div style={{position: 'relative', zIndex: 0}}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth'
                    }}
                    height="auto"
                    eventAdd={event => handleEventAdd(event)}
                    datesSet={(date) => handleDatesSet(date)}
                />
            </div>
            <AddEventModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onEventAdded={onEventAdded} />
        </section>
    );
}