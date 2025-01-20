import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import React, { useState, useRef, useCallback } from "react";
import AddEventModal from "./AddEventModal";
import axios from "axios";
import moment from "moment";
import "../styles/components/Calendar.css";
import EventModal from "./EventModal";

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

export default function Calendar() {
    const [modalOpen, setModalOpen] = useState(false);
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
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
                id: event._id,
                title: event.title,
                start: event.start,
                end: event.end,
                allDay: event.allDay || false,
                repeat: event.repeat || 'none'
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
                allDay: event.allDay || false,
                repeat: event.repeat || 'none'
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

    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setEventModalOpen(true);
    };

    const handleEventUpdate = async (updatedEvent) => {
        try {
            await axios.put(`/api/calendar/update-event/${updatedEvent.id}`, {
                title: updatedEvent.title,
                start: moment(updatedEvent.start).format(),
                end: moment(updatedEvent.end).format(),
                allDay: updatedEvent.allDay,
                repeat: updatedEvent.repeat
            });
            
            // Refresh events
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
            setEventModalOpen(false);
        } catch (error) {
            console.error("Error updating event:", error);
            alert("Failed to update event. Please try again.");
        }
    };

    const handleEventDelete = async (eventToDelete) => {
        try {
            await axios.delete(`/api/calendar/delete-event/${eventToDelete.id}`);
            
            // Refresh events
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
            setEventModalOpen(false);
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event. Please try again.");
        }
    };

    return (
        <section className="calendar-section">
            <div className="calendar-header">
                <button 
                    className="add-event-button" 
                    onClick={() => {
                        const now = moment();
                        setSelectedTimeSlot({
                            start: now.format(),
                            end: moment(now).add(1, 'hour').format(),
                            allDay: false
                        });
                        setModalOpen(true);
                    }}
                >
                    Add Event
                </button>
            </div>
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
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
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
                    eventClick={handleEventClick}
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
            <EventModal
                isOpen={eventModalOpen}
                onClose={() => setEventModalOpen(false)}
                event={selectedEvent}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
            />
        </section>
    );
}