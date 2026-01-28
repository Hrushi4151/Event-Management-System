'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './calendar-custom.css';

export default function EventsCalender({ events }) {
  const calendarEvents = events.map(event => ({
    id: event._id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    backgroundColor:
      event.registration?.status === 'Accepted'
        ? '#10b981' // Green-500
        : event.registration?.status === 'Pending'
        ? '#f59e0b' // Amber-500
        : '#3b82f6', // Blue-500
    borderColor: 'transparent',
    extendedProps: {
      location: event.location,
      status: event.registration?.status || 'Available',
    },
  }));

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700/50">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        eventClick={(info) => {
          window.location.href = `/dashboard/events/${info.event.id}`;
        }}
        eventContent={(arg) => (
          <div className="px-1.5 py-1 overflow-hidden">
            <p className="text-xs font-semibold truncate">{arg.event.title}</p>
            {arg.view.type === 'dayGridMonth' && (
              <p className="text-[10px] text-gray-200 truncate opacity-90">
                📍 {arg.event.extendedProps.location}
              </p>
            )}
          </div>
        )}
        dayMaxEvents={3}
        moreLinkText={(num) => `+${num} more`}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short'
        }}
      />
    </div>
  );
}
