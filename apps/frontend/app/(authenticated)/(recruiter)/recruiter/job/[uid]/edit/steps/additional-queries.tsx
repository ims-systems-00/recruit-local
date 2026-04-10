'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, EyeClosed, Plus, SquareCheck } from 'lucide-react';
import React, { useState } from 'react';
import { QueryCardComponent } from './query-card-component';
import { QuickAddBar } from './quick-add-bar';
import { InitialQuickAddBar } from './initial-quick-add-bar';
import PreviewQueryCard from './preview-query-card';

export type QueryType =
  | 'paragraph'
  | 'single-choice'
  | 'multiple-choice'
  | 'short-answer';

export interface QueryOption {
  id: string;
  text: string;
}

export interface QueryCard {
  id: string;
  title: string;
  type: QueryType;
  options: QueryOption[];
  required: boolean;
  focused: boolean;
}

const INITIAL_CARDS: QueryCard[] = [
  {
    id: '1',
    title: '',
    type: 'paragraph',
    options: [],
    required: false,
    focused: false,
  },
  {
    id: '2',
    title: 'Type your Queries',
    type: 'single-choice',
    options: [
      { id: 'o1', text: 'Option1' },
      { id: 'o2', text: 'Option2' },
      { id: 'o3', text: 'Option 3' },
    ],
    required: false,
    focused: true,
  },
  {
    id: '3',
    title: '',
    type: 'short-answer',
    options: [],
    required: false,
    focused: false,
  },
];

export default function AdditionalQueries({
  prev,
  next,
}: {
  prev: (step: number) => void;
  next: (step: number) => void;
}) {
  const [cards, setCards] = useState<QueryCard[]>(INITIAL_CARDS);

  const [isPreviewModeOn, setIsPreviewModeOn] = useState(false);

  const addCard = (type: QueryType) => {
    const newCard: QueryCard = {
      id: crypto.randomUUID(),
      title: '',
      type,
      options:
        type === 'single-choice' || type === 'multiple-choice'
          ? [{ id: crypto.randomUUID(), text: 'Option1' }]
          : [],
      required: false,
      focused: true,
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
              onClick={() => addCard('paragraph')}
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
          onClick={() => prev(2)}
          className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
        >
          Previous
        </Button>
        <Button
          onClick={() => next(4)}
          className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
