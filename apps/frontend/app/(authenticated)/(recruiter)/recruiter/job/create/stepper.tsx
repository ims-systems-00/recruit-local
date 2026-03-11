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
    <div className="w-full pb-6">
      <div className="relative">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="relative flex items-center justify-center w-full mb-3 sm:mb-4">
                  {index > 0 && (
                    <div
                      className={cn(
                        'absolute top-1/2 right-1/2 h-1 sm:h-0.5 -translate-y-1/2 bg-border-gray-secondary',

                        isCompleted && ' bg-bg-brand-solid-primary',
                      )}
                      style={{
                        width: 'calc(100% + 1rem)',
                      }}
                    />
                  )}

                  <div
                    className={cn(
                      ' relative z-10 text-text-gray-quinary flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full shrink-0 font-semibold transition-all bg-bg-gray-soft-primary border border-border-gray-secondary',
                      (isActive || isCompleted) &&
                        'bg-bg-brand-solid-primary text-white border-bg-brand-solid-primary',
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        strokeWidth={3}
                      />
                    ) : (
                      <span className=" text-label-sm ">{step.id}</span>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    ' text-label-sm font-label-sm-strong! text-text-gray-secondary',
                    (isActive || isCompleted) && ' text-text-brand-primary',
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
