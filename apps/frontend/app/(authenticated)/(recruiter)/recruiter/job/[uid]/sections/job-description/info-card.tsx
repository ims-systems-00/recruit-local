import React from 'react';

type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | undefined | null | number;
};

export default function InfoCard({ icon, title, subtitle }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex gap-spacing-lg items-center">
      <div className="w-12 h-12 rounded-md flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero">
        {icon}
      </div>

      <div className="space-y-spacing-3xs">
        <p className="text-label-md font-label-md-strong! text-text-gray-primary">
          {title}
        </p>
        <p className="text-label-sm text-text-gray-tertiary capitalize">
          {subtitle || 'N/A'}
        </p>
      </div>
    </div>
  );
}
