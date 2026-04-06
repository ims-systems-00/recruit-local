'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { name: 'Fantastic', value: 40, fill: '#C6005C' },
  { name: 'Not Good', value: 60, fill: '#F3F4F6' },
];

export default function ExperienceChart() {
  return (
    <div className="w-full">
      <div className=" flex justify-end items-center gap-spacing-lg">
        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#C6005C]"></div>
          <p className="text-body-sm text-text-gray-tertiary">Fantastic</p>
        </div>

        <div className="flex items-center gap-spacing-sm">
          <div className=" w-2 h-2 rounded-full bg-[#F3F4F6]"></div>
          <p className="text-body-sm text-text-gray-tertiary">Not Good</p>
        </div>
      </div>
      <div className=" w-full h-60 relative">
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
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
          Value: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }

  return null;
};
