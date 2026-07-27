import React from 'react';

type VerificationInfoCardProps = {
  icon: React.ReactNode;
  title: string;
  description?: string | undefined | null | number;
};

export default function VerificationInfoCard({
  icon,
  title,
  description,
}: VerificationInfoCardProps) {
  return (
    <div className="rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-4xl">
      <div>{icon}</div>

      <div className="space-y-spacing-3xs">
        <p className="text-label-md font-label-md-strong! text-text-gray-primary">
          {title}
        </p>
        <p className="text-label-sm text-text-gray-tertiary">
          {description || 'N/A'}
        </p>
      </div>
    </div>
  );
}
