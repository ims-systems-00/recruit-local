'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { day: 'Mon', interviewed: 7, hired: 7, rejected: 6 },
  { day: 'Tue', interviewed: 9, hired: 9, rejected: 7 },
  { day: 'Wed', interviewed: 5, hired: 6, rejected: 4 },
  { day: 'Thu', interviewed: 8, hired: 7, rejected: 6 },
  { day: 'Fri', interviewed: 5, hired: 6, rejected: 4 },
  { day: 'Sat', interviewed: 9, hired: 8, rejected: 7 },
  { day: 'Sun', interviewed: 7, hired: 7, rejected: 6 },
];

export default function HiringChart() {
  return (
    <div className="w-full">
      <div className=" flex justify-end items-center gap-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#C6005C]"></div>
          <p className="text-body-sm text-text-gray-tertiary">Interviewed</p>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#F6339A]"></div>
          <p className="text-body-sm text-text-gray-tertiary">Hired</p>
        </div>
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#FCCEE8]"></div>
          <p className="text-body-sm text-text-gray-tertiary">Rejected</p>
        </div>
      </div>
      <div className=" w-full h-60 relative">
        <div className=" absolute top-1/2 -translate-y-1/2 left-0">
          <p className=" text-body-xs text-text-gray-primary [writing-mode:vertical-rl] rotate-180">
            Active Candidates
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={20} barSize={32}>
            {/* Grid */}
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="3 3"
              vertical={false}
            />

            {/* X Axis */}
            <XAxis
              dataKey="day"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
            />

            {/* Y Axis */}
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            {/* Tooltip */}
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            />

            {/* Bars (Stacked) */}
            <Bar
              dataKey="interviewed"
              stackId="a"
              fill="#C6005C"
              // radius={[6, 6, 0, 0]}
              // shape={<CustomBar />}
            />

            <Bar
              dataKey="hired"
              stackId="a"
              fill="#F6339A"
              // radius={[6, 6, 0, 0]}
              // shape={<CustomBar />}
            />

            <Bar
              dataKey="rejected"
              stackId="a"
              fill="#FCCEE8"
              radius={[6, 6, 0, 0]}
              // shape={<CustomBar />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className=" flex items-center justify-center">
        <p className=" text-body-xs text-text-gray-primary">Timeline</p>
      </div>
    </div>
  );
}

// const CustomBar = ({ x, y, width, height, fill }: any) => {
//   return (
//     <rect
//       x={x}
//       y={y}
//       width={width}
//       height={height + 4}
//       rx={6}
//       ry={6}
//       fill={fill}
//     />
//   );
// };
