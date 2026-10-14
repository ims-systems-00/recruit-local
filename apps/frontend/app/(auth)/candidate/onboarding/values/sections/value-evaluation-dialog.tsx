'use client';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { VALUE_ASSESSMENT_QUESTION_COUNT, VALUE_TYPE_ENUM } from '@rl/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useValueAssessment } from '@/services/value/value.client';
import { ValueData } from '@/services/value/value.type';
import { useEvaluateValue } from '@/services/job-profile/job-profile.client';
import {
  valueEvaluationSchema,
  ValueEvaluationFormValues,
} from '@/services/job-profile/job-profile.validation';

const VALUE_TYPE_LABELS: Record<VALUE_TYPE_ENUM, string> = {
  [VALUE_TYPE_ENUM.WORKING_STYLE]: 'Working Style',
  [VALUE_TYPE_ENUM.MINDSET]: 'Mindset',
  [VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR]: 'Culture & Behaviour',
  [VALUE_TYPE_ENUM.LEADERSHIP]: 'Leadership',
  [VALUE_TYPE_ENUM.MOTIVATION]: 'Motivation',
};

/**
 * Asks the value's three questions and sends the answers for scoring.
 *
 * The parent remounts this (new `key`) each time it opens, so every evaluation
 * — including "Start Again" — begins with empty answers.
 */
export default function ValueEvaluationDialog({
  value,
  jobProfileId,
  open,
  onOpenChange,
}: {
  value: ValueData;
  jobProfileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { assessment, isLoading, isError, error } = useValueAssessment(
    value._id,
    open,
  );
  const { evaluateValue, isPending } = useEvaluateValue();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValueEvaluationFormValues>({
    resolver: yupResolver(
      valueEvaluationSchema,
    ) as Resolver<ValueEvaluationFormValues>,
    defaultValues: {
      answers: Array.from(
        { length: VALUE_ASSESSMENT_QUESTION_COUNT },
        () => '',
      ),
    },
  });

  const onSubmit = async (data: ValueEvaluationFormValues) => {
    if (!assessment) return;

    await evaluateValue({
      id: jobProfileId,
      payload: {
        valueId: assessment._id,
        answers: assessment.questions.map((question, index) => ({
          key: question.key,
          answer: data.answers[index] ?? '',
        })),
      },
      onSuccessCallback: () => onOpenChange(false),
    });
  };

  // Scoring is one LLM call; closing mid-way would hide its result.
  const handleOpenChange = (next: boolean) => {
    if (!isPending) onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-bg-gray-soft-primary shadow-xs gap-y-spacing-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-y-spacing-xs text-left">
          <DialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-secondary">
            {value.label}
          </DialogTitle>
          <DialogDescription className="text-body-sm text-text-gray-tertiary">
            Your Preferred {VALUE_TYPE_LABELS[value.type]} Traits
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-spacing-xl">
            <Skeleton className="h-4 w-40 bg-gray-200" />
            {Array.from({ length: VALUE_ASSESSMENT_QUESTION_COUNT }).map(
              (_, index) => (
                <div key={index} className="space-y-spacing-md">
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                </div>
              ),
            )}
          </div>
        ) : isError || !assessment ? (
          <div className="flex items-center justify-center p-spacing-4xl border border-border-gray-secondary rounded-lg">
            <p className="text-label-md font-label-md-strong! text-text-gray-quaternary text-center">
              {error?.message || 'Failed to load the questions'}
            </p>
          </div>
        ) : (
          <form
            id="value-evaluation-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-spacing-xl"
          >
            <p className="text-label-sm font-label-sm-strong! text-text-gray-secondary">
              {assessment.heading}
            </p>
            {assessment.questions.map((question, index) => {
              const fieldId = `value-evaluation-${question.key}`;
              const fieldError = errors.answers?.[index]?.message;

              return (
                <div key={question.key} className="space-y-spacing-md">
                  <Label
                    htmlFor={fieldId}
                    className="text-label-sm font-label-sm-strong! text-text-gray-secondary leading-snug"
                  >
                    <span>
                      {index + 1}. {question.text}{' '}
                      <span className="text-text-error-primary">*</span>
                    </span>
                  </Label>
                  <Textarea
                    id={fieldId}
                    rows={1}
                    placeholder={question.placeholder}
                    disabled={isPending}
                    aria-invalid={!!fieldError}
                    className="min-h-10 rounded-lg border-border-gray-primary bg-white shadow-xs text-body-sm"
                    {...register(`answers.${index}`)}
                  />
                  {fieldError && (
                    <p className="text-label-sm text-text-error-primary">
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </form>
        )}

        <div className="grid grid-cols-2 gap-spacing-2xl">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
            className="text-label-md font-label-md-strong! cursor-pointer border-border-gray-primary h-10 rounded-lg text-text-gray-secondary"
          >
            Answer it later
          </Button>
          <Button
            type="submit"
            form="value-evaluation-form"
            disabled={isPending || isLoading || !assessment}
            className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-10 rounded-lg"
          >
            {isPending ? 'Evaluating...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
