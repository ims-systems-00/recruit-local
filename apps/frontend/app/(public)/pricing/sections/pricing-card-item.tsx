'use client';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';
import React from 'react';

export default function PricingCardItem({
  title,
  price,
  isPopular = false,
  buttonText,
  onClickFunction,
  subtitle,
}: {
  title: string;
  price: string;
  isPopular?: boolean;
  buttonText: string;
  onClickFunction?: () => void;
  subtitle: string;
}) {
  return (
    <div
      className={cn(
        'bg-bg-gray-soft-primary h-fit rounded-2xl p-spacing-4xl border border-border-gray-secondary space-y-spacing-4xl shadow-xs',
        isPopular && ' border-border-brand-primary',
      )}
    >
      <div className={cn('space-y-spacing-4xl', isPopular && 'min-h-[143px]')}>
        <div className="space-y-spacing-2xs">
          <div className=" flex items-center justify-between gap-spacing-xl">
            <p className="text-label-md font-label-md-strong! text-text-gray-primary">
              {title}
            </p>
            {isPopular && (
              <span className="text-label-xs font-label-xs-strong!  h-5 whitespace-nowrap inline-flex items-center gap-spacing-2xs px-spacing-sm py-spacing-3xs rounded-md border border-others-brand-light bg-others-brand-brand-zero">
                <Flame className="text-others-brand-default size-3" />
                <span className="text-others-brand-dark">Most Popular</span>
              </span>
            )}
          </div>
          <p className="text-label-sm text-text-gray-tertiary">{subtitle}</p>
        </div>

        <div className="flex items-end gap-spacing-2xs">
          <h3 className=" text-heading-lg font-heading-lg-strong! text-text-gray-secondary">
            £{price}
          </h3>
          {Number(price) > 0 && (
            <span className="text-label-sm text-text-gray-quaternary">
              Per Month
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onClickFunction?.()}
        className="text-label-sm rounded-lg font-label-sm-strong! flex items-center h-10 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary text-text-white w-full"
      >
        {buttonText}
      </button>
    </div>
  );
}
