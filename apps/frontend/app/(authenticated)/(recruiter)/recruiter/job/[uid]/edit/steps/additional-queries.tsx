'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeClosed, Plus, SquareCheck } from 'lucide-react';
import React, { useState } from 'react';
import { QueryCardComponent } from './query-card-component';
import { QuickAddBar } from './quick-add-bar';
import { InitialQuickAddBar } from './initial-quick-add-bar';
import PreviewQueryCard from './preview-query-card';
import { AdditionalQuery, JobData } from '@/services/jobs/job.type';
import { QUERY_TYPE_ENUMS } from '@rl/types';
import { useUpdateJob } from '@/services/jobs/jobs.client';

export interface QueryOption {
  id: string;
  text: string;
}

export interface QueryCard {
  id: string;
  type: QUERY_TYPE_ENUMS;
  options: QueryOption[];
  question: string;
  isRequired: boolean;
  expectedAnswer?: string;
  focused: boolean;
}

export default function AdditionalQueries({
  prev,
  next,
  defaultValues,
}: {
  next: (data: Partial<JobData>) => void;
  prev: (data: Partial<JobData>) => void;
  defaultValues: JobData;
}) {
  const [cards, setCards] = useState<QueryCard[]>(
    defaultValues?.additionalQueries?.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      isRequired: Boolean(item?.isRequired),
      focused: false,
      options:
        item.options?.map((op) => ({
          id: crypto.randomUUID(),
          text: op,
        })) || [],
    })) || [],
  );
  const [isPreviewModeOn, setIsPreviewModeOn] = useState(false);

  const { updateJob, isPending } = useUpdateJob();

  const addCard = (type: QUERY_TYPE_ENUMS) => {
    const newCard: QueryCard = {
      id: crypto.randomUUID(),
      question: 'Type your Queries',
      type,
      options:
        type === QUERY_TYPE_ENUMS.SINGLE_CHOICE ||
        type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE
          ? [{ id: crypto.randomUUID(), text: 'Option1' }]
          : [],
      isRequired: false,
      focused: true,
      expectedAnswer: '',
    };
    setCards((prev) => [
      ...prev.map((c) => ({ ...c, focused: false })),
      newCard,
    ]);
  };

  const updateCard = (id: string, updates: Partial<QueryCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const duplicateCard = (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const copy: QueryCard = {
      ...card,
      id: crypto.randomUUID(),
      options: card.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
      focused: true,
    };
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const next = [...prev.map((c) => ({ ...c, focused: false }))];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const focusCard = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, focused: c.id === id })));
  };

  const focusedIndex = cards.findIndex((c) => c.focused);
  const hasFocused = focusedIndex !== -1;

  const handlePrev = () => {
    const data: AdditionalQuery[] = cards.map((item) => ({
      question: item.question,
      type: item.type,
      options:
        item.type === QUERY_TYPE_ENUMS.SHORT_ANSWER ||
        item.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE
          ? (item.options?.map((q) => q.text) ?? [])
          : undefined,
      isRequired: item.isRequired ?? false,
      expectedAnswer: item.expectedAnswer ?? '',
    }));
    prev({
      additionalQueries: data,
    } as JobData);
  };

  const onSubmitForm = async () => {
    const payload: AdditionalQuery[] = cards.map((item) => ({
      question: item.question,
      type: item.type,
      options:
        item.type === QUERY_TYPE_ENUMS.SHORT_ANSWER ||
        item.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE
          ? (item.options?.map((q) => q.text) ?? [])
          : undefined,
      isRequired: item.isRequired ?? false,
      expectedAnswer: item.expectedAnswer ?? '',
    }));
    await updateJob({
      id: defaultValues._id,
      data: {
        additionalQueries: payload,
      },
      onSuccessNext: (newData) => next(newData),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Additional Queries
          </h1>
          <p className=" text-label-sm text-text-gray-tertiary">
            Add your value based custom queries here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Boolean(cards.length) && (
            <button
              onClick={() => setIsPreviewModeOn((prev) => !prev)}
              className="w-10 h-10 rounded-lg border border-border-gray-primary bg-bg-gray-soft-primary flex items-center justify-center text-fg-gray-secondary"
            >
              {isPreviewModeOn ? (
                <EyeClosed className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {!isPreviewModeOn && (
            <Button
              onClick={() => addCard(QUERY_TYPE_ENUMS.PARAGRAPH)}
              className=" bg-bg-brand-solid-primary h-10 rounded-lg text-white"
            >
              <Plus className="w-4 h-4" />
              Add Queries
            </Button>
          )}
        </div>
      </div>

      {/* Cards list */}
      {isPreviewModeOn ? (
        <div className="flex-1 overflow-y-auto pr-spacing-2xs space-y-spacing-4xl">
          {cards.map((card, idx) => (
            <PreviewQueryCard key={idx} card={card} />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1  space-y-spacing-4xl">
          {cards.map((card, idx) => (
            <div key={card.id} className=" space-y-spacing-4xl">
              <QueryCardComponent
                card={card}
                onUpdate={updateCard}
                onDuplicate={duplicateCard}
                onDelete={deleteCard}
                onFocus={focusCard}
              />
              {/* Show quick-add bar right below the focused card */}
              {card.focused && (
                <div className=" flex items-center gap-spacing-xs">
                  <div className=" h-px w-full bg-border-gray-tertiary"></div>
                  <div className=" min-w-fit">
                    <QuickAddBar onAdd={addCard} />
                  </div>
                  <div className=" h-px w-full bg-border-gray-tertiary"></div>
                </div>
              )}
            </div>
          ))}

          {/* No cards at all, or no card is focused → show at the end */}
          {Boolean(cards.length) && !hasFocused && (
            <div className=" flex items-center gap-spacing-xs">
              <div className=" h-px w-full bg-border-gray-tertiary"></div>
              <div className=" min-w-fit">
                <QuickAddBar onAdd={addCard} />
              </div>
              <div className=" h-px w-full bg-border-gray-tertiary"></div>
            </div>
          )}
          {cards.length === 0 && <InitialQuickAddBar onAdd={addCard} />}
        </div>
      )}

      {/* Footer nav */}
      <div className="flex py-spacing-2xl justify-end mt-spacing-4xl gap-spacing-sm">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isPending}
          className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={onSubmitForm}
          disabled={isPending}
          className=" cursor-pointer bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
