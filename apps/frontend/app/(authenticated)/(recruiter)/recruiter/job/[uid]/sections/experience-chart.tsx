'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { JobOverviewMatchScore } from '@/services/application/application.type';

const BANDS = [
  { key: 'strong', name: 'Strong match', fill: '#C6005C' },
  { key: 'good', name: 'Good match', fill: '#F6339A' },
  { key: 'weak', name: 'Weak match', fill: '#FCCEE8' },
] as const;

export default function ExperienceChart({
  matchScore,
}: {
  matchScore: JobOverviewMatchScore;
}) {
  const data = BANDS.map((band) => ({ ...band, value: matchScore[band.key] }));
  const isEmpty = data.every((d) => d.value === 0);

  return (
    <div className="w-full space-y-spacing-lg">
      <div className="flex flex-wrap justify-start sm:justify-end items-center gap-spacing-lg">
        {data.map((band) => (
          <div key={band.key} className="flex items-center gap-spacing-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: band.fill }}
            ></div>
            <p className="text-body-sm text-text-gray-tertiary">
              {band.name} ({band.value})
            </p>
          </div>
        ))}
      </div>
      <div className="w-full h-52 sm:h-60 relative">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-body-sm text-text-gray-tertiary">
              No applicants yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="70%"
                outerRadius="100%"
                paddingAngle={4}
                cornerRadius={8}
                isAnimationActive={true}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 shadow text-[#C6005C]">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm">
          Applicants: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }

  return null;
};
