'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { useState, useRef } from 'react';
import { MOCK_EVENTS } from './calendar/data';
import { CalendarHeader } from './calendar/calendar-header';
import { CalendarEvent, EventChip } from './calendar/event-chip';

type ViewType = 'month' | 'week' | 'day';

const viewMap = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
} as const;

function InterviewSchedule() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [currentDate, setCurrentDate] = useState('2026-04-02');
  const [view, setView] = useState<ViewType>('month');

  // ✅ Convert your events → FullCalendar format
  const events = MOCK_EVENTS.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    extendedProps: e, // 🔥 VERY IMPORTANT (fix for EventChip)
  }));

  const handleNavigate = (dir: 'prev' | 'next') => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    dir === 'prev' ? api.prev() : api.next();

    setCurrentDate(api.getDate().toISOString());
  };

  const handleViewChange = (v: ViewType) => {
    setView(v);

    const api = calendarRef.current?.getApi();
    api?.changeView(viewMap[v]);
  };

  return (
    <div className="border border-border-gray-primary rounded-2xl overflow-hidden">
      <CalendarHeader
        currentDate={new Date(currentDate)}
        view={view}
        onNavigate={handleNavigate}
        onViewChange={handleViewChange}
        onAddEvent={() => {}}
      />

      <div>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMap[view]}
          initialDate={currentDate}
          headerToolbar={false}
          events={events}
          allDaySlot={false} // ✅ removes all-day row
          dayMaxEvents={1}
          eventMaxStack={1}
          datesSet={(arg) => {
            setCurrentDate(arg.startStr);
          }}
          eventContent={(arg) => {
            const event = arg.event.extendedProps as CalendarEvent;
            return <EventChip event={event} />;
          }}
          slotDuration="00:30:00"
          moreLinkContent={(arg) => {
            return (
              <p className=" text-label-xs flex items-center justify-center">
                +{arg.num} more
              </p>
            );
          }}
          moreLinkClassNames={'h-fit'}
        />
      </div>
    </div>
  );
}

export default InterviewSchedule;
