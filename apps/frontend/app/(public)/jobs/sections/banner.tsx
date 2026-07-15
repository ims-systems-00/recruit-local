import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search } from 'lucide-react';
import React from 'react';

export default function Banner() {
  return (
    <section className="bg-bg-brand-solid-alt border-b border-border-gray-secondary">
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-9xl text-white flex flex-col gap-y-spacing-4xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-heading-md">
            {' '}
            <span className=" text-text-brand-secondary">Find</span> your next
            local opportunity{' '}
          </p>
          <p className=" text-body-md text-text-gray-quinary">
            From self‑serve hiring to full HR & recruitment support.
          </p>
        </div>
        <div className=" flex items-center gap-spacing-4xl">
          <InputGroup className=" h-12 rounded-lg shadow-xs border-border-gray-primary bg-bg-gray-soft-primary max-w-[648px]">
            <InputGroupInput
              type="text"
              placeholder="Search By Job Title..."
              className=" text-label-md placeholder:text-text-gray-quaternary text-text-gray-secondary"
            />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
          <button
            type="button"
            className="text-label-md rounded-full font-label-md-strong! flex items-center h-12 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
