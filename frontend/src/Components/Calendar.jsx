import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from '@fullcalendar/interaction';
import React, { useState, useRef, useCallback } from "react";
import { UserButton, useOrganization, useUser, useAuth } from "@clerk/clerk-react";
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
    
    const { organization } = useOrganization();
    const { user } = useUser();
    const { getToken } = useAuth();

    const fetchEvents = useCallback(async (start, end) => {
        if (!organization) return;
        
        try {
            const response = await axios.get("/api/calendar/get-events", {
                params: {
                    start: moment(start).format(),
                    end: moment(end).format(),
                    organizationId: organization.id
                },
                headers: {
                    'Authorization': `Bearer ${await getToken()}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            // Generate a color based on userId
            const getEventColor = (userId) => {
                // List of distinct colors
                const colors = [
                    '#3788d8', // Blue (default)
                    '#28a745', // Green
                    '#dc3545', // Red
                    '#fd7e14', // Orange
                    '#6f42c1', // Purple
                    '#20c997', // Teal
                    '#e83e8c', // Pink
                    '#6c757d'  // Gray
                ];
                
                // Use the last characters of userId to generate a consistent index
                const index = parseInt(userId.slice(-8), 16) % colors.length;
                return colors[index];
            };
            
            const formattedEvents = response.data.map(event => ({
                id: event._id,
                _id: event._id,
                title: event.title,
                start: event.start,
                end: event.end,
                allDay: event.allDay || false,
                editable: event.editable,
                userId: event.userId,
                creatorEmail: event.creatorEmail,
                backgroundColor: getEventColor(event.userId),
                borderColor: getEventColor(event.userId)
            }));
            
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }, [organization, getToken]);

    const onEventAdded = async (event) => {
        try {
            if (!organization) {
                alert("Please select or create a friend group first");
                return;
            }

            const calendarEvent = {
                title: event.title,
                start: moment(event.start).format(),
                end: moment(event.end).format(),
                allDay: event.allDay || false
            };
            
            console.log("Attempting to add event:", calendarEvent);
            await handleEventAdd({ event: calendarEvent });
            
            // Refresh events
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        } catch (error) {
            console.error("Error adding event:", error.response?.data || error);
            alert(`Failed to add event: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        }
    };

    const handleDateSelect = (selectInfo) => {
        setSelectedTimeSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            allDay: selectInfo.allDay
        });
        setModalOpen(true);
    };

    const handleEventAdd = async (data) => {
        if (!organization) {
            console.error("No organization selected");
            throw new Error("Please select or create a friend group first");
        }
        
        try {
            const token = await getToken();
            console.log("Adding event with:", {
                organizationId: organization.id,
                userId: user.id,
                event: data.event
            });
            
            const response = await axios.post("/api/calendar/create-event", {
                ...data.event,
                organizationId: organization.id,
                userId: user.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            console.log("Event created successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error saving event:", {
                error: error.response?.data || error,
                status: error.response?.status,
                headers: error.response?.headers
            });
            throw error;
        }
    };

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
        console.log("Raw event object:", clickInfo.event);
        
        // Get the full event data from our events state
        const fullEvent = events.find(e => e.id === clickInfo.event.id);
        if (!fullEvent) {
            console.error("Event not found in state:", clickInfo.event.id);
            return;
        }
        
        const eventData = {
            _id: fullEvent.id,
            title: fullEvent.title,
            start: clickInfo.event.start,
            end: clickInfo.event.end,
            allDay: clickInfo.event.allDay,
            editable: fullEvent.editable,
            userId: fullEvent.userId,
            creatorEmail: fullEvent.creatorEmail
        };
        
        console.log("Final eventData being set:", eventData);
        setSelectedEvent(eventData);
        setEventModalOpen(true);
    };

    const handleEventUpdate = async (updatedEvent) => {
        if (!organization) return;
        
        // Find the original event to check editability
        const originalEvent = events.find(e => e.id === updatedEvent._id);
        if (!originalEvent?.editable) {
            alert("You don't have permission to edit this event");
            // Refresh to revert changes
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
            return;
        }
        
        try {
            await axios.put(`/api/calendar/update-event/${updatedEvent._id}`, {
                title: updatedEvent.title,
                start: moment(updatedEvent.start).format(),
                end: moment(updatedEvent.end).format(),
                allDay: updatedEvent.allDay
            }, {
                headers: {
                    'Authorization': `Bearer ${await getToken()}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
            setEventModalOpen(false);
        } catch (error) {
            console.error("Error updating event:", error);
            alert(error.response?.data?.error || "Failed to update event. Please try again.");
            // Refresh to revert changes
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        }
    };

    const handleEventDelete = async (eventToDelete) => {
        if (!organization) return;
        
        // Find the original event to check editability
        const originalEvent = events.find(e => e.id === eventToDelete._id);
        if (!originalEvent?.editable) {
            alert("You don't have permission to delete this event");
            return;
        }
        
        try {
            await axios.delete(`/api/calendar/delete-event/${eventToDelete._id}`, {
                headers: {
                    'Authorization': `Bearer ${await getToken()}`,
                    'X-Organization-Id': organization.id
                }
            });
            
            const calendarApi = calendarRef.current.getApi();
            await fetchEvents(calendarApi.view.activeStart, calendarApi.view.activeEnd);
            setEventModalOpen(false);
        } catch (error) {
            console.error("Error deleting event:", error);
            alert(error.response?.data?.error || "Failed to delete event. Please try again.");
        }
    };

    if (!organization) {
        return (
            <div className="no-organization-message">
                <h2>Welcome to Gatherly!</h2>
                <p>To get started, create or join a friend group using the organization switcher above.</p>
            </div>
        );
    }

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
                <div className="user-controls">
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
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
                    editable={true} // Enable drag and drop
                    eventDrop={handleEventUpdate} // Handle drag and drop updates
                    eventResize={handleEventUpdate} // Handle event resizing
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
                canEdit={events.find(e => e.id === selectedEvent?._id)?.editable}
            />
        </section>
    );
}