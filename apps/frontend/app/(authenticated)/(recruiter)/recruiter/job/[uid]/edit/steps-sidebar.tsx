import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Basic Information',
    subtitle:
      'Explore exciting opportunities and discover your next career path!',
  },
  {
    number: 2,
    title: 'Job Description',
    subtitle:
      'A Comprehensive Overview of Job Responsibilities and Expectations',
  },
  {
    number: 3,
    title: 'Additional Queries',
    subtitle: 'Crafting Impactful Value-Based Interview Questions',
  },
];

interface StepsSidebarProps {
  currentStep: number;
}

export function StepsSidebar({ currentStep }: StepsSidebarProps) {
  return (
    <div className="w-[312px] min-w-[312px] shrink-0 pt-spacing-4xl pl-spacing-4xl border-l border-border-gray-secondary">
      <h2 className=" text-label-xl font-label-xl-strong! text-text-gray-primary mb-spacing-4xl">
        Steps
      </h2>
      <div className="flex flex-col gap-spacing-4xl">
        {STEPS.map((step, index) => {
          const completed = step.number < currentStep;
          const active = step.number === currentStep;
          return (
            <div key={step.number} className="flex gap-spacing-lg relative">
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'absolute -z-1 left-[11px] top-0 w-0.5 bg-border-gray-secondary',

                    completed && ' bg-bg-brand-solid-primary',
                  )}
                  style={{
                    height: 'calc(100% + 1rem)',
                  }}
                />
              )}
              <div className="flex flex-col items-center">
                {completed ? (
                  <div className="w-6 h-6 shadow-focus-ring-brand rounded-full bg-bg-brand-solid-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : active ? (
                  <div className="w-6 h-6 shadow-focus-ring-brand rounded-full bg-bg-brand-solid-primary flex items-center justify-center shrink-0">
                    <span className="text-label-xs font-label-xs-strong! text-white">
                      {step.number}
                    </span>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-white rounded-full border border-border-gray-secondary flex items-center justify-center shrink-0">
                    <span className=" text-label-xs font-label-xs-strong! text-text-gray-quinary">
                      {step.number}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-0.5">
                <p
                  className={` text-label-sm font-label-sm-strong! ${active ? 'text-text-brand-primary' : 'text-text-gray-secondary'}`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs mt-0.5 leading-snug ${active ? 'text-text-brand-secondary' : 'text-text-gray-tertiary'}`}
                >
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
