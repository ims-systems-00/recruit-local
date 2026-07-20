'use client';

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { day: 'Mon', total: 620, new: 120 },
  { day: 'Tue', total: 640, new: 140 },
  { day: 'Wed', total: 680, new: 180 },
  { day: 'Thu', total: 720, new: 260 },
  { day: 'Fri', total: 760, new: 320 },
  { day: 'Sat', total: 740, new: 300 },
  { day: 'Sun', total: 820, new: 450 },
];

export default function ApplicantsChart() {
  return (
    <div className="w-full">
      <div className=" flex justify-end items-center gap-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#C6005C]"></div>
          <p className="text-body-sm text-text-gray-tertiary">
            Total Applicants
          </p>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#F6339A]"></div>
          <p className="text-body-sm text-text-gray-tertiary">New Applicants</p>
        </div>
      </div>
      <div className=" w-full h-60 relative">
        <div className=" absolute top-1/2 -translate-y-1/2 left-0">
          <p className=" text-body-xs text-text-gray-primary [writing-mode:vertical-rl] rotate-180">
            Applicants
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
            <XAxis dataKey="day" tick={{ fill: '#4A5565', fontSize: 12 }} />
            <YAxis tick={{ fill: '#4A5565', fontSize: 12 }} />

            {/* Tooltip */}
            <Tooltip />

            {/* Legend */}
            {/* <Legend /> */}

            {/* Area (background fill) */}
            <Area
              type="monotone"
              dataKey="total"
              stroke="#C6005C"
              fill="url(#colorTotal)"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="new"
              stroke="#F6339A"
              fill="url(#colorNew)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className=" flex items-center justify-center">
        <p className=" text-body-xs text-text-gray-primary">Week</p>
      </div>
    </div>
  );
}
