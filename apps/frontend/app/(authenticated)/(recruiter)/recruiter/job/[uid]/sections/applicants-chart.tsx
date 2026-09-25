'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  JobOverviewDaily,
  JobOverviewRange,
} from '@/services/application/application.type';

/** `YYYY-MM-DD` is a calendar day, not an instant: read it at noon UTC so no timezone shifts it. */
const formatDay = (date: string, range: JobOverviewRange) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(
    'en-GB',
    range === 'week'
      ? { weekday: 'short', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', timeZone: 'UTC' },
  );

export default function ApplicantsChart({
  data,
  range,
}: {
  data: JobOverviewDaily[];
  range: JobOverviewRange;
}) {
  const chartData = data.map((d) => ({ ...d, day: formatDay(d.date, range) }));

  return (
    <div className="w-full space-y-spacing-lg">
      <div className="flex flex-wrap justify-start sm:justify-end items-center gap-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className="w-2 h-2 rounded-full bg-[#C6005C]"></div>
          <p className="text-body-sm text-text-gray-tertiary">
            Total Applicants
          </p>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <div className="w-2 h-2 rounded-full bg-[#F6339A]"></div>
          <p className="text-body-sm text-text-gray-tertiary">New Applicants</p>
        </div>
      </div>
      <div className="w-full h-52 sm:h-60 relative pl-spacing-2xs sm:pl-spacing-2xl">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 hidden xs:block">
          <p className="text-body-xs text-text-gray-primary [writing-mode:vertical-rl] rotate-180">
            Applicants
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            {/* Gradient */}
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#615FFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#615FFF" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#615FFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#615FFF" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            {/* Axes */}
            <XAxis
              dataKey="day"
              tick={{ fill: '#4A5565', fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tick={{ fill: '#4A5565', fontSize: 12 }}
              allowDecimals={false}
            />

            {/* Tooltip */}
            <Tooltip />

            {/* Area (background fill) */}
            <Area
              type="monotone"
              dataKey="total"
              name="Total Applicants"
              stroke="#C6005C"
              fill="url(#colorTotal)"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="new"
              name="New Applicants"
              stroke="#F6339A"
              fill="url(#colorNew)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center">
        <p className="text-body-xs text-text-gray-primary">
          {range === 'week' ? 'Week' : 'Month'}
        </p>
      </div>
    </div>
  );
}
