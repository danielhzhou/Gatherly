import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import React, { useState, useRef, useCallback } from "react";
import AddEventModal from "./AddEventModal";
import axios from "axios";
import moment from "moment";
import "../styles/components/Calendar.css";

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

export default function Calendar() {
    const [modalOpen, setModalOpen] = useState(false);
    const [events, setEvents] = useState([]);
    const calendarRef = useRef(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

    const fetchEvents = useCallback(async (start, end) => {
        try {
            const response = await axios.get("/api/calendar/get-events", {
                params: {
                    start: moment(start).format(),
                    end: moment(end).format()
                }
            });
            
            const formattedEvents = response.data.map(event => ({
                ...event,
                start: moment(event.start).toDate(),
                end: moment(event.end).toDate(),
                allDay: event.allDay || false
            }));
            
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }, []);

    const onEventAdded = async (event) => {
        try {
            const calendarEvent = {
                title: event.title,
                start: moment(event.start).format(),
                end: moment(event.end).format(),
                allDay: event.allDay || false
            };
            
            await handleEventAdd({ event: calendarEvent });
            
            // Refresh events
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        } catch (error) {
            console.error("Error adding event:", error);
            alert("Failed to add event. Please try again.");
        }
    }

    const handleDateSelect = (selectInfo) => {
        setSelectedTimeSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            allDay: selectInfo.allDay
        });
        setModalOpen(true);
    };

    const handleAddEventClick = () => {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
        setSelectedTimeSlot({
            start: now,
            end: oneHourLater,
            allDay: false
        });
        setModalOpen(true);
    };

    async function handleEventAdd(data) {
        try {
            await axios.post("/api/calendar/create-event", data.event);
        } catch (error) {
            console.error("Error saving event:", error);
            throw error;
        }
    }

    const handleDatesSet = async (data) => {
        await fetchEvents(data.start, data.end);
    };

    const handleViewDidMount = async () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTimeSlot(null);
        if (calendarRef.current) {
            calendarRef.current.getApi().unselect();
        }
    };

    return (
        <section className="calendar-section">
            <button className="add-event-button" onClick={handleAddEventClick}>
                Add Event
            </button>
            <div className="calendar-container">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    nowIndicator={true}
                    height="auto"
                    datesSet={handleDatesSet}
                    viewDidMount={handleViewDidMount}
                    displayEventEnd={true}
                    displayEventTime={true}
                    selectable={true}
                    select={handleDateSelect}
                    selectMirror={true}
                    dayMaxEvents={true}
                    unselectAuto={false}
                />
            </div>
            <AddEventModal 
                isOpen={modalOpen} 
                onClose={handleCloseModal} 
                onEventAdded={onEventAdded}
                initialStart={selectedTimeSlot?.start}
                initialEnd={selectedTimeSlot?.end}
                initialAllDay={selectedTimeSlot?.allDay}
            />
        </section>
    );
}