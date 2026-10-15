'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full pb-spacing-4xl', className)}>
      <div className="relative">
        <div className="flex justify-between items-start mb-spacing-lg sm:mb-spacing-2xl">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <div className="relative flex items-center justify-center w-full mb-spacing-xs sm:mb-spacing-sm">
                  {index > 0 && (
                    <div
                      className={cn(
                        'absolute top-1/2 right-1/2 h-0.5 -translate-y-1/2 bg-border-gray-secondary',
                        isCompleted && 'bg-bg-brand-solid-primary',
                      )}
                      style={{
                        width: 'calc(100% + 1rem)',
                      }}
                    />
                  )}

                  <div
                    className={cn(
                      'relative z-10 text-text-gray-quinary flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full shrink-0 font-semibold transition-all bg-bg-gray-soft-primary border border-border-gray-secondary text-label-xs sm:text-label-sm',
                      (isActive || isCompleted) &&
                        'bg-bg-brand-solid-primary text-white border-bg-brand-solid-primary shadow-focus-ring-brand',
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        strokeWidth={3}
                      />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    'text-label-xs sm:text-label-sm font-label-sm-strong! text-text-gray-secondary text-center truncate max-w-[64px] sm:max-w-none px-0.5',
                    (isActive || isCompleted) && 'text-text-brand-primary',
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
