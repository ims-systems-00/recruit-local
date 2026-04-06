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
      <div className="flex items-center justify-between gap-spacing-3xs px-spacing-sm py-spacing-2xs rounded-md h-6 bg-others-brand-brand-zero border-l-2 border-others-brand-default w-full min-w-0">
        {event.avatar && (
          <div className="w-4 h-4 rounded-full bg-pink-400 flex items-center justify-center shrink-0 text-white text-[8px] font-bold">
            {event.avatar.charAt(0)}
          </div>
        )}
        <span className="text-label-xs font-label-xs-strong! text-others-brand-dark truncate flex-1">
          {event.title}
        </span>
        <span className="text-label-xs text-others-brand-default shrink-0 ml-auto">
          {timeLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-spacing-3xs px-spacing-sm py-spacing-2xs rounded-md h-6 bg-others-gray-xlight border-l-2 border-others-gray-default w-full min-w-0">
      <span className="text-label-xs font-label-xs-strong! text-others-gray-dark truncate flex-1">
        {event.title}
      </span>
      <span className="text-label-xs text-others-gray-default shrink-0 ml-auto">
        {timeLabel}
      </span>
    </div>
  );
}
