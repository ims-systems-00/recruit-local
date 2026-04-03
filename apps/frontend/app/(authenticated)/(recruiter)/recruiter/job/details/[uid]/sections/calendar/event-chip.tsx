import moment from 'moment';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: 'pink' | 'default';
  avatar?: string;
}

interface EventChipProps {
  event: CalendarEvent;
}

export function EventChip({ event }: EventChipProps) {
  const timeLabel = moment(event.start).format('h:mm A');
  const isPink = event.color === 'pink';

  if (isPink) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200 w-full min-w-0">
        {event.avatar && (
          <div className="w-4 h-4 rounded-full bg-pink-400 flex items-center justify-center shrink-0 text-white text-[8px] font-bold">
            {event.avatar.charAt(0)}
          </div>
        )}
        <span className="text-pink-600 font-medium text-xs truncate flex-1">
          {event.title}
        </span>
        <span className="text-pink-400 text-xs shrink-0 ml-auto">
          {timeLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 w-full min-w-0">
      <span className="text-gray-700 font-medium text-xs truncate flex-1">
        {event.title}
      </span>
      <span className="text-gray-400 text-xs shrink-0 ml-auto">
        {timeLabel}
      </span>
    </div>
  );
}
