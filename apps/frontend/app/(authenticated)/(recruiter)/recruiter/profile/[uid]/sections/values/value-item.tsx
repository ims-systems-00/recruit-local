'use client';

import React, { useState } from 'react';
import { PencilIcon } from 'lucide-react';
import { VALUE_TYPE_ENUM } from '@rl/types';
import EditValueDialog from './edit-value-dialog';
import { ValueData } from '@/services/value';

interface ValueItemProps {
  name: string;
  icon: React.ReactNode;
  type: VALUE_TYPE_ENUM;
  title: string;
  placeholder: string;
  tenantId: string;
  tenantName: string;
  existingValues: ValueData[];
  types: VALUE_TYPE_ENUM[];
  values: ValueData[];
  onSuccess: (values: ValueData[]) => void;
}

export default function ValueItem({
  name,
  icon,
  type,
  title,
  placeholder,
  tenantId,
  tenantName,
  existingValues,
  types,
  values,
  onSuccess,
}: ValueItemProps) {
  const [open, setOpen] = useState(false);

  console.log('existingValues', existingValues);

  return (
    <>
      <div className="rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary p-spacing-4xl shadow-xs space-y-spacing-4xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-spacing-2xl">
            <div className="flex size-10 items-center justify-center rounded-lg border border-others-gray-light bg-others-gray-gray-zero shadow-xs">
              {icon}
            </div>

            <p className="text-label-md font-label-md-strong! text-text-gray-primary">
              {name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className=" cursor-pointer"
          >
            <PencilIcon className="size-4.5 text-fg-gray-secondary" />
          </button>
        </div>

        <div className="flex flex-wrap gap-spacing-2xl">
          {values.length === 0 ? (
            <span className="inline-flex min-h-6 items-center rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-others-gray-dark">
              No values found
            </span>
          ) : (
            values.map((value) => (
              <span
                key={value._id}
                className="inline-flex min-h-6 items-center rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary px-spacing-md py-spacing-3xs text-label-sm font-label-sm-strong! text-others-gray-dark"
              >
                {value.label}
              </span>
            ))
          )}
        </div>
      </div>

      <EditValueDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        placeholder={placeholder}
        tenantId={tenantId}
        tenantName={tenantName}
        existingValues={existingValues}
        types={[type]}
        onSuccess={onSuccess}
      />
    </>
  );
}
