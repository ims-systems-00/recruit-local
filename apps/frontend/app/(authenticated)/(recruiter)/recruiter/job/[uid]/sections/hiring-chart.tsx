'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { JobOverviewStage } from '@/services/application/application.type';

const FALLBACK_FILL = '#F6339A';

/** Statuses default to white, which disappears on the card background. */
const barFill = (color?: string) =>
  !color || /^#f{3}(f{3})?$/i.test(color) ? FALLBACK_FILL : color;

export default function HiringChart({
  stages,
}: {
  stages: JobOverviewStage[];
}) {
  return (
    <div className="w-full space-y-spacing-lg">
      <div className="w-full h-52 sm:h-60 relative pl-spacing-2xs sm:pl-spacing-2xl">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 hidden xs:block">
          <p className="text-body-xs text-text-gray-primary [writing-mode:vertical-rl] rotate-180">
            Applicants
          </p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stages}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            {/* Grid */}
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="3 3"
              vertical={false}
            />

            {/* X Axis */}
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              interval={0}
            />

            {/* Y Axis */}
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            />

            <Bar dataKey="count" name="Applicants" radius={[6, 6, 0, 0]}>
              {stages.map((stage) => (
                <Cell
                  key={stage.statusId}
                  fill={barFill(stage.backgroundColor)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center">
        <p className="text-body-xs text-text-gray-primary">Stage</p>
      </div>
    </div>
  );
}
