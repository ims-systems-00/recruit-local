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
      <div className="flex items-center gap-2">
        {/* Nav arrows */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                view === key
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
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
