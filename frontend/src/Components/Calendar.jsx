import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import React from "react";

export default function Calendar() {

    const [modalOpen, setModalOpen] = useState(false);
    const calendarRef = useRef(null);

    const onEventAdded = (event) => {
        let calendarApi = calendarRef.current.getApi();
        calendarApi.addEvent(event);
    }

    return (
        <section>
            <button onClick={() => setModalOpen(true)}>Add Event</button>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
            />
            <AddEventModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onEventAdded={addEvent} />
        </section>
    );
}