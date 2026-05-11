import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';

type ViewType = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onNavigate: (dir: 'prev' | 'next') => void;
  onViewChange: (v: ViewType) => void;
  onAddEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onNavigate,
  onViewChange,
  onAddEvent,
}: CalendarHeaderProps) {
  const monthYear = moment(currentDate).format('MMMM YYYY');
  const todayLabel = moment().format('MMMM D, YYYY');

  const views: { key: ViewType; label: string }[] = [
    { key: 'month', label: 'Monthly' },
    { key: 'week', label: 'Weekly' },
    { key: 'day', label: 'Daily' },
  ];

  return (
    <div className="flex items-center justify-between p-spacing-4xl gap-spacing-4xl">
      {/* Left: Month/Year + today's date */}
      <div>
        <div className="flex items-center gap-1 cursor-pointer select-none">
          <span className="text-lg font-bold text-gray-900">{monthYear}</span>
          <ChevronDown className="w-4 h-4 text-gray-500 mt-0.5" />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{todayLabel}</p>
      </div>

      {/* Right: nav + view toggle + add */}
      <div className="flex items-center gap-spacing-sm">
        {/* Nav arrows */}
        <button
          onClick={() => onNavigate('prev')}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-gray-soft-primary border border-border-gray-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-fg-gray-secondary" />
        </button>

        <button
          onClick={() => onNavigate('next')}
          className=" w-10 h-10 flex items-center justify-center rounded-lg bg-bg-gray-soft-primary border border-border-gray-primary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-fg-gray-secondary" />
        </button>

        {/* View toggle */}
        <div className="flex items-center border border-border-gray-primary rounded-lg overflow-hidden">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`px-spacing-xl h-10 flex justify-center items-center py-spacing-md text-label-sm font-label-sm-strong!  transition-colors border-r last:border-r-0 border-border-gray-primary ${
                view === key
                  ? 'bg-bg-gray-soft-secondary text-text-gray-primary'
                  : 'bg-bg-gray-soft-primary text-text-gray-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add Event */}
        {/* <Button
          onClick={onAddEvent}
          className="gap-1.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button> */}
      </div>
    </div>
  );
}
